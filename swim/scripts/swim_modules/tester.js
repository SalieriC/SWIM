/*******************************************
 * Test and Support Macro
 * version v.0.0.0
 * Made and maintained by SalieriC#8263
 ******************************************/
export async function tester() {
    let { speaker, _, __, token } = await swim.get_macro_variables()
    const targets = Array.from(game.user.targets)
    const officialClass = await swim.get_official_class()

    // No Token is Selected
    if (!token || canvas.tokens.controlled.length > 1 || targets.length < 1) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleTargetMultiToken"));
        return;
    }

    //Gather Traits:
    let traitOptions = ``
    for (let trait of token.actor.items.filter(i => i.type === "skill")) {
        traitOptions += `<option value="${trait._id}">${trait.name}</option>`
    }

    //Select Trait and Modifier:
    const dialog = new Dialog({
        title: game.i18n.localize("SWIM.tester"),
        content: game.i18n.format("SWIM.dialogue-testerContent", { officialClass: officialClass, options: traitOptions }),
        default: 'roll',
        buttons: {
            roll: {
                label: game.i18n.localize("SWIM.dialogue-roll"),
                callback: async (html) => {
                    //Make the roll and stuff.
                }
            }
        },
        render: ([dialogContent]) => {
            dialogContent.querySelector(`input[name="modifier"`).focus();
        },
        default: "roll"
    });
    dialog.render(true);
}