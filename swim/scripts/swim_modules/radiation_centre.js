import { swimConditions } from '../helpers/conditions.js'
/*******************************************
 * Radiation Centre
 * v. 4.0.0 – one window (RadiationApp) instead of the main dialog followed by reroll dialogs.
 * By SalieriC#8263.
 *
 * Everything happens in one window: roll Vigor to resist Radiation (with the Rad Resistance of the actor) or take the Level of
 * Fatigue right away; after a failed roll the free reroll (Soldier) or a reroll with a Benny (Elan +2) is offered in the same window.
 * Look: styles/unshake.css (shared `.swim-us*` classes) on top of styles/health-centre.css.
 ******************************************/
const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key))
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => `&#${m.charCodeAt(0)};`)

export async function radiation_centre_script() {
    const { speaker, _, __, token } = await swim.get_macro_variables()
    // Checking if exactly one token is selected.
    if (!token || canvas.tokens.controlled.length > 1) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
        return;
    }
    await RadiationApp.open(token, speaker?.alias ?? token.name)
}

/* ------------------------------------------------------------------------------------------------ */
/* Rules helpers                                                                                    */
/* ------------------------------------------------------------------------------------------------ */

/** Rad Resistance of the actor (SWIM config, Active Effects included) – a signed number, 0 if unset. */
export function rad_resistance(actor) {
    return Number(actor.flags?.swim?.config?.radRes) || 0
}

/** Bonuses on the Vigor roll: the Rad Resistance and Elan on rerolls. `lines` are HTML snippets, already escaped. */
export function radiation_bonuses(actor, { elan = false } = {}) {
    let total = 0
    const lines = []
    const radRes = rad_resistance(actor)
    if (radRes !== 0) {
        total += radRes
        lines.push(`${radRes < 0 ? '-' : '+'} ${Math.abs(radRes)} ${esc(t('SWIM.radiation.radRes'))}`)
    }
    if (elan) {
        total += 2
        lines.push(`+ 2 ${esc(t('SWIM.edge-elan'))}`)
    }
    return { total, lines }
}

/** Every full 4 points of the roll resist; below 1 the character takes a Level of Fatigue. Never negative. */
export function radiation_raises(total) {
    return Math.max(0, Math.floor(total / 4))
}

/** The chronic disease for a character that was Incapacitated by Radiation (once). */
async function apply_disease_effect(actor) {
    const radPoisoningEffect = actor.effects.find(e => e.flags.swim?.isDisease && e.flags.swim?.diseaseData?.isRadPoisoning)
    if (radPoisoningEffect) {
        console.log("SWIM | Actor already got Radiation Poisoning, no effect applied.")
        return
    }
    const effectData = {
        "name": `${game.i18n.localize("SWIM.disease-chronic")}: ${game.i18n.localize("SWIM.disease-radPoisoning")}`, // v11: `name`, not `label`
        "_id": foundry.utils.randomID(16),
        "changes": [],
        "disabled": false,
        "duration": {
            "startTime": game.time.worldTime,
            "seconds": null,
            "combat": null,
            "rounds": null,
            "turns": null,
            "startRound": null,
            "startTurn": null
        },
        "icon": "modules/succ/assets/icons/0-irradiated.svg", // v11: `icon`, not `img`
        "origin": null,
        "tint": null,
        "transfer": false,
        "flags": {
            "swade": {
                "expiration": null,
                "loseTurnOnHold": false
            },
            "swim": {
                isDisease: true,
                diseaseData: {
                    isChronic: true,
                    isRadPoisoning: true,
                    name: "Radiation Poisoning"
                }
            }
        }
    }
    await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
    ui.notifications.warn(game.i18n.localize("SWIM.notification.diseaseWarning"))
    //Chat Message to let the everyone know what happened:
    let diseaseLink = await swim.get_official_journal_link('disease_categories')
    if (diseaseLink) { diseaseLink += `{${game.i18n.localize("SWIM.disease-chronic").toLowerCase()}}` }
    else { diseaseLink = game.i18n.localize("SWIM.disease-chronic").toLowerCase() }
    ChatMessage.create({
        user: game.user.id,
        content: `${game.i18n.format(game.i18n.format("SWIM.chatMessage-radPoisoning-1", {
            actorName: actor.name,
            class: 'swade-core',
            img: 'modules/succ/assets/icons/0-irradiated.svg'
        }))} ${diseaseLink}.
            ${game.i18n.format(game.i18n.format("SWIM.chatMessage-radPoisoning-2", {
            actorName: actor.name,
        }))}`,
    });
    //UUID links don't fit into the game.i18n.format as the {label} is interpreted as a variable, so the chat message needs to be split in multiple parts. -.-
}

/* ------------------------------------------------------------------------------------------------ */
/* The window                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

class RadiationApp extends Application {
    #token
    #alias
    #state
    #hooks = []
    #refresh
    #done = false
    #busy = false
    #hazard = ''
    static #current = null

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'swim-radiation-centre',
            classes: ['swim-hc-app', 'swim-us-app'],
            width: 470,
            height: 'auto',
            resizable: false,
        })
    }

    get title() { return t('SWIM.radiation.title') }

    /** Opens the window (only one at a time) and plays the Geiger counter for the user who opened it. */
    static async open(token, alias) {
        await RadiationApp.#current?.close()
        const app = new RadiationApp(token, alias)
        RadiationApp.#current = app
        let link = await swim.get_official_journal_link("radiation")
        link = link ? `${link}{${t("SWIM.hazard-radiation")}}` : t("SWIM.hazard-radiation")
        app.#hazard = link
        const geigerSFX = game.settings.get('swim', 'geigerSFX')
        if (geigerSFX) { swim.play_sfx(geigerSFX, undefined, false) } // only for the player who opened the window
        app.render(true)
    }

    constructor(token, alias) {
        super()
        this.#token = token
        this.#alias = alias
        // Soldier: one free reroll. Elan applies from the first Benny reroll on.
        const soldier = token.actor.items.find((i) => i.type === "edge" && i.name.toLowerCase() === t("SWIM.edge-soldier").toLowerCase())
        this.#state = { phase: 'choose', method: 'roll', freeReroll: !!soldier, elan: false, roll: null }
        this.#refresh = foundry.utils.debounce(() => { if (this.rendered && !this.#busy && !this.#done) this.render(false) }, 150)
        for (const name of ['updateActor', 'createActiveEffect', 'deleteActiveEffect', 'updateItem']) {
            this.#hooks.push([name, Hooks.on(name, () => this.#refresh())])
        }
    }

    /* -------------------------------- data -------------------------------- */

    async #snapshot() {
        const token = this.#token
        const actor = token.actor
        const { totalBennies } = await swim.check_bennies(token, false)
        const elan = actor.items.find((i) => i.type === 'edge' && i.name.toLowerCase() === t("SWIM.edge-elan").toLowerCase())
        return {
            token, actor, name: token.name, img: (token.document ?? token).texture.src,
            fatigue: actor.system.fatigue.value, max: actor.system.fatigue.max,
            bennies: totalBennies, elan, radRes: rad_resistance(actor),
            bonus: radiation_bonuses(actor, { elan: this.#state.elan }),
        }
    }

    /* ------------------------------- rendering ------------------------------ */

    #pips(value, max) {
        if (max > 8) { return `<div class="swim-hc-num">${value}</div>` }
        return `<div class="swim-hc-pips f">${Array.from({ length: max }, (_, i) => `<span class="swim-hc-pip ${i < value ? 'is-full' : ''}"></span>`).join('')}</div>`
    }

    #header(snap) {
        const block = (label, value, extra = '') => `<div class="swim-hc-track swim-us-static"><h5><span>${esc(label)}</span><span>${extra}</span></h5>${value}</div>`
        const res = snap.radRes > 0 ? `+${snap.radRes}` : String(snap.radRes)
        return `<div class="swim-hc-who"><div class="swim-hc-seg is-on swim-us-static"><img src="${esc(snap.img)}" alt=""><span><small>${esc(t('SWIM.radiation.title'))}</small><b>${esc(snap.name)}</b></span></div></div>
          <div class="swim-hc-patient"><div class="swim-hc-tracks">
            ${block(t('SWIM.healthCentre.fatigue'), this.#pips(snap.fatigue, snap.max), `${snap.fatigue}/${snap.max}`)}
            ${block(t('SWIM.radiation.radResShort'), `<div class="swim-hc-num">${esc(res)}</div>`)}
            ${block(t('SWIM.healthCentre.bennies'), `<div class="swim-hc-num">${snap.bennies}</div>`)}
          </div></div>`
    }

    #card(id, icon, title, hint, on) {
        return `<div class="swim-hc-method ${on ? 'is-on' : ''}" data-action="method" data-method="${id}" tabindex="0" role="radio" aria-checked="${on}">
          <span class="swim-hc-ico"><i class="${icon}"></i></span>
          <span class="swim-hc-mbody"><b>${esc(title)}</b><small>${esc(hint)}</small></span></div>`
    }

    #btn(action, label, { go = false } = {}) {
        return `<button type="button" class="swim-hc-btn ${go ? 'is-go' : ''}" data-action="${action}">${esc(label)}</button>`
    }

    /** What taking the Level of Fatigue does. */
    #applyNote(snap) {
        return snap.fatigue + 1 <= snap.max
            ? t('SWIM.radiation.previewApply', { from: snap.fatigue, to: snap.fatigue + 1 })
            : t('SWIM.radiation.previewApplyOver', { name: snap.name })
    }

    async #chooseView(snap) {
        const st = this.#state
        const source = t("SWIM.hazard-radiation")
        const intro = await TextEditor.enrichHTML(`<p><i class="fas fa-radiation"></i> ${t('SWIM.radiation.intro', { hazard: this.#hazard })}</p>`, { async: true })
        const roll = this.#card('roll', 'fas fa-dice-d20', t('SWIM.dialogue-rollToResistSource', { source }), t('SWIM.radiation.rollHint'), st.method === 'roll')
        const apply = this.#card('apply', 'fas fa-radiation', t('SWIM.dialogue-applyFatigue'), t('SWIM.radiation.applyHint'), st.method === 'apply')
        const lines = snap.bonus.lines
        const preview = st.method === 'roll'
            ? `${esc(t(lines.length ? 'SWIM.unshake.previewBonus' : 'SWIM.unshake.previewNoBonus'))}${lines.length ? `<div class="swim-us-lines">${lines.join('<br/>')}</div>` : ''}`
            : esc(this.#applyNote(snap))
        return {
            body: `<div class="swim-hc-result">${intro}</div>${roll}${apply}<div class="swim-hc-preview">${preview}</div>`,
            foot: `<span class="swim-hc-spacer"></span>${this.#btn('cancel', t('SWIM.picker.cancel'))}${this.#btn('confirm', t(st.method === 'roll' ? 'SWIM.radiation.rollBtn' : 'SWIM.dialogue-applyFatigue'), { go: true })}`,
        }
    }

    #resultView(snap) {
        const st = this.#state
        const r = st.roll
        const free = st.freeReroll
        const canBenny = !free && snap.bennies > 0
        return {
            body: `<div class="swim-hc-result"><div class="swim-hc-big is-bad">${r.total}</div>${r.lines.length ? `<p class="swim-us-lines">${r.lines.join('<br/>')}</p>` : ''}` +
                `<p>${esc(t('SWIM.radiation.failText', { name: snap.name }))}</p><p>${esc(this.#applyNote(snap))}</p>` +
                `${free ? `<p>${esc(t('SWIM.radiation.freeRerollLeft'))}</p>` : canBenny && snap.elan ? `<p>${esc(t('SWIM.soak.elanReroll'))}</p>` : ''}</div>`,
            foot: `<small>${esc(t('SWIM.healthCentre.benniesLeft', { count: snap.bennies }))}</small><span class="swim-hc-spacer"></span>` +
                `${free ? this.#btn('freeReroll', t('SWIM.button-freeReroll')) : ''}${canBenny ? this.#btn('reroll', t('SWIM.healthCentre.reroll', { count: snap.bennies })) : ''}` +
                `${this.#btn('take', t('SWIM.radiation.takeFatigue'), { go: !free && !canBenny })}`,
        }
    }

    async _renderInner() {
        const snap = await this.#snapshot()
        const view = this.#state.phase === 'result' ? this.#resultView(snap) : await this.#chooseView(snap)
        return $(`<div class="swim-hc swim-us">${this.#header(snap)}<div class="swim-hc-body">${view.body}</div><footer class="swim-hc-foot">${view.foot}</footer></div>`)
    }

    /* ------------------------------- interaction ----------------------------- */

    activateListeners(html) {
        super.activateListeners(html)
        html.on('click', '[data-action]', (ev) => {
            if (ev.target.closest('select, option, input, label')) { return }
            this.#onAction(ev)
        })
        html.on('keydown', '[data-action]', (ev) => {
            if ((ev.key === 'Enter' || ev.key === ' ') && ev.currentTarget.tagName !== 'BUTTON' && ev.target === ev.currentTarget) {
                ev.preventDefault()
                this.#onAction(ev)
            }
        })
    }

    async #onAction(ev) {
        const el = ev.currentTarget
        const st = this.#state
        if (this.#busy || el.disabled) { return }
        switch (el.dataset.action) {
            case 'method': if (st.method === el.dataset.method) { return } st.method = el.dataset.method; break
            case 'cancel': return this.close()
            case 'confirm': return st.method === 'apply' ? this.#applyFatigue() : this.#roll(false)
            case 'freeReroll': return this.#roll('free')
            case 'reroll': return this.#roll('benny')
            case 'take': return this.#applyFatigue(true)
            default: return
        }
        this.render(false)
    }

    async #finish() {
        this.#done = true
        await this.close()
    }

    /* ------------------------------ Fatigue --------------------------------- */

    /** One Level of Fatigue. Beyond the maximum: maximum Fatigue, Incapacitated (NPCs and vehicles: dead) and Radiation Poisoning. */
    async #applyFatigue(notify = false) {
        const token = this.#token
        const actor = token.actor
        this.#busy = true
        try {
            if (notify) { ui.notifications.notify(t("SWIM.notification-applyFatigue")) }
            const value = actor.system.fatigue.value
            const max = actor.system.fatigue.max
            if (value + 1 <= max) {
                await actor.update({ "system.fatigue.value": value + 1 })
            } else {
                await actor.update({ "system.fatigue.value": max })
                const id = actor.type === 'character' ? 'incapacitated' : 'dead'
                if (await swimConditions.has(id, token) !== true) { await swimConditions.add(id, token, { forceOverlay: true }) }
                await apply_disease_effect(actor)
            }
        } finally {
            this.#busy = false
        }
        return this.#finish()
    }

    /* ------------------------------ Vigor roll ------------------------------ */

    /** @param {false|'free'|'benny'} reroll  A Benny is spent after the roll was actually made (a cancelled roll costs nothing). */
    async #roll(reroll) {
        const st = this.#state
        const token = this.#token
        const actor = token.actor
        const snap = await this.#snapshot()
        if (reroll === 'benny' && snap.bennies < 1) { return ui.notifications.warn(t('SWIM.notification-noBenniesLeft')) }
        if (reroll === 'free' && !st.freeReroll) { return }

        this.#busy = true
        try {
            const r = await actor.rollAttribute('vigor')
            if (!r) { return } // the roll dialog was cancelled: nothing happened, nothing is spent
            if (reroll === 'free') { st.freeReroll = false }
            if (reroll === 'benny') {
                await swim.spend_benny(token, true)
                if (snap.elan) { st.elan = true }
            }
            const bonus = radiation_bonuses(actor, { elan: st.elan })
            const total = r.total + bonus.total
            const raises = radiation_raises(total)
            const rolled = t("SWIM.chatMessage-unshakeResultRoll", { name: this.#alias, rollWithEdge: total })
            const source = t("SWIM.hazard-radiation").toLowerCase()
            const lines = bonus.lines.map((l) => `<br/><i>${l}</i>`).join('')

            // Checking for a Critical Failure: the Fatigue is taken at once.
            const wildCard = !(actor.system.wildcard === false && actor.type === "npc")
            if (await swim.critFail_check(wildCard, r) === true) {
                ui.notifications.notify(t("SWIM.notification-critFailApplyFatigue"))
                await ChatMessage.create({ content: t("SWIM.chatMessage-unshakeResultCritFail", { name: this.#alias }) })
                return await this.#applyFatigue()
            }
            if (raises >= 1) {
                await ChatMessage.create({ content: `${rolled} ${t("SWIM.chatMessage-takesNoFatigueFromSource", { source })} ${lines}` })
                return await this.#finish()
            }
            await ChatMessage.create({ content: `${rolled} ${t("SWIM.chatMessage-wouldTakeFatigueFromSource", { source })} ${lines}` })
            // Failed: is there a way to reroll? If not, the Fatigue is applied at once (as before).
            const { totalBennies } = await swim.check_bennies(token, false)
            if (!st.freeReroll && totalBennies < 1) {
                ui.notifications.notify(t("SWIM.dialogue-outOfBenniesApplyFatigue"))
                return await this.#applyFatigue()
            }
            st.roll = { total, lines: bonus.lines }
            st.phase = 'result'
        } finally {
            this.#busy = false
            if (!this.#done) { this.render(false) }
        }
    }

    async close(options) {
        for (const [name, id] of this.#hooks) { Hooks.off(name, id) }
        this.#hooks = []
        this.#done = true
        if (RadiationApp.#current === this) { RadiationApp.#current = null }
        return super.close(options)
    }
}
