/*******************************************
 * Personal Health Centre
 * // v.4.0.1
 * By SalieriC#8263; fixing bugs supported by FloRad#2142. Potion usage inspired by grendel111111#1603; asynchronous playback of sfx by Freeze#2689.
 ******************************************/
export async function personal_health_centre_script() {
    const { speaker, _, __, token } = await swim.get_macro_variables()
    const target = Array.from(game.user.targets)[0]
    if (!game.modules.get("healthEstimate")?.active) {
        ui.notifications.error("Please install and activate Health Estimate to use this macro.");
        return;
    }
    // Check if a token is selected.
    if (!token || canvas.tokens.controlled.length > 1 || game.user.targets.size > 1) {
        ui.notifications.error("Please select or target a single token first.");
        return;
    }
    const officialClass = await swim.get_official_class()

    if (game.user.targets.size === 1 && (token.id != target.id)) {
        new Dialog({
            title: "Heal other",
            content: `${officialClass}
             <h3>Heal someone else.</h3>
             <p>You have targeted another token. Do you wish to heal that token?</p>
             <p>If you wish to heal yourself instead, please remove the target.</p>
             </div>`,
            buttons: {
                one: {
                    label: "Heal Target",
                    callback: async (_) => {
                        healOther(token, target)
                    }
                },
                two: {
                    label: "Cancel",
                }
            }
        }).render(true)
    } else if (token && canvas.tokens.controlled.length === 1) {
        // Heal Self
        new Dialog({
            title: "Heal self",
            content: `${officialClass}
             <h3>Heal yourself.</h3>
             <p>You have selected one token and may have targeted the same. This will only allow you to heal a token you own.</p>
             <p>If you wish to heal someone else instead, please target another token but select yourself.</p>
             </div>`,
            buttons: {
                one: {
                    label: "Heal myself",
                    callback: async (_) => {
                        healSelf(token, speaker)
                    }
                },
                two: {
                    label: "Cancel",
                }
            }
        }).render(true)
    }
}

async function healOther(token, target) {
    // The non-GM part of the heal other functionality
    const officialClass = await swim.get_official_class()
    let data
    const methodOptions = `<option value="heal">Heal Wound(s)</option><option value="relief">Remove Fatigue</option>`
    new Dialog({
        title: "Heal other",
        content: `${officialClass}
         <p>What was your result? Did you heal or remove fatigue</p>
         <p>Note: If you had a Critical Failure on the healing or relief power you shouldn't be here. Only select Success or Raise if you used the power.</p>
         <div class="form-group">
                <label for="method">Method: </label>
                <select id="method">${methodOptions}</select>
            </div>
         </div>`,
        buttons: {
            one: {
                label: "Critical Failure",
                callback: async (html) => {
                    const method = html.find(`#method`)[0].value;
                    data = {
                        targetID: target.id,
                        tokenID: token.id,
                        rating: "critFail",
                        method: method
                    }
                    warpgate.event.notify("SWIM.healOther", data)
                }
            },
            two: {
                label: "Failure",
                callback: () => {
                    ui.notifications.notify("There is nothing for you to do here.");
                }
            },
            three: {
                label: "Success",
                callback: async (html) => {
                    const method = html.find(`#method`)[0].value;
                    data = {
                        targetID: target.id,
                        tokenID: token.id,
                        rating: "success",
                        method: method
                    }
                    warpgate.event.notify("SWIM.healOther", data)
                }
            },
            four: {
                label: "Raise",
                callback: async (html) => {
                    const method = html.find(`#method`)[0].value;
                    data = {
                        targetID: target.id,
                        tokenID: token.id,
                        rating: "raise",
                        method: method
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
    const targetWounds = targetActor.data.data.wounds.value
    const targetWoundsMax = targetActor.data.data.wounds.max
    const targetFatigue = targetActor.data.data.fatigue.value
    const tokenID = data.tokenID
    const token = canvas.tokens.get(tokenID)
    const tokenActor = token.actor
    const rating = data.rating
    const method = data.method
    const { shakenSFX, deathSFX, unshakeSFX, soakSFX } = await swim.get_actor_sfx(targetActor)
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
                await succ.toggle_status(targetActor, 'incapacitated', true)
                await swim.play_sfx(deathSFX)
                chatContent = `${token.name} tried to heal ${target.name} but failed miserably and incapacitated him in the process.`
                await createChatMessage()
            } else {
                amount = 1
                await apply()
                chatContent = `${token.name} tried to heal ${target.name} but failed miserably and applied another wound.`
                await createChatMessage()
            }
        }
    } else if (rating === "success") {
        //Heal one Wound or Fatigue
        if (method === "relief") {
            amount = 1
            await apply()
            chatContent = `${token.name} gave ${target.name} some relief by removing a Level of Fatigue and/or Shaken.`
            await createChatMessage()
            await succ.toggle_status(targetActor, 'shaken', false)
        } else if (method === "heal") {
            amount = 1
            await apply()
            chatContent = `${token.name} healed ${target.name} for one Wound.`
            await createChatMessage()
        }
    } else if (rating === "raise") {
        //Heal two Wounds or remove two Fatigue
        if (method === "relief") {
            //Heal two Fatigue and remove Shaken and Stunned
            amount = 2
            await apply()
            chatContent = `${token.name} gave ${target.name} some relief by removing up to two Levels of Fatigue and/or Shaken and/or Stunned.`
            await createChatMessage()
            await succ.toggle_status(targetActor, 'shaken', false)
            await succ.toggle_status(targetActor, 'stunned', false)
            await succ.toggle_status(targetActor, 'vulnerable', false)
        } else if (method === "heal") {
            //Heal two Wounds
            amount = 2
            await apply()
            chatContent = `${token.name} healed ${target.name} for two Wounds.`
            await createChatMessage()
        }
    } else {
        ui.notifications.error("An error occured. See the console for more details.");
        console.error("The heal_other_gm() function wasn't passed the proper success rating. Please report this to the SWIM developer on the repository or directly to him on Discord: SalieriC#8263.")
    }
    async function apply() {
        if (rating === "critFail" && method === "heal") {
            targetActor.update({ "data.wounds.value": targetWounds+amount })
        } else if (method === "relief") {
            if (targetFatigue < amount) { amount = targetFatigue }
            targetActor.update({ "data.fatigue.value": targetFatigue-amount })
            await swim.play_sfx(unshakeSFX)
        } else if (method === "heal") {
            if (targetWounds < amount) {amount = targetWounds }
            targetActor.update({ "data.wounds.value": targetWounds-amount })
            await swim.play_sfx(soakSFX)
        }
    }
    
    async function createChatMessage() {
        ChatMessage.create({
            user: game.user.id,
            content: chatContent,
        });
    }
}

async function healSelf(token, speaker) {
    // Setting SFX
    let woundedSFX = game.settings.get(
        'swim', 'woundedSFX');
    let incapSFX = game.settings.get(
        'swim', 'incapSFX');
    let healSFX = game.settings.get(
        'swim', 'healSFX');
    let looseFatigueSFX = game.settings.get(
        'swim', 'looseFatigueSFX');
    let potionSFX = game.settings.get(
        'swim', 'potionSFX');
    if (token.actor.data.data.additionalStats.sfx) {
        let sfxSequence = token.actor.data.data.additionalStats.sfx.value.split("|");
        woundedSFX = sfxSequence[0];
        incapSFX = sfxSequence[1];
        healSFX = sfxSequence[2];
        looseFatigueSFX = sfxSequence[2];
    }

    // Declairing variables and constants.
    const wv = token.actor.data.data.wounds.value;
    const wm = token.actor.data.data.wounds.max;
    const fv = token.actor.data.data.fatigue.value;
    const fm = token.actor.data.data.fatigue.max;
    //Checking for Edges (and Special/Racial Abilities)
    let natHeal_time = game.settings.get(
        'swim', 'natHeal_Time');
    const fastHealer = token.actor.data.items.find(function (item) {
        return ((item.name.toLowerCase() === game.i18n.localize("SWIM.edge-fastHealer").toLowerCase()) && item.type === "edge");
    });
    if (fastHealer) { natHeal_time = "three days" };
    const reg_slow = token.actor.data.items.find(function (item) {
        return ((item.name.toLowerCase() === game.i18n.localize("SWIM.ability-slowRegeneration").toLowerCase()) && item.type === "ability");
    });
    if (reg_slow) { natHeal_time = "day" };
    const reg_fast = token.actor.data.items.find(function (item) {
        return ((item.name.toLowerCase() === game.i18n.localize("SWIM.ability-fastRegeneration").toLowerCase()) && item.type === "ability");
    });
    if (reg_fast) { natHeal_time = "round" };
    const elan = token.actor.data.items.find(function (item) {
        return item.name.toLowerCase() === game.i18n.localize("SWIM.edge-elan").toLowerCase() && item.type === "edge";
    });
    //Checking for Health Potions
    const healthPotionOptions = game.settings.get(
        'swim', 'healthPotionOptions');
    const healthPotionsSplit = healthPotionOptions.split('|');
    const hasHealthPotion = token.actor.data.items.find(function (item) {
        return (healthPotionsSplit.includes(item.name) && item.type === "gear" && item.data.data.quantity > 0)
    });
    //Find owned Health potions.
    const ownedHealthPotions = healthPotionsSplit.filter(potion => token.actor.data.items.some(item => item.name === potion && item.type === "gear" && item.data.data.quantity > 0));
    //Set up a list of Health Potions to choose from.
    let healthPotionList;
    for (let healthPotion of ownedHealthPotions) {
        healthPotionList += `<option value="${healthPotion}">${healthPotion}</option>`;
    }

    //Checking for Fatigue Potions
    const fatiguePotionOptions = game.settings.get(
        'swim', 'fatiguePotionOptions');
    const fatiguePotionsSplit = fatiguePotionOptions.split('|');
    const hasFatiguePotion = token.actor.data.items.find(function (item) {
        return (fatiguePotionsSplit.includes(item.name) && item.type === "gear" && item.data.data.quantity > 0)
    });
    //Find owned Fatigue potions.
    const ownedFatiguePotions = fatiguePotionsSplit.filter(potion => token.actor.data.items.some(item => item.name === potion && item.type === "gear" && item.data.data.quantity > 0));
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

    // Adjusting buttons and Main Dialogue text
    if (fv < 1 && wv < 1) {
        md_text = `<form>
    <p>You currently neither have any Wounds nor Fatigue. There is nothing for you to do here.</p>
    </form>`;
        buttons_main = {
            one: {
                label: "Nevermind...",
                callback: (_) => { },
            }
        }
    }
    else if (fv > 0 && wv < 1 && !hasFatiguePotion) {
        md_text = `<form>
    <p>You currently have <b>no</b> Wounds and <b>${fv}/${fm}</b> Fatigue.</p>
    <p>In general you may remove a Level of Fatigue <b>every hour</b> when resting and the source of your Fatigue is absent. This can be altered depending on the source of Fatigue, so <b>ask your GM</b> if you're allowed to remove your Fatigue now.</p>
    <p>What you you want to do?</p>
    </form>`;
        buttons_main = {
            one: {
                label: "Cure Fatigue",
                callback: (_) => {
                    genericRemoveFatigue();
                }
            }
        }
    }
    else if (fv > 0 && wv < 1 && hasFatiguePotion) {
        md_text = `<form>
    <p>You currently have <b>no</b> Wounds and <b>${fv}/${fm}</b> Fatigue.</p>
    <p>In general you may remove a Level of Fatigue <b>every hour</b> when resting and the source of your Fatigue is absent. This can be altered depending on the source of Fatigue, so <b>ask your GM</b> if you're allowed to remove your Fatigue now.</p>
    <p>You still have a <b>potion that cures Fatigue</b>, you might as well use it (but ask your GM, the source of your Fatigue might not allow it).</p>
    <p>What you you want to do?</p>
    </form>`;
        buttons_main = {
            one: {
                label: "Cure Fatigue",
                callback: (_) => {
                    genericRemoveFatigue();
                }
            },
            two: {
                label: "Potion",
                callback: (_) => {
                    useFatiguePotion();
                }
            }
        }
    }
    else if (fv < 1 && wv > 0 && !hasHealthPotion) {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        md_text = `<form>
    <p>You currently have <b>${wv}/${wm}</b> Wounds, <b>no</b> Fatigue and <b>${totalBennies}</b> Bennies.</p>
    <p>You may make a Natural Healing roll <b>every ${natHeal_time}</b> unless altered by setting specific circumstances.</p>
    <p>You may also heal wounds directly (i.e. from the Healing Power). What you you want to do?</p>
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
            }
        }
    }
    else if (fv < 1 && wv > 0 && hasHealthPotion) {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        md_text = `<form>
    <p>You currently have <b>${wv}/${wm}</b> Wounds, <b>no</b> Fatigue and <b>${totalBennies}</b> Bennies.</p>
    <p>You may make a Natural Healing roll <b>every ${natHeal_time}</b> unless altered by setting specific circumstances.</p>
    <p>You still have <b>Healing potions</b>, you might as well use one of these.</p>
    <p>You may also heal wounds directly (i.e. from the Healing Power). What you you want to do?</p>
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
                label: "Potion",
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

        const edgeNames = ['fast healer'];
        const actorAlias = speaker.alias;
        // Roll Vigor and check for Fast Healer.
        const r = await token.actor.rollAttribute('vigor');
        const edges = token.actor.data.items.filter(function (item) {
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
        if (token.actor.data.data.wildcard === false && token.actor.type === "npc") { wildCard = false }
        let critFail = await swim.critFail_check(wildCard, r)
        if (critFail === true) {
            ui.notifications.notify("You've rolled a Critical Failure!");
            let chatData = `${actorAlias} rolled a <span style="font-size:150%">Critical Failure!</span> and takes another Wound! See the rules on Natural Healing for details.`;
            applyWounds();
            ChatMessage.create({ content: chatData });
        }
        else {
            if (rounded < 1) {
                let { _, __, totalBennies } = await swim.check_bennies(token)
                chatData += ` and is unable to heal any Wounds.`;
                if (totalBennies < 1) {
                    return;
                }
                else {
                    dialogReroll();
                }
            } else if ((rounded === 1 && numberWounds > 1) || (rounded === 2 && numberWounds > 2)) {
                let { _, __, totalBennies } = await swim.check_bennies(token)
                chatData += ` and heals ${rounded} of his ${numberWounds} Wounds.`;
                if (totalBennies < 1) {
                    removeWounds();
                }
                else {
                    dialogReroll();
                };
            } else if ((rounded > 1 && rounded >= numberWounds && numberWounds < 3) || (rounded === 1 && numberWounds === 1)) {
                chatData += ` and heals all of his Wounds.`;
                removeWounds();
            }
            chatData += ` ${edgeText}`;

            ChatMessage.create({ content: chatData });
        }
    }

    // Function containing the reroll Dialogue
    async function dialogReroll() {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        if (totalBennies > 0) {
            new Dialog({
                title: 'Reroll',
                content: `<form>
                You've healed <b>${rounded} Wounds</b>.
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
            if (genericHealWounds > wv) {
                genericHealWounds = wv;
                ui.notifications.error(`You can't heal more wounds than you have, healing all Wounds instead now...`);
            }
            setWounds = wv - genericHealWounds;
            await token.actor.update({ "data.wounds.value": setWounds });
            ui.notifications.notify(`${genericHealWounds} Wound(s) healed.`);
        }
        else {
            if (rounded === 1) {
                setWounds = wv - 1;
                if (setWounds < 0) {
                    setWounds = 0;
                }
                await token.actor.update({ "data.wounds.value": setWounds });
                ui.notifications.notify("One Wound healed.");
            }
            if (rounded >= 2) {
                setWounds = wv - 2;
                if (setWounds < 0) {
                    setWounds = 0
                }
                await token.actor.update({ "data.wounds.value": setWounds });
                ui.notifications.notify("Two Wounds healed.");
            }
        }
        if (healSFX && genericHealWounds > 0 || healSFX && rounded > 0) {
            AudioHelper.play({ src: `${healSFX}` }, true);
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
                        let potion_icon = potion_to_update.data.img;
                        const updates = [
                            { _id: potion_to_update.id, "data.quantity": potion_to_update.data.data.quantity - 1 }
                        ];
                        await token.actor.updateEmbeddedDocuments("Item", updates);
                        if (potion_to_update.data.data.quantity < 1) {
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
                        let potion_icon = potion_to_update.data.img;
                        const updates = [
                            { _id: potion_to_update.id, "data.quantity": potion_to_update.data.data.quantity - 1 }
                        ];
                        await token.actor.updateEmbeddedEntity("Item", updates);
                        if (potion_to_update.data.data.quantity < 1) {
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
        await token.actor.update({ "data.fatigue.value": setFatigue });
        ui.notifications.notify(`${genericHealFatigue} Level(s) of Fatigue cured.`);
        if (looseFatigueSFX && genericHealFatigue > 0) {
            AudioHelper.play({ src: `${looseFatigueSFX}` }, true);
        }
    }

    async function applyWounds() {
        setWounds = wv + 1
        if (setWounds <= wm) {
            await token.actor.update({ "data.wounds.value": setWounds });
            if (woundedSFX) {
                AudioHelper.play({ src: `${woundedSFX}` }, true);
            }
        }
        else {
            await token.actor.update({ "data.wounds.value": wm });
            await succ.apply_status(token, 'incapacitated', true)
            if (incapSFX) {
                AudioHelper.play({ src: `${incapSFX}` }, true);
            }
        }
    }

    async function wait(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
}

async function applyInjury(actor, permanent) {
    //roll on injury table:
    let result = await game.tables.getName(`${injuryTable}`).draw();
    let text = result.results[0].data.text;
    const img = result.results[0].data.img;
    let injuryData = {
        changes: [],
        flags: { swim: { 
            isCombatInjury: false,
            isPermanentInjury: permanent
        } }
    };
    injuryData.icon = img;
    if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-unmentionables"))) {
        //unmentionables; create dummy AE without actual effect
        injuryData.label = game.i18n.localize("SWIM.injury-unmentionables");
    } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-arm"))) {
        //arm; create a dummy AE without actual effect
        injuryData.label = game.i18n.localize("SWIM.injury-armUnusable");
    } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-leg"))) {
        //leg, create AE with appropriate value depending on whether or not the character is slow already
        const slow = token.actor.data.items.find(function (item) {
            return ((item.name.toLowerCase() === game.i18n.localize("SWIM.hindrance-slow").toLowerCase()) ||
                (item.name.toLowerCase() === game.i18n.localize("SWIM.hindrance-slow").toLowerCase())) &&
                item.type === "hindrance";
        });
        if (!slow) {
            //Actor isn't slow, create AE with minor slow effect = data.stats.speed.runningDie -2 && data.stats.speed.value -1
            injuryData.label = game.i18n.localize("SWIM.injury-legSlow");
            if (token.actor.data.data.stats.speed.runningDie === 4) {
                //Running die is a d4 already, alter AE like so: data.stats.speed.runningDie.modifier -1 && data.stats.speed.value -1
                injuryData.changes.push({
                    key: 'data.stats.speed.runningDie.modifier',
                    mode: 2,
                    value: -1
                }, {
                    key: 'data.stats.speed.value',
                    mode: 2,
                    value: -1
                }
                )
            } else {
                //AE as above
                injuryData.changes.push({
                    key: 'data.stats.speed.runningDie',
                    mode: 2,
                    value: -2
                }, {
                    key: 'data.stats.speed.value',
                    mode: 2,
                    value: -1
                })
            }
        } else if (slow.data.data.major === false) {
            //Actor is minor slow, create AE with major slow effect = data.stats.speed.runningDie -2 && data.stats.speed.value -2 && @Skill{Athletics}[data.die.modifier] -2
            injuryData.label = game.i18n.localize("SWIM.injury-legSlow");
            if (token.actor.data.data.stats.speed.runningDie === 4) {
                //Running die is a d4 already, alter AE like so: data.stats.speed.runningDie.modifier -1 && data.stats.speed.value -2
                injuryData.changes.push({
                    key: 'data.stats.speed.runningDie.modifier',
                    mode: 2,
                    value: -1
                }, {
                    key: 'data.stats.speed.value',
                    mode: 2,
                    value: -2
                }, {
                    key: `@Skill{${game.i18n.localize("SWIM.skill-athletics")}}[data.die.modifier]`,
                    mode: 2,
                    value: -2
                })
            } else {
                //AE as above
                injuryData.changes.push({
                    key: 'data.stats.speed.runningDie',
                    mode: 2,
                    value: -2
                }, {
                    key: 'data.stats.speed.value',
                    mode: 2,
                    value: -2
                }, {
                    key: `@Skill{${game.i18n.localize("SWIM.skill-athletics")}}[data.die.modifier]`,
                    mode: 2,
                    value: -2
                })
            }
            //Do nothing if actor is major slow already.
        }
    } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-guts"))) {
        //evaluate all the guts:
        if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-broken"))) {
            //Guts broken, create AE with data.attributes.agility.die.sides -2
            injuryData.label = game.i18n.localize("SWIM.injury-gutsBroken");
            injuryData.changes.push({
                key: 'data.attributes.agility.die.sides',
                mode: 2,
                value: -2
            })
        } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-battered"))) {
            //Guts battered, create AE with data.attributes.vigor.die.sides -2
            injuryData.label = game.i18n.localize("SWIM.injury-gutsBattered");
            injuryData.changes.push({
                key: 'data.attributes.vigor.die.sides',
                mode: 2,
                value: -2
            })
        } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-busted"))) {
            //Guts busted, created AE with data.attributes.strength.die.sides -2
            injuryData.label = game.i18n.localize("SWIM.injury-gutsBusted");
            injuryData.changes.push({
                key: 'data.attributes.strength.die.sides',
                mode: 2,
                value: -2
            })
        }
    } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-head"))) {
        //evaluate all the head results:
        if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-hideousScar"))) {
            //hideous scar, create AE with @Skill{Persuasion}[data.die.modifier] -2
            injuryData.label = game.i18n.localize("SWIM.injury-headScar");
            injuryData.changes.push({
                key: `@Skill{${game.i18n.localize("SWIM.skill-persuasion")}}[data.die.modifier]`,
                mode: 2,
                value: -2
            })
        } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-blinded"))) {
            //Blinded, create dummy AE without actual effect
            injuryData.label = game.i18n.localize("SWIM.injury-headBlinded");
        } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-brain"))) {
            //Brain damage, create AE with data.attributes.smarts.die.sides -2
            injuryData.label = game.i18n.localize("SWIM.injury-headBrainDamage");
            injuryData.changes.push({
                key: 'data.attributes.smarts.die.sides',
                mode: 2,
                value: -2
            })
        }
    }
    //Create the AE:
    await actor.createEmbeddedDocuments('ActiveEffect', [injuryData]);
}