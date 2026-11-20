/**
 * SWADE 6 moved movement to `system.pace` (`ground`, `fly`, `swim`, `burrow`, `base`, `default`, `running.die`, `running.mod`).
 * `system.stats.speed.*` is gone (only a deprecated shim remains). This is the one place SWIM knows the new paths.
 *
 * Effect changes on `system.pace` itself apply to every pace type (ground, fly, swim, burrow) at once.
 */
import { change } from "./effect_data.js"

/** The actor's current pace in its base movement type (ground by default). */
export function pace_of(actor) {
    const pace = actor.system.pace
    return pace?.default ?? pace?.[pace?.base ?? 'ground'] ?? 0
}

/** Size of the running die (6 for a d6). */
export function running_die_of(actor) { return actor.system.pace?.running?.die ?? 6 }

/** Flat modifier on the running roll. */
export function running_mod_of(actor) { return actor.system.pace?.running?.mod ?? 0 }

/**
 * Changes for the Slow hindrance effect of a leg injury.
 * Running die -2 (or running modifier -1 when it is a d4 already) and pace -1 (minor) or -2 (major).
 * Major also gets -2 on Athletics.
 * @param {Actor} actor
 * @param {boolean} major
 * @returns {object[]} v14 changes
 */
export function slow_changes(actor, major) {
    const changes = running_die_of(actor) === 4
        ? [change('system.pace.running.mod', 'add', -1)]
        : [change('system.pace.running.die', 'add', -2)]
    changes.push(change('system.pace', 'add', major ? -2 : -1))
    if (major) {
        changes.push(change(`@Skill{${game.i18n.localize("SWIM.skill-athletics")}}[system.die.modifier]`, 'add', -2))
    }
    return changes
}
