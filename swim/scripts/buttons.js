import { combat_setup } from "./swim_modules/combat_setup.js";
import { adjust_scene_light } from "./helpers/adjust_scene_light.js";

export function swim_buttons(hudButtons) {
    // Add Raise Calculator Button
    let hud = hudButtons.find(val => { return val.name == "token"; })
    if (hud) {
        hud.tools.push({
            name: "SWIM.openRaiseCalculatorName",
            title: "SWIM.openRaiseCalculatorHint",
            icon: "fas fa-plus-square",
            button: true,
            onClick: async () => {
                let text = `<img style="border: 0;" src="modules/swim/assets/icons/misc/raise_black.svg" alt="" width="25" height="25" /> Your Raises will show here once you leave the Result field.`;

                new Dialog({
                    title: 'Raise Calculator',
                    content: `
                        <form>
                        <div class="form-group">
                        <label><img src="modules/swim/assets/icons/misc/bullseye.svg" alt="" width="25" height="25" style="border: 0;" /> <b>Target Number:</b></label>
                        <input name="target" placeholder="0" type="number" onClick="this.select();"/>
                        </div>
                        <div class="form-group">
                        <label><img src="modules/swim/assets/icons/misc/rolling-dices.svg" alt="" border="0" width="25" height="25" style="border: 0;" /> <b>Result:</b></label>
                        <input name="result" placeholder="0" type="number" onClick="this.select();"/>
                        </div>
                        <p class="calculation">${text}</p>
                        </form>`,
                    buttons: {},
                    render: ([dialogContent]) => {
                        dialogContent.querySelector(`input[name="target"`).focus();
                        dialogContent.querySelector(`input[name="result"`).addEventListener("input", (event) => {
                            const textInput = event.target;
                            const form = textInput.closest("form")
                            const calcResult = form.querySelector(".calculation");
                            const target = form.querySelector('input[name="target"]').value;
                            const result = form.querySelector('input[name="result"]').value;
                            let raises = Math.floor((parseInt(result) - parseInt(target)) / 4);
                            if (parseInt(target) > parseInt(result)) {
                                calcResult.innerHTML = `<img style="border: 0;" src="modules/swim/assets/icons/misc/raise_red.svg" alt="" width="25" height="25" /> <b>Failure</b>`;
                            }
                            else if (parseInt(target) <= parseInt(result) && raises < 1) {
                                calcResult.innerHTML = `<img style="border: 0;" src="modules/swim/assets/icons/misc/raise_yellow.svg" alt="" width="25" height="25" /> <b>Success</b>`;
                            }
                            else {
                                calcResult.innerHTML = `<img style="border: 0;" src="modules/swim/assets/icons/misc/raise_green.svg" alt="" width="25" height="25" /> <b>${raises} Raise(s)</b>`;
                            }
                        });
                    },
                }).render(true);
            }
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