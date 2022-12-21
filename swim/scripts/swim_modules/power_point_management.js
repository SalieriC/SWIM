/*******************************************
 * Power Point Management (remaster)
 * // v.0.0.1
 * By SalieriC#8263
 ******************************************/
export async function power_point_management_script(options) {
    /**
     * General Path: actor.system.powerPoints.general
     * Specific Paths: actor.system.powerPoints["AB Name"]
     * Properties in the object:
     * - actor.system.powerPoints.general.max
     * - actor.system.powerPoints.general.value
     * - actor.system.powerPoints["AB Name"].max
     * - actor.system.powerPoints["AB Name"].value
     * 
     * ABs that never got PP entered in their pool do NOT appear in the properties. Those which had them once but do no longer are set to `null`.
     * 
     * Roadmap:
     * [] Always prefer changing specific PP pool.
     * [] But use general if general has pp and specific one is empty.
     * [] Add flag settings for Powers to further configure them?
     * [] Cover Arcane Devices and such by using additional stats on powers rather than the systems real ones. (Automatically add/remove pp additional stat on flag change?)
     */
    let options = {
        acorID: "someString",
        tokenID: "someString",
        powerID: "someString",
        sceneID: "someString",
        degree: "someNumber", //success = 1, failure = 0, critFail = -1, raise = 2
        extraCost: `someNumber`, //A number only available if coming from the dialogue, not BRSW.
        activeActions: [
            "actionID1",
            "actionID2"
        ] //Need to get that from BRSW as well as the dialogue. It should be the alphanumeric part of the property string to the action so we can get it.
        //Example: "2JPUbfiW" if the property path is `power.system.actions.additional["2JPUbfiW"]`
    }

    // Central hub:
    const scene = game.scenes.get(options.sceneID)
    const token = scene.tokens.get(options.tokenID)
    const actor = token._actor
    const power = actor.items.find(p => p.id === options.powerID && p.type === "power")
    const arcaneBackground = power.system.arcane
    // Get curr and max PP:
    let currPP = actor.system.powerPoints.general.value
    let maxPP = actor.system.powerPoints.general.max
    let isDevice = false
    if (power.flags.swim?.config?.isDevice === true || power.system.additionalStats.devicePP?.value) { //power is a device
        currPP = power.system.additionalStats.devicePP?.value
        maxPP = power.system.additionalStats.devicePP?.max
        isDevice = true
    } else if (actor.system.powerPoints[`${arcaneBackground}`]?.max != null && actor.system.powerPoints[`${arcaneBackground}`]?.value != null) { //power has AB with own PP pool
        currPP = actor.system.powerPoints[`${arcaneBackground}`]?.value
        maxPP = actor.system.powerPoints[`${arcaneBackground}`]?.max
    }
    //Calculate power cost:
    const costBasic = power.system.pp
    const costExtra = options.extraCost ? options.extraCost : 0
    let costsActions = []
    let costsAllActions = 0
    for (let actionID of options.activeActions) {
        let actionName = power.system.actions.additional[`${actionID}`].name
        let actionCost = power.system.actions.additional[`${actionID}`].shotsUsed
        costsActions.push({name: actionName, cost: actionCost})
    } for (let each of costsActions) {
        costsAllActions = costsAllActions + each.cost
    }
    let costTotal = options.degree >= 1 ? costBasic + costExtra + costsAllActions : 1 //Powers cost only 1 PP on a failure.
    if (costTotal > currPP) { //Not enough PP.
        //Return & Error
    } else {
        //deduct pp
    }
}
