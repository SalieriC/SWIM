/*******************************************
 * Ammo Management (Enhanced Version)
 * version 5.0.0
 * By SalieriC#8263. Dialogue Framework: Kekilla#7036
 *
 * Makes heavy use of SFX set up on the weapon.
 * For now these are set up as additional stats (see doc).
 * Preset:
 * RELOAD|FIRE|AUTOFIRE|SILENCED|SILENCEDAUTOFIRE|EMPTY
 ******************************************/

export async function ammo_management_script() {
    const { speaker, _, __, token } = await swim.get_macro_variables()
    // Getting NPC ammo usage from game settings
    const npcAmmo = game.settings.get(
        'swim', 'npcAmmo');

    let dialogID = "";

    async function wait(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    const defaultChecked = game.settings.get("swim", "ammoMgm-defaultSingleReload") ? " checked" : ""


    async function weaponDialog() {
        if (!token) return ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));

        const actor = token.actor;
        const weapons = actor.items.filter(i =>
            (i.type === "weapon" &&
                //i.data.data.range !== "0" && i.data.data.range !== "" &&
                i.data.data.ammo.trim() !== "" &&
                i.data.data.quantity > 0) ||
            (i.type === "weapon" &&
                //i.data.data.range !== "0" && i.data.data.range !== "" &&
                i.data.data.additionalStats.isConsumable &&
                i.data.data.additionalStats.isConsumable.value === true &&
                i.data.data.quantity > 0)
        );

        if (weapons.length === 0) return ui.notifications.error(game.i18n.localize("SWIM.notification-noReloadableOrConsumableWeapon"));

        let html = getHTML();
        let content = getContent();
        let buttons = getButtons();

        let dialog = new Dialog({
            content, buttons, title: game.i18n.localize("SWIM.dialogue-attack")
        }, {
            width: 400,
        });

        dialogID = dialog.appId;

        await dialog._render(true);
        activeListeners();

        function getHTML() {
            let html = document.getElementById(`app-${dialogID}`)?.getElementsByTagName(`select`);
            if (html === undefined) return undefined;
            else return Array.from(html).map(h => h.value);
        }
        function getContent() {
            let selectedWeapon = html !== undefined
                ? html[0]
                : weapons[0].id;

            //console.log(html, selectedWeapon, weapons);

            //Get ammo and filter for the ammo the token actually owns.
            let ammo = weapons
                .find(w => w.id === selectedWeapon).data.data.ammo.trim().split(`|`)
                .filter(a => !!actor.items.getName(a));

            let rate_of_fire = parseInt(weapons.find(w => w.id === selectedWeapon).data.data.rof);
            let defaultShots = 1;
            if (rate_of_fire === 2) { defaultShots = 5; }
            if (rate_of_fire === 3) { defaultShots = 10; }
            if (rate_of_fire === 4) { defaultShots = 20; }
            if (rate_of_fire === 5) { defaultShots = 40; }
            if (rate_of_fire === 6) { defaultShots = 50; }

            /*
            let defaultSingleReload = false;
            let isSingleReload = parseInt(weapons.find(w => w.id === selectedWeapon).data.name.includes("Revolver"));
            if (isSingleReload === true){defaultSingleReload = true;}
            */
            //TRANSLATE TODO
            return `
      <form>
        <div>
          <p>Here you can fire shots from your weapon or reload it.</p>
          <p>You don't need to adjust the "# of Shots" for reloading. If you change the ammo type you'll keep the old ammo unless it is a Charge Pack.</p>
          <p><b># of Shots per ROF:</b> ROF 1 = 1 Shot; ROF 2 = 5; ROF 3 = 10; ROF 4 = 20; ROF 5 = 40; ROF 6 = 50</p>
        </div>
        <div class="form-group">
          <label for="shots"># of Shots: </label>
          <input id="shots" type="number" min="0" value="${defaultShots}"></input>
        </div>
        <div class="form-group">
          <label for="weapon">Weapon: </label>
          <select id="weapon">${weapons.reduce((acc, val) => acc += `<option value="${val.id}" ${val.id === selectedWeapon ? `selected` : ``}>${val.name}</option>`, ``)}</select>
        </div>
        <div class="form-group">
          <label for="ammo">Ammo: </label>
          <select id="ammo">${ammo.reduce((acc, val) => acc += `<option value="${val}">${val}</option>`, ``)}</select>
        </div>
        <div class="form-group">
          <label for="singleReload">Can only reload one at a time: </label>
          <input id="singleReload" name="Single Reload" type="checkbox"${defaultChecked}></input>
        </div>
      </form>
      `
            //<input id="singleReload" name="Single Reload" type="checkbox" ${defaultSingleReload ? "checked" : ""}></input>
        }
        function getButtons() {
            return {
                a: {
                    label: game.i18n.localize("SWIM.dialogue-shoot"), callback: shoot,
                },
                b: {
                    label: game.i18n.localize("SWIM.dialogue-reload"), callback: reload,
                }
            }
        }
        function activeListeners() {
            document.getElementById("weapon").onchange = update;
        }
        async function update() {
            html = getHTML();
            dialog.data.content = getContent();
            dialog.data.buttons = getButtons();
            await dialog._render(true);
            activeListeners();
        }
        async function shoot(html) {
            let [shots, weapon, ammo] = getValues(html);
            let item_weapon = actor.items.get(weapon);
            let item_ammo = actor.items.getName(`${ammo}`);
            // Getting sfxDelay from game settings
            let sfxDelay = game.settings.get(
                'swim', 'sfxDelay');
            // Getting the sfx from the selected weapon
            let sfx_shot/* = stuff*/;
            let sfx_silenced/* = stuff*/;
            let sfx_shot_auto/* = stuff*/;
            let sfx_silenced_auto/* = stuff*/;
            let sfx_empty;
            if (item_weapon.data.data.additionalStats.sfx) {
                let sfx = item_weapon.data.data.additionalStats.sfx.value.split(`|`);
                sfx_shot = sfx[1];
                sfx_silenced = sfx[3];
                sfx_shot_auto = sfx[2];
                sfx_silenced_auto = sfx[4];
                sfx_empty = sfx[5];
            }
            // Setting a boolean depending on whether or not a weapon is silenced
            let sil = false;
            if (item_weapon.data.data.additionalStats.silenced && item_weapon.data.data.additionalStats.silenced.value === true) {
                sil = true;
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
            } else if (item_weapon.data.data.additionalStats.isConsumable && item_weapon.data.data.additionalStats.isConsumable.value === true) {
                const currentQuantity = parseInt(item_weapon.data.data.quantity);
                if (currentQuantity <= 0) {
                    return ui.notifications.error(game.i18n.format("SWIM.notification-noItemLeft", {itemName: item_weapon.name}));
                }
                const newQuantity = currentQuantity - shots;
                const updates = [
                    { _id: item_weapon.id, "data.quantity": `${newQuantity}` },
                ];
                // Updating the consumable weapon
                await actor.updateEmbeddedDocuments("Item", updates);
                // Deleting the consumable weapon if it was the last
                if (newQuantity <= 0) {
                    item_weapon.delete();
                }
                // Creating the Chat message
                ChatMessage.create({
                    speaker: {
                        alias: token.name
                    },
                    content: game.i18n.format("SWIM.chatMessage-weaponUsed", {weaponIMG: weaponIMG, name: token.Name, shots : shots, itemWeaponName: item_weapon.name, newQuantity: newQuantity})
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
                        content: game.i18n.format("SWIM.chatMessage-shotsFiredWithCurrentAmmoNoRoundsWithoutNewCharges", {weaponIMG: weaponIMG, name: actor.name, shots : shots, currentAmmo: currentAmmo, itemWeaponName: item_weapon.name})
                    })
                } else if (!item_ammo && actor.type === "character" && npcAmmo === false || !item_ammo && npcAmmo === true) {
                    return ui.notifications.error(game.i18n.localize("SWIM.notification-noRequiredAmmoAvailable"));
                } else if (item_ammo.data.data.quantity <= 0 && actor.type === "character" && npcAmmo === false || item_ammo.data.data.quantity <= 0 && npcAmmo === true) { return ui.notifications.error(game.i18n.format("SWIM.notification-noItemLeft", {itemName: item_ammo.name})); }
                else {
                    //Setting new constants to overwrite the old ones
                    const currentCharges = parseInt(item_ammo.data.data.quantity);
                    const newCharges = currentCharges - shots;
                    //Setting up the updates
                    const updates = [
                        { _id: item_ammo.id, "data.quantity": `${newCharges}` },
                    ];
                    // Updating the Weapon
                    await actor.updateEmbeddedDocuments("Item", updates);;
                    //Creating the chat message
                    ChatMessage.create({
                        speaker: {
                            alias: actor.name
                        },
                        content: game.i18n.format("SWIM.chatMessage-shotsFiredWithCurrentAmmoNoRoundsWithNewCharges", {weaponIMG: weaponIMG, name: actor.name, shots : shots, currentAmmo: currentAmmo, itemWeaponName: item_weapon.name, newCharges: newCharges})
                    })
                }
                //Playing the SFX
                await play_sfx(sil, sfx_silenced, shots, sfxDelay, sfx_silenced_auto, sfx_shot, sfx_shot_auto);
            }
            // Check if enough bullets are in the weapon to fire the given amount of shots if this is not a consumable weapon and does require loading action.
            else if (currentCharges < shots && item_weapon.data.data.autoReload === false) {
                ui.notifications.error(game.i18n.localize("SWIM.notification-insufficientAmmoAvailable"))
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
                await actor.updateEmbeddedDocuments("Item", updates);
                // Creating the Chat message
                if (!currentAmmo) {
                    ChatMessage.create({
                        speaker: {
                            alias: token.name
                        },
                        content: game.i18n.format("SWIM.chatMessage-shotsFired", {weaponIMG: weaponIMG, name: token.name, shots : shots, itemWeaponName: item_weapon.name, newCharges: newCharges})
                    })
                } else {
                    ChatMessage.create({
                        speaker: {
                            alias: token.name
                        },
                        content: game.i18n.format("SWIM.chatMessage-shotsFiredWithCurrentAmmo", {weaponIMG: weaponIMG, name: token.name, shots : shots, currentAmmo : currentAmmo, itemWeaponName: item_weapon.name, newCharges: newCharges})
                    })
                }
                //Play SFX
                await play_sfx(sil, sfx_silenced, shots, sfxDelay, sfx_silenced_auto, sfx_shot, sfx_shot_auto);
            }

            // console.log("Shoot | ", shots, weapon, ammo, sil, item_weapon);
        }


        async function reload(html) {
            let [shots, weapon, ammo, singleReload] = getValues(html);
            const autoReload = item_weapon.data.data.autoReload
            // If no ammo left throw an error message.
            if (!ammo && actor.type === 'character' && npcAmmo === false || !ammo && npcAmmo === true) {
                return ui.notifications.error(game.i18n.localize("SWIM.notification-outOfAmmo"));
            }
            let item_weapon = actor.items.get(weapon);
            // Only do all the reloading stuff if NPCs use Ammo from Inventory.
            if (actor.type === 'character' && npcAmmo === false || npcAmmo === true) {
                // Do not allow consumable weapons to be reloaded
                if (item_weapon.data.data.additionalStats.isConsumable && item_weapon.data.data.additionalStats.isConsumable.value === true) {
                    return ui.notifications.error(game.i18n.localize("SWIM.notification-cannotReloadConsumableWeapons"));
                }
                let item_ammo = actor.items.getName(`${ammo}`);
                //console.log(weapon, item_weapon, ammo, item_ammo);
                const oldAmmo = item_weapon.data.data.additionalStats.loadedAmmo.value;
                let item_oldAmmo;
                if (!oldAmmo) {
                    item_oldAmmo = item_ammo;
                }
                else {
                    item_oldAmmo = actor.items.getName(`${oldAmmo}`);
                }
                // We suspect that the ammo to reload is the same as the previously loaded one. If not chgType will tell the code to swap the ammo.
                let chgType = false;
                if (item_oldAmmo != item_ammo) {
                    chgType = true;
                }
                if (chgType === false && autoReload) {
                    ui.notifications.notify(game.i18n.localize("SWIM.notification-noNeedToReload"))
                    return
                }
                // Getting the sfx from the selected weapon
                let sfx_reload;
                if (item_weapon.data.data.additionalStats.sfx) {
                    let sfx = item_weapon.data.data.additionalStats.sfx.value.split(`|`);
                    sfx_reload = sfx[0];
                }
                // Getting images from items
                const weaponIMG = item_weapon.data.img;
                const ammoIMG = item_ammo.data.img;

                // Getting current numbers
                const currentCharges = parseInt(item_weapon.data.data.currentShots);
                const maxCharges = parseInt(item_weapon.data.data.shots);
                const requiredCharges = parseInt(item_weapon.data.data.shots - currentCharges);
                const availableAmmo = parseInt(item_ammo.data.data.quantity);
                const oldAmmoQuantity = parseInt(item_oldAmmo.data.data.quantity);
                // Variables for recharging procedure
                let amountToRecharge;
                let newCharges;
                let newAmmo;
                let oldAmmoRefill;
                // Checking if the Ammo is a charge pack. If not or additionalStat is not present ignore it. Charge Packs can only refill if curr and max shots are equal.
                if (item_ammo.data.data.additionalStats.isPack && item_ammo.data.data.additionalStats.isPack.value === true) {
                    // Charge Packs only use 1 Quantity to fully charge the weapon
                    amountToRecharge = parseInt(item_weapon.data.data.shots);
                    newCharges = amountToRecharge;
                    newAmmo = availableAmmo - 1;
                    //Refill old Charge Pack if it is still full (current and max shots are equal)
                    if (chgType === true && currentCharges === maxCharges) {
                        oldAmmoRefill = oldAmmoQuantity + 1;
                    }
                    else if (chgType === true && currentCharges != maxCharges) {
                        oldAmmoRefill = oldAmmoQuantity;
                    }
                }
                // Checking if user selected to change the ammo type. This is only relevant if not a Charge Pack, if it is, it's already handled above.
                else if (chgType === true) {
                    // When changing Ammo type, remaining shots should not become the new Ammo Type.
                    amountToRecharge = parseInt(item_weapon.data.data.shots);
                    //Change the amount to recharge to 1 if singleReload is checked.
                    if (singleReload === true) { amountToRecharge = 1 }
                    if (autoReload === true) { amountToRecharge = 0 }
                    newCharges = amountToRecharge;
                    newAmmo = availableAmmo - amountToRecharge;
                    oldAmmoRefill = oldAmmoQuantity + currentCharges;
                }
                else {
                    // If the quantity of ammo is less than the amount required, use whatever is left.
                    amountToRecharge = Math.min(availableAmmo, requiredCharges);
                    //Change the amount to recharge to 1 if singleReload is checked.
                    if (singleReload === true) { 
                        amountToRecharge = currentCharges >= maxCharges ? 0 : 1
                        if (amountToRecharge === 0) {
                            ui.notifications.error(game.i18n.localize("SWIM.notification-weaponAlreadyFull"))
                            return
                        }
                    }
                    newCharges = currentCharges + amountToRecharge;
                    newAmmo = availableAmmo - amountToRecharge;
                }
                // Check if there is ammo left to reload.
                if (availableAmmo < 1) {
                    ui.notifications.notify(game.i18n.localize("SWIM.notification-outOfAmmo"))
                }
                else if (chgType === true) {
                    const updates = [
                        { _id: item_weapon.id, "data.currentShots": `${newCharges}`, "data.additionalStats.loadedAmmo.value": `${ammo}` },
                        { _id: item_ammo.id, "data.quantity": `${newAmmo}` },
                        { _id: item_oldAmmo.id, "data.quantity": `${oldAmmoRefill}` },
                    ];

                    await actor.updateEmbeddedDocuments("Item", updates);
                    ChatMessage.create({
                        speaker: {
                            alias: token.name
                        },
                        content: game.i18n.format("SWIM.chatMessage-reloadWeaponWithAmmoName", {weaponIMG: weaponIMG, ammoIMG: ammoIMG, name: token.name, itemWeaponName: item_weapon.name, itemAmmoName : item_ammo.name})
                    })
                    if (sfx_reload) {
                        AudioHelper.play({ src: `${sfx_reload}` }, true)
                    }
                }
                else {
                    const updates = [
                        { _id: item_weapon.id, "data.currentShots": `${newCharges}`, "data.additionalStats.loadedAmmo.value": `${ammo}` },
                        { _id: item_ammo.id, "data.quantity": `${newAmmo}` },
                    ];

                    await actor.updateEmbeddedDocuments("Item", updates);
                    ChatMessage.create({
                        speaker: {
                            alias: token.name
                        },
                        content: game.i18n.format("SWIM.chatMessage-reloadWeaponWithAmmoName", {weaponIMG: weaponIMG, ammoIMG: ammoIMG, name: token.name, itemWeaponName: item_weapon.name, itemAmmoName : item_ammo.name})
                    })
                    if (sfx_reload) {
                        AudioHelper.play({ src: `${sfx_reload}` }, true)
                    }
                }
            } else {
                // If NPCs don't use Ammo from inventory, just reload the weapon:
                let newCharges;
                const currentCharges = parseInt(item_weapon.data.data.currentShots);
                const maxCharges = parseInt(item_weapon.data.data.shots);
                if (item_weapon.data.data.additionalStats.isConsumable && item_weapon.data.data.additionalStats.isConsumable.value === true) {
                    return ui.notifications.error(game.i18n.localize("SWIM.notification-cannotReloadConsumableWeapons"));
                } else if (item_weapon.data.data.autoReload === true) {
                    return ui.notifications.error(game.i18n.localize("SWIM.notification-cannotChangeAmmoTypeIfNPCDontUseAmmoFromInventory"));
                } else if (currentCharges === maxCharges) {
                    return ui.notifications.error(game.i18n.localize("SWIM.notification-weaponAlreadyFull"));
                }
                if (singleReload === true) {
                    //Do single reload
                    newCharges = currentCharges + 1;
                } else {
                    //Do full reload
                    newCharges = maxCharges;
                }
                const updates = [
                    { _id: item_weapon.id, "data.currentShots": `${newCharges}` }
                ];
                await actor.updateEmbeddedDocuments("Item", updates);

                ChatMessage.create({
                    speaker: {
                        alias: token.name
                    },
                    content: game.i18n.format("SWIM.chatMessage-reloadWeaponWithoutAmmoName", {weaponIMG: item_weapon.img, name: token.name, itemWeaponName: item_weapon.name})
                })
                let sfx_reload
                if (item_weapon.data.data.additionalStats.sfx) {
                    let sfx = item_weapon.data.data.additionalStats.sfx.value.split(`|`);
                    sfx_reload = sfx[0];
                }
                if (sfx_reload) {
                    AudioHelper.play({ src: `${sfx_reload}` }, true)
                }
            }

            // Ammo with no more bullets left are NOT deleted because that could cause issues when trying to change the ammo.
        }
        function getValues(html) {
            return [
                html.find(`#shots`)[0].valueAsNumber,
                html.find(`#weapon`)[0].value,
                html.find(`#ammo`)[0].value,
                html.find(`#singleReload`)[0].checked,
            ];
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

    }
    weaponDialog();
}

/*******************************************
 * Ammo Management (BR2 Version)
 * version 5.0.0
 * By SalieriC#8263 with help from javierrivera#4813
 *
 * This version relies on Better Rolls 2,
 * otherwise it uses the same additional stats
 * as above. Please read the documentation!
 ******************************************/

export async function br2_ammo_management_script(message, actor, item) {
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
        } else if (item_weapon.data.data.ammo) {
            item_ammo = actor.items.getName(`${item_weapon.data.data.ammo}`);
        }
        //Setting the amount of shots based on RoF:
        let traitDice = message.data.flags['betterrolls-swade2'].render_data.trait_roll.dice;
        //console.log(traitDice);
        //console.log(message.data.flags['betterrolls-swade2'].render_data);
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
                usedSkill.includes("Throwing") === false &&
                usedSkill.includes("Stealth") === false) { return; }
            const currentQuantity = parseInt(item_weapon.data.data.quantity);
            if (currentQuantity <= 0) {
                return ui.notifications.error(game.i18n.format("SWIM.notification-noItemLeft", {itemName: item_weapon.name}));
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
                content: game.i18n.format("SWIM.chatMessage-weaponUsed", {weaponIMG: weaponIMG, name: actor.Name, shots : shots, itemWeaponName: item_weapon.name, newQuantity: newQuantity})
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
                    content: game.i18n.format("SWIM.chatMessage-shotsFiredWithCurrentAmmoNoRoundsWithoutNewCharges", {weaponIMG : weaponIMG, name : actor.name, shots : shots, currentAmmo: currentAmmo, itemWeaponName: item_weapon.name})
                })
            } else if (!item_ammo && actor.type === "character" && npcAmmo === false || !item_ammo && npcAmmo === true) {
                return ui.notifications.error(game.i18n.localize("SWIM.notification-noRequiredAmmoAvailable"));
            } else if (item_ammo.data.data.quantity <= 0 && actor.type === "character" && npcAmmo === false || item_ammo.data.data.quantity <= 0 && npcAmmo === true) { return ui.notifications.error(game.i18n.format("SWIM.notification-noItemLeft", {itemName: item_ammo.name})); }
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
                    content: game.i18n.format("SWIM.chatMessage-shotsFiredWithCurrentAmmo", {weaponIMG: weaponIMG, name: actor.name, shots : shots, currentAmmo: currentAmmo, itemWeaponName: item_weapon.name, newCharges: newCharges})
                })
            }
            //Playing the SFX
            // Play sound effects
            await play_sfx(sil, sfx_silenced, shots, sfxDelay, sfx_silenced_auto, sfx_shot, sfx_shot_auto);
        }
        // Check if enough bullets are in the weapon to fire the given amount of shots if this is not a consumable weapon and does require loading action.
        else if (currentCharges < shots && item_weapon.data.data.autoReload === false) {
            ui.notifications.error(game.i18n.localize("SWIM.notification-insufficientAmmoAvailable"));
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
                    content: game.i18n.format("SWIM.chatMessage-shotsFired", {weaponIMG: weaponIMG, name: actor.name, shots : shots, itemWeaponName: item_weapon.name, newCharges: newCharges})
                })
            } else {
                ChatMessage.create({
                    speaker: {
                        alias: actor.name
                    },
                    content: game.i18n.format("SWIM.chatMessage-shotsFiredWithCurrentAmmo", {weaponIMG: weaponIMG, name: actor.name, shots : shots, currentAmmo: currentAmmo, itemWeaponName: item_weapon.name, newCharges: newCharges})
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
    }
}
