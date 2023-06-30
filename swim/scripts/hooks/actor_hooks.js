export async function actor_hooks() {
    /*
    Hooks.on("createActiveEffect", async (effect, _, userID) => {
        if (swim.is_first_gm() === false) { return } //Play SFX for all from GM account only.
        const actor = effect.parent
        const id = condition.flags?.succ?.conditionId ? condition.flags?.succ?.conditionId : effect.label.toLowerCase()
        await audio_player(actor, id)
    });
    Hooks.on("deleteActiveEffect", async (effect, _, userID) => {
        if (swim.is_first_gm() === false) { return } //Play SFX for all from GM account only.
        const actor = effect.parent
        const id = condition.flags?.succ?.conditionId ? "undo" + condition.flags?.succ?.conditionId : "undo" + effect.label.toLowerCase()
        await audio_player(actor, id)
    });
    */
}

async function audio_player(actor, id, playForAll = true) {
    const { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(actor)
    const volume = Number(game.settings.get("swim", "defaultVolume"))
    switch (id) {
        case 1: "shaken"
            swim.play_sfx(shakenSFX, volume, playForAll)
            break;
        case 2: "incapacitated"
            swim.play_sfx(deathSFX, volume, playForAll)
            break;
        case 3: "stunned"
            swim.play_sfx(stunnedSFX, volume, playForAll)
            break;
        case 4: "fatigued"
            swim.play_sfx(fatiguedSFX, volume, playForAll)
            break;
        case 5: "undoshaken"
            swim.play_sfx(unshakeSFX, volume, playForAll)
            break;
        case 6: "soak"
            swim.play_sfx(soakSFX, volume, playForAll)
            break;
        case 7: "undofatigued"
            swim.play_sfx(looseFatigueSFX, volume, playForAll)
            break;
        //default:
        // code block for default case - not needed here
    }
}