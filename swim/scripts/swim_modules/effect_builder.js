/*******************************************************
 * SWADE Immersive Macros (SWIM) proudly presents:
 * The Effect Builder.
 * This allows users to apply power effects to any token
 * no matter if they have ownership or not. It respects
 * the standard rules and increased duration from the
 * concentration edge.
 * 
 * v. 4.1.1
 * By SalieriC#8263; dialogue resizing by Freeze#2689.
 * 
 * Powers on hold for now:
 * - Entangle (as it may get much easier by the system soon)
 * - Illusion (want something in conjunction with WarpGate similar to the summoner but need to check how exactly that could work out first.
 * - Light (as I'm not sure if it isn't better suited in the token vision macro)
 * - Telekinesis (because of the unwilling targets problem)
 ******************************************************/

function generate_id (length = 16) {
    var result           = 'SWIM-';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
      charactersLength));
    }
   return result;
  }

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

    //Get an ID for this maintenance
    const maintID = generate_id()

    //Checking if caster is also the target:
    const targetsArray = Array.from(game.user.targets)
    const casterIsTarget = targetsArray.find(t => t.id === token.id)
    const noPP = game.settings.get("swim", "noPowerPoints")

    //Set div class based on enabled official module:
    const officialClass = await swim.get_official_class()

    let duration = 5
    const concentration = token.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-concentration") && i.type === "edge")
    if (concentration) { duration = duration * 2 }

    const options = `
        <option value="boost">${game.i18n.localize("SWIM.power-boostTrait")}</option>
        <option value="arcaneProtection">${game.i18n.localize("SWIM.power-arcaneProtection")}</option>
        <option value="beastFriend">${game.i18n.localize("SWIM.power-beastFriend")}</option>
        <option value="blind">${game.i18n.localize("SWIM.power-blind")}</option>
        <option value="burrow">${game.i18n.localize("SWIM.power-burrow")}</option>
        <option value="concealArcana">${game.i18n.localize("SWIM.power-concealArcana")}</option>
        <option value="confusion">${game.i18n.localize("SWIM.power-confusion")}</option>
        <option value="damageField">${game.i18n.localize("SWIM.power-damageField")}</option>
        <option value="darksight">${game.i18n.localize("SWIM.power-darksight")}</option>
        <option value="deflection">${game.i18n.localize("SWIM.power-deflection")}</option>
        <option value="disguise">${game.i18n.localize("SWIM.power-disguise")}</option>
        <option value="detectArcana">${game.i18n.localize("SWIM.power-detectArcana")}</option>
        <option value="burden">${game.i18n.localize("SWIM.power-easeBurden-tes")}</option>
        <option value="elementalManipulation">${game.i18n.localize("SWIM.power-elementalManipulation")}</option>
        <option value="empathy">${game.i18n.localize("SWIM.power-empathy")}</option>
        <option value="environmentalProtection">${game.i18n.localize("SWIM.power-environmentalProtection")}</option>
        <option value="farsight">${game.i18n.localize("SWIM.power-farsight")}</option>
        <option value="fly">${game.i18n.localize("SWIM.power-fly")}</option>
        <option value="growth">${game.i18n.localize("SWIM.power-growth")}</option>
		<option value="intangibility">${game.i18n.localize("SWIM.power-intangibility")}</option>
        <option value="invisibility">${game.i18n.localize("SWIM.power-invisibility")}</option>
        <option value="lower">${game.i18n.localize("SWIM.power-lowerTrait")}</option>
        <option value="mindLink">${game.i18n.localize("SWIM.power-mindLink")}</option>
        <option value="protection">${game.i18n.localize("SWIM.power-protection")}</option>
        <option value="puppet">${game.i18n.localize("SWIM.power-puppet")}</option>
        <option value="shrink">${game.i18n.localize("SWIM.power-shrink")}</option>
        <option value="silence">${game.i18n.localize("SWIM.power-silence")}</option>
        <option value="sloth">${game.i18n.localize("SWIM.power-sloth")}</option>
        <option value="slumber">${game.i18n.localize("SWIM.power-slumber")}</option>
        <option value="smite">${game.i18n.localize("SWIM.power-smite")}</option>
        <option value="speakLanguage">${game.i18n.localize("SWIM.power-speakLanguage")}</option>
        <option value="speed">${game.i18n.localize("SWIM.power-speed")}</option>
        <option value="wallWalker">${game.i18n.localize("SWIM.power-wallWalker")}</option>
        <option value="warriorsGift">${game.i18n.localize("SWIM.power-warriorsGift")}</option>
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
                    let durationSeconds
                    let durationRounds = duration
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
                            casterID: token.id,
                            maintenanceID: maintID,
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
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: "protection",
                            protection: {
                                bonus: bonus,
                                type: selectedType,
                                duration: duration,
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
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: "smite",
                            smite: {
                                bonus: bonus,
                                weapon: weapons,
                                duration: duration,
                                icon: usePowerIcons ? icon : false,
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "growth") {
                        const change = Number(html.find(`#sizeAmount`)[0].value)
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-growth").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
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
                            casterID: token.id,
                            maintenanceID: maintID,
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
                            casterID: token.id,
                            maintenanceID: maintID,
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
                            casterID: token.id,
                            maintenanceID: maintID,
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
                        durationSeconds = concentration ? 20 * 60 : 10 * 60
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: "burden",
                            burden: {
                                change: change,
                                duration: duration,
                                durationNoCombat: durationSeconds,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "beastFriend") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-beastFriend").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        durationSeconds = concentration ? 20 * 60 : 10 * 60
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            beastFriend: {
                                degree: degree,
                                caster: game.canvas.tokens.controlled[0].name,
                                durationNoCombat: durationSeconds,
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
                            casterID: token.id,
                            maintenanceID: maintID,
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
                            casterID: token.id,
                            maintenanceID: maintID,
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
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "arcaneProtection") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-arcaneProtection").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
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
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false,
                                strong: strong
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "damageField") {
                        const damage = html.find(`#damage`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-damageField").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
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
                        durationSeconds = concentration ? Number(120*60) : Number(60*60)
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: durationSeconds,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "concealArcana") {
                        const strong = html.find(`#strong`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-conceal").toLowerCase()))
                        const icon = power ? power.img : false
                        durationSeconds = concentration ? Number(120*60) : Number(60*60)
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                duration: durationSeconds,
                                icon: usePowerIcons ? icon : false,
                                strong: strong
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "detectArcana") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-detect").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
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
                        durationSeconds = concentration ? Number(20*60) : Number(10*60)
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: durationSeconds,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "elementalManipulation") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-elementalManipulation").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "empathy") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-empathy").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "environmentalProtection") {
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-environmentalProtection").toLowerCase()))
                        const icon = power ? power.img : false
                        durationSeconds = concentration ? Number(120*60) : Number(60*60)
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                duration: durationSeconds,
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
                            casterID: token.id,
                            maintenanceID: maintID,
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
                            casterID: token.id,
                            maintenanceID: maintID,
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
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "mindLink") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-mindLink").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        durationSeconds = concentration ? Number(60*60) : Number(30*60)
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: durationSeconds,
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
                            casterID: token.id,
                            maintenanceID: maintID,
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
                        durationSeconds = concentration ? Number(120*60) : Number(60*60)
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                duration: durationSeconds,
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
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "speakLanguage") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-speakLanguage").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        durationSeconds = concentration ? Number(20*60) : Number(10*60)
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: durationSeconds,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "wallWalker") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-wallWalker").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "warriorsGift") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-warriorsGift").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "blind") {
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-blind").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            [selectedPower]: {
                                degree: degree,
                                //duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    }

                    // If caster is not the target and noPP setting rule active, give the caster a -1 to its spellcasting:
                    if (!casterIsTarget && !(selectedPower === "confusion" || selectedPower === "blind" || selectedPower === "sloth")) {
                        const power = token.actor.items.find(p => p.name.toLowerCase().includes(game.i18n.localize(`SWIM.power-${selectedPower}`).toLowerCase()) )
                        if (power) {
                            const skillName = power.data.data.actions.skill
                            let aeData = {
                                changes: [],
                                icon: power.img,
                                label: game.i18n.format("SWIM.label-maintaining", {powerName: game.i18n.localize(`SWIM.power-${selectedPower}`)}),
                                duration: {
                                    seconds: noPP ? Number(999999999999999) : durationSeconds,
                                    startRound: token.combatant != null ? game.combat.data.round : 0,
                                    rounds: noPP ? Number(999999999999999) : durationRounds,
                                },
                                flags: {
                                    swade: {
                                        expiration: 3
                                    },
                                    swim: {
                                        maintainedPower: true,
                                        maintaining: game.i18n.localize(`SWIM.power-${selectedPower}`),
                                        targets: targetIDs,
                                        maintenanceID: maintID,
                                        owner: true
                                    }
                                }
                            }
                            if (noPP) {
                                aeData.changes.push({ key: `@Skill{${skillName}}[data.die.modifier]`, mode: 2, priority: undefined, value: -1 })
                            }
                            if (token.actor.data.data.additionalStats?.maintainedPowers) {
                                aeData.changes.push({ key: `data.additionalStats.maintainedPowers.value`, mode: 2, priority: undefined, value: 1 })
                            }
                            await token.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
                        }
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
                } else if (selectedPower === "beastFriend") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "invisibility") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "confusion") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderNothingElse")
                } else if (selectedPower === "deflection") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "arcaneProtection") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "burrow") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise") + game.i18n.format("SWIM.dialogue-optionStrongModifier")
                } else if (selectedPower === "damageField") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionDamageModifier")
                } else if (selectedPower === "darksight") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "concealArcana") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionStrongModifier")
                } else if (selectedPower === "detectArcana") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "disguise") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "elementalManipulation") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "empathy") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "environmentalProtection") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderNothingElse")
                } else if (selectedPower === "farsight") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "fly") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "intangibility") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderNothingElse")
                } else if (selectedPower === "mindLink") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "puppet") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "slumber") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderNothingElse")
                } else if (selectedPower === "silence") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "speakLanguage") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "wallWalker") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "warriorsGift") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
                } else if (selectedPower === "blind") {
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
    const casterID = data.casterID
    const caster = canvas.tokens.get(casterID)
    let casterIsTarget = false
    if (data.targetIDs.find(t => t === casterID)) {
        casterIsTarget = true
    }
    const power = caster.actor.items.find(p => p.name.toLowerCase().includes(game.i18n.localize(`SWIM.power-${type}`).toLowerCase()) && p.type === "power" )
    let additionalChange = false
    if (casterIsTarget && noPP === true && !(type === "blind" || type === "confusion" || selectedPower === "sloth")) {
        if (power) {
            const skillName = power.data.data.actions.skill
            additionalChange = [{ key: `@Skill{${skillName}}[data.die.modifier]`, mode: 2, priority: undefined, value: -1 }]
        }
    }

    const flags = {
        maintainedPower: true,
        maintaining: game.i18n.localize(`SWIM.power-${type}`),
        targets: data.targetIDs,
        maintenanceID: data.maintenanceID,
        owner: false
    }

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
                    duration: power || noPP ? Number(999999999999999) : data.boost.duration,
                    icon: data.boost.icon,
                    additionalChanges: target.targetID === casterID ? additionalChange : false,
                    flags: {swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }}
                }
            }
            if (target.targetID === casterID) {
                boostData.boost.flags.swim.owner = true
                boostData.boost.duration = noPP ? Number(999999999999999) : data.boost.duration
            }
            await succ.apply_status(target.targetID, 'boost', true, false, boostData)
        }
    } else if (type === "lower") {
        for (let target of data.lower.trait) {
            const lowerData = {
                lower: {
                    degree: data.lower.degree,
                    trait: target.traitName,
                    duration: power || noPP ? Number(999999999999999) : data.lower.duration,
                    icon: data.lower.icon,
                    additionalChanges: target.targetID === casterID ? additionalChange : false,
                    flags: {swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }}
                }
            }
            if (target.targetID === casterID) {
                lowerData.lower.flags.swim.owner = true
                lowerData.lower.duration = noPP ? Number(999999999999999) : data.lower.duration
            }
            await succ.apply_status(target.targetID, 'lower', true, false, lowerData)
        }
    } else if (type === "protection") {
        for (let target of data.targetIDs) {
            const protectionData = {
                protection: {
                    bonus: data.protection.bonus,
                    type: data.protection.type,
                    duration: power || noPP ? Number(999999999999999) : data.protection.duration,
                    icon: data.protection.icon,
                    additionalChanges: target.targetID === casterID ? additionalChange : false,
                    flags: {swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }}
                }
            }
            if (target.targetID === casterID) {
                protectionData.protection.flags.swim.owner = true
                protectionData.protection.duration = noPP ? Number(999999999999999) : data.protection.duration
            }
            await succ.apply_status(target, 'protection', true, false, protectionData)
        }
    } else if (type === "smite") {
        for (let target of data.smite.weapon) {
            const smiteData = {
                smite: {
                    bonus: data.smite.bonus,
                    weapon: target.weaponName,
                    duration: power || noPP ? Number(999999999999999) : data.smite.duration,
                    icon: data.smite.icon,
                    additionalChanges: target.targetID === casterID ? additionalChange : false,
                    flags: {swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }}
                }
            }
            if (target.targetID === casterID) {
                smiteData.smite.flags.swim.owner = true
                smiteData.smite.duration = noPP ? Number(999999999999999) : data.smite.duration
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
                    rounds: power || noPP ? Number(999999999999999) : data.growth.duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
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
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes.push(additionalChange[0])
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.speed.duration
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
                    rounds: power || noPP ? Number(999999999999999) : data.shrink.duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
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
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.shrink.duration
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
                    rounds: power || noPP ? Number(999999999999999) : data.speed.duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.speed.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "sloth") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            const change = data.sloth.change
            let duration = {}
            if (target.combatant != null) {
                duration = {
                    rounds: 0,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                    startTurn: 0,
                    // Same trickery as with confusion
                    turns: 1
                }
            }
            let aeData = {
                changes: [{ key: `data.stats.speed.value`, mode: 5, priority: undefined, value: Math.round(target.actor.data.data.stats.speed.value * change) }],
                icon: data.sloth.icon ? data.sloth.icon : "modules/swim/assets/icons/effects/m-sloth.svg",
                label: game.i18n.localize("SWIM.power-sloth"),
                duration: duration,
                flags: {
                    swade: {
                        expiration: 3
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
            }
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
                    rounds: power || noPP ? Number(999999999999999) : data.burden.duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                    seconds: power || noPP ? Number(999999999999999) : data.burden.durationNoCombat,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.burden.duration
                aeData.duration.seconds = noPP ? Number(999999999999999) : data.burden.durationNoCombat
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "beastFriend") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.beastFriend.icon ? data.beastFriend.icon : "modules/swim/assets/icons/effects/m-beastFriend.svg",
                label: data.beastFriend.degree === "raise" ? `${data.beastFriend.caster}'s ${game.i18n.localize("SWIM.power-beastFriend")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${data.beastFriend.caster}'s ${game.i18n.localize("SWIM.power-beastFriend")}`,
                duration: {
                    seconds: power || noPP ? Number(999999999999999) : data.beastFriend.durationNoCombat,
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration / 6,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data.beastFriend.durationNoCombat
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration / 6
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
                    rounds: power || noPP ? Number(999999999999999) : data.invisibility.duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.invisibility.duration
            }
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
                    startRound: target.combatant != null ? game.combat.data.round : 0,
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
                    },
                    swim: {
                        maintainedPower: false,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            /* Don't want to use that for instant powers.
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
            }
            */
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
                    rounds: power || noPP ? Number(999999999999999) : data.deflection.duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.deflection.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "arcaneProtection") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.arcaneProtection.icon ? data.arcaneProtection.icon : "modules/swim/assets/icons/effects/m-arcaneProtection.svg",
                label: data.arcaneProtection.degree === "raise" ? `${game.i18n.localize("SWIM.power-arcaneProtection")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-arcaneProtection")}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.arcaneProtection.duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.arcaneProtection.duration
            }
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
                    rounds: power || noPP ? Number(999999999999999) : data.burrow.duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.burrow.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "damageField") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.damageField.icon ? data.damageField.icon : "modules/swim/assets/icons/effects/m-damageField.svg",
                label: data.damageField.damage === true ? `${game.i18n.localize("SWIM.power-damageField")} (2d6)` : `${game.i18n.localize("SWIM.power-arcaneProtection")} (2d4)`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.damageField.duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.damageField.duration
            }
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
                    seconds: power || noPP ? Number(999999999999999) : data.darksight.duration,
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration / 6,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data.darksight.duration
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration / 6
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "detectArcana") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.detectArcana.icon ? data.detectArcana.icon : "modules/swim/assets/icons/effects/m-detectArcana.svg",
                label: data.detectArcana.degree === "raise" ? `${game.i18n.localize("SWIM.power-detectArcana")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-detectArcana")}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.detectArcana.duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.detectArcana.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "concealArcana") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.concealArcana.icon ? data.concealArcana.icon : "modules/swim/assets/icons/effects/m-concealArcana.svg",
                label: data.concealArcana.strong === true ? `${game.i18n.localize("SWIM.power-concealArcana")} (${game.i18n.localize("SWIM.modifierStrong").toLowerCase()})` : `${game.i18n.localize("SWIM.power-concealArcana")}`,
                duration: {
                    seconds: power || noPP ? Number(999999999999999) : data.concealArcana.duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data.concealArcana.duration
            }
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
                    seconds: power || noPP ? Number(999999999999999) : data.disguise.duration,
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration / 6,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data.disguise.duration
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration / 6
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "environmentalProtection") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data.environmentalProtection.icon ? data.environmentalProtection.icon : "modules/swim/assets/icons/effects/m-environmentalProtection.svg",
                label: game.i18n.localize("SWIM.power-environmentalProtection"),
                duration: {
                    seconds: power || noPP ? Number(999999999999999) : data.environmentalProtection.duration,
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration / 6,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data.environmentalProtection.duration
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration / 6
            }
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
                    rounds: power || noPP ? Number(999999999999999) : data.farsight.duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.farsight.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "fly") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                label: data.fly.degree === "raise" ? `${game.i18n.localize("SWADE.Flying")} (24")` : `${game.i18n.localize("SWADE.Flying")} (12")`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.fly.duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (data.fly.icon) {aeData.icon = data.fly.icon}
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.fly.duration
            }
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
                    rounds: power || noPP ? Number(999999999999999) : data.intangibility.duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.intangibility.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "mindLink") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                label: data[type].degree === "raise" ? `${game.i18n.localize("SWIM.power-mindLink")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-mindLink")}`,
                duration: {
                    seconds: power || noPP ? Number(999999999999999) : data[type].duration,
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration / 6,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data[type].duration
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration / 6
            }
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
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration
            }
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
                    seconds: power || noPP ? Number(999999999999999) : data[type].duration,
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration / 6,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data[type].duration
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration / 6
            }
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
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "speakLanguage") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                label: data[type].degree === "raise" ? `${game.i18n.localize("SWIM.power-speakLanguage")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-speakLanguage")}`,
                duration: {
                    seconds: power || noPP ? Number(999999999999999) : data[type].duration,
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration / 6,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data[type].duration
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration / 6
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "wallWalker") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                label: data[type].degree === "raise" ? `${game.i18n.localize("SWIM.power-wallWalker")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-wallWalker")}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "warriorsGift") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                label: data[type].degree === "raise" ? `${game.i18n.localize("SWIM.power-warriorsGift")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-warriorsGift")}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "empathy") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                label: data[type].degree === "raise" ? `${game.i18n.localize(`SWIM.power-${type}`)} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize(`SWIM.power-${type}`)}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "elementalManipulation") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let aeData = {
                changes: [],
                icon: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                label: data[type].degree === "raise" ? `${game.i18n.localize(`SWIM.power-${type}`)} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize(`SWIM.power-${type}`)}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "blind") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            let duration = {}
            if (target.combatant != null) {
                duration = {
                    rounds: 0,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                    startTurn: 0,
                    // Same trickery as with confusion
                    turns: 1
                }
            }
            let aeData = {
                changes: [],
                icon: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                label: data[type].degree === "raise" ? `${game.i18n.localize(`SWIM.power-${type}`)} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize(`SWIM.power-${type}`)}`,
                duration: duration,
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes.push(additionalChange[0]) }
                aeData.flags.swim.owner = true
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    }
}
