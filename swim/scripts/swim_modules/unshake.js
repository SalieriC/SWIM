import { swimConditions } from '../helpers/conditions.js'
/*******************************************
 * Unshake
 * v. 6.0.0 – one window (UnshakeApp) instead of the Spirit roll followed by a Benny dialog.
 * Original code (an eternity ago) by Shteff, altered by Forien, edited and maintained by SalieriC#8263.
 *
 * Everything happens in one window: choose between the Spirit roll and spending a Benny, see the result and – if the roll failed –
 * spend a Benny or use the free reroll (Old Ways Oath) right there. Works for both rule sets (SWADE and SWD, see the setting
 * "Use SWD unshake rules"). Called with an Active Effect (SWADE start-of-turn callback, see init.js) the token comes from the effect.
 * A token that is not Shaken gets Shaken instead (as it always did).
 * Look: styles/unshake.css on top of the building blocks of styles/health-centre.css.
 ******************************************/
const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key))
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => `&#${m.charCodeAt(0)};`)
const UNSHAKE_KEY = "system.attributes.spirit.unShakeBonus"

/**
 * @param {Effect|false} effect  Set when SWADE calls the macro for the Shaken effect (start of the turn).
 * @param {{version?: "SWD"|"SWADE"}} options
 */
export async function unshake_script(effect = false, options = {}) {
    let { speaker, _, __, token } = await swim.get_macro_variables()

    // No Token is Selected
    if ((!token || canvas.tokens.controlled.length > 1) && !effect) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
        return;
    } else if (effect) {
        const actor = effect.parent
        const doc = actor.isToken ? actor.token : canvas.scene.tokens.find(tk => tk.actor?.id === actor.id)
        token = doc?.object ?? doc
        if (!token) { return ui.notifications.error(game.i18n.localize("SWIM.notification.generalErrorMsg")) }
        const nameKey = game.user.character?.id === actor.id ? `${game.i18n.localize("SWIM.word-you")} ${game.i18n.localize("SWIM.word-are")}` : `${token.name} ${game.i18n.localize("SWIM.word-is")}`
        ui.notifications.notify(game.i18n.format("SWIM.notification-shakenRoll", { tokenName: nameKey }));
    }

    if (await swimConditions.has('shaken', token) === true) {
        await UnshakeApp.open(token, effect ? token.name : (speaker?.alias ?? token.name), options?.version === "SWD" ? "SWD" : "SWADE")
    } else {
        await swim.shake(token)
    }
}

/* ------------------------------------------------------------------------------------------------ */
/* Rules helpers                                                                                    */
/* ------------------------------------------------------------------------------------------------ */

/**
 * The bonuses on the Spirit roll to recover from Shaken: Edges/abilities (+2 each: Combat Reflexes and the like), Active Effects on
 * `unShakeBonus` and whatever generic bonus is left over after them. An Active Effect named like an Edge the actor has is not counted
 * a second time (the Edge already gives the +2).
 * @returns {{total: number, lines: string[]}}  `lines` are HTML snippets (icon + name), already escaped.
 */
export function unshake_bonuses(actor) {
    const lower = (key) => game.i18n.localize(key).toLowerCase()
    const edgeNames = [
        lower("SWIM.edge-combatReflexes"),
        lower("SWIM.ability-demon-hellfrost"),
        lower("SWIM.ability-construct"),
        lower("SWIM.ability-undead"),
        lower("SWIM.ability-amorphous-theAfter"),
    ]
    // 'undead' is looked for literally unless the actor has a disabled Active Effect of that name (as before):
    const undeadAE = actor.effects.find((ae) => ae.name.toLowerCase() === lower("SWIM.ability-undead"))
    if (!undeadAE || undeadAE.disabled === false) { edgeNames.push('undead') }

    const signed = (n) => `${n < 0 ? '-' : '+'} ${Math.abs(n)}`
    const img = (src) => (src ? `<img src="${esc(src)}" alt="" width="15" height="15" style="border:0" />` : '')
    const edges = actor.items.filter((i) => edgeNames.includes(i.name.toLowerCase()) && (i.type === "edge" || i.type === "ability"))
    const edgeOwned = new Set(edges.map((i) => i.name.toLowerCase()))

    let total = 0
    let fromEffects = 0
    const lines = []
    for (const effect of actor.effects) {
        if (effect.disabled) { continue } // only enabled effects
        for (const change of effect.changes) {
            if (change.key !== UNSHAKE_KEY) { continue }
            const value = parseFloat(change.value)
            if (!Number.isFinite(value)) { continue }
            fromEffects += value
            if (edgeOwned.has(effect.name.toLowerCase())) { continue } // the Edge below already counts
            total += value
            lines.push(`${signed(value)} ${img(effect.icon ?? effect.img)}${esc(effect.name)}`)
        }
    }
    for (const edge of edges) {
        total += 2
        lines.push(`+ 2 ${img(edge.img)}${esc(edge.name)}`)
    }
    const rest = (Number(actor.system.attributes.spirit.unShakeBonus) || 0) - fromEffects
    if (Math.abs(rest) > 1e-9) {
        total += rest
        lines.push(`${signed(rest)} ${esc(t('SWIM.unshake.genericBonus'))}`)
    }
    return { total, lines }
}

/**
 * What a Spirit roll (total incl. bonuses) achieves.
 *  'success' – no longer Shaken and may act;
 *  'mid'     – (SWD only, 4-7) no longer Shaken, but can't act this turn;
 *  'fail'    – still Shaken.
 */
export function unshake_outcome(total, version) {
    if (version === "SWD") {
        if (total >= 8) { return 'success' }
        return total > 3 ? 'mid' : 'fail'
    }
    return total >= 4 ? 'success' : 'fail'
}

function condition_name(id) {
    const effect = CONFIG.statusEffects?.find((e) => e.id === id)
    const name = effect?.name ?? effect?.label
    return name ? game.i18n.localize(name) : id
}

/* ------------------------------------------------------------------------------------------------ */
/* The window                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

class UnshakeApp extends Application {
    #token
    #alias
    #version
    #state
    #hooks = []
    #refresh
    #done = false
    #busy = false
    static #current = null

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'swim-unshake',
            classes: ['swim-hc-app', 'swim-us-app'],
            width: 470,
            height: 'auto',
            resizable: false,
        })
    }

    get title() { return t('SWIM.unshake.title') }

    /** Opens the window (only one at a time). */
    static async open(token, alias, version) {
        await UnshakeApp.#current?.close()
        const app = new UnshakeApp(token, alias, version)
        UnshakeApp.#current = app
        app.render(true)
    }

    constructor(token, alias, version) {
        super()
        this.#token = token
        this.#alias = alias
        this.#version = version
        // Old Ways Oath: one free reroll.
        const oath = token.actor.items.find((e) => e.type === "hindrance" && e.name.toLowerCase() === t("SWIM.hindrance-oldWaysOath-deadlands").toLowerCase())
        this.#state = { phase: 'choose', method: null, freeRerolls: oath ? 1 : 0, roll: null }
        this.#refresh = foundry.utils.debounce(async () => {
            if (!this.rendered || this.#busy || this.#done) { return }
            // Shaken was removed by someone else while we are still choosing: nothing left to do.
            if (this.#state.phase === 'choose' && !(await swimConditions.has('shaken', this.#token))) { return this.close() }
            this.render(false)
        }, 150)
        for (const name of ['updateActor', 'createActiveEffect', 'deleteActiveEffect', 'updateItem']) {
            this.#hooks.push([name, Hooks.on(name, () => this.#refresh())])
        }
    }

    /* -------------------------------- data -------------------------------- */

    async #snapshot() {
        const token = this.#token
        const actor = token.actor
        const cond = {}
        for (const id of ['shaken', 'stunned', 'incapacitated', 'bleeding-out']) { cond[id] = !!(await swimConditions.has(id, token)) }
        const { totalBennies } = await swim.check_bennies(token, false)
        const spirit = actor.system.attributes?.spirit
        const snap = {
            token, actor, name: token.name, img: (token.document ?? token).texture.src,
            bennies: totalBennies, cond,
            die: spirit ? `d${spirit.die.sides}${spirit.die.modifier ? (spirit.die.modifier > 0 ? '+' : '') + spirit.die.modifier : ''}` : '–',
            bonus: unshake_bonuses(actor),
        }
        const st = this.#state
        if (!st.method || (st.method === 'benny' && snap.bennies < 1)) { st.method = 'roll' }
        return snap
    }

    /* ------------------------------- rendering ------------------------------ */

    #header(snap) {
        const chips = [['shaken', false], ['stunned', false], ['incapacitated', true], ['bleeding-out', true]]
            .filter(([id]) => snap.cond[id]).map(([id, bad]) => `<span class="swim-hc-chip ${bad ? 'is-bad' : ''}">${esc(condition_name(id))}</span>`).join('')
        const block = (label, value) => `<div class="swim-hc-track swim-us-static"><h5><span>${esc(label)}</span></h5><div class="swim-hc-num">${esc(value)}</div></div>`
        const bonus = snap.bonus.total > 0 ? `+${snap.bonus.total}` : String(snap.bonus.total)
        return `<div class="swim-hc-who"><div class="swim-hc-seg is-on swim-us-static"><img src="${esc(snap.img)}" alt=""><span><small>${esc(t('SWIM.unshake.title'))}</small><b>${esc(snap.name)}</b></span></div></div>
          <div class="swim-hc-patient"><div class="swim-hc-chips">${chips}</div><div class="swim-hc-tracks">
            ${block(t('SWIM.unshake.spirit'), snap.die)}
            ${block(t('SWIM.unshake.bonus'), bonus)}
            ${block(t('SWIM.healthCentre.bennies'), snap.bennies)}
          </div></div>`
    }

    #card(id, icon, title, hint, { on, off }) {
        return `<div class="swim-hc-method ${on ? 'is-on' : ''} ${off ? 'is-off' : ''}" ${off ? 'aria-disabled="true"' : `data-action="method" data-method="${id}" tabindex="0" role="radio" aria-checked="${on}"`}>
          <span class="swim-hc-ico"><i class="${icon}"></i></span>
          <span class="swim-hc-mbody"><b>${esc(title)}</b><small>${esc(hint)}</small></span></div>`
    }

    #btn(action, label, { go = false, disabled = false } = {}) {
        return `<button type="button" class="swim-hc-btn ${go ? 'is-go' : ''}" data-action="${action}" ${disabled ? 'disabled' : ''}>${esc(label)}</button>`
    }

    #chooseView(snap) {
        const st = this.#state
        const roll = this.#card('roll', 'fas fa-dice-d20', t('SWIM.unshake.rollName'), t(this.#version === "SWD" ? 'SWIM.unshake.rollHintSwd' : 'SWIM.unshake.rollHint'), { on: st.method === 'roll' })
        const benny = this.#card('benny', 'fas fa-coins', t('SWIM.unshake.bennyName'), snap.bennies < 1 ? t('SWIM.unshake.noBennies') : t('SWIM.unshake.bennyHint'), { on: st.method === 'benny', off: snap.bennies < 1 })
        const preview = st.method === 'roll'
            ? `${esc(t(snap.bonus.lines.length ? 'SWIM.unshake.previewBonus' : 'SWIM.unshake.previewNoBonus'))}${snap.bonus.lines.length ? `<div class="swim-us-lines">${snap.bonus.lines.join('<br/>')}</div>` : ''}`
            : esc(t('SWIM.unshake.previewBenny'))
        return {
            body: `<div class="swim-hc-lab">${esc(t('SWIM.soak.whatDo'))}</div>${roll}${benny}<div class="swim-hc-preview">${preview}</div>`,
            foot: `<span class="swim-hc-spacer"></span>${this.#btn('cancel', t('SWIM.picker.cancel'))}${this.#btn('confirm', t(st.method === 'roll' ? 'SWIM.unshake.rollBtn' : 'SWIM.unshake.bennyBtn'), { go: true })}`,
        }
    }

    #resultView(snap) {
        const st = this.#state
        const r = st.roll
        let top
        if (r.crit) {
            top = `<div class="swim-hc-big is-bad">${esc(t('SWIM.gameTerm-CritFail'))}</div><p>${esc(t('SWIM.unshake.critText'))}</p>`
        } else {
            const text = r.outcome === 'mid' ? t('SWIM.unshake.midText') : t(this.#version === "SWD" ? 'SWIM.unshake.remainTextSwd' : 'SWIM.unshake.remainText')
            top = `<div class="swim-hc-big ${r.outcome === 'fail' ? 'is-bad' : ''}">${r.total}</div>${r.lines.length ? `<p class="swim-us-lines">${r.lines.join('<br/>')}</p>` : ''}<p>${esc(text)}</p>`
        }
        const canAct = !r.crit && snap.bennies > 0
        const canReroll = !r.crit && r.outcome === 'fail' && st.freeRerolls > 0
        return {
            body: `<div class="swim-hc-result">${top}${canReroll ? `<p>${esc(t('SWIM.unshake.freeRerollLeft'))}</p>` : ''}</div>`,
            foot: `<small>${esc(t('SWIM.healthCentre.benniesLeft', { count: snap.bennies }))}</small><span class="swim-hc-spacer"></span>` +
                `${canReroll ? this.#btn('freeReroll', t('SWIM.button-freeReroll')) : ''}` +
                `${canAct ? this.#btn('bennyAct', t('SWIM.unshake.bennyActBtn', { count: snap.bennies })) : ''}` +
                `${this.#btn('cancel', t('SWIM.healthCentre.close'), { go: !canAct && !canReroll })}`,
        }
    }

    async _renderInner() {
        const snap = await this.#snapshot()
        const view = this.#state.phase === 'result' ? this.#resultView(snap) : this.#chooseView(snap)
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
            case 'confirm': return st.method === 'benny' ? this.#spendBenny() : this.#roll(false)
            case 'freeReroll': return this.#roll(true)
            case 'bennyAct': return this.#spendBenny()
            default: return
        }
        this.render(false)
    }

    async #finish() {
        this.#done = true
        await this.close()
    }

    /** The result as a chat message: "<name> rolled <total>" + what it means + the bonuses. */
    #chat(total, outcome, lines) {
        const key = outcome === 'success' ? 'SWIM.chatMessage-unshakeResultNoShakenCanAct'
            : outcome === 'mid' ? 'SWIM.chatMessage-unshakeResultNoShakenCannotAct'
                : this.#version === "SWD" ? 'SWIM.chatMessage-unshakeResultStillShaken' : 'SWIM.chatMessage-unshakeResultRemainShaken'
        return t("SWIM.chatMessage-unshakeResultRoll", { name: this.#alias, rollWithEdge: total }) + t(key) + ` ${lines.map((l) => `<br/><i>${l}</i>`).join('')}`
    }

    /* ------------------------------ Spirit roll ------------------------------ */

    async #roll(isFree) {
        const st = this.#state
        const token = this.#token
        const actor = token.actor
        if (isFree && st.freeRerolls < 1) { return }

        this.#busy = true
        try {
            const r = await actor.rollAttribute('spirit')
            if (!r) { return } // the roll dialog was cancelled: nothing happened
            if (isFree) { st.freeRerolls -= 1 }
            const bonus = unshake_bonuses(actor)
            const total = r.total + bonus.total

            // Checking for a Critical Failure.
            const wildCard = !(actor.system.wildcard === false && actor.type === "npc")
            if (await swim.critFail_check(wildCard, r) === true) {
                ui.notifications.notify(t("SWIM.notification-critFail"))
                await ChatMessage.create({ content: t("SWIM.chatMessage-unshakeResultCritFail", { name: this.#alias }) })
                st.roll = { crit: true, total, lines: bonus.lines, outcome: 'fail' }
                st.phase = 'result'
                return
            }
            const outcome = unshake_outcome(total, this.#version)
            if (outcome !== 'fail' && await swimConditions.has('shaken', token) === true) { await swimConditions.remove('shaken', token) }
            await ChatMessage.create({ content: this.#chat(total, outcome, bonus.lines) })
            if (outcome === 'success') { return await this.#finish() }
            st.roll = { crit: false, total, lines: bonus.lines, outcome }
            st.phase = 'result'
        } finally {
            this.#busy = false
            if (!this.#done) { this.render(false) }
        }
    }

    /* ---------------------------------- Benny -------------------------------- */

    async #spendBenny() {
        const token = this.#token
        const snap = await this.#snapshot()
        if (snap.bennies < 1) { return ui.notifications.warn(t('SWIM.notification-noBenniesLeft')) }
        this.#busy = true
        try {
            await swim.spend_benny(token)
            // Chat Message to let everyone know a Benny was spent
            await ChatMessage.create({
                user: game.user.id,
                content: t("SWIM.dialogue-spentBennyToUnshake", { bennyImage: await swim.get_benny_image(), player: game.user.name, name: token.name }),
            })
            if (await swimConditions.has('shaken', token) === true) { await swimConditions.remove('shaken', token) }
        } finally {
            this.#busy = false
        }
        return this.#finish()
    }

    async close(options) {
        for (const [name, id] of this.#hooks) { Hooks.off(name, id) }
        this.#hooks = []
        this.#done = true
        if (UnshakeApp.#current === this) { UnshakeApp.#current = null }
        return super.close(options)
    }
}
