/**
 * Single place where SWIM talks to Foundry's core audio API.
 * - Foundry v11: the global class `AudioHelper` (reachable by its bare name only, not via `globalThis`)
 * - Foundry v12+: `foundry.audio.AudioHelper` (the global alias is deprecated in v12 and removed in v14)
 * The class offers everything SWIM needs (volume, broadcasting to all clients, the returned Sound with its `duration`),
 * so no additional module (e.g. Sequencer) is required for SFX.
 */
function audio_helper() {
    if (foundry.audio?.AudioHelper) { return foundry.audio.AudioHelper }
    //v11: `AudioHelper` is a top-level class of a classic script, i.e. a global binding that is NOT a property of globalThis/window.
    return AudioHelper
}

/**
 * Plays a sound file with the core audio API.
 * @param {string} src                 Path of the sound file. Empty/undefined = nothing is played.
 * @param {object} [options]
 * @param {number} [options.volume]    0-1; defaults to the SWIM setting "Default Volume".
 * @param {boolean} [options.push=true] true = play for all connected clients, false = only for this client.
 * @param {boolean} [options.loop=false]
 * @param {number} [options.dedupe=0]   >0 = skip the sound if the same file was played (by anything in SWIM) within this many ms.
 * @returns {Promise<Sound|undefined>} The Sound (has `.duration`), or undefined if nothing was played.
 */
const lastPlayed = new Map()

export async function play_audio(src, { volume, push = true, loop = false, dedupe = 0 } = {}) {
    if (!src) { return undefined }
    const now = Date.now()
    if (dedupe > 0 && now - (lastPlayed.get(src) ?? 0) < dedupe) { return undefined }
    lastPlayed.set(src, now)
    let vol = Number(volume ?? game.settings.get("swim", "defaultVolume"))
    if (!Number.isFinite(vol)) { vol = 1 }
    vol = Math.min(Math.max(vol, 0), 1)
    return audio_helper().play({ src: `${src}`, volume: vol, loop: loop }, push)
}
