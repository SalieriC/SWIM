// Getting NPC ammo usage from game settings
const npcAmmo = game.settings.get(
    'swim', 'npcAmmo');

checkWeapon();

async function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function checkWeapon() {
    //Don't execute the macro on a reroll by checking if the old_rolls is empty:
    if (message.data.flags['betterrolls-swade2'].render_data.trait_roll.old_rolls.length >= 1) { return; }
    //Check whether or not the weapon is suitable for the shooting macro
    if (
        (item.type === "weapon" &&
            //i.data.data.range !== "0" && i.data.data.range !== "" &&
            item.data.data.ammo.trim() !== "" &&
            item.data.data.quantity > 0) ||
        (item.type === "weapon" &&
            //i.data.data.range !== "0" && i.data.data.range !== "" &&
            item.data.data.additionalStats.isConsumable &&
            item.data.data.additionalStats.isConsumable.value === true /*&&
            //Ignore quantity to get a notification below for BR2 integration.
            item.data.data.quantity > 0*/)
    ) { shoot(); }
    else { return; }
}

async function shoot() {
    //let [shots, weapon, ammo, sil] = getValues(html);
    let item_weapon = item;
    //Stop if the item is not a weapon:
    if (item_weapon.type != "weapon") { return; }
    //Get ammo loaded in the weapon and amount of shots provided by BR2 as well as a silenced state:
    let item_ammo;
    if (item_weapon.data.data.additionalStats.loadedAmmo) {
        let loaded_ammo = item_weapon.data.data.additionalStats.loadedAmmo.value;
        item_ammo = actor.items.getName(`${loaded_ammo}`);
    }
    //Setting the amount of shots based on RoF:
    let traitDice = message.data.flags['betterrolls-swade2'].render_data.trait_roll.dice;
    //console.log(traitDice);
    console.log(message.data.flags['betterrolls-swade2'].render_data);
    let rate_of_fire = traitDice.length;
    if (actor.data.data.wildcard === true) { rate_of_fire = rate_of_fire - 1; }
    //console.log(rate_of_fire);
    let shots = message.data.flags['betterrolls-swade2'].render_data.used_shots;
    //failsafe to guss amount of shots in case BR2 return zero or undefined:
    if (shots === 0 || !shots) {
        if (rate_of_fire === 1) { shots = 1; }
        if (rate_of_fire === 2) { shots = 5; }
        if (rate_of_fire === 3) { shots = 10; }
        if (rate_of_fire === 4) { shots = 20; }
        if (rate_of_fire === 5) { shots = 40; }
        if (rate_of_fire === 6) { shots = 50; }
    }

    let sil = false;
    if (item_weapon.data.data.additionalStats.silenced && item_weapon.data.data.additionalStats.silenced.value === true) {
        sil = true;
    }
    // Getting sfxDelay from game settings
    let sfxDelay = game.settings.get(
        'swim', 'sfxDelay');
    // Getting the sfx from the weapon provided by BR2:
    let sfx_shot;
    let sfx_silenced;
    let sfx_shot_auto;
    let sfx_silenced_auto;
    let sfx_empty;
    if (item_weapon.data.data.additionalStats.sfx) {
        let sfx = item_weapon.data.data.additionalStats.sfx.value.split(`|`);
        sfx_shot = sfx[1];
        sfx_silenced = sfx[3];
        sfx_shot_auto = sfx[2];
        sfx_silenced_auto = sfx[4];
        sfx_empty = sfx[5];
    }
    // Getting Weapon and loaded ammo
    const weaponIMG = item_weapon.data.img;
    let currentAmmo
    if (item_weapon.data.data.additionalStats.loadedAmmo) {
        currentAmmo = item_weapon.data.data.additionalStats.loadedAmmo.value;
    }

    // Calculating shots to expend
    const currentCharges = parseInt(item_weapon.data.data.currentShots);
    const newCharges = currentCharges - shots;
    //If no ammo needed, only play SFX
    if (item_weapon.data.data.ammo === "NONE" && item_weapon.data.data.additionalStats.sfx) {
        // Play sound effects
        await play_sfx(sil, sfx_silenced, shots, sfxDelay, sfx_silenced_auto, sfx_shot, sfx_shot_auto);

    } else if (item_weapon.data.data.ammo === "MELEE" && item_weapon.data.data.additionalStats.sfx) {
        let meleeSFX = item_weapon.data.data.additionalStats.sfx.value.split("|");
        let attackSFX = meleeSFX[0];
        let frenzySFX = meleeSFX[1];
        let frenzyImpSFX = meleeSFX[2];
        if (rate_of_fire === 1) { AudioHelper.play({ src: `${attackSFX}` }, true); }
        else if (rate_of_fire === 2) { AudioHelper.play({ src: `${frenzySFX}` }, true); }
        else if (rate_of_fire >= 3) { AudioHelper.play({ src: `${frenzyImpSFX}` }, true); }
    }
    else if (item_weapon.data.data.additionalStats.isConsumable && item_weapon.data.data.additionalStats.isConsumable.value === true) {
        //Get Skill from BR2. This returns as "Skill dx" so we need to filter that later...
        let usedSkill = message.data.flags['betterrolls-swade2'].render_data.skill_title;
        //We assume that all consumable weapons use "Athletics", "Athletics (Throwing)", "Athletics (Explosives)" or "Throwing" and only proceed if one of these skills was used. This is where we filter with .includes().
        if (usedSkill.includes("Athletics") === false &&
            usedSkill.includes("Athletics (Throwing)") === false &&
            usedSkill.includes("Athletics (Explosives)") === false &&
            usedSkill.includes("Throwing") === false) { return; }
        const currentQuantity = parseInt(item_weapon.data.data.quantity);
        if (currentQuantity <= 0) {
            return ui.notifications.error(`You don't have a ${item_weapon.name} left.`);
        }
        const newQuantity = currentQuantity - shots;
        const updates = [
            { _id: item_weapon.id, "data.quantity": `${newQuantity}` },
        ];
        // Updating the consumable weapon
        await actor.updateEmbeddedDocuments("Item", updates);
        // Deleting the consumable weapon if it was the last (disabled because it breaks rerolls in BR2)
        /*if (newQuantity <= 0) {
            item_weapon.delete();
        }*/
        // Creating the Chat message
        ChatMessage.create({
            speaker: {
                alias: actor.name
            },
            content: `<img src="${weaponIMG}" alt="" width="25" height="25" /> ${actor.name} uses ${shots} ${item_weapon.name}(s) and has ${newQuantity} left.`
        })
        // Play sound effects
        if (sfx_shot) {
            AudioHelper.play({ src: `${sfx_shot}` }, true);
        }
    }
    //Stuff for weapons with "doesn't require reload action" checked:
    else if (item_weapon.data.data.autoReload === true) {
        //Throw error if no ammo is left.
        if (actor.type != "character" && npcAmmo === false) {
            ChatMessage.create({
                speaker: {
                    alias: actor.name
                },
                content: `<img src="${weaponIMG}" alt="" width="25" height="25" /> ${actor.name} fires <b>${shots} ${currentAmmo}</b> from a ${item_weapon.name}.`
            })
        } else if (!item_ammo && actor.type === "character" && npcAmmo === false || !item_ammo && npcAmmo === true) {
            return ui.notifications.error(`You don't have the required ammo in your inventory.`);
        } else if (item_ammo.data.data.quantity <= 0 && actor.type === "character" && npcAmmo === false || item_ammo.data.data.quantity <= 0 && npcAmmo === true) { return ui.notifications.error(`You don't have a ${item_ammo.name} left.`); }
        else {
            //Setting new constants to overwrite the old ones
            const currentCharges = parseInt(item_ammo.data.data.quantity);
            const newCharges = currentCharges - shots;
            //Setting up the updates
            const updates = [
                { _id: item_ammo.id, "data.quantity": `${newCharges}` },
            ];
            // Updating the Weapon
            actor.updateEmbeddedDocuments("Item", updates);
            //Creating the chat message
            ChatMessage.create({
                speaker: {
                    alias: actor.name
                },
                content: `<img src="${weaponIMG}" alt="" width="25" height="25" /> ${actor.name} fires <b>${shots} ${currentAmmo} round(s)</b> from a ${item_weapon.name} and has <b>${newCharges} left</b>.`
            })
        }
        //Playing the SFX
        // Play sound effects
        await play_sfx(sil, sfx_silenced, shots, sfxDelay, sfx_silenced_auto, sfx_shot, sfx_shot_auto);
    }
    // Check if enough bullets are in the weapon to fire the given amount of shots if this is not a consumable weapon and does require loading action.
    else if (currentCharges < shots && item_weapon.data.data.autoReload === false) {
        ui.notifications.error("You have insufficient ammunition.");
        if (sfx_empty && currentCharges === 0) {
            AudioHelper.play({ src: `${sfx_empty}` }, true);
        }
        return;
    }
    else {
        const updates = [
            { _id: item_weapon.id, "data.currentShots": `${newCharges}` },
        ];
        // Updating the Weapon
        actor.updateEmbeddedDocuments("Item", updates);
        // Creating the Chat message
        if (!currentAmmo) {
            ChatMessage.create({
                speaker: {
                    alias: actor.name
                },
                content: `<img src="${weaponIMG}" alt="" width="25" height="25" /> ${actor.name} fires <b>${shots} round(s)</b> from a ${item_weapon.name} and has <b>${newCharges} left</b>.`
            })
        } else {
            ChatMessage.create({
                speaker: {
                    alias: actor.name
                },
                content: `<img src="${weaponIMG}" alt="" width="25" height="25" /> ${actor.name} fires <b>${shots} ${currentAmmo} round(s)</b> from a ${item_weapon.name} and has <b>${newCharges} left</b>.`
            })
        }
        // Play sound effects
        await play_sfx(sil, sfx_silenced, shots, sfxDelay, sfx_silenced_auto, sfx_shot, sfx_shot_auto);
    }

    async function play_sfx(sil, sfx_silenced, shots, sfxDelay, sfx_silenced_auto, sfx_shot, sfx_shot_auto) {
        // Play sound effects
        if (sil === true && sfx_silenced) {
            if (shots === 2) {
                AudioHelper.play({ src: `${sfx_silenced}` }, true);
                await wait(`${sfxDelay}`);
                AudioHelper.play({ src: `${sfx_silenced}` }, true);
            }
            else if (shots === 3) {
                AudioHelper.play({ src: `${sfx_silenced}` }, true);
                await wait(`${sfxDelay}`);
                AudioHelper.play({ src: `${sfx_silenced}` }, true);
                await wait(`${sfxDelay}`);
                AudioHelper.play({ src: `${sfx_silenced}` }, true);
            }
            else if (shots > 3 && sfx_silenced_auto) {
                AudioHelper.play({ src: `${sfx_silenced_auto}` }, true);
            }
            else {
                AudioHelper.play({ src: `${sfx_silenced}` }, true);
            }
        }
        else {
            if (shots === 2) {
                AudioHelper.play({ src: `${sfx_shot}` }, true);
                await wait(`${sfxDelay}`);
                AudioHelper.play({ src: `${sfx_shot}` }, true);
            }
            else if (shots === 3) {
                AudioHelper.play({ src: `${sfx_shot}` }, true);
                await wait(`${sfxDelay}`);
                AudioHelper.play({ src: `${sfx_shot}` }, true);
                await wait(`${sfxDelay}`);
                AudioHelper.play({ src: `${sfx_shot}` }, true);
            }
            else if (shots > 3 && sfx_shot_auto) {
                AudioHelper.play({ src: `${sfx_shot_auto}` }, true);
            }
            else {
                AudioHelper.play({ src: `${sfx_shot}` }, true);
            }
        }
    }

    //V. 4.0.0 by SalieriC#8263 with help from javierrivera#4813.
}
