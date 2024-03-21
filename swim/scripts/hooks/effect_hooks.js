export async function effect_hooks() {
    // Hooks on conditions
    Hooks.on(`createActiveEffect`, async (condition, _, userID) => {
        const actor = condition.parent
        // Invisible
        if (((swim.is_first_gm() && condition.flags?.swim?.maintaining === game.i18n.localize(`SWIM.power-invisibility`) && condition.flags?.swim?.affected === true) || condition.flags?.swim?.maintaining === game.i18n.localize("SWIM.power-intangibility")) && swim.is_first_gm() && condition.flags?.swim?.affected === true) {
            const tokens = actor.getActiveTokens()
            for (let token of tokens) {
                await token.document.setFlag('swim', 'originalAlpha', token.alpha) //store original alpha on token.
                if (condition.flags?.swim?.maintaining === game.i18n.localize(`SWIM.power-invisibility`)) { await token.document.update({ "alpha": 0.25 }) }
                else if (condition.flags?.swim?.maintaining === game.i18n.localize("SWIM.power-intangibility")) { await token.document.update({ "alpha": 0.5 }) }
            }
        }
        // Light
        if (condition.flags?.succ?.conditionId === "torch" && game.user.id === userID) {
            if (condition.flags?.succ?.effectOptions?.swim?.activatedFromMacro === true) { return } //Prevent second execution if macro was used.
            swim.token_vision(condition)
        }
        // Hold
        /*
        if (condition.flags?.succ?.conditionId === "holding" && swim.is_first_gm() && game.combat) {
            const tokens = actor.getActiveTokens()
            const combatID = game.combat.id
            const currentTurn = game.combat.turn
            for (let token of tokens) { await token.combatant.update({ "flags.swade.roundHeld": 1 }) }
            await swim.wait('100') // Needed to give the whole thing some time to prevent issues with jokers.
            warpgate.event.notify("SWIM.updateCombat-currentTurn", { combatID: combatID, currTurn: currentTurn })
        }
        */
        // Conviction
        if (condition.name === "Conviction") {
            // This prevents conviction expiration dialogue from core since SWADE handles it by itself.
            let updates = condition.toObject();
            updates.flags.swade.expiration = null;
            await condition.update(updates);
        }
    })
    Hooks.on(`deleteActiveEffect`, async (condition, _, userID) => {
        const actor = condition.parent
        // Invisible
        if (((swim.is_first_gm() && condition.flags?.swim?.maintaining === game.i18n.localize(`SWIM.power-invisibility`) && condition.flags?.swim?.affected === true) || condition.flags?.swim?.maintaining === game.i18n.localize("SWIM.power-intangibility")) && swim.is_first_gm() && condition.flags?.swim?.affected === true) {
            const tokens = actor.getActiveTokens()
            for (let token of tokens) {
                const originalAlpha = token.document.flags?.swim?.originalAlpha //restore tokens alpha to previous value if available.
                await token.document.update({ "alpha" : originalAlpha ? originalAlpha : 1 })
                if (originalAlpha) { await token.document.unsetFlag('swim', 'originalAlpha') } //delete flag for original alpha.
            }
        }
        // Cancel maintained power
        if (condition.flags?.swim?.maintainedPower === true && condition.flags?.swim?.owner === true && swim.is_first_gm()) {
            for (let targetID of condition.flags.swim.targets) {
                const playerScene = game.scenes.get(game.users.get(userID).viewedScene)
                const token = playerScene.tokens.get(targetID)
                const effect = token.actor.effects.find(ae => ae.flags?.swim?.maintenanceID === condition.flags?.swim?.maintenanceID)
                if (effect) {
                    await effect.delete()
                }
            }
        }
        // Cancel Summoned Creature
        if (condition.flags?.swim?.maintainedSummon === true && swim.is_first_gm()) {
            if (condition.flags.swim.owner === false) {
                for (let each of game.scenes.current.tokens) {
                    const maintEffect = each.actor ? each.actor.effects.find(e => e.flags?.swim?.maintenanceID === condition.flags?.swim?.maintenanceID) : each.actorData.effects.find(e => e.flags?.swim?.maintenanceID === condition.flags?.swim?.maintenanceID)
                    if (maintEffect) {
                        await maintEffect.delete()
                    }
                }
                if (actor.sheet.rendered) {
                    actor.sheet.close();
                    await swim.wait('100')
                }
                const token = actor.token ? actor.token : game.scenes.current.tokens.find(t => t.flags?.swim?.maintenanceID === condition.flags?.swim?.maintenanceID)
                const dismissData = [token.id]
                await play_sfx(dismissData)
                await warpgate.dismiss(token.id, game.scenes.current.id)
                await delete_mirror(condition.flags?.swim?.maintenanceID)
            } else if (condition.flags.swim.owner === true) {
                for (let each of game.scenes.current.tokens) {
                    const maintEffect = each.actor ? each.actor.effects.find(e => e.flags?.swim?.maintenanceID === condition.flags?.swim?.maintenanceID) : each.actorData.effects.find(e => e.flags?.swim?.maintenanceID === condition.flags?.swim?.maintenanceID)
                    if (maintEffect) {
                        const dismissData = [each.id]
                        await play_sfx(dismissData)
                        await warpgate.dismiss(each.id, game.scenes.current.id)
                        await delete_mirror(condition.flags?.swim?.maintenanceID)
                        return
                    }
                }
            }
            async function delete_mirror(maintenanceID) {
                //Also check if it was a mirrored self and delete the corresponding actor:
                const mirrorActor = game.actors.find(a => a.flags?.swim?.maintenanceID === maintenanceID)
                if (mirrorActor) {
                    await mirrorActor.delete()
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
        if (condition.flags?.succ?.conditionId === "torch" && game.user.id === userID) {
            if (condition.flags?.swim?.deactivatedFromMacro === true) { return } //Prevent second execution if macro was used.
            swim.token_vision(condition)
        }
        // Hold
        /*
        if (condition.flags?.succ?.conditionId === "holding" && game.user.id === userID) {
            if (game.combat) {
                const tokens = actor.getActiveTokens()
                const currentCardValue = game.combat.combatant.flags.swade.cardValue
                const currentSuitValue = game.combat.combatant.flags.swade.suitValue
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
                                warpgate.event.notify("SWIM.updateCombat-previousTurn", { combatID: combatID })
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
        }*/
    })
}