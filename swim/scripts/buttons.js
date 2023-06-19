//import { combat_setup } from "./swim_modules/combat_setup.js";
import { adjust_scene_light } from "./helpers/adjust_scene_light.js";
import { raise_calculator } from "./helpers/raise-calculator.js";

export function swim_buttons(hudButtons) {
    // Add Raise Calculator Button
    let hud = hudButtons.find(val => { return val.name == "token"; })
    if (hud) {
        hud.tools.push({
            name: "SWIM.openRaiseCalculatorName",
            title: "SWIM.openRaiseCalculatorHint",
            icon: "fas fa-plus-square",
            button: true,
            onClick: async () => raise_calculator()
        });
        /* Currently a little buggy so taking that out for now.
        if (game.user.isGM) {
            hud.tools.push({
                name: "SWIM.combatSetupName",
                title: "SWIM.combatSetupHint",
                icon: "fas fa-fist-raised",
                button: true,
                onClick: async () => { combat_setup() }
            })
        }
        */
    }

    // Hijack the systems chase setup:
    let tilesButton = hudButtons.find(val => { return val.name == "tiles"; })
    let chaseButtonIndex = tilesButton.tools.findIndex(object => { return object.name === "clear-chase-cards" })
    if (chaseButtonIndex !== -1) {
        tilesButton.tools.splice(chaseButtonIndex, 1)
    }
    tilesButton.tools.push({
        name: 'chase-setup',
        title: game.i18n.localize("SWIM.ChaseSetup"),
        icon: "fas fa-shipping-fast",
        button: true,
        onClick: async () => { swim.chase_setup() }
    })

    let lightHud = hudButtons.find(val => { return val.name == "lighting"; })
    if (lightHud) {
        if (game.user.isGM) {
            lightHud.tools.push({
                name: "SWIM.sceneIlluminationName",
                title: "SWIM.sceneIlluminationName",
                icon: "far fa-adjust",
                button: true,
                onClick: async () => { adjust_scene_light() }
            })
        }
    }
}