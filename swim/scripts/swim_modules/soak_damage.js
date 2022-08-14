/*******************************************
 * Soak Damage
 * v. 5.1.0
 * Code by SalieriC#8263.
 *******************************************/
export async function soak_damage_script() {
    const { speaker, _, __, token } = await swim.get_macro_variables()
    const actor = token.actor
    if (!game.modules.get("healthEstimate")?.active) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-healthEstimateRequired"));
        return;
    }
    // Checking if at least one token is defined.
    if (!token || canvas.tokens.controlled.length > 1) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
        return;
    }
    // Checking for System Benny image.
    let bennyImage = await swim.get_benny_image()
    // Setting SFX
    let woundedSFX = game.settings.get(
        'swim', 'woundedSFX');
    // Injury Table for Gritty Damage
    let grit = game.settings.get(
        'swim', 'grittyDamage');
    let gritNPC = game.settings.get(
        'swim', 'grittyDamageNPC');
    let injuryTable = game.settings.get(
        'swim', 'injuryTable');
    let soakSFX;
    if (token.actor.system.additionalStats.sfx) {
        let sfxSequence = token.actor.system.additionalStats.sfx.value.split("|");
        woundedSFX = sfxSequence[0];
        soakSFX = sfxSequence[3];
    }
    const sendMessage = true

    // Declaring variables and constants.
    const wv = token.actor.system.wounds.value;
    const wm = token.actor.system.wounds.max;
    const ppv = token.actor.system.powerPoints.value;
    const holyWarr = token.actor.data.items.find(function (item) {
        return ((item.name.toLowerCase() === game.i18n.localize("SWIM.edge-holyWarrior").toLowerCase()) || (item.name.toLowerCase() === game.i18n.localize("SWIM.edge-unholyWarrior").toLowerCase())) && item.type === "edge";
    });
    const elan = token.actor.data.items.find(function (item) {
        return item.name.toLowerCase() === game.i18n.localize("SWIM.edge-elan").toLowerCase() && item.type === "edge";
    });

    let numberWounds;
    let numberPP;
    let rounded;
    let elanBonus;
    let newWounds;
    let { ___, ____, totalBennies } = await swim.check_bennies(token)
    const bleedingOut = await succ.check_status(token, 'bleeding-out')
    const inc = await succ.check_status(token, 'incapacitated')

    // This is the main function that handles the Vigor roll.
    async function rollSoak() {

        const edgeNames = [
            game.i18n.localize("SWIM.edge-ironJaw").toLowerCase(),
            game.i18n.localize("SWIM.ability-thickFur-sagaOfTheGoblinHorde").toLowerCase()
        ];
        const actorAlias = speaker.alias;
        // Roll Vigor and check for Iron Jaw.
        const r = await token.actor.rollAttribute('vigor');
        const edges = token.actor.data.items.filter(function (item) {
            return edgeNames.includes(item.name.toLowerCase()) && (item.type === "edge" || item.type === "ability");
        });
        let rollWithEdge = r.total;
        let edgeText = "";
        for (let edge of edges) {
            rollWithEdge += 2;
            edgeText += `<br/><em>+ 2 <img src="${edge.img}" alt="" width="15" height="15" style="border:0" />${edge.name}</em>`;
        }

        // If Holy Warrior or Unholy Warrior is used: Include the amount of PPs used as a bonus to the roll.
        if (typeof numberPP === "number") {
            rollWithEdge += numberPP;
            edgeText = edgeText + game.i18n.format("SWIM.chatMessage-edgeText", { numberPP: numberPP });
        }

        // Apply +2 if Elan is present and if it is a reroll.
        if (typeof elanBonus === "number") {
            rollWithEdge += 2;
            edgeText = edgeText + `<br/><em>+ game.i18n.localize("SWIM.edge-elan")</em>.`;
        }

        // Roll Vigor including +2 if Iron Jaw is present, amount of PPs used as modifier if Holy Warrior or Unholy Warrior was used and another +2 if this is a reroll.
        let chatData = game.i18n.format("SWIM.chatMessage-unshakeResultRoll", { name: actorAlias, rollWithEdge: rollWithEdge });
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
            ui.notifications.notify(game.i18n.localize("SWIM.notification-critFailApplyWounds"));
            let chatData = game.i18n.format("SWIM.chatMessage-unshakeResultCritFail", { name: actorAlias });
            applyWounds();
            ChatMessage.create({ content: chatData });
        } else {
            let { _, __, totalBennies } = await swim.check_bennies(token)
            if (rounded < 1) {
                chatData += game.i18n.localize("SWIM.chatMessage-soakNoWounds");
                if (totalBennies < 1) {
                    applyWounds();
                }
                else {
                    dialogReroll();
                }
            } else if (rounded < numberWounds) {
                chatData += game.i18n.format("SWIM.chatMessage-soakSomeWounds", { rounded: rounded });
                if (soakSFX) { AudioHelper.play({ src: `${soakSFX}` }, true); }
                if (totalBennies < 1) {
                    applyWounds();
                }
                else {
                    dialogReroll();
                };
            } else if (rounded >= numberWounds) {
                chatData += game.i18n.localize("SWIM.chatMessage-soakAllWounds");
                if (soakSFX) { AudioHelper.play({ src: `${soakSFX}` }, true); }
                if (await succ.check_status(token, 'shaken') === true) {
                    await succ.apply_status(token, 'shaken', false)
                }
            }
            chatData += ` ${edgeText}`;

            ChatMessage.create({ content: chatData });
        }
    }

    // Apply wounds if not all wounds were soaked.
    async function applyWounds() {
        newWounds = numberWounds - rounded;
        //Translate TODO
        new Dialog({
            title: game.i18n.localize("SWIM.dialogue-applyWounds"),
            content: `<form>
             <div class="form-group">
                 <label for="applWounds">Wounds to apply:</label>
                 <input id="applWounds" name="num" type="number" min="0" value="${newWounds}"></input>
             </div>
             </form>`,
            buttons: {
                one: {
                    label: game.i18n.localize("SWIM.dialogue-applyWounds"),
                    callback: async (html) => {
                        let applWounds = Number(html.find("#applWounds")[0].value);
                        let setWounds = wv + applWounds;
                        let inc = false
                        if (setWounds <= wm && setWounds > 0) {
                            token.actor.update({ "data.wounds.value": setWounds });
                            await succ.apply_status(token, 'shaken', true)
                            if (woundedSFX) {
                                AudioHelper.play({ src: `${woundedSFX}` }, true);
                            }
                        }
                        else if (applWounds === 0) {
                            await succ.apply_status(token, 'shaken', true)
                        }
                        else {
                            token.actor.update({ "data.wounds.value": wm });
                            await swim.mark_dead()
                            if (token.actor.data.type === "character") {
                                await incVigor()
                            }
                            inc = true
                        }
                        if ((setWounds > 0 && grit === true && (token.actor.data.type === "character" || token.actor.data.type === "npc" && gritNPC === true)) && inc === false) {
                            let permanent = false
                            let combat = true
                            await apply_injury(permanent, combat);
                        }
                    }
                }
            },
            default: "one",
            render: ([dialogContent]) => {
                dialogContent.querySelector(`input[name="num"`).focus();
                dialogContent.querySelector(`input[name="num"`).select();
            },
        }).render(true)
    }

    // Buttons for the main Dialogue.
    let buttonsMain = {
        one: {
            label: game.i18n.localize("SWIM.dialogue-soakWounds"),
            callback: async (html) => {
                numberWounds = Number(html.find("#numWounds")[0].value);
                let { _, __, totalBennies } = await swim.check_bennies(token)
                if (totalBennies < 1) {
                    applyWounds();
                }
                else {
                    await swim.spend_benny(token, sendMessage)
                    rollSoak();
                }
            }
        },
        two: {
            label: game.i18n.localize("SWIM.dialogue-applyDmg"),
            callback: (html) => {
                numberWounds = Number(html.find("#numWounds")[0].value);
                rounded = 0
                applyWounds();
            }
        }
    }

    // If Unholy Warrior or Holy Warrior is present, add another button to the Main Dialogue and render another dialogue to enter the amount of PP to be used.
    if (holyWarr) buttonsMain["three"] = {
        label: game.i18n.localize("SWIM.dialogue-soakWoundsWithUnHolyWarrior"),
        callback: (html) => {
            numberWounds = Number(html.find("#numWounds")[0].value);
            //Translate ToDo
            new Dialog({
                title: game.i18n.localize("SWIM.dialogue-soakWounds"),
                content: `<form>
             <div class="form-group">
                 <form>
                 You can spend a <b>maximum of 4 Power Points</b> to add a bonus to your Soaking Roll equal to the amount of Power Points used.
                 </br>You have <b>${ppv} Power Points</b> left.
                 </form>
                 <label for="numPP">Power Points to spend: </label>
                 <input id="numPP" name="num" type="number" min="1" max="4" value="1"></input>
             </div>
             </form>`,
                buttons: {
                    one: {
                        label: game.i18n.localize("SWIM.dialogue-soakWounds"),
                        callback: async (html) => {
                            numberPP = Number(html.find("#numPP")[0].value);
                            if (ppv < numberPP) {
                                ui.notifications.notify(game.i18n.localize("SWIM.dialogue-insufficientPowerPoints"));
                            }
                            else if (numberPP > 4) {
                                ui.notifications.error(game.i18n.localize("SWIM.dialogue-cannotUseMoreThanFourPP"));
                            }
                            else {
                                let { _, __, totalBennies } = await swim.check_bennies(token)
                                if (totalBennies < 1) {
                                    applyWounds();
                                }
                                else {
                                    let newPP = ppv - numberPP;
                                    token.actor.update({ "data.powerPoints.value": newPP });
                                    await swim.spend_benny(token, sendMessage)
                                    rollSoak(numberWounds, numberPP);
                                }
                            }
                        }
                    },
                    default: "one",
                    render: ([dialogContent]) => {
                        dialogContent.querySelector(`input[name="num"`).focus();
                        dialogContent.querySelector(`input[name="num"`).select();
                    },
                }
            }).render(true);
        }
    }

    if (bleedingOut === true) { bleedVigor() }
    else if (inc === true) { incVigor() }
    else {
        // Main Dialogue
        //Translate ToDo
        new Dialog({
            title: game.i18n.localize("SWIM.dialogue-soakWounds"),
            content: `<form>
         <p>You currently have <b>${wv}/${wm}</b> Wounds and <b>${totalBennies}</b> Bennies.</p>
     <div class="form-group">
         <label for="numWounds">Amount of Wounds: </label>
         <input id="numWounds" name="num" type="number" min="0" value="1"></input>
     </div>
     </form>`,
            buttons: buttonsMain,
            default: "one",
            render: ([dialogContent]) => {
                dialogContent.querySelector(`input[name="num"`).focus();
                dialogContent.querySelector(`input[name="num"`).select();
            },
        }).render(true);
    }

    // Dialog to be rendered if not all wounds were soaked in rollSoak.
    async function dialogReroll() {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        if (totalBennies > 0) {
            let currWounds = numberWounds - rounded;
            new Dialog({
                title: game.i18n.localize("SWIM.dialogue-reroll"),
                content: game.i18n.format("SWIM.dialogue-rerollText", { rounded: rounded, currWounds: currWounds, totalBennies: totalBennies }),
                buttons: {
                    one: {
                        label: game.i18n.localize("SWIM.dialogue-reroll"),
                        callback: async (_) => {
                            await swim.spend_benny(token, sendMessage)
                            if (!!elan) {
                                elanBonus = 2;
                            }
                            rollSoak();
                        }
                    },
                    two: {
                        label: game.i18n.localize("SWIM.dialogue-decisionToApplyWounds"),
                        callback: (_) => {
                            ui.notifications.notify(game.i18n.localize("SWIM.dialogue-applyWounds"));
                            applyWounds();
                        }
                    }
                },
                default: "one",
            }).render(true);
        }
        else {
            ui.notifications.notify(game.i18n.localize("SWIM.dialogue-outOfBenniesApplyWounds"));
            applyWounds();
        }
    }

    async function apply_injury(permanent, combat) {
        //roll on injury table:
        let result = await game.tables.getName(`${injuryTable}`).draw();
        let text = result.results[0].data.text;
        const img = result.results[0].data.img;
        let injuryData = {
            changes: [],
            flags: {
                swim: {
                    isCombatInjury: combat,
                    isPermanent: permanent
                }
            }
        };
        injuryData.icon = img;
        if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-unmentionables").toLowerCase())) {
            //unmentionables; create dummy AE without actual effect
            injuryData.label = game.i18n.localize("SWIM.injury-unmentionables");
        } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-arm").toLowerCase())) {
            //arm; create a dummy AE without actual effect
            injuryData.label = game.i18n.localize("SWIM.injury-armUnusable");
        } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-leg").toLowerCase())) {
            //leg, create AE with appropriate value depending on whether or not the character is slow already
            const slow = token.actor.data.items.find(function (item) {
                return ((item.name.toLowerCase() === game.i18n.localize("SWIM.hindrance-slow").toLowerCase()) ||
                    (item.name.toLowerCase() === game.i18n.localize("SWIM.hindrance-slow").toLowerCase())) &&
                    item.type === "hindrance";
            });
            if (!slow) {
                //Actor isn't slow, create AE with minor slow effect = data.stats.speed.runningDie -2 && data.stats.speed.value -1
                injuryData.label = game.i18n.localize("SWIM.injury-legSlow");
                if (token.actor.system.stats.speed.runningDie === 4) {
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
            } else if (slow.system.major === false) {
                //Actor is minor slow, create AE with major slow effect = data.stats.speed.runningDie -2 && data.stats.speed.value -2 && @Skill{Athletics}[data.die.modifier] -2
                injuryData.label = game.i18n.localize("SWIM.injury-legSlow");
                if (token.actor.system.stats.speed.runningDie === 4) {
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
        } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-guts").toLowerCase())) {
            //evaluate all the guts:
            if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-broken").toLowerCase())) {
                //Guts broken, create AE with data.attributes.agility.die.sides -2
                injuryData.label = game.i18n.localize("SWIM.injury-gutsBroken");
                injuryData.changes.push({
                    key: 'data.attributes.agility.die.sides',
                    mode: 2,
                    value: -2
                })
            } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-battered").toLowerCase())) {
                //Guts battered, create AE with data.attributes.vigor.die.sides -2
                injuryData.label = game.i18n.localize("SWIM.injury-gutsBattered");
                injuryData.changes.push({
                    key: 'data.attributes.vigor.die.sides',
                    mode: 2,
                    value: -2
                })
            } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-busted").toLowerCase())) {
                //Guts busted, created AE with data.attributes.strength.die.sides -2
                injuryData.label = game.i18n.localize("SWIM.injury-gutsBusted");
                injuryData.changes.push({
                    key: 'data.attributes.strength.die.sides',
                    mode: 2,
                    value: -2
                })
            }
        } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-head").toLowerCase())) {
            //evaluate all the head results:
            if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-hideousScar").toLowerCase())) {
                //hideous scar, create AE with @Skill{Persuasion}[data.die.modifier] -2
                injuryData.label = game.i18n.localize("SWIM.injury-headScar");
                injuryData.changes.push({
                    key: `@Skill{${game.i18n.localize("SWIM.skill-persuasion")}}[data.die.modifier]`,
                    mode: 2,
                    value: -2
                })
            } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-blinded").toLowerCase())) {
                //Blinded, create dummy AE without actual effect
                injuryData.label = game.i18n.localize("SWIM.injury-headBlinded");
            } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-brain").toLowerCase())) {
                //Brain damage, create AE with data.attributes.smarts.die.sides -2
                injuryData.label = game.i18n.localize("SWIM.injury-headBrainDamage");
                injuryData.changes.push({
                    key: 'data.attributes.smarts.die.sides',
                    mode: 2,
                    value: -2
                })
            }
        }
        if (permanent === false && combat === true) {
            injuryData.label += `${game.i18n.localize("swim.injury-combat")}`;
        } else if (permanent === true && combat === false) {
            injuryData.label += `${game.i18n.localize("swim.injury-permanent")}`;
        }
        //Create the AE:
        await actor.createEmbeddedDocuments('ActiveEffect', [injuryData]);
    }

    async function incVigor() {
        let permanent = false
        let combat = false
        elanBonus = undefined
        let bestResult = -1
        let rerollDeclined = false
        let rollWithEdge
        let chatData
        let critFail
        const hardToKill = token.actor.data.items.find(function (item) {
            return item.name.toLowerCase() === game.i18n.localize("SWIM.edge-hardToKill").toLowerCase() && item.type === "edge";
        });
        const harderToKill = token.actor.data.items.find(function (item) {
            return item.name.toLowerCase() === game.i18n.localize("SWIM.edge-harderToKill").toLowerCase() && item.type === "edge";
        });

        new Dialog({
            title: game.i18n.localize("SWIM.dialogue-incapacitationRoll"),
            content: game.i18n.localize("SWIM.dialogue-incapacitationRollText"),
            buttons: {
                one: {
                    label: game.i18n.localize("SWIM.dialogue-rollVigor"),
                    callback: async (_) => {
                        rollVigor()
                    }
                }
            },
            default: "one",
        }).render(true);

        async function rollVigor() {
            const edgeNames = [];
            const actorAlias = speaker.alias;
            let edgeText = "";
            if (rerollDeclined === false) {
                // Roll Vigor and check for Iron Jaw.
                const r = await token.actor.rollAttribute('vigor');
                const edges = token.actor.data.items.filter(function (item) {
                    return edgeNames.includes(item.name.toLowerCase()) && (item.type === "edge" || item.type === "ability");
                });

                rollWithEdge = r.total;
                for (let edge of edges) {
                    rollWithEdge += 2;
                    edgeText += `<br/><em>+ 2 <img src="${edge.img}" alt="" width="15" height="15" style="border:0" />${edge.name}</em>`;
                }

                if (hardToKill) {
                    let hardToKillBonus = token.actor.system.wounds.value - token.actor.system.wounds.ignored
                    rollWithEdge += hardToKillBonus
                    edgeText = edgeText + `<br/><em>+ ${hardToKillBonus} <img src="${hardToKill.img}" alt="" width="15" height="15" style="border:0" />${hardToKill.name}</em>`;
                }

                // Apply +2 if Elan is present and if it is a reroll.
                if (typeof elanBonus === "number") {
                    rollWithEdge += 2;
                    edgeText = edgeText + `<br/><em>+ Elan</em>.`;
                }

                // Roll Vigor
                chatData = `${actorAlias} rolled <span style="font-size:150%"> ${rollWithEdge} </span>`;
                // Checking for a Critical Failure.
                let wildCard = true;
                if (token.actor.system.wildcard === false && token.actor.type === "npc") { wildCard = false }
                critFail = await swim.critFail_check(wildCard, r)
            }
            if (critFail === true && harderToKill) {
                const harderToKillRoll = await new Roll(`1d2`).evaluate({ async: false });
                if (harderToKillRoll.total === 1) {
                    ui.notifications.notify(`You've rolled a Critical Failure and failed your ${harderToKill.name} roll! You will die now...`);
                    let chatData = `${actorAlias} rolled a <span style="font-size:150%"> Critical Failure, didn't make the ${harderToKill.name} roll and perishes! </span>`;
                    ChatMessage.create({ content: chatData });
                } else if (harderToKillRoll.total === 2) {
                    ui.notifications.notify(`You've rolled a Critical Failure but made your ${harderToKill.name} roll! You will survive <em>somehow</em>...`);
                    let chatData = `${actorAlias} rolled a <span style="font-size:150%"> Critical Failure, but made the ${harderToKill.name} roll, is Incapacitated but survives, <em>somehow</em>. </span>`;
                    ChatMessage.create({ content: chatData });
                }
            } else if (critFail === true) {
                ui.notifications.notify("You've rolled a Critical Failure! You will die now...");
                let chatData = `${actorAlias} rolled a <span style="font-size:150%"> Critical Failure and perishes! </span>`;
                ChatMessage.create({ content: chatData });
            } else {
                let { _, __, totalBennies } = await swim.check_bennies(token)
                if (bestResult <= rollWithEdge) { bestResult = rollWithEdge }
                else if (bestResult > rollWithEdge) { rollWithEdge = bestResult }
                if ((totalBennies > 0 && rollWithEdge < 8) && rerollDeclined === false) {
                    //Use Benny
                    if (rollWithEdge < 4) {
                        //Permanent injury and Bleeding Out
                        let dialogContent = `<p>You've rolled a ${rollWithEdge} as your best result.</p><p>You would receive a permanent Injury and become Bleeding out.</p><p>You have <b>${totalBennies} Bennies</b> left. Do you want to spend one to reroll?</p>`
                        chatData += "and would receive a permanent Injury and become Bleeding out."
                        incReroll(dialogContent)
                    } else if (rollWithEdge >= 4 && rollWithEdge <= 7) {
                        //Injury until all wounds are healed
                        let dialogContent = `<p>You've rolled a ${rollWithEdge} as your best result.</p><p>You would receive an Injury that sticks until all wounds are healed.</p><p>You have <b>${totalBennies} Bennies</b> left. Do you want to spend one to reroll?</p>`
                        chatData += "and would receive an Injury that sticks until all wounds are healed."
                        incReroll(dialogContent)
                    }
                } else if (rollWithEdge < 4) {
                    //Permanent injury and Bleeding Out
                    permanent = true
                    await apply_injury(permanent, combat)
                    if (await succ.check_status(token, 'incapacitated') === true) {
                        const incCondition = await succ.get_condition_from(token.actor, 'incapacitated')
                        if (incCondition.data.flags?.core?.overlay === true) {
                            incCondition.setFlag('succ', 'updatedAE', true)
                            await incCondition.update({ "flags.core.overlay": false })
                        }
                    }
                    await succ.apply_status(token, 'bleeding-out', true, true)
                    chatData += `<p>${actorAlias} receives a permanent injury and is Bleeding Out.<p>`
                } else if (rollWithEdge >= 4 && rollWithEdge <= 7) {
                    //Injury until all wounds are healed
                    permanent = false
                    await apply_injury(permanent, combat)
                    chatData += `<p>${actorAlias} receives a temporary injury that is removed when all wounds are healed.</p>`
                } else if (rollWithEdge >= 8) {
                    //Injury until all wounds are helaed or after 24 hours
                    permanent = false
                    await apply_injury(permanent, combat)
                    chatData += `<p>${actorAlias} receives a temporary injury that is removed when all wounds are healed or after 24 hours, whichever comes first.</p>`
                }
                chatData += ` ${edgeText}`;
            }
            ChatMessage.create({ content: chatData });
        }

        async function incReroll(dialog_content) {
            dialog_content += `<p>Unless you roll a Critical Failure, your best result will be kept.</p>`
            if (elan) {
                elanBonus = 2
                dialog_content += `<p>You will get your Elan bonus on a reroll.</p>`
            }
            new Dialog({
                title: 'Incapacitation Reroll',
                content: dialog_content,
                buttons: {
                    one: {
                        label: "Roll Vigor",
                        callback: async (_) => {
                            rerollDeclined = false
                            rollVigor()
                            let sendMessage = true
                            swim.spend_benny(token, sendMessage)
                        }
                    },
                    two: {
                        label: "Apply result",
                        callback: async (_) => {
                            rerollDeclined = true
                            rollVigor()
                        }
                    }
                },
                default: "one",
            }).render(true);
        }
    }
    async function bleedVigor() {
        let permanent = false
        let combat = false
        elanBonus = undefined
        let bestResult = -1
        let rerollDeclined = false
        let rollWithEdge
        let chatData
        let critFail
        const harderToKill = token.actor.data.items.find(function (item) {
            return item.name.toLowerCase() === game.i18n.localize("SWIM.edge-harderToKill").toLowerCase() && item.type === "edge";
        });

        new Dialog({
            title: game.i18n.localize("SWIM.dialogue-bleedingOutRoll"),
            content: game.i18n.localize("SWIM.dialogue-bleedingOutRollText"),
            buttons: {
                one: {
                    label: game.i18n.localize("SWIM.dialogue-rollVigor"),
                    callback: async (_) => {
                        rollVigor()
                    }
                }
            },
            default: "one",
        }).render(true);

        async function rollVigor() {
            const edgeNames = [];
            const actorAlias = speaker.alias;
            let edgeText = "";
            if (rerollDeclined === false) {
                // Roll Vigor and check for Iron Jaw.
                const r = await token.actor.rollAttribute('vigor');
                const edges = token.actor.data.items.filter(function (item) {
                    return edgeNames.includes(item.name.toLowerCase()) && (item.type === "edge" || item.type === "ability");
                });

                rollWithEdge = r.total;
                for (let edge of edges) {
                    rollWithEdge += 2;
                    edgeText += `<br/><em>+ 2 <img src="${edge.img}" alt="" width="15" height="15" style="border:0" />${edge.name}</em>`;
                }

                // Apply +2 if Elan is present and if it is a reroll.
                if (typeof elanBonus === "number") {
                    rollWithEdge += 2;
                    edgeText = edgeText + `<br/><em>+ Elan</em>.`;
                }

                // Roll Vigor
                chatData = `${actorAlias} rolled <span style="font-size:150%"> ${rollWithEdge} </span>`;
                // Checking for a Critical Failure.
                let wildCard = true;
                if (token.actor.system.wildcard === false && token.actor.type === "npc") { wildCard = false }
                critFail = await swim.critFail_check(wildCard, r)
            }
            if (critFail === true && harderToKill) {
                const harderToKillRoll = await new Roll(`1d2`).evaluate({ async: false });
                if (harderToKillRoll.total === 1) {
                    ui.notifications.notify(`You've rolled a Critical Failure and failed your ${harderToKill.name} roll! You will die now...`);
                    let chatData = `${actorAlias} rolled a <span style="font-size:150%"> Critical Failure, didn't make the ${harderToKill.name} roll and perishes! </span>`;
                    ChatMessage.create({ content: chatData });
                } else if (harderToKillRoll.total === 2) {
                    ui.notifications.notify(`You've rolled a Critical Failure but made your ${harderToKill.name} roll! You will survive <em>somehow</em>...`);
                    let chatData = `${actorAlias} rolled a <span style="font-size:150%"> Critical Failure, but made the ${harderToKill.name} roll, is Incapacitated but survives, <em>somehow</em>. </span>`;
                    ChatMessage.create({ content: chatData });
                }
            } else if (critFail === true) {
                ui.notifications.notify("You've rolled a Critical Failure! You will die now...");
                let chatData = `${actorAlias} rolled a <span style="font-size:150%"> Critical Failure and perishes! </span>`;
                ChatMessage.create({ content: chatData });
            } else {
                let { _, __, totalBennies } = await swim.check_bennies(token)
                if (bestResult <= rollWithEdge) { bestResult = rollWithEdge }
                else if (bestResult > rollWithEdge) { rollWithEdge = bestResult }
                if ((totalBennies > 0 && rollWithEdge < 8) && rerollDeclined === false) {
                    //Use Benny
                    if (rollWithEdge < 4) {
                        //Permanent injury and Bleeding Out
                        let dialogContent = `<p>You've rolled a ${rollWithEdge} as your best result.</p><p>You would perish now.</p><p>You have <b>${totalBennies} Bennies</b> left. Do you want to spend one to reroll?</p>`
                        chatData += "and would perish now."
                        bleedReroll(dialogContent)
                    } else if (rollWithEdge >= 4 && rollWithEdge <= 7) {
                        //Injury until all wounds are healed
                        let dialogContent = `<p>You've rolled a ${rollWithEdge} as your best result.</p><p>You would survive but need to another roll on your next turn or every minute while out of combat.</p><p>You have <b>${totalBennies} Bennies</b> left. Do you want to spend one to reroll?</p>`
                        chatData += "and would survive but must roll again next turn or every minute while out of combat."
                        bleedReroll(dialogContent)
                    }
                } else if (rollWithEdge < 4 && harderToKill) {
                    const harderToKillRoll = await new Roll(`1d2`).evaluate({ async: false });
                    if (harderToKillRoll.total === 1) {
                        ui.notifications.notify(`You've rolled ${rollWithEdge} and failed your ${harderToKill.name} roll! You will die now...`);
                        let chatData = `${actorAlias} rolled <span style="font-size:150%"> ${rollWithEdge}, didn't make the ${harderToKill.name} roll and perishes! </span>`;
                        ChatMessage.create({ content: chatData });
                    } else if (harderToKillRoll.total === 2) {
                        ui.notifications.notify(`You've rolled ${rollWithEdge} but made your ${harderToKill.name} roll! You will survive <em>somehow</em>...`);
                        let chatData = `${actorAlias} rolled <span style="font-size:150%"> ${rollWithEdge}, but made the ${harderToKill.name} roll, is Incapacitated but survives, <em>somehow</em>. </span>`;
                        ChatMessage.create({ content: chatData });
                        await succ.apply_status(token, "bleeding-out", false)
                        await applyIncOverlay()
                    }
                } else if (rollWithEdge < 4) {
                    chatData += `<p>${actorAlias} perishes.<p>`
                    await succ.apply_status(token, "bleeding-out", false)
                    await applyIncOverlay()
                } else if (rollWithEdge >= 4 && rollWithEdge <= 7) {
                    chatData += `<p>${actorAlias} is still bleeding out.</p>`
                } else if (rollWithEdge >= 8) {
                    chatData += `<p>${actorAlias} stabilises.</p>`
                    await succ.apply_status(token, "bleeding-out", false)
                    await applyIncOverlay()
                }
                chatData += ` ${edgeText}`;
            }
            ChatMessage.create({ content: chatData });
        }

        async function applyIncOverlay() {
            if (await succ.check_status(token, 'incapacitated') === true) {
                const incCondition = await succ.get_condition_from(token.actor, 'incapacitated')
                if (incCondition.data.flags?.core?.overlay === false) {
                    incCondition.setFlag('succ', 'updatedAE', true)
                    await incCondition.update({ "flags.core.overlay": true })
                }
            } else { await succ.apply_status(token, "incapacitated", true, true) }
        }

        async function bleedReroll(dialog_content) {
            dialog_content += `<p>Unless you roll a Critical Failure, your best result will be kept.</p>`
            if (elan) {
                elanBonus = 2
                dialog_content += `<p>You will get your Elan bonus on a reroll.</p>`
            }
            new Dialog({
                title: 'Bleeding Out Reroll',
                content: dialog_content,
                buttons: {
                    one: {
                        label: "Roll Vigor",
                        callback: async (_) => {
                            rerollDeclined = false
                            rollVigor()
                            let sendMessage = true
                            swim.spend_benny(token, sendMessage)
                        }
                    },
                    two: {
                        label: "Apply result",
                        callback: async (_) => {
                            rerollDeclined = true
                            rollVigor()
                        }
                    }
                },
                default: "one",
            }).render(true);
        }
    }
}
