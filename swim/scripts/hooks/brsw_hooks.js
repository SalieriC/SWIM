export async function brsw_hooks() {
    //BR2 Hooks
    Hooks.on(`BRSW-Unshake`, async (message, actor) => {
        if (game.settings.get("swim", "br2Support") === true) {
            const { shakenSFX, deathSFX, unshakeSFX, soakSFX } = await swim.get_actor_sfx(actor)
            if (unshakeSFX) {
                await swim.play_sfx(unshakeSFX)
            }
        }
    })
    /*Hooks.on("BRSW-AfterShowDamageCard", async (actor, wounds, message) => {
        console.log(actor, wounds, message)
    });*/
    Hooks.on("BRSW-AfterApplyDamage", async (token, final_wounds, final_shaken, incapacitated, initial_wounds, initial_shaken, soaked) => {
        if (game.settings.get("swim", "br2Support") === true) {
            const { shakenSFX, deathSFX, unshakeSFX, soakSFX } = await swim.get_actor_sfx(token.actor)
            const volume = Number(game.settings.get("swim", "defaultVolume"))
            if (soaked >= 1) {
                await swim.play_sfx(soakSFX, volume)
            } else if (incapacitated === true) {
                await swim.play_sfx(deathSFX, volume)
            } else if (final_wounds > initial_wounds || final_shaken === true) {
                await swim.play_sfx(shakenSFX, volume)
            }
        }
    });
}