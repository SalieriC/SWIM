export class gm_relay {
    static async gmDeleteActor (actorPreset) {
        await actorPreset.delete()
    }
}