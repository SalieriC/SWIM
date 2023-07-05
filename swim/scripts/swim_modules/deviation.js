/*******************************************
 * Unshake macro for SWD
 * version 2.2.0
 * (c): brunocalado; altered by SalieriC.
 ******************************************/

export async function deviation_script(weapontype = false, range = false) {
    const chatimage = "modules/swim/assets/svg/clock.svg";

    const officialClass = await swim.get_official_class()
    const deviationLink = await swim.get_official_journal_link("deviation")

    if (weapontype && range) {
        rollForIt()
    } else {
        getRequirements();
    }

    function getRequirements() {
        let template = `${officialClass}
  <h2>${game.i18n.localize("SWIM.word-weaponType")}</h2>
  <table style="width:100%">
  <tr>
    <td><input type="radio" id="thrown" name="weapontype" value="thrown"><label for="thrown"> ${game.i18n.localize("SWIM.word-ThrownWeapon")}</label></td>
    <td><input type="radio" id="projectile" name="weapontype" value="projectile" checked="checked><label for="projectile"> ${game.i18n.localize("SWIM.word-Projectile")}</label></td>    
  </tr>
  </table>  
  <h2>${game.i18n.localize("SWIM.gameTerm-range")}</h2>
  <table style="width:100%">
  <tr>
    <td><input type="radio" id="short" name="range" value="short" checked="checked><label for="thrown"> ${game.i18n.localize("SWIM.gameTerm-range-short")}</label></td>
    <td><input type="radio" id="medium" name="range" value="medium"><label for="projectile"> ${game.i18n.localize("SWIM.gameTerm-range-medium")}</label></td>
    <td><input type="radio" id="long" name="range" value="long"><label for="projectile"> ${game.i18n.localize("SWIM.gameTerm-range-long")}</label></td>
    <td><input type="radio" id="extreme" name="range" value="extreme"><label for="projectile"> ${game.i18n.localize("SWIM.gameTerm-range-extreme")}</label></td>
  </tr>
  </table>
  </div>
  `;
        new Dialog({
            title: game.i18n.localize("SWIM.dialogue-DeviationTile"),
            content: template,
            buttons: {
                ok: {
                    label: game.i18n.localize("SWIM.button-proceed"),
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
        let message = `${officialClass}<h2>${game.i18n.localize("SWIM.dialogue-DeviationTile")}</h2>`;
        if (deviationLink) { message = `${officialClass}<h2>${deviationLink}{${game.i18n.localize("SWIM.dialogue-DeviationTile")}}</h2>`; }
        message += game.i18n.format("SWIM.dialogue-DeviationMessage1", {modifiedTotal: roll.total * rangeMultiplier, direction: direction.total});
        if (directionCheck(direction.total)) {
            message += game.i18n.localize("SWIM.dialogue-DeviationMessage2");
        }
        message += game.i18n.format("SWIM.dialogue-DeviationMessage3", {chatimage});
        message += `</div>`

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
        //console.log(direction);
        if (direction == 4 || direction == 5 || direction == 6 || direction == 7 || direction == 8) {
            return true
        } else {
            return false
        }
    }
}