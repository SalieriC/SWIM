export async function combat_hooks() {
    // Combat setup playlist handling
    Hooks.on("preUpdateCombat", async (combat, update, options, userId) => {
        if (game.settings.get("swim", "combatPlaylistManagement") === true && combat.round === 0 && update.round === 1) {
            if (swim.is_first_gm() === false) { return }
            const combatPlaylistName = game.settings.get("swim", "combatPlaylist")
            const combatPlaylist = game.playlists.getName(combatPlaylistName)
            const protectedFolder = game.settings.get("swim", "noStopFolder")
            for (let playlist of game.playlists.playing) {
                if (playlist.folder?.name.toLowerCase() != protectedFolder.toLowerCase()) {
                    playlist.setFlag('swim', 'resumeAfterCombat', true)
                    playlist.stopAll()
                }
            }
            if (combatPlaylist) {
                combatPlaylist.playAll()
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
            const combatPlaylist = game.playlists.find(p => p.name.toLowerCase() === "combat") //needs setting
            if (combatPlaylist && combatPlaylist.playing === true) {
                await combatPlaylist.stopAll()
            }
        }
    })
}