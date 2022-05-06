/*******************************************
 * Unshake macro for SWD
 * version 2.1.0
 * (c): brunocalado; altered by SalieriC.
 ******************************************/

export async function deviation_script(weapontype = false, range = false) {
    const chatimage = "https://raw.githubusercontent.com/brunocalado/mestre-digital/master/Foundry%20VTT/Macros/Savage%20Worlds/icons/clock.webp";

    let coreRules = false;
    if (game.modules.get("swade-core-rules")?.active) { coreRules = true; }

    if (weapontype && range) {
        rollForIt()
    } else {
        getRequirements();
    }

    function getRequirements() {
        let template = `
  <h2>Weapon Type</h2>
  <table style="width:100%">
  <tr>
    <td><input type="radio" id="thrown" name="weapontype" value="thrown"><label for="thrown">Thrown weapon</label></td>
    <td><input type="radio" id="projectile" name="weapontype" value="projectile" checked="checked><label for="projectile">Projectile</label></td>    
  </tr>
  </table>  
  <h2>Range</h2>
  <table style="width:100%">
  <tr>
    <td><input type="radio" id="short" name="range" value="short" checked="checked><label for="thrown">Short</label></td>
    <td><input type="radio" id="medium" name="range" value="medium"><label for="projectile">Medium</label></td>    
    <td><input type="radio" id="long" name="range" value="long"><label for="projectile">Long</label></td>    
    <td><input type="radio" id="extreme" name="range" value="extreme"><label for="projectile">Extreme</label></td>    
  </tr>
  </table>    
  `;
        new Dialog({
            title: "Deviation",
            content: template,
            buttons: {
                ok: {
                    label: "Go!",
                    callback: async (html) => {
                        weapontype = html.find('input[name="weapontype"]:checked').val();
                        range = html.find('input[name="range"]:checked').val();
                        rollForIt();
                    },
                }
            },
        }).render(true);
    }

    function rollForIt() {
        let deviation;

        if (weapontype == 'thrown') {
            deviation = diceRoll('1d6', range);
        } else {
            deviation = diceRoll('2d6', range);
        }
    }

    async function diceRoll(die, range) {
        const rangeMultiplier = rangeCheck(range);
        let direction = await new Roll('1d12').roll();
        let roll = await new Roll(die).roll();
        let message = `<h2>Deviation</h2>`;
        if (coreRules === true) { message = `<div class="swade-core"><h2>@Compendium[swade-core-rules.swade-rules.Deviation]{Deviation}</h2>`; }
        message += `<p>Move the blast <b>${roll.total * rangeMultiplier}"</b> to <b style="color:red">${direction.total}</b> O'Clock.</p>`;
        if (directionCheck(direction.total)) {
            message += `<p><b style="color:red">A weapon can never deviate more than half the distance to the original target (that keeps it from going behind the thrower).</b></p>`;
        }
        message += `<p style="text-align:center"><img style="vertical-align:middle; border: none;" src=${chatimage} width="200" height="200"><p>`;
        if (coreRules === true) { message += `</div>` }

        let tempChatData = {
            //type: CHAT_MESSAGE_TYPES.ROLL,
            roll: roll,
            rollMode: game.settings.get("core", "rollMode"),
            content: message
        };
        ChatMessage.create(tempChatData);
        return roll.total;
    }

    function rangeCheck(range) {
        if (range == 'short') {
            return 1;
        } else if (range == 'medium') {
            return 2;
        } else if (range == 'long') {
            return 3;
        } else if (range == 'extreme') {
            return 4;
        }
    }

    function directionCheck(direction) {
        console.log(direction);
        if (direction == 4 || direction == 5 || direction == 6 || direction == 7 || direction == 8) {
            return true
        } else {
            return false
        }
    }
}