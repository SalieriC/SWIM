/*******************************************
 * Test and Support Macro
 * version v.0.0.0
 * Made and maintained by SalieriC#8263
 * Covered Edges:
 * - Elan
 * - Humiliate
 * - Menacing
 * - Reliable
 * - Retort
 * - Strong Willed
 ******************************************/
export async function tester_script() {
    let { speaker, _, __, token } = await swim.get_macro_variables()
    const targets = Array.from(game.user.targets)
    const officialClass = await swim.get_official_class()
    const supportLink = await swim.get_official_journal_link("support")
    const testLink = await swim.get_official_journal_link("test")
    let supportedSkillId

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
    let supportSkillOptions = `
    <option value="agility">${game.i18n.localize("ENHANCED_CONDITIONS.Dialog.Attribute")} ${game.i18n.localize("SWADE.AttrAgi")}</option>
    <option value="smarts">${game.i18n.localize("ENHANCED_CONDITIONS.Dialog.Attribute")} ${game.i18n.localize("SWADE.AttrSma")}</option>
    <option value="spirit">${game.i18n.localize("ENHANCED_CONDITIONS.Dialog.Attribute")} ${game.i18n.localize("SWADE.AttrSpr")}</option>
    <option value="strength">${game.i18n.localize("ENHANCED_CONDITIONS.Dialog.Attribute")} ${game.i18n.localize("SWADE.AttrStr")}</option>
    <option value="vigor">${game.i18n.localize("ENHANCED_CONDITIONS.Dialog.Attribute")} ${game.i18n.localize("SWADE.AttrVig")}</option>
    `
    for (let skill of targetToken.actor.items.filter((i) => i.type === "skill")) {
        supportSkillOptions += `<option value="${skill._id}">${game.i18n.localize("ENHANCED_CONDITIONS.Dialog.Skill")} ${skill.name}</option>`;
    }

    const supportContent = `<div class='form-group'>
  <label for='selected_skill'><p><b>${game.i18n.localize("SWIM.dialogue-selectSkill")}</b></p></label>
  <select id='selected_skill'>${skillOptions}</select>
</div>
<div class='form-group'>
  <label for='supported_skill'><p><b>${game.i18n.localize("SWIM.dialogue-selectSupportSkill")}</b></p></label>
  <select id='supported_skill'>${supportSkillOptions}</select>
</div> </div>`

    const testWarn = game.user.isGM || targetToken.actor.type === "character" ? game.i18n.localize("SWIM.dialogue-testerGmWarn") : ""

    const testContent = `${testWarn}<div class='form-group'>
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

    const supportYourAllies = supportLink ? `${supportLink}{${game.i18n.localize("SWIM.dialogue-testerIntroPartial2")}}` : `${game.i18n.localize("SWIM.dialogue-testerIntroPartial2")}`
    const testYourEnemies = testLink ? `${testLink}{${game.i18n.localize("SWIM.dialogue-testerIntroPartial3")}}` : `${game.i18n.localize("SWIM.dialogue-testerIntroPartial3")}`

    const content = await TextEditor.enrichHTML(`${officialClass}<form>
    <p>${game.i18n.localize("SWIM.dialogue-testerIntroPartial1")} ${supportYourAllies} ${game.i18n.localize("SWIM.word-or")} ${testYourEnemies}. ${game.i18n.localize("SWIM.dialogue-testerIntroPartial4")}</p>
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
                        supportedSkillId = html.find("#supported_skill").val();
                        // Perform support action
                        await support(selectedSkill)
                    } else if (selectedAction === "test") {
                        const selectedResult = html.find('input[name="selected_result"]:checked').val();
                        // Perform test action
                        await test(selectedSkill, selectedResult)
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

    async function support(skillId, reroll = false, elan = false, rerollCount = 0) {
        const roll = await token.actor.rollSkill(skillId);
        let rollWithEdge = roll.total
        let edgeText = ""
        if (reroll && elan) {
            edgeText = edgeText + `<br/><i>+ ${game.i18n.localize("SWIM.edge-elan")}</i>.`
            rollWithEdge += 2
        }
        const critFail = await swim.critFail_check(token.actor.system.wildcard, roll);
        const raise = rollWithEdge >= 8; // Check if the roll was a raise
        const bennyData = await swim.check_bennies(token, true);
        const totalBennies = bennyData.totalBennies;

        const data = {
            tokenId: token.id,
            targetId: targetToken.id,
            sceneId: token.scene._id,
            action: "support",
            skillId,
            roll,
            rollWithEdge,
            critFail,
            totalBennies,
            edgeText,
            supportedSkillId
        };

        if (critFail) {
            warpgate.event.notify("SWIM.tester", data); // Notify GM with data
            ui.notifications.warn(game.i18n.localize("SWIM.notification-critFail"))
            return;
        } if (raise) {
            warpgate.event.notify("SWIM.tester", data); // Notify GM with data
            return; // Early return after applying the result
        } if (totalBennies === 0) {
            ui.notifications.warn(game.i18n.localize("SWIM.notification-noBenniesLeft"));
            warpgate.event.notify("SWIM.tester", data); // Notify GM with data
            return; // Early return if out of Bennies
        }

        const reliableEdge = token.actor.items.find(e => e.type === "edge" && e.name.toLowerCase() === game.i18n.localize("SWIM.edge-reliable").toLowerCase())
        const freeRerollNotification = reliableEdge && rerollCount === 0 ? game.i18n.localize("SWIM.dialogue-supportRerollFree") : ""
        const content = game.i18n.format("SWIM.dialogue-supportReroll", { result: rollWithEdge, totalBennies, freeRerollNotification })

        new Dialog({
            title: game.i18n.localize("SWIM.gameTerm-Support"),
            content,
            buttons: {
                reroll: {
                    label: game.i18n.localize("SWIM.dialogue-reroll"),
                    callback: async () => {
                        const elanEdge = token.actor.items.find(e => e.type === "edge" && e.name.toLowerCase() === game.i18n.localize("SWIM.edge-elan").toLowerCase())
                        elan = elanEdge ? true : false
                        rerollCount += 1
                        if (rerollCount === 1 && reliableEdge) {
                            await support(skillId, true, elan, rerollCount) // Free reroll
                            return;
                        }
                        await swim.spend_benny(token, true); // Spend a Benny
                        await support(skillId, true, elan, rerollCount); // Reroll
                    },
                },
                apply: {
                    label: game.i18n.localize("SWIM.dialogue-apply"),
                    callback: async () => {
                        warpgate.event.notify("SWIM.tester", data); // Notify GM with data
                    },
                },
            },
        }).render(true);
    }

    async function test(skillId, selectedResult, reroll = false, elan = false, rerollCount = 0) {
        const skill = actor.items.find(s => s.id === skillId && s.type === "skill");
        const roll = await token.actor.rollSkill(skillId);
        let rollWithEdge = roll.total;
        let edgeText = "";
        if (reroll && elan) {
            edgeText = edgeText + `<br/><i>+ ${game.i18n.localize("SWIM.edge-elan")}</i>.`
            rollWithEdge += 2;
        }
        const menacingEdge = token.actor.items.find(e => e.type === "edge" && e.name.toLowerCase() === game.i18n.localize("SWIM.edge-menacing").toLowerCase())
        if (menacingEdge && skill.name.toLowerCase() === game.i18n.localize("SWIM.skill-intimidation").toLowerCase()) {
            rollWithEdge += 2
            edgeText += `<br/><i>+ ${game.i18n.localize("SWIM.edge-menacing")}</i>.`
        }
        const critFail = await swim.critFail_check(token.actor.system.wildcard, roll);
        const raise = rollWithEdge >= 8; // Check if the roll was a raise
        const bennyData = await swim.check_bennies(token, true);
        const totalBennies = bennyData.totalBennies;

        const data = {
            tokenId: token.id,
            targetId: targetToken.id,
            sceneId: token.scene._id,
            action: "test",
            skillId,
            roll,
            rollWithEdge,
            critFail,
            totalBennies,
            edgeText,
            selectedResult,
            supportedSkillId
        };

        if (critFail) {
            warpgate.event.notify("SWIM.tester", data); // Notify GM with data
            ui.notifications.warn(game.i18n.localize("SWIM.notification-critFail"))
            return;
        } if (raise) {
            warpgate.event.notify("SWIM.tester", data); // Notify GM with data
            return; // Early return after applying the result
        } if (totalBennies === 0) {
            ui.notifications.warn(game.i18n.localize("SWIM.notification-noBenniesLeft"));
            warpgate.event.notify("SWIM.tester", data); // Notify GM with data
            return; // Early return if out of Bennies
        }

        const skillName = token.actor.items.find(s => s.type === "skill" && s.id === skillId).name
        const usingTaunt = skillName.toLowerCase() === game.i18n.localize("SWIM.skill-taunt").toLowerCase() ? true : false
        const humiliateEdge = token.actor.items.find(e => e.type === "edge" && e.name.toLowerCase() === game.i18n.localize("SWIM.edge-humiliate").toLowerCase())
        const freeRerollNotification = usingTaunt && humiliateEdge && rerollCount === 0 ? game.i18n.localize("SWIM.dialogue-supportRerollFree") : ""
        const content = game.i18n.format("SWIM.dialogue-testReroll", {
            result: rollWithEdge,
            totalBennies,
            pronoun: swim.get_pronoun(targetToken),
            freeRerollNotification
        });

        new Dialog({
            title: game.i18n.localize("SWIM.gameTerm-Test"),
            content,
            buttons: {
                reroll: {
                    label: game.i18n.localize("SWIM.dialogue-reroll"),
                    callback: async () => {
                        const elanEdge = token.actor.items.find(e => e.type === "edge" && e.name.toLowerCase() === game.i18n.localize("SWIM.edge-elan").toLowerCase())
                        elan = elanEdge ? true : false;
                        rerollCount += 1;
                        if (rerollCount === 1 && humiliateEdge && usingTaunt) {
                            await support(skillId, true, elan, rerollCount) // Free reroll
                            return;
                        }
                        await swim.spend_benny(token, true); // Spend a Benny
                        await test(skillId, selectedResult, true, elan, rerollCount); // Reroll
                    },
                },
                apply: {
                    label: game.i18n.localize("SWIM.dialogue-apply"),
                    callback: async () => {
                        warpgate.event.notify("SWIM.tester", data); // Notify GM with data
                        // Handle applying the result
                        // You can access the total with: roll.total
                    },
                },
            },
        }).render(true);
    }

    //warpgate.event.notify("SWIM.tester", data)
}

export async function tester_gm(data) {
    console.log(data)
    const tokenId = data.tokenId;
    const targetId = data.targetId;
    const sceneId = data.sceneId;
    const action = data.action;
    const skillId = data.skillId;
    const supportedSkillId = data.supportedSkillId;
    const roll = data.roll;
    const rollWithEdge = data.rollWithEdge;
    const critFail = data.critFail;
    const totalBennies = data.totalBennies;
    const edgeTextToken = data.edgeText;
    const selectedResult = data.selectedResult;

    const scene = game.scenes.get(sceneId);
    const token = scene.tokens.find(t => t.id === tokenId);
    const targetToken = scene.tokens.find(t => t.id === targetId);
    const targetActor = targetToken.actor;
    const actor = token.actor;

    const skill = actor.items.find(s => s.id === skillId && s.type === "skill");
    const attribute = skill.system.attribute;
    let supportedAttribute = false;
    let supportedSkill;
    if (
        supportedSkillId === "agility" ||
        supportedSkillId === "smarts" ||
        supportedSkillId === "spirit" ||
        supportedSkillId === "strength" ||
        supportedSkillId === "vigor"
    ) {
        supportedAttribute = true;
    } else {
        supportedSkill = targetActor.items.find(s => s.id === supportedSkillId && s.type === "skill");
    }

    const officialClass = await swim.get_official_class()
    let chatContent

    if (action === "support") {
        if (rollWithEdge >= 4 || critFail) {
            let supportValue = rollWithEdge >= 8 ? 2 : 1;
            if (critFail) { supportValue = -2 }
            const supportMode = 2;
            const supportKey = supportedAttribute
                ? `system.attributes.${supportedSkillId}.die.modifier`
                : `@Skill{${supportedSkill.name}}[system.die.modifier]`;
            const supportEffect = targetActor.effects.find(e => e.flags?.swim?.isSupportEffect);

            if (supportEffect) {
                const relevantChangeIndex = supportEffect.changes.findIndex(c => c.key === supportKey)
                if (typeof relevantChangeIndex === "number") {
                    const newChanges = [...supportEffect.changes] //Creating a copy of the array to edit and update it.
                    const currValue = Number(supportEffect.changes[relevantChangeIndex].value)
                    newChanges[relevantChangeIndex].value = Math.min(currValue + supportValue, 4)
                    await supportEffect.update({ changes: newChanges }); //add support value but max out at 4
                } else {
                    const newChange = {
                        key: supportKey,
                        value: supportValue,
                        mode: supportMode,
                    }
                    const newChanges = [...supportEffect.changes] //Creating a copy of the array to edit and update it.
                    newChanges.push(newChange)
                    await supportEffect.update({ changes: newChanges });
                }
            } else {
                await targetActor.createEmbeddedDocuments("ActiveEffect", [{
                    label: game.i18n.localize("SWIM.gameTerm-Support"),
                    icon: "icons/skills/social/diplomacy-handshake.webp",
                    duration: {
                        "startTime": game.time._time.worldTime,
                        "seconds": null,
                        "rounds": 1,
                        "turns": null,
                        "startRound": game.combats.active ? game.combats.current.round : null,
                        "startTurn": null,
                        "type": "turns"
                    },
                    changes: [
                        {
                            key: supportKey,
                            value: supportValue,
                            mode: supportMode,
                        },
                    ],
                    flags: {
                        swim: {
                            isSupportEffect: true,
                        },
                        swade: {
                            "expiration": 2,
                            "loseTurnOnHold": false
                        }
                    },
                }]);
            }
        }
        //Chat message:
        chatContent = game.i18n.format("SWIM.chatMessage-supportResult-1", { officialClass, tokenName: token.name, rollWithEdge, targetName: targetToken.name }) + edgeTextToken
        chatContent += critFail ? game.i18n.localize("SWIM.chatMessage-supportResult-2-critFail") : game.i18n.format("SWIM.chatMessage-supportResult-2-success", { supportValue: rollWithEdge >= 8 ? 2 : 1 })
        createMessage()
    } else if (action === "test") {
        chatContent = "<br/>" + game.i18n.format("SWIM.chatMessage-testResult-1", { officialClass, tokenName: token.name, rollWithEdge, targetName: targetToken.name }) + edgeTextToken
        let edgeTextTarget = ""
        if (critFail) {
            chatContent += "<br/>" + game.i18n.localize("SWIM.chatMessage-testResult-1-critFail")
            createMessage()
        } else { resistTest() }

        async function resistTest(reroll = false, elan = false, rerollCount = 0) {
            const resistRoll = await targetActor.rollAttribute(attribute);
            let resistRollWithEdge = resistRoll.total;
            if (elan) {
                resistRollWithEdge += 2
                edgeTextTarget += `<br/><i>+ ${game.i18n.localize("SWIM.edge-elan")}</i>.`
            }
            const resistCritFail = await swim.critFail_check(
                targetActor.system.wildcard,
                resistRoll
            );
            const bennyData = await swim.check_bennies(targetToken, true);
            const targetTotalBennies = bennyData.totalBennies;

            if (resistCritFail) {
                await swim.spend_benny(targetToken, true);
                chatContent += "<br/>" + game.i18n.format("SWIM.chatMessage-testResult-2-critFail", {targetName: targetToken.name})
                applyResults()
                return;
            }

            const strongWilledEdge = token.actor.items.find(e => e.type === "edge" && e.name.toLowerCase() === game.i18n.localize("SWIM.edge-strongWilled").toLowerCase())
            if (strongWilledEdge && (attribute === "smarts" || attribute === "spirit") ) {
                resistRollWithEdge += 2
                edgeTextTarget += `<br/><i>+ ${game.i18n.localize("SWIM.edge-strongWilled")}</i>.`
            }

            if (resistRollWithEdge >= rollWithEdge) {
                chatContent += "<br/>" + game.i18n.format("SWIM.chatMessage-testResult-2-success", {targetName: targetToken.name, resistRollWithEdge})
                const retortEdge = token.actor.items.find(e => e.type === "edge" && e.name.toLowerCase() === game.i18n.localize("SWIM.edge-retort").toLowerCase()) + edgeTextTarget
                if (retortEdge && (
                        skill.name.toLowerCase() === game.i18n.localize("SWIM.skill-taunt").toLowerCase() ||
                        skill.name.toLowerCase() === game.i18n.localize("SWIM.skill-intimidation").toLowerCase()
                    ) &&
                    resistRollWithEdge - rollWithEdge >= 4
                    ) {
                    chatContent += "<br/>" + game.i18n.format("SWIM.chatMessage-testResult-3-retort", {targetName: targetToken.name, tokenName: token.name})
                    await game.succ.addCondition("distracted", token);
                }
                chatContent += "</div>"
                createMessage()
                return;
            } if (targetTotalBennies <= 0) {
                ui.notifications.warn(game.i18n.localize("SWIM.notification-noBenniesLeft"))
                chatContent += "<br/>" + game.i18n.format("SWIM.chatMessage-testResult-2-failure", {targetName: targetToken.name, resistRollWithEdge})
                chatContent += edgeTextTarget
                applyResults()
                return;
            }

            const content = game.i18n.format("SWIM.dialogue-resistReroll", { result: resistRollWithEdge, totalBennies: targetTotalBennies })

            new Dialog({
                title: game.i18n.localize("SWIM.gameTerm-Test"),
                content,
                buttons: {
                    reroll: {
                        label: game.i18n.localize("SWIM.dialogue-reroll"),
                        callback: async () => {
                            const elanEdge = token.actor.items.find(e => e.type === "edge" && e.name.toLowerCase() === game.i18n.localize("SWIM.edge-elan").toLowerCase())
                            elan = elanEdge ? true : false
                            rerollCount += 1
                            await swim.spend_benny(token, true); // Spend a Benny
                            await resistTest(skillId, true, elan, rerollCount); // Reroll
                        },
                    },
                    apply: {
                        label: game.i18n.localize("SWIM.dialogue-apply"),
                        callback: async () => {
                            chatContent += "<br/>" + game.i18n.format("SWIM.chatMessage-testResult-2-failure", {targetName: targetToken.name, resistRollWithEdge})
                            chatContent += edgeTextTarget
                            applyResults()
                        },
                    },
                },
            }).render(true);

            async function applyResults() {
                await game.succ.addCondition(selectedResult, targetToken);
                chatContent += "<br/>" + game.i18n.format("SWIM.chatMessage-testResult-3", {targetName: targetToken.name, status: game.i18n.localize(`SWIM.gameTerm-${selectedResult}`)})
                if (rollWithEdge - resistRollWithEdge >= 4) {
                    await game.succ.addCondition("shaken", targetToken);
                    chatContent += " " + game.i18n.localize("SWIM.word-and") + " " + game.i18n.localize("SWIM.gameTerm-Shaken")

                    const { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(token.actor)
                    if (shakenSFX) {
                        const volume = game.settings.get('swim', 'defaultVolume')
                        await swim.play_sfx(shakenSFX, volume, true)
                    }
                }
                chatContent += ".</div>"
                createMessage()
            }
        }
    }

    function createMessage() {
        ChatMessage.create({
            user: game.user.id,
            content: chatContent,
        });
    }
}
