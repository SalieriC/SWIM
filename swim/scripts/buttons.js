import { combat_setup } from "./swim_modules/combat_setup.js";
import { adjust_scene_light } from "./helpers/adjust_scene_light.js";
import { raise_calculator } from "./helpers/raise-calculator.js";

/**
 * Foundry v14: `controls` is an object (`controls.tokens`, `controls.tiles`, `controls.lighting`, ...), `controls.<id>.tools` an object keyed by tool name.
 * A tool with `button: true` calls `onChange` when clicked.
 */
function add_tool(control, name, { title, icon, visible = true, onChange }) {
    if (!control) { return }
    control.tools[name] = { name, title, icon, order: Object.keys(control.tools).length, button: true, visible, onChange }
}

export function swim_buttons(controls) {
    // Raise Calculator (everyone), Combat Setup (GM)
    add_tool(controls.tokens, "swim-raise-calculator", {
        title: "SWIM.openRaiseCalculatorHint", icon: "fa-solid fa-plus-square",
        onChange: () => raise_calculator(),
    })
    add_tool(controls.tokens, "swim-combat-setup", {
        title: "SWIM.combatSetupHint", icon: "fa-solid fa-fist-raised", visible: game.user.isGM,
        onChange: () => combat_setup(),
    })

    // SWIM's chase setup (SWADE 6 no longer has its own chase button in the Tile controls)
    add_tool(controls.tiles, "chase-setup", {
        title: "SWIM.ChaseSetup", icon: "fa-solid fa-truck-fast",
        onChange: () => swim.chase_setup(),
    })

    // Scene Illumination (GM)
    add_tool(controls.lighting, "swim-scene-illumination", {
        title: "SWIM.sceneIlluminationName", icon: "fa-solid fa-circle-half-stroke", visible: game.user.isGM,
        onChange: () => adjust_scene_light(),
    })
}
