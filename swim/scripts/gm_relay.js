export class gm_relay {
    static async gmCreateActor (actorPreset) {
        let actorCopy = await Actor.create(actorPreset)
        return actorCopy
    }
    static async gmDeleteActor (actorPreset) {
        await actorPreset.delete()
    }
}