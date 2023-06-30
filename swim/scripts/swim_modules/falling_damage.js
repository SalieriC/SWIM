/*******************************************
 * Falling Damage Macro.
 * This macro automatically calculates falling damage for all selected tokens.
 * It is capable of factoring in water and snow/soft surfaces as per the core rules.
 * v. 2.2.0 by SalieriC#8263, CSS of the dialogue by Kyane von Schnitzel#8654
 * (Do not remove credits, even if editing.)
 *******************************************/

export async function falling_damage_script() {
    //use deduplication to get rid of those which are both, selected and targeted:
    let tokens = [...new Set([...canvas.tokens.controlled, ...game.user.targets])];
    if (tokens.length === 0) {
        return ui.notifications.error(game.i18n.localize("SWIM.notification-selectOrTargetOneOrMoreTokens"));
    }
    const icon = "modules/swim/assets/icons/macros/falling_sbed_game-icons.net.png"
    let messageContent = `<div class="swade-core"><h2><img style="border: 0;" src=${icon} width="35" height="35" /> ${game.i18n.localize("SWIM.fallingDamageCalculator-damageFromFalling")}</h2>`;
    let officialModule = false;

    if (game.modules.get("swpf-core-rules")?.active) {
        messageContent = `<div class="swpf-core"><h2><img style="border: 0;" src=${icon} width="35" height="35" /> ${game.i18n.localize("SWIM.fallingDamageCalculator-damageFromFalling")}</h2>`;
        officialModule = true;
    } else if (game.modules.get("deadlands-core-rules")?.active) {
        messageContent = `<div class="deadlands-core"><h2><img style="border: 0;" src=${icon} width="35" height="35" /> ${game.i18n.localize("SWIM.fallingDamageCalculator-damageFromFalling")}</h2>`;
        officialModule = true;
    }/* else if (game.modules.get("sprawl-core-rules")?.active) {
    messageContent = `<div class="sprawl-core"><h2><img style="border: 0;" src=${icon} width="35" height="35" /> @Compendium[swade-core-rules.swade-rules.KrNAAJXr91wkfxtY]{Damage from Falling}</h2>`;
    officialModule = true;
}*/ else if (game.modules.get("swade-core-rules")?.active) {
        messageContent = `<div class="swade-core"><h2><img style="border: 0;" src=${icon} width="35" height="35" /> ${game.i18n.localize("SWIM.fallingDamageCalculator-damageFromFalling")}</h2>`;
        officialModule = true;
    }
    const options = `<option value="na">${game.i18n.localize("SWIM.word-na")}</option>
    <option value="success">${game.i18n.localize("SWIM.raiseCalculator-success")}</option>
    <option value="raise">${game.i18n.localize("SWIM.gameTerm-Raise")}</option>`;

    main();

    //rol the damage the character takes based on the distance:
    async function roll_damage(token, fallingDepth, snowDepth, waterSuccess) {
        let halvedDepth = Math.ceil(fallingDepth / 2); //damage per 2"
        let damageFormula = halvedDepth >= 10 ? `(1d6x+1)*10` : `(1d6x+1)*${halvedDepth}`; //cap falling damage at 10d6+10
        let rollDamage = await new Roll(`${damageFormula}`).evaluate({ async: false });
        let damage = rollDamage.total;
        let waterRaise = false;
        if (snowDepth > 0) {
            damage = damage - snowDepth;
        } else if (waterSuccess != "na") {
            if (waterSuccess === "success") { damage = Math.ceil(damage / 2) }
            else if (waterSuccess === "raise") { waterRaise = true; damage = 0; }
        }
        if (waterRaise === false) {
            messageContent += `${game.i18n.format("SWIM.fallingDamageCalculator-fallsAndTakesDamage", {tokenName: token.name, fallingDepth: fallingDepth, damage: damage})}`
        } else if (waterRaise === true) {
            messageContent += `${game.i18n.format("SWIM.fallingDamageCalculator-fallsButDives", {tokenName: token.name, fallingDepth: fallingDepth})}`
        }
        await calculate_damage(token, damage);
    }

    async function calculate_damage(token, damage) {
        const toughness = token.document._actor.system.stats.toughness.value;
        const isShaken = token.document._actor.system.status.isShaken;
        const raises = Math.floor((damage - toughness) / 4);
        const isHardy = token.document._actor.items.find(function (item) {
            return ((item.name.toLowerCase() === game.i18n.localize("SWIM.ability-hardy").toLowerCase()) && item.type === "ability");
        });
        if (toughness > damage) {
            messageContent += `<p>=> ${game.i18n.localize("SWIM.fallingDamageCalculator-resultNoHarm")}</p>`
        } else if (toughness <= damage) {
            if (isShaken === false && raises <= 0) {
                //swim.start_macro(`[Script] Unshake (SWD)`); //Can't use it for there are potentially multiple tokens selected. Need to find a way to pass the proper actor or something.
                messageContent += `<p>=> ${game.i18n.localize("SWIM.gameTerm-Shaken")}</p>`
            } else if (isShaken === false && raises >= 1) {
                messageContent += `<p>=> ${game.i18n.format("SWIM.fallingDamageCalculator-resultShakenAnd", {raises})} @Compendium[swim.swade-immersive-macros.AWEIhBfGUmhQlww5]{${game.i18n.localize("SWIM.gameTerm-Wound-plural")}}.</p>`
            } else if (isShaken === true && raises <= 1) {
                if (!isHardy || raises === 1) {
                    messageContent += `<p>=> 1 @Compendium[swim.swade-immersive-macros.AWEIhBfGUmhQlww5]{${game.i18n.localize("SWIM.gameTerm-Wound-singular")}}.</p>`
                } else if (isHardy) {
                    messageContent += `<p>=> ${game.i18n.localize("SWIM.fallingDamageCalculator-resultNoHarm")}</p>`
                }
            } else if (isShaken === true && raises >= 1) {
                let wounds = raises - 1;
                messageContent += `<p>=> ${wounds} @Compendium[swim.swade-immersive-macros.AWEIhBfGUmhQlww5]{${game.i18n.localize("SWIM.gameTerm-Wound-plural")}}.</p>`
            }
        }
    }

    async function main() {
        const officialClass = await swim.get_official_class()
        let content = game.i18n.format("SWIM.fallingDamageCalculator-dialogue", {officialClass})
        for (let token of tokens) {
            content += `
        <p>
          <img style="border: 0; text-align: left;" src="${token.document.texture.src}" width="25" height="25" /> 
          <span style="vertical-align: super; text-align: left;">${token.name}</span>
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
            title: game.i18n.localize("SWIM.fallingDamageCalculator"),
            content: content,
            buttons: {
                roll: {
                    label: game.i18n.localize("SWIM.dialogue-roll"),
                    callback: async (html) => {
                        for (let token of tokens) {
                            //Getting results from checkboxes and making the rolls.
                            let fallingDepth = Number(html.find(`#fallingDepth-${token.id}`)[0].value);
                            let snowDepth = Number(html.find(`#snowDepth-${token.id}`)[0].value);
                            let waterSuccess = html.find(`#water-${token.id}`)[0].value;
                            //console.log(fallingDepth, snowDepth, waterSuccess)
                            if (waterSuccess != "na" && snowDepth != 0) {
                                return ui.notifications.error(game.i18n.localize("SWIM.fallingDamageCalculator-cantCombineWaterAndSnow"))
                            }
                            messageContent += `<h3><img style="border: 0;" src=${token.document.texture.src} width="35" height="35" /> ${token.name}</h3>`;
                            await roll_damage(token, fallingDepth, snowDepth, waterSuccess);
                        }
                        if (officialModule === true) {
                            messageContent += `</div>`;
                        }
                        ChatMessage.create({
                            content: messageContent
                        });
                    }
                },
                cancel: {
                    label: game.i18n.localize("SWIM.dialogue-cancel")
                }
            }
        }).render(true)
    }
}