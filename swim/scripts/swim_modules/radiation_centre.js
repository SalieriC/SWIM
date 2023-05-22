/*******************************************
 * Radiation Centre Macro
 * version 3.0.1
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
            edgeText = edgeText + `<br/><i>+ Elan</i>.`;
        }

        // Apply Rad Resistance Additional Stat.
        if (!radRes) { radRes = 0; }
        rollWithEdge += radRes;
        let radResVal = `${radRes}`;
        if (radRes >= 1) { radResVal = `+${radRes}`; }
        else if (radRes <= -1) { radResVal = `-${radRes}`; }
        if (radRes && radRes != 0) { edgeText = edgeText + `<br/><i>including ${radResVal} from current Rad Resistance</i>.`; }

        // Roll Vigor
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
            ui.notifications.notify("You've rolled a Critical Failure! Applying Fatigue from Radiation now...");
            let chatData = `${actorAlias} rolled a <span style="font-size:150%"> Critical Failure! </span>`;
            applyFatigue();
            ChatMessage.create({ content: chatData });
        }
        else {
            if (rounded < 1) {
                let { _, __, totalBennies } = await swim.check_bennies(token)
                chatData += ` and would take a Level of Fatigue from Radiation.`;
                if (soldier && soldierSwitch === false) {
                    dialogReroll();
                } else if (totalBennies < 1) {
                    applyFatigue();
                }
                else {
                    dialogReroll();
                }
            } else if (rounded >= 1) {
                chatData += ` and takes no Fatigue from radiation.`;
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
            /*game.cub.addCondition("Incapacitated");
            if (incapSFX) {
                AudioHelper.play({ src: `${incapSFX}` }, true);
            }*/
            swim.mark_dead();
            await apply_disease_effect(token.actor)
        }
    }

    // Buttons for the main Dialogue.
    let buttonsMain = {
        one: {
            label: `<i class="fas fa-dice"></i>Roll to resist Radiation`,
            callback: () => {
                rollVigor();
            }
        },
        two: {
            label: `<i class="fas fa-radiation"></i>Apply immediately`,
            callback: () => {
                rounded = 0
                applyFatigue();
            }
        }
    }

    // Main Dialogue
    let { ___, ____, totalBennies } = await swim.check_bennies(token)
    new Dialog({
        title: 'Radiation Centre',
        content: await TextEditor.enrichHTML(`<form class="swade-core">
         <p>You currently have <b>${fv}/${fm}</b> Fatigue and <b>${totalBennies}</b> Bennies.</p>
         <p><i class="fas fa-radiation"></i> @UUID[Compendium.swade-core-rules.swade-rules.swadecor04theadv.JournalEntryPage.04radiation00000]{Radiation} requires you to roll Vigor or you'll take <b>1 Level of Fatigue</b>.</p>
         <p>Instead you may choose to take the Level of Fatigue without a roll.</p>
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
                        label: `<i class="fas fa-dice"></i>Reroll`,
                        callback: async () => {
                            soldierSwitch = true
                            rollVigor();
                        }
                    },
                    two: {
                        label: `<i class="fas fa-radiation"></i>No, apply Fatigue now`,
                        callback: () => {
                            ui.notifications.notify("Fatigue will be applied now.");
                            applyFatigue();
                        }
                    }
                }
                text = `<form class="swade-core">
                            <p>You've failed your roll</b>; you will <b>receive 1 Level of Fatigue</b>.</p>
                            <p>Do you want to use your free reroll?</p>
                        </form>`
            } else {
                text = `<form class="swade-core">
                            <p>You've failed your roll</b>; you will <b>receive 1 Level of Fatigue</b>.</p>
                            <p>Do you want to reroll your Vigor Roll (you have <b>${totalBennies} Bennies</b> left)</p?
                        </form>`
                buttons = {
                    one: {
                        label: `<i class="fas fa-dice"></i>Reroll`,
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
                        label: `<i class="fas fa-radiation"></i>No, apply Fatigue now`,
                        callback: () => {
                            ui.notifications.notify("Fatigue will be applied now.");
                            applyFatigue();
                        }
                    }
                }
            }
            new Dialog({
                title: 'Reroll',
                content: text,
                buttons: buttons,
                default: "one",
            }).render(true);
        }
        else {
            ui.notifications.notify("You have no more bennies, Fatigue will be applied now.");
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
        ChatMessage.create({
            user: game.user.id,
            content: `${game.i18n.format(game.i18n.format("SWIM.chatMessage-radPoisoning-1", {
                actorName: actor.name,
                class: 'swade-core',
                img: 'modules/succ/assets/icons/0-irradiated.svg'
            }))} @UUID[Compendium.swade-core-rules.swade-rules.swadecor04theadv.JournalEntryPage.04disease0000000#disease-categories]{${game.i18n.localize("SWIM.disease-chronic").toLowerCase()}}. 
            ${game.i18n.format(game.i18n.format("SWIM.chatMessage-radPoisoning-2", {
                actorName: actor.name,
            }))}`,
        });
        //UUID links don't fit into the game.i18n.format as the {label} is interpreted as a variable, so the chat message needs to be split in multiple parts. -.-
    }
}