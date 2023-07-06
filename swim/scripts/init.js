import { api } from './api.js';
import { register_settings } from './settings.js'
import { swim_buttons } from './buttons.js'
import { gm_relay } from './gm_relay.js'
import { shape_changer_gm } from './swim_modules/shape_changer.js'
import { summoner_gm } from './swim_modules/mighty-summoner.js'
import { heal_other_gm } from './swim_modules/personal_health_centre.js'
import { common_bond_gm } from './swim_modules/common_bond.js'
import { effect_builder_gm } from './swim_modules/effect_builder.js'
import { craft_campfire_gm } from './swim_modules/craft_campfire.js'
import { open_swim_actor_config, open_swim_item_config } from "./swim_document_config.js";
import { v10_migration, v11_migration } from "./migrations.js"
import { effect_hooks } from "./hooks/effect_hooks.js"
import { actor_hooks } from "./hooks/actor_hooks.js"
import { combat_hooks } from "./hooks/combat_hooks.js"
import { brsw_hooks } from "./hooks/brsw_hooks.js"
import { brsw_actions_setup } from "./helpers/brsw_actions_setup.js"
import { raise_calculator } from './helpers/raise-calculator.js'
import { tester_gm } from './swim_modules/tester.js';

/*Hooks.on('getCardsDirectoryEntryContext', function (stuff) {
    console.log(stuff)
})*/

Hooks.on("init", () => {
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

Hooks.on(`ready`, () => {
    // Set round time to 6 as appropriate to the system:
    if (CONFIG.time.roundTime != 6 && swim.is_first_gm()) { CONFIG.time.roundTime = 6 }
    // Check Dependencies
    if (!game.modules.get('settings-extender')?.active && game.user.isGM) {
        let key = "install and activate";
        if (game.modules.get('settings-extender')) key = "activate";
        ui.notifications.error(`SWIM requires the 'settings-extender' module. Please ${key} it.`)
    }
    if (!game.modules.get('warpgate')?.active && game.user.isGM) {
        let key = "install and activate";
        if (game.modules.get('warpgate')) key = "activate";
        ui.notifications.error(`SWIM requires the 'warpgate' module. Please ${key} it.`)
    }

    //Run functions to register hooks:
    effect_hooks()
    actor_hooks()
    combat_hooks()
    brsw_hooks()

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
        // Add half pace effect to Shaken:
        Hooks.once('succReady', (api) => {
            const status = api.conditions.find(c => c.id === 'shaken')
            if (status) {
                status.activeEffect.changes.push({key: "system.stats.speed.value", mode: 1, priority: undefined, value: "0.5"})
            }
        })
    }
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
        new Dialog({
            title: 'Welcome to SWIM',
            content: `<form>
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
                <p><a href="https://ko-fi.com/salieric"><img style="border: 0px; display: block; margin-left: auto; margin-right: auto;" src="https://www.ko-fi.com/img/githubbutton_sm.svg" width="223" height="30" /></a></p>
            </form>`,
            buttons: {
                one: {
                    label: "Let me play already!",
                    callback: async (html) => {
                        let readIt = html.find("#readIt")[0].checked
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
                }
            },
        }).render(true);
    } else if (game.settings.get('swim', 'v1MigrationDone') === false) {
        v10_migration()
    } else if (game.settings.get('swim', 'v2MigrationDone') === false) {
        v11_migration()
    } else if (game.settings.get('swim', 'br2Message') === false && game.modules.get('betterrolls-swade2')?.active && game.user.isGM === true) {
        new Dialog({
            title: 'Better Rolls 2 support for SWIM.',
            content: `<form>
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
                <p><a href="https://ko-fi.com/salieric"><img style="border: 0px; display: block; margin-left: auto; margin-right: auto;" src="https://www.ko-fi.com/img/githubbutton_sm.svg" width="223" height="30" /></a></p>
            </form>`,
            buttons: {
                one: {
                    label: "Damn you Sal! Let. Me. Play. NOW!",
                    callback: async (html) => {
                        let activate = html.find("#activate")[0].checked
                        if (activate === true) {
                            game.settings.set('swim', 'br2Support', true)
                        }
                        game.settings.set('swim', 'br2Message', true)
                        await swim.wait('20')
                        window.location.reload();
                    }
                }
            },
        }).render(true);
    }

    // Warpgate Watches
    warpgate.event.watch("SWIM.shapeChanger", shape_changer_gm, swim.is_first_gm)
    warpgate.event.watch("SWIM.summoner", summoner_gm, swim.is_first_gm)
    warpgate.event.watch("SWIM.healOther", heal_other_gm, swim.is_first_gm)
    warpgate.event.watch("SWIM.commonBond", common_bond_gm, swim.is_first_gm)
    warpgate.event.watch("SWIM.effectBuilder", effect_builder_gm, swim.is_first_gm)
    warpgate.event.watch("SWIM.deleteActor", gm_relay.gmDeleteActor, swim.is_first_gm)
    warpgate.event.watch("SWIM.updateCombat-previousTurn", gm_relay.combat_previousTurn, swim.is_first_gm)
    warpgate.event.watch("SWIM.updateCombat-nextTurn", gm_relay.combat_nextTurn, swim.is_first_gm)
    warpgate.event.watch("SWIM.updateCombat-currentTurn", gm_relay.combat_currentTurn, swim.is_first_gm)
    warpgate.event.watch("SWIM.craftCampfire", craft_campfire_gm, swim.is_first_gm)
    warpgate.event.watch("SWIM.summoner", tester_gm, swim.is_first_gm)

    //SWIM per-actor/item config header button
    if (game.user.isGM || game.settings.get('swim', 'allowUserConfig')) {
        Hooks.on('getItemSheetHeaderButtons', function (sheet, buttons) {
            buttons.unshift({
                class: 'swim_config_button',
                label: 'SWIM',
                icon: 'fas fa-swimmer',
                onclick: () => open_swim_item_config(sheet.item)
            });
        });
        Hooks.on('getActorSheetHeaderButtons', function (sheet, buttons) {
            buttons.unshift({
                class: 'swim_config_button',
                label: 'SWIM',
                icon: 'fas fa-swimmer',
                onclick: () => open_swim_actor_config(sheet.actor)
            });
        });
    }

    //Shuffle SWIMs own deck of cards:
    swim.shuffle_deck(false, false)

    // Ready notification stuff
    console.log("  █████████  █████   ███   █████ █████ ██████   ██████\n ███░░░░░███░░███   ░███  ░░███ ░░███ ░░██████ ██████ \n░███    ░░░  ░███   ░███   ░███  ░███  ░███░█████░███ \n░░█████████  ░███   ░███   ░███  ░███  ░███░░███ ░███ \n ░░░░░░░░███ ░░███  █████  ███   ░███  ░███ ░░░  ░███ \n ███    ░███  ░░░█████░█████░    ░███  ░███      ░███ \n░░█████████     ░░███ ░░███      █████ █████     █████\n ░░░░░░░░░       ░░░   ░░░      ░░░░░ ░░░░░     ░░░░░ ")
    console.log('SWIM | SWADE Immersion Module | Ready');
});

/* This produces duplicate sound effects, leaving it commented until a good solution to exclude them on a condition is found.
Hooks.on(`createActiveEffect`, async (condition, _, userID) => {
    if (condition.flags?.succ?.conditionId === "incapacitated" || condition.flags?.succ?.conditionId === "shaken") {
        const actor = condition.parent
        const { shakenSFX, deathSFX, unshakeSFX, soakSFX } = await swim.get_actor_sfx(actor)
        const volume = Number(game.settings.get("swim", "defaultVolume"))
        if (condition.flags?.succ?.conditionId === "incapacitated") {
            await swim.play_sfx(deathSFX, volume)
        } else if (condition.flags?.succ?.conditionId === "shaken") {
            await swim.play_sfx(shakenSFX, volume)
        }
    }
})
Hooks.on(`deleteActiveEffect`, async (condition, _, userID) => {
    if (condition.flags?.succ?.conditionId === "incapacitated" || condition.flags?.succ?.conditionId === "shaken") {
        const actor = condition.parent
        const { shakenSFX, deathSFX, unshakeSFX, soakSFX } = await swim.get_actor_sfx(actor)
        const volume = Number(game.settings.get("swim", "defaultVolume"))
        if (condition.flags?.succ?.conditionId === "incapacitated") {
            await swim.play_sfx(soakSFX, volume)
        } else if (condition.flags?.succ?.conditionId === "shaken") {
            await swim.play_sfx(unshakeSFX, volume)
        }
    }
})
*/