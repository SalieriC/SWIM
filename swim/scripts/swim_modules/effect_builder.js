/*******************************************************
 * SWADE Immersive Macros (SWIM) proudly presents:
 * The Effect Builder.
 * This allows users to apply power effects to any token
 * no matter if they have ownership or not. It respects
 * the standard rules and increased duration from the
 * concentration edge.
 * 
 * v. 2.1.0
 * By SalieriC#8263; dialogue resizing by Freeze#2689.
 * 
 * Powers on hold for now:
 * - Elemental Manipulation
 * - Empathy
 * - Entangle (as it may get much easier by the system soon)
 * - Illusion (want something in conjunction with WarpGate similar to the summoner but need to check how exactly that could work out first.
 * - Light (as I'm not sure if it isn't better suited in the token vision macro)
 * - Telekinesis (because of the unwilling targets problem)
 ******************************************************/

export async function effect_builder() {
    if (!game.modules.get("warpgate")?.active) {
        ui.notifications.error(game.i18n.localize("SWIM.notification.warpgateRequired"));
        console.error("The SWIM Effect Builder macro requires Warp Gate by honeybadger. It is needed to replace the token. Please install and activate Warp Gate to use the Shape Changer macro: https://foundryvtt.com/packages/warpgate - If you enjoy Warp Gate please consider donating to honeybadger at his KoFi page: https://ko-fi.com/trioderegion")
        return;
    }
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
        <option value="boost">${game.i18n.localize("SWIM.power-boostTrait")}</option>
        <option value="arcane_protection">${game.i18n.localize("SWIM.power-arcaneProtection")}</option>
        <option value="beast_friend">${game.i18n.localize("SWIM.power-beastFriend")}</option>
        <option value="burrow">${game.i18n.localize("SWIM.power-burrow")}</option>
        <option value="conceal_arcana">${game.i18n.localize("SWIM.power-concealArcana")}</option>
        <option value="confusion">${game.i18n.localize("SWIM.power-confusion")}</option>
        <option value="damage_field">${game.i18n.localize("SWIM.power-damageField")}</option>
        <option value="darksight">${game.i18n.localize("SWIM.power-darksight")}</option>
        <option value="deflection">${game.i18n.localize("SWIM.power-deflection")}</option>
        <option value="disguise">${game.i18n.localize("SWIM.power-disguise")}</option>
        <option value="detect_arcana">${game.i18n.localize("SWIM.power-detectArcana")}</option>
        <option value="burden">${game.i18n.localize("SWIM.power-easeBurden-tes")}</option>
        <option value="environmental_protection">${game.i18n.localize("SWIM.power-environmentalProtection")}</option>
        <option value="farsight">${game.i18n.localize("SWIM.power-farsight")}</option>
        <option value="fly">${game.i18n.localize("SWIM.power-fly")}</option>
        <option value="growth">${game.i18n.localize("SWIM.power-growth")}</option>
		<option value="intangibility">${game.i18n.localize("SWIM.power-intangibility")}</option>
        <option value="invisibility">${game.i18n.localize("SWIM.power-invisibility")}</option>
        <option value="lower">${game.i18n.localize("SWIM.power-lowerTrait")}</option>
        <option value="mind_link">${game.i18n.localize("SWIM.power-mindLink")}</option>
        <option value="protection">${game.i18n.localize("SWIM.power-protection")}</option>
        <option value="puppet">${game.i18n.localize("SWIM.power-puppet")}</option>
        <option value="shrink">${game.i18n.localize("SWIM.power-shrink")}</option>
        <option value="silence">${game.i18n.localize("SWIM.power-silence")}</option>
        <option value="sloth">${game.i18n.localize("SWIM.power-sloth")}</option>
        <option value="slumber">${game.i18n.localize("SWIM.power-slumber")}</option>
        <option value="smite">${game.i18n.localize("SWIM.power-smite")}</option>
        <option value="speak_language">${game.i18n.localize("SWIM.power-speakLanguage")}</option>
        <option value="speed">${game.i18n.localize("SWIM.power-speed")}</option>
        <option value="wall_walker">${game.i18n.localize("SWIM.power-wallWalker")}</option>
        <option value="warriors_gift">${game.i18n.localize("SWIM.power-warriorsGift")}</option>
    `

    // Boost/Lower trait options
    let traitOptions = `
        <option value="agility">${game.i18n.localize("SUCC.dialogue.attribute")} ${game.i18n.localize("SWADE.AttrAgi")}</option>
        <option value="smarts">${game.i18n.localize("SUCC.dialogue.attribute")} ${game.i18n.localize("SWADE.AttrSma")}</option>
        <option value="spirit">${game.i18n.localize("SUCC.dialogue.attribute")} ${game.i18n.localize("SWADE.AttrSpr")}</option>
        <option value="strength">${game.i18n.localize("SUCC.dialogue.attribute")} ${game.i18n.localize("SWADE.AttrStr")}</option>
        <option value="vigor">${game.i18n.localize("SUCC.dialogue.attribute")} ${game.i18n.localize("SWADE.AttrVig")}</option>
    `
    let targetIDs = []
    let allHTML = []
    for (let target of targets) {
        targetIDs.push(target.id)
        let targetSkills = target.actor.items.filter(s => s.type === "skill")
        if (targetSkills.length >= 1) {
            //Sort alphabetically
            targetSkills = targetSkills.sort(function (a, b) { return a.length - b.length })
            let skillOptions
            for (let skill of targetSkills) {
                skillOptions = skillOptions + `<option value="${skill.name}">${game.i18n.localize("SUCC.dialogue.skill")} ${skill.name}</option>`
            }
            let targetOptions = traitOptions + skillOptions
            //traitOptions += skillOptions
            let html = `
                <div class='form-group'>
                    <label for='${target.id}'><p>${game.i18n.localize("SWIM.dialogue-powerEffectBuilderAffectedTraitOf")} (${target.name}):</p></label>
                    <select id='${target.id}'>${targetOptions}</select>
                </div>
            `
            allHTML = allHTML += html
        }
    }
    const boostLowerContent = game.i18n.format("SWIM.dialogue-powerEffectBuilderBoostLower", { allHTML: allHTML })

    new Dialog({
        title: game.i18n.localize("SWIM.dialogue-powerEffectBuilderTitle"),
        content: game.i18n.format("SWIM.dialogue-powerEffectBuilderContent", { class: officialClass, options: options, text: boostLowerContent }),
        buttons: {
            one: {
                label: `<i class="fas fa-magic"></i> Proceed`,
                callback: async (html) => {
                    const selectedPower = html.find(`#selected_power`)[0].value
                    const usePowerIcons = game.settings.get("swim", "effectBuilder-usePowerIcons")
                    if (selectedPower === "boost" || selectedPower === "lower") {
                        //const selectedTrait = html.find(`#selected_trait`)[0].value
                        let traits = []
                        for (let target of targets) {
                            const targetTraitName = html.find(`#${target.id}`)[0].value
                            traits.push({ targetID: target.id, traitName: targetTraitName })
                        }
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-boost").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                trait: traits,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "protection") {
                        const bonus = Number(html.find(`#protectionAmount`)[0].value)
                        const selectedType = html.find("input[name=type_choice]:checked").val()
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-protection").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: "protection",
                            protection: {
                                bonus: bonus,
                                type: selectedType,
                                duration: 1,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "smite") {
                        const bonus = Number(html.find(`#damageBonus`)[0].value)
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-smite").toLowerCase()))
                        const icon = power ? power.img : false
                        let weapons = []
                        for (let target of targets) {
                            const targetWeaponName = html.find(`#${target.id}`)[0].value
                            weapons.push({ targetID: target.id, weaponName: targetWeaponName })
                        }
                        const data = {
                            targetIDs: targetIDs,
                            type: "smite",
                            smite: {
                                bonus: bonus,
                                weapon: weapons,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "growth") {
                        const change = Number(html.find(`#sizeAmount`)[0].value)
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-growth").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: "growth",
                            growth: {
                                change: change,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "shrink") {
                        const change = Number(html.find(`#sizeAmount`)[0].value)
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-shrink").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: "shrink",
                            shrink: {
                                change: change,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "sloth") {
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-sloth").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: "sloth",
                            sloth: {
                                change: 0.5,
                                duration: 1,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "speed") {
                        const quickness = html.find(`#quickness`)[0].checked;
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-speed").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: "speed",
                            speed: {
                                change: 2,
                                duration: duration,
                                quickness: quickness,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "burden") {
                        const change = Number(html.find(`#die_steps`)[0].value)
                        if (change === 0) {
                            ui.notifications.warn(game.i18n.localize("SWIM.notififaction.enterNumberUnequalZero"))
                            return
                        }
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-burden-tes").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: "burden",
                            burden: {
                                change: change,
                                duration: duration,
                                durationNoCombat: concentration ? 20 * 60 : 10 * 60,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "beast_friend") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-beastFriend").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            beastFriend: {
                                degree: degree,
                                caster: game.canvas.tokens.controlled[0].name,
                                durationNoCombat: concentration ? 20 * 60 : 10 * 60,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "invisibility") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-invisibility").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            invisibility: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "confusion") {
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-confusion").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "deflection") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-deflection").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "arcane_protection") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-arcaneProtection").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "burrow") {
                        const raise = html.find(`#raise`)[0].checked
                        const strong = html.find(`#strong`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-burrow").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false,
                                strong: strong
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "damage_field") {
                        const damage = html.find(`#damage`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-damageField").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                damage: damage,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "darksight") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-darksight").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: concentration ? Number(120*60) : Number(60*60),
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "conceal_arcana") {
                        const strong = html.find(`#strong`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-conceal").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                duration: concentration ? Number(120*60) : Number(60*60),
                                icon: usePowerIcons ? icon : false,
                                strong: strong
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "detect_arcana") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-detect").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "disguise") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-disguise").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: concentration ? Number(20*60) : Number(10*60),
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "environmental_protection") {
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-environmentalProtection").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                duration: concentration ? Number(120*60) : Number(60*60),
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "farsight") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-farsight").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "fly") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-fly").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "intangibility") {
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-intangibility").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "mind_link") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-mindLink").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: concentration ? Number(60*60) : Number(30*60),
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "puppet") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-puppet").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                casterName: token.name,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "slumber") {
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-slumber").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                duration: concentration ? Number(120*60) : Number(60*60),
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "silence") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-silence").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "speak_language") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-speakLanguage").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: concentration ? Number(20*60) : Number(10*60),
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "wall_walker") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-wallWalker").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "warriors_gift") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-warriorsGift").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
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
                if (selectedPower === "boost" || selectedPower === "lower") {
                    effectContent.innerHTML = boostLowerContent
                } else if (selectedPower === "lower") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderLower", { trait: game.i18n.localize("SUCC.dialogue.trait"), traitOptions: traitOptions })
                } else if (selectedPower === "protection") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderProtection", { amountText: game.i18n.localize("SUCC.dialogue.amount_to_increase") })
                } else if (selectedPower === "smite") {
                    //Get weapons for everyone
                    let allHTML = []
                    for (let target of targets) {
                        const targetWeapons = target.actor.items.filter(w => w.type === "weapon" && w.data.data.quantity >= 1)
                        if (targetWeapons.length >= 1) {
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
                    }
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderSmite", { allHTML: allHTML, increaseText: game.i18n.localize('SUCC.dialogue.amount_to_increase') })
                } else if (selectedPower === "growth") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderGrowth")
                } else if (selectedPower === "shrink") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderShrink")
                } else if (selectedPower === "sloth") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderNothingElse")
                } else if (selectedPower === "speed") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderSpeed")
                } else if (selectedPower === "burden") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderBurden")
                } else if (selectedPower === "beast_friend") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "invisibility") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "confusion") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderNothingElse")
                } else if (selectedPower === "deflection") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "arcane_protection") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "burrow") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise") + game.i18n.format("SWIM.dialogue-optionStrongModifier")
                } else if (selectedPower === "damage_field") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionDamageModifier")
                } else if (selectedPower === "darksight") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "conceal_arcana") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionStrongModifier")
                } else if (selectedPower === "detect_arcana") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "disguise") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "environmental_protection") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderNothingElse")
                } else if (selectedPower === "farsight") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "fly") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "intangibility") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderNothingElse")
                } else if (selectedPower === "mind_link") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "puppet") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "slumber") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderNothingElse")
                } else if (selectedPower === "silence") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "speak_language") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "wall_walker") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "warriors_gift") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                }
            });
        },
        default: "one",
    }, {
        id: "power-effect-dialogue"
    }).render(true);
}

export async function effect_builder_gm(data) {
    const noPP = game.settings.get("swim", "noPowerPoints")
    const type = data.type

    /* Make duration dependent on caster, not yet thought about how to properly implement that though
    const casterID = "many ways to get the Token's Id"
    const Combatants = game.combat.turns;
    const turnNo = Combatants.findIndex(i => i.data.tokenId === `${casterID}`);
    */

    if (type === "boost") {
        for (let target of data.boost.trait) {
            const boostData = {
                boost: {
                    degree: data.boost.degree,
                    trait: target.traitName,
                    duration: data.boost.duration,
                    icon: data.boost.icon
                }
            }
            await succ.apply_status(target.targetID, 'boost', true, false, boostData)
        }
    } else if (type === "lower") {
        for (let target of data.lower.trait) {
            const lowerData = {
                lower: {
                    degree: data.lower.degree,
                    trait: target.traitName,
                    duration: data.lower.duration,
                    icon: data.lower.icon
                }
            }
            await succ.apply_status(target.targetID, 'lower', true, false, lowerData)
        }
    } else if (type === "protection") {
        for (let target of data.targetIDs) {
            const protectionData = {
                protection: {
                    bonus: data.protection.bonus,
                    type: data.protection.type,
                    duration: noPP ? Number(999999999999999) : data.protection.duration,
                    icon: data.protection.icon
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
                    duration: noPP ? Number(999999999999999) : data.smite.duration,
                    icon: data.smite.icon
                }
            }
            await succ.apply_status(target.targetID, 'smite', true, false, smiteData)
        }
    } else if (type === "growth") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            const change = data.growth.change
            let aeData = {
                changes: [],
                icon: data.growth.icon ? data.growth.icon : "modules/swim/assets/icons/effects/m-growth.svg",
                label: game.i18n.localize("SWIM.power-growth"),
                duration: {
                    rounds: noPP ? Number(999999999999999) : data.growth.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            const targetStr = target.actor.data.data.attributes.strength.die.sides + change * 2
            if (targetStr <= 12) {
                aeData.changes.push({ key: `data.attributes.strength.die.sides`, mode: 2, priority: undefined, value: change * 2 })
            } else {
                const toMax = 12 - target.actor.data.data.attributes.strength.die.sides
                const rest = change - (toMax / 2)
                aeData.changes.push({ key: `data.attributes.strength.die.sides`, mode: 2, priority: undefined, value: toMax },
                    { key: `data.attributes.strength.die.modifier`, mode: 2, priority: undefined, value: rest })
            }
            aeData.changes.push({ key: `data.stats.size`, mode: 2, priority: undefined, value: change })
            if (target.actor.data.data.details.autoCalcToughness === false) {
                aeData.changes.push({ key: `data.stats.toughness.value`, mode: 2, priority: undefined, value: change })
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "shrink") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            const change = data.shrink.change
            let aeData = {
                changes: [],
                icon: data.shrink.icon ? data.shrink.icon : "modules/swim/assets/icons/effects/m-shrink.svg",
                label: game.i18n.localize("SWIM.power-shrink"),
                duration: {
                    rounds: noPP ? Number(999999999999999) : data.shrink.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            const targetStr = target.actor.data.data.attributes.strength.die.sides + change * 2
            if (targetStr <= 4) {
                const toMin = 4 - target.actor.data.data.attributes.strength.die.sides
                aeData.changes.push({ key: `data.attributes.strength.die.sides`, mode: 2, priority: undefined, value: toMin })
            } else {
                aeData.changes.push({ key: `data.attributes.strength.die.sides`, mode: 2, priority: undefined, value: change * 2 })
            }
            aeData.changes.push({ key: `data.stats.size`, mode: 2, priority: undefined, value: change })
            if (target.actor.data.data.details.autoCalcToughness === false) {
                aeData.changes.push({ key: `data.stats.toughness.value`, mode: 2, priority: undefined, value: change })
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "speed") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            const change = data.speed.change
            const quickness = data.speed.quickness
            let aeData = {
                changes: [{ key: `data.stats.speed.value`, mode: 5, priority: undefined, value: target.actor.data.data.stats.speed.value * change }],
                icon: data.speed.icon ? data.speed.icon : quickness ? "modules/swim/assets/icons/effects/m-quickness.svg" : "modules/swim/assets/icons/effects/m-speed.svg",
                label: quickness ? game.i18n.localize("SWIM.power-speedQuickness") : game.i18n.localize("SWIM.power-speed"),
                duration: {
                    rounds: noPP ? Number(999999999999999) : data.speed.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "sloth") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            const change = data.sloth.change
            let aeData = {
                changes: [{ key: `data.stats.speed.value`, mode: 5, priority: undefined, value: Math.round(target.actor.data.data.stats.speed.value * change) }],
                icon: data.sloth.icon ? data.sloth.icon : "modules/swim/assets/icons/effects/m-sloth.svg",
                label: game.i18n.localize("SWIM.power-sloth"),
                duration: {
                    rounds: noPP ? Number(999999999999999) : data.sloth.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "burden") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            const change = data.burden.change
            let aeData = {
                changes: [{ key: `data.attributes.strength.encumbranceSteps`, mode: 2, priority: undefined, value: change }],
                icon: data.burden.icon ? data.burden.icon : change > 0 ? "modules/swim/assets/icons/effects/m-ease_burden.svg" : "modules/swim/assets/icons/effects/m-burden.svg",
                label: change > 0 ? game.i18n.localize("SWIM.power-easeBurden-tes") : game.i18n.localize("SWIM.power-burden-tes"),
                duration: {
                    rounds: noPP ? Number(999999999999999) : data.burden.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            else { aeData.duration.seconds = data.burden.durationNoCombat }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "beast_friend") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.beastFriend.icon ? data.beastFriend.icon : "modules/swim/assets/icons/effects/m-beast_friend.svg",
                label: data.beastFriend.degree === "raise" ? `${data.beastFriend.caster}'s ${game.i18n.localize("SWIM.power-beastFriend")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${data.beastFriend.caster}'s ${game.i18n.localize("SWIM.power-beastFriend")}`,
                duration: {
                    seconds: noPP ? Number(999999999999999) : data.beastFriend.durationNoCombat,
                },
                flags: {
                    swade: {
                        expiration: 3
                    }
                }
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "invisibility") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            const condition = await succ.apply_status(target, 'invisible', true, false)
            let aeData = {
                changes: [],
                icon: data.invisibility.icon ? data.invisibility.icon : "modules/succ/assets/icons/m-invisible.svg",
                label: data.invisibility.degree === "raise" ? `${condition.data.label} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${condition.data.label}`,
                duration: {
                    rounds: noPP ? Number(999999999999999) : data.invisibility.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await condition.update(aeData)
        }
    } else if (type === "confusion") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            // Want to show the icon but in theory it has no duration and since duration 1 turn means end of second turn (instead of next) we need to be a bit hacky:
            let duration = {}
            if (target.combatant != null) {
                duration = {
                    rounds: 0,
                    startRound: game.combat.data.round,
                    startTurn: 0,
                    /*
                     * This is the hacky part. Setting start turn to zero, combined with duration 1 turn ensures that 
                     * a) it is shown on the target (duration 0 turns does not show the effect) and 
                     * b) ends after the targets NEXT turn. If the targets turn is 0 however,
                     * it will not end immediately but after its turn next round as it should. This only works if the
                     * proper SWADE flag (end of turn, automatic) is set however because that ignores the real turn order
                     * and always forces the AE owners turn. SWADE is a bit weird about that. Without the SWADE flag FVTT
                     * would do it as one would expect by counting real turns, instead of AE owner turns.
                    */
                    turns: 1
                }
            }
            let aeData = {
                changes: [
                    { key: `data.status.isDistracted`, mode: 5, priority: undefined, value: true },
                    { key: `data.status.isDistracted`, mode: 5, priority: undefined, value: true }
                ],
                icon: data.confusion.icon ? data.confusion.icon : "modules/swim/assets/icons/effects/m-confusion.svg",
                label: game.i18n.localize("SWIM.power-confusion"),
                duration: duration,
                flags: {
                    swade: {
                        expiration: 2
                    }
                }
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "deflection") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.deflection.icon ? data.deflection.icon : "modules/swim/assets/icons/effects/m-deflection.svg",
                label: data.deflection.degree === "raise" ? `${game.i18n.localize("SWIM.power-deflection")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-deflection")}`,
                duration: {
                    rounds: noPP ? Number(999999999999999) : data.deflection.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "arcane_protection") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.arcane_protection.icon ? data.arcane_protection.icon : "modules/swim/assets/icons/effects/m-arcane_protection.svg",
                label: data.arcane_protection.degree === "raise" ? `${game.i18n.localize("SWIM.power-arcaneProtection")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-arcaneProtection")}`,
                duration: {
                    rounds: noPP ? Number(999999999999999) : data.arcane_protection.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "burrow") {
        let label = game.i18n.localize("SWIM.power-burrow")
        if (data.burrow.degree === "raise") {
            label = label + ` (${game.i18n.localize("SWIM.raise").toLowerCase()})`
        } if (data.burrow.strong === true) {
            label = label + ` (${game.i18n.localize("SWIM.modifierStrong").toLowerCase()})`
        }
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.burrow.icon ? data.burrow.icon : "modules/swim/assets/icons/effects/m-burrow.svg",
                label: label,
                duration: {
                    rounds: noPP ? Number(999999999999999) : data.burrow.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "damage_field") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.damage_field.icon ? data.damage_field.icon : "modules/swim/assets/icons/effects/m-damage_field.svg",
                label: data.damage_field.damage === true ? `${game.i18n.localize("SWIM.power-damageField")} (2d6)` : `${game.i18n.localize("SWIM.power-arcaneProtection")} (2d4)`,
                duration: {
                    rounds: noPP ? Number(999999999999999) : data.damage_field.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "darksight") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.darksight.icon ? data.darksight.icon : "modules/swim/assets/icons/effects/m-darksight.svg",
                label: data.darksight.degree === "raise" ? `${game.i18n.localize("SWIM.power-darksight")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-darksight")}`,
                duration: {
                    seconds: noPP ? Number(999999999999999) : data.darksight.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "detect_arcana") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.detect_arcana.icon ? data.detect_arcana.icon : "modules/swim/assets/icons/effects/m-detect_arcana.svg",
                label: data.detect_arcana.degree === "raise" ? `${game.i18n.localize("SWIM.power-detectArcana")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-detectArcana")}`,
                duration: {
                    rounds: noPP ? Number(999999999999999) : data.detect_arcana.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "conceal_arcana") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.conceal_arcana.icon ? data.conceal_arcana.icon : "modules/swim/assets/icons/effects/m-conceal_arcana.svg",
                label: data.conceal_arcana.strong === true ? `${game.i18n.localize("SWIM.power-concealArcana")} (${game.i18n.localize("SWIM.modifierStrong").toLowerCase()})` : `${game.i18n.localize("SWIM.power-concealArcana")}`,
                duration: {
                    seconds: noPP ? Number(999999999999999) : data.conceal_arcana.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "disguise") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.disguise.icon ? data.disguise.icon : "modules/swim/assets/icons/effects/m-disguise.svg",
                label: data.disguise.degree === "raise" ? `${game.i18n.localize("SWIM.power-disguise")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-disguise")}`,
                duration: {
                    seconds: noPP ? Number(999999999999999) : data.disguise.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "environmental_protection") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.environmental_protection.icon ? data.environmental_protection.icon : "modules/swim/assets/icons/effects/m-environmental_protection.svg",
                label: game.i18n.localize("SWIM.power-environmentalProtection"),
                duration: {
                    seconds: noPP ? Number(999999999999999) : data.environmental_protection.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "farsight") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.farsight.icon ? data.farsight.icon : "modules/swim/assets/icons/effects/m-farsight.svg",
                label: data.farsight.degree === "raise" ? `${game.i18n.localize("SWIM.power-farsight")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-farsight")}`,
                duration: {
                    rounds: noPP ? Number(999999999999999) : data.farsight.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "fly") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                label: data.fly.degree === "raise" ? `${game.i18n.localize("SWADE.Flying")} (24")` : `${game.i18n.localize("SWADE.Flying")} (12")`,
                duration: {
                    rounds: noPP ? Number(999999999999999) : data.fly.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            if (data.fly.icon) {aeData.icon = data.fly.icon}
            const effect = await succ.apply_status(target, "flying", true, false)
            await effect.update(aeData)
        }
    } else if (type === "intangibility") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.intangibility.icon ? data.intangibility.icon : "modules/swim/assets/icons/effects/m-intangibility.svg",
                label: game.i18n.localize("SWIM.power-intangibility"),
                duration: {
                    rounds: noPP ? Number(999999999999999) : data.intangibility.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "mind_link") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                label: data[type].degree === "raise" ? `${game.i18n.localize("SWIM.power-mindLink")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-mindLink")}`,
                duration: {
                    seconds: noPP ? Number(999999999999999) : data[type].duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "puppet") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                label: data[type].degree === "raise" ? `${data.puppet.casterName}'s ${game.i18n.localize("SWIM.power-puppet")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${data.puppet.casterName}'s ${game.i18n.localize("SWIM.power-puppet")}`,
                duration: {
                    rounds: noPP ? Number(999999999999999) : data[type].duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "slumber") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                label: game.i18n.localize("SWIM.power-slumber"),
                duration: {
                    seconds: noPP ? Number(999999999999999) : data[type].duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "silence") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                label: data[type].degree === "raise" ? `${game.i18n.localize("SWIM.power-silence")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-silence")}`,
                duration: {
                    rounds: noPP ? Number(999999999999999) : data[type].duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "speak_language") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                label: data[type].degree === "raise" ? `${game.i18n.localize("SWIM.power-speakLanguage")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-speakLanguage")}`,
                duration: {
                    seconds: noPP ? Number(999999999999999) : data[type].duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "wall_walker") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                label: data[type].degree === "raise" ? `${game.i18n.localize("SWIM.power-wallWalker")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-wallWalker")}`,
                duration: {
                    rounds: noPP ? Number(999999999999999) : data[type].duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "warriors_gift") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                label: data[type].degree === "raise" ? `${game.i18n.localize("SWIM.power-warriorsGift")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-warriorsGift")}`,
                duration: {
                    rounds: noPP ? Number(999999999999999) : data[type].duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    }
}
