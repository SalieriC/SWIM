export async function showWeaponAmmoDialog() {
    const {_, __, ___, token} = await swim.get_macro_variables();
    //early out
    if (!token) return ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
    const actor = token.actor;

    //get weapons
    const weapons = actor.items.filter(item =>
        (item.type === "weapon" &&
            item.system.ammo.trim() !== "" &&
            item.system.quantity > 0) ||
        (item.type === "weapon" &&
            item.flags.swim.config.isConsumable &&
            item.flags.swim.config.isConsumable.value === true &&
            item.system.quantity > 0)
    );
    if (weapons.length === 0) return ui.notifications.error(game.i18n.localize("SWIM.notification-noReloadableOrConsumableWeapon"));

    await createDialog(actor, weapons)
}

async function createDialog(actor, weapons) {
    const defaultSingleReload = game.settings.get("swim", "ammoMgm-defaultSingleReload") ? " checked" : "";

    const shotsPerRof = [0, 1, 5, 10, 20, 40, 50];

    let defaultWeapon = weapons[0];
    let defaultShots = shotsPerRof[defaultWeapon.system.rof];
    let defaultAmmo = defaultWeapon.system.ammo.trim().split('|').filter(a => !!actor.items.getName(a));

    await new Dialog({
        title: game.i18n.localize("SWIM.dialogue-attack"),
        content: `
            <form name="form">
              <div>
                <p>Here you can fire shots from your weapon or reload it.</p>
                <p>You don't need to adjust the "# of Shots" for reloading. If you change the ammo type you'll keep the old ammo unless it is a Charge Pack.</p>
                <p><b># of Shots per ROF:</b> ROF 1 = 1 Shot; ROF 2 = 5; ROF 3 = 10; ROF 4 = 20; ROF 5 = 40; ROF 6 = 50</p>
              </div>
              <div class="form-group">
                <label for="shots"># of Shots: </label>
                <input id="shots", name="shots" type="number" min="0" max="${defaultShots}" value="${defaultShots}">
              </div>
              <div class="form-group">
                <label for="weapon">Weapon: </label>
                <select id="weapon" name="weapon">${weapons.reduce((acc, val) => acc += `<option value="${val.id}" ${val === defaultWeapon ? `selected` : ``}>${val.name}</option>`, ``)}</select>
              </div>
              <div class="form-group">
                <label for="ammo">Ammo: </label>
                <select id="ammo" name="ammo">${defaultAmmo.reduce((acc, val) => acc += `<option value="${val}">${val}</option>`, ``)}</select>
              </div>
              <div class="form-group">
                <label for="singleReload">Can only reload one at a time: </label>
                <input id="singleReload" name="singleReload" type="checkbox"${defaultSingleReload}>
              </div>
            </form>
            `,
        render: ([dialogContent]) => {
            let lambda = (event) => {
                const form = event.target.closest("form");

                const selectedWeaponForm = form.querySelector('select[name="weapon"]');
                const selectedAmmoForm = form.querySelector('select[name="ammo"]');
                const selectedShotsForm = form.querySelector('input[name="shots"]');

                const selectedWeapon = weapons[selectedWeaponForm.selectedIndex];

                if (defaultWeapon !== selectedWeapon) {
                    defaultShots = shotsPerRof[parseInt(selectedWeapon.system.rof)];
                    selectedShotsForm.setAttribute("max", defaultShots);
                    selectedShotsForm.setAttribute("value", defaultShots);

                    defaultAmmo = selectedWeapon.system.ammo.trim().split('|').filter(a => !!actor.items.getName(a));
                    selectedAmmoForm.innerHTML = defaultAmmo.reduce((acc, val) => acc += `<option value="${val}">${val}</option>`, ``);

                    defaultWeapon = selectedWeapon;
                }
            }

            dialogContent.querySelector(`select[name="weapon"]`).focus();
            dialogContent.querySelector(`select[name="weapon"]`).addEventListener("input", lambda);
        },
        buttons: {
            shoot: {
                label: game.i18n.localize("SWIM.dialogue-shoot"),
                callback: async (html) => await shootButton(html, actor, weapons, defaultAmmo)
            },
            reload: {
                label: game.i18n.localize("SWIM.dialogue-reload"),
                callback: async (html) => console.log("reload")
            }
        }
    }).render(true);
}

async function shootButton(html, actor, weapons, ammo) {
    const {
        selectedWeapon,
        selectedAmmo,
        selectedShots,
        selectedSingleReload
    } = getValues(html, weapons, ammo);

    //Set up variables
    const npcAmmo = game.settings.get('swim', 'npcAmmo');
    const weaponImg = selectedWeapon.img;

    let sfxDelay = game.settings.get('swim', 'sfxDelay');

    const {
        sfx_reload,
        sfx_shot,
        sfx_shot_auto,
        sfx_silenced,
        sfx_silenced_auto,
        sfx_empty
    } = await swim.get_weapon_sfx(selectedWeapon);

    const isSilenced = selectedWeapon.flags.swim.config.silenced && selectedWeapon.flags.swim.config.silenced.value === true;

    let currentAmmo;
    if (selectedWeapon.flags.swim.config.loadedAmmo) {
        currentAmmo = selectedWeapon.flags.swim.config.loadedAmmo.value;
    }

    //Calculate how many shots were fired
    const currentCharges = parseInt(selectedWeapon.system.currentShots);
    const newCharges = currentCharges - selectedShots;

    //Play sounds depending on ammo type
    const sfx = selectedWeapon.flags.swim.config.sfx;
    //If No Ammo
    if (selectedWeapon.system.ammo === "NONE" && sfx) {
        await play_sfx(isSilenced, sfx_silenced, selectedShots, sfxDelay, sfx_silenced_auto, sfx_shot, sfx_shot_auto);
    }
    //If Melee
    else if (selectedWeapon.system.ammo === "MELEE" && sfx) {
        const meleeSFX = sfx.value.split("|");
        const attackSFX = meleeSFX[0];
        const frenzySFX = meleeSFX[1];
        const frenzyImpSFX = meleeSFX[2];
        if (selectedWeapon.system.rof === 1) {
            AudioHelper.play({src: `${attackSFX}`}, true);
        } else if (rate_of_fire === 2) {
            AudioHelper.play({src: `${frenzySFX}`}, true);
        } else if (rate_of_fire >= 3) {
            AudioHelper.play({src: `${frenzyImpSFX}`}, true);
        }
    }
    //If consumable
    else if (selectedWeapon.flags.swim.config.isConsumable && selectedWeapon.flags.swim.config.isConsumable.value === true) {
        const currentQuantity = parseInt(selectedWeapon.system.quantity);
        if (currentQuantity <= 0) {
            return ui.notifications.error(game.i18n.format("SWIM.notification-noItemLeft", {itemName: selectedWeapon.name}));
        }
        const newQuantity = currentQuantity - selectedShots;
        const updates = [
            {_id: selectedWeapon.id, "system.quantity": `${newQuantity}`},
        ];
        // Updating the consumable weapon
        await actor.updateEmbeddedDocuments("Item", updates);
        // Deleting the consumable weapon if it was the last
        if (newQuantity <= 0) {
            selectedWeapon.delete();
        }
        // Creating the Chat message
        ChatMessage.create({
            speaker: {
                alias: actor.name
            },
            content: game.i18n.format("SWIM.chatMessage-weaponUsed", {
                weaponIMG: weaponImg,
                name: actor.Name,
                shots: selectedShots,
                itemWeaponName: selectedWeapon.name,
                newQuantity: newQuantity
            })
        })
        // Play sound effects
        if (sfx_shot) {
            AudioHelper.play({src: `${sfx_shot}`}, true);
        }
    }
    //Weapon doesn't require reload action
    else if (selectedWeapon.system.autoReload === true) {
        //Throw error if no ammo is left.
        if (actor.type !== "character" && npcAmmo === false) {
            ChatMessage.create({
                speaker: {
                    alias: actor.name
                },
                content: game.i18n.format("SWIM.chatMessage-shotsFiredWithCurrentAmmoNoRoundsWithoutNewCharges", {
                    weaponIMG: weaponImg,
                    name: actor.name,
                    shots: selectedShots,
                    currentAmmo: currentAmmo,
                    itemWeaponName: selectedWeapon.name
                })
            })
        } else if (!selectedWeapon && actor.type === "character" && npcAmmo === false || !selectedWeapon && npcAmmo === true) {
            return ui.notifications.error(game.i18n.localize("SWIM.notification-noRequiredAmmoAvailable"));
        } else if (selectedWeapon.system.quantity <= 0 && actor.type === "character" && npcAmmo === false || selectedWeapon.system.quantity <= 0 && npcAmmo === true) {
            return ui.notifications.error(game.i18n.format("SWIM.notification-noItemLeft", {itemName: selectedWeapon.name}));
        } else {
            //Setting new constants to overwrite the old ones
            const currentCharges = parseInt(selectedWeapon.system.currentShots);
            const newCharges = currentCharges - selectedShots;
            //Setting up the updates
            const updates = [
                {_id: item_ammo.id, "system.quantity": `${newCharges}`},
            ];
            // Updating the Weapon
            await actor.updateEmbeddedDocuments("Item", updates);

            //Creating the chat message
            ChatMessage.create({
                speaker: {
                    alias: actor.name
                },
                content: game.i18n.format("SWIM.chatMessage-shotsFiredWithCurrentAmmoNoRoundsWithNewCharges", {
                    weaponIMG: weaponImg,
                    name: actor.name,
                    shots: selectedShots,
                    currentAmmo: currentAmmo,
                    itemWeaponName: selectedWeapon.name,
                    newCharges: newCharges
                })
            })
        }
        await play_sfx(isSilenced, sfx_silenced, selectedShots, sfxDelay, sfx_silenced_auto, sfx_shot, sfx_shot_auto);
    }
    // Check if enough bullets are in the weapon to fire the given amount of shots if this is not a consumable weapon and does require loading action.
    else if (currentCharges < selectedShots && selectedWeapon.system.autoReload === false) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-insufficientAmmoAvailable"))
        if (sfx_empty && currentCharges === 0) {
            AudioHelper.play({src: `${sfx_empty}`}, true);
        }
    } else {
        const updates = [
            {_id: selectedWeapon.id, "system.currentShots": `${newCharges}`},
        ];
        // Updating the Weapon
        await actor.updateEmbeddedDocuments("Item", updates);
        // Creating the Chat message
        if (!currentAmmo) {
            ChatMessage.create({
                speaker: {
                    alias: actor.name
                },
                content: game.i18n.format("SWIM.chatMessage-shotsFired", {
                    weaponIMG: weaponImg,
                    name: actor.name,
                    shots: selectedShots,
                    itemWeaponName: selectedWeapon.name,
                    newCharges: newCharges
                })
            })
        } else {
            ChatMessage.create({
                speaker: {
                    alias: actor.name
                },
                content: game.i18n.format("SWIM.chatMessage-shotsFiredWithCurrentAmmo", {
                    weaponIMG: weaponImg,
                    name: actor.name,
                    shots: selectedShots,
                    currentAmmo: currentAmmo,
                    itemWeaponName: selectedWeapon.name,
                    newCharges: newCharges
                })
            })
        }
        //Play SFX
        await play_sfx(isSilenced, sfx_silenced, selectedShots, sfxDelay, sfx_silenced_auto, sfx_shot, sfx_shot_auto);
    }
}

function getValues(html, weapons, ammo) {
    const form = html.find("[name=form]")[0];

    const selectedWeaponForm = form.querySelector('select[name="weapon"]');
    const selectedAmmoForm = form.querySelector('select[name="ammo"]');
    const selectedShotsForm = form.querySelector('input[name="shots"]');
    const selectedSingleReloadForm = form.querySelector('input[name="singleReload"]');

    const selectedWeapon = weapons[selectedWeaponForm.selectedIndex];
    const selectedAmmo = ammo[selectedAmmoForm.selectedIndex];
    const selectedShots = parseInt(selectedShotsForm.value) || 0;
    const selectedSingleReload = selectedSingleReloadForm.checked;

    return {
        selectedWeapon,
        selectedAmmo,
        selectedShots,
        selectedSingleReload
    }
}

async function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function play_sfx(isSilenced, sfx_silenced, shots, sfxDelay, sfx_silenced_auto, sfx_shot, sfx_shot_auto) {
    // Play sound effects
    if (isSilenced === true && sfx_silenced) {
        if (shots === 2) {
            AudioHelper.play({src: `${sfx_silenced}`}, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({src: `${sfx_silenced}`}, true);
        } else if (shots === 3) {
            AudioHelper.play({src: `${sfx_silenced}`}, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({src: `${sfx_silenced}`}, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({src: `${sfx_silenced}`}, true);
        } else if (shots > 3 && sfx_silenced_auto) {
            AudioHelper.play({src: `${sfx_silenced_auto}`}, true);
        } else {
            AudioHelper.play({src: `${sfx_silenced}`}, true);
        }
    } else {
        if (shots === 2) {
            AudioHelper.play({src: `${sfx_shot}`}, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({src: `${sfx_shot}`}, true);
        } else if (shots === 3) {
            AudioHelper.play({src: `${sfx_shot}`}, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({src: `${sfx_shot}`}, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({src: `${sfx_shot}`}, true);
        } else if (shots > 3 && sfx_shot_auto) {
            AudioHelper.play({src: `${sfx_shot_auto}`}, true);
        } else {
            AudioHelper.play({src: `${sfx_shot}`}, true);
        }
    }
}