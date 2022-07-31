main();

async function main() {
    // No Token is Selected
    if (!token || canvas.tokens.controlled.length > 1) {
        ui.notifications.error("Please select a single token first.");
        return;
    }

    // Checking for system Benny image.
    let bennyImage = "icons/commodities/currency/coin-embossed-octopus-gold.webp";
        let benny_Back = game.settings.get('swade', 'bennyImage3DBack')
        if (benny_Back) {
            bennyImage = benny_Back;
        }
        
    // Setting up SFX path.
    let shakenSFX = game.settings.get(
        'swim', 'shakenSFX');
    let unshakeSFX;
    if (token.actor.system.additionalStats.sfx) {
        let sfxSequence = token.actor.system.additionalStats.sfx.value.split("|");
        shakenSFX = sfxSequence[0];
        unshakeSFX = sfxSequence[2];
    }

    let bennies;
    let bv;

    async function rollUnshake() {

        const edgeNames = ['combat reflexes', 'demon', 'construct', 'undead (harrowed)', 'amorphous'];
        const undeadAE = token.actor.effects.find(ae => ae.data.label.toLowerCase() === "undead");
        if (undeadAE && undeadAE.data.disabled === false) {
            edgeNames.push('undead')
        } else if (!undeadAE) {
            edgeNames.push('undead')
        }
        const actorAlias = speaker.alias;
        // ROLL SPIRIT AND CHECK COMBAT REFLEXES
        const r = await token.actor.rollAttribute('spirit');
        const edges = token.actor.data.items.filter(function (item) {
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
        if (unShakeBonus != 0 && token.actor.data.effects.size > 0) {
            for (let effect of token.actor.data.effects) {
                if (effect.data.disabled === false) { // only apply changes if effect is enabled
                    for (let change of effect.data.changes) {
                        if (change.key === "data.attributes.spirit.unShakeBonus") {
                            //Building array of effect names and icons that affect the unShakeBonus
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
                    effectMod = effectValue[i].replace("-","");
                }
                edgeText += `<br/><i>${indicator} ${effectMod} <img src="${effectIcon[i]}" alt="" width="15" height="15" style="border:0" />${effectName[i]}</i>`;
            } //Finally, if the unShakeBonus does not come from an AE apply it generically (as of yet this is just a failsafe but makes the script future proof.)
        } else if (unShakeBonus != 0) {
            rollWithEdge += unShakeBonus;
            edgeText += `<br/><i>+ ${unShakeBonus} other actor modifier</i>`;
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
            if (rollWithEdge <= 3) {
                chatData += ` and remains Shaken.`;
                useBenny();
            } else if (rollWithEdge >= 4) {
                chatData += `, is no longer Shaken and may act normally.`;
                await succ.apply_status(token, 'shaken', false)
                if (unshakeSFX) { AudioHelper.play({ src: `${unshakeSFX}` }, true); }
            }
            chatData += ` ${edgeText}`;
            ChatMessage.create({ content: chatData });
        }
    }

    function useBenny() {
        bv = checkBennies();
        if (bv > 0) {
            new Dialog({
                title: 'Spend a Benny?',
                content: `Do you want to spend a Benny to act immediately? (You have ${bv} Bennies left.)`,
                buttons: {
                    one: {
                        label: "Yes.",
                        callback: async (html) => {
                            spendBenny();
                            await succ.apply_status(token, 'shaken', false)
                        }
                    },
                    two: {
                        label: "No.",
                        callback: (html) => { return; },
                    }
                },
                default: "one"
            }).render(true)
        }
        else {
            return;
        }
    }

    // Check for Bennies
    function checkBennies() {
        bennies = token.actor.system.bennies.value;

        // Non GM token has <1 bennie OR GM user AND selected token has <1 benny
        if ((!game.user.isGM && bennies < 1) || (game.user.isGM && bennies < 1 && game.user.getFlag("swade", "bennies") < 1)) {
            ui.notifications.error("You have no more bennies left.");
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
        bennies = token.actor.system.bennies.value;
        //Check for actor status and adjust bennies based on edges.
        let actorLuck = token.actor.data.items.find(function (item) { return (item.name.toLowerCase() === "luck") });
        let actorGreatLuck = token.actor.data.items.find(function (item) { return (item.name.toLowerCase() === "great luck") });
        if ((token.actor.system.wildcard === false) && (actorGreatLuck === undefined)) {
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
            content: `<p><img style="border: none;" src="${bennyImage}"" width="25" height="25" /> ${game.user.name} spent a Benny and ${token.name} may act normally now.</p>`,
        });
    }

    if (await succ.check_status(token, 'shaken') === true) {
        rollUnshake()
    } else if (token) {
        await succ.apply_status(token, 'shaken', true)
        if (shakenSFX) {
            AudioHelper.play({ src: `${shakenSFX}` }, true);
        }
    }
    /// v.3.9.2 Original code by Shteff, altered by Forien and SalieriC#8263, thanks to Spacemandev for the help as well. Fixed by hirumatto.
}