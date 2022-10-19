export async function showWeaponAmmoDialog() {
    const {_, __, ___, token} = await swim.get_macro_variables();
    //early out
    if (!token) return ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
    const actor = token.actor;

    //get weapons
    const weapons = actor.items.filter(item =>
        item.type === "weapon"
        && item.system.quantity > 0
        && item.flags?.swim?.config !== undefined
        && (item.system.ammo.trim() !== ""
            || item.flags.swim.config.isConsumable === true)
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
    let loadedAmmo = defaultWeapon.flags.swim.config.loadedAmmo;
    let currentShots = defaultWeapon.system.currentShots;
    let currentMaxShots = defaultWeapon.system.shots;

    await new Dialog({
        title: game.i18n.localize("SWIM.dialogue-ammoManagement"),
        content: `
            <form name="form">
                <h3>Select Mode</h3>
                <div class="form-group">
                    <label for="reload">Reload: </label>
                    <input id="reload" name="mode" type="radio" value="reload" checked="true">
                </div>
                <div class="form-group">
                    <label for="shooting">Shooting: </label>
                    <input id="shooting" name="mode" type="radio" value="shooting">
                </div>
                <hr>
                <h3>Select Weapon</h3>
                <div class="form-group">
                    <label for="weapon">Weapon: </label>
                    <select id="weapon" name="weapon">${weapons.reduce((acc, val) => acc += `<option value="${val.id}" ${val === defaultWeapon ? `selected` : ``}>${val.name}</option>`, ``)}</select>
                </div>
                <div class="form-group notes">
                    <label for="loaded_ammo">Loaded Ammo: </label>
                    <input id="loaded_ammo" name="loaded_ammo" type="text" value="${loadedAmmo}" readonly="readonly">
                    <p class="notes">If this is empty, you should probably load some ammo first with the Reload mode above!</p>
                </div>
                <div class="form-group notes">
                    <label for="shot_amount">Weapon Ammo Capacity: </label>
                    <input id="shot_amount" name="shot_amount" type="text" value="${currentShots + "/" + currentMaxShots}" readonly="readonly">
                </div>
                <hr>
                <div id="shooting_section">
                    <h3>Shooting</h3>
                    <p>Here you can fire precise amount of shots from your weapon, based on the current loaded ammo.</p>
                    <div class="form-group">
                        <label for="shots"># of Shots: </label>
                        <input id="shots", name="shots" type="number" min="0" max="${defaultShots}" value="${defaultShots}">
                        <p class="notes"><b># of Shots per ROF:</b> ROF 1 = 1 Shot; ROF 2 = 5; ROF 3 = 10; ROF 4 = 20; ROF 5 = 40; ROF 6 = 50</p>
                    </div>
                </div>
                <div id="reload_section">
                    <h3>Reload and Ammo Switching</h3>
                    <p>Here you can switch ammo and reload your weapon</p>
                    <p class="notes">If you change the ammo type you'll get the old ammo back, unless it is a Charge Pack.</p>
                    <div class="form-group">
                        <label for="ammo">Ammo to load: </label>
                        <select id="ammo" name="ammo">${defaultAmmo.reduce((acc, val) => acc += `<option value="${val}" ${val === loadedAmmo ? `selected` : ``}>${val}</option>`, ``)}</select>
                    </div>
                    <div class="form-group">
                        <label for="singleReload">Can only reload one at a time: </label>
                        <input id="singleReload" name="singleReload" type="checkbox"${defaultSingleReload}>
                    </div>
                </div>
            </form>
            `,
        render: ([dialogContent]) => {
            const modeSwitchLambda = (event) => {
                const form = event.target.closest("form");

                const selectedModeForms = form.querySelectorAll('input[name="mode"]');
                const reloadDiv = form.querySelector("#reload_section");
                const shootingDiv = form.querySelector("#shooting_section");

                let mode;
                for (const selectedMode of selectedModeForms) {
                    if (selectedMode.checked) {
                        mode = selectedMode.value;
                        break;
                    }
                }

                //enable and disable the respective part of the form
                if (mode === "reload") {
                    reloadDiv.style.display = "block";
                    shootingDiv.style.display = "none";
                } else {
                    reloadDiv.style.display = "none";
                    shootingDiv.style.display = "block";
                }
            }

            const weaponSwitchLambda = (event) => {
                const form = event.target.closest("form");

                const selectedWeaponForm = form.querySelector('select[name="weapon"]');
                const selectedAmmoForm = form.querySelector('select[name="ammo"]');
                const selectedShotsForm = form.querySelector('input[name="shots"]');
                const selectedLoadedAmmoForm = form.querySelector('input[name="loaded_ammo"]');
                const selectedShotAmountForm = form.querySelector('input[name="shot_amount"]');

                const selectedWeapon = weapons[selectedWeaponForm.selectedIndex];

                if (defaultWeapon !== selectedWeapon) {
                    defaultShots = shotsPerRof[parseInt(selectedWeapon.system.rof)];
                    selectedShotsForm.setAttribute("max", defaultShots);
                    selectedShotsForm.setAttribute("value", defaultShots);

                    loadedAmmo = selectedWeapon.flags.swim.config.loadedAmmo;
                    selectedLoadedAmmoForm.setAttribute("value", loadedAmmo);

                    currentShots = selectedWeapon.system.currentShots;
                    currentMaxShots = selectedWeapon.system.shots;
                    selectedShotAmountForm.setAttribute("value", currentShots + "/" + currentMaxShots);

                    defaultAmmo = selectedWeapon.system.ammo.trim().split('|').filter(a => !!actor.items.getName(a));
                    selectedAmmoForm.innerHTML = defaultAmmo.reduce((acc, val) => acc += `<option value="${val}" ${val === loadedAmmo ? `selected` : ``}>${val}</option>`, ``);

                    defaultWeapon = selectedWeapon;
                }
            }

            dialogContent.querySelector(`input[name="mode"]`).focus();
            dialogContent.querySelector(`select[name="weapon"]`).addEventListener("input", weaponSwitchLambda);

            for (const input of dialogContent.querySelectorAll(`input[name="mode"]`)) {
                input.addEventListener("input", modeSwitchLambda);
            }

            //Set initial mode
            const reloadDiv = dialogContent.querySelector("#reload_section");
            const shootingDiv = dialogContent.querySelector("#shooting_section");
            reloadDiv.style.display = "block";
            shootingDiv.style.display = "none";
        },
        buttons: {
            shoot: {
                label: game.i18n.localize("SWIM.dialogue-shoot"),
                callback: async (html) => await shootButton(html, actor, weapons, defaultAmmo)
            },
            reload: {
                label: game.i18n.localize("SWIM.dialogue-reload"),
                callback: async (html) => await reloadButton(html, actor, weapons, defaultAmmo)
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
    } = getValues(html, actor, weapons, ammo);

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

    const isSilenced = selectedWeapon.flags.swim.config.silenced === true;

    let currentAmmo;
    if (selectedWeapon.flags.swim.config.loadedAmmo) {
        currentAmmo = selectedWeapon.flags.swim.config.loadedAmmo;
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
        const meleeSFX = sfx.split("|");
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
    else if (selectedWeapon.flags.swim.config.isConsumable === true) {
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
                {_id: selectedAmmo.id, "system.quantity": `${newCharges}`},
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
        //Normal ranged weapon
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

async function reloadButton(html, actor, weapons, ammo) {
    const {
        selectedWeapon,
        selectedAmmo,
        selectedShots,
        selectedSingleReload
    } = getValues(html, actor, weapons, ammo);

    //Set up variables
    const weaponImg = selectedWeapon.img;
    const ammoImg = selectedAmmo.img;
    const npcAmmo = game.settings.get('swim', 'npcAmmo');
    const autoReload = selectedWeapon.system.autoReload;

    if (!selectedAmmo && (actor.type === 'character' || npcAmmo === true)) {
        return ui.notifications.error(game.i18n.localize("SWIM.notification-outOfAmmo"));
    }

    // Only do all the reloading stuff if NPCs use Ammo from Inventory (or if we are a character).
    if (actor.type === 'character' || npcAmmo === true) {
        // Do not allow consumable weapons to be reloaded
        if (selectedWeapon.flags.swim.config.isConsumable === true) {
            return ui.notifications.error(game.i18n.localize("SWIM.notification-cannotReloadConsumableWeapons"));
        }

        //get current loaded ammo
        const oldAmmoId = selectedWeapon.flags.swim.config.loadedAmmo;
        let oldAmmo = oldAmmoId ? actor.items.getName(oldAmmoId) : selectedAmmo;
        // We suspect that the ammo to reload is the same as the previously loaded one. If not chgType will tell the code to swap the ammo.
        let chgType = false;
        if (oldAmmo !== selectedAmmo) {
            chgType = true;
        }
        if (chgType === false && autoReload) {
            ui.notifications.notify(game.i18n.localize("SWIM.notification-noNeedToReload"))
            return;
        }

        const {
            sfx_reload,
            sfx_shot,
            sfx_shot_auto,
            sfx_silenced,
            sfx_silenced_auto,
            sfx_empty
        } = await swim.get_weapon_sfx(selectedWeapon)

        // Getting current numbers
        const currentCharges = parseInt(selectedWeapon.system.currentShots);
        const maxCharges = parseInt(selectedWeapon.system.shots);
        const requiredCharges = parseInt(selectedWeapon.system.shots - currentCharges);
        const availableAmmo = parseInt(selectedAmmo.system.quantity);
        const oldAmmoQuantity = parseInt(oldAmmo.system.quantity);

        // Variables for recharging procedure
        let amountToRecharge;
        let newCharges;
        let newAmmo;
        let oldAmmoRefill;

        // Checking if the Ammo is a charge pack. If not or flag is not present ignore it. Charge Packs can only refill if curr and max shots are equal.
        if (selectedAmmo.flags.swim.config.isPack === true) {
            // Charge Packs only use 1 Quantity to fully charge the weapon
            amountToRecharge = parseInt(selectedWeapon.system.shots);
            newCharges = amountToRecharge;
            newAmmo = availableAmmo - 1;
            //Refill old Charge Pack if it is still full (current and max shots are equal)
            if (chgType === true && currentCharges === maxCharges) {
                oldAmmoRefill = oldAmmoQuantity + 1;
            } else if (chgType === true && currentCharges !== maxCharges) {
                oldAmmoRefill = oldAmmoQuantity;
            }
        }
        // Checking if user selected to change the ammo type. This is only relevant if not a Charge Pack, if it is, it's already handled above.
        else if (chgType === true) {
            // When changing Ammo type, remaining shots should not become the new Ammo Type.
            amountToRecharge = parseInt(selectedWeapon.system.shots);
            //Change the amount to recharge to 1 if singleReload is checked.
            if (selectedSingleReload === true) {
                amountToRecharge = 1
            }
            if (autoReload === true) {
                amountToRecharge = 0
            }
            newCharges = amountToRecharge;
            newAmmo = availableAmmo - amountToRecharge;
            oldAmmoRefill = oldAmmoQuantity + currentCharges;
        } else {
            // If the quantity of ammo is less than the amount required, use whatever is left.
            amountToRecharge = Math.min(availableAmmo, requiredCharges);
            //Change the amount to recharge to 1 if singleReload is checked.
            if (selectedSingleReload === true) {
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
        } else if (chgType === true) {
            const updates = [
                {
                    _id: selectedWeapon.id,
                    "system.currentShots": `${newCharges}`,
                    "flags.swim.config.loadedAmmo": `${selectedAmmo.name}`
                },
                {_id: selectedAmmo.id, "system.quantity": `${newAmmo}`},
                {_id: oldAmmo.id, "system.quantity": `${oldAmmoRefill}`},
            ];

            await actor.updateEmbeddedDocuments("Item", updates);
            ChatMessage.create({
                speaker: {
                    alias: actor.name
                },
                content: game.i18n.format("SWIM.chatMessage-reloadWeaponWithAmmoName", {
                    weaponIMG: weaponImg,
                    ammoIMG: ammoImg,
                    name: actor.name,
                    itemWeaponName: selectedWeapon.name,
                    itemAmmoName: selectedAmmo.name
                })
            })
            if (sfx_reload) {
                AudioHelper.play({src: `${sfx_reload}`}, true)
            }
        } else {
            const updates = [
                {
                    _id: selectedWeapon.id,
                    "system.currentShots": `${newCharges}`,
                    "flags.swim.config.loadedAmmo": `${selectedAmmo.name}`
                },
                {_id: selectedAmmo.id, "system.quantity": `${newAmmo}`},
            ];

            await actor.updateEmbeddedDocuments("Item", updates);
            ChatMessage.create({
                speaker: {
                    alias: actor.name
                },
                content: game.i18n.format("SWIM.chatMessage-reloadWeaponWithAmmoName", {
                    weaponIMG: weaponImg,
                    ammoIMG: ammoImg,
                    name: actor.name,
                    itemWeaponName: selectedWeapon.name,
                    itemAmmoName: selectedAmmo.name
                })
            })
            if (sfx_reload) {
                AudioHelper.play({src: `${sfx_reload}`}, true)
            }
        }
    } else {
        // If NPCs don't use Ammo from inventory, just reload the weapon:
        let newCharges;
        const currentCharges = parseInt(selectedWeapon.system.currentShots);
        const maxCharges = parseInt(selectedWeapon.system.shots);
        if (selectedWeapon.flags.swim.config.isConsumable === true) {
            return ui.notifications.error(game.i18n.localize("SWIM.notification-cannotReloadConsumableWeapons"));
        } else if (selectedWeapon.system.autoReload === true) {
            return ui.notifications.error(game.i18n.localize("SWIM.notification-cannotChangeAmmoTypeIfNPCDontUseAmmoFromInventory"));
        } else if (currentCharges === maxCharges) {
            return ui.notifications.error(game.i18n.localize("SWIM.notification-weaponAlreadyFull"));
        }
        if (selectedSingleReload === true) {
            //Do single reload
            newCharges = currentCharges + 1;
        } else {
            //Do full reload
            newCharges = maxCharges;
        }
        const updates = [
            {_id: selectedWeapon.id, "system.currentShots": `${newCharges}`}
        ];
        await actor.updateEmbeddedDocuments("Item", updates);

        ChatMessage.create({
            speaker: {
                alias: actor.name
            },
            content: game.i18n.format("SWIM.chatMessage-reloadWeaponWithoutAmmoName", {
                weaponIMG: weaponImg,
                name: actor.name,
                itemWeaponName: selectedWeapon.name
            })
        })
        const {
            sfx_reload,
            sfx_shot,
            sfx_shot_auto,
            sfx_silenced,
            sfx_silenced_auto,
            sfx_empty
        } = await swim.get_weapon_sfx(selectedWeapon)
        if (sfx_reload) {
            AudioHelper.play({src: `${sfx_reload}`}, true)
        }
    }
}

function getValues(html, actor, weapons, ammo) {
    const form = html.find("[name=form]")[0];

    const selectedWeaponForm = form.querySelector('select[name="weapon"]');
    const selectedAmmoForm = form.querySelector('select[name="ammo"]');
    const selectedShotsForm = form.querySelector('input[name="shots"]');
    const selectedSingleReloadForm = form.querySelector('input[name="singleReload"]');

    const selectedWeapon = weapons[selectedWeaponForm.selectedIndex];
    const selectedAmmo = actor.items.getName(ammo[selectedAmmoForm.selectedIndex]);
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