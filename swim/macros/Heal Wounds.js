// Checking for SWADE Spices & Flavours and setting up the Benny image.
let bennyImage = "systems/swade/assets/benny/benny-chip-front.png";
if (game.modules.get("swade-spices").active) {
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
let healSFX = game.settings.get(
    'swim', 'healSFX');
let looseFatigueSFX = game.settings.get(
    'swim', 'looseFatigueSFX');    

// Check if a token is selected.
if ((!token || canvas.tokens.controlled.length > 1) || (token && token.actor.data.data.wounds.value < 1)) {
    ui.notifications.error("Please select a single token that is wounded first.");
}

// Declairing variables and constants.
const wv = token.actor.data.data.wounds.value;
const wm = token.actor.data.data.wounds.max;
const fv = token.actor.data.data.fatigue.value;
const fm = token.actor.data.data.fatigue.max;
const fastHealer = token.actor.data.items.find(function (item) {
    return ((item.name.toLowerCase() === "Fast Healer") && item.type === "edge");
});
const elan = token.actor.data.items.find(function (item) {
    return item.name.toLowerCase() === "elan" && item.type === "edge";
});
let bennies = token.actor.data.data.bennies.value;
let bv;
let numberWounds;
let rounded;
let elanBonus;
let newWounds;
let currWounds;
let setWounds;
let genericHealWounds;

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

// This is the main function that handles the Vigor roll.
async function rollNatHeal() {

    const edgeNames = ['fast healer'];
    const actorAlias = speaker.alias;
    // Roll Vigor and check for Fast Healer.
    const r = await token.actor.rollAttribute('vigor');
    const edges = token.actor.data.items.filter(function (item) {
        return edgeNames.includes(item.name.toLowerCase()) && item.type === "edge";
    });
    let rollWithEdge = r.total;
    let edgeText = "";
    for (let edge of edges) {
        rollWithEdge += 2;
        edgeText = `<br/><i>+ ${edge.name}</i>`;
    }

    // Apply +2 if Elan is present and if it is a reroll.
    if (typeof elanBonus === "number") {
        rollWithEdge += 2;
        edgeText = edgeText + `<br/><i>+ Elan</i>.`;
    }

    // Roll Vigor including +2 if Fast Healer is present and another +2 if this is a reroll.
    let chatData = `${actorAlias} rolled <span style="font-size:150%"> ${rollWithEdge} </span>`;
    rounded = Math.floor(rollWithEdge / 4);

    // Making rounded 0 if it would be negative.
    if (rounded < 0) {
        rounded = 0;
    }

    // Checking for a Critical Failure.
    if (isSame_bool(r.dice) && isSame_numb(r.dice) === 1) {
        ui.notifications.notify("You've rolled a Critical Failure!");
        let chatData = `${actorAlias} rolled a <span style="font-size:150%">Critical Failure!</span> and takes another Wound! See the rules on Natural Healing for details.`;
        applyWounds();
        ChatMessage.create({ content: chatData });
    }
    else {
        if (rounded < 1) {
            bv = checkBennies();
            chatData += ` and is unable to heal any Wounds.`;
            if (bv < 1) {
                return;
            }
            else {
                dialogReroll();
            }
        } else if ((rounded === 1 && numberWounds > 1) || (rounded === 2 && numberWounds > 2)) {
            chatData += ` and heals ${rounded} of his ${numberWounds} Wounds.`;
            if (bv < 1) {
                removeWounds();
            }
            else {
                dialogReroll();
            };
        } else if ((rounded > 1 && rounded >= numberWounds && numberWounds < 3) || (rounded === 1 && numberWounds === 1)) {
            chatData += ` and heals all of his Wounds.`;
            removeWounds();
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
        content: `<p><img src="${bennyImage}"" width="25" height="25" /> ${game.user.name} spent a Benny for ${token.name}.</p>`,
    });
}

// Function containing the reroll Dialogue
function dialogReroll() {
    bv = checkBennies();
    if (bv > 0) {
        new Dialog({
            title: 'Reroll',
            content: `<form>
                You've healed ${rounded} Wounds.
                </br>Do you want to reroll your Natural Healing roll (you have ${bv} Bennies left)?
                </form>`,
            buttons: {
                one: {
                    label: "Reroll",
                    callback: (html) => {
                        spendBenny();
                        if (!!elan) {
                            elanBonus = 2;
                        }
                        rollNatHeal();
                    }
                },
                two: {
                    label: "No",
                    callback: (html) => {
                        ui.notifications.notify("As you wish, Wounds will be removed now.");
                        removeWounds();
                    }
                }
            },
            default: "No"
        }).render(true);
    }
    else {
        ui.notifications.notify("You have no more bennies.");
        removeWounds();
    }
}

// Main Dialogue
if (!fastHealer) {
    new Dialog({
        title: 'Healing Wounds',
        content: `<form>
        <p>You currently have <b>${wv}/${wm}</b> Wounds, <b>${fv}/${fm}</b> Fatigue and <b>${bennies}</b> Bennies.</p>
        <p>You may make a Natural Healing roll every <b>five days</b>.</p>
        </form>`,
        buttons: {
            one: {
                label: "Natural Healing",
                callback: (html) => {
                    numberWounds = wv;
                    rollNatHeal();
                }
            },
            two: {
                label: "Generic Healing",
                callback: (html) => {
                    genericRemoveWounds();
                }
            },
            three: {
                label: "Remove Fatigue",
                callback: (html) => {
                    genericRemoveFatigue();
                }
            }
        }
    }).render(true);
}
else {
    new Dialog({
        title: 'Healing Wounds',
        content: `<form>
        <p>You currently have <b>${wv}/${wm}</b> Wounds and <b>${bennies}</b> Bennies.</p>
        <p>You may make a Natural Healing roll every <b>three days</b>.</p>
        </form>`,
        buttons: {
            one: {
                label: "Natural Healing",
                callback: (html) => {
                    rollNatHeal();
                }
            }
        }
    }).render(true);
}

function removeWounds() {
    if (genericHealWounds) {
        if (genericHealWounds > wv) {
            genericHealWounds = wv;
            ui.notifications.error(`You can't heal more wounds than you have, healing all Wounds instead now...`);
        }
        setWounds = wv - genericHealWounds;
        token.actor.update({ "data.wounds.value": setWounds });
        ui.notifications.notify(`${genericHealWounds} Wound(s) healed.`);
    }
    else {
        if (rounded === 1) {
            setWounds = wv - 1;
            if (setWounds < 0) {
                setWounds = 0;
            }
            token.actor.update({ "data.wounds.value": setWounds });
            ui.notifications.notify("One Wound healed.");
        }
        if (rounded >= 2) {
            setWounds = wv - 2;
            if (setWounds < 0) {
                setWounds = 0
            }
            token.actor.update({ "data.wounds.value": setWounds });
            ui.notifications.notify("Two Wounds healed.");
        }
    }
    if (healSFX) {
        AudioHelper.play({ src: `${healSFX}` }, true);
    }
}

// Healing from a source other than Natural Healing
function genericRemoveWounds() {
    new Dialog({
        title: 'Generic Healing',
        content: `<form>
        <p>You currently have <b>${wv}/${wm}</b> If you've been healed from a source other than Natural Healing, enter the amount of wounds below:</p>
    <div class="form-group">
        <label for="numWounds">Amount of Wounds: </label>
        <input id="numWounds" name="num" type="number" min="0" value="1"></input>
    </div>
    </form>`,
        buttons: {
            one: {
                label: "Heal Wounds",
                callback: (html) => {
                    genericHealWounds = Number(html.find("#numWounds")[0].value);
                    removeWounds();
                }
            }
        }
    }).render(true);
}

// Removing Fatigue
function genericRemoveFatigue() {
    new Dialog({
        title: 'Remove Fatigue',
        content: `<form>
        <p>You currently have <b>${fv}/${fm}</b> If your Fatigue has been cured or expired, enter the amount of Fatigue below:</p>
    <div class="form-group">
        <label for="numWounds">Amount of Fatigue: </label>
        <input id="numFatigue" name="num" type="number" min="0" value="1"></input>
    </div>
    </form>`,
        buttons: {
            one: {
                label: "Cure Fatigue",
                callback: (html) => {
                    let genericHealFatigue = Number(html.find("#numFatigue")[0].value);
                    if (genericHealFatigue > fv) {
                        genericHealFatigue = fv;
                        ui.notifications.error(`You can't cure more Fatigue than you have, curing all Fatigue instead now...`);
                    }
                    let setFatigue = fv - genericHealFatigue;
                    token.actor.update({ "data.wounds.value": setFatigue });
                    ui.notifications.notify(`${genericHealFatigue} Level(s) of Fatigue cured.`);
                    ChatMessage.create({
                        speaker: {
                            alias: token.name
                        },
                        content: `${token.name} lost ${genericHealFatigue} Level(s) of Fatigue.`
                    })
                    if (looseFatigueSFX) {
                        AudioHelper.play({ src: `${looseFatigueSFX}` }, true);
                    }
                }
            }
        }
    }).render(true);
}

function applyWounds() {
    setWounds = wv + 1
    if (setWounds <= wm) {
        token.actor.update({ "data.wounds.value": setWounds });
        if (woundedSFX) {
            AudioHelper.play({ src: `${woundedSFX}` }, true);
        }
    }
    else {
        token.actor.update({ "data.wounds.value": wm });
        game.cub.addCondition("Incapacitated");
        if (incapSFX) {
            AudioHelper.play({ src: `${incapSFX}` }, true);
        }
    }
}

// v.2.0.0 By SalieriC#8263; fixing bugs supported by FloRad#2142.