main();

function main() {
    // Checking if at least one token is defined.
    if (canvas.tokens.controlled.length === 0) {
        ui.notifications.error("Please select a token first");
        return;
    }
    // Checking for System Benny image.
    let bennyImage = "icons/commodities/currency/coin-embossed-octopus-gold.webp";
        let benny_Back = game.settings.get('swade', 'bennyImage3DBack');
        if (benny_Back) {
            bennyImage = benny_Back;
        }
    // Setting SFX
    let woundedSFX = game.settings.get(
        'swim', 'woundedSFX');
    // Injury Table for Gritty Damage
    let grit = game.settings.get(
        'swim', 'grittyDamage');
    let injuryTable = game.settings.get(
        'swim', 'injuryTable');
    let soakSFX;
    if (token.actor.data.data.additionalStats.sfx) {
        let sfxSequence = token.actor.data.data.additionalStats.sfx.value.split("|");
        woundedSFX = sfxSequence[0];
        soakSFX = sfxSequence[3];
    }

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
    //Check for actor status and adjust bennies based on edges.
    let actorLuck = token.actor.data.items.find(function (item) { return (item.name.toLowerCase() === "luck") });
    let actorGreatLuck = token.actor.data.items.find(function (item) { return (item.name.toLowerCase() === "great luck") });
    if ((token.actor.data.data.wildcard === false) && (actorGreatLuck === undefined)) {
        if ((!(actorLuck === undefined)) && (bennies > 1) && ((actorGreatLuck === undefined))) { bennies = 1; }
        else { bennies = 0; }
    }
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
            edgeText += `<br/><i>+ 2 <img src="${edge.img}" alt="" width="15" height="15" style="border:0" />${edge.name}</i>`;
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
                if (soakSFX) { AudioHelper.play({ src: `${soakSFX}` }, true); }
                if (bv < 1) {
                    applyWounds();
                }
                else {
                    dialogReroll();
                };
            } else if (rounded >= numberWounds) {
                chatData += ` and soaks all of his Wounds.`;
                if (soakSFX) { AudioHelper.play({ src: `${soakSFX}` }, true); }
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
                    callback: async (html) => {
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
                            swim.start_macro('[Script] Mark Dead');
                        }
                        if (!game.user.isGM && setWounds > 0 && grit === true) { //disabling combat injuries for the DM
                            await apply_injury();
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
        //Check for actor status and adjust bennies based on edges.
        let actorLuck = token.actor.data.items.find(function (item) { return (item.name.toLowerCase() === "luck") });
        let actorGreatLuck = token.actor.data.items.find(function (item) { return (item.name.toLowerCase() === "great luck") });
        if ((token.actor.data.data.wildcard === false) && (actorGreatLuck === undefined)) {
            if ((!(actorLuck === undefined)) && (bennies > 1) && ((actorGreatLuck === undefined))) { bennies = 1; }
            else { bennies = 0; }
        }
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
            game.dice3d.showForRoll(new Roll("1dB").evaluate({ async:false }), game.user, true, null, false);
        }

        //Chat Message to let the everyone know a benny was spent
        ChatMessage.create({
            user: game.user.id,
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

    async function apply_injury() {
        //roll on injury table:
        let result = await game.tables.getName(`${injuryTable}`).draw();
        let text = result.results[0].data.text;
        const img = result.results[0].data.img;
        let injuryData = { 
            changes: [],
            flags: { swim: { isCombatInjury: true } }
        };
        injuryData.icon = img;
        let injuryEffects;
        if (text.toLowerCase().includes("unmentionables")) {
            //unmentionables; do nothing
        } else if (text.toLowerCase().includes("arm")) {
            //arm; create a dummy AE without actual effect
            injuryData.label = 'Injury: Arm unusable';
        } else if (text.toLowerCase().includes("leg")) {
            //leg, create AE with appropriate value depending on whether or not the character is slow already
            const slow = token.actor.data.items.find(function (item) {
                return ((item.name.toLowerCase() === "slow") || (item.name.toLowerCase() === "slow")) && item.type === "hindrance";
            });
            if (!slow) {
                //Actor isn't slow, create AE with minor slow effect = data.stats.speed.runningDie -2 && data.stats.speed.value -1
                injuryData.label = 'Injury: Leg (Slow)';
                if (token.actor.data.data.stats.speed.runningDie === 4) {
                    //Running die is a d4 already, alter AE like so: data.stats.speed.runningDie.modifier -1 && data.stats.speed.value -1
                    injuryEffects = {
                        key: 'data.stats.speed.runningDie.modifier',
                        mode: 2,
                        value: -1
                    }, {
                        key: 'data.stats.speed.value',
                        mode: 2,
                        value: -1
                    }
                } else {
                    //AE as above
                    injuryEffects = {
                        key: 'data.stats.speed.runningDie',
                        mode: 2,
                        value: -2
                    }, {
                        key: 'data.stats.speed.value',
                        mode: 2,
                        value: -1
                    }
                }
            } else if (slow.data.data.major === false) {
                //Actor is minor slow, create AE with major slow effect = data.stats.speed.runningDie -2 && data.stats.speed.value -2 && @Skill{Athletics}[data.die.modifier] -2
                injuryData.label = 'Injury: Leg (Slow)';
                if (token.actor.data.data.stats.speed.runningDie === 4) {
                    //Running die is a d4 already, alter AE like so: data.stats.speed.runningDie.modifier -1 && data.stats.speed.value -2
                    injuryEffects = {
                        key: 'data.stats.speed.runningDie.modifier',
                        mode: 2,
                        value: -1
                    }, {
                        key: 'data.stats.speed.value',
                        mode: 2,
                        value: -2
                    }, {
                        key: '@Skill{Athletics}[data.die.modifier]',
                        mode: 2,
                        value: -2
                    }
                } else {
                    //AE as above
                    injuryEffects = {
                        key: 'data.stats.speed.runningDie',
                        mode: 2,
                        value: -2
                    }, {
                        key: 'data.stats.speed.value',
                        mode: 2,
                        value: -2
                    }, {
                        key: '@Skill{Athletics}[data.die.modifier]',
                        mode: 2,
                        value: -2
                    }
                }
                //Do nothing if actor is major slow already.
            }
        } else if (text.toLowerCase().includes("guts")) {
            //evaluate all the guts:
            if (text.toLowerCase().includes("broken")) {
                //Guts broken, create AE with data.attributes.agility.die.sides -2
                injuryData.label = 'Injury: Guts (broken)';
                injuryEffects = {
                    key: 'data.attributes.agility.die.sides',
                    mode: 2,
                    value: -2
                }
            } else if (text.toLowerCase().includes("battered")) {
                //Guts battered, create AE with data.attributes.vigor.die.sides -2
                injuryData.label = 'Injury: Guts (battered)';
                injuryEffects = {
                    key: 'data.attributes.vigor.die.sides',
                    mode: 2,
                    value: -2
                }
            } else if (text.toLowerCase().includes("busted")) {
                //Guts busted, created AE with data.attributes.strength.die.sides -2
                injuryData.label = 'Injury: Guts (busted)';
                injuryEffects = {
                    key: 'data.attributes.strength.die.sides',
                    mode: 2,
                    value: -2
                }
            }
        } else if (text.toLowerCase().includes("head")) {
            //evaluate all the head results:
            if (text.toLowerCase().includes("hideous scar")) {
                //hideous scar, create AE with @Skill{Persuasion}[data.die.modifier] -2
                injuryData.label = 'Injury: Head (hideous scar)';
                injuryEffects = {
                    key: '@Skill{Persuasion}[data.die.modifier]',
                    mode: 2,
                    value: -2
                }
            } else if (text.toLowerCase().includes("blinded")) {
                //Blinded, create dummy AE without actual effect
                injuryData.label = 'Injury: Head (blinded)';
            } else if (text.toLowerCase().includes("brain")) {
                //Brain damage, create AE with data.attributes.smarts.die.sides -2
                injuryData.label = 'Injury: Head (brain damage)';
                injuryEffects = {
                    key: 'data.attributes.smarts.die.sides',
                    mode: 2,
                    value: -2
                }
            }
        }
        //Create the AE:
        if (injuryEffects) {
            injuryData.changes.push(injuryEffects)
        }
        await actor.createEmbeddedDocuments('ActiveEffect', [injuryData]);
    }

    // V3.0.0 Code by SalieriC#8263. Critical Failure awareness by Kekilla#7036 Testing and bug-chasing: javierrivera#4813.
}