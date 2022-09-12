/*******************************************
 * Unstun macro for SWADE
 * version v.4.2.0
 * Made and maintained by SalieriC#8263 using original Code from Shteff.
 ******************************************/

export async function unstun_script(effect = false) {
    let { speaker, _, __, token } = await swim.get_macro_variables()

    // No Token is Selected
    if ((!token || canvas.tokens.controlled.length > 1) && !effect) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
        return;
    } else if (effect) {
        let actor = effect.parent
        token = actor.isToken ? actor.token : canvas.scene.tokens.find(t => t.actor.id === actor.id)
        const nameKey = game.user.character.id === actor.id ? `${game.i18n.localize("SWIM.word-you")} ${game.i18n.localize("SWIM.word-are")}` : `${token.name} ${game.i18n.localize("SWIM.word-is")}`
        ui.notifications.notify(game.i18n.format("SWIM.notification-stunnedRoll", {tokenName: nameKey}));
    }

    // Setting up SFX path.
    let stunSFX = game.settings.get(
        'swim', 'stunSFX');

    let unshakeSFX;
    if (token.actor.system.additionalStats.sfx) {
        let sfxSequence = token.actor.system.additionalStats.sfx.value.split("|");
        unshakeSFX = sfxSequence[2];
    }

    // Checking for system Benny image.
    let bennyImage = await swim.get_benny_image()

    //Checking for Elan
    const elan = token.actor.data.items.find(function (item) {
        return item.name.toLowerCase() === "elan" && item.type === "edge";
    });
    let elanBonus;

    async function rollUnstun() {

        const edgeNames = [game.i18n.localize("SWIM.edge-combatReflexes").toLowerCase()];
        const actorAlias = speaker.alias;
        // ROLL VIGOR AND CHECK COMBAT REFLEXES
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

        //Get generic actor unstun bonus and check if it is from an AE:
        let effectName = [];
        let effectIcon = [];
        let effectValue = [];
        if (token.actor.data.effects.size > 0) {
            for (let effect of token.actor.data.effects) {
                if (effect.data.disabled === false && !edgeNames.includes(effect.data.label)) { // only apply changes if effect is enabled and not made by a recognised Edge.
                    for (let change of effect.data.changes) {
                        if (change.key === "SWIM.unStunMod") {
                            //Building array of effect names and icons that affect the unStunBonus
                            effectName.push(effect.data.label);
                            effectIcon.push(effect.data.icon);
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
            }
        }

        // Apply +2 if Elan is present and if it is a reroll.
        if (typeof elanBonus === "number") {
            rollWithEdge += 2;
            edgeText = edgeText + `<br/><i>+ Elan</i>.`;
        }

        let chatData = `${actorAlias} rolled <span style="font-size:150%"> ${rollWithEdge} </span>`;
        // Checking for a Critical Failure.
        let wildCard = true;
        if (token.actor.system.wildcard === false && token.actor.type === "npc") { wildCard = false }
        let critFail = await swim.critFail_check(wildCard, r)
        if (critFail === true) {
            ui.notifications.notify("You've rolled a Critical Failure!");
            let chatData = `${actorAlias} rolled a <span style="font-size:150%"> Critical Failure! </span>`;
            ChatMessage.create({ content: chatData });
        }
        else {
            if (rollWithEdge > 3 && rollWithEdge <= 7) {
                chatData += ` and is no longer Stunned but remains Vulnerable until end of next turn.`;
                await succ.apply_status(token, 'vulnerable', true)
                await succ.apply_status(token, 'stunned', false)
                if (unshakeSFX) { AudioHelper.play({ src: `${unshakeSFX}` }, true); }
                useBenny();
            } else if (rollWithEdge >= 8) {
                chatData += `, is no longer Stunned and looses Vulnerable after the turn.`;
                let delay = 100
                await succ.apply_status(token, 'distracted', false)
                await swim.wait(delay)
                await succ.apply_status(token, 'stunned', false)
                if (unshakeSFX) { AudioHelper.play({ src: `${unshakeSFX}` }, true); }
            } else {
                chatData += ` and remains Stunned.`;
                useBenny();
            }
            chatData += ` ${edgeText}`;
            ChatMessage.create({ content: chatData });
        }
    }

    async function useBenny() {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        if (totalBennies > 0) {
            new Dialog({
                title: 'Spend a Benny?',
                content: `Do you want to spend a Benny to reroll? (You have ${totalBennies} Bennies left.)`,
                buttons: {
                    one: {
                        label: "Yes.",
                        callback: async (_) => {
                            await swim.spend_benny(token);
                            if (!!elan) {
                                elanBonus = 2;
                            }
                            rollUnstun();
                        }
                    },
                    two: {
                        label: "No.",
                        callback: (_) => { return; },
                    }
                },
                default: "one"
            }).render(true)
        }
        else {
            return;
        }
    }

    if (await succ.check_status(token, 'stunned') === true) {
        rollUnstun()
    } else if (token) {
        if (await succ.check_status(token, 'stunned') === false) {
            await succ.apply_status(token, 'stunned', true)
        };

        if (await succ.check_status(token, 'prone') === false) {
            await succ.apply_status(token, 'prone', true)
        };
        await succ.apply_status(token, 'distracted', true)
        await succ.apply_status(token, 'vulnerable', true)
        if (stunSFX) {
            AudioHelper.play({ src: `${stunSFX}` }, true);
        }
    }
}