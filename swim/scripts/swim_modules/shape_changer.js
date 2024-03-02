/*******************************************************
 * SWADE Immersive Macros (SWIM) proudly presents:
 * The Shape Changer Macro.
 * This macro tries to handle everything relevant to the
 * Shape Change power in SWADE. It is in early stages,
 * so bugs may occur. Please create a ticket on the
 * gitHub if you find any problems with it:
 * https://github.com/SalieriC/SWADE-Immersive-Macros/issues/new
 * 
 * This macro requires Warp Gate by honeybadger:
 * https://foundryvtt.com/packages/warpgate
 * 
 * The Macro natively supports Sound Effects and if you
 * are using the Sequencer module by Wasp 
 * (https://foundryvtt.com/packages/sequencer), you can
 * also play a visual effect. SFX and VFX are configured
 * in the module settings of SWIM.
 * 
 * v. 2.3.0
 * By SalieriC
 ******************************************************/

import * as SWIM from '../constants.js'

export async function shape_changer_script() {
    const { speaker, _, __, token } = await swim.get_macro_variables()
    if (!token || canvas.tokens.controlled.length > 1) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
        return;
    }
    const actor = token.actor;

    if (!game.modules.get("warpgate")?.active) {
        ui.notifications.error("Please install and activate Warp Gate to use this macro. See the console for more details.");
        console.error("The SWIM Shape Changer macro requires Warp Gate by honeybadger. It is needed to replace the token. Please install and activate Warp Gate to use the Shape Changer macro: https://foundryvtt.com/packages/warpgate - If you enjoy Warp Gate please consider donating to honeybadger at his KoFi page: https://ko-fi.com/trioderegion")
        return;
    }

    const mainFolder = game.folders.getName("[SWIM] Shape Changing");
    if (!mainFolder) {
        ui.notifications.error("Please import and set up the '[SWIM] Shape Change Presets' folder from the compendium first.");
        return;
    }

    //Set div class based on enabled official module:
    const officialClass = await swim.get_official_class()

    let totalContent = swim.get_folder_content("Shape Change Presets")
    totalContent.sort(function (a, b) {
        let textA = a.name.toUpperCase()
        let textB = b.name.toUpperCase()
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0
    });
    totalContent.sort(function (a, b) {
        let textA = a.system.stats.size
        let textB = b.system.stats.size
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0
    });

    async function main() {
        //Pre-selecting shape change actors based on rank:
        let scOptions;
        for (let each of totalContent) {
            let size = each.system.stats.size;
            let maxSize = 0;
            if (actor.system.advances?.value < 4) { maxSize = -1 }
            else if (actor.system.advances?.value < 8) { maxSize = 0 }
            else if (actor.system.advances?.value < 12) { maxSize = 2 }
            else if (actor.system.advances?.value < 16) { maxSize = 4 }
            else if (actor.system.advances?.value >= 16) { maxSize = 10 }
            if (game.settings.get("swim", "ignoreShapeChangeSizeRule") === true) { maxSize = 999 }
            //Selection for all shape change presets:
            if (size <= maxSize || game.user.isGM === true) {
                scOptions = scOptions + `<option value="${each.id}">${each.name} [${game.i18n.localize("SWADE.Size")}: ${each.system.stats.size}]</option>`;
            }
        }

        new Dialog({
            title: 'Shape Change',
            content: `${officialClass}
            <p>Are you shape changing into another creature or are you reverting back to your normal form?</p>
            <p>If you are shape changing please select a creature to change into:</p>
            <div class="form-group">
                <label for="selected_sc">Target form: </label>
                <select id="selected_sc">${scOptions}</select>
            </div>
            <div class="form-group">
                <label for="raise">Cast with a raise: </label>
                <input id="raise" name="raiseBox" type="checkbox"></input>
            </div>
            </div>`,
            buttons: {
                one: {
                    label: `<i class="fas fa-paw"></i>Shape Change`,
                    callback: async (html) => {
                        //Get actor based on provided ID:
                        const scID = html.find(`#selected_sc`)[0].value;
                        //Fetching raise:
                        const raise = html.find(`#raise`)[0].checked;

                        // Can't send documents (like actors) via the event system, so send the IDs instead, getting the documents in the GM code.
                        let data = {
                            type: "change", //or "revert"
                            raise: raise,
                            actorID: actor.id,
                            scID: scID,
                            mainFolder: mainFolder,
                            tokenID: token.id,
                            userID: game.user.id,
                            sceneID: game.scenes.current._id
                        }
                        warpgate.event.notify("SWIM.shapeChanger", data)
                    }
                },
                two: {
                    label: `<i class="fas fa-user-alt"></i>Revert form`,
                    callback: async () => {
                        const ownerActorID = actor.getFlag('swim', 'scOwner')
                        let data = {
                            type: "revert", //or "change"
                            actorID: actor.id,
                            mainFolder: mainFolder,
                            tokenID: token.id,
                            ownerActorID: ownerActorID,
                            userID: game.user.id,
                            sceneID: game.scenes.current._id
                        }
                        warpgate.event.notify("SWIM.shapeChanger", data)
                    }
                }
            },
            default: "one",
        }).render(true);
    }
    main();
}

export async function shape_changer_gm(data) {
    const sceneID = data.sceneID
    if (sceneID != game.scenes.current._id) {
        const user = game.users.get(data.userID)
        const scene = game.scenes.get(sceneID)
        ui.notifications.warn(game.i18n.format("SWIM.notification.shapeChangeOnOtherScene", {
            userName: user.name,
            sceneName: scene.name
        }), { permanent: true })
        return
    }
    const tokenID = data.tokenID
    const token = canvas.tokens.get(tokenID)
    const actor = token.actor
    //const mainFolder = data.mainFolder
    const mainFolder = game.folders.getName("[SWIM] Shape Changing");
    if (!mainFolder) {
        ui.notifications.error("Please import and set up the '[SWIM] Shape Change Presets' folder from the compendium first.");
        return;
    }
    const userID = data.userID

    let totalContent = swim.get_folder_content("Shape Change Presets")

    async function main() {
        if (data.type === "change") {
            const raise = data.raise
            const scID = data.scID
            let scPreset = totalContent.find(a => (a.id === scID)).toObject();
            //Creating a copy of the preset:
            scPreset.folder = mainFolder.id
            let scCopy = await Actor.create(scPreset)

            //Saving the original actor ID to allow reverting.
            let originalID = actor.getFlag('swim', 'scOwner');

            //Failsafe to prevent setting the wrong actor ID in case of shape changing from one creature into another:
            if (originalID) {
                scCopy.setFlag('swim', 'scOwner', originalID);
                //pcID = originalID;
            } else {
                scCopy.setFlag('swim', 'scOwner', actor.id);
                originalID = false;
            }

            const scSize = scCopy.system.stats.size;

            await set_token_size(scCopy, scSize, raise);
            await set_tokenSettings(scCopy, originalID);
            await update_preset(scCopy, scSize, raise, originalID);
            // Now, add permission to scCopy by copying permissions of the original actor (that should also ensure the user get the token selected automatically):
            let perms = duplicate(actor.ownership)
            await scCopy.update({"ownership": perms})

            await update_linked_actor(scCopy._id, actor._id) //Update the linked actor on user if it's not a GM account.

            await replace_token(scCopy);
            if (originalID) {
                actor.delete()
            }
        } else if (data.type === "revert") {
            const ownerActorID = data.ownerActorID
            const ownerActor = game.actors.get(ownerActorID)
            await update_pc(ownerActor);
            await replace_token(ownerActor);
            await update_linked_actor(ownerActorID, data.actorID) //Update the linked actor on user if it's not a GM account.
            await game.actors.get(actor._id).delete() //For whatever reason actor.delete() doesn't work here.
        } else {
            console.error("Invalid shape change request from player.")
        }
    }

    async function set_token_size(scCopy, scSize) {
        let height = 1;
        let width = 1;
        let scale = 1;

        if (scSize <= 2 && scSize >= 0) {
            // defaults
        } else if (scSize <= 5 && scSize >= 3) {
            height = width = 2;
        } else if (scSize <= 8 && scSize >= 6) {
            height = width = 4;
        } else if (scSize <= 11 && scSize >= 9) {
            height = width = 8;
        } else if (scSize > 11) {
            height = width = 16;
        } else if (scSize === -1) {
            scale = 0.85
        } else if (scSize === -2) {
            scale = 0.75
        } else if (scSize === -3) {
            scale = 0.6
        } else if (scSize <= -4) {
            scale = 0.5
        }

        // Make the token a little larger on a raise.
        if (data.raise) {
            let multiplier = game.settings.get('swim', 'shapeChange-raiseScaleMultiplier');
            // Ensure that if anything goes wrong, default to same size.
            if (!multiplier || multiplier < SWIM.RAISE_SCALE_MIN ||
                 multiplier > SWIM.RAISE_SCALE_MAX) {
                multiplier = 1;
            }
            scale = scale * multiplier;
        }

        await scCopy.update({token: {height: height, width: width, scale: scale}})
    }

    async function set_tokenSettings(scCopy, pcID) {
        let updateData = {
            "prototypeToken.actorLink": actor.prototypeToken.actorLink,
            "prototypeToken.bar1.attribute": actor.prototypeToken.bar1.attribute,
            "prototypeToken.bar2.attribute": actor.prototypeToken.bar2.attribute,
            "prototypeToken.disposition": actor.prototypeToken.disposition,
            "prototypeToken.lockRotation": actor.prototypeToken.lockRotation,
            "prototypeToken.name": actor.prototypeToken.name,
            "prototypeToken.randomImg": actor.prototypeToken.randomImg,
            //"prototypeToken.sight": actor.prototypeToken.sight, //Not sure this is a good idea because it updates sight even for creatures with superior sight. Without it though, it needs to be properly configured beforehand though...
            "prototypeToken.displayBars": actor.prototypeToken.displayBars,
            "prototypeToken.displayName": actor.prototypeToken.displayName,
            "prototypeToken.alpha": 1, //SWIM.ALMOST_INVISIBLE,
            "system.advances.value": actor.system.advances.value,
        }
        await scCopy.update(updateData)
    }

    async function update_preset(scCopy, scSize, raise, pcID) {
        let pc = pcID ? game.actors.get(pcID) : actor;
        let src = pcID ? actor : pc;
        let maxWounds = pc.system.wounds.max;
        /* "The caster does not inherit extra Wounds when transforming[.]" Leaving it here anyway in case s/o wan't to change that.
        if (scSize >= 4 && scSize <= 7) {maxWounds = pc.system.wounds.max + 1}
        else if (scSize >= 8 && scSize <= 11) {maxWounds = pc.system.wounds.max + 2}
        else if (scSize >= 12) {maxWounds = pc.system.wounds.max + 3}
        */
        //Higher Die Type in case of a raise:
        let updateStr = scCopy.system.attributes.strength.die.sides;
        let updateVig = scCopy.system.attributes.vigor.die.sides;
        if (raise === true) {
            updateStr = updateStr + 2;
            updateVig = updateVig + 2;
        }
        let updateData = {
            "system.attributes.smarts.die.sides": pc.system.attributes.smarts.die.sides,
            "system.attributes.spirit.die.sides": pc.system.attributes.spirit.die.sides,
            "system.attributes.strength.die.sides": updateStr,
            "system.attributes.vigor.die.sides": updateVig,
            "system.bennies.max": pc.system.bennies.max,
            "system.fatigue.max": pc.system.fatigue.max,
            "system.wounds.max": maxWounds,
            "system.attributes.smarts.animal": pc.system.attributes.smarts.animal,
            "system.powerPoints.value": pc.system.powerPoints.value,
            "system.powerPoints.max": pc.system.powerPoints.max,
            "name": `${scCopy.name} (${pc.name})`,
            "type": pc.type
        }

        let srcUpdates = {
            "system.bennies.value": src.system.bennies.value,
            "system.fatigue.value": src.system.fatigue.value,
            "system.wounds.value": src.system.wounds.value,
            "system.details.conviction.value": src.system.details.conviction.value,
            "system.details.conviction.active": src.system.details.conviction.active,
            "system.powerPoints.value": src.system.powerPoints.value,
            "system.details.archetype": `Shape Changed ${src.prototypeToken.name}`,
            "system.wildcard": src.system.wildcard,
        }
        updateData = Object.assign(updateData, srcUpdates);

        //Doing Skills:
        let pcSkills = pc.items.filter(i => (i.type === "skill" && (i.system.attribute === "smarts" || i.system.attribute === "spirit")));
        let scSkills = scCopy.items.filter(i => (i.type === "skill" && (i.system.attribute === "smarts" || i.system.attribute === "spirit")));
        let skillsToCreate = pcSkills;
        for (let skill of scSkills) {
            let originalSkill = pcSkills.find(s => (s.name.toLowerCase() === skill.name.toLowerCase()));
            if (originalSkill) {
                await skill.update({
                    "system.die.sides": originalSkill.system.die.sides
                })
                let index = skillsToCreate.indexOf(originalSkill);
                if (index >= 0) {
                    skillsToCreate.splice(index, 1);
                }
            }
        }
        skillsToCreate = skillsToCreate.map(skill => skill.toObject()); //bring everything in order so foundry can create the items
        await scCopy.createEmbeddedDocuments('Item', skillsToCreate, { renderSheet: null });
        //console.warn("'renderSheet: null' may be changed to 'renderSheet: true' in a future version of SWADE.")

        //Doing Edges, Hindrances & Powers:
        let itemsToCreate = pc.items.filter(i => (i.type === "edge" || i.type === "hindrance" || i.type === "power"));
        //Taking care of these annoying AB specific power points:
        for (let power of itemsToCreate.filter(p => (p.type === "power"))) {
            if (power.system.arcane) {
                let arcaneBackground = power.system.arcane;
                let ppUpdates = {
                    ['system.powerPoints.' + arcaneBackground + '.max']: src.system.powerPoints[arcaneBackground].max,
                    ['system.powerPoints.' + arcaneBackground + '.value']: src.system.powerPoints[arcaneBackground].value
                }
                updateData = Object.assign(updateData, ppUpdates)
            }
        }

        itemsToCreate = itemsToCreate.map(i => i.toObject());
        await scCopy.createEmbeddedDocuments('Item', itemsToCreate);

        //Finally making all the Updates:
        await scCopy.update(updateData)
    }

    function decimal(num, places) {
        let power = 10 ** places;
        return  parseInt(num * power) / power;
    }

    async function replace_token(scCopy) {
        // Play SFX:
        let shapeShiftSFX = game.settings.get('swim', 'shapeShiftSFX');
        if (shapeShiftSFX) { AudioHelper.play({ src: `${shapeShiftSFX}` }, true); }
        // Play VFX:
        let shapeShiftVFX = game.settings.get('swim', 'shapeShiftVFX');
        if (shapeShiftVFX && game.modules.get("sequencer")?.active) {
            // Initiate special effects at the token location
            let scaleX = scCopy.prototypeToken.texture.scaleX;
            let scaleY = scCopy.prototypeToken.texture.scaleY;
            let scale = scaleX * scaleY
            let sequence = new Sequence()
                .effect()
                .file(`${shapeShiftVFX}`) //recommendation: "modules/jb2a_patreon/Library/2nd_Level/Misty_Step/MistyStep_01_Regular_Green_400x400.webm"
                .atLocation(token)
                .scale(scale)
            sequence.play();
            await swim.wait(`100`);
        }
        // Make new token very opaque.
        // Spawns the new token using WarpGate
        let newTokenID = await warpgate.spawnAt(token.center, scCopy.name, {
            //'alpha': SWIM.ALMOST_INVISIBLE, //- disabled until further investigation.
            'actorId': scCopy.id,
            } );
        let newToken = canvas.tokens.get(newTokenID[0]);
        // When shifting to the same creature, WarpGate wants to use the old actor ID.
        // Set it to the newly created actor, otherwise the incorrect actor gets deleted!
        newToken.document.update({'actorId': scCopy.id});
        // Adding elevation of the original token to the new token
        await newToken.document.update( { 'elevation': token.document.elevation } );
        // Update combatant info if a combat exists
        if (token.combatant != null) {
            let oldCombatData = token.combatant.toObject()
            await update_combat(newTokenID, oldCombatData)
        }
        // Morph the tokens from old to new.
        await morph_tokens(token, newToken, scCopy);
        // Remove the old token
        await warpgate.dismiss(token.id)
        // For GM, need to manually set the focus; include a short delay to allow the new token to appear.
        if (game.user.isGM === true) {
            await swim.wait(`100`);
            await newToken.control();
        }
    }

    async function morph_tokens(oldToken, newToken, scCopy) {
        // Adjust attributes of each token so the old appears to morph into the new.
        let oldUpdate;
        let newUpdate;
        // Alpha (opacity):
        let oldAlpha = oldToken.alpha;
        let newAlpha = SWIM.ALMOST_INVISIBLE;
        // Scale:
        let oldScaleX = oldToken.document.texture.scaleX
        let oldScaleY = oldToken.document.texture.scaleY
        // When shifting to the same creature, WarpGate wants to use the old actor ID, which has the old scale.
        // Use the scale as calculated for the desired shape change data.
        let newScaleX = scCopy.prototypeToken.texture.scaleX
        let newScaleY = scCopy.prototypeToken.texture.scaleY
        // How much to adjust each attribute per iteration is the difference between the two, divided by the number of iterations (+1).
        let NUM_MORPHS = game.settings.get("swim", "shapeChange-numMorphs");
        let alphaAdj = decimal((newAlpha - oldAlpha) / (NUM_MORPHS + 1), 4);
        let scaleAdjX = decimal((newScaleX - oldScaleX) / (NUM_MORPHS + 1), 4);
        let scaleAdjY = decimal((newScaleY - oldScaleY) / (NUM_MORPHS + 1), 4);
        //console.warn('alpha: adj ' + alphaAdj + ' old ' + oldAlpha + ' new ' + newAlpha);
        //console.warn('scale: adj ' + scaleAdj + ' old ' + oldScale + ' new ' + newScale);
        for (let i=0; i<NUM_MORPHS; i++) {
            // Opacity of both tokens are done in reverse (one fades in, the other out).
            oldAlpha = decimal(oldAlpha + alphaAdj, 4);
            newAlpha = decimal(newAlpha - alphaAdj, 4);
            // For scale, only change the old token.
            oldScaleX = decimal(oldScaleX + scaleAdjX, 4);
            oldScaleY = decimal(oldScaleY + scaleAdjY, 4);
            // Set token attribute structure values.
            oldUpdate = { 'alpha': oldAlpha, 'texture.scaleX': Number(oldScaleX.toFixed(10)), 'texture.scaleY': Number(oldScaleY.toFixed(10)) };
            newUpdate = { 'alpha': newAlpha, 'texture.scaleX': Number(newScaleX.toFixed(10)), 'texture.scaleY': Number(newScaleY.toFixed(10)) };
            // Now apply them.
            await oldToken.document.update(oldUpdate);
            await newToken.document.update(newUpdate);
            //console.warn('alpha: old ' + oldAlpha + ' new ' + newAlpha + '  scale: old ' + oldScale + ' new ' + newScale);
        }
        // Final token setting (only need to do new token).
        newUpdate = { 'alpha': 1, 'texture.scaleX': newToken.document.scaleX, 'texture.scaleY': newToken.document.scaleY };
        await newToken.document.update(newUpdate);
    }

    async function update_combat(newTokenID, oldCombatData) {
        let newToken = canvas.tokens.get(newTokenID[0])
        await newToken.toggleCombat()
        let combatData = newToken.combatant.toObject()
        combatData.flags = oldCombatData.flags
        combatData.initiative = oldCombatData.initiative
        await newToken.combatant.update(combatData)
    }

    async function update_pc(ownerActor) {
        const npc = actor;
        await ownerActor.update({
            "system.bennies.value": npc.system.bennies.value,
            "system.fatigue.value": npc.system.fatigue.value,
            "system.wounds.value": npc.system.wounds.value,
            "system.details.conviction.value": npc.system.details.conviction.value,
            "system.details.conviction.active": npc.system.details.conviction.active,
            "system.powerPoints.value": npc.system.powerPoints.value,
        })
    }

    async function update_linked_actor(newActorId, oldActorId) {
        const user = game.users.get(userID)
        if (user.isGM) { return } //Don't want to link actors for GMs.
        else if (user.character._id === oldActorId) { //only update the linked actor, if the old one is currently linked. This prevents linkind actor when shape changing other tokens the user controls.
            await user.update({"character": newActorId})
        }
    }

    main()
}

