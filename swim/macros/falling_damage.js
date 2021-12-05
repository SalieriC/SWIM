/*****
 * Falling Damage Macro.
 * This macro automatically calculates falling damage for all selected tokens.
 * It is capable of factoring in water and snow/soft surfaces as per the core rules.
 * v. 1.0.0 by SalieriC#8263, CSS of the dialogue by Kyane von Schnitzel#8654
 * (Do not remove credits, even if editing.)
*****/

//use deduplication to get rid of those which are both, selected and targeted:
let tokens = [...new Set([...canvas.tokens.controlled, ...game.user.targets])];
if (tokens.length === 0) {
    return ui.notifications.error("Select or target one or more tokens first.");
}
let messageContent = `<div class="swade-core"><h2><img style="border: 0;" src=${this.data.img} width="35" height="35" /> Damage from Falling</h2>`;
let officialModule = false;

if (game.modules.get("swpf-core-rules")?.active) {
    messageContent = `<div class="swpf-core"><h2><img style="border: 0;" src=${this.data.img} width="35" height="35" /> @Compendium[swpf-core-rules.swpf-rules.VWsotOh2lybrA8kA]{Damage from Falling}</h2>`;
    officialModule = true;
} else if (game.modules.get("deadlands-core-rules")?.active) {
    messageContent = `<div class="deadlands-core"><h2><img style="border: 0;" src=${this.data.img} width="35" height="35" /> @Compendium[swade-core-rules.swade-rules.KrNAAJXr91wkfxtY]{Damage from Falling}</h2>`;
    officialModule = true;
} else if (game.modules.get("sprawl-core-rules")?.active) {
    messageContent = `<div class="sprawl-core"><h2><img style="border: 0;" src=${this.data.img} width="35" height="35" /> @Compendium[swade-core-rules.swade-rules.KrNAAJXr91wkfxtY]{Damage from Falling}</h2>`;
    officialModule = true;
} else if (game.modules.get("swade-core-rules")?.active) {
    messageContent = `<div class="swade-core"><h2><img style="border: 0;" src=${this.data.img} width="35" height="35" /> @Compendium[swade-core-rules.swade-rules.KrNAAJXr91wkfxtY]{Damage from Falling}</h2>`;
    officialModule = true;
}
const options = `<option value="na">n/a</option><option value="success">Success</option><option value="raise">Raise</option>`;

main();

//rol the damage the character takes based on the distance:
async function roll_damage(token, fallingDepth, snowDepth, waterSuccess) {
    let halvedDepth = Math.ceil(fallingDepth / 2); //damage per 2"
    let damageFormula = `(1d6+1)*${halvedDepth}`;
    let rollDamage = await new Roll(`${damageFormula}`).roll();
    let damage = rollDamage.total;
    let waterRaise = false;
    if (snowDepth > 0) { 
        damage = damage - snowDepth;
    } else if (waterSuccess != "na") {
        if (waterSuccess === "success") {damage = Math.ceil(damage / 2)}
        else if (waterSuccess === "raise" ) { waterRaise = true; damage = 0; }
    }
    if (waterRaise === false) {
        messageContent += `<p>${token.data.name} falls ${fallingDepth}&rdquo; and takes <strong><span style="font-size:115%">${damage}</strong></span> damage.</p>`
    } else if (waterRaise === true) {
        messageContent += `<p>${token.data.name} falls ${fallingDepth}&rdquo; but dives into the water gracefully, taking no damage in the process.</p>`
    }
    await calculate_damage(token, damage);
}

async function calculate_damage(token, damage) {
    const toughness = token.document._actor.data.data.stats.toughness.value;
    const isShaken = token.document._actor.data.data.status.isShaken;
    const raises = Math.floor((damage - toughness) / 4);
    const isHardy = token.document._actor.data.items.find(function (item) {
        return ((item.name.toLowerCase() === "hardy") && item.type === "ability");
    });
    if (toughness > damage) {
        messageContent += `<p>=> No harm.</p>`
    } else if (toughness <= damage) {
        if (isShaken === false && raises <= 0) {
            //swim.start_macro(`[Script] Unshake (SWD)`); //Can't use it for there are potentially multiple tokens selected. Need to find a way to pass the proper actor or something.
            messageContent += `<p>=> Shaken</p>`
        } else if (isShaken === false && raises >= 1) {
            messageContent += `<p>=> Shaken and ${raises} @Compendium[swim.swade-immersive-macros.AWEIhBfGUmhQlww5]{Wounds}.</p>`
        } else if (isShaken === true && raises <= 1) {
            if (!isHardy || raises === 1) {
                messageContent += `<p>=> 1 @Compendium[swim.swade-immersive-macros.AWEIhBfGUmhQlww5]{Wound}.</p>`
            } else if (isHardy) {
                messageContent += `<p>=> No harm.</p>`
            }
        } else if (isShaken === true && raises >= 1) {
            let wounds = raises - 1;
            messageContent += `<p>=> ${wounds} @Compendium[swim.swade-immersive-macros.AWEIhBfGUmhQlww5]{Wounds}.</p>`
        }
    }
}

async function main() {
    let content = 
    `
    <div class="swade-core">
        <p>Who falls how deep?</p>
        <p>Provide a falling depth in &rdquo; (squares on the tabletop; each equals 2 yards &cong; 2 meters).</p>
        <p>Snow and other soft ground reduces the damage. Provide a depth in feet (&cong; 30 cm) if applicable or leave it at 0 if not.</p>
        <p>Falling in water allows an Athletics roll. If applicable provide the degree of success. If not applicable or if the roll was failed, leave it at "n/a".</p>
        <div style="display: grid; grid-template-columns: 5fr 1.2fr 1fr 1.3fr; grid-gap: 2px;">
        <strong style="text-align: left;">Token</strong>
        <strong style="text-align: center;">Depth</strong>
        <strong style="text-align: center;">Snow</strong>
        <strong style="text-align: center;">Athletics</strong>
    `;
for (let token of tokens) {
    content += `
        <p>
          <img style="border: 0; text-align: left;" src="${token.data.img}" width="25" height="25" /> 
          <span style="vertical-align: super; text-align: left;">${token.data.name}</span>
        </p>
        <input style="text-align: center;" id="fallingDepth-${token.id}" style="flex: 1;" type="number" value="0" />
        <input style="text-align: center;" id="snowDepth-${token.id}" style="flex: 1;" type="number" value="0" />
        <select style="text-align: center;" id="water-${token.id}">${options}</select>
    `;
}
content += `
        </div>
    </div>`;
    new Dialog({
        title: "Falling damage calculator",
        content: content,
        buttons: {
            roll: {
                label: "Roll",
                callback: async (html) => {
                    for (let token of tokens) {
                        //Getting results from checkboxes and making the rolls.
                        let fallingDepth = Number(html.find(`#fallingDepth-${token.id}`)[0].value);
                        let snowDepth = Number(html.find(`#snowDepth-${token.id}`)[0].value);
                        let waterSuccess = html.find(`#water-${token.id}`)[0].value;
                        if (waterSuccess != "na" && snowDepth != 0) {
                            return ui.notifications.error(`You can't combine water and snow.`)
                        }
                        messageContent += `<h3><img style="border: 0;" src=${token.data.img} width="35" height="35" /> ${token.data.name}</h3>`;
                        await roll_damage(token, fallingDepth, snowDepth, waterSuccess);
                    }
                    if (officialModule === true) {
                        messageContent += `</div>`;
                    }
                    ChatMessage.create({
                        //user: game.user._id,
                        speaker: ChatMessage.getSpeaker({ token: actor }),
                        content: messageContent
                    });
                }
            },
            cancel: {
                label: "Cancel"
            }
        }
    }).render(true)
}