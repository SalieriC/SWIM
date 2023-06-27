/*******************************************
 * Ammo Management (Enhanced Version v2)
 * version 6.0.14
 * By SalieriC#8263 & Loofou#7406. (old Dialogue Framework: Kekilla#7036)
 *
 * Makes heavy use of SFX set up on the weapon.
 * Preset:
 * RELOAD|FIRE|AUTOFIRE|SILENCED|SILENCEDAUTOFIRE|EMPTY
 ******************************************/

export async function showWeaponAmmoDialog() {
    const { _, __, ___, token } = await swim.get_macro_variables();
    //early out
    if (!token) return ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
    const actor = token.actor;

    //get weapons
    const weapons = actor.items.filter(checkWeapon);
    if (weapons.length === 0) return ui.notifications.error(game.i18n.localize("SWIM.notification-noReloadableOrConsumableWeapon"));

    await createDialog(actor, weapons)
}

function checkWeapon(item) {
    return item.type === "weapon"
        && item.system.quantity > 0
        && item.flags?.swim?.config !== undefined
        && (item.system.ammo.trim() !== ""
            || item.flags.swim.config.isConsumable === true);
}

async function createDialog(actor, weapons) {
    const shotsPerRof = [0, 1, 5, 10, 20, 40, 50];

    let defaultWeapon = weapons[0];
    let defaultShots = shotsPerRof[defaultWeapon.system.rof];
    let defaultAmmo = defaultWeapon.system.ammo.trim().split('|').filter(a => !!actor.items.getName(a));
    let loadedAmmo = defaultWeapon.flags.swim.config.loadedAmmo;
    let currentShots = defaultWeapon.system.currentShots;
    let currentMaxShots = defaultWeapon.system.shots;
    let defaultSingleReload = defaultWeapon.system.reloadType === "single" ? " checked" : "";

    await new Dialog({
        title: game.i18n.localize("SWIM.dialogue-ammoManagement"),
        content: `
            <form name="form" xmlns="http://www.w3.org/1999/html">
                <div class="form-group">
                    <label for="mode">Select Mode: </label>
                    <select id="mode" name="mode">
                        <option value="reload" selected>Reload</option>
                        <option value="shooting">Shooting</option>
                    </select>
                </div>
                <hr>
                <h3>Select Weapon</h3>
                <div class="form-group">
                    <label for="weapon">Weapon: </label>
                    <select id="weapon" name="weapon">${weapons.reduce((acc, val) => acc += `<option value="${val.id}" ${val === defaultWeapon ? `selected` : ``}>${val.name}</option>`, ``)}</select>
                </div>
                <div class="form-group">
                    <label for="loaded_ammo">Loaded Ammo: </label>
                    <b><label id="loaded_ammo bold" name="loaded_ammo">${loadedAmmo} (${currentShots}/${currentMaxShots})</label></b>
                    <p class="notes">If this is empty, you should probably load some ammo first with the Reload mode above!</p>
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

                const selectedModeForms = form.querySelector('select[name="mode"]');
                const reloadDiv = form.querySelector("#reload_section");
                const shootingDiv = form.querySelector("#shooting_section");

                //enable and disable the respective part of the form
                if (selectedModeForms.selectedIndex === 0) {
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
                const selectedLoadedAmmoForm = form.querySelector('label[name="loaded_ammo"]');
                const selectedsingleReloadForm = form.querySelector('input[name="singleReload"]');

                const selectedWeapon = weapons[selectedWeaponForm.selectedIndex];

                if (defaultWeapon !== selectedWeapon) {
                    defaultShots = shotsPerRof[parseInt(selectedWeapon.system.rof)];
                    selectedShotsForm.setAttribute("max", defaultShots);
                    selectedShotsForm.setAttribute("value", defaultShots);

                    loadedAmmo = selectedWeapon.flags.swim.config.loadedAmmo;
                    currentShots = selectedWeapon.system.currentShots;
                    currentMaxShots = selectedWeapon.system.shots;
                    selectedLoadedAmmoForm.innerHTML = `${loadedAmmo} (${currentShots}/${currentMaxShots})`;

                    defaultAmmo = selectedWeapon.system.ammo.trim().split('|').filter(a => !!actor.items.getName(a));
                    selectedAmmoForm.innerHTML = defaultAmmo.reduce((acc, val) => acc += `<option value="${val}" ${val === loadedAmmo ? `selected` : ``}>${val}</option>`, ``);
                    
                    selectedsingleReloadForm.checked = (selectedWeapon.system.reloadType === 'single');

                    defaultWeapon = selectedWeapon;
                }
            }

            dialogContent.querySelector(`select[name="mode"]`).focus();
            dialogContent.querySelector(`select[name="weapon"]`).addEventListener("input", weaponSwitchLambda);
            dialogContent.querySelector(`select[name="mode"]`).addEventListener("input", modeSwitchLambda);

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

async function shoot(selectedWeapon, selectedShots, actor, trait = undefined) {
    //Set up variables
    const npcAmmo = game.settings.get('swim', 'npcAmmo');
    const weaponImg = selectedWeapon.img;

    const sfxDelay = game.settings.get('swim', 'sfxDelay');

    const all_sfx = await swim.get_weapon_sfx(selectedWeapon)
    const sfx_reload = all_sfx.reloadSFX
    const sfx_shot = all_sfx.fireSFX
    const sfx_shot_auto = all_sfx.autoFireSFX
    const sfx_silenced = all_sfx.silencedFireSFX
    const sfx_silenced_auto = all_sfx.silencedAutoFireSFX
    const sfx_empty = all_sfx.emptySFX

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
        const volume = Number(game.settings.get("swim", "defaultVolume"))
        if (selectedWeapon.system.rof === 1) {
            swim.play_sfx(attackSFX, volume, true)
        } else if (rate_of_fire === 2) {
            swim.play_sfx(frenzySFX, volume, true)
        } else if (rate_of_fire >= 3) {
            swim.play_sfx(frenzyImpSFX, volume, true)
        }
    }
    //If consumable
    else if (selectedWeapon.flags.swim.config.isConsumable === true) {
        if ( //Only use consumable weapon on a proper trait so that weapons that can be used in melee don't get eaten.
            trait === undefined || //Continues if using the dialogue
            trait.name.toLowerCase().includes(game.i18n.localize("SWIM.skill-athletics").toLowerCase()) || //thrown weapons
            trait.name.toLowerCase().includes(game.i18n.localize("SWIM.skill-throwing").toLowerCase()) || //thrown weapons if s/o uses old rules
            trait.name.toLowerCase().includes(game.i18n.localize("SWIM.skill-survival").toLowerCase()) || // traps, I guess
            trait.name.toLowerCase().includes(game.i18n.localize("SWIM.skill-stealth").toLowerCase()) || // mines, I guess
            trait.name.toLowerCase().includes(game.i18n.localize("SWIM.skill-ghost_ops-demolitions").toLowerCase()) //Savage Ghost Ops
        ) {
            const currentQuantity = parseInt(selectedWeapon.system.quantity);
            if (currentQuantity <= 0) {
                return ui.notifications.error(game.i18n.format("SWIM.notification-noItemLeft", { itemName: selectedWeapon.name }));
            }
            const newQuantity = currentQuantity - selectedShots;
            const updates = [
                { _id: selectedWeapon.id, "system.quantity": `${newQuantity}` },
            ];
            // Updating the consumable weapon
            await actor.updateEmbeddedDocuments("Item", updates);
            // This used to be a very bad idea because BRSW couldn't make rolls if the consumable was deleted. But nowadays it should be fine...
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
                    name: actor.name,
                    shots: selectedShots,
                    itemWeaponName: selectedWeapon.name,
                    newQuantity: newQuantity
                })
            })
            // Play sound effects
            if (sfx_shot) {
                const volume = Number(game.settings.get("swim", "defaultVolume"))
                swim.play_sfx(sfx_shot, volume, true)
            }
        } else { return }
    }
    //Weapon doesn't require reload action
    else if (selectedWeapon.system.reloadType === "none") { //system.reloadType
        const currentAmmoItem = actor.items.getName(currentAmmo);
        const currentAmmoId = currentAmmoItem?.id;
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
        } else if (!currentAmmoItem && (actor.type === "character" || npcAmmo === true)) {
            return ui.notifications.error(game.i18n.localize("SWIM.notification-noRequiredAmmoAvailable"));
        } else if (currentAmmoItem.system.quantity <= 0 && (actor.type === "character" || npcAmmo === true)) {
            return ui.notifications.error(game.i18n.format("SWIM.notification-noItemLeft", { itemName: currentAmmoItem.name }));
        } else {
            //Setting new constants to overwrite the old ones
            const currentCharges = currentAmmoItem.system.quantity;
            const newCharges = currentCharges - selectedShots;
            //Setting up the updates
            const updates = [
                { _id: currentAmmoId, "system.quantity": `${newCharges}` },
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
    else if (currentCharges < selectedShots && selectedWeapon.system.reloadType !== "none") {
        ui.notifications.error(game.i18n.localize("SWIM.notification-insufficientAmmoAvailable"))
        if (sfx_empty && currentCharges === 0) {
            const volume = Number(game.settings.get("swim", "defaultVolume"))
            swim.play_sfx(sfx_empty, volume, true)
        }
        //Normal ranged weapon
    } else {
        const updates = [
            { _id: selectedWeapon.id, "system.currentShots": `${newCharges}` },
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

async function shootButton(html, actor, weapons, ammo) {
    const {
        selectedWeapon,
        selectedAmmo,
        selectedShots,
        selectedSingleReload
    } = getValues(html, actor, weapons, ammo);

    await shoot(selectedWeapon, selectedShots, actor);
}

async function reloadButton(html, actor, weapons, ammo) {
    const {
        selectedWeapon,
        selectedAmmo,
        selectedShots,
        selectedSingleReload
    } = getValues(html, actor, weapons, ammo);
    const pronoun = swim.get_pronoun(actor)

    //Set up variables
    const weaponImg = selectedWeapon.img;
    const npcAmmo = game.settings.get('swim', 'npcAmmo');
    const ammoImg = selectedAmmo ? selectedAmmo.img : null;
    const autoReload = selectedWeapon.system.reloadType === "none" ? true : false;

    const all_sfx = await swim.get_weapon_sfx(selectedWeapon)
    const sfx_reload = all_sfx.reloadSFX

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
        let oldAmmo = oldAmmoId ? actor.items.getName(oldAmmoId) : null;
        // We suspect that the ammo to reload is the same as the previously loaded one. If not chgType will tell the code to swap the ammo.
        let chgType = false;
        if (oldAmmo !== selectedAmmo) {
            chgType = true;
        }
        if (chgType === false && autoReload) { //Stop here if the weapon doesn't need a reloading action and ammo isn't changed.
            ui.notifications.notify(game.i18n.localize("SWIM.notification-noNeedToReload"))
            return;
        }

        // Getting current numbers
        const currentCharges = parseInt(selectedWeapon.system.currentShots);
        const maxCharges = parseInt(selectedWeapon.system.shots);
        const requiredCharges = parseInt(selectedWeapon.system.shots - currentCharges);
        const availableAmmo = parseInt(selectedAmmo.system.quantity);
        const oldAmmoQuantity = parseInt(oldAmmo?.system?.quantity) || 0;

        // Variables for recharging procedure
        let amountToRecharge;
        let newCharges;
        let newAmmo;
        let oldAmmoRefill;

        // Checking if the Ammo is a charge pack. If not or flag is not present run migration. Charge Packs can only refill if curr and max shots are equal.
        if (!selectedAmmo.flags.swim || !selectedAmmo.flags.swim) {
            await swim.run_migration(false, selectedAmmo)
        }
        if (selectedAmmo.flags.swim.config.isPack === true) {
            // Charge Packs only use 1 Quantity to fully charge the weapon
            amountToRecharge = parseInt(selectedWeapon.system.shots);
            newCharges = amountToRecharge;
            newAmmo = availableAmmo - 1;
            //Refill old Charge Pack if it is still full (current and max shots are equal)
            if (chgType) {
                if (currentCharges === maxCharges) {
                    oldAmmoRefill = oldAmmoQuantity + 1;
                } else {
                    oldAmmoRefill = oldAmmoQuantity;
                }
            }
        }
        // Checking if user selected to change the ammo type. This is only relevant if not a Charge Pack, if it is, it's already handled above.
        else if (chgType) {
            // When changing Ammo type, remaining shots should not become the new Ammo Type.
            amountToRecharge = parseInt(selectedWeapon.system.shots);
            //Change the amount to recharge to 1 if singleReload is checked.
            if (selectedSingleReload) {
                amountToRecharge = 1
            }
            if (autoReload) {
                amountToRecharge = 0
            }
            newCharges = amountToRecharge;
            newAmmo = availableAmmo - amountToRecharge;
            oldAmmoRefill = oldAmmoQuantity + currentCharges;
        } else {
            // If the quantity of ammo is less than the amount required, use whatever is left.
            amountToRecharge = Math.min(availableAmmo, requiredCharges);
            //Change the amount to recharge to 1 if singleReload is checked.
            if (selectedSingleReload) {
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
        } else if (chgType) {
            const updates = [
                {
                    _id: selectedWeapon.id,
                    "system.currentShots": `${newCharges}`,
                    "flags.swim.config.loadedAmmo": `${selectedAmmo.name}`
                },
                { _id: selectedAmmo.id, "system.quantity": `${newAmmo}` },
            ];
            if (oldAmmo) { updates.push({ _id: oldAmmo?.id, "system.quantity": `${oldAmmoRefill}` }) }

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
                    itemAmmoName: selectedAmmo.name,
                    pronoun: pronoun
                })
            })
            if (sfx_reload) {
                const volume = Number(game.settings.get("swim", "defaultVolume"))
                swim.play_sfx(sfx_reload, volume, true)
            }

            await applyActiveEffect(actor, selectedWeapon, selectedAmmo, oldAmmo);
        } else {
            const updates = [
                {
                    _id: selectedWeapon.id,
                    "system.currentShots": `${newCharges}`,
                    "flags.swim.config.loadedAmmo": `${selectedAmmo.name}`
                },
                { _id: selectedAmmo.id, "system.quantity": `${newAmmo}` },
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
                    itemAmmoName: selectedAmmo.name,
                    pronoun: pronoun
                })
            })
            if (sfx_reload) {
                const volume = Number(game.settings.get("swim", "defaultVolume"))
                swim.play_sfx(sfx_reload, volume, true)
            }
        }
    } else {
        // If NPCs don't use Ammo from inventory, just reload the weapon:
        let newCharges;
        const currentCharges = parseInt(selectedWeapon.system.currentShots);
        const maxCharges = parseInt(selectedWeapon.system.shots);
        if (selectedWeapon.flags.swim.config.isConsumable === true) {
            return ui.notifications.error(game.i18n.localize("SWIM.notification-cannotReloadConsumableWeapons"));
        } else if (selectedWeapon.system.reloadType === "none") {
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
            { _id: selectedWeapon.id, "system.currentShots": `${newCharges}` }
        ];
        await actor.updateEmbeddedDocuments("Item", updates);

        ChatMessage.create({
            speaker: {
                alias: actor.name
            },
            content: game.i18n.format("SWIM.chatMessage-reloadWeaponWithoutAmmoName", {
                weaponIMG: weaponImg,
                name: actor.name,
                itemWeaponName: selectedWeapon.name,
                pronoun: pronoun
            })
        })
        if (sfx_reload) {
            const volume = Number(game.settings.get("swim", "defaultVolume"))
            swim.play_sfx(sfx_reload, volume, true)
        }
    }
}

async function applyActiveEffect(actor, selectedWeapon, selectedAmmo, oldAmmo) {
    if (oldAmmo?.flags?.swim?.config?.ammoActiveEffect !== undefined) {
        const effects = actor.effects.filter(e => {
            return e.flags?.swim?.ammoEffectFor === selectedWeapon.id
        });
        const toDelete = effects.map(a => a._id);
        await actor.deleteEmbeddedDocuments("ActiveEffect", toDelete);
    }

    if (selectedAmmo.flags?.swim?.config?.ammoActiveEffect !== undefined
        && selectedAmmo.flags?.swim?.config?.ammoActiveEffect?.trim() !== "") {
        let effectObj = JSON.parse(selectedAmmo.flags.swim.config.ammoActiveEffect);

        //Adjust effect to work with items
        delete effectObj._id; //We want a unique ID for this one
        effectObj.label += `[${selectedWeapon.name}]`;
        for (let change of effectObj.changes) {
            const oldKey = change.key;
            change.key = `@${selectedWeapon.type}{${selectedWeapon.name}}[${oldKey}]`;

            //Any custom effect code goes here
            if (oldKey === "system.range" && selectedWeapon.system.range.includes("/")) {
                const oldRange = selectedWeapon.system.range;
                let rangeNums = oldRange.split("/");
                if (change.mode === CONST.ACTIVE_EFFECT_MODES.ADD) {
                    rangeNums[0] += change.value;
                    rangeNums[1] += change.value * 2;
                    rangeNums[2] += change.value * 4;
                } else if (change.mode === CONST.ACTIVE_EFFECT_MODES.MULTIPLY) {
                    rangeNums[0] *= change.value;
                    rangeNums[1] *= change.value;
                    rangeNums[2] *= change.value;
                }
                change.value = `${rangeNums[0]}/${rangeNums[1]}/${rangeNums[2]}`;
                change.mode = CONST.ACTIVE_EFFECT_MODES.OVERRIDE;
            }
        }
        effectObj.flags = { ...effectObj.flags, ...{ swim: { ammoEffectFor: selectedWeapon.id } } };

        await CONFIG.ActiveEffect.documentClass.create(effectObj, {
            rendersheet: false,
            parent: actor
        });
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
    /*console.log(
        "isSilenced: ", isSilenced,
        "sfx_silenced: ", sfx_silenced,
        "shots: ", shots,
        "sfxDelay: ", sfxDelay,
        "sfx_silenced_auto: ", sfx_silenced_auto,
        "sfx_shot: ", sfx_shot,
        "sfx_shot_auto: ", sfx_shot_auto
    )*/
    //Get volume from setting:
    const volume = Number(game.settings.get("swim", "defaultVolume"))
    // Play sound effects
    if (isSilenced === true && sfx_silenced) {
        if (shots === 2) {
            swim.play_sfx(sfx_silenced, volume, true)
            await wait(`${sfxDelay}`);
            swim.play_sfx(sfx_silenced, volume, true)
        } else if (shots === 3) {
            swim.play_sfx(sfx_silenced, volume, true)
            await wait(`${sfxDelay}`);
            swim.play_sfx(sfx_silenced, volume, true)
            await wait(`${sfxDelay}`);
            swim.play_sfx(sfx_silenced, volume, true)
        } else if (shots > 3 && sfx_silenced_auto) {
            swim.play_sfx(sfx_silenced_auto, volume, true)
        } else {
            swim.play_sfx(sfx_silenced, volume, true)
        }
    } else {
        if (shots === 2) {
            swim.play_sfx(sfx_shot, volume, true)
            await wait(`${sfxDelay}`);
            swim.play_sfx(sfx_shot, volume, true)
        } else if (shots === 3) {
            swim.play_sfx(sfx_shot, volume, true)
            await wait(`${sfxDelay}`);
            swim.play_sfx(sfx_shot, volume, true)
            await wait(`${sfxDelay}`);
            swim.play_sfx(sfx_shot, volume, true)
        } else if (shots > 3 && sfx_shot_auto) {
            swim.play_sfx(sfx_shot_auto, volume, true)
        } else {
            swim.play_sfx(sfx_shot, volume, true)
        }
    }
}

/*******************************************
 * Ammo Management (BR2 Version)
 * version 6.0.0
 * By SalieriC#8263 & Loofou#7406 (with help from javierrivera#4813)
 *
 * This version relies on Better Rolls 2,
 * Please read the documentation!
 ******************************************/

export async function br2_ammo_management_script(message, actor, item) {
    const npcAmmo = game.settings.get('swim', 'npcAmmo');

    //Don't execute the macro on a reroll by checking if the old_rolls is empty:
    if (message.flags['betterrolls-swade2'].render_data.trait_roll.old_rolls.length >= 1) {
        return;
    }

    //If the weapon is not compatible, return early
    if (!checkWeapon(item)) return;

    const traitDice = message.flags['betterrolls-swade2'].render_data.trait_roll.dice;
    let rate_of_fire = traitDice.length;
    if (actor.system.wildcard === true) {
        rate_of_fire = rate_of_fire - 1;
    }
    let shots = message.flags['betterrolls-swade2'].render_data.used_shots;
    //failsafe to guss amount of shots in case BR2 return zero or undefined:
    if (shots === 0 || !shots) {
        if (rate_of_fire === 1) {
            shots = 1;
        }
        if (rate_of_fire === 2) {
            shots = 5;
        }
        if (rate_of_fire === 3) {
            shots = 10;
        }
        if (rate_of_fire === 4) {
            shots = 20;
        }
        if (rate_of_fire === 5) {
            shots = 40;
        }
        if (rate_of_fire === 6) {
            shots = 50;
        }
    }
    let traitId = message.flags['betterrolls-swade2'].render_data.trait_id
    let trait = actor.items.find(i => i.id === traitId)

    await shoot(item, shots, actor, trait);
}