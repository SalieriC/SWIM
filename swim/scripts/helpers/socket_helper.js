/*******************************************
 * SWIM socket helper
 * Thin wrapper around socketlib so every GM-relayed action
 *  - refers to its handler by the *registered name* (see `socket.register(...)` in init.js),
 *    not by a function reference, and
 *  - tells the player when no GM is connected instead of only throwing in the console.
 ******************************************/
import { socket } from '../init.js'

/**
 * Execute a registered SWIM handler on a GM client.
 * @param {string} handlerName  Name the handler was registered with in init.js (e.g. "shapeChanger").
 * @param {...*} args           Arguments for the handler (must be serialisable, no documents).
 * @returns {Promise<*>} Whatever the handler returns. On failure the user is notified and the error is re-thrown,
 *                       so the calling macro stops exactly as before.
 */
export async function execute_as_gm(handlerName, ...args) {
    if (!socket) {
        ui.notifications.error(game.i18n.localize("SWIM.notification.generalErrorMsg"))
        throw new Error("SWIM | socket is not ready yet (socketlib.ready has not fired).")
    }
    if (!game.users.activeGM) {
        ui.notifications.error(game.i18n.localize("SWIM.notification.noGMConnected"))
        throw new Error(`SWIM | Could not execute '${handlerName}': no GM is connected.`)
    }
    try {
        return await socket.executeAsGM(handlerName, ...args)
    } catch (error) {
        console.error(`SWIM | Handler '${handlerName}' failed on the GM client.`, error)
        ui.notifications.error(game.i18n.localize("SWIM.notification.generalErrorMsg"))
        throw error
    }
}
