import { swimConditions } from '../helpers/conditions.js'
export async function combat_hooks() {
    // Combat setup playlist handling
    Hooks.on("preUpdateCombat", async (combat, update, options, userId) => {
        if (game.settings.get("swim", "combatPlaylistManagement") === true && combat.round === 0 && update.round === 1) {
            if (swim.is_first_gm() === false) { return }
            const combatPlaylistName = game.settings.get("swim", "combatPlaylist")
            const combatPlaylist = game.playlists.getName(combatPlaylistName)
            const protectedFolder = game.settings.get("swim", "noStopFolder")
            for (let playlist of game.playlists.playing) {
                // The combat playlist itself and the playlists of the protected folder keep playing
                if (playlist.id === combatPlaylist?.id) { continue }
                if (playlist.folder?.name.toLowerCase() != protectedFolder.toLowerCase()) {
                    await playlist.setFlag('swim', 'resumeAfterCombat', true)
                    await playlist.stopAll()
                }
            }
            if (combatPlaylist && !combatPlaylist.playing) {
                await combatPlaylist.playAll()
            }
        }
    })

    Hooks.on("deleteCombat", async (combat, options, userId) => {
        if (game.settings.get("swim", "combatPlaylistManagement") === true) {
            if (swim.is_first_gm() === false) { return }
            for (let playlist of game.playlists) {
                if (playlist.flags?.swim?.resumeAfterCombat === true) {
                    await playlist.playAll()
                    playlist.unsetFlag('swim', 'resumeAfterCombat')
                }
            }
            // The playlist from the setting (it used to look for one named "Combat", whatever the setting said)
            const combatPlaylistName = game.settings.get("swim", "combatPlaylist")
            const combatPlaylist = game.playlists.getName(combatPlaylistName)
            if (combatPlaylist && combatPlaylist.playing === true) {
                await combatPlaylist.stopAll()
            }
        }
        if (game.settings.get("swim", "deleteEffectsAfterCombat") === true) {
            if (swim.is_first_gm() === false) { return }
            const sceneId = combat.scene?.id
            if (sceneId) {
                swimConditions.remove_temporary_effects(sceneId, false)
            }
        }
    })
}