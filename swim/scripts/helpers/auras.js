/*******************************************
 * Auras ("command range"): an Active Effect on a token's actor that is passed on to other tokens within a radius.
 *
 * Config of the SOURCE effect = `flags.swim.aura` { enabled, radius, disposition: 'ally'|'enemy'|'any', self, stack } (edited in the "Aura" tab
 * of the Active Effect sheet, hooks/aura_hooks.js). The source effect lives on an actor or on an item of an actor (transferred effect, e.g. an Edge).
 * What is passed on = the effect itself (name, icon, changes, statuses, description). Recipients get a COPY marked with
 * `flags.swim.auraOf` { id, source, scene, sig }; the copy has no aura config, so it never emanates further.
 * The source effect itself changes nothing on its owner (hooks/aura_hooks.js suppresses it); "self" adds a copy to the owner like for everybody else.
 *
 * Rules (decided with the user):
 *  - Radius = grid squares, calculated EXACTLY like the auras of the SWADE system (Auramancer, token config > Auras): a circle around the CENTRE of the
 *    source token with the radius `gridSize * radius + externalRadius` (externalRadius = max(token width, height) / 2, i.e. the radius counts from the
 *    token's edge). A token is affected if that circle covers any part of its square (a token that is only touched, tangent, is not). Walls
 *    (SWADE's "walls" switch, off by default), elevation and token scale are ignored.
 *  - Disposition is compared between the source token and the other token: ally = same side (equal, or both friendly-ish / both hostile-ish),
 *    enemy = opposed (friendly vs hostile), any = everybody.
 *  - A source is inactive while its token is hidden or its actor is Incapacitated / Bleeding Out / Dead.
 *  - Several sources of the same aura (same effect name) do not stack unless `stack` is set: the nearest one wins.
 *
 * Everything is done by the first active GM (copies are created and deleted there). The functions up to `plan_scene` are pure.
 ******************************************/

export const DEFAULTS = { enabled: false, range: 'custom', radius: 5, disposition: 'ally', self: false, stack: false, wildcards: false, name: '' }
/** Where the radius comes from: the number in the effect, the Command range of the owner (SWIM config of the actor) or one of the SWADE auras of the owner (token configuration > Auras). */
export const RANGES = ['command', 'aura1', 'aura2', 'custom']
/** Command range of an actor without a value (SWADE: 5") */
export const DEFAULT_COMMAND_RANGE = 5
export const DISPOSITIONS = ['ally', 'enemy', 'any']
const DOWN_STATUSES = ['incapacitated', 'bleeding-out', 'dead', 'defeated']
const EPS = 1e-6

/** Switch for the whole feature (setting `auraEffects`); read by the hooks and the plan. */
export const state = { enabled: true }
export function set_auras_enabled(value) { state.enabled = value !== false }

/** Normalised config of an aura source effect, or null if the effect is not an (enabled) aura. */
export function aura_config(effect) {
    const raw = effect?.flags?.swim?.aura
    if (!raw || raw.enabled !== true) { return null }
    const r = raw.radius === undefined || raw.radius === null || raw.radius === '' ? NaN : Number(raw.radius)
    return {
        range: RANGES.includes(raw.range) ? raw.range : DEFAULTS.range,
        radius: Number.isFinite(r) ? Math.max(0, r) : DEFAULTS.radius,
        disposition: DISPOSITIONS.includes(raw.disposition) ? raw.disposition : DEFAULTS.disposition,
        self: raw.self === true,
        stack: raw.stack === true,
        wildcards: raw.wildcards === true,
        name: typeof raw.name === 'string' ? raw.name.trim() : '',
    }
}

/** The radius (squares) an aura source really has: its own number, or the range of its owner (prepared data, so Active Effects on the actor can raise it). */
export function resolve_radius(actor, cfg) {
    const num = (v, fallback) => { const n = v === undefined || v === null || v === '' ? NaN : Number(v); return Number.isFinite(n) ? Math.max(0, n) : fallback }
    if (cfg.range === 'command') { return num(actor?.flags?.swim?.config?.commandRange, DEFAULT_COMMAND_RANGE) }
    if (cfg.range === 'aura1' || cfg.range === 'aura2') {
        // Read the (prepared) flag directly. SWADE's `actor.auras` getter writes to the actor's flags as a side effect, which is not
        // something a read-only reconcile that runs on every token move should trigger.
        return num(actor?.flags?.swade?.auras?.[cfg.range]?.radius, DEFAULTS.radius)
    }
    return cfg.radius
}

/** Token in pixels: its square and the circle of an aura around it (SWADE: `token.w`, `token.h`, `token.center`, `token.externalRadius`). */
export function token_shape(tokenDoc, gridSize) {
    const w = (Number(tokenDoc.width) || 1) * gridSize
    const h = (Number(tokenDoc.height) || 1) * gridSize
    const x = Number(tokenDoc.x) || 0
    const y = Number(tokenDoc.y) || 0
    return { x0: x, y0: y, x1: x + w, y1: y + h, cx: x + w / 2, cy: y + h / 2, ext: Math.max(w, h) / 2 }
}

/**
 * How far (in grid squares) the square of token `b` is outside the aura circle of `a` at radius 0: distance from the centre of `a` to the
 * nearest point of `b`, minus the external radius of `a`, divided by the grid size. The aura reaches `b` if this is smaller than the radius.
 */
export function aura_gap(a, b, gridSize) {
    const dx = Math.max(b.x0 - a.cx, 0, a.cx - b.x1)
    const dy = Math.max(b.y0 - a.cy, 0, a.cy - b.y1)
    return (Math.hypot(dx, dy) - a.ext) / gridSize
}

/** The aura of `a` with the given radius (squares) covers a part of the square of `b`. */
export function in_aura_range(a, b, radius, gridSize) { return aura_gap(a, b, gridSize) < radius - EPS }

/** Side of token b as seen from token a: 'ally' | 'enemy' | 'other' (neutral against friendly/hostile). */
export function relation(dispositionA, dispositionB) {
    if (dispositionA === dispositionB) { return 'ally' }
    const p = Math.sign(dispositionA) * Math.sign(dispositionB)
    if (p === 1) { return 'ally' }
    if (p === -1) { return 'enemy' }
    return 'other'
}
export function disposition_matches(rule, dispositionA, dispositionB) {
    return rule === 'any' || relation(dispositionA, dispositionB) === rule
}

export function is_wildcard(actor) {
    return typeof actor?.isWildcard === 'boolean' ? actor.isWildcard : !!actor?.system?.wildcard
}

export function is_down(actor) {
    const st = actor?.statuses
    if (st && DOWN_STATUSES.some((id) => st.has(id))) { return true }
    return actor?.system?.isIncapacitated === true
}

/** All active aura sources of the scene: [{ id, token, actor, effect, cfg, key }]. */
export function collect_sources(scene) {
    const out = []
    for (const token of scene.tokens) {
        const actor = token.actor
        if (!actor || token.hidden || is_down(actor)) { continue }
        const effects = typeof actor.allApplicableEffects === 'function' ? actor.allApplicableEffects() : actor.effects
        for (const effect of effects) {
            if (effect.disabled) { continue }
            const cfg = aura_config(effect)
            if (!cfg) { continue }
            out.push({ id: `${token.id}|${effect.uuid}`, token, actor, effect, cfg: { ...cfg, radius: resolve_radius(actor, cfg) }, key: String(effect.name ?? '').trim().toLowerCase() })
        }
    }
    return out
}

/** Data of the copy a recipient gets (and its signature, to notice when the source changed). */
export function copy_data(effect, id, sceneId, displayName = '') {
    const src = effect.toObject()
    if (displayName) { src.name = displayName } // 'Name on token'
    const flags = foundry.utils.deepClone(src.flags ?? {})
    if (flags.swim) { delete flags.swim.aura }
    // an aura lasts as long as the token is in range: no turn based expiry
    if (flags.swade) { delete flags.swade.expiration; delete flags.swade.loseTurnOnHold }
    const sig = JSON.stringify([src.name, src.icon, src.tint, src.changes, src.statuses, src.description ?? '', flags])
    flags.swim = { ...(flags.swim ?? {}), auraOf: { id, source: effect.uuid, scene: sceneId, sig } }
    const data = {
        name: src.name, icon: src.icon, tint: src.tint, changes: src.changes, statuses: src.statuses,
        disabled: false, transfer: false, origin: effect.uuid, flags,
    }
    if ('description' in src) { data.description = src.description }
    return { data, sig }
}

/**
 * What every actor of the scene should carry: Map(actor -> Map(copy id -> { data, sig, gap })).
 * An actor that is on the scene with several linked tokens counts with its nearest token.
 */
export function plan_scene(scene) {
    const plan = new Map()
    if (!state.enabled) { return plan }
    const sources = collect_sources(scene)
    if (!sources.length) { return plan }
    const grid = scene.grid?.size ?? scene.dimensions?.size ?? 100
    const shapes = new Map()
    const shape_of = (token) => { if (!shapes.has(token)) { shapes.set(token, token_shape(token, grid)) } return shapes.get(token) }

    // 1) every (actor, source) pair that is in reach, with the smallest gap
    const reach = new Map()
    for (const target of scene.tokens) {
        const actor = target.actor
        if (!actor) { continue }
        for (const s of sources) {
            let gap
            if (s.actor === actor) {
                if (!s.cfg.self) { continue }
                gap = 0
            } else {
                if (!s.cfg.wildcards && is_wildcard(actor)) { continue } // Wild Cards only if the aura says so (the owner's own copy is "Also affects the owner")
                if (!disposition_matches(s.cfg.disposition, s.token.disposition, target.disposition)) { continue }
                gap = aura_gap(shape_of(s.token), shape_of(target), grid)
                if (!(gap < s.cfg.radius - EPS)) { continue }
            }
            if (!reach.has(actor)) { reach.set(actor, new Map()) }
            const m = reach.get(actor)
            if (!m.has(s.id) || m.get(s.id).gap > gap) { m.set(s.id, { s, gap }) }
        }
    }

    // 2) one copy per source, but only the nearest source of a non-stacking aura (same effect name)
    for (const [actor, found] of reach) {
        const best = new Map()
        const chosen = []
        for (const entry of found.values()) {
            if (entry.s.cfg.stack) { chosen.push(entry); continue }
            const cur = best.get(entry.s.key)
            if (!cur || entry.gap < cur.gap || (entry.gap === cur.gap && entry.s.id < cur.s.id)) { best.set(entry.s.key, entry) }
        }
        chosen.push(...best.values())
        const wanted = new Map()
        for (const { s, gap } of chosen) {
            const { data, sig } = copy_data(s.effect, s.id, scene.id, s.cfg.name)
            wanted.set(s.id, { data, sig, gap })
        }
        if (wanted.size) { plan.set(actor, wanted) }
    }
    return plan
}

/** The copies of a scene that an actor carries. */
const copies_of = (actor, sceneId) => actor.effects.filter((e) => e.flags?.swim?.auraOf?.scene === sceneId)

/** Brings the copies on all actors of the scene in line with `plan_scene`. Returns { created, updated, deleted, failed }. */
export async function reconcile_scene(scene) {
    const result = { created: 0, updated: 0, deleted: 0, failed: 0 }
    const plan = plan_scene(scene)
    const actors = new Set()
    for (const token of scene.tokens) { if (token.actor) { actors.add(token.actor) } }
    // linked actors that left the scene but still carry copies of it
    for (const actor of game.actors ?? []) { if (!actors.has(actor) && copies_of(actor, scene.id).length) { actors.add(actor) } }

    for (const actor of actors) {
        try {
            const wanted = plan.get(actor) ?? new Map()
            const have = new Map()
            const remove = []
            for (const e of copies_of(actor, scene.id)) {
                const id = e.flags.swim.auraOf.id
                if (!wanted.has(id) || have.has(id)) { remove.push(e.id) } else { have.set(id, e) }
            }
            const create = []
            const update = []
            for (const [id, w] of wanted) {
                const e = have.get(id)
                if (!e) { create.push(w.data) } else if (e.flags.swim.auraOf.sig !== w.sig) { update.push({ _id: e.id, ...w.data }) }
            }
            const options = { swimAura: true }
            if (remove.length) { await actor.deleteEmbeddedDocuments('ActiveEffect', remove, options); result.deleted += remove.length }
            if (create.length) { await actor.createEmbeddedDocuments('ActiveEffect', create, options); result.created += create.length }
            if (update.length) { await actor.updateEmbeddedDocuments('ActiveEffect', update, options); result.updated += update.length }
        } catch (err) {
            result.failed++
            console.error(`SWIM | Aura update failed for ${actor.name}`, err)
        }
    }
    return result
}

// --- scheduling: events come in bursts (a token drag, an item with several effects), so they are merged per scene and never run in parallel ---
const queue = new Map()

export function schedule_auras(scene, delay = 150) {
    if (!scene?.id) { return }
    let st = queue.get(scene.id)
    if (!st) { st = { timer: null, running: false, again: false }; queue.set(scene.id, st) }
    if (st.running) { st.again = true; return }
    clearTimeout(st.timer)
    st.timer = setTimeout(() => run_scheduled(scene.id, st), delay)
}

async function run_scheduled(sceneId, st) {
    st.running = true
    try {
        const scene = game.scenes.get(sceneId)
        if (scene) { await reconcile_scene(scene) }
    } catch (err) {
        console.error('SWIM | Aura update failed', err)
    }
    st.running = false
    if (st.again) { st.again = false; schedule_auras(game.scenes.get(sceneId)) }
}

/** The scenes in which the actor (or the actor owning the item) has tokens. */
export function scenes_of_actor(actor) {
    if (!actor) { return [] }
    if (actor.isToken) { return actor.token?.parent ? [actor.token.parent] : [] }
    return game.scenes.filter((s) => s.tokens.some((t) => t.actorId === actor.id && t.actorLink))
}
export function scenes_of_effect(effect) {
    const p = effect?.parent
    const actor = p?.documentName === 'Actor' ? p : p?.parent?.documentName === 'Actor' ? p.parent : null
    return scenes_of_actor(actor)
}

/** API `swim.recalculate_auras(sceneId)`: update the auras of one scene (default: the scene you are viewing) right now. GM only. */
export async function recalculate_auras(sceneId) {
    if (!game.user.isGM) { ui.notifications.error(game.i18n.localize('SWIM.notification.aurasGMOnly')); return null }
    const scene = sceneId ? game.scenes.get(sceneId) : (canvas.scene ?? game.scenes.current)
    if (!scene) { return null }
    const res = await reconcile_scene(scene)
    ui.notifications.info(game.i18n.format('SWIM.notification.aurasDone', { scene: scene.name, created: res.created, updated: res.updated, deleted: res.deleted }))
    return res
}

/**
 * Diagnosis for the console (`swim.aura_debug()`): for every token of the scene and every aura source, the gap in squares, the radius,
 * the verdict of the rule and the copies the actor carries right now. Nothing is changed.
 */
export function aura_debug(sceneId) {
    const scene = sceneId ? game.scenes.get(sceneId) : (canvas.scene ?? game.scenes.current)
    if (!scene) { return [] }
    const grid = scene.grid?.size ?? scene.dimensions?.size ?? 100
    const rows = []
    for (const s of collect_sources(scene)) {
        for (const t of scene.tokens) {
            if (t.id === s.token.id || !t.actor) { continue }
            const gap = aura_gap(token_shape(s.token, grid), token_shape(t, grid), grid)
            rows.push({
                source: `${s.token.name} (${s.effect.name})`, target: t.name, range: s.cfg.range, radius: s.cfg.radius, gap: Math.round(gap * 1e6) / 1e6,
                inRange: gap < s.cfg.radius - EPS, wildcardBlocked: !s.cfg.wildcards && is_wildcard(t.actor),
                copiesOnTarget: copies_of(t.actor, scene.id).map((e) => e.name).join(', '), x: t.x, y: t.y,
            })
        }
    }
    console.table(rows)
    return rows
}
