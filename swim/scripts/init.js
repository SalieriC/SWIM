import { api } from './api.js';
import { register_settings } from './settings.js'
import { swim_buttons } from './buttons.js'
import { gm_relay } from './gm_relay.js'
import { shape_changer_gm } from './swim_modules/shape_changer.js'
import { summoner_gm } from './swim_modules/mighty-summoner.js'
import { heal_other_gm } from './swim_modules/personal_health_centre.js'
import { common_bond_gm } from './swim_modules/common_bond.js'
import { effect_builder_gm } from './swim_modules/effect_builder.js'

/*Hooks.on('getCardsDirectoryEntryContext', function (stuff) {
    console.log(stuff)
})*/

Hooks.on('getSceneControlButtons', function (hudButtons) {
    swim_buttons(hudButtons)
});

Hooks.on('setup', api.registerFunctions)

Hooks.on(`ready`, () => {
    // Set round time to 6 as appropriate to the system:
    if (CONFIG.time.roundTime != 6 && swim.is_first_gm()) { CONFIG.time.roundTime = 6 }
    // Check Dependencies
    if (!game.modules.get('settings-extender')?.active && game.user.isGM) {
        let key = "install and activate";
        if (game.modules.get('settings-extender')) key = "activate";
        ui.notifications.error(`SWIM requires the 'settings-extender' module. Please ${key} it.`)
    }
    if (!game.modules.get('compendium-folders')?.active && game.user.isGM) {
        let key = "install and activate";
        if (game.modules.get('compendium-folders')) key = "activate";
        ui.notifications.error(`SWIM requires the 'compendium-folders' module. Please ${key} it.`)
    }
    if (!game.modules.get('warpgate')?.active && game.user.isGM) {
        let key = "install and activate";
        if (game.modules.get('warpgate')) key = "activate";
        ui.notifications.error(`SWIM requires the 'warpgate' module. Please ${key} it.`)
    }    

    // Ready stuff
    console.log('SWADE Immersive Macros | Ready');
    register_settings();

    // Registering SWIM functions to effect callbacks of SWIM:
    let version = "SWADE"
    if (game.settings.get('swim', 'swdUnshake') === true) {
        version = "SWD"
        // Disable subtracting Wounds from Pace if SWD Unshake is used:
        if ( game.settings.get("swade", "enableWoundPace") === true && swim.is_first_gm() ) {
            game.settings.set("swade", "enableWoundPace", false)
            ui.notifications.notify(game.i18n.localize("SWIM.notification-adjustPaceDisabled"))
        }
        // Add half pace effect to Shaken:
        for (let status of CONFIG.SWADE.statusEffects) {
            if (status.id === 'shaken') {
                status.changes.push({key: "data.stats.speed.value", mode: 1, priority: undefined, value: "0.5"})
            }
        }
    }
    game.swade.effectCallbacks.set("shaken", swim.unshake(version, effect))
    game.swade.effectCallbacks.set("stunned", swim.unstun(effect))
    game.swade.effectCallbacks.set("bleeding-out", swim.soak_damage(effect))

    // Setting up new conditions
    if (game.settings.get('swim', 'irradiationSetting') === true) {
        CONFIG.statusEffects.push({ id: "irradiated", label: "Irradiated", icon: "modules/succ/assets/icons/0-irradiated.svg" });
    }

    // Set Health Estimate up
    if (game.modules.get('healthEstimate')?.active && swim.is_first_gm()) {
        let incapIcon = CONFIG.SWADE.statusEffects.filter(e => e.id === "incapacitated").icon
        if (game.settings.get("healthEstimate", "core.deathMarker") != incapIcon) {game.settings.set("healthEstimate", "core.deathMarker", incapIcon)}
    }

    // First Login warning
    if (game.settings.get('swim', 'docRead') === false) {
        new Dialog({
            title: 'Welcome to SWIM',
            content: `<form>
                <h1>Welcome to SWIM</h1>
                <p>SWIM means SWADE Immersive Macros and that's exactly what you get.</p>
                <p>Please make sure to read the <a href="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/README.md">ReadMe</a> and the <a href="https://github.com/SalieriC/SWADE-Immersive-Macros/tree/main/documentation">documentation</a> on the GitHub. Don't blame me if you don't quite get how SWIM works when it is in there. If it is not in there however, feel free to drop me a DM on Discord: SalieriC#8263</p>
                <p>Please also note that SWIM overrides some SWADE System behaviour, especially the chase cleanup. Instead you'll find the same button in the same spot (Tile controls on the left) that sets up a chase for you. Make sure to use the Chase Layouts provided by SWIM and found in a compendium with this, on other scenes the cards may not align properly. <strong>Do not blame FloRad</strong> if that is not working, it is provided by SWIM, not the system.</p>
                <p>Check this Box if you have read this dalogue and the ReadMe/Documentation of SWIM. Then this dalogue won't show up again.<p>
                <hr />
                <div class="form-group">
                    <label for="readIt">I declare that I have read all of the above and I won't bother the SWADE or PEG Inc. team with questions and problems regarding SWIM or I may be struck down by lightning: </label>
                    <input id="readIt" name="Read it!" type="checkbox"></input>
                </div>
                <hr />
                <p>Please also consider to donate if you really like SWIM. This is one of the few ways of letting me know that SWIM is actually used and appreciated by some. =)</p>
                <p><a href="https://ko-fi.com/salieric"><img style="border: 0px; display: block; margin-left: auto; margin-right: auto;" src="https://www.ko-fi.com/img/githubbutton_sm.svg" width="223" height="30" /></a></p>
            </form>`,
            buttons: {
                one: {
                    label: "Let me play already!",
                    callback: (html) => {
                        let readIt = html.find("#readIt")[0].checked
                        if (readIt === true) {
                            game.settings.set('swim', 'docRead', true)
                        }
                    }
                }
            },
        }).render(true);
    }
    if (game.settings.get('swim', 'br2Message') === false && game.modules.get('betterrolls-swade2')?.active && game.user.isGM === true) {
        new Dialog({
            title: 'Better Rolls 2 support for SWIM.',
            content: `<form>
                <h1>Better Rolls 2 support for SWIM.</h1>
                <p>Good news everyone!<p>
                <p>As of SWIM version 0.17.0, SWIM natively offers Better Rolls 2 support. That means you can now enable all those immersive SWIM sound effects when applying damage, soaking and unshaking from the BR2 messages.</p>
                <p>This setting is optional however.</p>
                <div class="form-group">
                    <label for="activate">Do you want to activate BR2 support now? (You'll only get asked this one time, you can change that in the module settings however.)</label>
                    <input id="activate" name="Activate BR2 support?" type="checkbox"></input>
                </div>
                <hr />
                <p>Please also consider to donate if you really like SWIM. This is one of the few ways of letting me know that SWIM is actually used and appreciated by some. =)</p>
                <p><a href="https://ko-fi.com/salieric"><img style="border: 0px; display: block; margin-left: auto; margin-right: auto;" src="https://www.ko-fi.com/img/githubbutton_sm.svg" width="223" height="30" /></a></p>
            </form>`,
            buttons: {
                one: {
                    label: "Damn you Sal! Let. Me. Play. NOW!",
                    callback: async (html) => {
                        let activate = html.find("#activate")[0].checked
                        if (activate === true) {
                            game.settings.set('swim', 'br2Support', true)
                        }
                        game.settings.set('swim', 'br2Message', true)
                        await swim.wait('20')
                        window.location.reload();
                    }
                }
            },
        }).render(true);
    }

    // Warpgate Watches
    warpgate.event.watch("SWIM.shapeChanger", shape_changer_gm, swim.is_first_gm)
    warpgate.event.watch("SWIM.summoner", summoner_gm, swim.is_first_gm)
    warpgate.event.watch("SWIM.healOther", heal_other_gm, swim.is_first_gm)
    warpgate.event.watch("SWIM.commonBond", common_bond_gm, swim.is_first_gm)
    warpgate.event.watch("SWIM.effectBuilder", effect_builder_gm, swim.is_first_gm)
    warpgate.event.watch("SWIM.deleteActor", gm_relay.gmDeleteActor, swim.is_first_gm)
    warpgate.event.watch("SWIM.updateCombat-previousTurn", gm_relay.combat_previousTurn, swim.is_first_gm)
});

// Hooks on conditions
Hooks.on(`createActiveEffect`, async (condition, _, userID) => {
    const actor = condition.parent
    // Invisible
    if (((actor.hasPlayerOwner && condition.data.flags?.core?.statusId === "invisible") || condition.data.label.toLowerCase() === game.i18n.localize("SWIM.power-intangibility").toLowerCase()) && swim.is_first_gm()) {
        const tokens = actor.getActiveTokens()
        for (let token of tokens) {
            if (condition.data.flags?.core?.statusId === "invisible") { await token.document.update({ "alpha": 0.5 }) }
            else if (condition.data.label.toLowerCase() === game.i18n.localize("SWIM.power-intangibility").toLowerCase()) { await token.document.update({ "alpha": 0.75 }) }
        }
    } else if (!actor.hasPlayerOwner && swim.is_first_gm() && condition.data.flags?.core?.statusId === "invisible") {
        const tokens = actor.getActiveTokens()
        for (let token of tokens) {
            if (token.data.hidden === false) { await token.toggleVisibility() }
        }
    }
    // Light
    if (condition.data.flags?.core?.statusId === "torch" && game.user.id === userID) {
        swim.token_vision()
    }
    // Hold
    if (condition.data.flags?.core?.statusId === "holding" && swim.is_first_gm() && game.combat) {
        const tokens = actor.getActiveTokens()
        for (let token of tokens) { await token.combatant.update({ "flags.swade.roundHeld": 1 }) }
    }
})
Hooks.on(`deleteActiveEffect`, async (condition, _, userID) => {
    const actor = condition.parent
    // Invisible
    if (((actor.hasPlayerOwner && condition.data.flags?.core?.statusId === "invisible") || condition.data.label.toLowerCase() === game.i18n.localize("SWIM.power-intangibility").toLowerCase()) && swim.is_first_gm()) {
        const tokens = actor.getActiveTokens()
        for (let token of tokens) {
            await token.document.update({ "alpha": 1 })
        }
    } else if (!actor.hasPlayerOwner && swim.is_first_gm() && condition.data.flags?.core?.statusId === "invisible") {
        const tokens = actor.getActiveTokens()
        for (let token of tokens) {
            if (token.data.hidden === true) { await token.toggleVisibility() }
        }
    }
    // Cancel maintained power
    if (condition.data.flags?.swim?.maintainedPower === true && condition.data.flags?.swim?.owner === true && swim.is_first_gm()) {
        for (let targetID of condition.data.flags.swim.targets) {
            const playerScene = game.scenes.get(game.users.get(userID).viewedScene)
            const token = playerScene.tokens.get(targetID)
            const effect = token.actor.data.effects.find(ae => ae.data.flags?.swim?.maintenanceID === condition.data.flags?.swim?.maintenanceID)
            if (effect) {
                await effect.delete()
            }
        }
    }
    // Cancel Summoned Creature
    if (condition.data.flags?.swim?.maintainedSummon === true && swim.is_first_gm()) {
        if (condition.data.flags.swim.owner === false) {
            for (let each of game.scenes.current.tokens) {
                const maintEffect = each.actor.data.effects.find(e => e.data.flags?.swim?.maintenanceID === condition.data.flags?.swim?.maintenanceID)
                if (maintEffect) {
                    await maintEffect.delete()
                }
            }
            if (actor.sheet.rendered) {
                actor.sheet.close();
                await swim.wait('100')
            }
            const dismissData = [actor.token.id]
            await play_sfx(dismissData)
            await warpgate.dismiss(actor.token.id, game.scenes.current.id)
        } else if (condition.data.flags.swim.owner === true) {
            for (let each of game.scenes.current.tokens) {
                const maintEffect = each.actor.data.effects.find(e => e.data.flags?.swim?.maintenanceID === condition.data.flags?.swim?.maintenanceID)
                if (maintEffect) {
                    const dismissData = [each.id]
                    await play_sfx(dismissData)
                    await warpgate.dismiss(each.id, game.scenes.current.id)
                    return
                }
            }
        }
        async function play_sfx(spawnData) {
            //Playing VFX & SFX:
            let spawnSFX = game.settings.get(
                'swim', 'shapeShiftSFX');
            let spawnVFX = game.settings.get(
                'swim', 'shapeShiftVFX');
            if (spawnSFX) { swim.play_sfx(spawnSFX) }
            if (game.modules.get("sequencer")?.active && spawnVFX) {
                let tokenD = canvas.tokens.get(spawnData[0])
                let sequence = new Sequence()
                    .effect()
                    .file(`${spawnVFX}`) //recommendation: "modules/jb2a_patreon/Library/2nd_Level/Misty_Step/MistyStep_01_Regular_Green_400x400.webm"
                    .atLocation(tokenD)
                    .scale(1)
                sequence.play();
                await swim.wait(`800`);
            }
        }
    }
    // Light
    if (condition.data.flags?.core?.statusId === "torch" && game.user.id === userID) {
        swim.token_vision()
    }
    // Hold
    if (condition.data.flags?.core?.statusId === "holding" && game.user.id === userID) {
        if (game.combat) {
            const tokens = actor.getActiveTokens()
            const currentCardValue = game.combat.combatant.data.flags.swade.cardValue
            const currentSuitValue = game.combat.combatant.data.flags.swade.suitValue
            const combatID = game.combat.id
            new Dialog({
                title: game.i18n.localize("SWIM.dialogue-takingInitiativeTitle"),
                content: game.i18n.localize("SWIM.dialogue-takingInitiativeText"),
                buttons: {
                    one: {
                        label: game.i18n.localize("SWIM.dialogue-takingInitiative-ButtonNow"),
                        callback: async (_) => {
                            for (let token of tokens) {
                                await token.combatant.unsetFlag("swade", "roundHeld")
                                await token.combatant.update({ 
                                    "flags.swade.cardValue": currentCardValue,
                                    "flags.swade.suitValue": currentSuitValue + 0.01
                                })
                            }
                            await swim.wait('100') // Needed to give the whole thing some time to prevent issues with jokers.
                            warpgate.event.notify("SWIM.updateCombat-previousTurn", {combatID: combatID})
                        }
                    },
                    two: {
                        label: game.i18n.localize("SWIM.dialogue-takingInitiative-ButtonAfter"),
                        callback: async (_) => {
                            for (let token of tokens) {
                                await token.combatant.unsetFlag("swade", "roundHeld")
                                await token.combatant.update({ 
                                    "flags.swade.cardValue": currentCardValue,
                                    "flags.swade.suitValue": currentSuitValue - 0.01
                                })
                            }
                        },
                    }
                },
                //close: { callback: await succ.apply_status(actor, "holding", true) },
                default: "one"
            }).render(true)
        }
    }
})

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
            if (playlist.data.flags?.swim?.resumeAfterCombat === true) {
                await playlist.playAll()
                playlist.unsetFlag('swim', 'resumeAfterCombat')
            }
        }
        const combatPlaylist = game.playlists.find(p => p.name.toLowerCase() === "combat") //needs setting
        if (combatPlaylist && combatPlaylist.data.playing === true) {
            await combatPlaylist.stopAll()
        }
    }
})

//BR2 Hooks
Hooks.on(`BRSW-Unshake`, async (message, actor) => {
    if (game.settings.get("swim", "br2Support") === true) {
        const { shakenSFX, deathSFX, unshakeSFX, soakSFX } = await swim.get_actor_sfx(actor)
        if (unshakeSFX) {
            await swim.play_sfx(unshakeSFX)
        }
    }
})
/*Hooks.on("BRSW-AfterShowDamageCard", async (actor, wounds, message) => {
    console.log(actor, wounds, message)
});*/
Hooks.on("BRSW-AfterApplyDamage", async (token, final_wounds, final_shaken, incapacitated, initial_wounds, initial_shaken, soaked) => {
    if (game.settings.get("swim", "br2Support") === true) {
        const { shakenSFX, deathSFX, unshakeSFX, soakSFX } = await swim.get_actor_sfx(token.actor)
        const volume = Number(game.settings.get("swim", "defaultVolume"))
        if (soaked >= 1) {
            await swim.play_sfx(soakSFX, volume)
        } else if (incapacitated === true) {
            await swim.play_sfx(deathSFX, volume)
        } else if (final_wounds > initial_wounds || final_shaken === true) {
            await swim.play_sfx(shakenSFX, volume)
        }
    }
});
/* This produces duplicate sound effects, leaving it commented until a good solution to exclude them on a condition is found.
Hooks.on(`createActiveEffect`, async (condition, _, userID) => {
    if (condition.data.flags?.core?.statusId === "incapacitated" || condition.data.flags?.core?.statusId === "shaken") {
        const actor = condition.parent
        const { shakenSFX, deathSFX, unshakeSFX, soakSFX } = await swim.get_actor_sfx(actor)
        const volume = Number(game.settings.get("swim", "defaultVolume"))
        if (condition.data.flags?.core?.statusId === "incapacitated") {
            await swim.play_sfx(deathSFX, volume)
        } else if (condition.data.flags?.core?.statusId === "shaken") {
            await swim.play_sfx(shakenSFX, volume)
        }
    }
})
Hooks.on(`deleteActiveEffect`, async (condition, _, userID) => {
    if (condition.data.flags?.core?.statusId === "incapacitated" || condition.data.flags?.core?.statusId === "shaken") {
        const actor = condition.parent
        const { shakenSFX, deathSFX, unshakeSFX, soakSFX } = await swim.get_actor_sfx(actor)
        const volume = Number(game.settings.get("swim", "defaultVolume"))
        if (condition.data.flags?.core?.statusId === "incapacitated") {
            await swim.play_sfx(soakSFX, volume)
        } else if (condition.data.flags?.core?.statusId === "shaken") {
            await swim.play_sfx(unshakeSFX, volume)
        }
    }
})
*/