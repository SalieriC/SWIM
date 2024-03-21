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
        if (game.settings.get("swim", "deleteEffectsAfterCombat") === true) {
            if (swim.is_first_gm() === false) { return }
            const sceneId = combat.scene.id
            if (sceneId) {
                game.succ.removeTemporaryEffects(sceneId, false)
            }
        }
    })

    Hooks.on("updateCombat", async (combat, updates, context, userId) => {
        //Ask users for maintaining their Conviction
        if (context.diff === false) { //`context.direction` is only false if a new round starts, thus making sure it only executes at the start of a new round.
            const combatants = combat.combatants
            for (let combatant of combatants) {
                const actor = combatant.actor
                const token = combatant.token
                if (await game.succ.hasCondition('conviction', actor) === true) {
                    const convEffect = await game.succ.getConditionFrom('conviction', token)
                    const initiatorId = convEffect.flags.succ.userId
                    if (game.user.id === initiatorId) { //Only show dialogue to the player who activated conviction.
                        let { tokenBennies, gmBennies, totalBennies } = await swim.check_bennies(token, false)
                        if (totalBennies >= 1) {
                            const officialClass = await swim.get_official_class()
                            new Dialog({
                                title: game.i18n.localize("SWIM.dialogue-convictionMaintenance"),
                                content: game.i18n.format("SWIM.dialogue-convictionMaintenanceContent", { officialClass: officialClass, currBennies: totalBennies }),
                                buttons: {
                                    one: {
                                        label: `<i class="fas fa-check"></i> ${game.i18n.localize("SWIM.dialogue-yes")}`,
                                        callback: async (html) => {
                                            await swim.spend_benny(token, true)
                                        }
                                    },
                                    two: {
                                        label: `<i class="fas fa-times"></i> ${game.i18n.localize("SWIM.dialogue-no")}`,
                                        callback: async (html) => {
                                            await game.succ.removeCondition('conviction', actor);
                                        }
                                    }
                                },
                                default: "one"
                            }).render(true);
                        } else {
                            ui.notifications.warn(game.i18n.localize("SWIM.notification-noBenniesForConviction"))
                            await game.succ.removeCondition('conviction', actor);
                        }
                    }
                }
            }
        }
    })
}