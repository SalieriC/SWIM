/*******************************************
 * SWIM conditions adapter (Phase 7.2)
 * The single place where SWIM talks to the SUCC API (`game.succ`). SUCC itself is kept (it registers the conditions that show
 * up on the token UI), but if its API ever changes, only this file has to change.
 * Every function is a pure pass-through: same arguments, same return value as the SUCC function it wraps
 * (see SUCC API.md: addCondition, removeCondition, hasCondition, getConditionFrom, removeTemporaryEffects).
 * The only addition: a clear error if SUCC is not available instead of a TypeError on `undefined`.
 ******************************************/

function succ_api() {
    const api = game.succ
    if (!api?.addCondition) {
        ui.notifications.error(game.i18n.localize("SWIM.notification.succNotAvailable"))
        throw new Error("SWIM | The SUCC API (game.succ) is not available. Is the 'succ' module active?")
    }
    return api
}

export const swimConditions = {
    /** @see EnhancedConditionsAPI.addCondition(conditionId, entities, options) */
    add: (...args) => succ_api().addCondition(...args),
    /** @see EnhancedConditionsAPI.removeCondition(conditionId, entities, options) */
    remove: (...args) => succ_api().removeCondition(...args),
    /** @see EnhancedConditionsAPI.hasCondition(conditionId, entities, options) */
    has: (...args) => succ_api().hasCondition(...args),
    /** @see EnhancedConditionsAPI.getConditionFrom(conditionId, entity) */
    get_from: (...args) => succ_api().getConditionFrom(...args),
    /** @see EnhancedConditionsAPI.removeTemporaryEffects(sceneId, confirmed) */
    remove_temporary_effects: (...args) => succ_api().removeTemporaryEffects(...args),
}
