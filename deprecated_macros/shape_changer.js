/*******************************************************
 * SWADE Immersive Macros (SWIM) proudly presents:
 * The Shape Change Macro.
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
 * v. 1.1.1
 ******************************************************/

if (!token || canvas.tokens.controlled.length > 1) {
    ui.notifications.error("Please select a single token first.");
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
let officialClass = '<div>'
if (game.modules.get("swpf-core-rules")?.active) { officialClass = '<div class="swade-core">' }
else if (game.modules.get("deadlands-core-rules")?.active) { officialClass = '<div class="swade-core">' }
else if (game.modules.get("sprawl-core-rules")?.active) { officialClass = '<div class="sprawl-core">' }
else if (game.modules.get("swade-core-rules")?.active) { officialClass = '<div class="swade-core">' }

let folder = game.folders.getName("Shape Change Presets");
let content = folder.content;
let totalContent = folder.children.reduce((acc, subFolder) => {
    acc = acc.concat(subFolder.content);
    return acc;
}, content);

async function set_token_size(scCopy, scSize) {
    console.log("Hello World")
    if (scSize <= 2 && scSize >= 0) {
        await scCopy.update({token: {height: 1, width: 1, scale: 1}})
    } else if (scSize <= 5 && scSize >= 3) {
        await scCopy.update({token: {height: 2, width: 2, scale: 1}})
    } else if (scSize <= 8 && scSize >= 6) {
        await scCopy.update({token: {height: 4, width: 4, scale: 1}})
    } else if (scSize <= 11 && scSize >= 9) {
        await scCopy.update({token: {height: 8, width: 8, scale: 1}})
    } else if (scSize > 11) {
        await scCopy.update({token: {height: 16, width: 16, scale: 1}})
    } else if (scSize === -1) {
        await scCopy.update({token: {height: 1, width: 1, scale: 0.85}})
    } else if (scSize === -2) {
        await scCopy.update({token: {height: 1, width: 1, scale: 0.75}})
    } else if (scSize === -3) {
        await scCopy.update({token: {height: 1, width: 1, scale: 0.6}})
    } else if (scSize <= -4) {
        await scCopy.update({token: {height: 1, width: 1, scale: 0.5}})
    }
}

async function set_tokenSettings(scCopy, pcID) {
    let pc = actor;
    if (pcID) {
        pc = game.actors.get(pcID)
        carry = actor;
    }
    let updateData;
    if (pcID) {
        updateData = {
            "token.actorLink": carry.data.token.actorLink,
            "token.bar1.attribute": carry.data.token.bar1.attribute,
            "token.bar2.attribute": carry.data.token.bar2.attribute,
            "token.disposition": carry.data.token.disposition,
            "token.lockRotation": carry.data.token.lockRotation,
            "token.name": carry.data.token.name,
            "token.randomImg": carry.data.token.randomImg,
            "token.vision": carry.data.token.vision,
            "token.displayBars": carry.data.token.displayBars,
            "token.displayName": carry.data.token.displayName,
            "data.advances.value": carry.system.advances.value
        }
    } else {
        updateData = {
            "token.actorLink": pc.data.token.actorLink,
            "token.bar1.attribute": pc.data.token.bar1.attribute,
            "token.bar2.attribute": pc.data.token.bar2.attribute,
            "token.disposition": pc.data.token.disposition,
            "token.lockRotation": pc.data.token.lockRotation,
            "token.name": pc.data.token.name,
            "token.randomImg": pc.data.token.randomImg,
            "token.vision": pc.data.token.vision,
            "token.displayBars": pc.data.token.displayBars,
            "token.displayName": pc.data.token.displayName,
            "data.advances.value": pc.system.advances.value
        }
    }
    await scCopy.update(updateData)
}

async function update_preset(scCopy, scSize, raise, pcID) {
    let pc = actor;
    if (pcID) {
        pc = game.actors.get(pcID)
        carry = actor;
    }
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
        "data.attributes.smarts.die.sides": pc.system.attributes.smarts.die.sides,
        "data.attributes.spirit.die.sides": pc.system.attributes.spirit.die.sides,
        "data.attributes.strength.die.sides": updateStr,
        "data.attributes.vigor.die.sides": updateVig,
        "data.bennies.max": pc.system.bennies.max,
        "data.fatigue.max": pc.system.fatigue.max,
        "data.wounds.max": maxWounds,
        "data.attributes.smarts.animal": pc.system.attributes.smarts.animal,
        "data.powerPoints.value": pc.system.powerPoints.value,
        "data.powerPoints.max": pc.system.powerPoints.max,
    }
    if (pcID) {
        let carryUpdates = {
            "data.bennies.value": carry.system.bennies.value,
            "data.fatigue.value": carry.system.fatigue.value,
            "data.wounds.value": carry.system.wounds.value,
            "data.details.conviction.value": carry.system.details.conviction.value,
            "data.details.conviction.active": carry.system.details.conviction.active,
            "data.powerPoints.value": carry.system.powerPoints.value,
            "data.details.archetype": `Shape Changed ${carry.data.token.name}`,
            "data.wildcard": carry.system.wildcard,
            "name": `${scCopy.data.name} (${carry.data.name})`
        }
        updateData = Object.assign(updateData, carryUpdates)
    } else {
        let pcUpdates = {
            "data.bennies.value": pc.system.bennies.value,
            "data.fatigue.value": pc.system.fatigue.value,
            "data.wounds.value": pc.system.wounds.value,
            "data.details.archetype": `Shape Changed ${pc.data.token.name}`,
            "data.details.conviction.value": pc.system.details.conviction.value,
            "data.details.conviction.active": pc.system.details.conviction.active,
            "data.wildcard": pc.system.wildcard,
            "name": `${scCopy.data.name} (${pc.data.name})`,
            "data.powerPoints.value": pc.system.powerPoints.value
        }
        updateData = Object.assign(updateData, pcUpdates)
    }

    //Doing Skills:
    let pcSkills = pc.data.items.filter(i => (i.data.type === "skill" && (i.system.attribute === "smarts" || i.system.attribute === "spirit")));
    let scSkills = scCopy.data.items.filter(i => (i.data.type === "skill" && (i.system.attribute === "smarts" || i.system.attribute === "spirit")));
    let skillsToCreate = pcSkills;
    for (let skill of scSkills) {
        let originalSkill = pcSkills.find(s => (s.data.name.toLowerCase() === skill.data.name.toLowerCase()));
        if (originalSkill) {
            await skill.update({
                "data.die.sides": originalSkill.system.die.sides
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
        if (power.system.arcane) {
            let arcaneBackground = power.system.arcane;
            let ppUpdates;
            if (pcID) {
                ppUpdates = {
                    ['data.powerPoints.' + arcaneBackground + '.max']: carry.system.powerPoints[arcaneBackground].max,
                    ['data.powerPoints.' + arcaneBackground + '.value']: carry.system.powerPoints[arcaneBackground].value
                }
            } else {
                ppUpdates = {
                    ['data.powerPoints.' + arcaneBackground + '.max']: pc.system.powerPoints[arcaneBackground].max,
                    ['data.powerPoints.' + arcaneBackground + '.value']: pc.system.powerPoints[arcaneBackground].value
                }
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
    let tokenD = canvas.tokens.controlled[0];
    let sequence = new Sequence()
        .effect()
        .file(`${shapeShiftVFX}`) //recommendation: "modules/jb2a_patreon/Library/2nd_Level/Misty_Step/MistyStep_01_Regular_Green_400x400.webm"
        .atLocation(tokenD)
        .scale(1)
    sequence.play();
    await wait(`800`);
    }
    //Replacing the token using WardGate:
    await warpgate.spawnAt(token.center, scCopy.data.name)
    await warpgate.dismiss(token.id)
}

async function wait(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

async function update_pc(ownerActor) {
    const npc = actor;
    await ownerActor.update({
        "data.bennies.value": npc.system.bennies.value,
        "data.fatigue.value": npc.system.fatigue.value,
        "data.wounds.value": npc.system.wounds.value,
        "data.details.conviction.value": npc.system.details.conviction.value,
        "data.details.conviction.active": npc.system.details.conviction.active,
        "data.powerPoints.value": npc.system.powerPoints.value,
    })
}

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
                    let scPreset = totalContent.find(a => (a.id === scID)).toObject();
                    //Creating a copy of the preset:
                    scPreset.folder = mainFolder.id
                    let scCopy = await Actor.create(scPreset);

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

                    //Fetching raise and size:
                    const raise = html.find(`#raise`)[0].checked;
                    const scSize = scCopy.system.stats.size;

                    await set_token_size(scCopy, scSize);
                    await set_tokenSettings(scCopy, originalID);
                    await update_preset(scCopy, scSize, raise, originalID);
                    await replace_token(scCopy);
                    if (originalID) {
                        await actor.delete();
                    }
                }
            },
            two: {
                label: `<i class="fas fa-user-alt"></i>Revert form`,
                callback: async () => {
                    const ownerActorID = actor.getFlag('swim', 'scOwner')
                    const ownerActor = game.actors.get(ownerActorID)
                    await update_pc(ownerActor);
                    await replace_token(ownerActor);
                    await actor.delete();
                }
            }
        },
        default: "one",
    }).render(true);
}

main();
