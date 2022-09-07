export class gm_relay {
    static async gmDeleteActor(actorID) {
        let actor = game.actors.get(actorID)
        await actor.delete()
    }
    static async combat_previousTurn(data) {
        let combatID = data.combatID
        if (!combatID) {
            combatID = game.combat.id
        }
        const combat = game.combats.get(combatID)
        const currentTurn = combat.turn
        await swim.wait('200')
        if (currentTurn > 0) {
            await game.combat.update({ "turn": currentTurn - 1 })
        }
    }
    static async combat_nextTurn(data) {
        let combatID = data.combatID
        if (!combatID) {
            combatID = game.combat.id
        }
        const combat = game.combats.get(combatID)
        const currentTurn = combat.turn
        await swim.wait('200')
        if (currentTurn > 0) {
            await game.combat.update({ "turn": currentTurn + 1 })
        }
    }
}