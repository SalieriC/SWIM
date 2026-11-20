/**
 * Single place that knows the Foundry v14 / SWADE 6 shape of ActiveEffect data.
 *
 * v14 (core) and SWADE 6 changed what an effect looks like:
 * - `icon` is `img`
 * - `changes` live in `system.changes`, and each change has a string `type` instead of a numeric `mode`
 * - `duration` is `{ value, units, expiry }`; the start (round, turn, time, combat) is set by Foundry on creation
 * - SWADE's `flags.swade.expiration` is gone; when an effect expires is `duration.expiry`
 *   (`turnStart`, `turnStartPrompt`, `turnEnd`, `turnEndPrompt`). Other SWADE flags moved to `system.*`.
 *
 * SWIM's effect builders still describe effects the way they were written for SWADE 3.x (`icon`, `changes` with `mode`,
 * `flags.swade.expiration`, `duration.rounds`), and `effect_data()` is the one function that turns this into v14 data.
 * New code may pass v14 shaped data directly, `effect_data()` leaves that as it is.
 */

/** Foundry v11 `CONST.ACTIVE_EFFECT_MODES` -> v14 change types. */
export const MODE_TO_TYPE = Object.freeze({ 0: 'custom', 1: 'multiply', 2: 'add', 3: 'downgrade', 4: 'upgrade', 5: 'override' })

/** SWADE 3.x `flags.swade.expiration` (0 start auto, 1 start prompt, 2 end auto, 3 end prompt) -> v14 `duration.expiry`. */
export const EXPIRATION_TO_EXPIRY = Object.freeze({ 0: 'turnStart', 1: 'turnStartPrompt', 2: 'turnEnd', 3: 'turnEndPrompt' })

/** The SWADE flags that moved to the effect's `system` data (`expiration` became `duration.expiry`). */
const SWADE_SYSTEM_KEYS = ['removeEffect', 'loseTurnOnHold', 'favorite', 'conditionalEffect']

/** One change in v14 shape. `priority` is left out when undefined, Foundry then uses the default of the type. */
export function change(key, type, value, priority) {
    const c = { key, type, value }
    if (priority !== undefined && priority !== null) { c.priority = priority }
    return c
}

/** A change (v14 or old shape) as v14 change. */
function change_v14(c) {
    const out = { key: c.key, value: c.value }
    out.type = c.type ?? MODE_TO_TYPE[c.mode] ?? 'add'
    if (c.priority !== undefined && c.priority !== null) { out.priority = c.priority }
    if (c.phase) { out.phase = c.phase }
    return out
}

/** The changes of an effect document or of effect data, whatever shape it has. Always an array of v14 changes. */
export function changes_of(effect) {
    const list = effect?.system?.changes ?? effect?.changes ?? []
    return Array.from(list, change_v14)
}

/**
 * Effect data (SWADE 3.x style or v14 style) -> v14 effect data. Returns a copy, the argument stays untouched.
 * @param {object} raw
 * @param {object} [options]
 * @param {string} [options.expiry] Expiry for effects that have a duration but no `flags.swade.expiration`.
 */
export function effect_data(raw, { expiry } = {}) {
    const d = foundry.utils.deepClone(raw)

    if (d.icon !== undefined) { d.img ??= d.icon; delete d.icon }

    if (d.changes !== undefined) {
        d.system ??= {}
        d.system.changes = [...(d.system.changes ?? []), ...d.changes]
        delete d.changes
    }
    if (d.system?.changes) { d.system.changes = d.system.changes.map(change_v14) }

    let expiration
    const swade = d.flags?.swade
    if (swade) {
        expiration = swade.expiration
        delete swade.expiration
        for (const key of SWADE_SYSTEM_KEYS) {
            if (swade[key] !== undefined) { d.system ??= {}; d.system[key] = swade[key]; delete swade[key] }
        }
        if (Object.keys(swade).length === 0) { delete d.flags.swade }
    }

    const old = d.duration
    if (old && typeof old === 'object') {
        const dur = {}
        for (const unit of ['rounds', 'turns', 'seconds']) {
            if (typeof old[unit] === 'number' && dur.value === undefined) { dur.value = old[unit]; dur.units = unit }
        }
        if (typeof old.value === 'number') { dur.value = old.value; dur.units = old.units ?? dur.units ?? 'rounds' }
        if (old.units && dur.value !== undefined) { dur.units = old.units }
        const exp = old.expiry ?? EXPIRATION_TO_EXPIRY[expiration] ?? expiry
        if (dur.value !== undefined && exp) { dur.expiry = exp }
        if (dur.value === undefined) { delete d.duration } else { d.duration = dur }
    }
    // The start of the effect (round, turn, time, combat) is set by Foundry itself when the effect is created.
    return d
}
