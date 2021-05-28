main();

function main() {
    // Checking if at least one token is defined.
    if (canvas.tokens.controlled.length === 0) {
        ui.notifications.error("Please select a token first");
        return;
    }
    // Checking for SWADE Spices & Flavours and setting up the Benny image.
    let bennyImage = "icons/commodities/currency/coin-embossed-octopus-gold.webp";
    if (game.modules.get("swade-spices")?.active) {
        let benny_Back = game.settings.get(
            'swade-spices', 'bennyBack');
        if (benny_Back) {
            bennyImage = benny_Back;
        }
    }
    // Setting SFX
    let woundedSFX = game.settings.get(
        'swim', 'woundedSFX');
    let incapSFX = game.settings.get(
        'swim', 'incapSFX');
    // Injury Table for Gritty Damage
    let grit = game.settings.get(
        'swim', 'grittyDamage');
    let injuryTable = game.settings.get(
        'swim', 'injuryTable');

    // Check if a token is selected.
    if (!token || canvas.tokens.controlled.length > 1) {
        ui.notifications.error("Please select a single token first.");
    }

    // Declairing variables and constants.
    const wv = token.actor.data.data.wounds.value;
    const wm = token.actor.data.data.wounds.max;
    const ppv = token.actor.data.data.powerPoints.value;
    const holyWarr = token.actor.data.items.find(function (item) {
        return ((item.name.toLowerCase() === "holy warrior") || (item.name.toLowerCase() === "unholy warrior")) && item.type === "edge";
    });
    const elan = token.actor.data.items.find(function (item) {
        return item.name.toLowerCase() === "elan" && item.type === "edge";
    });
    let bennies = token.actor.data.data.bennies.value;
    let bv;
    let numberWounds;
    let numberPP;
    let rounded;
    let elanBonus;
    let newWounds;

    // This is the main function that handles the Vigor roll.
    async function rollSoak() {

        const edgeNames = ['iron jaw', 'thick fur'];
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

        // If Holy Warrior or Unholy Warrior is used: Include the amount of PPs used as a bonus to the roll.
        if (typeof numberPP === "number") {
            rollWithEdge += numberPP;
            edgeText = edgeText + `<br/><i>+ ${numberPP}</i> from spent Power Points.`;
        }

        // Apply +2 if Elan is present and if it is a reroll.
        if (typeof elanBonus === "number") {
            rollWithEdge += 2;
            edgeText = edgeText + `<br/><i>+ Elan</i>.`;
        }

        // Roll Vigor including +2 if Iron Jaw is present, amount of PPs used as modifier if Holy Warrior or Unholy Warrior was used and another +2 if this is a reroll.
        let chatData = `${actorAlias} rolled <span style="font-size:150%"> ${rollWithEdge} </span>`;
        rounded = Math.floor(rollWithEdge / 4);

        // Making rounded 0 if it would be negative.
        if (rounded < 0) {
            rounded = 0;
        }

        // Checking for a Critical Failure.
        if (isSame_bool(r.dice) && isSame_numb(r.dice) === 1) {
            ui.notifications.notify("You've rolled a Critical Failure! Applying wounds now...");
            let chatData = `${actorAlias} rolled a <span style="font-size:150%"> Critical Failure! </span>`;
            applyWounds();
            ChatMessage.create({ content: chatData });
        }
        else {
            if (rounded < 1) {
                bv = checkBennies();
                chatData += ` and is unable to soak any Wounds.`;
                if (bv < 1) {
                    applyWounds();
                }
                else {
                    dialogReroll();
                }
            } else if (rounded < numberWounds) {
                chatData += ` and soaks ${rounded} of his Wounds.`;
                if (bv < 1) {
                    applyWounds();
                }
                else {
                    dialogReroll();
                };
            } else if (rounded >= numberWounds) {
                chatData += ` and soaks all of his Wounds.`;
                if (token.actor.data.data.status.isShaken === true) {
                    token.actor.update({ "data.status.isShaken": false });
                }
            }
            chatData += ` ${edgeText}`;

            ChatMessage.create({ content: chatData });
        }
    }

    // Functions to determine a critical failure. This one checks if all dice rolls are the same.
    function isSame_bool(d = []) {
        return d.reduce((c, a, i) => {
            if (i === 0) return true;
            return c && a.total === d[i - 1].total;
        }, true);
    }

    // Functions to determine a critical failure. This one checks what the number of the "same" was.
    function isSame_numb(d = []) {
        return d.reduce((c, a, i) => {
            if (i === 0 || d[i - 1].total === a.total) return a.total;
            return null;
        }, 0);
    }

    // Apply wounds if not all wounds were soaked.
    async function applyWounds() {
        newWounds = numberWounds - rounded;
        new Dialog({
            title: 'Applying Wounds',
            content: `<form>
            <div class="form-group">
                <label for="applWounds">Wounds to apply:</label>
                <input id="applWounds" name="num" type="number" min="0" value="${newWounds}"></input>
            </div>
            </form>`,
            buttons: {
                one: {
                    label: "Apply Wounds",
                    callback: (html) => {
                        let applWounds = Number(html.find("#applWounds")[0].value);
                        let setWounds = wv + applWounds;
                        if (setWounds <= wm && setWounds > 0) {
                            token.actor.update({ "data.wounds.value": setWounds });
                            token.actor.update({ "data.status.isShaken": true })
                            if (woundedSFX) {
                                AudioHelper.play({ src: `${woundedSFX}` }, true);
                            }
                        }
                        else if (applWounds === 0) {
                            token.actor.update({ "data.status.isShaken": true })
                        }
                        else {
                            token.actor.update({ "data.wounds.value": wm });
                            game.cub.addCondition("Incapacitated");
                            if (incapSFX) {
                                AudioHelper.play({ src: `${incapSFX}` }, true);
                            }
                        }
                        if (!game.user.isGM && setWounds > 0 && grit === true) {
                            game.tables.getName(`${injuryTable}`).draw();
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

    // Check for Bennies
    function checkBennies() {
        bennies = token.actor.data.data.bennies.value;

        // Non GM token has <1 bennie OR GM user AND selected token has <1 benny
        if ((!game.user.isGM && bennies < 1) || (game.user.isGM && bennies < 1 && game.user.getFlag("swade", "bennies") < 1)) {
            ui.notifications.error("You have no more bennies left. Wounds will be applied now...");
        }
        if (game.user.isGM) {
            bv = bennies + game.user.getFlag("swade", "bennies");
        }
        else {
            bv = bennies;
        }
        return bv;
    }

    // Spend Benny function
    async function spendBenny() {
        bennies = token.actor.data.data.bennies.value;
        //Subtract the spend, use GM benny if user is GM and token has no more bennies left or spend token benny if user is player and/or token has bennies left.
        if (game.user.isGM && bennies < 1) {
            game.user.setFlag("swade", "bennies", game.user.getFlag("swade", "bennies") - 1)
        } else {
            token.actor.update({
                "data.bennies.value": bennies - 1,
            })
        }

        //Show the Benny Flip
        if (game.dice3d) {
            game.dice3d.showForRoll(new Roll("1dB").roll(), game.user, true, null, false);
        }

        //Chat Message to let the everyone know a benny was spent
        ChatMessage.create({
            user: game.user._id,
            content: `<p><img style="border: none;" src="${bennyImage}"" width="25" height="25" /> ${game.user.name} spent a Benny for ${token.name}.</p>`,
        });
    }

    // Buttons for the main Dialogue.
    let buttonsMain = {
        one: {
            label: "Soak Wounds",
            callback: (html) => {
                numberWounds = Number(html.find("#numWounds")[0].value);
                bv = checkBennies();
                if (bv < 1) {
                    applyWounds();
                }
                else {
                    spendBenny();
                    rollSoak();
                }
            }
        },
        two: {
            label: "Apply Damage",
            callback: (html) => {
                numberWounds = Number(html.find("#numWounds")[0].value);
                rounded = 0
                applyWounds();
            }
        }
    }

    // If Unholy Warrior or Holy Warrior is present, add another button to the Main Dialogue and render another dialogue to enter the amount of PP to be used.
    if (holyWarr) buttonsMain["three"] = {
        label: "Soak with (Un)Holy Warrior",
        callback: (html) => {
            numberWounds = Number(html.find("#numWounds")[0].value);
            new Dialog({
                title: 'Soaking Wounds',
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
                        label: "Soak Wounds",
                        callback: (html) => {
                            numberPP = Number(html.find("#numPP")[0].value);
                            if (ppv < numberPP) {
                                ui.notifications.notify("You have insufficient Power Points.");
                            }
                            else if (numberPP > 4) {
                                ui.notifications.error("You can't use more than 4 Power Points.");
                            }
                            else {
                                bv = checkBennies();
                                if (bv < 1) {
                                    applyWounds();
                                }
                                else {
                                    let newPP = ppv - numberPP;
                                    token.actor.update({ "data.powerPoints.value": newPP });
                                    spendBenny();
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

    // Main Dialogue
    new Dialog({
        title: 'Soaking Wounds',
        content: `<form>
        <p>You currently have <b>${wv}/${wm}</b> Wounds and <b>${bennies}</b> Bennies.</p>
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

    // Dialog to be rendered if not all wounds were soaked in rollSoak.
    function dialogReroll() {
        bv = checkBennies();
        if (bv > 0) {
            let currWounds = numberWounds - rounded;
            new Dialog({
                title: 'Reroll',
                content: `<form>
                    You've soaked <b>${rounded} Wounds</b>; you will <b>receive ${currWounds} Wounds</b>.
                    </br>Do you want to reroll your Soaking Roll (you have <b>${bv} Bennies</b> left)?
                    </form>`,
                buttons: {
                    one: {
                        label: "Reroll",
                        callback: (html) => {
                            spendBenny();
                            if (!!elan) {
                                elanBonus = 2;
                            }
                            rollSoak();
                        }
                    },
                    two: {
                        label: "No, apply Wounds now",
                        callback: (html) => {
                            ui.notifications.notify("Wounds will be applied now.");
                            applyWounds();
                        }
                    }
                },
                default: "one",
            }).render(true);
        }
        else {
            ui.notifications.notify("You have no more bennies, Wounds will be applied now.");
            applyWounds();
        }
    }
    // V2.5.4 Code by SalieriC#8263. Critical Failure awareness by Kekilla#7036 Testing and bug-chasing: javierrivera#4813.
}