/*******************************************
 * Mark Dead
 * This Macro works best with Health Estimate installed.
 * It will mark the selected tokens as dead.
 * If the selected token is dead, it will be marked as alive instead.
 * v. 4.0.3 by SalieriC.
 *******************************************/
export async function mark_dead_script() {
    const { _, __, ___, token } = await swim.get_macro_variables()

    //Set up
    if (canvas.tokens.controlled.length === 0) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectOneOrMoreTokens"));
        return;
    }
    let incapSFX = game.settings.get(
        'swim', 'incapSFX');
    if (token.actor.system.additionalStats.sfx) {
        let sfxSequence = token.actor.system.additionalStats.sfx.value.split("|");
        incapSFX = sfxSequence[1];
    }

    main();

    async function main() {
        for (let e of canvas.tokens.controlled) {
            await succ.toggle_status(e, 'incapacitated', true, true)
        }
        ui.notifications.info(game.i18n.localize("SWIM.notification.markDeadAlive"));
        AudioHelper.play({ src: `${incapSFX}` }, true);
    }
}