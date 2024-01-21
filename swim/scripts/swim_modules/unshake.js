/*******************************************
 * Unshake macro for SWD
 * version 4.3.0
 * Original code (an eternity ago) by Shteff, altered by Forien, edited and maintained by SalieriC#8263.
 ******************************************/

export async function unshake_swd_script(effect = false) {
    let { speaker, _, __, token } = await swim.get_macro_variables()

    // No Token is Selected
    if ((!token || canvas.tokens.controlled.length > 1) && !effect) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
        return;
    } else if (effect) {
        let actor = effect.parent
        token = actor.isToken ? actor.token : canvas.scene.tokens.find(t => t.actor.id === actor.id)
        const nameKey = game.user.character?.id === actor.id ? `${game.i18n.localize("SWIM.word-you")} ${game.i18n.localize("SWIM.word-are")}` : `${token.name} ${game.i18n.localize("SWIM.word-is")}`
        ui.notifications.notify(game.i18n.format("SWIM.notification-shakenRoll", { tokenName: nameKey }));
    }

    // Checking for System Benny image.
    let bennyImage = await swim.get_benny_image()
    // Setting up SFX paths:
    const { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(token.actor)
    // Set up free rerolls:
    let freeRerolls = 0
    const oldWaysOath = token.actor.items.find(e => e.type === "hindrance" && e.name.toLowerCase() === game.i18n.localize("SWIM.hindrance-oldWaysOath-deadlands").toLowerCase())
    if (oldWaysOath) { freeRerolls = freeRerolls + 1 }

    async function rollUnshake() {

        let edgeNames = [
            game.i18n.localize("SWIM.edge-combatReflexes").toLowerCase(),
            game.i18n.localize("SWIM.ability-demon-hellfrost").toLowerCase(),
            game.i18n.localize("SWIM.ability-construct").toLowerCase(),
            game.i18n.localize("SWIM.ability-undead").toLowerCase(),
            game.i18n.localize("SWIM.ability-amorphous-theAfter").toLowerCase()
        ];
        // Making all lower case:
        edgeNames = edgeNames.map(name => name.toLowerCase())
        const undeadAE = token.actor.effects.find(ae => ae.label.toLowerCase() === game.i18n.localize("SWIM.ability-undead").toLowerCase());
        if (undeadAE && undeadAE.disabled === false) {
            edgeNames.push('undead')
        } else if (!undeadAE) {
            edgeNames.push('undead')
        }
        const actorAlias = speaker.alias;
        // ROLL SPIRIT AND CHECK COMBAT REFLEXES
        const r = await token.actor.rollAttribute('spirit');
        const edges = token.actor.items.filter(function (item) {
            return edgeNames.includes(item.name.toLowerCase()) && (item.type === "edge" || item.type === "ability");
        });

        let rollWithEdge = r.total;
        let edgeText = "";
        for (let edge of edges) {
            rollWithEdge += 2;
            edgeText += `<br/><i>+ 2 <img src="${edge.img}" alt="" width="15" height="15" style="border:0" />${edge.name}</i>`;
        }
        //Get generic actor unshake bonus and check if it is from an AE:
        const unShakeBonus = token.actor.system.attributes.spirit.unShakeBonus;
        let effectName = [];
        let effectIcon = [];
        let effectValue = [];
        if (unShakeBonus != 0 && token.actor.effects.size > 0) {
            for (let effect of token.actor.effects) {
                if (effect.disabled === false) { // only apply changes if effect is enabled
                    for (let change of effect.changes) {
                        if (change.key === "system.attributes.spirit.unShakeBonus") {
                            //Building array of effect names and icons that affect the unShakeBonus
                            effectName.push(effect.label);
                            effectIcon.push(effect.icon);
                            effectValue.push(change.value);
                        }
                    }
                }
            }
            for (let i = 0; i < effectName.length; i++) {
                // Apply mod using parseFloat() to make it a Number:
                rollWithEdge += parseFloat(effectValue[i]);
                // Change indicator in case the modifier from AE is negative:
                let indicator = "+";
                let effectMod = effectValue[i];
                if (parseFloat(effectValue[i]) < 0) {
                    indicator = "-";
                    effectMod = effectValue[i].replace("-", "");
                }
                edgeText += `<br/><i>${indicator} ${effectMod} <img src="${effectIcon[i]}" alt="" width="15" height="15" style="border:0" />${effectName[i]}</i>`;
            } //Finally, if the unShakeBonus does not come from an AE apply it generically (as of yet this is just a failsafe but makes the script future proof.)
        } else if (unShakeBonus != 0) {
            rollWithEdge += unShakeBonus;
            edgeText += game.i18n.format("SWIM.chatMessage-unshakeBonusOtherActor", { unShakeBonus: unShakeBonus });
        }

        let chatData = game.i18n.format("SWIM.chatMessage-unshakeResultRoll", { name: actorAlias, rollWithEdge: rollWithEdge })
        // Checking for a Critical Failure.
        let wildCard = true;
        if (token.actor.system.wildcard === false && token.actor.type === "npc") { wildCard = false }
        let critFail = await swim.critFail_check(wildCard, r)
        if (critFail === true) {
            ui.notifications.notify(game.i18n.localize("SWIM.notification-critFail"));
            let chatData = game.i18n.format("SWIM.chatMessage-unshakeResultCritFail", { name: actorAlias });
            ChatMessage.create({ content: chatData });
        }
        else {
            if (rollWithEdge > 3 && rollWithEdge <= 7) {
                chatData += game.i18n.localize("SWIM.chatMessage-unshakeResultNoShakenCannotAct");
                await succ.apply_status(token, 'shaken', false)
                if (unshakeSFX) { AudioHelper.play({ src: `${unshakeSFX}` }, true); }
                useBenny();
            } else if (rollWithEdge >= 8) {
                chatData += game.i18n.localize("SWIM.chatMessage-unshakeResultNoShakenCanAct");
                await succ.apply_status(token, 'shaken', false)
                if (unshakeSFX) { AudioHelper.play({ src: `${unshakeSFX}` }, true); }
            } else {
                chatData += game.i18n.localize("SWIM.chatMessage-unshakeResultStillShaken");
                useBenny();
            }
            chatData += ` ${edgeText}`;
            ChatMessage.create({ content: chatData });
        }
    }

    async function useBenny() {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        // Prepare the dialogue:
        let content = game.i18n.format("SWIM.dialogue-spendBennyText", { totalBennies: totalBennies })
        let buttons = {
            bennyButton: {
                label: game.i18n.localize("SWIM.dialogue-yes"),
                callback: async (_) => {
                    await swim.spend_benny(token);
                    //Chat Message to let the everyone knows a benny was spent
                    ChatMessage.create({
                        user: game.user.id,
                        content: game.i18n.format("SWIM.dialogue-spentBennyToUnshake", { bennyImage: bennyImage, player: game.user.name, name: token.name }),
                    });
                    await succ.apply_status(token, 'shaken', false)
                }
            }
        }
        // Add the free reroll button:
        if (freeRerolls > 0) {
            content += game.i18n.localize("SWIM.dialogue-freeRerollText")
            buttons.freeRerollButton = {
                label: game.i18n.localize("SWIM.button-freeReroll"),
                callback: (_) => {
                    freeRerolls = freeRerolls - 1
                    rollUnshake()
                },
            }
        }
        // Adding the cancelButton last:
        buttons.cancelButton = {
            label: game.i18n.localize("SWIM.dialogue-no"),
            callback: (_) => { return; },
        }

        if (totalBennies > 0 || freeRerolls > 0) {
            new Dialog({
                title: game.i18n.localize("SWIM.dialogue-spendBennyTitle"),
                content: content,
                buttons: buttons,
                default: "one"
            }).render(true)
        }
        else {
            return;
        }
    }

    if (await succ.check_status(token, 'shaken') === true) {
        rollUnshake()
    } else if (token) {
        await swim.shake(token)
    }
    /// v.3.9.2 Original code by Shteff, altered by Forien and SalieriC#8263, thanks to Spacemandev for the help as well. Fixed by hirumatto.
}

/*******************************************
 * Unshake macro for SWADE
 * version 4.3.0
 * Original code (an eternity ago) by Shteff, altered by Forien, edited and maintained by SalieriC#8263.
 ******************************************/

export async function unshake_swade_script(effect = false) {
    let { speaker, _, __, token } = await swim.get_macro_variables()

    // No Token is Selected
    if ((!token || canvas.tokens.controlled.length > 1) && !effect) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
        return;
    } else if (effect) {
        let actor = effect.parent
        token = actor.isToken ? actor.token : canvas.scene.tokens.find(t => t.actor.id === actor.id)
        const nameKey = game.user.character?.id === actor.id ? `${game.i18n.localize("SWIM.word-you")} ${game.i18n.localize("SWIM.word-are")}` : `${token.name} ${game.i18n.localize("SWIM.word-is")}`
        ui.notifications.notify(game.i18n.format("SWIM.notification-shakenRoll", { tokenName: nameKey }));
    }

    // Checking for system Benny image.
    let bennyImage = await swim.get_benny_image()

    // Setting up SFX paths:
    const { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(token.actor)

    // Set up free rerolls:
    let freeRerolls = 0
    const oldWaysOath = token.actor.items.find(e => e.type === "hindrance" && e.name.toLowerCase() === game.i18n.localize("SWIM.hindrance-oldWaysOath-deadlands").toLowerCase())
    if (oldWaysOath) { freeRerolls = freeRerolls + 1 }

    async function rollUnshake() {

        let edgeNames = [
            game.i18n.localize("SWIM.edge-combatReflexes").toLowerCase(),
            game.i18n.localize("SWIM.ability-demon-hellfrost").toLowerCase(),
            game.i18n.localize("SWIM.ability-construct").toLowerCase(),
            game.i18n.localize("SWIM.ability-undead").toLowerCase(),
            game.i18n.localize("SWIM.ability-amorphous-theAfter").toLowerCase()
        ];
        // Making all lower case:
        edgeNames = edgeNames.map(name => name.toLowerCase())
        const undeadAE = token.actor.effects.find(ae => ae.label.toLowerCase() === game.i18n.localize("SWIM.ability-undead").toLowerCase());
        if (undeadAE && undeadAE.disabled === false) {
            edgeNames.push('undead')
        } else if (!undeadAE) {
            edgeNames.push('undead')
        }
        const actorAlias = speaker.alias;
        // ROLL SPIRIT AND CHECK COMBAT REFLEXES
        const r = await token.actor.rollAttribute('spirit');
        const edges = token.actor.items.filter(function (item) {
            return edgeNames.includes(item.name.toLowerCase()) && (item.type === "edge" || item.type === "ability");
        });

        let rollWithEdge = r.total;
        let edgeText = "";
        for (let edge of edges) {
            rollWithEdge += 2;
            edgeText += `<br/><i>+ 2 <img src="${edge.img}" alt="" width="15" height="15" style="border:0" />${edge.name}</i>`;
        }
        //Get generic actor unshake bonus and check if it is from an AE:
        const unShakeBonus = token.actor.system.attributes.spirit.unShakeBonus;
        let effectName = [];
        let effectIcon = [];
        let effectValue = [];
        if (unShakeBonus != 0 && token.actor.effects.size > 0) {
            for (let effect of token.actor.effects) {
                if (effect.disabled === false) { // only apply changes if effect is enabled
                    for (let change of effect.changes) {
                        if (change.key === "system.attributes.spirit.unShakeBonus") {
                            //Building array of effect names and icons that affect the unShakeBonus
                            effectName.push(effect.label);
                            effectIcon.push(effect.icon);
                            effectValue.push(change.value);
                        }
                    }
                }
            }
            for (let i = 0; i < effectName.length; i++) {
                // Apply mod using parseFloat() to make it a Number:
                rollWithEdge += parseFloat(effectValue[i]);
                // Change indicator in case the modifier from AE is negative:
                let indicator = "+";
                let effectMod = effectValue[i];
                if (parseFloat(effectValue[i]) < 0) {
                    indicator = "-";
                    effectMod = effectValue[i].replace("-", "");
                }
                edgeText += `<br/><i>${indicator} ${effectMod} <img src="${effectIcon[i]}" alt="" width="15" height="15" style="border:0" />${effectName[i]}</i>`;
            } //Finally, if the unShakeBonus does not come from an AE apply it generically (as of yet this is just a failsafe but makes the script future proof.)
        } else if (unShakeBonus != 0) {
            rollWithEdge += unShakeBonus;
            edgeText += game.i18n.format("SWIM.dialogue-SWIM.chatMessage-unshakeBonusOtherActor", { unShakeBonus: unShakeBonus });
        }

        let chatData = game.i18n.format("SWIM.chatMessage-unshakeResultRoll", { name: actorAlias, rollWithEdge: rollWithEdge });
        // Checking for a Critical Failure.
        let wildCard = true;
        if (token.actor.system.wildcard === false && token.actor.type === "npc") { wildCard = false }
        let critFail = await swim.critFail_check(wildCard, r)
        if (critFail === true) {
            ui.notifications.notify(game.i18n.localize("SWIM.notification-critFail"));
            let chatData = game.i18n.format("SWIM.chatMessage-unshakeResultCritFail", { name: actorAlias });
            ChatMessage.create({ content: chatData });
        }
        else {
            if (rollWithEdge <= 3) {
                chatData += game.i18n.localize("SWIM.chatMessage-unshakeResultRemainShaken");
                useBenny();
            } else if (rollWithEdge >= 4) {
                chatData += game.i18n.localize("SWIM.chatMessage-unshakeResultNoShakenCanAct");
                await succ.apply_status(token, 'shaken', false)
                if (unshakeSFX) { AudioHelper.play({ src: `${unshakeSFX}` }, true); }
            }
            chatData += ` ${edgeText}`;
            ChatMessage.create({ content: chatData });
        }
    }

    async function useBenny() {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        // Prepare the dialogue:
        let content = game.i18n.format("SWIM.dialogue-spendBennyText", { totalBennies: totalBennies })
        let buttons = {
            bennyButton: {
                label: game.i18n.localize("SWIM.dialogue-yes"),
                callback: async (_) => {
                    await swim.spend_benny(token);
                    //Chat Message to let the everyone knows a benny was spent
                    ChatMessage.create({
                        user: game.user.id,
                        content: game.i18n.format("SWIM.dialogue-spentBennyToUnshake", { bennyImage: bennyImage, player: game.user.name, name: token.name }),
                    });
                    await succ.apply_status(token, 'shaken', false)
                }
            }
        }
        // Add the free reroll button:
        if (freeRerolls > 0) {
            content += game.i18n.localize("SWIM.dialogue-freeRerollText")
            buttons.freeRerollButton = {
                label: game.i18n.localize("SWIM.button-freeReroll"),
                callback: (_) => {
                    freeRerolls = freeRerolls - 1
                    rollUnshake()
                },
            }
        }
        // Adding the cancelButton last:
        buttons.cancelButton = {
            label: game.i18n.localize("SWIM.dialogue-no"),
            callback: (_) => { return; },
        }

        if (totalBennies > 0 || freeRerolls > 0) {
            new Dialog({
                title: game.i18n.localize("SWIM.dialogue-spendBennyTitle"),
                content: content,
                buttons: buttons,
                default: "one"
            }).render(true)
        }
        else {
            return;
        }
    }

    if (await succ.check_status(token, 'shaken') === true) {
        rollUnshake()
    } else if (token) {
        await swim.shake(token)
    }
}

/*******************************************
 * Unshake macro for both Versions
 * version 5.0.0
 * By SalieriC
 * Original code (an eternity ago) by Shteff, altered by Forien.
 ******************************************/

export async function unshake_script(effect, options) {
    let { speaker, _, __, token } = await swim.get_macro_variables()

    // No Token is Selected
    if ((!token || canvas.tokens.controlled.length > 1) && !effect) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
        return;
    } else if (effect) {
        let actor = effect.parent
        token = actor.isToken ? actor.token : canvas.scene.tokens.find(t => t.actor.id === actor.id)
        const nameKey = game.user.character?.id === actor.id ? `${game.i18n.localize("SWIM.word-you")} ${game.i18n.localize("SWIM.word-are")}` : `${token.name} ${game.i18n.localize("SWIM.word-is")}`
        ui.notifications.notify(game.i18n.format("SWIM.notification-shakenRoll", { tokenName: nameKey }));
    }

    // Checking for System Benny image.
    let bennyImage = await swim.get_benny_image()
    // Setting up SFX paths:
    const { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(token.actor)
    // Set up free rerolls:
    let freeRerolls = 0
    const oldWaysOath = token.actor.items.find(e => e.type === "hindrance" && e.name.toLowerCase() === game.i18n.localize("SWIM.hindrance-oldWaysOath-deadlands").toLowerCase())
    if (oldWaysOath) { freeRerolls = freeRerolls + 1 }

    async function rollUnshake() {

        let edgeNames = [
            game.i18n.localize("SWIM.edge-combatReflexes").toLowerCase(),
            game.i18n.localize("SWIM.ability-demon-hellfrost").toLowerCase(),
            game.i18n.localize("SWIM.ability-construct").toLowerCase(),
            game.i18n.localize("SWIM.ability-undead").toLowerCase(),
            game.i18n.localize("SWIM.ability-amorphous-theAfter").toLowerCase()
        ];
        // Making all lower case:
        edgeNames = edgeNames.map(name => name.toLowerCase())
        const undeadAE = token.actor.effects.find(ae => ae.label.toLowerCase() === game.i18n.localize("SWIM.ability-undead").toLowerCase());
        if (undeadAE && undeadAE.disabled === false) {
            edgeNames.push('undead')
        } else if (!undeadAE) {
            edgeNames.push('undead')
        }
        const actorAlias = speaker.alias;
        // ROLL SPIRIT AND CHECK COMBAT REFLEXES
        const r = await token.actor.rollAttribute('spirit');
        const edges = token.actor.items.filter(function (item) {
            return edgeNames.includes(item.name.toLowerCase()) && (item.type === "edge" || item.type === "ability");
        });

        let rollWithEdge = r.total;
        let edgeText = "";
        for (let edge of edges) {
            rollWithEdge += 2;
            edgeText += `<br/><i>+ 2 <img src="${edge.img}" alt="" width="15" height="15" style="border:0" />${edge.name}</i>`;
        }
        //Get generic actor unshake bonus and check if it is from an AE:
        const unShakeBonus = token.actor.system.attributes.spirit.unShakeBonus;
        let effectName = [];
        let effectIcon = [];
        let effectValue = [];
        if (unShakeBonus != 0 && token.actor.effects.size > 0) {
            for (let effect of token.actor.effects) {
                if (effect.disabled === false) { // only apply changes if effect is enabled
                    for (let change of effect.changes) {
                        if (change.key === "system.attributes.spirit.unShakeBonus") {
                            //Building array of effect names and icons that affect the unShakeBonus
                            effectName.push(effect.label);
                            effectIcon.push(effect.icon);
                            effectValue.push(change.value);
                        }
                    }
                }
            }
            for (let i = 0; i < effectName.length; i++) {
                // Apply mod using parseFloat() to make it a Number:
                rollWithEdge += parseFloat(effectValue[i]);
                // Change indicator in case the modifier from AE is negative:
                let indicator = "+";
                let effectMod = effectValue[i];
                if (parseFloat(effectValue[i]) < 0) {
                    indicator = "-";
                    effectMod = effectValue[i].replace("-", "");
                }
                edgeText += `<br/><i>${indicator} ${effectMod} <img src="${effectIcon[i]}" alt="" width="15" height="15" style="border:0" />${effectName[i]}</i>`;
            } //Finally, if the unShakeBonus does not come from an AE apply it generically (as of yet this is just a failsafe but makes the script future proof.)
        } else if (unShakeBonus != 0) {
            rollWithEdge += unShakeBonus;
            edgeText += game.i18n.format("SWIM.chatMessage-unshakeBonusOtherActor", { unShakeBonus: unShakeBonus });
        }

        let chatData = game.i18n.format("SWIM.chatMessage-unshakeResultRoll", { name: actorAlias, rollWithEdge: rollWithEdge })
        // Checking for a Critical Failure.
        let wildCard = true;
        if (token.actor.system.wildcard === false && token.actor.type === "npc") { wildCard = false }
        let critFail = await swim.critFail_check(wildCard, r)
        if (critFail === true) {
            ui.notifications.notify(game.i18n.localize("SWIM.notification-critFail"));
            let chatData = game.i18n.format("SWIM.chatMessage-unshakeResultCritFail", { name: actorAlias });
            ChatMessage.create({ content: chatData });
        }
        else {
            if (options.version === "SWD") {
                if (rollWithEdge > 3 && rollWithEdge <= 7) {
                    chatData += game.i18n.localize("SWIM.chatMessage-unshakeResultNoShakenCannotAct");
                    await succ.apply_status(token, 'shaken', false)
                    if (unshakeSFX) { AudioHelper.play({ src: `${unshakeSFX}` }, true); }
                    useBenny();
                } else if (rollWithEdge >= 8) {
                    chatData += game.i18n.localize("SWIM.chatMessage-unshakeResultNoShakenCanAct");
                    await succ.apply_status(token, 'shaken', false)
                    if (unshakeSFX) { AudioHelper.play({ src: `${unshakeSFX}` }, true); }
                } else {
                    chatData += game.i18n.localize("SWIM.chatMessage-unshakeResultStillShaken");
                    useBenny();
                }
            } else if (options.version === "SWADE") {
                if (rollWithEdge <= 3) {
                    chatData += game.i18n.localize("SWIM.chatMessage-unshakeResultRemainShaken");
                    useBenny();
                } else if (rollWithEdge >= 4) {
                    chatData += game.i18n.localize("SWIM.chatMessage-unshakeResultNoShakenCanAct");
                    await succ.apply_status(token, 'shaken', false)
                    if (unshakeSFX) { AudioHelper.play({ src: `${unshakeSFX}` }, true); }
                }
            }
            
            chatData += ` ${edgeText}`;
            ChatMessage.create({ content: chatData });
        }
    }

    async function useBenny() {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        // Prepare the dialogue:
        let content = game.i18n.format("SWIM.dialogue-spendBennyText", { totalBennies: totalBennies })
        let buttons = {
            bennyButton: {
                label: game.i18n.localize("SWIM.dialogue-yes"),
                callback: async (_) => {
                    await swim.spend_benny(token);
                    //Chat Message to let the everyone knows a benny was spent
                    ChatMessage.create({
                        user: game.user.id,
                        content: game.i18n.format("SWIM.dialogue-spentBennyToUnshake", { bennyImage: bennyImage, player: game.user.name, name: token.name }),
                    });
                    await succ.apply_status(token, 'shaken', false)
                }
            }
        }
        // Add the free reroll button:
        if (freeRerolls > 0) {
            content += game.i18n.localize("SWIM.dialogue-freeRerollText")
            buttons.freeRerollButton = {
                label: game.i18n.localize("SWIM.button-freeReroll"),
                callback: (_) => {
                    freeRerolls = freeRerolls - 1
                    rollUnshake()
                },
            }
        }
        // Adding the cancelButton last:
        buttons.cancelButton = {
            label: game.i18n.localize("SWIM.dialogue-no"),
            callback: (_) => { return; },
        }

        if (totalBennies > 0 || freeRerolls > 0) {
            new Dialog({
                title: game.i18n.localize("SWIM.dialogue-spendBennyTitle"),
                content: content,
                buttons: buttons,
                default: "one"
            }).render(true)
        }
        else {
            return;
        }
    }

    if (await succ.check_status(token, 'shaken') === true) {
        rollUnshake()
    } else if (token) {
        await swim.shake(token)
    }
}