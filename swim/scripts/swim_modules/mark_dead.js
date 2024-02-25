/*******************************************
 * Mark Dead
 * This Macro works best with Health Estimate installed.
 * It will mark the selected tokens as dead.
 * If the selected token is dead, it will be marked as alive instead.
 * v. 5.0.0 by SalieriC.
 *******************************************/
export async function mark_dead_script() {
    const { _, __, ___, token } = await swim.get_macro_variables()

    //Set up
    if (canvas.tokens.controlled.length === 0) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectOneOrMoreTokens"));
        return;
    }
    const { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(token.actor)

    main();

    async function main() {
        for (let e of canvas.tokens.controlled) {
            if (e.type === 'npc' || e.type === 'vehicle') {
                const isInc = await succ.check_status(e, 'defeated')
                const apply = !isInc //invert the result to remove if applied and vice versa.
                await succ.toggle_status(e, 'defeated', apply, true)
            } else if (e.type === 'character') {
                const isInc = await succ.check_status(e, 'incapacitated')
                const apply = !isInc //invert the result to remove if applied and vice versa.
                await succ.toggle_status(e, 'incapacitated', apply, true)
            }
        }
        ui.notifications.info(game.i18n.localize("SWIM.notification.markDeadAlive"));
        AudioHelper.play({ src: `${deathSFX}` }, true);
    }
}