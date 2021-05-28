main();

function main() {
    // Check if a token is selected.
    if ((!token || canvas.tokens.controlled.length > 1)) {
        ui.notifications.error("Please select a single token first.");
        return;
    }

    for (let token of canvas.tokens.controlled) {
        let ppv = token.actor.data.data.powerPoints.value;
        const ppm = token.actor.data.data.powerPoints.max;
        let bv;
        let bennies;
        const fv = token.actor.data.data.fatigue.value;
        const fm = token.actor.data.data.fatigue.max;
        const wv = token.actor.data.data.wounds.value;
        const wm = token.actor.data.data.wounds.max;
        const sDrain = token.actor.data.items.find(function (item) {
            return item.name.toLowerCase() === "soul drain" && item.type === "edge";
        });
        const wBlood = token.actor.data.items.find(function (item) {
            return item.name.toLowerCase() === "whateley blood" && item.type === "edge";
        });

        //Set up
        let bennyImage = "icons/commodities/currency/coin-embossed-octopus-gold.webp";
        if (game.modules.get("swade-spices")?.active) {
            let benny_Back = game.settings.get(
                'swade-spices', 'bennyBack');
            if (benny_Back) {
                bennyImage = benny_Back;
            }
        }
        let woundedSFX = game.settings.get(
            'swim', 'woundedSFX');
        let incapSFX = game.settings.get(
            'swim', 'incapSFX');
        let fatiguedSFX = game.settings.get(
            'swim', 'fatiguedSFX');

        // Define Playlist to draw sound fx from: Replace "Magic Effects" with the name of the desired playlist.
        let myOptions = '<option value="placeHolderThatDoesNothingAtAll">No Sound</option>'
        let playListName = "Magic Effects"
        let songs = game.playlists.getName(playListName).data.sounds;
        for (let song of songs) {
            myOptions += `<option value="${song.path}">${song.name}</option>`;
        }

        let buttons = {
            one: {
                label: "Spend PP",
                callback: (html) => {
                    //Button 1: Spend Power Point(s) (uses a number given that reduces data.powerPoints.value (number field)) but can't be lower than 0.
                    let number = Number(html.find("#num")[0].value);
                    let newPP = ppv - number
                    if (newPP < 0) {
                        ui.notifications.notify("You have insufficient Power Points.")
                    }
                    else {
                        token.actor.update({ "data.powerPoints.value": newPP });
                        let songPath = html.find("[name=songname]")[0].value;
                        if (songPath !== "placeHolderThatDoesNothingAtAll") {
                            AudioHelper.play({ src: songPath }, true);
                        }

                        ChatMessage.create({
                            speaker: {
                                alias: token.name
                            },
                            content: `${token.name} spends ${number} Power Point(s) and has <b>${newPP}</b> left.`
                        })
                    }
                }
            },
            two: {
                label: "Recharge PP",
                callback: (html) => {
                    //Button 2: Recharge Power Points (uses a number given that increases the data.powerPoints.value a like amount but does not increase it above the number given in data.powerPoints.max (number field))
                    let number = Number(html.find("#num")[0].value);
                    let newPP = ppv + number
                    if (newPP > ppm) {
                        let actualPP = ppm - ppv;
                        token.actor.update({ "data.powerPoints.value": ppm });
                        ChatMessage.create({
                            speaker: {
                                alias: token.name
                            },
                            content: `${token.name} recharges ${actualPP} Power Point(s) and hits the maximum of ${ppm} (overflow prevented).`
                        })
                    }
                    else {
                        token.actor.update({ "data.powerPoints.value": newPP });
                        ChatMessage.create({
                            speaker: {
                                alias: token.name
                            },
                            content: `${token.name} recharges ${number} Power Point(s) and now has ${newPP}.`
                        })
                    }
                }
            },
            three: {
                label: "Benny Recharge",
                callback: () => {
                    //Button 3: Benny Recharge (spends a benny and increases the data.powerPoints.value by 5 but does not increase it above the number given in data.powerPoints.max)
                    bv = checkBennies();
                    if (bv < 1) {
                        return;
                    }
                    else {
                        let newPP = ppv + 5
                        if (newPP > ppm) {
                            let actualPP = ppm - ppv;
                            token.actor.update({ "data.powerPoints.value": ppm });
                            ChatMessage.create({
                                speaker: {
                                    alias: token.name
                                },
                                content: `<p><img style="border: none;" src="${bennyImage}"" width="25" height="25" /> ${token.name} recharges ${actualPP} Power Point(s) by spending a Benny and hits the maximum of ${ppm} (overflow prevented).</p>`
                            })
                        }
                        else {
                            token.actor.update({ "data.powerPoints.value": newPP });
                            ChatMessage.create({
                                speaker: {
                                    alias: token.name
                                },
                                content: `<p><img style="border: none;" src="${bennyImage}"" width="25" height="25" /> ${token.name} recharges 5 Power Point(s) using a Benny and now has ${newPP}.</p>`
                            })
                        }
                        spendBenny();
                    }
                }
            },
        };
        if (sDrain) buttons["four"] = {
            label: "Soul Drain",
            callback: () => {
                //Button 4: Soul Drain (increases data.fatigue.value by 1 and increases the data.powerPoints.value by 5 but does not increase it above the number given in data.powerPoints.max)
                let newFV = fv + 1
                if (newFV > fm) {
                    ui.notifications.notify("You cannot exceed your maximum Fatigue using Soul Drain.")
                }
                else {
                    let newPP = ppv + 5
                    if (newPP > ppm) {
                        let actualPP = ppm - ppv;
                        token.actor.update({ "data.powerPoints.value": ppm });
                        token.actor.update({ "data.fatigue.value": fv + 1 });
                        ChatMessage.create({
                            speaker: {
                                alias: token.name
                            },
                            content: `${token.name} recharges ${actualPP} Power Point(s) using Soul Drain by causing Fatigue and hits the maximum of ${ppm} (overflow prevented).`
                        })
                    }
                    else {
                        token.actor.update({ "data.powerPoints.value": newPP });
                        token.actor.update({ "data.fatigue.value": fv + 1 });
                        ChatMessage.create({
                            speaker: {
                                alias: token.name
                            },
                            content: `${token.name} recharges 5 Power Point(s) using Soul Drain by causing Fatigue and now has ${newPP}.`
                        })
                    }
                    if (fatiguedSFX) {
                        AudioHelper.play({ src: `${fatiguedSFX}` }, true);
                    }
                }
            },
        };
        if (wBlood) buttons["five"] = {
            label: "Whateley Blood",
            callback: () => {
                //Button 5: Whateley Blood (increases data.fatigue.value by 1 and increases the data.powerPoints.value by 5 or 10 for a wound; but does not increase it above the number given in data.powerPoints.max)
                new Dialog({
                    title: `Whateley Blood`,
                    buttons: {
                        wOne: {
                            label: "Fatigue (5 PP)",
                            callback: () => {
                                let newFV = fv + 1
                                if (newFV > fm) {
                                    let newPP = ppv + 5
                                    if (newPP > ppm) {
                                        token.actor.update({ "data.powerPoints.value": ppm });
                                        let actualPP = ppm - ppv;
                                        let hasAlive = false;
                                        for (let e of canvas.tokens.controlled) {
                                            if (!e.getFlag("healthEstimate", "dead")) {
                                                hasAlive = true;
                                                break
                                            }
                                        }
                                        for (let e of canvas.tokens.controlled) {
                                            e.setFlag("healthEstimate", "dead", hasAlive)
                                            game.cub.addCondition("Incapacitated")
                                            ui.notifications.info("Marked as dead");
                                        };
                                        ChatMessage.create({
                                            speaker: {
                                                alias: token.name
                                            },
                                            content: `${token.name} recharges ${actualPP} Power Point(s) using Whateley Blood by causing Fatigue, hits his maximum of ${ppm}, <b>but incapacitated himself in the process</b> (overflow prevented).`
                                        })
                                    }
                                    else {
                                        token.actor.update({ "data.powerPoints.value": newPP });
                                        let hasAlive = false;
                                        for (let e of canvas.tokens.controlled) {
                                            if (!e.getFlag("healthEstimate", "dead")) {
                                                hasAlive = true;
                                                break
                                            }
                                        }
                                        for (let e of canvas.tokens.controlled) {
                                            e.setFlag("healthEstimate", "dead", hasAlive)
                                            game.cub.addCondition("Incapacitated")
                                            ui.notifications.info("Marked as dead.");
                                        };
                                        ChatMessage.create({
                                            speaker: {
                                                alias: token.name
                                            },
                                            content: `${token.name} recharges 5 Power Point(s) using Whateley Blood by causing Fatigue, now has ${newPP}, <b>but incapacitated himself in the process</b>.`
                                        })
                                    }
                                    if (incapSFX) {
                                        AudioHelper.play({ src: `${incapSFX}` }, true);
                                    }
                                }
                                else {
                                    let newPP = ppv + 5
                                    if (newPP > ppm) {
                                        let actualPP = ppm - ppv;
                                        token.actor.update({ "data.powerPoints.value": ppm });
                                        token.actor.update({ "data.fatigue.value": fv + 1 });
                                        ChatMessage.create({
                                            speaker: {
                                                alias: token.name
                                            },
                                            content: `${token.name} recharges ${actualPP} Power Point(s) using Whateley Blood by causing Fatigue and hits the maximum ${ppm} (overflow prevented).`
                                        })
                                    }
                                    else {
                                        token.actor.update({ "data.powerPoints.value": newPP });
                                        token.actor.update({ "data.fatigue.value": fv + 1 });
                                        ChatMessage.create({
                                            speaker: {
                                                alias: token.name
                                            },
                                            content: `${token.name} recharges 5 Power Point(s) using Whateley Blood by causing Fatigue and now has ${newPP}.`
                                        })
                                    }
                                    if (fatiguedSFX) {
                                        AudioHelper.play({ src: `${fatiguedSFX}` }, true);
                                    }
                                }
                            },
                        },
                        wTwo: {
                            label: "Wound (10 PP)",
                            callback: () => {
                                let newWV = wv + 1
                                if (newWV > wm) {
                                    let newPP = ppv + 10
                                    if (newPP > ppm) {
                                        let actualPP = ppm - ppv;
                                        token.actor.update({ "data.powerPoints.value": ppm });
                                        let hasAlive = false;
                                        for (let e of canvas.tokens.controlled) {
                                            if (!e.getFlag("healthEstimate", "dead")) {
                                                hasAlive = true;
                                                break
                                            }
                                        }
                                        for (let e of canvas.tokens.controlled) {
                                            e.setFlag("healthEstimate", "dead", hasAlive)
                                            game.cub.addCondition("Incapacitated")
                                            ui.notifications.info("Marked as dead/alive.");
                                        };
                                        ChatMessage.create({
                                            speaker: {
                                                alias: token.name
                                            },
                                            content: `${token.name} recharges ${actualPP} Power Point(s) using Whateley Blood by causing a Wound, hits the maximum of ${ppm}, <b>but incapacitated himself in the process</b> (overflow prevented).`
                                        })
                                    }
                                    else {
                                        token.actor.update({ "data.powerPoints.value": newPP });
                                        let hasAlive = false;
                                        for (let e of canvas.tokens.controlled) {
                                            if (!e.getFlag("healthEstimate", "dead")) {
                                                hasAlive = true;
                                                break
                                            }
                                        }
                                        for (let e of canvas.tokens.controlled) {
                                            e.setFlag("healthEstimate", "dead", hasAlive)
                                            game.cub.addCondition("Incapacitated")
                                            ui.notifications.info("Marked as dead/alive.");
                                        };
                                        ChatMessage.create({
                                            speaker: {
                                                alias: token.name
                                            },
                                            content: `${token.name} recharges 10 Power Point(s) using Whateley Blood by causing a Wound, now has ${newPP}, <b>but incapacitated himself in the process</b>.`
                                        })
                                    }
                                    if (incapSFX) {
                                        AudioHelper.play({ src: `${incapSFX}` }, true);
                                    }
                                }
                                else {
                                    let newPP = ppv + 10
                                    if (newPP > ppm) {
                                        let actualPP = ppm - ppv;
                                        token.actor.update({ "data.powerPoints.value": ppm });
                                        token.actor.update({ "data.wounds.value": wv + 1 });
                                        ChatMessage.create({
                                            speaker: {
                                                alias: token.name
                                            },
                                            content: `${token.name} recharges ${actualPP} Power Point(s) using Whateley Blood by causing a Wound and hits the maximum of ${ppm} (overflow prevented).`
                                        })
                                    }
                                    else {
                                        token.actor.update({ "data.powerPoints.value": newPP });
                                        token.actor.update({ "data.wounds.value": wv + 1 });
                                        ChatMessage.create({
                                            speaker: {
                                                alias: token.name
                                            },
                                            content: `${token.name} recharges 10 Power Point(s) using Whateley Blood by causing a Wound and now has ${newPP}.`
                                        })
                                    }
                                    if (woundedSFX) {
                                        AudioHelper.play({ src: `${woundedSFX}` }, true);
                                    }
                                }
                            },
                        }
                    }
                }).render(true)
            }
        };

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
        }

        new Dialog({
            title: 'Power Point Management',
            content: `<form>
            <p>You currently have <b>${ppv}/${ppm}</b> Power Points.</p>
            <div class="form-group">
                <label for="num">Amount of Power Points: </label>
                <input id="num" name="num" type="number" min="0" value="5" onClick="this.select();"></input>
            </div>
            <div>
            <label for="sogname">Sound FX: </label>
            <select name="songname">${myOptions}</select>
            </div>
        </form>`,
            buttons: buttons,
            default: "one",
            render: ([dialogContent]) => {
                dialogContent.querySelector(`input[name="num"`).focus();
                dialogContent.querySelector(`input[name="num"`).select();
            },
        }).render(true)
    }
    // v4.3.2 - Made by SalieriC#8263; with a ton of help from Kandashi (He/Him)#6698, thank you so much. =) Also thank you Enrahim#5273 and Freeze#2689 for helping me with the conditional buttons and Freeze again for the sound. Thx eXaminator#0079 for the option to have no sound.
}