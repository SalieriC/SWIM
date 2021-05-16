checkWeapon();

async function checkWeapon() {
    //Check whether or not the weapon is suitable for the shooting macro
    if (
        (item.type === "weapon" &&
            //i.data.data.range !== "0" && i.data.data.range !== "" &&
            item.data.data.ammo.trim() !== "" &&
            item.data.data.quantity > 0) ||
        (item.type === "weapon" &&
            //i.data.data.range !== "0" && i.data.data.range !== "" &&
            item.data.data.additionalStats.isConsumable &&
            item.data.data.additionalStats.isConsumable.value === true &&
            item.data.data.quantity > 0)
    ) { shoot(); }
    else { return; }
}

async function shoot() {
    //let [shots, weapon, ammo, sil] = getValues(html);
    let item_weapon = item;
    //Stop if the item is not a weapon:
    if (!item_weapon.type === "weapon") { return; }
    //Get ammo loaded in the weapon and amount of shots provided by BR2 as well as a silenced state:
    let item_ammo;
    if (item_weapon.data.data.additionalStats.loadedAmmo) {
        let loaded_ammo = item_weapon.data.data.additionalStats.loadedAmmo.value;
        item_ammo = actor.items.getName(`${loaded_ammo}`);
    }
    let shots /*= some code tbd by Javier*/;
    let sil = false;
    if (item_weapon.data.data.additionalStats.silenced && item_weapon.data.data.additionalStats.silenced.value === true) {
        sil = true;
    }
    // Getting the sfx from the weapon provided by BR2:
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
    if (item_weapon.data.data.additionalStats.isConsumable && item_weapon.data.data.additionalStats.isConsumable.value === true) {
        const currentQuantity = parseInt(item_weapon.data.data.quantity);
        if (currentQuantity <= 0) {
            return ui.notifications.error(`You don't have a ${item_weapon.name} left.`);
        }
        const newQuantity = currentQuantity - shots;
        const updates = [
            { _id: item_weapon.id, "data.quantity": `${newQuantity}` },
        ];
        // Updating the consumable weapon
        await actor.updateOwnedItem(updates);
        // Deleting the consumable weapon if it was the last
        if (newQuantity <= 0) {
            item_weapon.delete();
        }
        // Creating the Chat message
        ChatMessage.create({
            speaker: {
                alias: token.name
            },
            content: `<img src="${weaponIMG}" alt="" width="25" height="25" /> ${token.name} uses ${shots} ${item_weapon.name}(s) and has ${newQuantity} left.`
        })
        // Play sound effects
        if (sfx_shot) {
            AudioHelper.play({ src: `${sfx_shot}` }, true);
        }
    }
    // Check if enough bullets are in the weapon to fire the given amount of shots if this is not a consumable weapon.
    else if (currentCharges < shots) {
        ui.notifications.error("You have insufficient ammunition.");
        if (sfx_empty && shots === 0) {
            AudioHelper.play({ src: `${sfx_empty}` }, true);
        }
        return;
    }
    else {
        const updates = [
            { _id: item_weapon.id, "data.currentShots": `${newCharges}` },
        ];
        // Updating the Weapon
        actor.updateOwnedItem(updates);
        // Creating the Chat message
        ChatMessage.create({
            speaker: {
                alias: token.name
            },
            content: `<img src="${weaponIMG}" alt="" width="25" height="25" /><img src="${item_ammo.data.img}" alt="" width="25" height="25" /> ${token.name} fires <b>${shots} ${currentAmmo} round(s)</b> of ${item_ammo.name} from a ${item_weapon.name} and has <b>${newCharges} left</b>.`
        })
        // Play sound effects
        if (sil === true && sfx_silenced) {
            if (shots > 4 && sfx_silenced_auto) {
                AudioHelper.play({ src: `${sfx_silenced_auto}` }, true);
            }
            else {
                AudioHelper.play({ src: `${sfx_silenced}` }, true);
            }
        }
        else {
            if (shots > 4 && sfx_shot_auto) {
                AudioHelper.play({ src: `${sfx_shot_auto}` }, true);
            }
            else {
                AudioHelper.play({ src: `${sfx_shot}` }, true);
            }
        }
    }
}