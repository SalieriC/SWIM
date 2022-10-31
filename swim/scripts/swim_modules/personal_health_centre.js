/*******************************************
 * Personal Health Centre
 * // v.6.2.8
 * By SalieriC#8263; fixing bugs supported by FloRad#2142. Potion usage inspired by grendel111111#1603; asynchronous playback of sfx by Freeze#2689.
 ******************************************/
export async function personal_health_centre_script() {
    const { speaker, _, __, token } = await swim.get_macro_variables()
    const target = Array.from(game.user.targets)[0]
    
    // Check if a token is selected.
    if (!token || canvas.tokens.controlled.length > 1 || game.user.targets.size > 1) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectOrTargetOneOrMoreTokens"));
        return;
    }
    const officialClass = await swim.get_official_class()

    if (game.user.targets.size === 1 && (token.id != target.id)) {
        new Dialog({
            title: game.i18n.localize("SWIM.dialogue-healOther"),
            content: game.i18n.format("SWIM.dialogue.healOtherContent", {officalClass : officialClass}),
            buttons: {
                one: {
                    label: game.i18n.localize("SWIM.dialogue-healTarget"),
                    callback: async (_) => {
                        healOther(token, target)
                    }
                },
                two: {
                    label: game.i18n.localize("SWIM.dialogue-cancel"),
                }
            }
        }).render(true)
    } else if (token && canvas.tokens.controlled.length === 1) {
        // Heal Self
        new Dialog({
            title: game.i18n.localize("SWIM.dialogue-healSelf"),
            content: game.i18n.format("SWIM.dialogue.healSelfContent", {officialClass : officialClass}),
            buttons: {
                one: {
                    label: game.i18n.localize("SWIM.dialogue-healMyself"),
                    callback: async (_) => {
                        healSelf(token, speaker)
                    }
                },
                two: {
                    label: game.i18n.localize("SWIM.dialogue-cancel"),
                }
            }
        }).render(true)
    }
}

async function healOther(token, target) {
    // The non-GM part of the heal other functionality
    const officialClass = await swim.get_official_class()
    let data
    //Translate ToDo
    const methodOptions = `<option value="heal">Heal Wound(s)</option><option value="relief">Remove Fatigue</option>`
    new Dialog({
        title: game.i18n.localize("SWIM.dialogue-healOther"),
        content: game.i18n.format("SWIM.dialogue.healOtherSelect", {officalClass : officialClass})+`
        <div class="form-group">
                <label for="method">Method: </label>
                <select id="method">${methodOptions}</select>
            </div>
            <div class="form-group">
                <label for="combatHealing">Healing Skill in combat: </label>
                <input id="combatHealing" name="combatHealingBox" type="checkbox"></input>
            </div>
         </div>`,
        buttons: {
            one: {
                label: game.i18n.localize("SWIM.gameTerm-CritFail"),
                callback: async (html) => {
                    const method = html.find(`#method`)[0].value;
                    const combatHealing = html.find(`#combatHealing`)[0].checked;
                    data = {
                        targetID: target.id,
                        tokenID: token.id,
                        rating: "critFail",
                        method: method,
                        combatHealing: combatHealing
                    }
                    warpgate.event.notify("SWIM.healOther", data)
                }
            },
            two: {
                label: game.i18n.localize("SWIM.gameTerm-Failure"),
                callback: () => {
                    ui.notifications.notify(game.i18n.localize("SWIM.notification.nothingToDo"));
                }
            },
            three: {
                label: game.i18n.localize("SWIM.gameTerm-Success"),
                callback: async (html) => {
                    const method = html.find(`#method`)[0].value;
                    const combatHealing = html.find(`#combatHealing`)[0].checked;
                    data = {
                        targetID: target.id,
                        tokenID: token.id,
                        rating: "success",
                        method: method,
                        combatHealing: combatHealing
                    }
                    warpgate.event.notify("SWIM.healOther", data)
                }
            },
            four: {
                label: game.i18n.localize("SWIM.gameTerm-Raise"),
                callback: async (html) => {
                    const method = html.find(`#method`)[0].value;
                    const combatHealing = html.find(`#combatHealing`)[0].checked;
                    data = {
                        targetID: target.id,
                        tokenID: token.id,
                        rating: "raise",
                        method: method,
                        combatHealing: combatHealing
                    }
                    warpgate.event.notify("SWIM.healOther", data)
                }
            }
        }
    }).render(true)
}

export async function heal_other_gm(data) {
    const targetID = data.targetID
    const target = canvas.tokens.get(targetID)
    const targetActor = target.actor
    const targetWounds = targetActor.system.wounds.value
    const targetWoundsMax = targetActor.system.wounds.max
    const targetFatigue = targetActor.system.fatigue.value
    const targetInc = await succ.check_status(targetActor, 'incapacitated')
    const targetBleedOut = await succ.check_status(targetActor, 'bleeding-out')
    const tokenID = data.tokenID
    const token = canvas.tokens.get(tokenID)
    const tokenActor = token.actor
    const rating = data.rating
    const method = data.method
    const combatHealing = data.combatHealing
    const { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(targetActor)
    let amount
    let chatContent

    if (rating === "critFail") {
        //Apply another wound or cancel
        if (method === "relief") {
            return
        } else if (method === "heal") {
            //Apply another Wound
            if (targetWounds === targetWoundsMax) {
                //Make INC!
                if (targetInc) {
                    await swim.play_sfx(deathSFX)
                    await succ.apply_status(targetActor, 'bleeding-out', true, true)
                    if (await succ.check_status(token, 'incapacitated') === true) {
                        const incCondition = await succ.get_condition_from(token.actor, 'incapacitated')
                        if (incCondition.flags?.core?.overlay === true) {
                            incCondition.setFlag('succ', 'updatedAE', true)
                            await incCondition.update({"flags.core.overlay": false})
                        }
                    }
                    chatContent = game.i18n.format("SWIM.chatMessage-healOtherCritFailAndBleedOut", {tokenName : token.name, targetName : target.name})
                } else {
                    await succ.apply_status(targetActor, 'incapacitated', true, true)
                    await swim.play_sfx(deathSFX)
                    chatContent = game.i18n.format("SWIM.chatMessage-healOtherCritFailAndIncap", {tokenName : token.name, targetName : target.name})
                }
                await createchatMessage()
            } else {
                amount = 1
                await apply()
                chatContent = game.i18n.format("SWIM.chatMessage-healOtherCritFailAndWound", {tokenName : token.name, targetName : target.name})
                await createchatMessage()
            }
        }
    } else if (rating === "success") {
        //Heal one Wound or Fatigue
        if (method === "relief") {
            amount = 1
            await apply()
            chatContent = game.i18n.format("SWIM.chatMessage-healOtherRelief", {tokenName : token.name, targetName : target.name})
            await createchatMessage()
            await succ.toggle_status(targetActor, 'shaken', false)
        } else if (method === "heal" && (targetInc === true || targetBleedOut === true || (targetInc === true && targetBleedOut === true))) {
            // Remove Bleeding out/Incap before any wounds
            if (targetBleedOut) {
                await succ.toggle_status(targetActor, 'bleeding-out', false)
                if (await succ.check_status(token, 'incapacitated') === true) {
                    const incCondition = await succ.get_condition_from(token.actor, 'incapacitated')
                    if (incCondition.flags?.core?.overlay === false) {
                        incCondition.setFlag('succ', 'updatedAE', true)
                        await incCondition.update({"flags.core.overlay": true})
                    }
                }
                chatContent = game.i18n.format("SWIM.chatMessage-healOtherCureBleetOut", {tokenName : token.name, targetName : target.name})
            } else if (targetInc) {
                await succ.toggle_status(targetActor, 'incapacitated', false)
                chatContent = game.i18n.format("SWIM.chatMessage-healOtherCureIncap", {tokenName : token.name, targetName : target.name}) //Incapacitation: Healing at least one Wound on an Incapacitated patient removes that state (and restores consciousness if he was knocked out). -> so a Wound is healed in any case(?).
                if (combatHealing === false) {
                    amount = 1
                    await removeInjury(targetActor, amount)
                    await apply()
                }
            }
            await createchatMessage()
        } else if (method === "heal") {
            amount = 1
            await removeInjury(targetActor, amount)
            await apply()
            chatContent = game.i18n.format("SWIM.chatMessage-healOtherSuccess", {tokenName : token.name, targetName : target.name})
            await createchatMessage()
        }
    } else if (rating === "raise") {
        //Heal two Wounds or remove two Fatigue
        if (method === "relief") {
            //Heal two Fatigue and remove Shaken and Stunned
            amount = 2
            await apply()
            chatContent = game.i18n.format("SWIM.chatMessage-healOtherRaiseRelief", {tokenName : token.name, targetName : target.name})
            await createchatMessage()
            await succ.toggle_status(targetActor, 'shaken', false)
            await succ.toggle_status(targetActor, 'stunned', false)
            await succ.toggle_status(targetActor, 'vulnerable', false)
        } else if (method === "heal") {
            amount = 2
            if (targetInc === true || targetBleedOut === true || (targetInc === true && targetBleedOut === true)) {
                // Remove Bleeding out/Incap before any wounds
                if (targetBleedOut) {
                    await succ.toggle_status(targetActor, 'bleeding-out', false)
                    amount = amount - 1
                    chatContent = game.i18n.format("SWIM.chatMessage-healOtherCureBleetOut", {tokenName : token.name, targetName : target.name})
                } if (targetInc) {
                    await succ.toggle_status(targetActor, 'incapacitated', false)
                    //amount = amount - 1 //Incapacitation: Healing at least one Wound on an Incapacitated patient removes that state (and restores consciousness if he was knocked out). -> so a Wound is healed in any case(?).
                    chatContent += game.i18n.format("SWIM.chatMessage-healOtherCureIncapContinued", {targetName : target.name})
                    if (combatHealing === true) {amount = 0}
                    if (amount <= 0) { await createchatMessage() }
                }
            } if (amount > 0) {
                //Heal two Wounds
                await removeInjury(targetActor, amount)
                await apply()
                if (amount === 2) {
                    chatContent = game.i18n.format("SWIM.chatMessage-healOtherRaise", {tokenName : token.name, targetName : target.name})
                } else if (amount === 1) {
                    chatContent += game.i18n.format("SWIM.chatMessage-healOtherRaiseContinued", {targetName : target.name})
                }
                await createchatMessage()
            }
        }
    } else {
        ui.notifications.error(game.i18n.localize("SWIM.notification-generalErrorMsg"));
        console.error("The heal_other_gm() function wasn't passed the proper success rating. Please report this to the SWIM developer on the repository or directly to him on Discord: SalieriC#8263.")
    }
    async function apply() {
        if (rating === "critFail" && method === "heal") {
            let setWounds = targetWounds + amount
            if (targetWoundsMax <= setWounds) {
                setWounds = targetWoundsMax
                await succ.apply_status(targetActor, 'incapacitated', true)
            }
            targetActor.update({ "system.wounds.value": setWounds })
        } else if (method === "relief") {
            if (targetFatigue < amount) { amount = targetFatigue }
            targetActor.update({ "system.fatigue.value": targetFatigue - amount })
            await playHealFX(target, unshakeSFX)
        } else if (method === "heal") {
            if (targetWounds < amount) { amount = targetWounds }
            targetActor.update({ "system.wounds.value": targetWounds - amount })
            await playHealFX(target, soakSFX)
        }
    }

    async function createchatMessage() {
        ChatMessage.create({
            user: game.user.id,
            content: chatContent,
        });
    }
}

async function healSelf(token, speaker) {
    // Setting SFX
    const { woundedSFX, incapSFX, healSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(token.actor)
    const pronoun = swim.get_pronoun(token)
    let potionSFX = game.settings.get(
        'swim', 'potionSFX');

    // Declaring variables and constants.
    const wv = token.actor.system.wounds.value;
    const wm = token.actor.system.wounds.max;
    const fv = token.actor.system.fatigue.value;
    const fm = token.actor.system.fatigue.max;
    //Checking for Edges (and Special/Racial Abilities)
    let natHeal_time = game.settings.get(
        'swim', 'natHeal_Time');
    const fastHealer = token.actor.items.find(function (item) {
        return ((item.name.toLowerCase() === game.i18n.localize("SWIM.edge-fastHealer").toLowerCase()) && item.type === "edge");
    });
    if (fastHealer) { natHeal_time = "three days" };
    const reg_slow = token.actor.items.find(function (item) {
        return ((item.name.toLowerCase() === game.i18n.localize("SWIM.ability-slowRegeneration").toLowerCase()) && item.type === "ability");
    });
    if (reg_slow) { natHeal_time = "day" };
    const reg_fast = token.actor.items.find(function (item) {
        return ((item.name.toLowerCase() === game.i18n.localize("SWIM.ability-fastRegeneration").toLowerCase()) && item.type === "ability");
    });
    if (reg_fast) { natHeal_time = "round" };
    const elan = token.actor.items.find(function (item) {
        return item.name.toLowerCase() === game.i18n.localize("SWIM.edge-elan").toLowerCase() && item.type === "edge";
    });
    //Checking for Health Potions
    const healthPotionOptions = game.settings.get(
        'swim', 'healthPotionOptions');
    const healthPotionsSplit = healthPotionOptions.split('|');
    const hasHealthPotion = token.actor.items.find(function (item) {
        return (healthPotionsSplit.includes(item.name) && item.type === "gear" && item.system.quantity > 0)
    });
    //Find owned Health potions.
    const ownedHealthPotions = healthPotionsSplit.filter(potion => token.actor.items.some(item => item.name === potion && item.type === "gear" && item.system.quantity > 0));
    //Set up a list of Health Potions to choose from.
    let healthPotionList;
    for (let healthPotion of ownedHealthPotions) {
        healthPotionList += `<option value="${healthPotion}">${healthPotion}</option>`;
    }

    //Checking for Fatigue Potions
    const fatiguePotionOptions = game.settings.get(
        'swim', 'fatiguePotionOptions');
    const fatiguePotionsSplit = fatiguePotionOptions.split('|');
    const hasFatiguePotion = token.actor.items.find(function (item) {
        return (fatiguePotionsSplit.includes(item.name) && item.type === "gear" && item.system.quantity > 0)
    });
    //Find owned Fatigue potions.
    const ownedFatiguePotions = fatiguePotionsSplit.filter(potion => token.actor.items.some(item => item.name === potion && item.type === "gear" && item.system.quantity > 0));
    //Set up a list of Fatigue Potions to choose from.
    let fatiguePotionList;
    for (let fatiguePotion of ownedFatiguePotions) {
        fatiguePotionList += `<option value="${fatiguePotion}">${fatiguePotion}</option>`;
    }

    let numberWounds;
    let rounded;
    let elanBonus;
    let setWounds;
    let genericHealWounds;
    let genericHealFatigue;
    let buttons_main;
    let md_text
    const sendMessage = true
    const inc = await succ.check_status(token, 'incapacitated')
    const bleedOut = await succ.check_status(token, 'bleeding-out')

    // Adjusting buttons and Main Dialogue text
    if (fv < 1 && wv < 1) {
        md_text = game.i18n.localize("SWIM.dialogue-noWoundsNorFatigue");
        buttons_main = {
            one: {
                label: game.i18n.localize("SWIM.dialogue-nevermind"),
                callback: (_) => { },
            }
        }
    }
    else if (fv > 0 && wv < 1 && !hasFatiguePotion) {
        md_text = "<form>"+game.i18n.format("SWIM.dialogue-fatigueCheck", {currentFatigue : fv, maxFatigue : fm})+game.i18n.localize("SWIM.dialogue-whatDoYouWantToDo")+"</form>";
        buttons_main = {
            one: {
                label: game.i18n.localize("SWIM.dialogue-cureFatigue"),
                callback: (_) => {
                    genericRemoveFatigue();
                }
            }
        }
    }
    else if (fv > 0 && wv < 1 && hasFatiguePotion) {
        md_text = "<form>"+game.i18n.format("SWIM.dialogue-fatigueCheck", {currentFatigue : fv, maxFatigue : fm})+game.i18n.localize("SWIM.dialogue-hasFatiguePotion")+game.i18n.localize("SWIM.dialogue-whatDoYouWantToDo")+"</form>";
        buttons_main = {
            one: {
                label: game.i18n.localize("SWIM.dialogue-cureFatigue"),
                callback: (_) => {
                    genericRemoveFatigue();
                }
            },
            two: {
                label: game.i18n.localize("SWIM.dialogue-potion"),
                callback: (_) => {
                    useFatiguePotion();
                }
            }
        }
    }
    else if (fv < 1 && wv > 0 && !hasHealthPotion) {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        md_text = "<form>"+game.i18n.format("SWIM.dialogue-woundCheck",{currentWounds: wv, maxWounds: wm, totalBennies: totalBennies, natHeal_time: natHeal_time})+game.i18n.localize("SWIM.dialogue-whatDoYouWantToDo")+"</form>";
        buttons_main = {
            one: {
                label: game.i18n.localize("SWIM.dialogue-naturalHealing"),
                callback: (_) => {
                    numberWounds = wv;
                    rollNatHeal();
                }
            },
            two: {
                label: game.i18n.localize("SWIM.dialogue-directHealing"),
                callback: (_) => {
                    genericRemoveWounds();
                }
            }
        }
    }
    else if (fv < 1 && wv > 0 && hasHealthPotion) {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        md_text = "<form>"+game.i18n.format("SWIM.dialogue-woundCheck",{currentWounds: wv, maxWounds: wm, totalBennies: totalBennies, natHeal_time: natHeal_time})+game.i18n.localize("SWIM.dialogue-hasHealingPotion")+game.i18n.localize("SWIM.dialogue-whatDoYouWantToDo")+"</form>";
        buttons_main = {
            one: {
                label: game.i18n.localize("SWIM.dialogue-naturalHealing"),
                callback: (_) => {
                    numberWounds = wv;
                    rollNatHeal();
                }
            },
            two: {
                label: game.i18n.localize("SWIM.dialogue-directHealing"),
                callback: (_) => {
                    genericRemoveWounds();
                }
            },
            three: {
                label: game.i18n.localize("SWIM.dialogue-potion"),
                callback: (_) => {
                    useHealthPotion();
                }
            }
        }
    }
    else if (wv > 0 && fv > 0 && !hasFatiguePotion && !hasHealthPotion) {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        md_text = `<form>
    <p>You currently have <b>${wv}/${wm}</b> Wounds, <b>${fv}/${fm}</b> Fatigue and <b>${totalBennies}</b> Bennies.</p>
    <p>You may make a Natural Healing roll <b>every ${natHeal_time}</b> unless altered by setting specific circumstances.</p>
    <p>You still have <b>Healing potions</b>, you might as well use one of these.</p>
    <p>In general you may remove a Level of Fatigue <b>every hour</b> when resting and the source of your Fatigue is absent. This can be altered depending on the source of Fatigue, so <b>ask your GM</b> if you're allowed to remove your Fatigue now.</p>
    <p>You may also heal wounds directly (i.e. from the Healing Power) or cure Fatigue. What you you want to do?</p>
    </form>`;
        buttons_main = {
            one: {
                label: "Natural Healing",
                callback: (_) => {
                    numberWounds = wv;
                    rollNatHeal();
                }
            },
            two: {
                label: "Direct Healing",
                callback: (_) => {
                    genericRemoveWounds();
                }
            },
            four: {
                label: "Cure Fatigue",
                callback: (_) => {
                    genericRemoveFatigue();
                }
            }
        }
    }
    else if (wv > 0 && fv > 0 && !hasFatiguePotion && hasHealthPotion) {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        md_text = `<form>
    <p>You currently have <b>${wv}/${wm}</b> Wounds, <b>${fv}/${fm}</b> Fatigue and <b>${totalBennies}</b> Bennies.</p>
    <p>You may make a Natural Healing roll <b>every ${natHeal_time}</b> unless altered by setting specific circumstances.</p>
    <p>You still have <b>Healing potions</b>, you might as well use one of these.</p>
    <p>In general you may remove a Level of Fatigue <b>every hour</b> when resting and the source of your Fatigue is absent. This can be altered depending on the source of Fatigue, so <b>ask your GM</b> if you're allowed to remove your Fatigue now.</p>
    <p>You may also heal wounds directly (i.e. from the Healing Power) or cure Fatigue. What you you want to do?</p>
    </form>`;
        buttons_main = {
            one: {
                label: "Natural Healing",
                callback: (_) => {
                    numberWounds = wv;
                    rollNatHeal();
                }
            },
            two: {
                label: "Direct Healing",
                callback: (_) => {
                    genericRemoveWounds();
                }
            },
            three: {
                label: "Potion (heal)",
                callback: (_) => {
                    useHealthPotion();
                }
            },
            four: {
                label: "Cure Fatigue",
                callback: (_) => {
                    genericRemoveFatigue();
                }
            },
        }
    }
    else if (wv > 0 && fv > 0 && hasFatiguePotion && !hasHealthPotion) {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        md_text = `<form>
    <p>You currently have <b>${wv}/${wm}</b> Wounds, <b>${fv}/${fm}</b> Fatigue and <b>${totalBennies}</b> Bennies.</p>
    <p>You may make a Natural Healing roll <b>every ${natHeal_time}</b> unless altered by setting specific circumstances.</p>
    <p>You still have <b>potions that cure Fatigue</b>, you might as well use one of these (but ask your GM, the source of your Fatigue might not allow it).</p>
    <p>In general you may remove a Level of Fatigue <b>every hour</b> when resting and the source of your Fatigue is absent. This can be altered depending on the source of Fatigue, so <b>ask your GM</b> if you're allowed to remove your Fatigue now.</p>
    <p>You may also heal wounds directly (i.e. from the Healing Power) or cure Fatigue. What you you want to do?</p>
    </form>`;
        buttons_main = {
            one: {
                label: "Natural Healing",
                callback: (_) => {
                    numberWounds = wv;
                    rollNatHeal();
                }
            },
            two: {
                label: "Direct Healing",
                callback: (_) => {
                    genericRemoveWounds();
                }
            },
            three: {
                label: "Cure Fatigue",
                callback: (_) => {
                    genericRemoveFatigue();
                }
            },
            four: {
                label: "Potion (Fatigue)",
                callback: (_) => {
                    useFatiguePotion();
                }
            },
        }
    }
    else if (wv > 0 && fv > 0 && hasFatiguePotion && hasHealthPotion) {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        md_text = `<form>
    <p>You currently have <b>${wv}/${wm}</b> Wounds, <b>${fv}/${fm}</b> Fatigue and <b>${totalBennies}</b> Bennies.</p>
    <p>You may make a Natural Healing roll <b>every ${natHeal_time}</b> unless altered by setting specific circumstances.</p>
    <p>You still have <b>Health Potions</b> and <b>potions that cure Fatigue</b>, you might as well use one of these (but ask your GM, the source of your Fatigue might not allow it).</p>
    <p>In general you may remove a Level of Fatigue <b>every hour</b> when resting and the source of your Fatigue is absent. This can be altered depending on the source of Fatigue, so <b>ask your GM</b> if you're allowed to remove your Fatigue now.</p>
    <p>You may also heal wounds directly (i.e. from the Healing Power) or cure Fatigue. What you you want to do?</p>
    </form>`;
        buttons_main = {
            one: {
                label: "Natural Healing",
                callback: (_) => {
                    numberWounds = wv;
                    rollNatHeal();
                }
            },
            two: {
                label: "Direct Healing",
                callback: (_) => {
                    genericRemoveWounds();
                }
            },
            three: {
                label: "Potion (heal)",
                callback: (_) => {
                    useHealthPotion();
                }
            },
            four: {
                label: "Cure Fatigue",
                callback: (_) => {
                    genericRemoveFatigue();
                }
            },
            five: {
                label: "Potion (Fatigue)",
                callback: (_) => {
                    useFatiguePotion();
                }
            }
        }
    }

    // This is the main function that handles the Vigor roll.
    async function rollNatHeal() {

        const edgeNames = [game.i18n.localize("SWIM.edge-fastHealer").toLowerCase()];
        const actorAlias = speaker.alias;
        // Roll Vigor and check for Fast Healer.
        const r = await token.actor.rollAttribute('vigor');
        const edges = token.actor.items.filter(function (item) {
            return edgeNames.includes(item.name.toLowerCase()) && (item.type === "edge" || item.type === "ability");
        });
        let rollWithEdge = r.total;
        let edgeText = "";
        for (let edge of edges) {
            rollWithEdge += 2;
            edgeText += `<br/><i>+ ${edge.name}</i>`;
        }

        // Apply +2 if Elan is present and if it is a reroll.
        if (typeof elanBonus === "number") {
            rollWithEdge += 2;
            edgeText = edgeText + `<br/><i>+ Elan</i>.`;
        }

        // Roll Vigor including +2 if Fast Healer is present and another +2 if this is a reroll.
        let chatData = `${actorAlias} rolled <span style="font-size:150%"> ${rollWithEdge} </span>`;
        rounded = Math.floor(rollWithEdge / 4);

        // Making rounded 0 if it would be negative.
        if (rounded < 0) {
            rounded = 0;
        }

        // Checking for a Critical Failure.
        let wildCard = true;
        if (token.actor.system.wildcard === false && token.actor.type === "npc") { wildCard = false }
        let critFail = await swim.critFail_check(wildCard, r)
        if (critFail === true) {
            ui.notifications.notify("You've rolled a Critical Failure!");
            let chatData = `${actorAlias} rolled a <span style="font-size:150%">Critical Failure!</span> and takes another Wound! See the rules on Natural Healing for details.`;
            let noVig = true
            applyWounds(noVig);
            ChatMessage.create({ content: chatData });
        }
        else {
            let roundedCopy = rounded
            let conditionsText = ""
            if (rounded < 1) {
                let { _, __, totalBennies } = await swim.check_bennies(token)
                chatData += ` and is unable to heal any Wounds.`;
                if (totalBennies < 1) {
                    return;
                }
                else {
                    dialogReroll(rounded, conditionsText);
                }
            } else if (inc === true || bleedOut === true) {
                if (roundedCopy > 2) { roundedCopy = 2 }
                if (bleedOut === true && roundedCopy > 0) {
                    roundedCopy = roundedCopy -1
                    chatData += `, stabilises from Bleeding Out`
                    conditionsText += " but you stabilise from Bleeding Out"
                } if (inc === true && roundedCopy > 0) {
                    //roundedCopy = roundedCopy -1 //Incapacitation: Healing at least one Wound on an Incapacitated patient removes that state (and restores consciousness if he was knocked out). -> so a Wound is healed in any case(?).
                    if (roundedCopy <= 0) {
                        chatData += ` and recovers from Incapacitation.`
                        conditionsText += " and recover from Incapacitation"
                    }
                    else {
                        chatData += `, recovers from Incapacitation`
                        conditionsText += " but you recover from Incapacitation"
                    }
                    conditionsText += "."
                }
                if (roundedCopy < 1) { removeWounds(); }
            } if (roundedCopy === 1 && numberWounds > 1) {
                let { _, __, totalBennies } = await swim.check_bennies(token)
                chatData += ` and heals ${roundedCopy} of ${pronoun} ${numberWounds} Wounds.`;
                if (totalBennies < 1 || (roundedCopy === 1 && rounded >= 2)) {
                    removeWounds();
                }
                else {
                    dialogReroll(roundedCopy, conditionsText);
                };
            } else if ((roundedCopy > 1 && roundedCopy >= numberWounds) || (roundedCopy === 1 && numberWounds === 1)) {
                chatData += ` and heals all of ${pronoun} Wounds.`;
                removeWounds();
            } else if (roundedCopy >= 2) {
                chatData += ` and heals two of ${pronoun} Wounds (the maximum for a Natural Healing roll).`;
                removeWounds();
            }
            chatData += ` ${edgeText}`;

            ChatMessage.create({ content: chatData });
        }
    }

    // Function containing the reroll Dialogue
    async function dialogReroll(roundedCopy, conditionsText) {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        if (totalBennies > 0) {
            new Dialog({
                title: 'Reroll',
                content: `<form>
                You've healed <b>${roundedCopy} Wounds</b>${conditionsText}.
                </br>Do you want to reroll your Natural Healing roll (you have <b>${totalBennies} Bennies</b> left)?
                </form>`,
                buttons: {
                    one: {
                        label: "Reroll",
                        callback: async (_) => {
                            await swim.spend_benny(token, sendMessage);
                            if (!!elan) {
                                elanBonus = 2;
                            }
                            rollNatHeal();
                        }
                    },
                    two: {
                        label: "No",
                        callback: (_) => {
                            if (rounded < 1) {
                                ui.notifications.notify("As you wish.");
                            }
                            else {
                                ui.notifications.notify("As you wish, Wounds will be removed now.");
                            }
                            removeWounds();
                        }
                    }
                },
                default: "one"
            }).render(true);
        }
        else {
            ui.notifications.notify("You have no more bennies.");
            removeWounds();
        }
    }

    // Main Dialogue
    new Dialog({
        title: 'Personal Health Centre',
        content: md_text,
        buttons: buttons_main,
        default: "one",
    }).render(true);

    async function removeWounds() {
        if (genericHealWounds) {
            if (inc === true || bleedOut === true) {
                if (bleedOut === true && genericHealWounds > 0) {
                    await succ.toggle_status(token, 'bleeding-out', false)
                    genericHealWounds = genericHealWounds -1
                } if (inc === true && genericHealWounds > 0) {
                    await succ.toggle_status(token, 'incapacitated', false)
                    genericHealWounds = genericHealWounds -1
                }
                ui.notifications.notify(`Bleeding out and Incapacitation will be removed before any Wounds.`);
            }
            if (genericHealWounds > wv && genericHealWounds > 0) {
                genericHealWounds = wv;
                ui.notifications.error(`You can't heal more wounds than you have, healing all Wounds instead now...`);
            }
            setWounds = wv - genericHealWounds;
            await token.actor.update({ "system.wounds.value": setWounds });
            await removeInjury(token.actor, genericHealWounds)
            ui.notifications.notify(`${genericHealWounds} Wound(s) healed.`);
        }
        else {
            if (inc === true || bleedOut === true) {
                if (rounded >= 2) { rounded = 2 } //Can't heal more than 2 Wounds
                if (bleedOut === true && rounded > 0) {
                    await succ.toggle_status(token, 'bleeding-out', false)
                    rounded = rounded -1
                } if (inc === true && rounded > 0) {
                    await succ.toggle_status(token, 'incapacitated', false)
                    rounded = rounded -1
                }
                ui.notifications.notify(`Bleeding out and Incapacitation will be removed before any Wounds.`);
            }
            if (rounded === 1) {
                setWounds = wv - 1;
                if (setWounds < 0) {
                    setWounds = 0;
                }
                await token.actor.update({ "system.wounds.value": setWounds });
                await removeInjury(token.actor, rounded)
                ui.notifications.notify("One Wound healed.");
            }
            if (rounded >= 2) {
                setWounds = wv - 2;
                if (setWounds < 0) {
                    setWounds = 0
                }
                await token.actor.update({ "system.wounds.value": setWounds });
                rounded = 2
                await removeInjury(token.actor, rounded)
                ui.notifications.notify("Two Wounds healed.");
            }
        }
        if (healSFX && genericHealWounds > 0 || healSFX && rounded > 0) {
            await playHealFX(token, healSFX)
        }
    }

    // Healing from a source other than Natural Healing
    async function genericRemoveWounds() {
        new Dialog({
            title: 'Direct Healing',
            content: `<form>
        <p>You currently have <b>${wv}/${wm}</b>. If you've been healed from a source other than Natural Healing, enter the amount of Wounds below:</p>
    <div class="form-group">
        <label for="numWounds">Amount of Wounds: </label>
        <input id="numWounds" name="num" type="number" min="0" value="1" onClick="this.select();"></input>
    </div>
    </form>`,
            buttons: {
                one: {
                    label: "Heal Wounds",
                    callback: (html) => {
                        genericHealWounds = Number(html.find("#numWounds")[0].value);
                        removeWounds();
                    }
                }
            },
            default: "one",
            render: ([dialogContent]) => {
                dialogContent.querySelector(`input[name="num"`).focus();
                dialogContent.querySelector(`input[name="num"`).select();
            },
        }).render(true);
    }

    // Healing from a source other than Natural Healing
    async function useHealthPotion() {
        new Dialog({
            title: 'Healing Potion',
            content: `<form>
        <p>You currently have <b>${wv}/${wm}</b>. If you want to use a healing potion, enter the amount of Wounds it heals and select the desired potion below:</p>
    <div class="form-group">
        <label for="numWounds">Amount of Wounds: </label>
        <input id="numWounds" name="num" type="number" min="0" value="1" onClick="this.select();"></input>
    </div>
    <div class="form-group">
            <label for="potionName">Potion to use: </label>
            <select name="potionName">${healthPotionList}</select>
            </div>
    </form>`,
            buttons: {
                one: {
                    label: "Use Potion",
                    callback: async (html) => {
                        genericHealWounds = Number(html.find("#numWounds")[0].value);
                        let selectedPotion = String(html.find("[name=potionName]")[0].value);
                        let potion_to_update = token.actor.items.find(i => i.name === selectedPotion);
                        let potion_icon = potion_to_update.img;
                        const updates = [
                            { _id: potion_to_update.id, "system.quantity": potion_to_update.system.quantity - 1 }
                        ];
                        await token.actor.updateEmbeddedDocuments("Item", updates);
                        if (potion_to_update.system.quantity < 1) {
                            potion_to_update.delete();
                        }
                        ChatMessage.create({
                            speaker: {
                                alias: token.name
                            },
                            content: `<img style="border: none;" src="${potion_icon}" alt="" width="25" height="25" /> ${token.name} uses a ${selectedPotion} to heal ${genericHealWounds} wound(s).`
                        })
                        if (potionSFX) {
                            let audioDuration = (await AudioHelper.play({ src: `${potionSFX}` }, true)).duration
                            await wait(audioDuration * 1000);
                        }
                        removeWounds();
                    }
                }
            },
            default: "one",
            render: ([dialogContent]) => {
                dialogContent.querySelector(`input[name="num"`).focus();
                dialogContent.querySelector(`input[name="num"`).select();
            },
        }).render(true);
    }

    // Healing from a source other than Natural Healing
    async function useFatiguePotion() {
        new Dialog({
            title: 'Potion to cure Fatigue',
            content: `<form>
        <p>You currently have <b>${fv}/${fm}</b>. If you want to use a potion that cures Fatigue, enter the amount of Fatigue it cures and select the desired potion below:</p>
    <div class="form-group">
        <label for="numFatigue">Amount of Fatigue: </label>
        <input id="numFatigue" name="num" type="number" min="0" value="1" onClick="this.select();"></input>
    </div>
    <div class="form-group">
            <label for="potionName">Potion to use: </label>
            <select name="potionName">${fatiguePotionList}</select>
            </div>
    </form>`,
            buttons: {
                one: {
                    label: "Use Potion",
                    callback: async (html) => {
                        genericHealFatigue = Number(html.find("#numFatigue")[0].value);
                        let selectedPotion = String(html.find("[name=potionName]")[0].value);
                        let potion_to_update = token.actor.items.find(i => i.name === selectedPotion);
                        let potion_icon = potion_to_update.img;
                        const updates = [
                            { _id: potion_to_update.id, "system.quantity": potion_to_update.system.quantity - 1 }
                        ];
                        await token.actor.updateEmbeddedEntity("Item", updates);
                        if (potion_to_update.system.quantity < 1) {
                            potion_to_update.delete();
                        }
                        ChatMessage.create({
                            speaker: {
                                alias: token.name
                            },
                            content: `<img style="border: none;" src="${potion_icon}" alt="" width="25" height="25" /> ${token.name} uses a ${selectedPotion} to cure ${genericHealFatigue} level(s) of Fatigue.`
                        })
                        if (potionSFX) {
                            let audioDuration = (await AudioHelper.play({ src: `${potionSFX}` }, true)).duration
                            await wait(audioDuration * 1000);
                        }
                        RemoveFatigue();
                    }
                }
            },
            default: "one",
            render: ([dialogContent]) => {
                dialogContent.querySelector(`input[name="num"`).focus();
                dialogContent.querySelector(`input[name="num"`).select();
            },
        }).render(true);
    }

    // Removing Fatigue
    async function genericRemoveFatigue() {
        new Dialog({
            title: 'Cure Fatigue',
            content: `<form>
        <p>You currently have <b>${fv}/${fm}</b> If your Fatigue has been cured or expired, enter the amount of Fatigue below:</p>
    <div class="form-group">
        <label for="numWounds">Amount of Fatigue: </label>
        <input id="numFatigue" name="num" type="number" min="0" value="1" onClick="this.select();"></input>
    </div>
    </form>`,
            buttons: {
                one: {
                    label: "Cure Fatigue",
                    callback: async (html) => {
                        genericHealFatigue = Number(html.find("#numFatigue")[0].value);
                        RemoveFatigue();
                        await ChatMessage.create({
                            speaker: {
                                alias: token.name
                            },
                            content: `${token.name} lost ${genericHealFatigue} Level(s) of Fatigue.`
                        })
                    }
                }
            },
            default: "one",
            render: ([dialogContent]) => {
                dialogContent.querySelector(`input[name="num"`).focus();
                dialogContent.querySelector(`input[name="num"`).select();
            },
        }).render(true);
    }

    async function RemoveFatigue() {
        if (genericHealFatigue > fv) {
            genericHealFatigue = fv;
            ui.notifications.error(`You can't cure more Fatigue than you have, curing all Fatigue instead now...`);
        }
        let setFatigue = fv - genericHealFatigue;
        await token.actor.update({ "system.fatigue.value": setFatigue });
        ui.notifications.notify(`${genericHealFatigue} Level(s) of Fatigue cured.`);
        if (looseFatigueSFX && genericHealFatigue > 0) {
            await playHealFX(token, looseFatigueSFX)
        }
    }

    async function applyWounds(noVig) {
        setWounds = wv + 1
        if (setWounds <= wm) {
            await token.actor.update({ "system.wounds.value": setWounds });
            if (woundedSFX) {
                AudioHelper.play({ src: `${woundedSFX}` }, true);
            }
        }
        else {
            await token.actor.update({ "system.wounds.value": wm });
            await succ.apply_status(token, 'incapacitated', true, true)
            if (incapSFX) {
                AudioHelper.play({ src: `${incapSFX}` }, true);
            }
            if (noVig === true) {return}
            await swim.soak_damage()
        }
    }

    async function wait(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
}

async function removeInjury(actor, healedWounds) {
    let activeEffects = actor.effects
    let injuries = []
    let aeIDsToRemove = []
    for (let effect of activeEffects) {
        if (effect.flags?.swim) {
            injuries.push(effect)
        }
    }
    injuries.reverse() //Reverse to remove combat injuries in proper order, from most recent to least recent.
    for (let injury of injuries) {
        let combat = injury.flags.swim.isCombatInjury
        let permanent = injury.flags.swim.isPermanent
        if (permanent === false && combat === true) {
            //remove if wound is healed
            if (healedWounds > 0) {
                aeIDsToRemove.push(injury.id)
                healedWounds = healedWounds - 1
            }
        } else if (permanent === false && combat === false) {
            // Is a temorary injury from Inc.
            if (actor.system.wounds.value === 0) {
                // Remove the injury if all Wounds are healed.
                aeIDsToRemove.push(injury.id)
            }
        }
    }
    await actor.deleteEmbeddedDocuments("ActiveEffect", aeIDsToRemove)
}

async function playHealFX(token, sfx) {
    let healVFX = game.settings.get(
        'swim', 'healVFX');
    if (game.modules.get("sequencer")?.active && healVFX) {
        let healVFX = game.settings.get(
            'swim', 'healVFX');
        //let tokenD = canvas.tokens.controlled[0];
        let scale = token.scale;
        let sequence = new Sequence()
            .effect()
            .file(`${healVFX}`) //recommendation: "modules/jb2a_patreon/Library/2nd_Level/Misty_Step/MistyStep_01_Regular_Green_400x400.webm"
            .atLocation(token)
            .scale(scale)
        sequence.play();
    }
    await swim.play_sfx(sfx)
}
