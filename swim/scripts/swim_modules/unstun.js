import { swimConditions } from '../helpers/conditions.js'
/*******************************************
 * Unstun
 * v. 5.0.0 – one window (UnstunApp) instead of the Vigor roll followed by a Benny dialog.
 * Made and maintained by SalieriC#8263 using original Code from Shteff.
 *
 * Everything happens in one window: the Vigor roll (with the bonuses listed beforehand), the result and "Reroll with Benny"
 * (Elan gives +2 on rerolls). Called with an Active Effect (SWADE start-of-turn callback, see init.js) the token comes from the effect.
 * A token that is not Stunned gets Stunned instead (as it always did).
 * Look: the same as the Unshake window (styles/unshake.css on top of styles/health-centre.css).
 ******************************************/
const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key))
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => `&#${m.charCodeAt(0)};`)
const UNSTUN_KEY = "system.attributes.vigor.unStunBonus"
const LEGACY_KEY = "SWIM.unStunMod" // old Active Effect key, still honoured
const RANK = { fail: 0, mid: 1, success: 2 }

export async function unstun_script(effect = false) {
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
        ui.notifications.notify(game.i18n.format("SWIM.notification-stunnedRoll", { tokenName: nameKey }));
    }

    if (await swimConditions.has('stunned', token) === true) {
        await UnstunApp.open(token, effect ? token.name : (speaker?.alias ?? token.name))
    } else {
        await swim.stun(token)
    }
}

/* ------------------------------------------------------------------------------------------------ */
/* Rules helpers                                                                                    */
/* ------------------------------------------------------------------------------------------------ */

/**
 * The bonuses on the Vigor roll to recover from Stunned: Combat Reflexes (+2), Active Effects on `unStunBonus` (and the legacy key
 * `SWIM.unStunMod`), the generic bonus left over after them, Elan on rerolls (+2). An Active Effect named like an Edge the actor
 * has is not counted a second time.
 * @returns {{total: number, lines: string[]}}  `lines` are HTML snippets, already escaped.
 */
export function unstun_bonuses(actor, { elan = false } = {}) {
    const edgeNames = [game.i18n.localize("SWIM.edge-combatReflexes").toLowerCase()]
    const signed = (n) => `${n < 0 ? '-' : '+'} ${Math.abs(n)}`
    const img = (src) => (src ? `<img src="${esc(src)}" alt="" width="15" height="15" style="border:0" />` : '')
    const edges = actor.items.filter((i) => edgeNames.includes(i.name.toLowerCase()) && (i.type === "edge" || i.type === "ability"))
    const edgeOwned = new Set(edges.map((i) => i.name.toLowerCase()))

    let total = 0
    let fromEffects = 0 // only what ends up in `unStunBonus` (the legacy key does not)
    const lines = []
    for (const effect of actor.effects) {
        if (effect.disabled) { continue } // only enabled effects
        for (const change of effect.changes) {
            if (change.key !== UNSTUN_KEY && change.key !== LEGACY_KEY) { continue }
            const value = parseFloat(change.value)
            if (!Number.isFinite(value)) { continue }
            if (change.key === UNSTUN_KEY) { fromEffects += value }
            if (edgeOwned.has(effect.name.toLowerCase())) { continue } // the Edge below already counts
            total += value
            lines.push(`${signed(value)} ${img(effect.icon ?? effect.img)}${esc(effect.name)}`)
        }
    }
    for (const edge of edges) {
        total += 2
        lines.push(`+ 2 ${img(edge.img)}${esc(edge.name)}`)
    }
    const rest = (Number(actor.system.attributes.vigor.unStunBonus) || 0) - fromEffects
    if (Math.abs(rest) > 1e-9) {
        total += rest
        lines.push(`${signed(rest)} ${esc(t('SWIM.unshake.genericBonus'))}`)
    }
    if (elan) {
        total += 2
        lines.push(`+ 2 ${esc(t("SWIM.edge-elan"))}`)
    }
    return { total, lines }
}

/** 'success' (8+): no longer Stunned, Distracted removed; 'mid' (4-7): no longer Stunned but Vulnerable; 'fail' (3 or less): still Stunned. */
export function unstun_outcome(total) {
    if (total >= 8) { return 'success' }
    return total > 3 ? 'mid' : 'fail'
}

function condition_name(id) {
    const effect = CONFIG.statusEffects?.find((e) => e.id === id)
    const name = effect?.name ?? effect?.label
    return name ? game.i18n.localize(name) : id
}

/* ------------------------------------------------------------------------------------------------ */
/* The window                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

class UnstunApp extends Application {
    #token
    #alias
    #state
    #hooks = []
    #refresh
    #done = false
    #busy = false
    static #current = null

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'swim-unstun',
            classes: ['swim-hc-app', 'swim-us-app'],
            width: 470,
            height: 'auto',
            resizable: false,
        })
    }

    get title() { return t('SWIM.unstun.title') }

    /** Opens the window (only one at a time). */
    static async open(token, alias) {
        await UnstunApp.#current?.close()
        const app = new UnstunApp(token, alias)
        UnstunApp.#current = app
        app.render(true)
    }

    constructor(token, alias) {
        super()
        this.#token = token
        this.#alias = alias
        // best: the best result so far (rerolls only change anything if they are better); elan: Elan applies from the first reroll on.
        this.#state = { phase: 'choose', best: -Infinity, bestOutcome: null, elan: false, roll: null }
        this.#refresh = foundry.utils.debounce(async () => {
            if (!this.rendered || this.#busy || this.#done) { return }
            // Stunned was removed by someone else while we are still choosing: nothing left to do.
            if (this.#state.phase === 'choose' && !(await swimConditions.has('stunned', this.#token))) { return this.close() }
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
        for (const id of ['stunned', 'distracted', 'vulnerable', 'prone']) { cond[id] = !!(await swimConditions.has(id, token)) }
        const { totalBennies } = await swim.check_bennies(token, false)
        const vigor = actor.system.attributes?.vigor
        const elan = actor.items.find((i) => i.type === 'edge' && i.name.toLowerCase() === t("SWIM.edge-elan").toLowerCase())
        return {
            token, actor, name: token.name, img: (token.document ?? token).texture.src,
            bennies: totalBennies, cond, elan,
            die: vigor ? `d${vigor.die.sides}${vigor.die.modifier ? (vigor.die.modifier > 0 ? '+' : '') + vigor.die.modifier : ''}` : '–',
            bonus: unstun_bonuses(actor, { elan: this.#state.elan }),
        }
    }

    /* ------------------------------- rendering ------------------------------ */

    #header(snap) {
        const chips = [['stunned', true], ['distracted', false], ['vulnerable', false], ['prone', false]]
            .filter(([id]) => snap.cond[id]).map(([id, bad]) => `<span class="swim-hc-chip ${bad ? 'is-bad' : ''}">${esc(condition_name(id))}</span>`).join('')
        const block = (label, value) => `<div class="swim-hc-track swim-us-static"><h5><span>${esc(label)}</span></h5><div class="swim-hc-num">${esc(value)}</div></div>`
        const bonus = snap.bonus.total > 0 ? `+${snap.bonus.total}` : String(snap.bonus.total)
        return `<div class="swim-hc-who"><div class="swim-hc-seg is-on swim-us-static"><img src="${esc(snap.img)}" alt=""><span><small>${esc(t('SWIM.unstun.title'))}</small><b>${esc(snap.name)}</b></span></div></div>
          <div class="swim-hc-patient"><div class="swim-hc-chips">${chips}</div><div class="swim-hc-tracks">
            ${block(t('SWIM.unstun.vigor'), snap.die)}
            ${block(t('SWIM.unshake.bonus'), bonus)}
            ${block(t('SWIM.healthCentre.bennies'), snap.bennies)}
          </div></div>`
    }

    #btn(action, label, { go = false, disabled = false } = {}) {
        return `<button type="button" class="swim-hc-btn ${go ? 'is-go' : ''}" data-action="${action}" ${disabled ? 'disabled' : ''}>${esc(label)}</button>`
    }

    #chooseView(snap) {
        const lines = snap.bonus.lines
        return {
            body: `<div class="swim-hc-result"><div class="swim-hc-lab">${esc(t('SWIM.unstun.rollName'))}</div><p>${esc(t('SWIM.unstun.promptText'))}</p></div>
              <div class="swim-hc-preview">${esc(t(lines.length ? 'SWIM.unshake.previewBonus' : 'SWIM.unshake.previewNoBonus'))}${lines.length ? `<div class="swim-us-lines">${lines.join('<br/>')}</div>` : ''}</div>`,
            foot: `<span class="swim-hc-spacer"></span>${this.#btn('cancel', t('SWIM.picker.cancel'))}${this.#btn('roll', t('SWIM.unstun.rollBtn'), { go: true })}`,
        }
    }

    #resultView(snap) {
        const st = this.#state
        const r = st.roll
        let top
        if (r.crit) {
            top = `<div class="swim-hc-big is-bad">${esc(t('SWIM.gameTerm-CritFail'))}</div><p>${esc(t('SWIM.unstun.critText'))}</p>`
        } else {
            const text = st.bestOutcome === 'mid' ? t('SWIM.unstun.midText') : t('SWIM.unstun.remainText')
            top = `<div class="swim-hc-big ${r.outcome === 'fail' ? 'is-bad' : ''}">${r.total}</div>${r.lines.length ? `<p class="swim-us-lines">${r.lines.join('<br/>')}</p>` : ''}` +
                `${r.total < st.best ? `<p>${esc(t('SWIM.unstun.bestKept', { last: r.total, best: st.best }))}</p>` : ''}<p>${esc(text)}</p>`
        }
        const canReroll = !r.crit && snap.bennies > 0
        return {
            body: `<div class="swim-hc-result">${top}${canReroll && snap.elan ? `<p>${esc(t('SWIM.soak.elanReroll'))}</p>` : ''}</div>`,
            foot: `<small>${esc(t('SWIM.healthCentre.benniesLeft', { count: snap.bennies }))}</small><span class="swim-hc-spacer"></span>` +
                `${canReroll ? this.#btn('reroll', t('SWIM.healthCentre.reroll', { count: snap.bennies })) : ''}${this.#btn('cancel', t('SWIM.healthCentre.close'), { go: !canReroll })}`,
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
    }

    async #onAction(ev) {
        const el = ev.currentTarget
        if (this.#busy || el.disabled) { return }
        switch (el.dataset.action) {
            case 'cancel': return this.close()
            case 'roll': return this.#roll(false)
            case 'reroll': return this.#roll(true)
            default: return
        }
    }

    async #finish() {
        this.#done = true
        await this.close()
    }

    /* ------------------------------ Vigor roll ------------------------------- */

    /** Brings the conditions in line with a better outcome (fail -> mid -> success). */
    async #apply(outcome) {
        const token = this.#token
        const has = async (id) => await swimConditions.has(id, token) === true
        if (outcome === 'mid') {
            await swimConditions.add('vulnerable', token)
            if (await has('stunned')) { await swimConditions.remove('stunned', token) }
        } else if (outcome === 'success') {
            if (await has('distracted')) { await swimConditions.remove('distracted', token) }
            await swim.wait(100)
            if (await has('stunned')) { await swimConditions.remove('stunned', token) }
        }
    }

    /** The Vigor roll. A Benny for a reroll is spent after the roll was actually made (a cancelled roll costs nothing). */
    async #roll(isReroll) {
        const st = this.#state
        const token = this.#token
        const actor = token.actor
        const snap = await this.#snapshot()
        if (isReroll && snap.bennies < 1) { return ui.notifications.warn(t('SWIM.notification-noBenniesLeft')) }

        this.#busy = true
        try {
            const r = await actor.rollAttribute('vigor')
            if (!r) { return } // the roll dialog was cancelled: nothing happened, nothing is spent
            if (isReroll) {
                await swim.spend_benny(token)
                if (snap.elan) { st.elan = true }
            }
            const bonus = unstun_bonuses(actor, { elan: st.elan })
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
            const outcome = unstun_outcome(total)
            const better = st.bestOutcome === null || RANK[outcome] > RANK[st.bestOutcome]
            let chat = t("SWIM.chatMessage-unshakeResultRoll", { name: this.#alias, rollWithEdge: total })
            if (better) {
                st.best = Math.max(st.best, total)
                st.bestOutcome = outcome
                await this.#apply(outcome)
                chat += t(`SWIM.unstun.chat${outcome === 'success' ? 'Success' : outcome === 'mid' ? 'Mid' : 'Fail'}`)
            } else {
                st.best = Math.max(st.best, total)
                chat += t('SWIM.unstun.chatNoBetter')
            }
            await ChatMessage.create({ content: `${chat} ${bonus.lines.map((l) => `<br/><i>${l}</i>`).join('')}` })
            if (outcome === 'success') { return await this.#finish() }
            st.roll = { crit: false, total, lines: bonus.lines, outcome }
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
        if (UnstunApp.#current === this) { UnstunApp.#current = null }
        return super.close(options)
    }
}
