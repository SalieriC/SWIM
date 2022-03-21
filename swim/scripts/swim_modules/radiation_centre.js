/*******************************************
 * Radiation Centre Macro
 * Requires the Irradiated condition.
 * version 2.1.0
 * By SalieriC#8263.
 ******************************************/
export async function radiation_centre_script() {
    const { speaker, _, __, token } = await swim.get_macro_variables()
    // Checking if at least one token is defined.
    if (!token || canvas.tokens.controlled.length > 1) {
        ui.notifications.error("Please select a token first");
        return;
    }
    if (!succ.get_condition('irradiated')) {
        if (game.user.isGM) {
            return new Dialog({
                title: "Irradiated Condition missing",
                content: `
                 <p>SWIM detected, that you have not set up the "Irradiated" condition.</p>
                 <p>This condition is required to use this macro. You can easily set it up by checking the checkbox in SWIMs configuration.</p>
                 <p>Do you want to set it up now (requires the world to be reloaded)?</p>
                 `,
                buttons: {
                    one: {
                        label: "Yes please.",
                        callback: async (_) => {
                            await game.settings.set('swim', 'irradiationSetting', true)
                            window.location.reload();
                        }
                    },
                    two: {
                        label: "No thanks.",
                    }
                }
            }).render(true)
        }
        return ui.notifications.error('Your GM has not activated the Irradiation Condition. Ask your GM to do so and try again.')
    }
    /*else if (!token.actor.data.data.additionalStats.radRes) {
        ui.notifications.error("Activate your Rad Resistance Additional Stat before using this macro.");
        return;
    }*/
    // Checking for SWADE Spices & Flavours and setting up the Benny image.
    let bennyImage = await swim.get_benny_image()
    // Setting SFX
    let fatiguedSFX = game.settings.get(
        'swim', 'fatiguedSFX');
    let radRes = token.actor.data.data.additionalStats.radRes?.value;

    // Declairing variables and constants.
    const fv = token.actor.data.data.fatigue.value;
    const fm = token.actor.data.data.fatigue.max;
    const elan = token.actor.data.items.find(function (item) {
        return item.name.toLowerCase() === "elan" && item.type === "edge";
    });
    const soldier = token.actor.data.items.find(function (item) {
        return item.name.toLowerCase() === game.i18n.localize("SWIM.edge-soldier").toLowerCase() && item.type === "edge";
    });
    //Check for actor status and adjust bennies based on edges.
    let actorLuck = token.actor.data.items.find(function (item) { return (item.name.toLowerCase() === "luck") });
    let actorGreatLuck = token.actor.data.items.find(function (item) { return (item.name.toLowerCase() === "great luck") });
    if ((token.actor.data.data.wildcard === false) && (actorGreatLuck === undefined)) {
        if ((!(actorLuck === undefined)) && (bennies > 1) && ((actorGreatLuck === undefined))) { bennies = 1; }
        else { bennies = 0; }
    }
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

        // Apply Rad Resistance Additional Stat.
        if (!radRes) { radRes = 0; }
        rollWithEdge += radRes;
        let radResVal = `${radRes}`;
        if (radRes >= 1) { radResVal = `+${radRes}`; }
        if (token.actor.data.data.additionalStats.radRes) { edgeText = edgeText + `<br/><i>including ${radResVal} from current Rad Resistance</i>.`; }

        // Roll Vigor
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
            token.actor.update({ "data.fatigue.value": newFatigue });
            if (fatiguedSFX) {
                AudioHelper.play({ src: `${fatiguedSFX}` }, true);
            }
        }
        else {
            token.actor.update({ "data.fatigue.value": fm });
            /*game.cub.addCondition("Incapacitated");
            if (incapSFX) {
                AudioHelper.play({ src: `${incapSFX}` }, true);
            }*/
            swim.mark_dead();
        }
        if (await succ.check_status(token, 'irradiated') === false) {
            await succ.apply_status(token, 'irradiated', true)
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
        content: TextEditor.enrichHTML(`<form class="swade-core">
         <p>You currently have <b>${fv}/${fm}</b> Fatigue and <b>${totalBennies}</b> Bennies.</p>
         <p><i class="fas fa-radiation"></i> @Compendium[swade-core-rules.swade-rules.S3WKO4LbfvERka9n]{Radiation} requires you to roll Vigor or you'll take <b>1 Level of Fatigue</b>.</p>
         <p>Instead you may choose to take the Level of Fatigue without a roll.</p>
     </form>`),
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
}