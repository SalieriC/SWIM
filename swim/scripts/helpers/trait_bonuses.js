/*******************************************
 * Shared by the bonus lists of Unshake, Unstun and Soak (swim_modules/unshake.js, unstun.js, soak_damage.js).
 *
 * Why: in Foundry v11 `actor.effects` holds only the effects of the ACTOR. The effects an Edge or ability brings along ("transfer") live on the item
 * and are only reached with `actor.allApplicableEffects()`. Reading `actor.effects` alone overlooked them, so their bonus landed in the "other
 * modifier" (the value on the sheet, which contains them) and the Edge itself was counted once more by name: the bonus was shown twice.
 ******************************************/

/** All effects of the actor, also the transferred effects of its items (enabled or not). */
export function actor_effects(actor) {
    return typeof actor.allApplicableEffects === 'function' ? Array.from(actor.allApplicableEffects()) : Array.from(actor.effects)
}

/** The effects that really change the actor right now (enabled, not suppressed: an aura source changes nothing on its owner). */
export function active_effects(actor) {
    return actor_effects(actor).filter((e) => !e.disabled && !e.isSuppressed)
}

/** The item an effect belongs to (transferred effect) or null for an effect of the actor itself. */
export function item_of(effect) {
    return effect?.parent?.documentName === 'Item' ? effect.parent : null
}

/** The effect belongs to one of these Edges/abilities, or is named like one (then the Edge's own bonus counts, not the effect's). */
export function covered_by_edge(effect, edges) {
    const item = item_of(effect)
    const name = String(effect.name ?? '').toLowerCase()
    return edges.some((i) => (item && i.id === item.id) || i.name.toLowerCase() === name)
}

/**
 * `rest` = what the value on the sheet holds beyond all effects. Compendium NPCs often have the bonus typed into the sheet
 * (Skeleton: Unshake +2, ability Undead). The Edges count +2 each by name, so they are paid out of that rest first: the same bonus is not
 * counted twice. Returns the rest that stays a separate "other modifier".
 */
export function absorb_manual_bonus(rest, edgeCount, per = 2, ctx = null) {
    if (!(rest > 0) || !edgeCount) { return rest }
    let on = true
    try { on = game.settings.get('swim', 'absorbSheetBonus') !== false } catch (err) { /* setting not registered yet: rule on */ }
    if (!on) { return rest }
    const absorbed = Math.min(Math.floor(rest / per), edgeCount) * per
    if (absorbed > 0 && ctx) {
        console.warn(`SWIM | ${ctx.what ?? 'Bonus'} of ${ctx.actor?.name ?? 'an actor'}: the value on the actor sheet (Tweaks) is +${rest + 0}, more than its effects explain. `
            + `+${absorbed} of it is treated as the bonus of the Edge/ability found on the actor, so it is not counted twice. `
            + `If this is wrong for you, switch off "Sheet value replaces Edge bonus" in the SWIM settings (Misc).`)
    }
    return rest - absorbed
}
