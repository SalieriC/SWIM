/*******************************************
 * Radiation Centre Macro
 * version 3.1.1
 * By SalieriC#8263.
 ******************************************/
export async function radiation_centre_script() {
    const { speaker, _, __, token } = await swim.get_macro_variables()
    // Checking if at least one token is defined.
    if (!token || canvas.tokens.controlled.length > 1) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
        return;
    }
    // Checking for SWADE Spices & Flavours and setting up the Benny image.
    let bennyImage = await swim.get_benny_image()
    // Setting SFX
    const { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(token.actor)
    let radRes = token.actor.flags?.swim?.config?.radRes;

    // Declairing variables and constants.
    const fv = token.actor.system.fatigue.value;
    const fm = token.actor.system.fatigue.max;
    const elan = token.actor.items.find(function (item) {
        return item.name.toLowerCase() === "elan" && item.type === "edge";
    });
    const soldier = token.actor.items.find(function (item) {
        return item.name.toLowerCase() === game.i18n.localize("SWIM.edge-soldier").toLowerCase() && item.type === "edge";
    });
    let rounded;
    let elanBonus;
    let newFatigue;
    let soldierSwitch = false

    // This is the main function that handles the Vigor roll.
    async function rollVigor() {

        const edgeNames = [];
        const actorAlias = speaker.alias;
        // Roll Vigor and check for Iron Jaw.
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
            edgeText = edgeText + `<br/><i>+ ${game.i18n.localize("SWIM.edge-elan")}</i>.`;
        }

        // Apply Rad Resistance Additional Stat.
        if (!radRes) { radRes = 0; }
        rollWithEdge += radRes;
        let radResVal = `${radRes}`;
        if (radRes >= 1) { radResVal = `+${radRes}`; }
        else if (radRes <= -1) { radResVal = `-${radRes}`; }
        if (radRes && radRes != 0) { edgeText = edgeText + `${game.i18n.format("SWIM.chatMessage-includingRadRes", {radResVal: radResVal})}`; }

        // Roll Vigor
        let chatData = game.i18n.format("SWIM.chatMessage-unshakeResultRoll", {name: actorAlias, rollWithEdge: rollWithEdge});
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
            ui.notifications.notify(game.i18n.localize("SWIM.notification-critFailApplyFatigue"));
            let chatData = game.i18n.format("SWIM.chatMessage-unshakeResultCritFail", {name: actorAlias});
            applyFatigue();
            ChatMessage.create({ content: chatData });
        }
        else {
            if (rounded < 1) {
                let { _, __, totalBennies } = await swim.check_bennies(token)
                chatData += ` ${game.i18n.format("SWIM.chatMessage-wouldTakeFatigueFromSource", {source: game.i18n.localize("SWIM.hazard-radiation").toLowerCase()})}`;
                if (soldier && soldierSwitch === false) {
                    dialogReroll();
                } else if (totalBennies < 1) {
                    applyFatigue();
                }
                else {
                    dialogReroll();
                }
            } else if (rounded >= 1) {
                chatData += ` ${game.i18n.format("SWIM.chatMessage-takesNoFatigueFromSource", {source: game.i18n.localize("SWIM.hazard-radiation").toLowerCase()})}`;
            }
            chatData += ` ${edgeText}`;

            await ChatMessage.create({ content: chatData });
        }
    }

    // Apply Fatigue
    async function applyFatigue() {
        newFatigue = fv + 1;
        if (newFatigue <= fm) {
            token.actor.update({ "system.fatigue.value": newFatigue });
            if (fatiguedSFX) {
                AudioHelper.play({ src: `${fatiguedSFX}` }, true);
            }
        }
        else {
            token.actor.update({ "system.fatigue.value": fm });
            swim.mark_dead();
            await apply_disease_effect(token.actor)
        }
    }

    // Buttons for the main Dialogue.
    let buttonsMain = {
        one: {
            label: `<i class="fas fa-dice"></i>${game.i18n.format("SWIM.dialogue-rollToResistSource", {source: game.i18n.localize("SWIM.hazard-radiation")})}`,
            callback: () => {
                rollVigor();
            }
        },
        two: {
            label: `<i class="fas fa-radiation"></i>${game.i18n.localize("SWIM.dialogue-applyFatigue")}`,
            callback: () => {
                rounded = 0
                applyFatigue();
            }
        }
    }

    // Main Dialogue
    let { ___, ____, totalBennies } = await swim.check_bennies(token)
    let radiationLink = await swim.get_official_journal_link("radiation")
    if (radiationLink) { radiationLink += `{${game.i18n.localize("SWIM.hazard-radiation")}}` }
    else {radiationLink = game.i18n.localize("SWIM.hazard-radiation")}
    new Dialog({
        title: 'Radiation Centre',
        content: await TextEditor.enrichHTML(`<form class="swade-core">
         ${game.i18n.format("SWIM.dialogue-radiationCentre-1", {fv: fv, fm: fm, totalBennies: totalBennies})}
         <p><i class="fas fa-radiation"></i> ${radiationLink} ${game.i18n.localize("SWIM.dialogue-radiationCentre-2")}
     </form>`, { async: true }),
        buttons: buttonsMain,
        default: "one",
    }).render(true);

    // Dialog to be rendered if roll failed.
    async function dialogReroll() {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        if (totalBennies > 0 || (soldier && soldierSwitch === false)) {
            let buttons
            let text
            if (soldier && soldierSwitch === false) {
                buttons = {
                    one: {
                        label: `<i class="fas fa-dice"></i>${game.i18n.localize("SWIM.dialogue-reroll")}`,
                        callback: async () => {
                            soldierSwitch = true
                            rollVigor();
                        }
                    },
                    two: {
                        label: `<i class="fas fa-radiation"></i>${game.i18n.localize("SWIM.dialogue-decisionToApplyFatigue")}`,
                        callback: () => {
                            ui.notifications.notify(game.i18n.localize("SWIM.notification-applyFatigue"));
                            applyFatigue();
                        }
                    }
                }
                text = `<form class="swade-core">
                            ${game.i18n.localize("SWIM.dialogue-failedFatigueRoll-decisionFreeReroll")}
                        </form>`
            } else {
                text = `<form class="swade-core">
                            ${game.i18n.format("SWIM.dialogue-failedFatigueRoll-decisionBennyReroll", {totalBennies: totalBennies})}
                        </form>`
                buttons = {
                    one: {
                        label: `<i class="fas fa-dice"></i>${game.i18n.localize("SWIM.dialogue-reroll")}`,
                        callback: async () => {
                            let message = true
                            await swim.spend_benny(token, message)
                            if (!!elan) {
                                elanBonus = 2;
                            }
                            rollVigor();
                        }
                    },
                    two: {
                        label: `<i class="fas fa-radiation"></i>${game.i18n.localize("SWIM.dialogue-decisionToApplyFatigue")}`,
                        callback: () => {
                            ui.notifications.notify(game.i18n.localize("SWIM.notification-applyFatigue"));
                            applyFatigue();
                        }
                    }
                }
            }
            new Dialog({
                title: game.i18n.localize("SWIM.dialogue-reroll"),
                content: text,
                buttons: buttons,
                default: "one",
            }).render(true);
        }
        else {
            ui.notifications.notify(game.i18n.localize("SWIM.dialogue-outOfBenniesApplyFatigue"));
            applyFatigue();
        }
    }

    async function apply_disease_effect(actor) {
        //Target is incapacitated by Radiation, thus apply the chronic disease unless already present:
        const radPoisoningEfect = actor.effects.find(e => e.flags.swim?.isDisease && e.flags.swim?.diseaseData?.isRadPoisoning)
        if (radPoisoningEfect) {
            console.log("SWIM | Actor already got Radiation Poisoning, no effect applied.")
            return
        }
        const effectData = {
            "label": `${game.i18n.localize("SWIM.disease-chronic")}: ${game.i18n.localize("SWIM.disease-radPoisoning")}`,
            "_id": randomID(16),
            "changes": [],
            "disabled": false,
            "duration": {
                "startTime": game.time.worldTime,
                "seconds": null,
                "combat": null,
                "rounds": null,
                "turns": null,
                "startRound": null,
                "startTurn": null
            },
            "icon": "modules/succ/assets/icons/0-irradiated.svg",
            "origin": null,
            "tint": null,
            "transfer": false,
            "flags": {
                "swade": {
                    "expiration": null,
                    "loseTurnOnHold": false
                },
                "swim": {
                    isDisease: true,
                    diseaseData: {
                        isChronic: true,
                        isRadPoisoning: true,
                        name: "Radiation Poisoning"
                    }
                }
            }
        }
        await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
        ui.notifications.warn(game.i18n.localize("SWIM.notification.diseaseWarning"))
        //Chat Message to let the everyone know what happened:
        let diseaseLink = await swim.get_official_journal_link('disease_categories')
        if (diseaseLink) { diseaseLink += `{${game.i18n.localize("SWIM.disease-chronic").toLowerCase()}}` }
        else { diseaseLink = game.i18n.localize("SWIM.disease-chronic").toLowerCase() }
        ChatMessage.create({
            user: game.user.id,
            content: `${game.i18n.format(game.i18n.format("SWIM.chatMessage-radPoisoning-1", {
                actorName: actor.name,
                class: 'swade-core',
                img: 'modules/succ/assets/icons/0-irradiated.svg'
            }))} ${diseaseLink}. 
            ${game.i18n.format(game.i18n.format("SWIM.chatMessage-radPoisoning-2", {
                actorName: actor.name,
            }))}`,
        });
        //UUID links don't fit into the game.i18n.format as the {label} is interpreted as a variable, so the chat message needs to be split in multiple parts. -.-
    }
}