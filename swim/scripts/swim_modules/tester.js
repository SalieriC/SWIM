/*******************************************
 * Test and Support Macro
 * version v.0.0.0
 * Made and maintained by SalieriC#8263
 ******************************************/
export async function tester_script() {
    let { speaker, _, __, token } = await swim.get_macro_variables()
    const targets = Array.from(game.user.targets)
    const officialClass = await swim.get_official_class()
    const supportLink = await swim.get_official_journal_link("support")
    const testLink = await swim.get_official_journal_link("test")

    // No Token is Selected
    if (!token || canvas.tokens.controlled.length > 1 || targets.length < 1) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleTargetMultiToken"));
        return;
    }

    const targetToken = targets[0]; // Selecting the first target token
    const actor = token.actor;

    let skillOptions = "";
    for (let skill of actor.items.filter((i) => i.type === "skill")) {
        skillOptions += `<option value="${skill._id}">${skill.name}</option>`;
    }

    const supportContent = `<div class='form-group'>
  <label for='selected_skill'><p><b>${game.i18n.localize("SWIM.dialogue-selectSkill")}</b></p></label>
  <select id='selected_skill'>${skillOptions}</select>
</div> </div>`

    const testContent = `<div class='form-group'>
  <label for='selected_skill'><p><b>${game.i18n.localize("SWIM.dialogue-selectSkill")}</b></p></label>
  <select id='selected_skill'>${skillOptions}</select>
</div>
<p><b>${game.i18n.localize("SWIM.dialogue-testerDesiredResult")}</b></p>
<div class='form-group'>
  <label for='selected_result_distracted'>
    <input type='radio' id='selected_result_distracted' name='selected_result' value='distracted' checked> ${game.i18n.localize("SWADE.Distr")}
  </label>
  <label for='selected_result_vulnerable'>
    <input type='radio' id='selected_result_vulnerable' name='selected_result' value='vulnerable'> ${game.i18n.localize("SWADE.Vuln")}
  </label>
</div></div>`

    const content = await TextEditor.enrichHTML(`${officialClass}<form>
    <p>${game.i18n.localize("SWIM.dialogue-testerIntroPartial1")} ${supportLink}{${game.i18n.localize("SWIM.dialogue-testerIntroPartial2")}} ${game.i18n.localize("SWIM.word-or")} ${testLink}{${game.i18n.localize("SWIM.dialogue-testerIntroPartial3")}}. ${game.i18n.localize("SWIM.dialogue-testerIntroPartial4")}</p>
  <div class='form-group'>
    <label>
      <input type='radio' name='action' value='support' checked> ${game.i18n.localize("SWIM.gameTerm-Support")}
    </label>
    <label>
      <input type='radio' name='action' value='test'> ${game.i18n.localize("SWIM.gameTerm-Test")}
    </label>
  </div>
  <div id='action-content'>
    ${supportContent}
  </div>
</form>`, { async: true })

    new Dialog({
        title: game.i18n.localize("SWIM.tester"),
        content,
        buttons: {
            one: {
                label: game.i18n.localize("SWIM.dialogue-roll"),
                callback: async (html) => {
                    const selectedAction = html.find('input[name="action"]:checked').val();
                    const selectedSkill = html.find("#selected_skill").val();
                    // Handle the selected action and skill
                    if (selectedAction === "support") {
                        // Perform support action
                        await support(selectedSkill)
                    } else if (selectedAction === "test") {
                        const selectedResult = html.find('input[name="selected_result"]:checked').val();
                        // Perform test action
                        console.log(
                            "Action:", selectedAction,
                            "Skill:", selectedSkill,
                            "Result:", selectedResult
                        )
                    }
                },
            },
        },
        default: "one",
        render: (html) => {
            $("#tester-dialogue").css("height", "auto"); // Adjust the dialogue to its content. Also fixes the error of scroll bar on first dialogue after login/reload.
            html.find('input[name="action"]').change(() => {
                const selectedAction = html.find('input[name="action"]:checked').val();
                const actionContent = html.find("#action-content");
                if (selectedAction === "support") {
                    actionContent.html(supportContent);
                } else if (selectedAction === "test") {
                    actionContent.html(testContent);
                }
            });
        },
    }, {
        id: "tester-dialogue"
    }).render(true);

    

    //warpgate.event.notify("SWIM.tester", data)
}

export async function tester_gm(data) { }