/*******************************************
 * Mark Dead
 * This Macro works best with Health Estimate installed.
 * It will mark the selected tokens as dead.
 * If the selected token is dead, it will be marked as alive instead.
 * v. 4.0.1 Originally from Health Estimate, altered by SalieriC.
 *******************************************/
export async function mark_dead_script() {
    const { _, __, ___, token } = await swim.get_macro_variables()
    
    if (!game.modules.get("healthEstimate")?.active) {
        ui.notifications.error("Please install and activate Health Estimate to use this macro.");
        return;
    }

    //Set up
    if (canvas.tokens.controlled.length === 0) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectOneOrMoreTokens"));
        return;
    }
    let incapSFX = game.settings.get(
        'swim', 'incapSFX');
    if (token.actor.data.data.additionalStats.sfx) {
        let sfxSequence = token.actor.data.data.additionalStats.sfx.value.split("|");
        incapSFX = sfxSequence[1];
    }

    main();

    async function main() {
        for (let e of canvas.tokens.controlled) {
            let hasAlive = !e.document.getFlag("healthEstimate", "dead")
            e.document.setFlag("healthEstimate", "dead", hasAlive)
            await succ.toggle_status(e, 'incapacitated', true)
        }
        ui.notifications.info("Marked as dead/alive.");
        AudioHelper.play({ src: `${incapSFX}` }, true);
    }
}