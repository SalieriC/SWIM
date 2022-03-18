export class gm_relay {
    static async gmDeleteActor (actorID) {
        let actor = game.actors.get(actorID)
        await actor.delete()
    }
}