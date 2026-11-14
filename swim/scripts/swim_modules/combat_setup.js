/*******************************************************
 * Combat Setup
 * Adds the tokens of the current scene to the combat tracker:
 * - You choose which tokens join (defeated NPCs are not preselected)
 * - Groups Extras of the same kind (same creature, same disposition, never Wild Cards,
 *   optionally only if they are close to each other) into SWADE initiative groups:
 *   the first one is the group leader, the others follow it and share its action card
 * - Creates the combat if there is none, optionally starts it right away
 *   (drawing initiative is up to the system's "Automatic Initiative" setting)
 * - The combat playlist is handled by hooks/combat_hooks.js (setting "Combat Playlist Management")
 *
 * v. 2.0.0 – window (CombatSetupApp) instead of a Dialog; rewritten (the old version crashed on the first token, see PROJECT_SUMMARY #63)
 * By SalieriC, original groundwork by brunocalado#1650
 ******************************************************/
import { SwimWindow, t, esc, btn, checkbox } from "../helpers/swim_window.js"

const DEFEATED = ['incapacitated', 'dead', 'defeated']
// Order of the sections in the window (CONST.TOKEN_DISPOSITIONS: friendly 1, neutral 0, hostile -1, secret -2).
const DISPOSITIONS = [
    { value: 1, key: 'dispFriendly' },
    { value: 0, key: 'dispNeutral' },
    { value: -1, key: 'dispHostile' },
    { value: -2, key: 'dispSecret' },
]

const by_name = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }) || (a.id > b.id ? 1 : -1)

/** Does the actor have one of these conditions? Reads the effects (status ids and SUCC's condition id), so no SUCC call is needed. */
export function has_condition(actor, ids) {
    if (!actor) { return false }
    if (ids.some((id) => actor.statuses?.has?.(id))) { return true }
    return !!actor.effects?.some((e) => !e.disabled && (ids.some((id) => e.statuses?.has?.(id)) || ids.includes(e.flags?.succ?.conditionId)))
}

/** What the window needs to know about a token (document). Position is given in grid squares. */
export function token_info(td) {
    const actor = td.actor
    const size = td.parent?.grid?.size || 100
    const defeated = has_condition(actor, DEFEATED) || !!actor?.system?.isIncapacitated
        || !!td.flags?.healthEstimate?.dead || !!actor?.flags?.healthEstimate?.dead
    return {
        id: td.id,
        name: td.name ?? '',
        baseName: actor?.name ?? td.name ?? '',
        img: td.texture?.src ?? '',
        actorId: td.actorId ?? actor?.id ?? '',
        type: actor?.type,
        wildcard: !!(actor?.isWildcard ?? actor?.system?.wildcard),
        disposition: td.disposition ?? 0,
        hidden: !!td.hidden,
        defeated,
        gx: ((td.x ?? 0) + ((td.width ?? 1) * size) / 2) / size,
        gy: ((td.y ?? 0) + ((td.height ?? 1) * size) / 2) / size,
    }
}

/** Defeated NPCs stay out by default (as the old macro did). Characters and vehicles are always in. */
export function default_selected(info) {
    return !(info.type === 'npc' && info.defeated)
}

/** Splits `list` into clusters in which every token is within `distance` squares of another one of its cluster (0 = no limit: one cluster). */
export function clusters(list, distance) {
    if (!(distance > 0) || list.length < 2) { return [list] }
    const parent = list.map((_, i) => i)
    const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])))
    for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
            // the bigger of the two axis distances: SWADE counts a diagonal step as one square, too
            const d = Math.max(Math.abs(list[i].gx - list[j].gx), Math.abs(list[i].gy - list[j].gy))
            if (d <= distance + 1e-6) { parent[find(i)] = find(j) }
        }
    }
    const out = new Map()
    list.forEach((info, i) => {
        const r = find(i)
        if (!out.has(r)) { out.set(r, []) }
        out.get(r).push(info)
    })
    return [...out.values()]
}

/**
 * Which tokens form an initiative group. Only NPC Extras are grouped, with others of the same actor, disposition and visibility
 * (and, if `distance` > 0, only inside a chain of tokens that are at most `distance` squares apart). The first (by name) leads.
 * Returns { groups: [{leader, followers: [ids], label}], singles: [ids] }.
 */
export function plan_groups(infos, { group = true, distance = 0 } = {}) {
    const singles = []
    const buckets = new Map()
    for (const info of infos) {
        if (!group || info.type !== 'npc' || info.wildcard) { singles.push(info.id); continue }
        const key = `${info.actorId || info.baseName}|${info.disposition}|${info.hidden ? 1 : 0}`
        if (!buckets.has(key)) { buckets.set(key, []) }
        buckets.get(key).push(info)
    }
    const groups = []
    for (const list of buckets.values()) {
        for (const cluster of clusters(list, distance)) {
            if (cluster.length < 2) { singles.push(cluster[0].id); continue }
            const sorted = [...cluster].sort(by_name)
            groups.push({ leader: sorted[0].id, followers: sorted.slice(1).map((i) => i.id), label: sorted[0].baseName || sorted[0].name })
        }
    }
    groups.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
    return { groups, singles }
}

/** The combat tokens of `scene` would be added to: the viewed one if it belongs to the scene (or to no scene), else another of the scene, else null. */
export function combat_for_scene(scene) {
    const viewed = game.combat
    if (viewed && (!viewed.scene || viewed.scene.id === scene.id)) { return viewed }
    return game.combats?.find((c) => c.scene?.id === scene.id) ?? null
}

/** Like the combat tracker's "create encounter" button: creates the combat for the scene and makes it the active one. */
export async function create_combat(scene) {
    const combat = await getDocumentClass('Combat').create({ scene: scene.id })
    await combat.activate()
    return combat
}

/** Creates the combatants and sets the group flags (leader: `isGroupLeader`, followers: `groupId` = leader's combatant id, like SWADE's tracker does). */
export async function add_to_combat(combat, scene, infos, plan) {
    const data = infos.map((i) => ({ tokenId: i.id, sceneId: scene.id, actorId: i.actorId, hidden: i.hidden }))
    const created = await combat.createEmbeddedDocuments('Combatant', data)
    const byToken = new Map(created.map((c) => [c.tokenId, c.id]))
    const updates = []
    let followers = 0
    for (const g of plan.groups) {
        const leaderId = byToken.get(g.leader)
        if (!leaderId) { continue }
        updates.push({ _id: leaderId, 'flags.swade.isGroupLeader': true })
        for (const f of g.followers) {
            const id = byToken.get(f)
            if (!id) { continue }
            updates.push({ _id: id, 'flags.swade.groupId': leaderId })
            followers++
        }
    }
    if (updates.length) { await combat.updateEmbeddedDocuments('Combatant', updates) }
    return { created: created.length, groups: plan.groups.length, followers }
}

/**
 * Starts the combat. SWADE draws the action cards itself in `startCombat()` if "Automatic Initiative" is on;
 * with `draw` the cards are drawn the same way when it is off. Round 1 / turn 0 are set by Foundry (and SWADE once all cards are drawn).
 */
export async function start_combat(combat, { draw = false } = {}) {
    if (draw && !combat.automaticInitiative) {
        if (typeof combat._promptAllPlayersForInitiative === 'function') { await combat._promptAllPlayersForInitiative() }
        await combat.rollNPC()
    }
    return combat.startCombat()
}

export async function combat_setup() {
    if (!game.user.isGM) { return ui.notifications.error(t('SWIM.combatSetupWin.gmOnly')) }
    const scene = canvas.scene
    if (!scene) { return ui.notifications.error(t('SWIM.combatSetupWin.noScene')) }
    const combat = combat_for_scene(scene)
    const inCombat = new Set(combat?.combatants.map((c) => c.tokenId) ?? [])
    const withActor = scene.tokens.filter((td) => td.actor)
    if (withActor.length === 0) { return ui.notifications.error(t('SWIM.notification-noTokens')) }
    const candidates = withActor.filter((td) => !inCombat.has(td.id))
    if (candidates.length === 0) { return ui.notifications.info(t('SWIM.combatSetupWin.allInCombat')) }
    await SwimWindow.show(new CombatSetupApp(scene, combat, candidates.map(token_info)))
}

class CombatSetupApp extends SwimWindow {
    #scene
    #infos

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, { id: 'swim-combat-setup', width: 520 })
    }

    get title() { return t('SWIM.combatSetupName') }

    /** `combat`: the encounter the tokens will be added to, or null (it is created when adding). `infos`: token_info() of the tokens that are not in it yet. */
    constructor(scene, combat, infos) {
        super()
        this.#scene = scene
        this.combat = combat
        this.#infos = infos.sort((a, b) => (b.wildcard - a.wildcard) || by_name(a, b))
        this.added = null
        Object.assign(this.state, {
            view: 'setup',
            group: true,
            distance: '0',
            startNow: false,
            draw: false,
        })
        for (const info of this.#infos) { this.state[`sel:${info.id}`] = default_selected(info) }
    }

    get #autoInit() { return !!game.settings.get('swade', 'autoInit') }
    get #running() { return !!this.combat && this.combat.round > 0 }

    #selected() { return this.#infos.filter((i) => this.state[`sel:${i.id}`]) }

    #distance() {
        const n = Number(String(this.state.distance).replace(',', '.'))
        return Number.isFinite(n) && n > 0 ? n : 0
    }

    #plan() { return plan_groups(this.#selected(), { group: !!this.state.group, distance: this.#distance() }) }

    /** Text of the preview line, the label of the main button and whether there is anything to add. */
    #summary() {
        const selected = this.#selected()
        if (selected.length === 0) { return { preview: esc(t('SWIM.combatSetupWin.previewNone')), label: t('SWIM.combatSetupWin.add'), none: true } }
        const plan = this.#plan()
        const grouped = plan.groups.reduce((n, g) => n + 1 + g.followers.length, 0)
        let preview = esc(t('SWIM.combatSetupWin.preview', { count: selected.length, groups: plan.groups.length, grouped, singles: plan.singles.length }))
        if (plan.groups.length) {
            preview += `<br>${plan.groups.map((g) => `${esc(g.label)} ×${1 + g.followers.length}`).join(', ')}`
        }
        return { preview, label: t(this.state.startNow ? 'SWIM.combatSetupWin.addStart' : 'SWIM.combatSetupWin.add'), none: false }
    }

    #head() {
        const chip = (text) => `<span class="swim-hc-chip">${esc(text)}</span>`
        let combat = t('SWIM.combatSetupWin.newCombat')
        if (this.combat) {
            combat = this.#running
                ? t('SWIM.combatSetupWin.combatRunning', { round: this.combat.round })
                : t('SWIM.combatSetupWin.combatOpen', { count: this.combat.combatants.size })
        }
        return `<div class="swim-hc-patient"><div class="swim-hc-chips swim-cs-chips">${chip(t('SWIM.combatSetupWin.scene', { name: this.#scene.name }))}${chip(combat)}</div></div>`
    }

    #row(info) {
        const chips = []
        if (info.wildcard) { chips.push(`<span class="swim-hc-chip">${esc(t('SWIM.combatSetupWin.wildCard'))}</span>`) }
        if (info.type === 'vehicle') { chips.push(`<span class="swim-hc-chip">${esc(t('SWIM.combatSetupWin.vehicle'))}</span>`) }
        if (info.hidden) { chips.push(`<span class="swim-hc-chip">${esc(t('SWIM.combatSetupWin.hidden'))}</span>`) }
        if (info.defeated) { chips.push(`<span class="swim-hc-chip is-bad">${esc(t('SWIM.combatSetupWin.defeated'))}</span>`) }
        return `<label class="swim-cs-row"><input type="checkbox" data-field="sel:${info.id}" ${this.state[`sel:${info.id}`] ? 'checked' : ''}>
            <img src="${esc(info.img)}" alt=""><b>${esc(info.name)}</b>${chips.join('')}</label>`
    }

    #setupView() {
        const s = this.state
        let list = ''
        for (const { value, key } of DISPOSITIONS) {
            const rows = this.#infos.filter((i) => i.disposition === value)
            if (rows.length === 0) { continue }
            list += `<div class="swim-cs-sec"><span class="swim-hc-lab">${esc(t(`SWIM.combatSetupWin.${key}`))} (${rows.length})</span>
                <span class="swim-cs-tools"><button type="button" class="swim-cs-link" data-action="all" data-disp="${value}">${esc(t('SWIM.combatSetupWin.all'))}</button>
                <button type="button" class="swim-cs-link" data-action="none" data-disp="${value}">${esc(t('SWIM.combatSetupWin.none'))}</button></span></div>${rows.map((i) => this.#row(i)).join('')}`
        }
        const sum = this.#summary()
        const body = `<div class="swim-hc-result"><p>${esc(t('SWIM.combatSetupWin.intro'))}</p></div>
            <div class="swim-cs-list">${list}</div>
            <div class="swim-hc-lab swim-hc-lab2">${esc(t('SWIM.combatSetupWin.grouping'))}</div>
            <div class="swim-us-checks">${checkbox('group', t('SWIM.combatSetupWin.groupExtras'), s.group)}</div>
            <div class="swim-tv-hint">${esc(t('SWIM.combatSetupWin.groupHint'))}</div>
            <div class="swim-am-row"><label class="swim-hc-lab">${esc(t('SWIM.combatSetupWin.distance'))}</label>
                <div><input type="number" min="0" step="1" data-field="distance" value="${esc(s.distance)}"> <small>${esc(t('SWIM.combatSetupWin.distanceUnit'))}</small></div></div>
            <div class="swim-hc-lab swim-hc-lab2">${esc(t('SWIM.combatSetupWin.start'))}</div>
            <div class="swim-us-checks">${checkbox('startNow', t('SWIM.combatSetupWin.startNow'), s.startNow)}${this.#drawCheck()}</div>
            <div class="swim-hc-preview" data-cs-preview>${sum.preview}</div>`
        const foot = `<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('add', sum.label, { go: true, disabled: sum.none })}`
        return { head: this.#head(), body, foot }
    }

    /** "Draw the cards when starting": only needed if the system does not draw on its own. */
    #drawCheck() {
        return this.#autoInit ? '' : checkbox('draw', t('SWIM.combatSetupWin.drawInit'), this.state.draw)
    }

    #readyView() {
        const a = this.added
        let text = `<p>${esc(t('SWIM.combatSetupWin.added', { count: a.created }))}</p>`
        if (a.groups) { text += `<p>${esc(t('SWIM.combatSetupWin.addedGroups', { groups: a.groups, followers: a.followers }))}</p>` }
        text += `<p>${esc(t(this.#running ? 'SWIM.combatSetupWin.readyRunning' : 'SWIM.combatSetupWin.readyHint'))}</p>`
        const body = `<div class="swim-hc-result">${text}</div>${this.#running ? '' : `<div class="swim-us-checks">${this.#drawCheck()}</div>`}`
        const foot = `<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.healthCentre.close'))}${this.#running ? '' : btn('start', t('SWIM.combatSetupWin.startCombat'), { go: true })}`
        return { head: this.#head(), body, foot }
    }

    async view() {
        return this.state.view === 'ready' ? this.#readyView() : this.#setupView()
    }

    activateListeners(html) {
        super.activateListeners(html)
        // the preview and the main button follow the choices without re-rendering the window
        html.on('change input', '[data-field]', () => this.#refresh())
    }

    #refresh() {
        const root = this.element?.[0]
        if (!root || this.state.view !== 'setup') { return }
        const sum = this.#summary()
        const preview = root.querySelector('[data-cs-preview]')
        if (preview) { preview.innerHTML = sum.preview }
        const add = root.querySelector('[data-action="add"]')
        if (add) { add.textContent = sum.label; add.disabled = sum.none }
    }

    async onAction(action, el) {
        if (action === 'cancel') { return this.close() }
        if (action === 'all' || action === 'none') {
            const on = action === 'all'
            const root = this.element?.[0]
            for (const info of this.#infos.filter((i) => String(i.disposition) === el.dataset.disp)) {
                this.state[`sel:${info.id}`] = on
                const box = root?.querySelector(`input[data-field="sel:${info.id}"]`)
                if (box) { box.checked = on }
            }
            return this.#refresh()
        }
        if (action === 'add') { return this.#add() }
        if (action === 'start') { return this.#start() }
    }

    async #add() {
        const selected = this.#selected()
        if (selected.length === 0) { return ui.notifications.warn(t('SWIM.combatSetupWin.nothingSelected')) }
        const plan = this.#plan()
        this.busy = true
        try {
            this.combat ??= await create_combat(this.#scene)
            this.added = await add_to_combat(this.combat, this.#scene, selected, plan)
        } catch (err) {
            console.error('SWIM | Combat Setup failed', err)
            ui.notifications.error(t('SWIM.combatSetupWin.failed'))
            return
        } finally {
            this.busy = false
        }
        // The tokens are in the combat now: whatever happens when starting, the window must not offer to add them again.
        if (this.state.startNow && (await this.#startCombat())) { return this.close() }
        this.state.view = 'ready'
        return this.render()
    }

    async #start() {
        if (await this.#startCombat()) { return this.close() }
    }

    /** @returns {Promise<boolean>} true if the combat was started */
    async #startCombat() {
        this.busy = true
        try {
            await start_combat(this.combat, { draw: this.state.draw })
            return true
        } catch (err) {
            console.error('SWIM | Combat Setup failed to start the combat', err)
            ui.notifications.error(t('SWIM.combatSetupWin.failed'))
            return false
        } finally {
            this.busy = false
        }
    }
}
