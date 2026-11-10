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
 * @returns {Promise<Sound|undefined>} The Sound (has `.duration`), or undefined if nothing was played.
 */
export async function play_audio(src, { volume, push = true, loop = false } = {}) {
    if (!src) { return undefined }
    let vol = Number(volume ?? game.settings.get("swim", "defaultVolume"))
    if (!Number.isFinite(vol)) { vol = 1 }
    vol = Math.min(Math.max(vol, 0), 1)
    return audio_helper().play({ src: `${src}`, volume: vol, loop: loop }, push)
}
