/*******************************************************
 * SWADE Immersive Macros (SWIM) proudly presents:
 * The Effect Builder.
 * This allows users to apply power effects to any token
 * no matter if they have ownership or not. It respects
 * the standard rules and increased duration from the
 * concentration edge.
 *
 * v. 8.0.0
 * By SalieriC#8263; dialogue resizing by Freeze#2689.
 *
 * Powers on hold for now:
 * - Entangle (as it may get much easier by the system soon)
 * - Illusion (want something in conjunction with WarpGate similar to the summoner but need to check how exactly that could work out first.
 * - Telekinesis (because of the unwilling targets problem)
 * 
 * The Light power uses Active Token Effects which is not updated to v14 and might need a replacement.
 ******************************************************/
import * as SWIM from '../constants.js'
import {socket} from "../init.js"

// ============================================================================
// PART 1: Dialogue Creation
// ============================================================================

export async function effect_builder(data = false) {
    if (!game.modules.get("warpgate")?.active) {
        ui.notifications.error(game.i18n.localize("SWIM.notification.warpgateRequired"));
        console.error("The SWIM Effect Builder macro requires Warp Gate by honeybadger. It is needed to replace the token. Please install and activate Warp Gate to use the Shape Changer macro: https://foundryvtt.com/packages/warpgate - If you enjoy Warp Gate please consider donating to honeybadger at his KoFi page: https://ko-fi.com/trioderegion");
        return;
    }

    const targets = game.user.targets
    const {speaker, character, actor, token, item} = await swim.get_data_variables(data, false)

    if (!token || canvas.tokens.controlled.length > 1 || targets.size === 0) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleTargetMultiToken"))
        return
    }

    const maintID = swim.generate_id()
    const targetsArray = Array.from(game.user.targets)
    const casterIsTarget = targetsArray.find(t => t.id === token.id)
    const noPP = game.settings.get("swim", "noPowerPoints")
    const officialClass = await swim.get_official_class()

    let duration = 5
    const concentration = token.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-concentration") && i.type === "edge")
    if (concentration) duration = duration * 2

    const defaultPower = item && SWIM.SWID_POWER_LIST[item.system.swid] ? SWIM.SWID_POWER_LIST[item.system.swid] : (item ? 'other' : 'boost')
    const { options, traitOptions, allHTML, targetIDs } = generateOptionsAndHTML(defaultPower, targets)
    const initialContent = getDialogContent(token, defaultPower, allHTML, targets, noPP, item)

    new Dialog({
        title: game.i18n.localize("SWIM.dialogue-powerEffectBuilderTitle"),
        content: game.i18n.format("SWIM.dialogue-powerEffectBuilderContent", {
            class: officialClass, options, text: initialContent, caster: token.name
        }),
        buttons: {
            one: {
                label: `<i class="fas fa-magic"></i> ${game.i18n.localize("SWIM.button-proceed")}`,
                callback: async (html) => {
                    await processEffectSelection(html, token, targets, targetIDs, maintID, casterIsTarget, noPP, concentration, item)
                }
            }
        },
        render: ([dialogContent]) => {
            $("#power-effect-dialogue").css("height", "auto")
            const select = dialogContent.querySelector(`select[id="selected_power"]`)
            select.focus()
            select.addEventListener("input", (event) => {
                const form = event.target.closest("form")
                form.querySelector(".effectContent").innerHTML = getDialogContent(token, event.target.value, allHTML, targets, noPP)
            })
        },
        default: "one",
    }, { id: "power-effect-dialogue" }).render(true)
}

// ============================================================================
// Helper: Process effect selection from dialog
// ============================================================================

async function processEffectSelection(html, token, targets, targetIDs, maintID, casterIsTarget, noPP, concentration, item) {
    const selectedPower = html.find(`#selected_power`)[0].value
    const usePowerIcons = game.settings.get("swim", "effectBuilder-usePowerIcons")
    let durationSeconds, durationRounds = 5
    const powerName = selectedPower === "other" ? html.find(`#power_choice`)[0].value : game.i18n.localize(`SWIM.power-${selectedPower}`)
    const power = item ? item : token.actor.items.find(p => p.name.toLowerCase().includes(powerName.toLowerCase()) && p.type === "power")
    const icon = power ? power.img : false
    const sceneID = game.scenes.current.id

    const data = {
        sceneID, targetIDs, casterID: token.id, maintenanceID: maintID,
        type: selectedPower, powerID: power?._id,
        icon: usePowerIcons ? icon : false,
        duration: 5, durationRounds, durationSeconds, noPP, concentration
    }

    // Collect power-specific data from dialog
    switch (selectedPower) {
        case "boost":
        case "lower":
            const traits = []
            for (const target of targets) {
                const targetTraitName = html.find(`#${target.id}`)[0].value
                traits.push({targetID: target.id, traitName: targetTraitName})
            }
            data.degree = html.find(`#raise`)[0].checked ? "raise" : "success"
            data.traits = traits
            break

        case "protection":
            data.bonus = Number(html.find(`#protectionAmount`)[0].value)
            data.protectionType = html.find("input[name=type_choice]:checked").val()
            break

        case "smite":
            data.bonus = Number(html.find(`#damageBonus`)[0].value)
            const weapons = []
            for (const target of targets) {
                const targetWeaponName = html.find(`#${target.id}`)[0].value
                weapons.push({targetID: target.id, weaponName: targetWeaponName})
            }
            data.weapons = weapons
            break

        case "growth":
        case "shrink":
            data.change = Number(html.find(`#sizeAmount`)[0].value)
            break

        case "sloth":
            data.change = 0.5
            data.duration = 1
            break

        case "speed":
            data.change = 2
            data.quickness = html.find(`#quickness`)[0].checked
            break

        case "burden-tes":
            data.change = Number(html.find(`#die_steps`)[0].value)
            if (data.change === 0) {
                ui.notifications.warn(game.i18n.localize("SWIM.notififaction.enterNumberUnequalZero"))
                return
            }
            data.durationNoCombat = concentration ? 20 * 60 : 10 * 60
            break

        case "beastFriend":
        case "invisibility":
        case "arcaneProtection":
        case "burrow":
        case "darksight":
        case "conceal":
        case "detect":
        case "disguise":
        case "elementalManipulation":
        case "empathy":
        case "environmentalProtection":
        case "farsight":
        case "fly":
        case "intangibility":
        case "light":
        case "mindLink":
        case "puppet":
        case "relief":
        case "slumber":
        case "silence":
        case "speakLanguage":
        case "wallWalker":
        case "warriorsGift":
        case "blind":
            data.degree = html.find(`#raise`)[0].checked ? "raise" : "success"
            if (["beastFriend", "invisibility", "relief"].includes(selectedPower)) {
                data.caster = game.canvas.tokens.controlled[0].name
            }
            if (selectedPower === "burrow") data.strong = html.find(`#strong`)[0].checked
            if (selectedPower === "damageField") data.damage = html.find(`#damage`)[0].checked
            if (selectedPower === "conceal") data.strong = html.find(`#strong`)[0].checked
            if (selectedPower === "deflection") data.deflectionType = html.find(`#deflectionOption`)[0].value
            break

        case "confusion":
        case "damageField":
        case "deflection":
            break

        case "other":
            data.degree = html.find(`#raise`)[0].checked ? "raise" : "success"
            data.durationRounds = noPP ? Number(999999999999999) : Number(html.find(`#duration_rounds`)[0].value)
            data.durationSeconds = noPP ? Number(999999999999999) : (Number(html.find(`#duration_minutes`)[0].value) / 60)
            if (data.durationRounds === 0 && data.durationSeconds > 0) {
                data.durationRounds = data.durationSeconds * 6
            } else if (data.durationSeconds === 0 && data.durationRounds > 0) {
                data.durationSeconds = undefined
            } else if (data.durationRounds === 0 && data.durationSeconds === 0) {
                data.durationRounds = concentration ? 10 : 5
            }
            break
    }

    // Flag for caster penalty effect
    if (!casterIsTarget && !(["confusion", "blind", "relief", "sloth"].includes(selectedPower))) {
        data.addCasterPenalty = true
    }

    data.power = power
    //warpgate.event.notify("SWIM.effectBuilder", data)
    await socket.executeAsGM(effect_builder_gm, data)
}

// ============================================================================
// PART 2: GM-Side Effect Creation
// ============================================================================

export async function effect_builder_gm(data) {
    const noPP = game.settings.get("swim", "noPowerPoints")
    const type = data.type
    const casterID = data.casterID
    const playerScene = game.scenes.get(data.sceneID)
    const caster = playerScene.tokens.get(casterID)
    const casterIsTarget = data.targetIDs.find(t => t === casterID)

    // Find the power being used
    const power = data.powerID
        ? caster.actor.items.find(p => p.id === data.powerID)
        : caster.actor.items.find(p => p.name.toLowerCase().includes(game.i18n.localize(`SWIM.power-${type}`).toLowerCase()) && p.type === "power")

    // ========================================================================
    // Calculate additional changes for caster When caster is also a target
    // and noPP is true, we need to apply the spellcasting penalty
    // (-1 to skill) and maintainedPowers counter (mainly for Hellfrost).
    // ========================================================================
    let additionalChange = []
    if (casterIsTarget && noPP && !(["blind","confusion","sloth"].includes(type))) {
        if (power) {
            const skillName = power.system.actions.skill
            additionalChange.push({
                key: `@Skill{${skillName}}[system.die.modifier]`,
                mode: 2,
                priority: undefined,
                value: -1
            })
            if (caster.actor.system.additionalStats?.maintainedPowers) {
                additionalChange.push({
                    key: `system.additionalStats.maintainedPowers.value`,
                    mode: 2,
                    priority: undefined,
                    value: 1
                })
            }
        } else if (caster.actor.system.additionalStats?.maintainedPowers) {
            additionalChange.push({
                key: `system.additionalStats.maintainedPowers.value`,
                mode: 2,
                priority: undefined,
                value: 1
            })
        }
    }

    // Common flags for all effects
    const commonFlags = {
        maintainedPower: true,
        maintaining: game.i18n.localize(`SWIM.power-${type}`),
        targets: data.targetIDs,
        maintenanceID: data.maintenanceID,
        owner: false,
        powerID: power?.id,
        affected: true
    }

    // Duration helper
    const getDuration = (target, baseDur) => {
        if (power || noPP) {
            return {
                rounds: Number(999999999999999),
                seconds: Number(999999999999999),
                startRound: target.combatant != null ? game.combat.round : 0
            }
        }
        return {
            rounds: baseDur,
            startRound: target.combatant != null ? game.combat.round : 0
        }
    }

    // ========================================================================
    // Icon mapping
    // ========================================================================
    const ICONS = {
        boost: "modules/swim/assets/icons/effects/m-boost.svg",
        lower: "modules/swim/assets/icons/effects/m-lower.svg",
        protection: "modules/swim/assets/icons/effects/m-protection.svg",
        smite: "modules/swim/assets/icons/effects/m-smite.svg",
        growth: "modules/swim/assets/icons/effects/m-growth.svg",
        shrink: "modules/swim/assets/icons/effects/m-shrink.svg",
        sloth: "modules/swim/assets/icons/effects/m-sloth.svg",
        speed: "modules/swim/assets/icons/effects/m-speed.svg",
        quickness: "modules/swim/assets/icons/effects/m-quickness.svg",
        burden: "modules/swim/assets/icons/effects/m-burden.svg",
        easeBurden: "modules/swim/assets/icons/effects/m-ease_burden.svg",
        beastFriend: "modules/swim/assets/icons/effects/m-beastFriend.svg",
        confusion: "modules/swim/assets/icons/effects/m-confusion.svg",
        deflection: "modules/swim/assets/icons/effects/m-deflection.svg",
        arcaneProtection: "modules/swim/assets/icons/effects/m-arcaneProtection.svg",
        burrow: "modules/swim/assets/icons/effects/m-burrow.svg",
        damageField: "modules/swim/assets/icons/effects/m-damageField.svg",
        darksight: "modules/swim/assets/icons/effects/m-darksight.svg",
        concealArcana: "modules/swim/assets/icons/effects/m-concealArcana.svg",
        detectArcana: "modules/swim/assets/icons/effects/m-detectArcana.svg",
        disguise: "modules/swim/assets/icons/effects/m-disguise.svg",
        elementalManipulation: "modules/swim/assets/icons/effects/m-elementalManipulation.svg",
        empathy: "modules/swim/assets/icons/effects/m-empathy.svg",
        environmentalProtection: "modules/swim/assets/icons/effects/m-environmentalProtection.svg",
        farsight: "modules/swim/assets/icons/effects/m-farsight.svg",
        fly: "modules/swim/assets/icons/effects/m-fly.svg",
        intangibility: "modules/swim/assets/icons/effects/m-intangibility.svg",
        invisibility: "modules/succ/assets/icons/m-invisible.svg",
        light: "modules/swim/assets/icons/effects/m-light.svg",
        mindLink: "modules/swim/assets/icons/effects/m-mindLink.svg",
        puppet: "modules/swim/assets/icons/effects/m-puppet.svg",
        relief: "modules/swim/assets/icons/effects/m-reliefNumb.svg",
        slumber: "modules/swim/assets/icons/effects/m-slumber.svg",
        silence: "modules/swim/assets/icons/effects/m-silence.svg",
        speakLanguage: "modules/swim/assets/icons/effects/m-speakLanguage.svg",
        wallWalker: "modules/swim/assets/icons/effects/m-wallWalker.svg",
        warriorsGift: "modules/swim/assets/icons/effects/m-warriorsGift.svg",
        blind: "modules/swim/assets/icons/effects/m-blind.svg"
    }

    const getIcon = (type) => data.icon || ICONS[type] || false

    // ========================================================================
    // Effect Name Generator
    // ========================================================================
    const getEffectName = (type, data) => {
        switch (type) {
            case "protection":
                return `${game.i18n.localize("SWIM.power-protection")} (${game.i18n.localize(`SWIM.gameTerm-${data.protectionType}`).toLowerCase()})`
            case "smite":
                return `${game.i18n.localize("SWIM.power-smite")} (${data.bonus > 0 ? '+' : ''}${data.bonus})`
            case "burden":
                return data.change > 0
                    ? game.i18n.localize("SWIM.power-easeBurden-tes")
                    : game.i18n.localize("SWIM.power-burden-tes")
            case "invisibility":
                return data.degree === "raise"
                    ? `${game.i18n.localize("SWIM.power-invisibility")} (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                    : game.i18n.localize("SWIM.power-invisibility")
            case "beastFriend":
                return `${data.caster}'s ${game.i18n.localize("SWIM.power-beastFriend")}${data.degree === "raise" ? ` (${game.i18n.localize("SWIM.raise").toLowerCase()})` : ''}`
            case "burrow": {
                let label = game.i18n.localize("SWIM.power-burrow")
                if (data.degree === "raise") label += ` (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                if (data.strong) label += ` (${game.i18n.localize("SWIM.modifierStrong").toLowerCase()})`
                return label
            }
            case "concealArcana":
                return data.strong
                    ? `${game.i18n.localize("SWIM.power-concealArcana")} (${game.i18n.localize("SWIM.modifierStrong").toLowerCase()})`
                    : game.i18n.localize("SWIM.power-concealArcana")
            case "deflection":
                return `${game.i18n.localize("SWIM.power-deflection")} (${game.i18n.localize(`SWIM.gameTerm-${data.deflectionType}`).toLowerCase()})`
            case "fly":
                return data.degree === "raise"
                    ? `${game.i18n.localize("SWADE.Flying")} (24\")`
                    : `${game.i18n.localize("SWADE.Flying")} (12\")`
            case "relief":
                return data.degree === "raise"
                    ? `${game.i18n.localize("SWIM.power-relief")}: ${game.i18n.localize("SWIM.power-relief_numb")} (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                    : `${game.i18n.localize("SWIM.power-relief")}: ${game.i18n.localize("SWIM.power-relief_numb")}`
            case "light":
                return data.degree === "raise"
                    ? `${game.i18n.localize("SWIM.power-light")} (${game.i18n.localize("SWIM.beam")})`
                    : game.i18n.localize("SWIM.power-light")
            case "blind":
                return data.degree === "raise"
                    ? `${game.i18n.localize("SWIM.power-blind")} (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                    : game.i18n.localize("SWIM.power-blind")
            case "damageField":
                return data.damage
                    ? `${game.i18n.localize("SWIM.power-damageField")} (2d6)`
                    : `${game.i18n.localize("SWIM.power-damageField")} (2d4)`
            case "puppet":
                return `${data.casterName}'s ${game.i18n.localize("SWIM.power-puppet")}${data.degree === "raise" ? ` (${game.i18n.localize("SWIM.raise").toLowerCase()})` : ''}`
            case "other":
                return data.degree === "raise"
                    ? `${power.name} (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                    : power.name
            default:
                const raisePowers = ["arcaneProtection", "darksight", "detectArcana", "disguise",
                    "elementalManipulation", "empathy", "environmentalProtection", "farsight",
                    "mindLink", "silence", "speakLanguage", "wallWalker", "warriorsGift"]
                if (raisePowers.includes(type)) {
                    return data.degree === "raise"
                        ? `${game.i18n.localize(`SWIM.power-${type}`)} (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                        : game.i18n.localize(`SWIM.power-${type}`)
                }
                return game.i18n.localize(`SWIM.power-${type}`)
        }
    }

    // ========================================================================
    // Expiration Times
    // ========================================================================
    const EXPIRATION = {
        relief: 2, confusion: 2, sloth: 3, growth: 3, shrink: 3, speed: 3,
        burden: 3, beastFriend: 3, invisibility: 3, deflection: 3, arcaneProtection: 3,
        burrow: 3, damageField: 3, darksight: 3, concealArcana: 3, detectArcana: 3,
        disguise: 3, elementalManipulation: 3, empathy: 3, environmentalProtection: 3,
        farsight: 3, fly: 3, intangibility: 3, light: 3, mindLink: 3,
        puppet: 3, slumber: 3, silence: 3, speakLanguage: 3, wallWalker: 3, warriorsGift: 3, blind: 3
    }

    // ========================================================================
    // Helper: Create effect with proper handling of additionalChanges
    // ========================================================================
    const createEffect = async (targetID, effectData) => {
        const target = playerScene.tokens.get(targetID)
        const isCaster = targetID === casterID

        if (isCaster && additionalChange.length > 0) {
            effectData.changes = (effectData.changes || []).concat(additionalChange)
        }

        if (isCaster && noPP && effectData.duration) {
            effectData.duration.rounds = Number(999999999999999)
            if (effectData.duration.seconds !== undefined) {
                effectData.duration.seconds = Number(999999999999999)
            }
        }

        await target.actor.createEmbeddedDocuments('ActiveEffect', [effectData])
    }

    // ========================================================================
    // Power Type Handler with Dispatch pattern
    // ========================================================================
    const handlers = {
        // BOOST
        async boost() {
            for (const target of data.traits) {
                const targetToken = playerScene.tokens.get(target.targetID)
                const isCaster = target.targetID === casterID
                const baseDur = data.duration || 5
                const duration = getDuration(targetToken, baseDur)

                let keyPath, traitName
                const traitValue = target.traitName

                if (["agility", "smarts", "spirit", "strength", "vigor"].includes(traitValue)) {
                    keyPath = `system.attributes.${traitValue}.die.sides`
                    traitName = game.i18n.localize(`SWADE.Attr${traitValue.charAt(0).toUpperCase()}${traitValue.slice(1)}`)
                } else {
                    const skill = targetToken.actor.items.find(s => s.name.toLowerCase() === traitValue.toLowerCase())
                    keyPath = `@Skill{${skill?.name}}[system.die.sides]`
                    traitName = skill?.name || traitValue
                }

                const valueMod = data.degree === "raise" ? 4 : 2

                let aeData = {
                    changes: [{
                        key: keyPath,
                        mode: 2,
                        priority: undefined,
                        value: valueMod
                    }],
                    icon: data.icon || ICONS.boost,
                    name: `${game.i18n.localize("SWIM.power-boostTrait")} (${traitName})`,
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }
                await createEffect(target.targetID, aeData)
            }
        },

        // LOWER
        async lower() {
            for (const target of data.traits) {
                const targetToken = playerScene.tokens.get(target.targetID)
                const isCaster = target.targetID === casterID
                const baseDur = data.duration || 5
                const duration = getDuration(targetToken, baseDur)

                let keyPath, traitName
                const traitValue = target.traitName

                if (["agility", "smarts", "spirit", "strength", "vigor"].includes(traitValue)) {
                    keyPath = `system.attributes.${traitValue}.die.sides`
                    traitName = game.i18n.localize(`SWADE.Attr${traitValue.charAt(0).toUpperCase()}${traitValue.slice(1)}`)
                } else {
                    const skill = targetToken.actor.items.find(s => s.name.toLowerCase() === traitValue.toLowerCase())
                    keyPath = `@Skill{${skill?.name}}[system.die.sides]`
                    traitName = skill?.name || traitValue
                }

                const valueMod = data.degree === "raise" ? -4 : -2

                let aeData = {
                    changes: [{
                        key: keyPath,
                        mode: 2,
                        priority: undefined,
                        value: valueMod
                    }],
                    icon: data.icon || ICONS.lower,
                    name: `${game.i18n.localize("SWIM.power-lowerTrait")} (${traitName})`,
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }
                await createEffect(target.targetID, aeData)
            }
        },

        // PROTECTION
        async protection() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID
                const baseDur = data.duration || 5
                const duration = getDuration(target, baseDur)

                const type = data.protectionType.charAt(0).toUpperCase() + data.protectionType.slice(1)
                const isArmor = type === "Armor"

                let aeData = {
                    changes: [{
                        key: isArmor ? `system.stats.toughness.armor` : `system.stats.toughness.value`,
                        mode: 2,
                        priority: undefined,
                        value: data.bonus
                    }],
                    icon: data.icon || ICONS.protection,
                    name: `${game.i18n.localize("SWIM.power-protection")} (${type.toLowerCase()})`,
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }
                await createEffect(targetID, aeData)
            }
        },

        // SMITE
        async smite() {
            for (const target of data.weapons) {
                const targetToken = playerScene.tokens.get(target.targetID)
                const isCaster = target.targetID === casterID
                const baseDur = data.duration || 5
                const duration = getDuration(targetToken, baseDur)

                let aeData = {
                    changes: [{
                        key: `@Weapon{${target.weaponName}}[system.actions.dmgMod]`,
                        mode: 2,
                        priority: undefined,
                        value: data.bonus
                    }],
                    icon: data.icon || ICONS.smite,
                    name: `${game.i18n.localize("SWIM.power-smite")} (${target.weaponName})`,
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }
                await createEffect(target.targetID, aeData)
            }
        },

        // GROWTH
        async growth() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID
                const baseDur = data.duration || 5
                const duration = getDuration(target, baseDur)
                const change = data.change

                let aeData = {
                    changes: [],
                    icon: data.icon || ICONS.growth,
                    name: game.i18n.localize("SWIM.power-growth"),
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }

                const targetStr = target.actor.system.attributes.strength.die.sides + change * 2
                if (targetStr <= 12) {
                    aeData.changes.push({
                        key: `system.attributes.strength.die.sides`,
                        mode: 2,
                        value: change * 2
                    })
                } else {
                    const toMax = 12 - target.actor.system.attributes.strength.die.sides
                    const rest = change - (toMax / 2)
                    aeData.changes.push({
                        key: `system.attributes.strength.die.sides`,
                        mode: 2,
                        value: toMax
                    })
                    aeData.changes.push({
                        key: `system.attributes.strength.die.modifier`,
                        mode: 2,
                        value: rest
                    })
                }

                aeData.changes.push({
                    key: `system.stats.size`,
                    mode: 2,
                    value: change
                })

                if (target.actor.system.details.autoCalcToughness === false) {
                    aeData.changes.push({
                        key: `system.stats.toughness.value`,
                        mode: 2,
                        value: change
                    })
                }

                await createEffect(targetID, aeData)
            }
        },

        // RELIEF
        async relief() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID

                const duration = {
                    seconds: Number(3600),
                    rounds: Number(600),
                    startRound: target.combatant != null ? game.combat.round : 0
                }

                let aeData = {
                    changes: [{
                        key: `system.woundsOrFatigue.ignored`,
                        mode: 2,
                        value: data.degree === "raise" ? 2 : 1
                    }],
                    icon: data.icon || ICONS.relief,
                    name: data.degree === "raise"
                        ? `${game.i18n.localize("SWIM.power-relief")}: ${game.i18n.localize("SWIM.power-relief_numb")} (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                        : `${game.i18n.localize("SWIM.power-relief")}: ${game.i18n.localize("SWIM.power-relief_numb")}`,
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 2 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true,
                            maintainedPower: false
                        }
                    }
                }
                await createEffect(targetID, aeData)
            }
        },

        // SHRINK
        async shrink() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID
                const baseDur = data.duration || 5
                const duration = getDuration(target, baseDur)
                const change = data.change

                let aeData = {
                    changes: [],
                    icon: data.icon || ICONS.shrink,
                    name: game.i18n.localize("SWIM.power-shrink"),
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
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
                        value: toMin
                    })
                } else {
                    aeData.changes.push({
                        key: `system.attributes.strength.die.sides`,
                        mode: 2,
                        value: change * 2
                    })
                }

                aeData.changes.push({
                    key: `system.stats.size`,
                    mode: 2,
                    value: change
                })

                if (target.actor.system.details.autoCalcToughness === false) {
                    aeData.changes.push({
                        key: `system.stats.toughness.value`,
                        mode: 2,
                        value: change
                    })
                }

                await createEffect(targetID, aeData)
            }
        },

        // SPEED
        async speed() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID
                const baseDur = data.duration || 5
                const duration = getDuration(target, baseDur)
                const change = data.change

                let aeData = {
                    changes: [{
                        key: `system.stats.speed.value`,
                        mode: 5,
                        value: target.actor.system.stats.speed.value * change
                    }],
                    icon: data.quickness ? (data.icon || ICONS.quickness) : (data.icon || ICONS.speed),
                    name: data.quickness
                        ? game.i18n.localize("SWIM.power-speedQuickness")
                        : game.i18n.localize("SWIM.power-speed"),
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }
                await createEffect(targetID, aeData)
            }
        },

        // SLOTH
        async sloth() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const change = data.change || 0.5

                let duration = {}
                if (target.combatant != null) {
                    duration = {
                        rounds: 0,
                        startRound: game.combat.round,
                        startTurn: 0,
                        turns: 1
                    }
                }

                let aeData = {
                    changes: [{
                        key: `system.stats.speed.value`,
                        mode: 5,
                        value: Math.round(target.actor.system.stats.speed.value * change)
                    }],
                    icon: data.icon || ICONS.sloth,
                    name: game.i18n.localize("SWIM.power-sloth"),
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            maintainedPower: false
                        }
                    }
                }
                await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData])
            }
        },

        // BURDEN / EASE BURDEN
        async burden() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID
                const change = data.change

                const duration = {
                    rounds: noPP ? Number(999999999999999) : (data.duration || 5),
                    seconds: noPP ? Number(999999999999999) : data.durationNoCombat,
                    startRound: target.combatant != null ? game.combat.round : 0
                }

                let aeData = {
                    changes: [{
                        key: `system.attributes.strength.encumbranceSteps`,
                        mode: 2,
                        value: change
                    }],
                    icon: change > 0 ? ICONS.easeBurden : (data.icon || ICONS.burden),
                    name: change > 0
                        ? game.i18n.localize("SWIM.power-easeBurden-tes")
                        : game.i18n.localize("SWIM.power-burden-tes"),
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }
                await createEffect(targetID, aeData)
            }
        },

        // BEAST FRIEND
        async beastFriend() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID

                const duration = {
                    seconds: noPP ? Number(999999999999999) : data.durationNoCombat,
                    rounds: noPP ? Number(999999999999999) : (data.duration || 5) / 6,
                    startRound: target.combatant != null ? game.combat.round : 0
                }

                let aeData = {
                    changes: [],
                    icon: data.icon || ICONS.beastFriend,
                    name: data.degree === "raise"
                        ? `${data.caster}'s ${game.i18n.localize("SWIM.power-beastFriend")} (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                        : `${data.caster}'s ${game.i18n.localize("SWIM.power-beastFriend")}`,
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }
                await createEffect(targetID, aeData)
            }
        },

        // CONFUSION
        async confusion() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)

                let duration = {}
                if (target.combatant != null) {
                    duration = {
                        rounds: 0,
                        startRound: game.combat.round,
                        startTurn: 0,
                        turns: 1
                    }
                }

                let aeData = {
                    changes: [
                        {key: `system.status.isDistracted`, mode: 5, value: true},
                        {key: `system.status.isVulnerable`, mode: 5, value: true}
                    ],
                    icon: data.icon || ICONS.confusion,
                    name: game.i18n.localize("SWIM.power-confusion"),
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 2 },
                        swim: {
                            ...commonFlags,
                            maintainedPower: false
                        }
                    }
                }
                await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData])
            }
        },

        // GENERIC HANDLER - For all other power types
        async generic() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID
                const baseDur = data.duration || 5

                let duration = getDuration(target, baseDur)

                if (data.durationNoCombat !== undefined) {
                    duration.seconds = noPP ? Number(999999999999999) : data.durationNoCombat
                    duration.rounds = noPP ? Number(999999999999999) : (data.duration || baseDur) / 6
                }
                if (data.durationRounds !== undefined || data.durationSeconds !== undefined) {
                    duration.rounds = noPP ? Number(999999999999999) : data.durationRounds
                    duration.seconds = noPP ? Number(999999999999999) : data.durationSeconds
                }

                let aeData = {
                    changes: [],
                    icon: getIcon(type),
                    name: getEffectName(type, data),
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: EXPIRATION[type] || 3 },
                        succ: { updatedAE: true },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }

                // Special cases
                if (type === "damageField") {
                    aeData.name = data.damage
                        ? `${game.i18n.localize("SWIM.power-damageField")} (2d6)`
                        : `${game.i18n.localize("SWIM.power-damageField")} (2d4)`
                }
                if (type === "darksight") {
                    aeData.changes = [
                        {"key": "ATL.sight.range", "value": "1000", "mode": 2, "priority": null},
                        {"key": "ATL.sight.visionMode", "value": "darkvision", "mode": 5, "priority": null}
                    ]
                }
                if (type === "puppet") {
                    aeData.name = `${data.casterName}'s ${game.i18n.localize("SWIM.power-puppet")}${data.degree === "raise" ? ` (${game.i18n.localize("SWIM.raise").toLowerCase()})` : ''}`
                }
                if (type === "other") {
                    if (isCaster && additionalChange.length > 0) {
                        aeData.changes.push(additionalChange[0])
                        if (additionalChange[1]) aeData.changes.push(additionalChange[1])
                    }
                }
                if (type === "light") {
                    const brightness = data.degree === "raise" ? "5" : "3"
                    const angle = data.degree === "raise" ? "52.5" : "360"
                    aeData.changes = [
                        {"key": "ATL.light.bright", "value": brightness, "mode": 5, "priority": null},
                        {"key": "ATL.light.animation", "value": "{type: \"sunburst\", speed: 1, intensity: 1}", "mode": 5, "priority": null},
                        {"key": "ATL.light.color", "value": "#fffa61", "mode": 5, "priority": null},
                        {"key": "ATL.light.alpha", "value": "0.25", "mode": 5, "priority": null},
                        {"key": "ATL.light.angle", "value": angle, "mode": 5, "priority": null}
                    ]
                }

                await createEffect(targetID, aeData)
            }
        }
    }

    // EXECUTE THE APPROPRIATE HANDLER
    const handler = handlers[type] || handlers.generic
    await handler.call(handlers)

    // CREATE CASTER PENALTY EFFECT (if needed)
    if (data.addCasterPenalty && power) {
        const skillName = power.system.actions.skill
        const durationRounds = data.durationRounds || (data.duration ? data.duration : 5)
        const durationSeconds = data.durationSeconds

        let aeData = {
            changes: [],
            icon: power.img,
            name: type === "other"
                ? game.i18n.format("SWIM.label-maintaining", {powerName: power.name})
                : game.i18n.format("SWIM.label-maintaining", {powerName: game.i18n.localize(`SWIM.power-${type}`)}),
            duration: {
                seconds: noPP ? Number(999999999999999) : durationSeconds,
                startRound: caster.combatant != null ? game.combat.round : 0,
                rounds: noPP ? Number(999999999999999) : durationRounds
            },
            description: power ? power.system.description : "",
            flags: {
                swade: { expiration: 3 },
                swim: {
                    ...commonFlags,
                    owner: true,
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

        if (caster.actor.system.additionalStats?.maintainedPowers) {
            aeData.changes.push({
                key: `system.additionalStats.maintainedPowers.value`,
                mode: 2,
                priority: undefined,
                value: 1
            })
        }

        await caster.actor.createEmbeddedDocuments('ActiveEffect', [aeData])
    }
}

// ============================================================================
// PART 3: Helper Functions
// ============================================================================

function getDialogContent(token, selectedPower, allHTML, targets, noPP, item) {
    let content

    if (selectedPower === "boost" || selectedPower === "lower") {
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderBoostLower", {allHTML: allHTML})
    } else if (selectedPower === "protection") {
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderProtection", {amountText: game.i18n.localize("SUCC.dialogue.amount_to_increase")})
    } else if (selectedPower === "smite") {
        let smiteHTML = []
        for (let target of targets) {
            const targetWeapons = target.actor.items.filter(w => w.type === "weapon" && w.system.quantity >= 1)
            if (targetWeapons.length >= 1) {
                let weaponOptions = ''
                for (let weapon of targetWeapons) {
                    weaponOptions += `<option value="${weapon.name}">${weapon.name}</option>`
                }
                let html = `
                                <div class='form-group'>
                                    <label for='${target.id}'><p>${game.i18n.localize("SWIM.dialogue-powerEffectBuilderSmiteWeaponOf")} ${target.name}:</p></label>
                                    <select id='${target.id}'>${weaponOptions}</select>
                                </div>
                            `
                smiteHTML += html
            }
        }
        content = game.i18n.format("SWIM.dialogue-powerEffectBuilderSmite", {
            allHTML: smiteHTML,
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
        let powerOptions = ''
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
    function createOptions(optionsList, defaultValue) {
        return optionsList.map(option => {
            const selected = option.value === defaultValue ? 'selected="selected"' : ''
            const localizedLabel = option.label.map(label => game.i18n.localize(label)).join(' ')
            return `<option value="${option.value}" ${selected}>${localizedLabel}</option>`
        }).join('')
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
    ]

    const traitOptionsList = [
        {value: 'agility', label: ['SUCC.dialogue.attribute', 'SWADE.AttrAgi']},
        {value: 'smarts', label: ['SUCC.dialogue.attribute', 'SWADE.AttrSma']},
        {value: 'spirit', label: ['SUCC.dialogue.attribute', 'SWADE.AttrSpr']},
        {value: 'strength', label: ['SUCC.dialogue.attribute', 'SWADE.AttrStr']},
        {value: 'vigor', label: ['SUCC.dialogue.attribute', 'SWADE.AttrVig']}
    ]

    const options = createOptions(optionsList, defaultPower)
    const traitOptions = createOptions(traitOptionsList, defaultPower)

    let targetIDs = []
    let allHTML = ''

    for (const target of targets) {
        targetIDs.push(target.id)
        let targetSkills = target.actor.items.filter(s => s.type === "skill")

        if (targetSkills.length >= 1) {
            targetSkills.sort((a, b) => {
                const textA = a.name.toUpperCase()
                const textB = b.name.toUpperCase()
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0
            })

            const skillOptions = targetSkills.map(skill =>
                `<option value="${skill.name}">${game.i18n.localize("SUCC.dialogue.skill")} ${skill.name}</option>`
            ).join('')

            const targetOptions = traitOptions + skillOptions
            const html = `
            <div class='form-group'>
                <label for='${target.id}'><p>${game.i18n.localize("SWIM.dialogue-powerEffectBuilderAffectedTraitOf")} (${target.name}):</p></label>
                <select id='${target.id}'>${targetOptions}</select>
            </div>
        `
            allHTML += html
        } else {
            const html = `
            <div class='form-group'>
                <label for='${target.id}'><p>${game.i18n.localize("SWIM.dialogue-powerEffectBuilderAffectedTraitOf")} (${target.name}):</p></label>
                <select id='${target.id}'>${traitOptions}</select>
            </div>
        `
            allHTML += html
        }
    }

    return { options, traitOptions, allHTML, targetIDs }
}