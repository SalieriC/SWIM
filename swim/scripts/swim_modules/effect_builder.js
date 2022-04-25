/*******************************************************
 * SWADE Immersive Macros (SWIM) proudly presents:
 * The Effect Builder.
 * This allows users to apply power effects to any token
 * no matter if they have ownership or not. It respects
 * the standard rules and increased duration from the
 * concentration edge.
 * 
 * v. 0.0.0
 * By SalieriC#8263; dialogue resizing by Freeze#2689.
 ******************************************************/

export async function effect_builder() {
    // Targets:
    const targets = game.user.targets
    const { speaker, _, __, token } = await swim.get_macro_variables()
    if (!token || canvas.tokens.controlled.length > 1 || targets.size === 0) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleTargetMultiToken"))
        return
    }
    
    //Set div class based on enabled official module:
    const officialClass = await swim.get_official_class()

    let duration = 5
    const concentration = token.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-concentration") && i.type === "edge")
    if (concentration) { duration = duration * 2 }

    const options = `
        <option value="boost">Boost Trait</option>
        <option value="lower">Lower Trait</option>
        <option value="protection">Protection</option>
        <option value="smite">Smite</option>
    `

    // Boost/Lower trait options
    let traitOptions = `
        <option value="agility">${game.i18n.localize("SUCC.dialogue.attribute")} ${game.i18n.localize("SWADE.AttrAgi")}</option>
        <option value="smarts">${game.i18n.localize("SUCC.dialogue.attribute")} ${game.i18n.localize("SWADE.AttrSma")}</option>
        <option value="spirit">${game.i18n.localize("SUCC.dialogue.attribute")} ${game.i18n.localize("SWADE.AttrSpr")}</option>
        <option value="strength">${game.i18n.localize("SUCC.dialogue.attribute")} ${game.i18n.localize("SWADE.AttrStr")}</option>
        <option value="vigor">${game.i18n.localize("SUCC.dialogue.attribute")} ${game.i18n.localize("SWADE.AttrVig")}</option>
    `
    // Getting traits of each target, reducing the options to only those traits every one of them has:
    let skills = []
    let targetIDs = []
    for (let target of targets) {
        const targetSkills = target.actor.items.filter(s => s.type === "skill")
        for (let targetSkill of targetSkills) {
            skills.push(targetSkill.name)
        }
        targetIDs.push(target.id)
    }
    const skillsFiltered = skills.filter((a, i, aa) => aa.indexOf(a) === i && aa.lastIndexOf(a) !== i);
    for (let each of skillsFiltered) {
        traitOptions = traitOptions + `<option value="${each.toLowerCase()}">${game.i18n.localize("SUCC.dialogue.skill")} ${each}</option>`
    }

    let text = game.i18n.format("SWIM.dialogue-powerEffectBuilderBoost", {trait: game.i18n.localize("SUCC.dialogue.trait"), traitOptions: traitOptions})

    new Dialog({
        title: game.i18n.localize("SWIM.dialogue-powerEffectBuilderTitle"),
        content: game.i18n.format("SWIM.dialogue-powerEffectBuilderContent", {class: officialClass, options: options, text: text}),
        buttons: {
            one: {
                label: `<i class="fas fa-magic"></i> Proceed`,
                callback: async (html) => {
                    const selectedPower = html.find(`#selected_power`)[0].value
                    if (selectedPower === "boost") {
                        const selectedTrait = html.find(`#selected_trait`)[0].value
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            boost: {
                                degree: degree,
                                trait: selectedTrait,
                                duration: duration
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "lower") {
                        const selectedTrait = html.find(`#selected_trait`)[0].value
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            lower: {
                                degree: degree,
                                trait: selectedTrait,
                                duration: duration
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "protection") {
                        //
                    } else if (selectedPower === "smite") {
                        //
                    }
                }
            }
        },
        render: ([dialogContent]) => {
            $("#power-effect-dialogue").change(function() {
                $("#power-effect-dialogue").css("height", "auto");
            });
            dialogContent.querySelector(`select[id="selected_power"`).focus();
            dialogContent.querySelector(`select[id="selected_power"`).addEventListener("input", (event) => {
                const textInput = event.target;
                const form = textInput.closest("form")
                const effectContent = form.querySelector(".effectContent");
                const selectedPower = form.querySelector('select[id="selected_power"]').value;
                if (selectedPower === "boost") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderBoost", {trait: game.i18n.localize("SUCC.dialogue.trait"), traitOptions: traitOptions})
                } else if (selectedPower === "lower") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderLower")
                } else if (selectedPower === "protection") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderProtection")
                } else if (selectedPower === "smite") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderSmite")
                }
            });
        },
        default: "one",
    },{
        id: "power-effect-dialogue"
    }).render(true);
}

export async function effect_builder_gm() {}