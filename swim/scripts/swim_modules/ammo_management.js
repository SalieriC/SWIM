/*******************************************
 * Ammo Management (Enhanced Version v2)
 * version 7.0.0 – window (AmmoApp) instead of a Dialog; reloading takes a number of bullets
 * By SalieriC#8263 & Loofou#7406. (old Dialogue Framework: Kekilla#7036)
 *
 * Makes heavy use of SFX set up on the weapon.
 * Preset:
 * RELOAD|FIRE|AUTOFIRE|SILENCED|SILENCEDAUTOFIRE|EMPTY
 ******************************************/
import { SwimWindow, t, esc, btn, rate_opt } from "../helpers/swim_window.js"

const SHOTS_PER_ROF = [0, 1, 5, 10, 20, 40, 50]

export async function showWeaponAmmoDialog() {
    const { _, __, ___, token } = await swim.get_macro_variables();
    //early out
    if (!token) return ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
    const actor = token.actor;

    //get weapons
    const weapons = actor.items.filter(checkWeapon);
    if (weapons.length === 0) return ui.notifications.error(game.i18n.localize("SWIM.notification-noReloadableOrConsumableWeapon"));

    await SwimWindow.show(new AmmoApp(actor, weapons))
}

function checkWeapon(item) {
    return item.type === "weapon"
        && item.system.quantity > 0
        && item.flags?.swim?.config !== undefined
        && (item.system.ammo.trim() !== ""
            || item.flags.swim.config.isConsumable === true);
}

/** Positive whole number from the input, or 0 if it isn't one. */
export function parse_amount(value) {
    const n = Math.floor(Number(value))
    return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * Works out what a reload does. Pure.
 * `amount`: how many bullets the user wants to load. Charge packs ignore it (they always charge the weapon fully).
 * Returns `{ error }` (a lang key) or `{ load, newCharges, newAmmo, oldRefill }` (`oldRefill` only when the ammo type changes).
 */
export function reload_plan({ chgType, isPack, autoReload, current, max, available, oldQty, amount }) {
    if (isPack) {
        let oldRefill
        if (chgType) { oldRefill = current === max ? oldQty + 1 : oldQty }
        return { load: max, newCharges: max, newAmmo: available - 1, oldRefill }
    }
    if (!autoReload && amount < 1) { return { error: "SWIM.ammo.notificationNoAmount" } }
    if (chgType) {
        // The old rounds go back into the inventory, the new ammo starts from an empty weapon.
        const load = autoReload ? 0 : Math.min(amount, max, available)
        return { load, newCharges: load, newAmmo: available - load, oldRefill: oldQty + current }
    }
    const required = max - current
    if (required <= 0) { return { error: "SWIM.notification-weaponAlreadyFull" } }
    const load = Math.min(amount, required, available)
    return { load, newCharges: current + load, newAmmo: available - load }
}

class AmmoApp extends SwimWindow {
    #actor
    #weapons

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, { id: 'swim-ammo-management', width: 480 })
    }

    get title() { return t('SWIM.dialogue-ammoManagement') }

    constructor(actor, weapons) {
        super()
        this.#actor = actor
        this.#weapons = weapons
        this.state.mode = 'reload'
        this.#pick_weapon(weapons[0])
    }

    get #weapon() { return this.#weapons.find((w) => w.id === this.state.weaponId) }

    #ammo_names(weapon) {
        return weapon.system.ammo.trim().split('|').filter((a) => !!this.#actor.items.getName(a))
    }

    /** Sets the weapon and the defaults that depend on it: shots = full ROF, ammo = the loaded one, bullets to load = a full magazine. */
    #pick_weapon(weapon) {
        const names = this.#ammo_names(weapon)
        const loaded = weapon.flags.swim.config.loadedAmmo
        this.state.weaponId = weapon.id
        this.state.shots = String(SHOTS_PER_ROF[parseInt(weapon.system.rof)] ?? 0)
        this.state.ammo = names.includes(loaded) ? loaded : names[0]
        this.state.amount = String(parseInt(weapon.system.shots) || 1)
    }

    activateListeners(html) {
        super.activateListeners(html)
        // These change what else is shown, so they re-render.
        html.on('change', 'select[data-field="weaponId"]', () => {
            this.#pick_weapon(this.#weapon)
            this.render()
        })
        html.on('change', 'select[data-field="ammo"]', () => this.render())
    }

    async view() {
        const weapon = this.#weapon
        const s = this.state
        const max = parseInt(weapon.system.shots) || 0
        const current = parseInt(weapon.system.currentShots) || 0
        const loaded = weapon.flags.swim.config.loadedAmmo
        const names = this.#ammo_names(weapon)
        const ammoItem = this.#actor.items.getName(s.ammo)
        const isPack = ammoItem?.flags?.swim?.config?.isPack === true
        const isSingle = weapon.system.reloadType === 'single'
        const reloading = s.mode === 'reload'
        const maxShots = SHOTS_PER_ROF[parseInt(weapon.system.rof)] ?? 0
        const opts = (list, sel) => list.map(([v, l]) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`).join('')

        let body = `<div class="swim-hc-rate swim-us-two">${rate_opt('mode', 'mode', 'reload', t('SWIM.dialogue-reload'), reloading)}${rate_opt('mode', 'mode', 'shooting', t('SWIM.dialogue-shoot'), !reloading)}</div>
            <div class="swim-am-row"><label class="swim-hc-lab">${t('SWIM.ammo.weapon')}</label>
            <select data-field="weaponId">${opts(this.#weapons.map((w) => [w.id, w.name]), weapon.id)}</select></div>
            <div class="swim-am-row"><label class="swim-hc-lab">${t('SWIM.ammo.loaded')}</label>
            <b>${esc(loaded ?? '-')} (${current}/${max})</b></div>`
        if (reloading) {
            body += `<div class="swim-hc-preview">${t('SWIM.ammo.switchHint')}</div>
                <div class="swim-am-row"><label class="swim-hc-lab">${t('SWIM.ammo.ammoToLoad')}</label>
                <select data-field="ammo">${opts(names.map((n) => [n, n]), s.ammo)}</select></div>`
            if (isPack) {
                body += `<div class="swim-hc-preview">${t('SWIM.ammo.packHint')}</div>`
            } else {
                const amount = parse_amount(s.amount)
                body += `<div class="swim-am-row"><label class="swim-hc-lab">${t('SWIM.ammo.amount')}</label>
                    <div class="swim-am-amount"><input type="number" min="1" step="1" data-field="amount" value="${esc(s.amount)}">
                    <div class="swim-hc-rate swim-us-two">${rate_opt('amount', 'amount', max, t('SWIM.ammo.amountMax', { max }), amount === max)}${rate_opt('amount', 'amount', 1, t('SWIM.ammo.amountOne'), amount === 1 && max !== 1)}</div></div></div>
                    <div class="swim-hc-preview">${t('SWIM.ammo.amountHint')}${isSingle ? ` ${t('SWIM.ammo.singleHint')}` : ''}</div>`
            }
        } else {
            body += `<div class="swim-hc-preview">${t('SWIM.ammo.shootHint')}</div>
                <div class="swim-am-row"><label class="swim-hc-lab">${t('SWIM.ammo.shots')}</label>
                <input type="number" min="0" max="${maxShots}" step="1" data-field="shots" value="${esc(s.shots)}"></div>
                <div class="swim-hc-preview">${t('SWIM.ammo.shotsHint')}</div>`
        }
        const go = reloading ? btn('reload', t('SWIM.dialogue-reload'), { go: true }) : btn('shoot', t('SWIM.dialogue-shoot'), { go: true })
        return { body, foot: `<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${go}` }
    }

    async onAction(action, el) {
        if (action === 'cancel') { return this.close() }
        if (action === 'mode') { this.state.mode = el.dataset.mode; return this.render() }
        if (action === 'amount') { this.state.amount = String(el.dataset.amount); return this.render() }
        if (action !== 'shoot' && action !== 'reload') { return }
        this.busy = true
        try {
            if (action === 'shoot') {
                await shoot(this.#weapon, parse_amount(this.state.shots) || 0, this.#actor)
            } else {
                await reload(this.#actor, this.#weapon, this.#actor.items.getName(this.state.ammo), parse_amount(this.state.amount))
            }
        } finally {
            this.busy = false
        }
        return this.close()
    }
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
        } else if (selectedWeapon.system.rof === 2) {
            swim.play_sfx(frenzySFX, volume, true)
        } else if (selectedWeapon.system.rof >= 3) {
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
                { _id: selectedWeapon.id, "system.quantity": newQuantity },
            ];
            // Updating the consumable weapon
            await actor.updateEmbeddedDocuments("Item", updates);
            // This apparently is still a bad idea on BRSW, so don't delete the item because then BRSW isn't able to roll damage from it:
            /*if (newQuantity <= 0) {
                selectedWeapon.delete();
            }*/
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
                { _id: currentAmmoId, "system.quantity": newCharges },
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
            { _id: selectedWeapon.id, "system.currentShots": newCharges },
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


async function reload(actor, selectedWeapon, selectedAmmo, amount) {
    const pronoun = swim.get_pronoun(actor)

    //Set up variables
    const weaponImg = selectedWeapon.img;
    const npcAmmo = game.settings.get('swim', 'npcAmmo');
    const ammoImg = selectedAmmo ? selectedAmmo.img : null;
    const autoReload = selectedWeapon.system.reloadType === "none" ? true : false;

    const all_sfx = await swim.get_weapon_sfx(selectedWeapon)
    const sfx_reload = all_sfx.reloadSFX
    const play_reload = () => {
        if (sfx_reload) {
            const volume = Number(game.settings.get("swim", "defaultVolume"))
            swim.play_sfx(sfx_reload, volume, true)
        }
    }

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
        const oldAmmo = oldAmmoId ? actor.items.getName(oldAmmoId) : null;
        // We suspect that the ammo to reload is the same as the previously loaded one. If not chgType will tell the code to swap the ammo.
        const chgType = oldAmmo !== selectedAmmo;
        if (chgType === false && autoReload) { //Stop here if the weapon doesn't need a reloading action and ammo isn't changed.
            ui.notifications.notify(game.i18n.localize("SWIM.notification-noNeedToReload"))
            return;
        }

        // Checking if the Ammo is a charge pack. If the flag is not present run migration.
        if (!selectedAmmo.flags.swim) {
            await swim.run_migration(false, selectedAmmo)
        }
        // Check if there is ammo left to reload.
        if (parseInt(selectedAmmo.system.quantity) < 1) {
            return ui.notifications.notify(game.i18n.localize("SWIM.notification-outOfAmmo"))
        }
        const plan = reload_plan({
            chgType,
            isPack: selectedAmmo.flags.swim.config.isPack === true,
            autoReload,
            current: parseInt(selectedWeapon.system.currentShots),
            max: parseInt(selectedWeapon.system.shots),
            available: parseInt(selectedAmmo.system.quantity),
            oldQty: parseInt(oldAmmo?.system?.quantity) || 0,
            amount,
        })
        if (plan.error) { return ui.notifications.error(game.i18n.localize(plan.error)) }

        const updates = [
            {
                _id: selectedWeapon.id,
                "system.currentShots": plan.newCharges,
                "flags.swim.config.loadedAmmo": `${selectedAmmo.name}`
            },
            { _id: selectedAmmo.id, "system.quantity": plan.newAmmo },
        ];
        if (chgType && oldAmmo) { updates.push({ _id: oldAmmo.id, "system.quantity": plan.oldRefill }) }

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
        play_reload()
        if (chgType) { await applyActiveEffect(actor, selectedWeapon, selectedAmmo, oldAmmo); }
    } else {
        // If NPCs don't use Ammo from inventory, just reload the weapon:
        const currentCharges = parseInt(selectedWeapon.system.currentShots);
        const maxCharges = parseInt(selectedWeapon.system.shots);
        if (selectedWeapon.flags.swim.config.isConsumable === true) {
            return ui.notifications.error(game.i18n.localize("SWIM.notification-cannotReloadConsumableWeapons"));
        } else if (selectedWeapon.system.reloadType === "none") {
            return ui.notifications.error(game.i18n.localize("SWIM.notification-cannotChangeAmmoTypeIfNPCDontUseAmmoFromInventory"));
        } else if (currentCharges >= maxCharges) {
            return ui.notifications.error(game.i18n.localize("SWIM.notification-weaponAlreadyFull"));
        } else if (amount < 1) {
            return ui.notifications.error(game.i18n.localize("SWIM.ammo.notificationNoAmount"));
        }
        const newCharges = Math.min(maxCharges, currentCharges + amount);
        await actor.updateEmbeddedDocuments("Item", [{ _id: selectedWeapon.id, "system.currentShots": newCharges }]);

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
        play_reload()
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
        // Effect JSON saved by the user may still use the pre-v11 `label` key:
        effectObj.name = `${effectObj.name ?? effectObj.label ?? ""} [${selectedWeapon.name}]`;
        delete effectObj.label;
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

export async function br2_ammo_management_script(br_card, actor, item) {
    const npcAmmo = game.settings.get('swim', 'npcAmmo');
    const brswAmmoMgm = game.settings.get('swim', 'br2ammoMgm')

    if (brswAmmoMgm === 'disabled') { return } //Failsafe as disabled shouldn't lead anyone here in the first place.

    //Don't execute the macro on a reroll by checking if the old_rolls is empty:
    if (br_card.trait_roll.old_rolls.length >= 1) {
        return;
    }

    //If the weapon is not compatible, return early
    if (!checkWeapon(item)) return;

    const traitDice = br_card.trait_roll.current_roll.dice;
    let rate_of_fire = traitDice.length;
    if (actor.system.wildcard === true) {
        rate_of_fire = rate_of_fire - 1;
    }
    let shots = br_card.render_data.used_shots;
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
        if (rate_of_fire >= 6) { //RoF higher than 6 is not supported by swade, keeping the >= here as a failsafe.
            shots = 50;
        }
    }
    let traitId = br_card.render_data.trait_id
    let trait = actor.items.find(i => i.id === traitId)

    if (brswAmmoMgm === 'sfx') { //If the user only want the SFX, play them, otherwise go to ammo management:
        const sfxDelay = game.settings.get('swim', 'sfxDelay');
        const all_sfx = await swim.get_weapon_sfx(item)
        const sfx_shot = all_sfx.fireSFX
        const sfx_shot_auto = all_sfx.autoFireSFX
        const sfx_silenced = all_sfx.silencedFireSFX
        const sfx_silenced_auto = all_sfx.silencedAutoFireSFX
        const sfx_empty = all_sfx.emptySFX
        const isSilenced = item.flags?.swim?.config?.silenced ? item.flags?.swim?.config?.silenced : false
        const currentShots = item.system.currentShots
        const volume = Number(game.settings.get("swim", "defaultVolume"))

        if (currentShots === 0) {
            swim.play_sfx(sfx_empty, volume, true)
        } else {
            await play_sfx(isSilenced, sfx_silenced, shots, sfxDelay, sfx_silenced_auto, sfx_shot, sfx_shot_auto)
        }
    } else {
        await shoot(item, shots, actor, trait);
    }
}