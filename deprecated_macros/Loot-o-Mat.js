/********************************************************* 
 * Loot-o-Mat 
 * A loot Macro for Hellfrost and other SaWo Settings.
 * 
 * This macro relies on an Additional Stat set up on your
 * actors: "treasure" (type string, no max value). Your
 * bestiary needs this Additional Stat on the actors to
 * function. 
 * Allowed treasure types are: "Meager", "Worthwhile",
 * "Rich" and "Treasure Trove" which are common loot
 * types i.e. in Hellfrost, 50 Fathoms or the Fantasy 
 * Companion.
 * It is also common to these settings to state treasure
 * per x opponents (i.e. "Meager, per 5 Orcs"). In this
 * case set up the Additional Stat like this:
 * "Meager, per x", "Meager per x" or "Meager/x"
 * where x is the amount of enemies as a number NOT a word.
 * These three options are covered by the macro, use no
 * other format!
 * 
 * How does it work?
 * The macro searches all selected and targeted tokens
 * (it won't use duplicates if targeted and selected
 * tokens are the same, don't worry) for the additional
 * stat "treasure" and makes a roll for loot, then it
 * creates a chat message with the random loot amount.
 * Alternatively, you can use the macro with no tokens
 * targeted/selected and a dialogue will appear that
 * lets you enter the amount of enemies with their
 * different loot types individually. This dialogue will 
 * also open when none of the selected and targeted 
 * tokens has the Additional Stat so you can safely use 
 * the macro without this.
 * If the loot type is set up with an amount of enemies
 * like above (i.e. "Meager, per 5"), the number is used
 * for division and the result is rounded to two decimals.
 * In Hellfrost this represents Silver Scields, in Settings
 * which don't use a sub-currency (like 50f), just ignore
 * or round off manually.
 * 
 * v. 1.2.0 by SalieriC#8263
*********************************************************/


let name = "your enemy";
let meagerRolls = 0;
let worthwhileRolls = 0;
let richRolls = 0;
let troveRolls = 0;

let img;
const icon = "icons/commodities/currency/coins-plain-pouch-gold.webp";
const meagerIMG = "icons/commodities/currency/coins-assorted-mix-copper.webp";
const worthwhileIMG = "icons/commodities/currency/coins-assorted-mix-silver.webp";
const richIMG = "icons/commodities/currency/coins-plain-stack-gold.webp";
const troveIMG = "icons/commodities/currency/coins-assorted-mix-platinum.webp";

const meagerHeading = "Meager Treasure";
const worthwhileHeading = "Worthwhile Treasure";
const richHeading = "Rich Treasure";
const troveHeading = "Treasure Trove";
let heading = "Treasure";

let dialogueFirstLine = "<p>Enter the amount of slain enemies per treasure type:</p>";

main();

async function main() {
    if (canvas.tokens.controlled.length > 1 || game.user.targets.size > 1 || (game.user.targets.size + canvas.tokens.controlled.length > 1)) {
        name = "your enemies";
        //use deduplication to get rid of those which are both, selected and targeted:
        let tokens = [...new Set([...canvas.tokens.controlled, ...game.user.targets])];
        await find_treasure(tokens);
    } else if (token) {
        name = token.name;
        let tokens = [token];
        await find_treasure(tokens);
    } else if (game.user.targets.size === 1) {
        let tokens = [...game.user.targets]
        await find_treasure(tokens);
    } else if (canvas.tokens.controlled.length === 0 || game.user.targets.size === 0) {
        await treasure_dialogue();
    }
}

async function roll_loot() {
    let roll = new Roll(`(1d10*1*${meagerRolls})+(1d10*10*${worthwhileRolls})+(1d10*100*${richRolls})+(1d10*1000*${troveRolls})`).evaluate({ async:false });

    let result = Math.round(roll.total * 100) / 100;

    if (result >= 1000) {img = troveIMG; heading = troveHeading}
    else if (result >= 100 && result < 1000) {img = richIMG; heading = richHeading}
    else if (result >= 10 && result < 100) {img = worthwhileIMG; heading = worthwhileHeading}
    else if (result < 10) {img = meagerIMG; heading = meagerHeading}

    let treasure = `
<div class="swade-core">
<h2><img style="border: 0;" src=${img} width="25" height="25" /> ${heading}</h2>
<p>You find <strong>${result} $</strong> woth of treasure on ${name} or in the lair.</p>
</div>
`

    ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ token: actor }),
        content: treasure
    });
}

async function find_treasure(tokens) {
    // the array contains tokens but we need to get the actor data from token.document._actor.data.data.additionalStats.treasure
    for (let token of tokens) {
        if (token.document._actor.data.data.additionalStats.treasure) {
            let lootType = token.document._actor.data.data.additionalStats.treasure.value.toLowerCase();
            if (lootType.includes("per") || lootType.includes("/")) {
                let lootTypeSplit;
                if (lootType.includes(", per")) { lootTypeSplit = lootType.split(", per ") }
                else if (lootType.includes("per")) { lootTypeSplit = lootType.split(" per ") }
                else if (lootType.includes("/")) { lootTypeSplit = lootType.split("/") }

                let lootMod = Number(lootTypeSplit[1])
                if (lootTypeSplit[0] === "meager") {
                    meagerRolls = meagerRolls + 1 / lootMod;
                } else if (lootTypeSplit[0] === "worthwhile") {
                    worthwhileRolls = worthwhileRolls + 1 / lootMod;
                } else if (lootTypeSplit[0] === "rich") {
                    richRolls = richRolls + 1 / lootMod;
                } else if (lootTypeSplit[0] === "treasure trove") {
                    troveRolls = troveRolls + 1 / lootMod;
                }
            }
            else if (lootType === "meager") {
                meagerRolls = meagerRolls + 1;
            } else if (lootType === "worthwhile") {
                worthwhileRolls = worthwhileRolls + 1;
            } else if (lootType === "rich") {
                richRolls = richRolls + 1;
            } else if (lootType === "treasure trove") {
                troveRolls = troveRolls + 1;
            }
        }
    }
    if (meagerRolls === 0 && worthwhileRolls === 0 && richRolls === 0 && troveRolls === 0) { 
        dialogueFirstLine = "<p>Loot-o-Mat did not detect the Treasure Additional Stat.</p><p>Enter the amount of slain enemies per treasure type below or cancel if none of the enemies carry any loot:</p>";
        return treasure_dialogue() 
    } else { await roll_loot(); }
}

async function treasure_dialogue() {
    new Dialog({
        title: "Loot-o-Mat",
        content: `
        <div class="swade-core">
            ${dialogueFirstLine}
            <div style="display:flex">
                <p style="flex:3"><img style="border: 0;" src=${meagerIMG} width="15" height="15" /> Meager (1d10*1 GS): </p>
                <input type="number" id="meagerAmount" value=0 style="flex:1"/>
            </div> 
            <div style="display:flex">
                <p style="flex:3"><img style="border: 0;" src=${worthwhileIMG} width="15" height="15" /> Worthwhile (1d10*10 GS): </p>
                <input type="number" id="worthwhileAmount" value=0 style="flex:1"/>
            </div>
            <div style="display:flex">
                <p style="flex:3"><img style="border: 0;" src=${richIMG} width="15" height="15" /> Rich (1d10*100 GS): </p>
                <input type="number" id="richAmount" value=0 style="flex:1"/>
            </div>
            <div style="display:flex">
                <p style="flex:3"><img style="border: 0;" src=${troveIMG} width="15" height="15" /> Treasure Trove (1d10*1000 GS): </p>
                <input type="number" id="troveAmount" value=0 style="flex:1"/>
            </div>
        </div>
        `,
        buttons: {
            roll: {
                label: "Roll",
                callback: (html) => {
                    meagerRolls = Number(html.find("#meagerAmount")[0].value);
                    worthwhileRolls = Number(html.find("#worthwhileAmount")[0].value);
                    richRolls = Number(html.find("#richAmount")[0].value);
                    troveRolls = Number(html.find("#troveAmount")[0].value);
                    let totalRolls = meagerRolls + worthwhileRolls + richRolls + troveRolls;
                    if (totalRolls > 1) { name = "your enemies" }
                    roll_loot();
                }
            },
            cancel: {
                label: "Cancel"
            }
        }
    }).render(true)
}