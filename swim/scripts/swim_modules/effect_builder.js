/*******************************************************
 * SWADE Immersive Macros (SWIM) proudly presents:
 * The Effect Builder.
 * This allows users to apply power effects to any token
 * no matter if they have ownership or not. It respects
 * the standard rules and increased duration from the
 * concentration edge.
 *
 * v. 7.0.1
 * By SalieriC#8263; dialogue resizing by Freeze#2689.
 *
 * Powers on hold for now:
 * - Entangle (as it may get much easier by the system soon)
 * - Illusion (want something in conjunction with WarpGate similar to the summoner but need to check how exactly that could work out first.
 * - Light (as I'm not sure if it isn't better suited in the token vision macro)
 * - Telekinesis (because of the unwilling targets problem)
 ******************************************************/
import * as SWIM from '../constants.js'
import {socket} from "../init.js"

export async function effect_builder(data = false) {
    if (!game.modules.get("socketlib")?.active) {
        ui.notifications.error(game.i18n.localize("SWIM.notification.socketlibRequired"));
        console.error("The SWIM Effect Builder macro requires Socketlib by Stäbchenfisch. Please install and activate Warp Gate to use this macro: https://foundryvtt.com/packages/socketlib")
        return;
    }
    // Targets:
    const targets = game.user.targets
    //const { speaker, _, __, token } = await swim.get_macro_variables()
    const {speaker, character, actor, token, item} = await swim.get_data_variables(data, false)
    console.log(speaker, character, actor, token, item)
    if (!token || canvas.tokens.controlled.length > 1 || targets.size === 0) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleTargetMultiToken"))
        return
    }

    //Get an ID for this maintenance
    const maintID = swim.generate_id()

    //Checking if caster is also the target:
    const targetsArray = Array.from(game.user.targets)
    const casterIsTarget = targetsArray.find(t => t.id === token.id)
    const noPP = game.settings.get("swim", "noPowerPoints")

    //Set div class based on enabled official module:
    const officialClass = await swim.get_official_class()

    let duration = 5
    const concentration = token.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-concentration") && i.type === "edge")
    if (concentration) {
        duration = duration * 2
    }

    const defaultPower = item && SWIM.SWID_POWER_LIST[item.system.swid] ? SWIM.SWID_POWER_LIST[item.system.swid] : item ? 'other': 'boost';
    const { options, traitOptions, allHTML, targetIDs } = generateOptionsAndHTML(defaultPower, targets);
    const initialContent = getDialogContent(token, defaultPower, allHTML, targets, noPP, item)

    new Dialog({
        title: game.i18n.localize("SWIM.dialogue-powerEffectBuilderTitle"),
        content: game.i18n.format("SWIM.dialogue-powerEffectBuilderContent", {
            class: officialClass,
            options: options,
            text: initialContent,
            caster: token.name
        }),
        buttons: {
            one: {
                label: `<i class="fas fa-magic"></i> ${game.i18n.localize("SWIM.button-proceed")}`,
                callback: async (html) => {
                    const selectedPower = html.find(`#selected_power`)[0].value
                    const usePowerIcons = game.settings.get("swim", "effectBuilder-usePowerIcons")
                    let durationSeconds
                    let durationRounds = duration
                    const powerName = selectedPower === "other" ? html.find(`#power_choice`)[0].value : game.i18n.localize(`SWIM.power-${selectedPower}`)
                    const power = item ? item : token.actor.items.find(p => p.name.toLowerCase().includes(powerName.toLowerCase()) && p.type === "power")
                    const icon = power ? power.img : false
                    const sceneID = game.scenes.current.id

                    if (selectedPower === "boost" || selectedPower === "lower") {
                        //const selectedTrait = html.find(`#selected_trait`)[0].value
                        let traits = []
                        for (let target of targets) {
                            const targetTraitName = html.find(`#${target.id}`)[0].value
                            traits.push({targetID: target.id, traitName: targetTraitName})
                        }
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                trait: traits,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "protection") {
                        const bonus = Number(html.find(`#protectionAmount`)[0].value)
                        const selectedType = html.find("input[name=type_choice]:checked").val()
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: "protection",
                            powerID: power._id,
                            protection: {
                                bonus: bonus,
                                type: selectedType,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "smite") {
                        const bonus = Number(html.find(`#damageBonus`)[0].value)
                        let weapons = []
                        for (let target of targets) {
                            const targetWeaponName = html.find(`#${target.id}`)[0].value
                            weapons.push({targetID: target.id, weaponName: targetWeaponName})
                        }
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: "smite",
                            powerID: power._id,
                            smite: {
                                bonus: bonus,
                                weapon: weapons,
                                duration: duration,
                                icon: usePowerIcons ? icon : false,
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "growth") {
                        const change = Number(html.find(`#sizeAmount`)[0].value)
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: "growth",
                            powerID: power._id,
                            growth: {
                                change: change,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "shrink") {
                        const change = Number(html.find(`#sizeAmount`)[0].value)
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: "shrink",
                            powerID: power._id,
                            shrink: {
                                change: change,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "sloth") {
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            powerID: power._id,
                            type: "sloth",
                            sloth: {
                                change: 0.5,
                                duration: 1,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "speed") {
                        const quickness = html.find(`#quickness`)[0].checked;
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: "speed",
                            powerID: power._id,
                            speed: {
                                change: 2,
                                duration: duration,
                                quickness: quickness,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "burden-tes") {
                        const change = Number(html.find(`#die_steps`)[0].value)
                        if (change === 0) {
                            ui.notifications.warn(game.i18n.localize("SWIM.notififaction.enterNumberUnequalZero"))
                            return
                        }
                        durationSeconds = concentration ? 20 * 60 : 10 * 60
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: "burden",
                            powerID: power._id,
                            burden: {
                                change: change,
                                duration: duration,
                                durationNoCombat: durationSeconds,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "beastFriend") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        durationSeconds = concentration ? 20 * 60 : 10 * 60
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            beastFriend: {
                                degree: degree,
                                caster: game.canvas.tokens.controlled[0].name,
                                durationNoCombat: durationSeconds,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "invisibility") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            invisibility: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "confusion") {
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "deflection") {
                        const type = html.find(`#deflectionOption`)[0].value
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                type: type.charAt(0).toUpperCase() + type.slice(1),
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "arcaneProtection") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "burrow") {
                        const raise = html.find(`#raise`)[0].checked
                        const strong = html.find(`#strong`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false,
                                strong: strong
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "damageField") {
                        const damage = html.find(`#damage`)[0].checked
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                damage: damage,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "darksight") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        durationSeconds = concentration ? Number(120 * 60) : Number(60 * 60)
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                duration: durationSeconds,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "conceal") {
                        const strong = html.find(`#strong`)[0].checked
                        durationSeconds = concentration ? Number(120 * 60) : Number(60 * 60)
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: "concealArcana",
                            powerID: power._id,
                            concealArcana: {
                                duration: durationSeconds,
                                icon: usePowerIcons ? icon : false,
                                strong: strong
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "detect") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: "detectArcana",
                            powerID: power._id,
                            detectArcana: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "disguise") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        durationSeconds = concentration ? Number(20 * 60) : Number(10 * 60)
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                duration: durationSeconds,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "elementalManipulation") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "empathy") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "environmentalProtection") {
                        durationSeconds = concentration ? Number(120 * 60) : Number(60 * 60)
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                duration: durationSeconds,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "farsight") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "fly") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "intangibility") {
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "light") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        durationSeconds = concentration ? Number(20 * 60) : Number(10 * 60)
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                duration: durationSeconds,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "mindLink") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        durationSeconds = concentration ? Number(60 * 60) : Number(30 * 60)
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                duration: durationSeconds,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "puppet") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                casterName: token.name,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "relief") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        durationSeconds = 3600 //always lasts an hour
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            relief: {
                                degree: degree,
                                caster: game.canvas.tokens.controlled[0].name,
                                durationNoCombat: durationSeconds,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "slumber") {
                        durationSeconds = concentration ? Number(120 * 60) : Number(60 * 60)
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                duration: durationSeconds,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "silence") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "speakLanguage") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        durationSeconds = concentration ? Number(20 * 60) : Number(10 * 60)
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                duration: durationSeconds,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "wallWalker") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "warriorsGift") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "blind") {
                        const raise = html.find(`#raise`)[0].checked
                        let degree = "success"
                        if (raise === true) {
                            degree = "raise"
                        }
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                //duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    } else if (selectedPower === "other") {
                        const raise = html.find(`#raise`)[0].checked
                        durationRounds = noPP ? Number(999999999999999) : Number(html.find(`#duration_rounds`)[0].value)
                        durationSeconds = noPP ? Number(999999999999999) : (Number(html.find(`#duration_minutes`)[0].value) / 60)
                        if (durationRounds === 0 && durationSeconds > 0) {
                            durationRounds = durationSeconds * 6
                        } else if (durationSeconds === 0 && durationRounds > 0) {
                            durationSeconds = undefined
                        } else if (durationRounds === 0 && durationSeconds === 0) {
                            durationRounds = concentration ? 10 : 5;
                            durationSeconds = undefined
                        }
                        const degree = raise ? "raise" : "success"
                        const data = {
                            sceneID: sceneID,
                            targetIDs: targetIDs,
                            casterID: token.id,
                            maintenanceID: maintID,
                            type: selectedPower,
                            powerID: power._id,
                            [selectedPower]: {
                                degree: degree,
                                durationRounds: durationRounds,
                                durationSeconds: durationSeconds,
                                icon: icon,
                                powerID: power.id
                            }
                        }
                        //warpgate.event.notify("SWIM.effectBuilder", data)
                        await socket.executeAsGM(effect_builder_gm, data)
                    }

                    // If caster is not the target and noPP setting rule active, give the caster a -1 to its spellcasting:
                    if (!casterIsTarget && !(selectedPower === "confusion" || selectedPower === "blind" || selectedPower === "relief" || selectedPower === "sloth")) {
                        if (power) {
                            const skillName = power.system.actions.trait
                            let aeData = {
                                changes: [],
                                icon: power.img,
                                name: selectedPower === "other" ? game.i18n.format("SWIM.label-maintaining", {powerName: power.name}) : game.i18n.format("SWIM.label-maintaining", {powerName: game.i18n.localize(`SWIM.power-${selectedPower}`)}),
                                duration: {
                                    seconds: noPP ? Number(999999999999999) : durationSeconds,
                                    startRound: token.combatant != null ? game.combat.round : 0,
                                    rounds: noPP ? Number(999999999999999) : durationRounds,
                                },
                                description: power ? power.system.description : "",
                                flags: {
                                    swade: {
                                        expiration: 3
                                    },
                                    swim: {
                                        maintainedPower: true,
                                        maintaining: game.i18n.localize(`SWIM.power-${selectedPower}`),
                                        targets: targetIDs,
                                        maintenanceID: maintID,
                                        owner: true,
                                        powerID: power.id,
                                        affected: false
                                    }
                                }
                            }
                            if (noPP) {
                                aeData.changes.push({
                                    key: `@Skill{${skillName}}[system.die.modifier]`,
                                    mode: 2,
                                    priority: undefined,
                                    value: -1
                                })
                            }
                            if (token.actor.system.additionalStats?.maintainedPowers) {
                                aeData.changes.push({
                                    key: `system.additionalStats.maintainedPowers.value`,
                                    mode: 2,
                                    priority: undefined,
                                    value: 1
                                })
                            }
                            await token.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
                        }
                    }
                }
            }
        },
        render: ([dialogContent]) => {
            $("#power-effect-dialogue").css("height", "auto"); // Adjust the dialogue to its content. Also fixes the error of scroll bar on first dialogue after login/reload.
            dialogContent.querySelector(`select[id="selected_power"]`).focus();
            dialogContent.querySelector(`select[id="selected_power"]`).addEventListener("input", (event) => {
                const textInput = event.target;
                const form = textInput.closest("form")
                const effectContent = form.querySelector(".effectContent");
                const selectedPower = form.querySelector('select[id="selected_power"]').value;
                effectContent.innerHTML = getDialogContent(token, selectedPower, allHTML, targets, noPP)
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
    const playerScene = game.scenes.get(data.sceneID)
    const caster = playerScene.tokens.get(casterID)
    let casterIsTarget = false
    if (data.targetIDs.find(t => t === casterID)) {
        casterIsTarget = true
    }
    const power = data.powerID ? caster.actor.items.find(p => p.id === data.powerID) : caster.actor.items.find(p => p.name.toLowerCase().includes(game.i18n.localize(`SWIM.power-${type}`).toLowerCase()) && p.type === "power")
    let additionalChange = false
    if (casterIsTarget && noPP === true && !(type === "blind" || type === "confusion" || type === "sloth")) {
        if (power) {
            const skillName = power.system.actions.trait
            additionalChange = [{
                key: `@Skill{${skillName}}[system.die.modifier]`,
                mode: 2,
                priority: undefined,
                value: -1
            }]
            if (caster.actor.system.additionalStats?.maintainedPowers) {
                additionalChange.push({
                    key: `system.additionalStats.maintainedPowers.value`,
                    mode: 2,
                    priority: undefined,
                    value: 1
                })
            }
        } else if (caster.actor.system.additionalStats?.maintainedPowers) {
            additionalChange = [{
                key: `system.additionalStats.maintainedPowers.value`,
                mode: 2,
                priority: undefined,
                value: 1
            }]
        }
    }

    const flags = {
        maintainedPower: true,
        maintaining: game.i18n.localize(`SWIM.power-${type}`),
        targets: data.targetIDs,
        maintenanceID: data.maintenanceID,
        owner: false
    }

    if (type === "boost") {
        for (let target of data.boost.trait) {
            const boostData = {
                boost: {
                    degree: data.boost.degree,
                    trait: target.traitName,
                    duration: power || noPP ? Number(999999999999999) : data.boost.duration,
                    img: data.boost.icon,
                    additionalChanges: target.targetID === casterID ? additionalChange : false,
                    flags: {
                        swim: {
                            maintainedPower: true,
                            maintaining: game.i18n.localize(`SWIM.power-${type}`),
                            targets: data.targetIDs,
                            maintenanceID: data.maintenanceID,
                            owner: false,
                            powerID: power ? power.id : undefined,
                            affected: true
                        }
                    }
                },
                force: true
            }
            if (target.targetID === casterID) {
                boostData.boost.flags.swim.owner = true
                boostData.boost.duration = noPP ? Number(999999999999999) : data.boost.duration
            }
            const targetToken = playerScene.tokens.get(target.targetID)
            //await succ.apply_status(targetToken, 'boost', true, false, boostData)
            await game.succ.addCondition('boost', targetToken, {
                allowDuplicates: true,
                forceOverlay: false,
                effectOptions: boostData,
                duration: boostData.boost.duration
            })
        }
    } else if (type === "lower") {
        for (let target of data.lower.trait) {
            const lowerData = {
                lower: {
                    degree: data.lower.degree,
                    trait: target.traitName,
                    duration: power || noPP ? Number(999999999999999) : data.lower.duration,
                    img: data.lower.icon,
                    additionalChanges: target.targetID === casterID ? additionalChange : false,
                    flags: {
                        swim: {
                            maintainedPower: true,
                            maintaining: game.i18n.localize(`SWIM.power-${type}`),
                            targets: data.targetIDs,
                            maintenanceID: data.maintenanceID,
                            owner: false,
                            powerID: power ? power.id : undefined,
                            affected: true
                        }
                    }
                },
                force: true
            }
            if (target.targetID === casterID) {
                lowerData.lower.flags.swim.owner = true
                lowerData.lower.duration = noPP ? Number(999999999999999) : data.lower.duration
            }
            const targetToken = playerScene.tokens.get(target.targetID)
            //await succ.apply_status(targetToken, 'lower', true, false, lowerData)
            await game.succ.addCondition('lower', targetToken, {
                allowDuplicates: true,
                forceOverlay: false,
                effectOptions: lowerData,
                duration: lowerData.lower.duration
            })
        }
    } else if (type === "protection") {
        for (let target of data.targetIDs) {
            const protectionData = {
                protection: {
                    bonus: data.protection.bonus,
                    type: data.protection.type,
                    duration: power || noPP ? Number(999999999999999) : data.protection.duration,
                    img: data.protection.icon,
                    additionalChanges: target === casterID ? additionalChange : false,
                    flags: {
                        swim: {
                            maintainedPower: true,
                            maintaining: game.i18n.localize(`SWIM.power-${type}`),
                            targets: data.targetIDs,
                            maintenanceID: data.maintenanceID,
                            owner: false,
                            powerID: power ? power.id : undefined,
                            affected: true
                        }
                    }
                },
                force: true
            }
            if (target.targetID === casterID) {
                protectionData.protection.flags.swim.owner = true
                protectionData.protection.duration = noPP ? Number(999999999999999) : data.protection.duration
            }
            const targetToken = playerScene.tokens.get(target)
            //await succ.apply_status(targetToken, 'protection', true, false, protectionData)
            await game.succ.addCondition('protection', targetToken, {
                allowDuplicates: true,
                forceOverlay: false,
                effectOptions: protectionData,
                duration: protectionData.protection.duration
            })
        }
    } else if (type === "smite") {
        for (let target of data.smite.weapon) {
            const smiteData = {
                smite: {
                    bonus: data.smite.bonus,
                    weapon: target.weaponName,
                    duration: power || noPP ? Number(999999999999999) : data.smite.duration,
                    img: data.smite.icon,
                    additionalChanges: target.targetID === casterID ? additionalChange : false,
                    description: power ? power.system.description : "",
                    flags: {
                        swim: {
                            maintainedPower: true,
                            maintaining: game.i18n.localize(`SWIM.power-${type}`),
                            targets: data.targetIDs,
                            maintenanceID: data.maintenanceID,
                            owner: false,
                            powerID: power ? power.id : undefined,
                            affected: true
                        }
                    }
                },
                force: true
            }
            if (target.targetID === casterID) {
                smiteData.smite.flags.swim.owner = true
                smiteData.smite.duration = noPP ? Number(999999999999999) : data.smite.duration
            }
            const targetToken = playerScene.tokens.get(target.targetID)
            //await succ.apply_status(targetToken, 'smite', true, false, smiteData)
            await game.succ.addCondition('smite', targetToken, {
                allowDuplicates: true,
                forceOverlay: false,
                effectOptions: smiteData,
                duration: smiteData.smite.duration
            })
        }
    } else if (type === "growth") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            const change = data.growth.change
            let aeData = {
                changes: [],
                img: data.growth.icon ? data.growth.icon : "modules/swim/assets/icons/effects/m-growth.svg",
                name: game.i18n.localize("SWIM.power-growth"),
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.growth.duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
                flags: {
                    swade: {
                        expiration: 3
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            const targetStr = target.actor.system.attributes.strength.die.sides + change * 2
            if (targetStr <= 12) {
                aeData.changes.push({
                    key: `system.attributes.strength.die.sides`,
                    mode: 2,
                    priority: undefined,
                    value: change * 2
                })
            } else {
                const toMax = 12 - target.actor.system.attributes.strength.die.sides
                const rest = change - (toMax / 2)
                aeData.changes.push({
                        key: `system.attributes.strength.die.sides`,
                        mode: 2,
                        priority: undefined,
                        value: toMax
                    },
                    {key: `system.attributes.strength.die.modifier`, mode: 2, priority: undefined, value: rest})
            }
            aeData.changes.push({key: `system.stats.size`, mode: 2, priority: undefined, value: change})
            if (target.actor.system.details.autoCalcToughness === false) {
                aeData.changes.push({key: `system.stats.toughness.value`, mode: 2, priority: undefined, value: change})
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes.push(additionalChange[0])
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.growth.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "relief") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [{
                    key: `system.woundsOrFatigue.ignored`,
                    mode: 2,
                    priority: undefined,
                    value: data.relief.degree === "raise" ? 2 : 1
                }],
                img: data.relief.icon ? data.relief.icon : "modules/swim/assets/icons/effects/m-reliefNumb.svg",
                name: data.relief.degree === "raise" ? `${game.i18n.localize("SWIM.power-relief")}: ${game.i18n.localize("SWIM.power-relief_numb")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-relief")}: ${game.i18n.localize("SWIM.power-relief_numb")}`,
                duration: {
                    seconds: Number(3600), //Duration is always one hour.
                    rounds: Number(600),
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
                flags: {
                    swade: {
                        expiration: 2
                    },
                    swim: {
                        maintainedPower: false,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "shrink") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            const change = data.shrink.change
            let aeData = {
                changes: [],
                img: data.shrink.icon ? data.shrink.icon : "modules/swim/assets/icons/effects/m-shrink.svg",
                name: game.i18n.localize("SWIM.power-shrink"),
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.shrink.duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
                flags: {
                    swade: {
                        expiration: 3
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            const targetStr = target.actor.system.attributes.strength.die.sides + change * 2
            if (targetStr <= 4) {
                const toMin = 4 - target.actor.system.attributes.strength.die.sides
                aeData.changes.push({
                    key: `system.attributes.strength.die.sides`,
                    mode: 2,
                    priority: undefined,
                    value: toMin
                })
            } else {
                aeData.changes.push({
                    key: `system.attributes.strength.die.sides`,
                    mode: 2,
                    priority: undefined,
                    value: change * 2
                })
            }
            aeData.changes.push({key: `system.stats.size`, mode: 2, priority: undefined, value: change})
            if (target.actor.system.details.autoCalcToughness === false) {
                aeData.changes.push({key: `system.stats.toughness.value`, mode: 2, priority: undefined, value: change})
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.shrink.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "speed") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            const change = data.speed.change
            const quickness = data.speed.quickness
            let aeData = {
                changes: [{
                    key: `system.stats.speed.value`,
                    mode: 5,
                    priority: undefined,
                    value: target.actor.system.stats.speed.value * change
                }],
                img: data.speed.icon ? data.speed.icon : quickness ? "modules/swim/assets/icons/effects/m-quickness.svg" : "modules/swim/assets/icons/effects/m-speed.svg",
                name: quickness ? game.i18n.localize("SWIM.power-speedQuickness") : game.i18n.localize("SWIM.power-speed"),
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.speed.duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
                flags: {
                    swade: {
                        expiration: 3
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.speed.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "sloth") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            const change = data.sloth.change
            let duration = {}
            if (target.combatant != null) {
                duration = {
                    rounds: 0,
                    startRound: target.combatant != null ? game.combat.round : 0,
                    startTurn: 0,
                    // Same trickery as with confusion
                    turns: 1
                }
            }
            let aeData = {
                changes: [{
                    key: `system.stats.speed.value`,
                    mode: 5,
                    priority: undefined,
                    value: Math.round(target.actor.system.stats.speed.value * change)
                }],
                img: data.sloth.icon ? data.sloth.icon : "modules/swim/assets/icons/effects/m-sloth.svg",
                name: game.i18n.localize("SWIM.power-sloth"),
                duration: duration,
                description: power ? power.system.description : "",
                flags: {
                    swade: {
                        expiration: 3
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "burden") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            const change = data.burden.change
            let aeData = {
                changes: [{
                    key: `system.attributes.strength.encumbranceSteps`,
                    mode: 2,
                    priority: undefined,
                    value: change
                }],
                img: data.burden.icon ? data.burden.icon : change > 0 ? "modules/swim/assets/icons/effects/m-ease_burden.svg" : "modules/swim/assets/icons/effects/m-burden.svg",
                name: change > 0 ? game.i18n.localize("SWIM.power-easeBurden-tes") : game.i18n.localize("SWIM.power-burden-tes"),
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.burden.duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                    seconds: power || noPP ? Number(999999999999999) : data.burden.durationNoCombat,
                },
                description: power ? power.system.description : "",
                flags: {
                    swade: {
                        expiration: 3
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.burden.duration
                aeData.duration.seconds = noPP ? Number(999999999999999) : data.burden.durationNoCombat
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "beastFriend") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data.beastFriend.icon ? data.beastFriend.icon : "modules/swim/assets/icons/effects/m-beastFriend.svg",
                name: data.beastFriend.degree === "raise" ? `${data.beastFriend.caster}'s ${game.i18n.localize("SWIM.power-beastFriend")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${data.beastFriend.caster}'s ${game.i18n.localize("SWIM.power-beastFriend")}`,
                duration: {
                    seconds: power || noPP ? Number(999999999999999) : data.beastFriend.durationNoCombat,
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration / 6,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
                flags: {
                    swade: {
                        expiration: 3
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data.beastFriend.durationNoCombat
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration / 6
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "invisibility") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data.invisibility.icon ? data.invisibility.icon : "modules/succ/assets/icons/m-invisible.svg",
                name: data.invisibility.degree === "raise" ? `${game.i18n.localize("SWIM.power-invisibility")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-invisibility")}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.invisibility.duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: false
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.invisibility.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "confusion") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            // Want to show the icon but in theory it has no duration and since duration 1 turn means end of second turn (instead of next) we need to be a bit hacky:
            let duration = {}
            if (target.combatant != null) {
                duration = {
                    rounds: 0,
                    startRound: target.combatant != null ? game.combat.round : 0,
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
                    {key: `system.status.isDistracted`, mode: 5, priority: undefined, value: true},
                    {key: `system.status.isVulnerable`, mode: 5, priority: undefined, value: true}
                ],
                img: data.confusion.icon ? data.confusion.icon : "modules/swim/assets/icons/effects/m-confusion.svg",
                name: game.i18n.localize("SWIM.power-confusion"),
                duration: duration,
                description: power ? power.system.description : "",
                flags: {
                    swade: {
                        expiration: 2
                    },
                    swim: {
                        maintainedPower: false,
                        maintaining: game.i18n.localize(`SWIM.power-${type}`),
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            /* Don't want to use that for instant powers.
            if (targetID === casterID) {
                if (additionalChange) { aeData.changes = aeData.changes.concat(additionalChange) }
                aeData.flags.swim.owner = true
            }
            */
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "deflection") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data.deflection.icon ? data.deflection.icon : "modules/swim/assets/icons/effects/m-deflection.svg",
                name: `${game.i18n.localize("SWIM.power-deflection")} (${game.i18n.localize(`SWIM.gameTerm-${data.deflection.type}`).toLowerCase()})`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.deflection.duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.deflection.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "arcaneProtection") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data.arcaneProtection.icon ? data.arcaneProtection.icon : "modules/swim/assets/icons/effects/m-arcaneProtection.svg",
                name: data.arcaneProtection.degree === "raise" ? `${game.i18n.localize("SWIM.power-arcaneProtection")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-arcaneProtection")}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.arcaneProtection.duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.arcaneProtection.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "burrow") {
        let label = game.i18n.localize("SWIM.power-burrow")
        if (data.burrow.degree === "raise") {
            label = label + ` (${game.i18n.localize("SWIM.raise").toLowerCase()})`
        }
        if (data.burrow.strong === true) {
            label = label + ` (${game.i18n.localize("SWIM.modifierStrong").toLowerCase()})`
        }
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data.burrow.icon ? data.burrow.icon : "modules/swim/assets/icons/effects/m-burrow.svg",
                name: label,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.burrow.duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.burrow.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "damageField") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data.damageField.icon ? data.damageField.icon : "modules/swim/assets/icons/effects/m-damageField.svg",
                name: data.damageField.damage === true ? `${game.i18n.localize("SWIM.power-damageField")} (2d6)` : `${game.i18n.localize("SWIM.power-damageField")} (2d4)`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.damageField.duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.damageField.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "darksight") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data.darksight.icon ? data.darksight.icon : "modules/swim/assets/icons/effects/m-darksight.svg",
                name: data.darksight.degree === "raise" ? `${game.i18n.localize("SWIM.power-darksight")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-darksight")}`,
                duration: {
                    seconds: power || noPP ? Number(999999999999999) : data.darksight.duration,
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration / 6,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data.darksight.duration
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration / 6
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "detectArcana") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data.detectArcana.icon ? data.detectArcana.icon : "modules/swim/assets/icons/effects/m-detectArcana.svg",
                name: data.detectArcana.degree === "raise" ? `${game.i18n.localize("SWIM.power-detectArcana")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-detectArcana")}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.detectArcana.duration,
                    startRound: target.combatant != null ? game.combat.data.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.detectArcana.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "concealArcana") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data.concealArcana.icon ? data.concealArcana.icon : "modules/swim/assets/icons/effects/m-concealArcana.svg",
                name: data.concealArcana.strong === true ? `${game.i18n.localize("SWIM.power-concealArcana")} (${game.i18n.localize("SWIM.modifierStrong").toLowerCase()})` : `${game.i18n.localize("SWIM.power-concealArcana")}`,
                duration: {
                    seconds: power || noPP ? Number(999999999999999) : data.concealArcana.duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data.concealArcana.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "disguise") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data.disguise.icon ? data.disguise.icon : "modules/swim/assets/icons/effects/m-disguise.svg",
                name: data.disguise.degree === "raise" ? `${game.i18n.localize("SWIM.power-disguise")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-disguise")}`,
                duration: {
                    seconds: power || noPP ? Number(999999999999999) : data.disguise.duration,
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration / 6,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data.disguise.duration
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration / 6
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "environmentalProtection") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data.environmentalProtection.icon ? data.environmentalProtection.icon : "modules/swim/assets/icons/effects/m-environmentalProtection.svg",
                name: game.i18n.localize("SWIM.power-environmentalProtection"),
                duration: {
                    seconds: power || noPP ? Number(999999999999999) : data.environmentalProtection.duration,
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration / 6,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data.environmentalProtection.duration
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration / 6
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "farsight") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data.farsight.icon ? data.farsight.icon : "modules/swim/assets/icons/effects/m-farsight.svg",
                name: data.farsight.degree === "raise" ? `${game.i18n.localize("SWIM.power-farsight")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-farsight")}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.farsight.duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.farsight.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "fly") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                name: data.fly.degree === "raise" ? `${game.i18n.localize("SWADE.Flying")} (24")` : `${game.i18n.localize("SWADE.Flying")} (12")`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.fly.duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (data.fly.icon) {
                aeData.icon = data.fly.icon
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.fly.duration
            }
            const effects = await game.succ.addCondition('flying', target, {forceOverlay: false});
            const effect = effects[0] //Only expect a single returned AE here.
            await effect.update(aeData)
        }
    } else if (type === "intangibility") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data.intangibility.icon ? data.intangibility.icon : "modules/swim/assets/icons/effects/m-intangibility.svg",
                name: game.i18n.localize("SWIM.power-intangibility"),
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data.intangibility.duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data.intangibility.duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "light") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let changes = [
                {
                    "key": "ATL.light.bright",
                    "value": data[type].degree === "raise" ? "5" : "3",
                    "mode": 5,
                    "priority": null
                },
                {
                    "key": "ATL.light.animation",
                    "value": "{type: \"sunburst\", speed: 1, intensity: 1}",
                    "mode": 5,
                    "priority": null
                },
                {
                    "key": "ATL.light.color",
                    "value": "#fffa61",
                    "mode": 5,
                    "priority": null
                },
                {
                    "key": "ATL.light.alpha",
                    "value": "0.25",
                    "mode": 5,
                    "priority": null
                },
                {
                    "key": "ATL.light.angle",
                    "value": data[type].degree === "raise" ? "52.5" : "360",
                    "mode": 5,
                    "priority": null
                }
            ]
            let aeData = {
                changes: changes,
                img: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                name: data[type].degree === "raise" ? `${game.i18n.localize("SWIM.power-light")} (${game.i18n.localize("SWIM.beam")})` : `${game.i18n.localize("SWIM.power-light")}`,
                duration: {
                    seconds: power || noPP ? Number(999999999999999) : data[type].duration,
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration / 6,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data[type].duration
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration / 6
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "mindLink") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                name: data[type].degree === "raise" ? `${game.i18n.localize("SWIM.power-mindLink")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-mindLink")}`,
                duration: {
                    seconds: power || noPP ? Number(999999999999999) : data[type].duration,
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration / 6,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data[type].duration
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration / 6
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "puppet") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                name: data[type].degree === "raise" ? `${data.puppet.casterName}'s ${game.i18n.localize("SWIM.power-puppet")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${data.puppet.casterName}'s ${game.i18n.localize("SWIM.power-puppet")}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "slumber") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                name: game.i18n.localize("SWIM.power-slumber"),
                duration: {
                    seconds: power || noPP ? Number(999999999999999) : data[type].duration,
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration / 6,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data[type].duration
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration / 6
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "silence") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                name: data[type].degree === "raise" ? `${game.i18n.localize("SWIM.power-silence")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-silence")}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "speakLanguage") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                name: data[type].degree === "raise" ? `${game.i18n.localize("SWIM.power-speakLanguage")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-speakLanguage")}`,
                duration: {
                    seconds: power || noPP ? Number(999999999999999) : data[type].duration,
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration / 6,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.seconds = noPP ? Number(999999999999999) : data[type].duration
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration / 6
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "wallWalker") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                name: data[type].degree === "raise" ? `${game.i18n.localize("SWIM.power-wallWalker")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-wallWalker")}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "warriorsGift") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                name: data[type].degree === "raise" ? `${game.i18n.localize("SWIM.power-warriorsGift")} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize("SWIM.power-warriorsGift")}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "empathy") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                name: data[type].degree === "raise" ? `${game.i18n.localize(`SWIM.power-${type}`)} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize(`SWIM.power-${type}`)}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "elementalManipulation") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                name: data[type].degree === "raise" ? `${game.i18n.localize(`SWIM.power-${type}`)} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize(`SWIM.power-${type}`)}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data[type].duration,
                    startRound: target.combatant != null ? game.combat.round : 0,
                },
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].duration
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "blind") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let duration = {}
            if (target.combatant != null) {
                duration = {
                    rounds: 0,
                    startRound: target.combatant != null ? game.combat.round : 0,
                    startTurn: 0,
                    // Same trickery as with confusion
                    turns: 1
                }
            }
            let aeData = {
                changes: [],
                img: data[type].icon ? data[type].icon : `modules/swim/assets/icons/effects/m-${type}.svg`,
                name: data[type].degree === "raise" ? `${game.i18n.localize(`SWIM.power-${type}`)} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${game.i18n.localize(`SWIM.power-${type}`)}`,
                duration: duration,
                description: power ? power.system.description : "",
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
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes = aeData.changes.concat(additionalChange)
                }
                aeData.flags.swim.owner = true
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "other") {
        for (let targetID of data.targetIDs) {
            const target = playerScene.tokens.get(targetID)
            let aeData = {
                changes: [],
                img: data[type].icon,
                name: data[type].degree === "raise" ? `${power.name} (${game.i18n.localize("SWIM.raise").toLowerCase()})` : `${power.name}`,
                duration: {
                    rounds: power || noPP ? Number(999999999999999) : data[type].durationRounds,
                    startRound: target.combatant != null ? game.combat.round : 0,
                    seconds: power || noPP ? Number(999999999999999) : data[type].durationSeconds
                },
                description: power ? power.system.description : "",
                flags: {
                    swade: {
                        expiration: 3
                    },
                    succ: {
                        updatedAE: true
                    },
                    swim: {
                        maintainedPower: true,
                        maintaining: power.name,
                        targets: data.targetIDs,
                        maintenanceID: data.maintenanceID,
                        owner: false,
                        powerID: power ? power.id : undefined,
                        affected: true
                    }
                }
            }
            if (targetID === casterID) {
                if (additionalChange) {
                    aeData.changes.push(additionalChange[0]);
                    aeData.changes.push(additionalChange[1])
                }
                aeData.flags.swim.owner = true
                aeData.duration.rounds = noPP ? Number(999999999999999) : data[type].durationRounds
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    }
}

function getDialogContent(token, selectedPower, allHTML, targets, noPP, item) {
    let content
    if (selectedPower === "boost" || selectedPower === "lower") {
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderBoostLower", {allHTML: allHTML})
    } else if (selectedPower === "lower") {
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderLower", {
            trait: game.i18n.localize("SUCC.dialogue.trait"),
            traitOptions: traitOptions
        })
    } else if (selectedPower === "protection") {
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderProtection", {amountText: game.i18n.localize("SUCC.dialogue.amount_to_increase")})
    } else if (selectedPower === "smite") {
        //Get weapons for everyone
        let allHTML = []
        for (let target of targets) {
            const targetWeapons = target.actor.items.filter(w => w.type === "weapon" && w.system.quantity >= 1)
            if (targetWeapons.length >= 1) {
                let weaponOptions
                for (let weapon of targetWeapons) {
                    weaponOptions = weaponOptions + `<option value="${weapon.name}">${weapon.name}</option>`
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
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderSmite", {
            allHTML: allHTML,
            increaseText: game.i18n.localize('SUCC.dialogue.amount_to_increase')
        })
    } else if (selectedPower === "growth") {
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderGrowth")
    } else if (selectedPower === "shrink") {
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderShrink")
    } else if (selectedPower === "sloth") {
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderNothingElse")
    } else if (selectedPower === "speed") {
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderSpeed")
    } else if (selectedPower === "burden-tes") {
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderBurden")
    } else if (selectedPower === "beastFriend") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "invisibility") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "confusion") {
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderNothingElse")
    } else if (selectedPower === "deflection") {
        const optionsDeflection = `<option value="melee">${game.i18n.localize("SWIM.gameTerm-Melee")}</option><option value="range">${game.i18n.localize("SWIM.gameTerm-Ranged")}</option><option value="raise">${game.i18n.localize("SWIM.gameTerm-Raise")}</option>`
        content = game.i18n.format("SWIM.select-deflectionOptions", {options: optionsDeflection})
    } else if (selectedPower === "arcaneProtection") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "burrow") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise") + game.i18n.format("SWIM.dialogue-optionStrongModifier")
    } else if (selectedPower === "damageField") {
        content = game.i18n.format("SWIM.dialogue-optionDamageModifier")
    } else if (selectedPower === "darksight") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "conceal") {
        content = game.i18n.format("SWIM.dialogue-optionStrongModifier")
    } else if (selectedPower === "detect") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "disguise") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "elementalManipulation") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "empathy") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "environmentalProtection") {
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderNothingElse")
    } else if (selectedPower === "farsight") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "fly") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "intangibility") {
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderNothingElse")
    } else if (selectedPower === "light") {
        content = game.i18n.format("SWIM.dialogue-optionLight")
    } else if (selectedPower === "mindLink") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "puppet") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "relief") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "slumber") {
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderNothingElse")
    } else if (selectedPower === "silence") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "speakLanguage") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "wallWalker") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "warriorsGift") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "blind") {
        content = game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    } else if (selectedPower === "other") {
        let powers = token.actor.items.filter(p => p.type === "power")
        let powerOptions
        for (let power of powers) {
            powerOptions += `<option ${power._id === item?._id ? 'selected' : ''} value="${power.name}">${power.name}</option>`
        }
        content = game.i18n.format("SWIM.dialogue-otherPower", {options: powerOptions})
        if (noPP === false) {
            content += game.i18n.localize("SWIM.dialogue-duration")
        }
        content += game.i18n.format("SWIM.dialogue-optionCastWithRaise")
    }
    return content
}

function generateOptionsAndHTML(defaultPower, targets) {
    // Helper function to create options with the selected attribute
    function createOptions(optionsList, defaultValue) {
        return optionsList.map(option => {
            const selected = option.value === defaultValue ? 'selected="selected"' : '';
            const localizedLabel = option.label.map(label => game.i18n.localize(label)).join(' ');
            return `<option value="${option.value}" ${selected}>${localizedLabel}</option>`;
        }).join('');
    }

    const optionsList = [
        {value: 'boost', label: ['SWIM.power-boostTrait']},
        {value: 'arcaneProtection', label: ['SWIM.power-arcaneProtection']},
        {value: 'beastFriend', label: ['SWIM.power-beastFriend']},
        {value: 'blind', label: ['SWIM.power-blind']},
        {value: 'burrow', label: ['SWIM.power-burrow']},
        {value: 'conceal', label: ['SWIM.power-concealArcana']},
        {value: 'confusion', label: ['SWIM.power-confusion']},
        {value: 'damageField', label: ['SWIM.power-damageField']},
        {value: 'darksight', label: ['SWIM.power-darksight']},
        {value: 'deflection', label: ['SWIM.power-deflection']},
        {value: 'disguise', label: ['SWIM.power-disguise']},
        {value: 'detect', label: ['SWIM.power-detectArcana']},
        {value: 'burden-tes', label: ['SWIM.power-easeBurden-tes']},
        {value: 'elementalManipulation', label: ['SWIM.power-elementalManipulation']},
        {value: 'empathy', label: ['SWIM.power-empathy']},
        {value: 'environmentalProtection', label: ['SWIM.power-environmentalProtection']},
        {value: 'farsight', label: ['SWIM.power-farsight']},
        {value: 'fly', label: ['SWIM.power-fly']},
        {value: 'growth', label: ['SWIM.power-growth']},
        {value: 'intangibility', label: ['SWIM.power-intangibility']},
        {value: 'invisibility', label: ['SWIM.power-invisibility']},
        {value: 'light', label: ['SWIM.power-light']},
        {value: 'lower', label: ['SWIM.power-lowerTrait']},
        {value: 'mindLink', label: ['SWIM.power-mindLink']},
        {value: 'protection', label: ['SWIM.power-protection']},
        {value: 'puppet', label: ['SWIM.power-puppet']},
        {value: 'relief', label: ['SWIM.power-relief']},
        {value: 'shrink', label: ['SWIM.power-shrink']},
        {value: 'silence', label: ['SWIM.power-silence']},
        {value: 'sloth', label: ['SWIM.power-sloth']},
        {value: 'slumber', label: ['SWIM.power-slumber']},
        {value: 'smite', label: ['SWIM.power-smite']},
        {value: 'speakLanguage', label: ['SWIM.power-speakLanguage']},
        {value: 'speed', label: ['SWIM.power-speed']},
        {value: 'wallWalker', label: ['SWIM.power-wallWalker']},
        {value: 'warriorsGift', label: ['SWIM.power-warriorsGift']},
        {value: 'other', label: ['SWIM.power-other']}
    ];

    const traitOptionsList = [
        {value: 'agility', label: ['SUCC.dialogue.attribute', 'SWADE.AttrAgi']},
        {value: 'smarts', label: ['SUCC.dialogue.attribute', 'SWADE.AttrSma']},
        {value: 'spirit', label: ['SUCC.dialogue.attribute', 'SWADE.AttrSpr']},
        {value: 'strength', label: ['SUCC.dialogue.attribute', 'SWADE.AttrStr']},
        {value: 'vigor', label: ['SUCC.dialogue.attribute', 'SWADE.AttrVig']}
    ];

    const options = createOptions(optionsList, defaultPower);
    const traitOptions = createOptions(traitOptionsList, defaultPower);

    let targetIDs = [];
    let allHTML = [];
    for (let target of targets) {
        targetIDs.push(target.id);
        let targetSkills = target.actor.items.filter(s => s.type === "skill");
        if (targetSkills.length >= 1) {
            //Sort alphabetically
            targetSkills.sort(function (a, b) {
                let textA = a.name.toUpperCase();
                let textB = b.name.toUpperCase();
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
            });
            let skillOptions = targetSkills.map(skill => `<option value="${skill.name}">${game.i18n.localize("SUCC.dialogue.skill")} ${skill.name}</option>`).join('');
            let targetOptions = traitOptions + skillOptions;
            let html = `
            <div class='form-group'>
                <label for='${target.id}'><p>${game.i18n.localize("SWIM.dialogue-powerEffectBuilderAffectedTraitOf")} (${target.name}):</p></label>
                <select id='${target.id}'>${targetOptions}</select>
            </div>
        `;
            allHTML += html;
        } else { //Failsafe for the unlikely case that the target has no skills.
            let html = `
            <div class='form-group'>
                <label for='${target.id}'><p>${game.i18n.localize("SWIM.dialogue-powerEffectBuilderAffectedTraitOf")} (${target.name}):</p></label>
                <select id='${target.id}'>${traitOptions}</select>
            </div>
        `;
            allHTML += html;
        }
    }

    return { options, traitOptions, allHTML, targetIDs };
}