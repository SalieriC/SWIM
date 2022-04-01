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
 * v. 2.0.2
 * By SalieriC
 ******************************************************/
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
    const officialClass = swim.get_official_class()

    let folder = game.folders.getName("Shape Change Presets");
    let content = folder.content;
    let totalContent = folder.children.reduce((acc, subFolder) => {
        acc = acc.concat(subFolder.content);
        return acc;
    }, content);

    async function main() {
        //Pre-selecting shape change actors based on rank:
        let scOptions;
        for (let each of totalContent) {
            let size = each.data.data.stats.size;
            let maxSize = 0;
            if (actor.data.data.advances?.value < 4) { maxSize = -1 }
            else if (actor.data.data.advances?.value < 8) { maxSize = 0 }
            else if (actor.data.data.advances?.value < 12) { maxSize = 2 }
            else if (actor.data.data.advances?.value < 16) { maxSize = 4 }
            else if (actor.data.data.advances?.value >= 16) { maxSize = 10 }
            //Selection for all shape change presets:
            if (size <= maxSize) {
                scOptions = scOptions + `<option value="${each.id}">${each.data.name}</option>`;
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
                            userID: game.user.id
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
    const tokenID = data.tokenID
    const token = canvas.tokens.get(tokenID)
    const actor = token.actor
    const mainFolder = data.mainFolder
    const userID = data.userID

    let folder = game.folders.getName("Shape Change Presets");
    let content = folder.content;
    let totalContent = folder.children.reduce((acc, subFolder) => {
        acc = acc.concat(subFolder.content);
        return acc;
    }, content);

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

            const scSize = scCopy.data.data.stats.size;

            await set_token_size(scCopy, scSize, raise);
            await set_tokenSettings(scCopy, originalID);
            await update_preset(scCopy, scSize, raise, originalID);
            // Now, add permission to scCopy if the requesting user doesn't have it (that should also ensure the user get the token selected automatically):
            //if (!scCopy.data.permissions[userID] || scCopy.data.permissions[userID] < 3 ) {
                let perms = duplicate(scCopy.data.permission)
                perms[userID] = 3
                await scCopy.update({permission: perms})
            //}
            await replace_token(scCopy);
            if (originalID) {
                actor.delete()
            }
        } else if (data.type === "revert") {
            const ownerActorID = data.ownerActorID
            const ownerActor = game.actors.get(ownerActorID)
            await update_pc(ownerActor);
            await replace_token(ownerActor);
            await actor.delete();
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
        /* Commented out because it overfills borders in an inconvenient way
        if (raise) {
            // Make the token a little larger on a raise.
            scale = scale * 1.25;
        }
        */
        await scCopy.update({token: {height: height, width: width, scale: scale}})
    }

    async function set_tokenSettings(scCopy, pcID) {
        let updateData = {
            "token.actorLink": actor.data.token.actorLink,
            "token.bar1.attribute": actor.data.token.bar1.attribute,
            "token.bar2.attribute": actor.data.token.bar2.attribute,
            "token.disposition": actor.data.token.disposition,
            "token.lockRotation": actor.data.token.lockRotation,
            "token.name": actor.data.token.name,
            "token.randomImg": actor.data.token.randomImg,
            "token.vision": actor.data.token.vision,
            "token.displayBars": actor.data.token.displayBars,
            "token.displayName": actor.data.token.displayName,
            "data.advances.value": actor.data.data.advances.value
        }
        await scCopy.update(updateData)
    }

    async function update_preset(scCopy, scSize, raise, pcID) {
        let pc = pcID ? game.actors.get(pcID) : actor;
        let src = pcID ? actor : pc;
        let maxWounds = pc.data.data.wounds.max;
        /* "The caster does not inherit extra Wounds when transforming[.]" Leaving it here anyway in case s/o wan't to change that.
        if (scSize >= 4 && scSize <= 7) {maxWounds = pc.data.data.wounds.max + 1}
        else if (scSize >= 8 && scSize <= 11) {maxWounds = pc.data.data.wounds.max + 2}
        else if (scSize >= 12) {maxWounds = pc.data.data.wounds.max + 3}
        */
        //Higher Die Type in case of a raise:
        let updateStr = scCopy.data.data.attributes.strength.die.sides;
        let updateVig = scCopy.data.data.attributes.vigor.die.sides;
        if (raise === true) {
            updateStr = updateStr + 2;
            updateVig = updateVig + 2;
        }
        let updateData = {
            "data.attributes.smarts.die.sides": pc.data.data.attributes.smarts.die.sides,
            "data.attributes.spirit.die.sides": pc.data.data.attributes.spirit.die.sides,
            "data.attributes.strength.die.sides": updateStr,
            "data.attributes.vigor.die.sides": updateVig,
            "data.bennies.max": pc.data.data.bennies.max,
            "data.fatigue.max": pc.data.data.fatigue.max,
            "data.wounds.max": maxWounds,
            "data.attributes.smarts.animal": pc.data.data.attributes.smarts.animal,
            "data.powerPoints.value": pc.data.data.powerPoints.value,
            "data.powerPoints.max": pc.data.data.powerPoints.max,
            "name": `${scCopy.data.name} (${pc.data.name})`,
        }

        let srcUpdates = {
            "data.bennies.value": src.data.data.bennies.value,
            "data.fatigue.value": src.data.data.fatigue.value,
            "data.wounds.value": src.data.data.wounds.value,
            "data.details.conviction.value": src.data.data.details.conviction.value,
            "data.details.conviction.active": src.data.data.details.conviction.active,
            "data.powerPoints.value": src.data.data.powerPoints.value,
            "data.details.archetype": `Shape Changed ${src.data.token.name}`,
            "data.wildcard": src.data.data.wildcard,
        }
        updateData = Object.assign(updateData, srcUpdates);

        //Doing Skills:
        let pcSkills = pc.data.items.filter(i => (i.data.type === "skill" && (i.data.data.attribute === "smarts" || i.data.data.attribute === "spirit")));
        let scSkills = scCopy.data.items.filter(i => (i.data.type === "skill" && (i.data.data.attribute === "smarts" || i.data.data.attribute === "spirit")));
        let skillsToCreate = pcSkills;
        for (let skill of scSkills) {
            let originalSkill = pcSkills.find(s => (s.data.name.toLowerCase() === skill.data.name.toLowerCase()));
            if (originalSkill) {
                await skill.update({
                    "data.die.sides": originalSkill.data.data.die.sides
                })
                let index = skillsToCreate.indexOf(originalSkill);
                if (index >= 0) {
                    skillsToCreate.splice(index, 1);
                }
            }
        }
        skillsToCreate = skillsToCreate.map(skill => skill.toObject()); //bring everything in order so foundry can create the items
        await scCopy.createEmbeddedDocuments('Item', skillsToCreate, { renderSheet: null });
        console.warn("'renderSheet: null' may be changed to 'renderSheet: true' in a future version of SWADE.")

        //Doing Edges, Hindrances & Powers:
        let itemsToCreate = pc.data.items.filter(i => (i.data.type === "edge" || i.data.type === "hindrance" || i.data.type === "power"));
        //Taking care of these annoying AB specific power points:
        for (let power of itemsToCreate.filter(p => (p.data.type === "power"))) {
            if (power.data.data.arcane) {
                let arcaneBackground = power.data.data.arcane;
                let ppUpdates = {
                    ['data.powerPoints.' + arcaneBackground + '.max']: src.data.data.powerPoints[arcaneBackground].max,
                    ['data.powerPoints.' + arcaneBackground + '.value']: src.data.data.powerPoints[arcaneBackground].value
                }
                updateData = Object.assign(updateData, ppUpdates)
            }
        }

        itemsToCreate = itemsToCreate.map(i => i.toObject());
        await scCopy.createEmbeddedDocuments('Item', itemsToCreate);

        //Finally making all the Updates:
        await scCopy.update(updateData)
    }

    async function replace_token(scCopy) {
        //Playing VFX & SFX:
        let shapeShiftSFX = game.settings.get(
            'swim', 'shapeShiftSFX');
        let shapeShiftVFX = game.settings.get(
            'swim', 'shapeShiftVFX');
        if (shapeShiftSFX) { AudioHelper.play({ src: `${shapeShiftSFX}` }, true); }
        if (game.modules.get("sequencer")?.active && shapeShiftVFX) {
            //let tokenD = canvas.tokens.controlled[0];
            let scale = scCopy.data.token.scale;
            let sequence = new Sequence()
                .effect()
                .file(`${shapeShiftVFX}`) //recommendation: "modules/jb2a_patreon/Library/2nd_Level/Misty_Step/MistyStep_01_Regular_Green_400x400.webm"
                .atLocation(token)
                .scale(scale)
            sequence.play();
            await swim.wait(`800`);
        }
        //Replacing the token using WardGate:
        let newTokenID = await warpgate.spawnAt(token.center, scCopy.data.name)
        if (token.combatant != null) {
            let oldCombatData = token.combatant.toObject()
            await update_combat(newTokenID, oldCombatData)
        }
        await warpgate.dismiss(token.id)
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
            "data.bennies.value": npc.data.data.bennies.value,
            "data.fatigue.value": npc.data.data.fatigue.value,
            "data.wounds.value": npc.data.data.wounds.value,
            "data.details.conviction.value": npc.data.data.details.conviction.value,
            "data.details.conviction.active": npc.data.data.details.conviction.active,
            "data.powerPoints.value": npc.data.data.powerPoints.value,
        })
    }

    main()
}

