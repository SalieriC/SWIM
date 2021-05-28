main();

async function main() {
    // No Token is Selected
    if (!token || canvas.tokens.controlled.length > 1) {
        ui.notifications.error("Please select a single token first.");
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
    // Setting up SFX path.
    let shakenSFX = game.settings.get(
        'swim', 'shakenSFX');

    let bennies;
    let bv;

    async function rollUnshake() {

        const edgeNames = ['combat reflexes', 'demon', 'undead', 'construct', 'undead (harrowed)'];
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
            edgeText += `<br/><i>+ ${edge.name}</i>`;
        }

        let chatData = `${actorAlias} rolled <span style="font-size:150%"> ${rollWithEdge} </span>`;
        // Checking for a Critical Failure.
        if (isSame_bool(r.dice) && isSame_numb(r.dice) === 1) {
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
                token.actor.update({ "data.status.isShaken": false });
            }
            chatData += ` ${edgeText}`;
        }
        ChatMessage.create({ content: chatData });
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

    function useBenny() {
        bv = checkBennies();
        if (bv > 0) {
            new Dialog({
                title: 'Spend a Benny?',
                content: `Do you want to spend a Benny to act immediately? (You have ${bv} Bennies left.)`,
                buttons: {
                    one: {
                        label: "Yes.",
                        callback: (html) => {
                            spendBenny();
                            token.actor.update({ "data.status.isShaken": false });
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
        bennies = token.actor.data.data.bennies.value;

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
            content: `<p><img style="border: none;" src="${bennyImage}"" width="25" height="25" /> ${game.user.name} spent a Benny and ${token.name} may act normally now.</p>`,
        });
    }

    if (token.actor.data.data.status.isShaken === true) {
        rollUnshake()
    } else if (token) {
        token.actor.update({ "data.status.isShaken": true })
        if (shakenSFX) {
            AudioHelper.play({ src: `${shakenSFX}` }, true);
        }
    }
    /// v.3.3.4 Original code by Shteff, altered by Forien and SalieriC#8263, thanks to Spacemandev for the help as well. Fixed by hirumatto.
}