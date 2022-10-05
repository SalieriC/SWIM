/*******************************************
 * Unstun macro for SWADE
 * version v.2.0.1
 * Original code by brunocalado, modified by SalieriC#8263.
 ******************************************/
export async function scale_calculator() {
    const { speaker, _, __, token } = await swim.get_macro_variables()
    const chatimage = "icons/tools/hand/scale-balances-merchant-brown.webp";

    /* Size Scale p106 SWADE
    
    source: https://raw.githubusercontent.com/brunocalado/mestre-digital/master/Foundry%20VTT/Macros/Savage%20Worlds/SizeScaleCalculator.js
    icon: icons/tools/hand/scale-balances-merchant-brown.webp
    */

    let tokenActor = canvas.tokens.controlled[0];
    let tokenTarget = Array.from(game.user.targets)[0];
    let coreRules = false;
    if (game.modules.get("swade-core-rules")?.active) { coreRules = true; }

    if (tokenActor === undefined || tokenTarget === undefined) {
        ui.notifications.warn(game.i18n.localize("SWIM.notification-selectAndTargetOneToken"));
    } else {
        const actorSwat = token.actor.items.find(function (item) {
            return ((item.name.toLowerCase() === game.i18n.localize("SWIM.ability-swat").toLowerCase()) && item.type === "ability");
        });
        const targetSwat = tokenTarget.actor.items.find(function (item) {
            return ((item.name.toLowerCase() === game.i18n.localize("SWIM.ability-swat").toLowerCase()) && item.type === "ability");
        });
        rollForIt();


        function rollForIt() {
            let actorSize = tokenActor.actor.system.stats.size;
            let targetSize = tokenTarget.actor.system.stats.size;
            let actorModifier = sizeToModifier(actorSize);
            let targetModifier = sizeToModifier(targetSize);
            let modifier = calc(actorModifier, targetModifier);

            let message = `<h2><img style="vertical-align:middle" src=${chatimage} width="28" height="28"> Size & Scale Calculator</h2>`;
            if (coreRules === true) {
                message = `<div class="swade-core"><h2><img style="vertical-align:middle" src=${chatimage} width="28" height="28"> @Compendium[swade-core-rules.swade-rules.mbP0fwcquD98QtwX]{Size & Scale} Calculator</h2>`;
            }
            message += `<ul><li><b>${tokenActor.name}:</b> Size = ${actorSize} / Modifier = ${actorModifier}</li>`;
            message += `<li><b>${tokenTarget.name}:</b> Size = ${targetSize} / Modifier = ${targetModifier}</li></ul>`;
            message += `<h3>Result:</h3>`;
            if (modifier != 0) {
                message += `<ul><li>${tokenActor.name} has <b style="color:red">${modifier}</b> to attack ${tokenTarget.name}`;
                if (actorSwat) {
                    message += ` and has Swat*.</li>`;
                } else { message += `.</li>` }
                message += `<li>${tokenTarget.name} has <b style="color:red">${calc(targetModifier, actorModifier)}</b> to attack ${tokenActor.name}`;
                if (targetSwat) {
                    message += ` and has Swat*.</li></ul>`;
                } else { message += `.</li></ul>` }
                if ((actorSwat && targetSwat) || (actorSwat || targetSwat)) {
                    if (coreRules === true) {
                        message += `<p>*<b>@Compendium[swade-core-rules.swade-rules.q5sk5hEw6TED0FOU]{Swat}:</b> Ignore up to 4 points of penalties from Scale for the specified action(s).</p>`;
                    } else {
                        message += `<p>*<b>Swat:</b> Ignore up to 4 points of penalties from Scale for the specified action(s).</p>`;
                    }
                    if (coreRules === true) {
                        message += `</div>`;
                    }
                }
            } else {
                message += `<p><b>There is no modifier.</b> They have the same Scale.</p>`;
            }

            // send message
            let chatData = {
                user: game.user._id,
                content: message
            };
            ChatMessage.create(chatData, {});
        }

        function calc(actorModifier, targetModifier) {
            let diff;
            if (actorModifier == targetModifier) {
                return 0;
            } else {
                if (actorModifier < targetModifier) {
                    diff = Math.abs(actorModifier) + Math.abs(targetModifier);
                    return diff;
                } else {
                    diff = Math.abs(actorModifier) + Math.abs(targetModifier);
                    return -diff;
                }
            }
        }

        function sizeToModifier(size) { //p179 swade core
            if (size == -4) {
                return -6;
            } else if (size == -3) {
                return -4;
            } else if (size == -2) {
                return -2;
            } else if (size >= -1 && size <= 3) {
                return 0;
            } else if (size >= 4 && size <= 7) {
                return 2;
            } else if (size >= 8 && size <= 11) {
                return 4;
            } else if (size >= 12 && size <= 20) {
                return 6;
            }
        }
    }
}