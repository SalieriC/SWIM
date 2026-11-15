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
 *  - Radius = grid squares ("inches"), measured from the EDGE of the source token to the EDGE of the other token. A token that is only touched
 *    by the radius is affected: the gap between the footprints (empty squares) must be smaller than the radius. Diagonals count as 1 (Chebyshev),
 *    like SWADE counts squares. Walls, elevation and token scale are ignored.
 *  - Disposition is compared between the source token and the other token: ally = same side (equal, or both friendly-ish / both hostile-ish),
 *    enemy = opposed (friendly vs hostile), any = everybody.
 *  - A source is inactive while its token is hidden or its actor is Incapacitated / Bleeding Out / Dead.
 *  - Several sources of the same aura (same effect name) do not stack unless `stack` is set: the nearest one wins.
 *
 * Everything is done by the first active GM (copies are created and deleted there). The functions up to `plan_scene` are pure.
 ******************************************/

export const DEFAULTS = { enabled: false, radius: 5, disposition: 'ally', self: false, stack: false }
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
        radius: Number.isFinite(r) ? Math.max(0, r) : DEFAULTS.radius,
        disposition: DISPOSITIONS.includes(raw.disposition) ? raw.disposition : DEFAULTS.disposition,
        self: raw.self === true,
        stack: raw.stack === true,
    }
}

/** Footprint of a token in grid squares (fractions allowed, tokens need not be snapped). */
export function token_rect(tokenDoc, gridSize) {
    const w = Number(tokenDoc.width) || 1
    const h = Number(tokenDoc.height) || 1
    const x0 = (Number(tokenDoc.x) || 0) / gridSize
    const y0 = (Number(tokenDoc.y) || 0) / gridSize
    return { x0, y0, x1: x0 + w, y1: y0 + h }
}

/** Empty squares between two footprints (0 = touching or overlapping), diagonals count as 1. */
export function rect_gap(a, b) {
    const dx = Math.max(a.x0 - b.x1, b.x0 - a.x1, 0)
    const dy = Math.max(a.y0 - b.y1, b.y0 - a.y1, 0)
    return Math.max(dx, dy)
}

/** A token is reached if the radius covers at least a part of it: radius 5 reaches up to 4 empty squares between the tokens. */
export function in_aura_range(a, b, radius) { return rect_gap(a, b) < radius - EPS }

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
            out.push({ id: `${token.id}|${effect.uuid}`, token, actor, effect, cfg, key: String(effect.name ?? '').trim().toLowerCase() })
        }
    }
    return out
}

/** Data of the copy a recipient gets (and its signature, to notice when the source changed). */
export function copy_data(effect, id, sceneId) {
    const src = effect.toObject()
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
    const rect = new Map()
    const rect_of = (token) => { if (!rect.has(token)) { rect.set(token, token_rect(token, grid)) } return rect.get(token) }

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
                if (!disposition_matches(s.cfg.disposition, s.token.disposition, target.disposition)) { continue }
                gap = rect_gap(rect_of(s.token), rect_of(target))
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
            const { data, sig } = copy_data(s.effect, s.id, scene.id)
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
