import { change, changes_of } from "./helpers/effect_data.js"
import { api } from './api.js';
import { register_settings } from './settings.js'
import { swim_buttons } from './buttons.js'
import { gm_relay } from './gm_relay.js'
import { shape_changer_gm } from './swim_modules/shape_changer.js'
import { summoner_gm, summoner_dismiss } from './swim_modules/mighty-summoner.js'
import { heal_other_gm, heal_potion_gm } from './swim_modules/personal_health_centre.js'
import { common_bond_gm } from './swim_modules/common_bond.js'
import { effect_builder_gm } from './swim_modules/effect_builder.js'
import { craft_campfire_gm } from './swim_modules/craft_campfire.js'
import { open_swim_actor_config, open_swim_item_config } from "./swim_document_config.js";
import { effect_hooks } from "./hooks/effect_hooks.js"
import { combat_hooks } from "./hooks/combat_hooks.js"
import { brsw_hooks } from "./hooks/brsw_hooks.js"
import { sfx_hooks } from "./hooks/sfx_hooks.js"
import { vision_hooks } from "./hooks/vision_hooks.js"
import { scene_config_hooks } from "./hooks/scene_config_hooks.js"
import { aura_hooks, install_aura_suppression } from "./hooks/aura_hooks.js"
import { migrate_potion_names } from "./helpers/swid_lists.js"
import { brsw_actions_setup } from "./helpers/brsw_actions_setup.js"
import { raise_calculator } from './helpers/raise-calculator.js'
import { tester_gm } from './swim_modules/tester.js';
import { guard, socket_validators as v } from './helpers/socket_guard.js'

/*Hooks.on('getCardsDirectoryEntryContext', function (stuff) {
    console.log(stuff)
})*/

Hooks.on("init", () => {
    // An aura source must not change its own owner (hooks/aura_hooks.js); has to be in place before the first actor is prepared.
    install_aura_suppression()
    game.keybindings.register("swim", "raiseCalculator", {
        name: "SWIM.openRaiseCalculatorName",
        hint: "SWIM.openRaiseCalculatorHint",
        onDown: async () => {
            raise_calculator();
        },
        restricted: false,
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
    });
});

Hooks.on('getSceneControlButtons', function (hudButtons) {
    if (game.settings.get("swim", "raiseCalculator")) {
        swim_buttons(hudButtons)
    }
});

Hooks.on('setup', () => {
    register_settings()
    api.registerFunctions()
})

export let socket;
Hooks.once("socketlib.ready", () => {
    socket = socketlib.registerModule("swim");
    // Every handler is wrapped by guard(): the payload is validated against the invoking user before the GM handler runs (helpers/socket_guard.js).
    socket.register("effectBuilder", guard("effectBuilder", effect_builder_gm, v.effectBuilder));
    socket.register("shapeChanger", guard("shapeChanger", shape_changer_gm, v.shapeChanger));
    socket.register("summoner", guard("summoner", summoner_gm, v.summoner));
    socket.register("summonerDismiss", guard("summonerDismiss", summoner_dismiss, v.summonerDismiss));
    socket.register("healOther", guard("healOther", heal_other_gm, v.healOther));
    socket.register("healPotion", guard("healPotion", heal_potion_gm, v.healPotion));
    socket.register("commonBond", guard("commonBond", common_bond_gm, v.commonBond));
    socket.register("deleteActor", guard("deleteActor", gm_relay.gmDeleteActor, v.deleteActor));
    socket.register("craftCampfire", guard("craftCampfire", craft_campfire_gm, v.craftCampfire));
    socket.register("tester", guard("tester", tester_gm, v.tester));
});

Hooks.on(`ready`, () => {
    // Set round time to 6 as appropriate to the system:
    if (CONFIG.time.roundTime != 6 && swim.is_first_gm()) { CONFIG.time.roundTime = 6 }
    // Check Dependencies
    if (!game.modules.get('socketlib')?.active && game.user.isGM) {
        let key = "install and activate";
        if (game.modules.get('socketlib')) key = "activate";
        ui.notifications.error(`SWIM requires the 'socketlib' module. Please ${key} it.`)
    }

    //Run functions to register hooks:
    effect_hooks()
    combat_hooks()
    brsw_hooks()
    sfx_hooks()
    vision_hooks()
    scene_config_hooks()
    aura_hooks()

    // One time: old potion name settings -> SWID list (GM only)
    if (swim.is_first_gm()) { migrate_potion_names().catch((err) => console.error('SWIM | Potion migration failed', err)) }

    //Setup actions for BRSW:
    if (game.modules.get('betterrolls-swade2')?.active && game.settings.get('swim', 'br2Support') === true) {
        brsw_actions_setup()
    }

    // Registering SWIM functions to effect callbacks of SWIM:
    let version = "SWADE"
    if (game.settings.get('swim', 'swdUnshake') === true) {
        version = "SWD"
        // Disable subtracting Wounds from Pace if SWD Unshake is used:
        if ( game.settings.get("swade", "enableWoundPace") === true && swim.is_first_gm() ) {
            game.settings.set("swade", "enableWoundPace", false)
            ui.notifications.notify(game.i18n.localize("SWIM.notification-adjustPaceDisabled"))
        }
    }
    // SWD: Shaken halves Pace. Added to the shaken entry of CONFIG.statusEffects (the status effect is built from it, also by SUCC).
    // Idempotent: any existing copy of this change is dropped first, then exactly one is added if SWD Unshake is on.
    // `system.pace` is the SWADE 6 pace object; a multiply change on it applies to all pace types.
    const swdShaken = version === "SWD"
    const isSwdPaceChange = (c) => c.key === "system.pace" && (c.type === 'multiply') && Number(c.value) === 0.5
    const withSwdPaceChange = (statusEffect) => {
        const kept = changes_of(statusEffect).filter(c => !isSwdPaceChange(c))
        if (swdShaken) kept.push(change("system.pace", "multiply", 0.5))
        statusEffect.system ??= {}
        statusEffect.system.changes = kept
        delete statusEffect.changes
    }
    Hooks.once('succReady', () => {
        for (const statusEffect of CONFIG.statusEffects) {
            if (statusEffect.id === 'shaken' || statusEffect.statuses?.includes?.('shaken')) { withSwdPaceChange(statusEffect) }
        }
    })
    const callbackMode = game.settings.get("swim", "callbackMode")
    if (callbackMode === "manual" || callbackMode === "automatic") {
        game.swade.effectCallbacks.set("shaken", swim.unshake)
        game.swade.effectCallbacks.set("stunned", swim.unstun)
        game.swade.effectCallbacks.set("bleeding-out", swim.soak_damage)
    }

    // Set Health Estimate up
    if (game.modules.get('healthEstimate')?.active && swim.is_first_gm()) {
        console.log("SWIM | Health Estimate found, setting it up for SWIM.")
        if (game.settings.get("healthEstimate", "core.deathState")) {game.settings.set("healthEstimate", "core.deathState", true)}
    }

    // First Login warning
    if ((game.settings.get('swim', 'docReadV1.1.0') === false || !game.settings.get("swade", "tocBlockList")["swim.swim-actor-folders"]) && swim.is_first_gm()) {
        let additionalText = ""
        let unshakeWarning = "<p><strong>If you have used SWIM before: Please note that you have to replace your unshake macro with the new version in the compendium. The SWD (old) unshaken rules can now be activated in the settings.</strong></p><hr />"
        if (!game.settings.get("swade", "tocBlockList")["swim.swim-roll-tables"]) {additionalText = "<p><strong>Please note:</strong> To make some adjustments to properly use SWIM, the world will be reloaded after closing this dialogue.<p>"}
        new foundry.applications.api.DialogV2({
            window: { title: 'Welcome to SWIM' },
            content: `<div>
                <h1>Welcome to SWIM</h1>
                ${unshakeWarning}
                <p>SWIM means SWADE Immersive Macros and that's exactly what you get.</p>
                <p>Please make sure to read the <a href="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/README.md">ReadMe</a> and the <a href="https://github.com/SalieriC/SWADE-Immersive-Macros/tree/main/documentation">documentation</a> on the GitHub. Don't blame me if you don't quite get how SWIM works when it is in there. If it is not in there however, feel free to drop me a DM on Discord: SalieriC#8263</p>
                <p>Please also note that SWIM overrides some SWADE System behaviour, especially the chase cleanup. Instead you'll find the same button in the same spot (Tile controls on the left) that sets up a chase for you. Make sure to use the Chase Layouts provided by SWIM and found in a compendium with this, on other scenes the cards may not align properly. <strong>Do not blame FloRad</strong> if that is not working, it is provided by SWIM, not the system.</p>
                <p>Check this Box if you have read this dalogue and the ReadMe/Documentation of SWIM. Then this dalogue won't show up again.<p>
                <hr />
                <div class="form-group">
                    <label for="readIt">I declare that I have read all of the above and I won't bother the SWADE or PEG Inc. team with questions and problems regarding SWIM or I may be struck down by lightning: </label>
                    <input id="readIt" name="Read it!" type="checkbox"></input>
                </div>
                ${additionalText}
                <hr />
                <p>Please also consider to donate if you really like SWIM. This is one of the few ways of letting me know that SWIM is actually used and appreciated by some. =)</p>
                <p><a href="https://ko-fi.com/Q5Q72EE4Z" target="_blank" rel="noopener"><img style="border: 0px; display: block; margin-left: auto; margin-right: auto; height: 36px;" height="36" src="https://storage.ko-fi.com/cdn/kofi2.png?v=6" alt="Buy Me a Coffee at ko-fi.com" /></a></p>
            </div>`,
            buttons: [{
                    action: "one",
                    label: "Let me play already!",
                    default: true,
                    callback: async (event, button, dialog) => {
                        let readIt = dialog.element.querySelector("#readIt").checked
                        if (readIt === true) {
                            game.settings.set('swim', 'docReadV1.1.0', true)
                            let blockedTOCPacks = game.settings.get("swade", "tocBlockList")
                            if (!blockedTOCPacks["swim.swim-roll-tables"] || !blockedTOCPacks["swim.swim-actor-folders"] || !blockedTOCPacks["swim.swade-immersive-macros"]) {
                                blockedTOCPacks["swim.swim-actor-folders"] = true
                                blockedTOCPacks["swim.swade-immersive-macros"] = true
                                blockedTOCPacks["swim.swim-roll-tables"] = true
                                await game.settings.set("swade", "tocBlockList", blockedTOCPacks) //Needed to see the folders in the compendium.
                                window.location.reload();
                            }
                        }
                    }
                }],
        }).render({ force: true });
    } else if (game.settings.get('swim', 'br2Message') === false && game.modules.get('betterrolls-swade2')?.active && game.user.isGM === true) {
        new foundry.applications.api.DialogV2({
            window: { title: 'Better Rolls 2 support for SWIM.' },
            content: `<div>
                <h1>Better Rolls 2 support for SWIM.</h1>
                <p>Good news everyone!<p>
                <p>As of SWIM version 0.17.0, SWIM natively offers Better Rolls 2 support. That means you can now enable all those immersive SWIM sound effects when applying damage, soaking and unshaking from the BR2 messages.</p>
                <p>This setting is optional however.</p>
                <div class="form-group">
                    <label for="activate">Do you want to activate BR2 support now? (You'll only get asked this one time, you can change that in the module settings however.)</label>
                    <input id="activate" name="Activate BR2 support?" type="checkbox"></input>
                </div>
                <hr />
                <p>Please also consider to donate if you really like SWIM. This is one of the few ways of letting me know that SWIM is actually used and appreciated by some. =)</p>
                <p><a href="https://ko-fi.com/Q5Q72EE4Z" target="_blank" rel="noopener"><img style="border: 0px; display: block; margin-left: auto; margin-right: auto; height: 36px;" height="36" src="https://storage.ko-fi.com/cdn/kofi2.png?v=6" alt="Buy Me a Coffee at ko-fi.com" /></a></p>
            </div>`,
            buttons: [{
                    action: "one",
                    label: "Damn you Sal! Let. Me. Play. NOW!",
                    default: true,
                    callback: async (event, button, dialog) => {
                        let activate = dialog.element.querySelector("#activate").checked
                        if (activate === true) {
                            game.settings.set('swim', 'br2Support', true)
                        }
                        game.settings.set('swim', 'br2Message', true)
                        await swim.wait('20')
                        window.location.reload();
                    }
                }],
        }).render({ force: true });
    }

    //SWIM per-actor/item config header button
    if (game.user.isGM || game.settings.get('swim', 'allowUserConfig')) {
        // v14: the sheets are ApplicationV2; their header buttons are `controls` (shown in the window menu) of the `getHeaderControls...` hook
        Hooks.on('getHeaderControlsDocumentSheetV2', function (sheet, controls) {
            const doc = sheet.document
            if (doc?.documentName === 'Item') {
                controls.unshift({ action: 'swimConfig', label: 'SWIM', icon: 'fa-solid fa-person-swimming', onClick: () => open_swim_item_config(doc) })
            } else if (doc?.documentName === 'Actor') {
                controls.unshift({ action: 'swimConfig', label: 'SWIM', icon: 'fa-solid fa-person-swimming', onClick: () => open_swim_actor_config(doc) })
            }
        });
    }

    //Shuffle SWIMs own deck of cards:
    swim.shuffle_deck(false, false)

    // Ready notification stuff
    console.log("  █████████  █████   ███   █████ █████ ██████   ██████\n ███░░░░░███░░███   ░███  ░░███ ░░███ ░░██████ ██████ \n░███    ░░░  ░███   ░███   ░███  ░███  ░███░█████░███ \n░░█████████  ░███   ░███   ░███  ░███  ░███░░███ ░███ \n ░░░░░░░░███ ░░███  █████  ███   ░███  ░███ ░░░  ░███ \n ███    ░███  ░░░█████░█████░    ░███  ░███      ░███ \n░░█████████     ░░███ ░░███      █████ █████     █████\n ░░░░░░░░░       ░░░   ░░░      ░░░░░ ░░░░░     ░░░░░ ")
    console.log('SWIM | SWADE Immersion Module | Ready');
});
