/*******************************************************
 * Combat Setup
 * Sends all tokens on the current scene to combat and
 * - Tries to group them depending on
 *  - Disposition
 *  - Wild Card Status
 *  - Proximity
 * - Starts the combat [X], drawing initiative [X]
 * - Sets turn to 0 (so that the first in list has its turn)
 * - Starts a defined combat playlist [X]
 * - Pauses other playlists not in a folder called "Ambient" [X]
 * - Resumes all Playlists on combat end [X]
 * 
 * v. 1.0.2
 * By SalieriC, original groundwork by brunocalado#1650
 ******************************************************/
export async function combat_setup() {
    const tokensUnfiltered = game.scenes.current.tokens
    if (tokensUnfiltered.size <= 0) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-noTokens"))
        return
    }
    // Filter tokens out that are not capable of fighting
    let tokens = []
    for (let token of tokensUnfiltered) {
        if (token.actor.type === "npc" && await succ.check_status(token, "incapacitated") === false) {
            if (token.actor.flags?.healthEstimate?.dead === false || !token.actor.flags?.healthEstimate?.dead) {
                tokens.push(token)
            }
        } else if (token.actor.type === "character" || token.actor.type === "vehicle") {
            tokens.push(token)
        }
    }
    // Adding the rest to the combat tracker:
    let tokensToAdd = []
    let hostileWC = []
    for (let token of tokens) {
        if (token.inCombat) continue
        /*
        // Process hostile NPCs
        if (token.type === "npc" && token.disposition === -1) {
            // Make wildcards to group leaders
            if (token.actor.system.wildcard === true) {
                // 
            }
        }
        */
        tokensToAdd.push({ tokenId: token.id, hidden: token.document.hidden })
    }
    const combat = !game.combat ? await Combat.create({ scene: canvas.scene.id, active: true }) : game.combat
    const combatants = await combat.createEmbeddedDocuments("Combatant", tokensToAdd)

    // Start the combat, setting turn to 0 if it is not.
    // The Dialogue is a temporary solution until automatic grouping is possible.

    const officialClass = await swim.get_official_class()
    new Dialog({
        title: 'Manage group initiative',
        content: `${officialClass}
        <p>Now you can group tokens as desired. Once you're finished, click "Start Combat".</p>
        </div>`,
        buttons: {
            one: {
                label: `<i class="fas fa-fist-raised"></i> Start Combat`,
                callback: async (_) => {
                    //Get actor based on provided ID:
                    await combat.startCombat()
                    //console.log(combat)
                    Hooks.once("updateCombat", async (combat, update, _, userId) => {
                        await swim.wait('200')
                        if (update.turn != 0) {
                            await combat.update({ "turn": 0 })
                        }
                    })
                }
            }
        },
        default: "one",
    }).render(true);
}
