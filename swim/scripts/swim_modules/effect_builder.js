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
                            type: "lower",
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
                            type: "lower",
                            lower: {
                                degree: degree,
                                trait: selectedTrait,
                                duration: duration
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "protection") {
                        const bonus = Number(html.find(`#protectionAmount`)[0].value)
                        const selectedType = html.find("input[name=type_choice]:checked").val()
                        const data = {
                            targetIDs: targetIDs,
                            type: "protection",
                            protection: {
                                bonus: bonus,
                                type: selectedType,
                                duration: 1
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "smite") {
                        const bonus = Number(html.find(`#damageBonus`)[0].value)
                        let weapons = []
                        for (let target of targets) {
                            const targetWeaponName = html.find(`#${target.id}`)[0].value
                            weapons.push({targetID: target.id, weaponName: targetWeaponName})
                        }
                        const data = {
                            targetIDs: targetIDs,
                            type: "smite",
                            smite: {
                                bonus: bonus,
                                weapon: weapons,
                                duration: duration
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    }
                }
            }
        },
        render: ([dialogContent]) => {
            $("#power-effect-dialogue").css("height", "auto"); // Adjust the dialogue to its content. Also fixes the error of scroll bar on first dialogue after login/reload.
            dialogContent.querySelector(`select[id="selected_power"`).focus();
            dialogContent.querySelector(`select[id="selected_power"`).addEventListener("input", (event) => {
                const textInput = event.target;
                const form = textInput.closest("form")
                const effectContent = form.querySelector(".effectContent");
                const selectedPower = form.querySelector('select[id="selected_power"]').value;
                if (selectedPower === "boost") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderBoost", {trait: game.i18n.localize("SUCC.dialogue.trait"), traitOptions: traitOptions})
                } else if (selectedPower === "lower") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderLower", {trait: game.i18n.localize("SUCC.dialogue.trait"), traitOptions: traitOptions})
                } else if (selectedPower === "protection") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderProtection", {amountText: game.i18n.localize("SUCC.dialogue.amount_to_increase")})
                } else if (selectedPower === "smite") {
                    //Get weapons for everyone
                    let allHTML = []
                    for (let target of targets) {
                        const targetWeapons = target.actor.items.filter(w => w.type === "weapon" && w.data.data.quantity >= 1)
                        let weaponOptions
                        for (let weapon of targetWeapons) {
                            weaponOptions = weaponOptions + `<option value="${weapon.name}">${weapon.data.name}</option>`
                        }
                        let html = `
                        <div class='form-group'>
                            <label for='${target.id}'><p>${game.i18n.localize("SWIM.dialogue-powerEffectBuilderSmiteWeaponOf")} ${target.name}:</p></label>
                            <select id='${target.id}'>${weaponOptions}</select>
                        </div>
                        `
                        allHTML = allHTML += html
                    }
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderSmite", {allHTML: allHTML, increaseText: game.i18n.localize('SUCC.dialogue.amount_to_increase')})
                }
            });
        },
        default: "one",
    },{
        id: "power-effect-dialogue"
    }).render(true);
}

/*`
<div class='form-group'>
    <label for='armour'><p>Armour: </p></label>
    <input id='armour' name='armourBox' type='checkbox'></input>
    <label for='toughness'><p>Toughness: </p></label>
    <input id='toughness' name='toughnessBox' type='checkbox'></input>
</div>
`*/

export async function effect_builder_gm() {
    const type = data.type
    if (type === "boost") {
        for (let target of data.targetIDs) {
            const boostData = {
                boost: {
                    degree: data.boost.degree,
                    trait: data.boost.trait,
                    duration: data.boost.duration
                }
            }
            await succ.apply_status(target, 'boost', true, false, boostData)
        }
    } else if (type === "lower") {
        for (let target of data.targetIDs) {
            const lowerData = {
                lower: {
                    degree: data.lower.degree,
                    trait: data.lower.trait,
                    duration: data.lower.duration
                }
            }
            await succ.apply_status(target, 'lower', true, false, lowerData)
        }
    } else if (type === "protection") {
        for (let target of data.targetIDs) {
            const protectionData = {
                protection: {
                    bonus: data.protection.bonus,
                    type: data.protection.type,
                    duration: data.protection.duration
                }
            }
            await succ.apply_status(target, 'protection', true, false, protectionData)
        }
    } else if (type === "smite") {
        for (let target of data.smite.weapon) {
            const smiteData = {
                smite: {
                    bonus: data.smite.bonus,
                    weapon: target.weaponName,
                    duration: data.smite.duration
                }
            }
            await succ.apply_status(target.targetID, 'smite', true, false, smiteData)
        }
    }
}