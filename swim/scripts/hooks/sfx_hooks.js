import { play_audio } from "../helpers/audio.js"

/**
 * Actor state SFX, driven by Foundry/SWADE document hooks instead of by the individual macros.
 * Whatever changes the actor (SWIM macros, Better Rolls 2, the SWADE damage dialog, the character sheet, other modules),
 * the sound is the same:
 *   Shaken applied / Wounds increase         -> shakenSFX
 *   Stunned applied                          -> stunnedSFX
 *   Incapacitated / Bleeding Out / Dead      -> deathSFX
 *   Fatigue increases                        -> fatiguedSFX
 *   Shaken or Stunned removed / Wounds heal  -> unshakeSFX
 *   Fatigue decreases                        -> looseFatigueSFX
 * (actor specific sounds from the SWIM config with the module settings as fallback, see swim.get_actor_sfx)
 *
 * Only the client of the user who made the change plays the sound (for all clients), exactly like the macros did before.
 * Events of one actor that arrive within a short window (e.g. one damage roll adds Shaken *and* a Wound) are merged to the
 * most important sound, so a single hit never plays several sounds at once.
 */
const WINDOW_MS = 150 //Collect events of one actor for this long.
const DEDUPE_MS = 400 //Don't repeat a file that was just played by a macro (e.g. Soak plays the same default sound).
const DOWN_IDS = ["incapacitated", "bleeding-out", "dead"]
const PRIORITY = { death: 6, stunned: 5, shaken: 4, fatigued: 3, unshake: 2, looseFatigue: 1 }
const pending = new Map()

export function sfx_hooks() {
    // Remember the old values, the update hook only gets the new ones. (options is passed on to the update hook of the same client)
    Hooks.on("preUpdateActor", (actor, changes, options) => {
        if (changed(changes, "system.wounds.value") === undefined && changed(changes, "system.fatigue.value") === undefined) { return }
        options.swimSfx = { wounds: actor.system?.wounds?.value, fatigue: actor.system?.fatigue?.value }
    })
    Hooks.on("updateActor", (actor, changes, options, userId) => {
        if (userId !== game.user.id) { return }
        const old = options?.swimSfx
        if (!old) { return }
        const wounds = changed(changes, "system.wounds.value")
        if (wounds !== undefined && old.wounds !== undefined) {
            if (wounds > old.wounds) { queue(actor, "shaken") }
            else if (wounds < old.wounds) { queue(actor, "unshake") }
        }
        const fatigue = changed(changes, "system.fatigue.value")
        if (fatigue !== undefined && old.fatigue !== undefined) {
            if (fatigue > old.fatigue) { queue(actor, "fatigued") }
            else if (fatigue < old.fatigue) { queue(actor, "looseFatigue") }
        }
    })
    Hooks.on("createActiveEffect", (effect, options, userId) => {
        if (userId !== game.user.id || effect.disabled || !(effect.parent instanceof Actor)) { return }
        const ids = condition_ids(effect)
        if (DOWN_IDS.some(id => ids.has(id))) { queue(effect.parent, "death") }
        if (ids.has("stunned")) { queue(effect.parent, "stunned") }
        if (ids.has("shaken")) { queue(effect.parent, "shaken") }
    })
    Hooks.on("deleteActiveEffect", (effect, options, userId) => {
        if (userId !== game.user.id || effect.disabled || !(effect.parent instanceof Actor)) { return }
        const ids = condition_ids(effect)
        if (ids.has("shaken") || ids.has("stunned")) { queue(effect.parent, "unshake") }
    })
}

/** Condition ids of an Active Effect: core/SWADE `statuses` and the SUCC condition id. */
function condition_ids(effect) {
    const ids = new Set(effect.statuses ?? [])
    const succ = effect.flags?.succ?.conditionId
    if (succ) { ids.add(succ) }
    return ids
}

/** Changes can come flat ("system.wounds.value") or expanded ({system:{wounds:{value}}}). */
function changed(changes, path) {
    const value = foundry.utils.getProperty(changes, path)
    return value !== undefined ? value : changes?.[path]
}

function queue(actor, type) {
    const key = actor.uuid
    const entry = pending.get(key)
    if (entry) {
        if (PRIORITY[type] > PRIORITY[entry.type]) { entry.type = type }
        return
    }
    pending.set(key, { actor, type })
    setTimeout(() => flush(key), WINDOW_MS)
}

async function flush(key) {
    const entry = pending.get(key)
    pending.delete(key)
    if (!entry) { return }
    try {
        const sfx = await swim.get_actor_sfx(entry.actor)
        const src = {
            death: sfx.deathSFX, stunned: sfx.stunnedSFX, shaken: sfx.shakenSFX,
            fatigued: sfx.fatiguedSFX, unshake: sfx.unshakeSFX, looseFatigue: sfx.looseFatigueSFX
        }[entry.type]
        await play_audio(src, { dedupe: DEDUPE_MS })
    } catch (err) {
        console.warn("SWIM | Could not play actor SFX", entry.type, err)
    }
}
