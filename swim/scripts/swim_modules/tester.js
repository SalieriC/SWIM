/*******************************************
 * Test and Support Macro
 * v. 1.0.0 – one window for the player (TesterApp) and one for the resist roll on the GM side (ResistApp)
 * instead of the chain of dialogs.
 * Made and maintained by SalieriC#8263
 * Covered Edges:
 * - Elan
 * - Humiliate
 * - Menacing
 * - Reliable
 * - Retort
 * - Strong Willed
 *
 * Player side (TesterApp): choose Support or Test, the skill and (Support) the skill/attribute to support or (Test) the desired
 * result, roll, reroll with a Benny (free rerolls: Reliable for Support, Humiliate for Taunt Tests) and apply. The result is sent to
 * the GM (socketlib handler "tester" -> `tester_gm`).
 * GM side: Support creates/updates the Support effect on the target. A Test opens the ResistApp: the target rolls to resist, may
 * reroll with a Benny and the result is applied (Distracted/Vulnerable, Shaken on a raise, Retort).
 * Look: styles/unshake.css (shared `.swim-us*` classes) on top of styles/health-centre.css.
 ******************************************/
import { execute_as_gm } from "../helpers/socket_helper.js"
import { swimConditions } from '../helpers/conditions.js'

const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key))
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => `&#${m.charCodeAt(0)};`)
const ATTRIBUTES = { agility: 'SWADE.AttrAgi', smarts: 'SWADE.AttrSma', spirit: 'SWADE.AttrSpr', strength: 'SWADE.AttrStr', vigor: 'SWADE.AttrVig' }

/* ------------------------------------------------------------------------------------------------ */
/* Helpers                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** The Edge with the (localized) name of the lang key, if the actor has it. */
function find_edge(actor, langKey) {
    const name = t(langKey).toLowerCase()
    return actor.items.find((e) => e.type === "edge" && e.name.toLowerCase() === name)
}

function is_skill(item, name) {
    return item?.name?.toLowerCase() === t(name).toLowerCase()
}

/** Bonuses on the roll of the tester: Elan on a Benny reroll, Menacing on Intimidation Tests. `lines` are escaped HTML snippets. */
export function tester_bonuses(actor, skill, action, { elan = false } = {}) {
    let total = 0
    const lines = []
    if (elan) { total += 2; lines.push(`+ 2 ${esc(t("SWIM.edge-elan"))}`) }
    if (action === "test" && skill && is_skill(skill, "SWIM.skill-intimidation") && find_edge(actor, "SWIM.edge-menacing")) {
        total += 2
        lines.push(`+ 2 ${esc(t("SWIM.edge-menacing"))}`)
    }
    return { total, lines }
}

const lines_html = (lines) => lines.map((l) => `<br/><i>${l}</i>`).join('')
const is_wildcard = (actor) => !(actor.system.wildcard === false && actor.type === "npc")
const token_img = (token) => (token.document ?? token).texture?.src ?? token.texture?.src ?? ''

/** Shared window chrome (header with the token(s) and the Bennies). */
function header_html({ title, tokens, bennies }) {
    const segs = tokens.map(({ token, small, on }) => `<div class="swim-hc-seg ${on ? 'is-on' : ''} swim-us-static"><img src="${esc(token_img(token))}" alt=""><span><small>${esc(small)}</small><b>${esc(token.name)}</b></span></div>`).join('')
    return `<div class="swim-hc-who">${segs}</div>
      <div class="swim-hc-patient"><div class="swim-hc-tracks"><div class="swim-hc-track swim-us-static"><h5><span>${esc(t('SWIM.healthCentre.bennies'))}</span></h5><div class="swim-hc-num">${bennies}</div></div></div></div>`
}

function btn(action, label, { go = false, disabled = false } = {}) {
    return `<button type="button" class="swim-hc-btn ${go ? 'is-go' : ''}" data-action="${action}" ${disabled ? 'disabled' : ''}>${esc(label)}</button>`
}

function card(id, icon, title, hint, on) {
    return `<div class="swim-hc-method ${on ? 'is-on' : ''}" data-action="method" data-method="${id}" tabindex="0" role="radio" aria-checked="${on}">
      <span class="swim-hc-ico"><i class="${icon}"></i></span>
      <span class="swim-hc-mbody"><b>${esc(title)}</b><small>${esc(hint)}</small></span></div>`
}

/* ------------------------------------------------------------------------------------------------ */
/* Player side                                                                                      */
/* ------------------------------------------------------------------------------------------------ */

export async function tester_script() {
    let { speaker, _, __, token } = await swim.get_macro_variables()
    const targets = Array.from(game.user.targets)

    // No Token is Selected
    if (!token || canvas.tokens.controlled.length > 1 || targets.length < 1) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleTargetMultiToken"));
        return;
    }
    await TesterApp.open(token, targets[0])
}

class TesterApp extends Application {
    #token
    #target
    #state
    #hooks = []
    #refresh
    #links = ''
    #officialClass = ''
    #done = false
    #busy = false
    static #current = null

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'swim-tester',
            classes: ['swim-hc-app', 'swim-us-app'],
            width: 470,
            height: 'auto',
            resizable: false,
        })
    }

    get title() { return t('SWIM.tester') }

    /** Opens the window (only one at a time). */
    static async open(token, target) {
        await TesterApp.#current?.close()
        const app = new TesterApp(token, target)
        TesterApp.#current = app
        app.#officialClass = await swim.get_official_class() ?? ''
        const supportLink = await swim.get_official_journal_link("support")
        const testLink = await swim.get_official_journal_link("test")
        const p2 = t("SWIM.dialogue-testerIntroPartial2")
        const p3 = t("SWIM.dialogue-testerIntroPartial3")
        app.#links = `${t("SWIM.dialogue-testerIntroPartial1")} ${supportLink ? `${supportLink}{${p2}}` : p2} ${t("SWIM.word-or")} ${testLink ? `${testLink}{${p3}}` : p3}. ${t("SWIM.dialogue-testerIntroPartial4")}`
        app.render(true)
    }

    constructor(token, target) {
        super()
        this.#token = token
        this.#target = target
        const skills = token.actor.items.filter((i) => i.type === "skill")
        this.#state = {
            phase: 'choose', action: 'support', skillId: skills[0]?.id ?? '', supportedId: 'agility', result: 'distracted',
            best: null, rerolls: 0, elan: false, roll: null,
        }
        this.#refresh = foundry.utils.debounce(() => { if (this.rendered && !this.#busy && !this.#done) this.render(false) }, 150)
        for (const name of ['updateActor', 'createActiveEffect', 'deleteActiveEffect', 'updateItem']) {
            this.#hooks.push([name, Hooks.on(name, () => this.#refresh())])
        }
    }

    /* -------------------------------- data -------------------------------- */

    get #skill() { return this.#token.actor.items.find((i) => i.id === this.#state.skillId && i.type === "skill") }

    /** Is the next reroll free? Reliable for Support, Humiliate with Taunt for Tests; only the first reroll. */
    #freeAvailable() {
        const st = this.#state
        if (st.rerolls !== 0) { return false }
        const actor = this.#token.actor
        if (st.action === "support") { return !!find_edge(actor, "SWIM.edge-reliable") }
        return is_skill(this.#skill, "SWIM.skill-taunt") && !!find_edge(actor, "SWIM.edge-humiliate")
    }

    async #snapshot() {
        const { totalBennies } = await swim.check_bennies(this.#token, false)
        return { bennies: totalBennies, elan: !!find_edge(this.#token.actor, "SWIM.edge-elan"), free: this.#freeAvailable() }
    }

    /* ------------------------------- rendering ------------------------------ */

    #options(items, selected, prefix = '') {
        return items.map(([value, label]) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(prefix ? `${prefix(value)} ${label}` : label)}</option>`).join('')
    }

    async #chooseView(snap) {
        const st = this.#state
        const actor = this.#token.actor
        const skills = actor.items.filter((i) => i.type === "skill").map((i) => [i.id, i.name])
        const intro = await TextEditor.enrichHTML(`<p>${this.#links}</p>`, { async: true })
        const cards = card('support', 'fas fa-handshake', t('SWIM.gameTerm-Support'), t('SWIM.testerWin.supportHint'), st.action === 'support') +
            card('test', 'fas fa-comments', t('SWIM.gameTerm-Test'), t('SWIM.testerWin.testHint'), st.action === 'test')
        let fields = `<div class="swim-hc-lab">${esc(t('SWIM.dialogue-selectSkill'))}</div><div class="swim-hc-ctl"><select data-field="skillId">${this.#options(skills, st.skillId)}</select></div>`
        let preview
        if (st.action === 'support') {
            const attrLabel = t("ENHANCED_CONDITIONS.Dialog.Attribute")
            const skillLabel = t("ENHANCED_CONDITIONS.Dialog.Skill")
            const attrs = Object.entries(ATTRIBUTES).map(([id, key]) => [id, `${attrLabel} ${t(key)}`])
            const theirs = this.#target.actor.items.filter((i) => i.type === "skill").map((i) => [i.id, `${skillLabel} ${i.name}`])
            fields += `<div class="swim-hc-lab swim-hc-lab2">${esc(t('SWIM.dialogue-selectSupportSkill'))}</div><div class="swim-hc-ctl"><select data-field="supportedId">${this.#options([...attrs, ...theirs], st.supportedId)}</select></div>`
            preview = esc(t('SWIM.testerWin.previewSupport', { name: this.#target.name }))
        } else {
            const opt = (id, label) => `<div class="swim-hc-rate-opt ${st.result === id ? 'is-on' : ''}" data-action="result" data-result="${id}" tabindex="0" role="radio" aria-checked="${st.result === id}">${esc(label)}</div>`
            fields += `<div class="swim-hc-lab swim-hc-lab2">${esc(t('SWIM.dialogue-testerDesiredResult'))}</div><div class="swim-hc-rate swim-us-two">${opt('distracted', t('SWADE.Distr'))}${opt('vulnerable', t('SWADE.Vuln'))}</div>`
            const warn = game.user.isGM || this.#target.actor.type === "character" ? `<div>${t("SWIM.dialogue-testerGmWarn")}</div>` : ''
            preview = `${esc(t('SWIM.testerWin.previewTest', { name: this.#target.name }))}${warn}`
        }
        return {
            body: `<div class="swim-hc-result">${intro}</div>${cards}${fields}<div class="swim-hc-preview">${preview}</div>`,
            foot: `<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('roll', t('SWIM.testerWin.rollBtn'), { go: true, disabled: !st.skillId })}`,
        }
    }

    #resultView(snap) {
        const st = this.#state
        const r = st.roll
        const free = snap.free
        const canBenny = !free && snap.bennies > 0
        const notes = [
            r.total < st.best.total ? t('SWIM.testerWin.bestKept', { last: r.total, best: st.best.total }) : '',
            free ? t('SWIM.testerWin.freeReroll') : (canBenny && snap.elan ? t('SWIM.soak.elanReroll') : ''),
            st.action === 'test' && (free || canBenny) ? t('SWIM.testerWin.testNote', { pronoun: swim.get_pronoun(this.#target) }) : '',
        ].filter(Boolean).map((n) => `<p>${esc(n)}</p>`).join('')
        return {
            body: `<div class="swim-hc-result"><div class="swim-hc-big">${r.total}</div>${r.lines.length ? `<p class="swim-us-lines">${r.lines.join('<br/>')}</p>` : ''}${notes}</div>`,
            foot: `<small>${esc(t('SWIM.healthCentre.benniesLeft', { count: snap.bennies }))}</small><span class="swim-hc-spacer"></span>` +
                `${free ? btn('reroll', t('SWIM.button-freeReroll')) : canBenny ? btn('reroll', t('SWIM.healthCentre.reroll', { count: snap.bennies })) : ''}${btn('apply', t('SWIM.dialogue-apply'), { go: true })}`,
        }
    }

    async _renderInner() {
        const snap = await this.#snapshot()
        const view = this.#state.phase === 'result' ? this.#resultView(snap) : await this.#chooseView(snap)
        const head = header_html({
            title: t('SWIM.tester'), bennies: snap.bennies,
            tokens: [{ token: this.#token, small: t('SWIM.tester'), on: true }, { token: this.#target, small: t('SWIM.testerWin.target'), on: false }],
        })
        return $(`<div class="swim-hc swim-us">${head}<div class="swim-hc-body">${view.body}</div><footer class="swim-hc-foot">${view.foot}</footer></div>`)
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
        // The values of the selects are kept in the state (no re-render, that would close the opened dropdown).
        html.on('change', '[data-field]', (ev) => { this.#state[ev.currentTarget.dataset.field] = ev.currentTarget.value })
    }

    async #onAction(ev) {
        const el = ev.currentTarget
        const st = this.#state
        if (this.#busy || el.disabled) { return }
        switch (el.dataset.action) {
            case 'method': if (st.action === el.dataset.method) { return } st.action = el.dataset.method; break
            case 'result': if (st.result === el.dataset.result) { return } st.result = el.dataset.result; break
            case 'cancel': return this.close()
            case 'roll': return this.#roll(false)
            case 'reroll': return this.#roll(true)
            case 'apply': return this.#send(false)
            default: return
        }
        this.render(false)
    }

    /* ------------------------------ roll and send --------------------------- */

    /** Sends the result to the GM and closes the window. `crit`: the roll was a Critical Failure (then `total`/`lines` are that roll's). */
    async #send(crit, roll = null) {
        const st = this.#state
        const res = crit ? roll : st.best
        const data = {
            tokenId: this.#token.id,
            targetId: this.#target.id,
            sceneId: this.#token.scene.id,
            action: st.action,
            skillId: st.skillId,
            rollWithEdge: res.total,
            bestRoll: res.total,
            critFail: crit,
            edgeText: lines_html(res.lines),
            supportedSkillId: st.action === 'support' ? st.supportedId : undefined,
            selectedResult: st.action === 'test' ? st.result : undefined,
        }
        this.#busy = true
        try {
            await execute_as_gm("tester", data)
        } catch (e) {
            return // execute_as_gm already told the user; the window stays so nothing is lost
        } finally {
            this.#busy = false
        }
        this.#done = true
        return this.close()
    }

    /** A Benny for a reroll is spent after the roll was actually made (a cancelled roll costs nothing). */
    async #roll(isReroll) {
        const st = this.#state
        const token = this.#token
        const actor = token.actor
        const skill = this.#skill
        if (!skill) { return }
        const snap = await this.#snapshot()
        const free = isReroll && snap.free
        if (isReroll && !free && snap.bennies < 1) { return ui.notifications.warn(t('SWIM.notification-noBenniesLeft')) }

        this.#busy = true
        let sendCrit = null
        let sendBest = false
        try {
          do { // `break` = leave to the send step below (a `return` inside try/finally would skip it)
            const r = await actor.rollSkill(skill.id)
            if (!r) { return } // the roll dialog was cancelled: nothing happened, nothing is spent
            if (isReroll) {
                st.rerolls += 1
                if (!free) {
                    await swim.spend_benny(token, true)
                    if (snap.elan) { st.elan = true }
                }
            }
            const bonus = tester_bonuses(actor, skill, st.action, { elan: st.elan && isReroll && !free })
            const total = r.total + bonus.total

            // Checking for a Critical Failure: it applies at once.
            if (await swim.critFail_check(is_wildcard(actor), r) === true) {
                ui.notifications.warn(t("SWIM.notification-critFail"))
                sendCrit = { total, lines: bonus.lines }
                break
            }
            if (!st.best || total > st.best.total) { st.best = { total, lines: bonus.lines } }
            st.roll = { total, lines: bonus.lines }

            const { totalBennies } = await swim.check_bennies(token, false)
            const canReroll = (st.rerolls === 0 && snap.free) || totalBennies > 0
            if (total >= 8) { sendBest = true; break } // a raise: nothing to improve
            if (!canReroll) {
                ui.notifications.warn(t("SWIM.notification-noBenniesLeft"))
                sendBest = true
                break
            }
            st.phase = 'result'
          } while (false)
        } finally {
            this.#busy = false
            if (!this.#done && !sendCrit && !sendBest) { this.render(false) }
        }
        if (sendCrit) { return this.#send(true, sendCrit) }
        if (sendBest) { return this.#send(false) }
    }

    async close(options) {
        for (const [name, id] of this.#hooks) { Hooks.off(name, id) }
        this.#hooks = []
        this.#done = true
        if (TesterApp.#current === this) { TesterApp.#current = null }
        return super.close(options)
    }
}

/* ------------------------------------------------------------------------------------------------ */
/* GM side                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

export async function tester_gm(data) {
    const scene = game.scenes.get(data.sceneId)
    const token = scene?.tokens.get(data.tokenId)
    const targetToken = scene?.tokens.get(data.targetId)
    if (!token || !targetToken) { return ui.notifications.error(t("SWIM.notification.generalErrorMsg")) }
    const targetActor = targetToken.actor
    const actor = token.actor
    const rollWithEdge = Math.max(Number(data.bestRoll) || 0, Number(data.rollWithEdge) || 0)
    const critFail = !!data.critFail
    const edgeText = data.edgeText ?? ''
    const officialClass = await swim.get_official_class() ?? ''
    const skill = actor.items.find((s) => s.id === data.skillId && s.type === "skill")
    if (!skill) { return ui.notifications.error(t("SWIM.notification.generalErrorMsg")) }
    const message = (content) => ChatMessage.create({ user: game.user.id, content })

    if (data.action === "support") {
        const supportedId = data.supportedSkillId
        const isAttribute = Object.keys(ATTRIBUTES).includes(supportedId)
        const supportedSkill = isAttribute ? null : targetActor.items.find((s) => s.id === supportedId && s.type === "skill")
        if (!isAttribute && !supportedSkill) { return ui.notifications.error(t("SWIM.notification.generalErrorMsg")) }

        let chat = t("SWIM.chatMessage-supportResult-1", { officialClass, tokenName: token.name, rollWithEdge, targetName: targetToken.name }) + edgeText
        if (rollWithEdge >= 4 || critFail) {
            let supportValue = rollWithEdge >= 8 ? 2 : 1
            if (critFail) { supportValue = -2 }
            const supportKey = isAttribute ? `system.attributes.${supportedId}.die.modifier` : `@Skill{${supportedSkill.name}}[system.die.modifier]`
            const supportEffect = targetActor.effects.find((e) => e.flags?.swim?.isSupportEffect)
            if (supportEffect) {
                const changes = foundry.utils.deepClone(supportEffect.changes)
                const index = changes.findIndex((c) => c.key === supportKey)
                if (index >= 0) {
                    changes[index].value = Math.min(Number(changes[index].value) + supportValue, 4) //add support value but max out at 4
                } else {
                    changes.push({ key: supportKey, value: supportValue, mode: 2 })
                }
                await supportEffect.update({ changes })
            } else {
                await targetActor.createEmbeddedDocuments("ActiveEffect", [{
                    name: t("SWIM.gameTerm-Support"),
                    icon: "icons/skills/social/diplomacy-handshake.webp",
                    duration: {
                        "startTime": game.time.worldTime,
                        "seconds": null,
                        "rounds": 1,
                        "turns": null,
                        "startRound": game.combats.active ? game.combats.active.round : null,
                        "startTurn": null,
                        "type": "turns"
                    },
                    changes: [{ key: supportKey, value: supportValue, mode: 2 }],
                    flags: {
                        swim: { isSupportEffect: true },
                        swade: { "expiration": 2, "loseTurnOnHold": false }
                    },
                }])
            }
            chat += critFail ? t("SWIM.chatMessage-supportResult-2-critFail") : t("SWIM.chatMessage-supportResult-2-success", { supportValue })
        } else {
            chat += t("SWIM.chatMessage-supportResult-2-failure")
        }
        return message(chat)
    }

    if (data.action === "test") {
        const chat = "<br/>" + t("SWIM.chatMessage-testResult-1", { officialClass, tokenName: token.name, rollWithEdge, targetName: targetToken.name }) + edgeText
        if (critFail) { return message(chat + "<br/>" + t("SWIM.chatMessage-testResult-1-critFail")) }
        const attribute = skill.system.attribute
        if (!Object.keys(ATTRIBUTES).includes(attribute)) { return ui.notifications.error(t("SWIM.notification.generalErrorMsg")) }
        ui.notifications.warn(t("SWIM.notification-testerAlert", { actorName: actor.name, targetName: targetActor.name }))
        await ResistApp.open({ token, targetToken, skill, attribute, testTotal: rollWithEdge, chat, selectedResult: ['distracted', 'vulnerable'].includes(data.selectedResult) ? data.selectedResult : 'distracted' })
    }
}

/* ------------------------------------------------------------------------------------------------ */
/* The resist roll of the target (GM client)                                                        */
/* ------------------------------------------------------------------------------------------------ */

/** Strong Willed (+2 on Smarts/Spirit) of the one who resists; lines are escaped HTML. */
export function resist_bonuses(actor, attribute, { elan = false } = {}) {
    let total = 0
    const lines = []
    if (elan) { total += 2; lines.push(`+ 2 ${esc(t("SWIM.edge-elan"))}`) }
    if ((attribute === "smarts" || attribute === "spirit") && find_edge(actor, "SWIM.edge-strongWilled")) {
        total += 2
        lines.push(`+ 2 ${esc(t("SWIM.edge-strongWilled"))}`)
    }
    return { total, lines }
}

class ResistApp extends Application {
    #ctx
    #state
    #hooks = []
    #refresh
    #done = false
    #busy = false
    static #current = null

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'swim-tester-resist',
            classes: ['swim-hc-app', 'swim-us-app'],
            width: 470,
            height: 'auto',
            resizable: false,
        })
    }

    get title() { return t('SWIM.testerWin.resistTitle') }

    static async open(ctx) {
        await ResistApp.#current?.close()
        const app = new ResistApp(ctx)
        ResistApp.#current = app
        app.render(true)
    }

    constructor(ctx) {
        super()
        this.#ctx = ctx
        // best: the best resist result so far (starts at 0, as before); elan: Elan of the target applies from the first Benny reroll on.
        this.#state = { phase: 'choose', best: 0, elan: false, roll: null, chat: ctx.chat }
        this.#refresh = foundry.utils.debounce(() => { if (this.rendered && !this.#busy && !this.#done) this.render(false) }, 150)
        for (const name of ['updateActor', 'createActiveEffect', 'deleteActiveEffect', 'updateItem']) {
            this.#hooks.push([name, Hooks.on(name, () => this.#refresh())])
        }
    }

    /* ------------------------------- rendering ------------------------------ */

    async _renderInner() {
        const { token, targetToken, attribute, testTotal } = this.#ctx
        const st = this.#state
        const actor = targetToken.actor
        const { totalBennies } = await swim.check_bennies(targetToken, false)
        const elan = !!find_edge(actor, "SWIM.edge-elan")
        const attr = t(ATTRIBUTES[attribute])
        let body, foot
        if (st.phase === 'choose') {
            const bonus = resist_bonuses(actor, attribute)
            body = `<div class="swim-hc-result"><div class="swim-hc-lab">${esc(t('SWIM.testerWin.resistRoll', { attribute: attr }))}</div><p>${esc(t('SWIM.testerWin.resistText', { name: token.name, target: targetToken.name, attribute: attr, needed: testTotal }))}</p></div>` +
                (bonus.lines.length ? `<div class="swim-hc-preview">${esc(t('SWIM.unshake.previewBonus'))}<div class="swim-us-lines">${bonus.lines.join('<br/>')}</div></div>` : '')
            foot = `<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('roll', t('SWIM.testerWin.rollAttr', { attribute: attr }), { go: true })}`
        } else {
            const r = st.roll
            body = `<div class="swim-hc-result"><div class="swim-hc-big is-bad">${r.total}</div>${r.lines.length ? `<p class="swim-us-lines">${r.lines.join('<br/>')}</p>` : ''}` +
                `<p>${esc(t('SWIM.testerWin.resistFail', { needed: testTotal }))}</p>${totalBennies > 0 && elan ? `<p>${esc(t('SWIM.soak.elanReroll'))}</p>` : ''}</div>`
            foot = `<small>${esc(t('SWIM.healthCentre.benniesLeft', { count: totalBennies }))}</small><span class="swim-hc-spacer"></span>` +
                `${totalBennies > 0 ? btn('reroll', t('SWIM.healthCentre.reroll', { count: totalBennies })) : ''}${btn('accept', t('SWIM.testerWin.acceptBtn'), { go: totalBennies < 1 })}`
        }
        const head = header_html({ title: t('SWIM.testerWin.resistTitle'), bennies: totalBennies, tokens: [{ token: targetToken, small: t('SWIM.testerWin.resistTitle'), on: true }] })
        return $(`<div class="swim-hc swim-us">${head}<div class="swim-hc-body">${body}</div><footer class="swim-hc-foot">${foot}</footer></div>`)
    }

    /* ------------------------------- interaction ----------------------------- */

    activateListeners(html) {
        super.activateListeners(html)
        html.on('click', '[data-action]', (ev) => this.#onAction(ev))
    }

    async #onAction(ev) {
        const el = ev.currentTarget
        if (this.#busy || el.disabled) { return }
        switch (el.dataset.action) {
            case 'cancel': return this.close()
            case 'roll': return this.#roll(false)
            case 'reroll': return this.#roll(true)
            case 'accept': return this.#finish('failed', this.#state.roll)
            default: return
        }
    }

    /** The resist roll. A Benny of the TARGET for a reroll is spent after the roll was made. */
    async #roll(isReroll) {
        const st = this.#state
        const { targetToken, attribute, testTotal } = this.#ctx
        const actor = targetToken.actor
        let outcome = null
        this.#busy = true
        try {
          do { // `break` = leave to the finish step below (a `return` inside try/finally would skip it)
            const { totalBennies: before } = await swim.check_bennies(targetToken, false)
            if (isReroll && before < 1) { return ui.notifications.warn(t('SWIM.notification-noBenniesLeft')) }
            const r = await actor.rollAttribute(attribute)
            if (!r) { return } // the roll dialog was cancelled: nothing happened, nothing is spent
            const elanEdge = !!find_edge(actor, "SWIM.edge-elan")
            if (isReroll) {
                await swim.spend_benny(targetToken, true)
                if (elanEdge) { st.elan = true }
            }
            const bonus = resist_bonuses(actor, attribute, { elan: st.elan && isReroll })
            const total = r.total + bonus.total
            const roll = { total, lines: bonus.lines }

            // Critical Failure of the target.
            if (await swim.critFail_check(is_wildcard(actor), r) === true) { outcome = ['crit', roll]; break }
            st.best = Math.max(st.best, total)
            if (total >= testTotal) { outcome = ['resisted', roll]; break }
            const { totalBennies } = await swim.check_bennies(targetToken, false)
            if (totalBennies <= 0) {
                ui.notifications.warn(t("SWIM.notification-noBenniesLeft"))
                outcome = ['failed', roll]
                break
            }
            st.roll = roll
            st.phase = 'result'
          } while (false)
        } finally {
            this.#busy = false
            if (!outcome && !this.#done) { this.render(false) }
        }
        if (outcome) { return this.#finish(...outcome) }
    }

    /** Writes the result: chat message, the conditions on the target (Distracted/Vulnerable, Shaken on a raise) and Retort. */
    async #finish(kind, roll) {
        const { token, targetToken, skill, testTotal, selectedResult } = this.#ctx
        const st = this.#state
        const targetActor = targetToken.actor
        this.#done = true
        let chat = st.chat
        const resistLines = lines_html(roll?.lines ?? [])
        const total = roll?.total ?? 0

        if (kind === 'resisted') {
            chat += "<br/>" + t("SWIM.chatMessage-testResult-2-success", { targetName: targetToken.name, resistRollWithEdge: total }) + resistLines
            const isTauntOrIntimidation = is_skill(skill, "SWIM.skill-taunt") || is_skill(skill, "SWIM.skill-intimidation")
            if (find_edge(targetActor, "SWIM.edge-retort") && isTauntOrIntimidation && total - testTotal >= 4) {
                chat += "<br/>" + t("SWIM.chatMessage-testResult-3-retort", { targetName: targetToken.name, tokenName: token.name })
                await swimConditions.add("distracted", token)
            }
            chat += "</div>"
        } else {
            if (kind === 'crit') {
                // A Benny was already spent for the reroll; a Critical Failure costs no further Benny.
                chat += "<br/>" + t("SWIM.chatMessage-testResult-2-critFail", { targetName: targetToken.name }) + resistLines
            } else {
                chat += "<br/>" + t("SWIM.chatMessage-testResult-2-failure", { targetName: targetToken.name, resistRollWithEdge: total }) + resistLines
            }
            await swimConditions.add(selectedResult, targetToken)
            chat += "<br/>" + t("SWIM.chatMessage-testResult-3", { targetName: targetToken.name, status: t(`SWIM.gameTerm-${selectedResult}`) })
            if (testTotal - st.best >= 4) {
                await swimConditions.add("shaken", targetToken)
                chat += " " + t("SWIM.word-and") + " " + t("SWIM.gameTerm-Shaken")
            }
            chat += ".</div>"
        }
        await ChatMessage.create({ user: game.user.id, content: chat })
        return this.close()
    }

    async close(options) {
        for (const [name, id] of this.#hooks) { Hooks.off(name, id) }
        this.#hooks = []
        this.#done = true
        if (ResistApp.#current === this) { ResistApp.#current = null }
        return super.close(options)
    }
}
