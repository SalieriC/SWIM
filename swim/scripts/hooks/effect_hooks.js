export async function effect_hooks() {
    // Close the open character sheet(s) of a dismissed summoned creature, on EVERY client (players too).
    // Only the sheet of the summoned token's own synthetic actor is closed, never the summoner's sheet.
    Hooks.on(`deleteToken`, (tokenDoc) => {
        const actor = tokenDoc.actor
        if (!actor) return
        // Unlinked tokens own a synthetic actor that disappears with the token (summoned creatures are always unlinked).
        // Linked tokens share the world actor's sheet (e.g. the summoner's own), which must stay open.
        if (tokenDoc.actorLink) return
        for (const app of Object.values(actor.apps ?? {})) {
            if (app.rendered) app.close()
        }
    })
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
                let effect
                try {
                    effect = token.actor.effects.find(ae => ae.flags?.swim?.maintenanceID === condition.flags?.swim?.maintenanceID)
                } catch (err) {
                    console.error(err)
                }
                if (effect) {
                    await effect.delete()
                }
            }
        }
        // Cancel Summoned Creature
        if (condition.flags?.swim?.maintainedSummon === true && swim.is_first_gm()) {
            if (condition.flags.swim.owner === false) {
                for (let each of game.scenes.current.tokens) {
                    const maintEffect = each.actor?.effects.find(e => e.flags?.swim?.maintenanceID === condition.flags?.swim?.maintenanceID)
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
                token.delete()
                await delete_mirror(condition.flags?.swim?.maintenanceID)
            } else if (condition.flags.swim.owner === true) {
                for (let each of game.scenes.current.tokens) {
                    const maintEffect = each.actor?.effects.find(e => e.flags?.swim?.maintenanceID === condition.flags?.swim?.maintenanceID)
                    if (maintEffect) {
                        const dismissData = [each.id]
                        await play_sfx(dismissData)
                        await each.delete()
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
    })
}