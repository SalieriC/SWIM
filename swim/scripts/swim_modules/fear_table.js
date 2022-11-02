/*******************************************
 * Fear Table Macro.
 * v. 2.1.1 by SalieriC#8263, original creator unknown.
 *******************************************/
export async function fear_table_script() {
    let { speaker, _, __, token } = await swim.get_macro_variables()

    // No Token is Selected
    if ((!token || canvas.tokens.controlled.length > 1)) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
        return;
    }
    const dialog = new Dialog({
        title: game.i18n.localize("SWIM.fear"),
        content: game.i18n.format("SWIM.dialogue-fearContent"),
        default: 'roll',
        buttons: {
            roll: {
                label: game.i18n.localize("SWIM.dialogue-roll"),
                callback: async (html) => {
                    let modifier = html.find('.fearTable input[name="fearModifier"]')[0].value;

                    if (modifier === '') {
                        modifier = 0;
                    }

                    modifier = parseInt(modifier);
                    const roll = new Roll('1d20 + @mod', { mod: modifier });
                    let fearTableName = game.settings.get(
                        'swim', 'fearTable');
                    if (fearTableName) {
                        let fearTable = game.tables.getName(`${fearTableName}`)
                        if (!fearTable) {
                            ui.notifications.error(game.i18n.format("SWIM.notification.tableNotFound", { tableName: fearTableName }))
                            return
                        } else {
                            const results = await fearTable.draw({ roll });
                            const total = results.roll.total
                            add_effects(total)
                        }
                    }
                    else {
                        ui.notifications.error(game.i18n.localize("SWIM.notification.tableNameMissing", { type: game.i18n.localize("SWIM.fear") }));
                        return;
                    }
                    let fearSFX = game.settings.get(
                        'swim', 'fearSFX');
                    if (fearSFX) {
                        AudioHelper.play({ src: `${fearSFX}` }, true);
                    }
                }
            }
        },
        render: ([dialogContent]) => {
            dialogContent.querySelector(`input[name="fearModifier"`).focus();
        },
        default: "roll"
    });
    dialog.render(true);

    async function add_effects(total) {
        const officialClass = await swim.get_official_class()
        const actor = token.actor
        const hesitant = actor.system.initiative.hasHesitant === true ? true : actor.items.find(i => i.name === game.i18n.localize("SWIM.hindrance-hesitant") && i.type === "hindrance")
        if (hesitant && total >= 14 && total <= 15) { total = 16 } //If already hesitant, adjust total to panicked instead.
        if (total <= 3) {
            //Adrenaline Surge (act as if a joker this turn)
            let changes = []
            for (let each of actor.items.filter(e => e.type === "weapon" || e.type === "power")) {
                changes.push({ key: `@${each.type}{${each.name}}[system.actions.dmgMod]`, mode: 2, priority: undefined, value: 2 })
            } for (let skill of actor.items.filter(s => s.type === "skill")) {
                changes.push({ key: `@Skill{${skill.name}}[system.die.modifier]`, mode: 2, priority: undefined, value: 2 })
            }

            let duration = {
                rounds: 0,
                startRound: token.combatant != null ? game.combat.round : 0,
                startTurn: 0,
                turns: 1
            }

            let effData = {
                changes: changes,
                icon: "icons/magic/life/heart-cross-strong-flame-purple-orange.webp",
                label: game.i18n.localize("SWIM.fearResult-AdrenalineSurge"),
                duration: duration,
                flags: {
                    swade: {
                        expiration: 2
                    },
                    swim: {
                        fearResult: "Adrenaline Surge",
                        tableResult: total
                    }
                }
            }
            await actor.createEmbeddedDocuments('ActiveEffect', [effData]);
        } else if (total >= 4 && total <= 6) {
            //Distracted
            await succ.apply_status(actor, "distracted", true)
        } else if (total >= 7 && total <= 9) {
            //Vulnerable
            await succ.apply_status(actor, "vulnerable", true)
        } else if (total >= 10 && total <= 12) {
            //Shaken
            await succ.apply_status(actor, "shaken", true)
        } else if (total === 13) {
            //Mark of Fear: Stunned + Cosmetic Change
            const hindrance = {
                "name": game.i18n.localize("SWIM.fearResult-MarkOfFear"),
                "type": "hindrance",
                "img": "icons/skills/toxins/symbol-poison-drop-skull-green.webp",
                "system": {
                    "description": `${officialClass}<p>${game.i18n.localize("SWIM.fearResult-MarkOfFearDesc")}</p>`,
                    "notes": "",
                    "additionalStats": {},
                    "favorite": false,
                    "major": false,
                    "source": ""
                },
                "effects": [],
                "flags": {
                    swim: {
                        fearResult: "Mark of Fear",
                        tableResult: total
                    }
                }
            }
            await actor.createEmbeddedDocuments('Item', [hindrance], { renderSheet: true });
            if (await succ.check_status(actor, 'stunned') === false) {
                await swim.unstun()
            }
        } else if (total >= 14 && total <= 15) {
            //Frightened: Hesitant until end of encounter, panicked if alread is hesitant
            await succ.apply_status(actor, "frightened", true)
        } else if (total >= 16 && total <= 17) {
            //Panicked: Move full pace + Running die away + Shaken
            const runningDie = `1d${actor.system.stats.speed.runningDie}`
            let runningMod = actor.system.stats.speed.runningMod
            if (runningMod >= 0) { runningMod = `+ ${runningMod}` }
            const pace = actor.system.stats.speed.adjusted
            let rollPace = await new Roll(`${pace} + ${runningDie} ${runningMod}`).evaluate({ async: false });
            let totalPace = rollPace.total;
            const chatData = `${officialClass}<p>${game.i18n.format("SWIM.chatMessage-panickedRollMessage", { name: token.name, pace: totalPace })}</p></div>`
            ChatMessage.create({ content: chatData });
        } else if (total >= 18 && total <= 19) {
            //Phobia, Minor
            const major = false
            await gain_phobia(actor, major, total, officialClass)
        } else if (total >= 20 && total <= 21) {
            //Phobia, Major
            const major = true
            await gain_phobia(actor, major, total, officialClass)
        } else if (total >= 22) {
            //Heart Attack: Vigor at -2; Success = Stunned, Failure = Death in 2d6 Rounds, healing at -4 saves him but remains Inc.
            //For this: Make addition to healing macro.
        }
    }
}

async function gain_phobia(actor, major, total, officialClass) {
    let hindranceCompendium = false
    let originalText = ``
    if (game.modules.get("swpf-core-rules")?.active) { hindranceCompendium = "swpf-core-rules.swpf-hindrances" }
    else if (game.modules.get("swade-core-rules")?.active) { hindranceCompendium = "swade-core-rules.swade-hindrances" }
    if (hindranceCompendium) {
        //Get the phobia hindrance from compendium:
        const pack = game.packs.get(hindranceCompendium)
        const phobiaItemId = pack.index.getName(game.i18n.localize("SWIM.hindrance-phobia"))._id;
        if (phobiaItemId) {
            const phobiaItem = await pack.getDocument(phobiaItemId)
            let phobiaText = phobiaItem.system.description
            if (phobiaText.includes("<article class=")) {
                phobiaText = phobiaText.replace(/<article class=".+">\n/g, "")
                let lIndex = phobiaText.lastIndexOf("</article>");
                phobiaText = phobiaText.substring(0, lIndex)
            } else if (phobiaText.includes("<div class=")) {
                phobiaText = phobiaText.replace(/<div class=".+">\n/g, "")
                let lIndex = phobiaText.lastIndexOf("</div>");
                phobiaText = phobiaText.substring(0, lIndex)
            }
            originalText = `<hr />${phobiaText}`
        }
    }

    const mod = major ? -2 : -1
    let changes = [
        { key: `system.attributes.agility.die.modifier`, mode: 2, priority: undefined, value: mod },
        { key: `system.attributes.smarts.die.modifier`, mode: 2, priority: undefined, value: mod },
        { key: `system.attributes.spirit.die.modifier`, mode: 2, priority: undefined, value: mod },
        { key: `system.attributes.strength.die.modifier`, mode: 2, priority: undefined, value: mod },
        { key: `system.attributes.vigor.die.modifier`, mode: 2, priority: undefined, value: mod }
    ]
    for (let skill of actor.items.filter(s => s.type === "skill")) {
        changes.push({ key: `@Skill{${skill.name}}[system.die.modifier]`, mode: 2, priority: undefined, value: mod })
    }

    let effData = {
        changes: changes,
        icon: "icons/magic/death/skull-horned-worn-fire-blue.webp",
        label: game.i18n.localize("SWIM.fearResult-Phobia"),
        flags: {
            swade: {
                "favorite": true
            },
            swim: {
                fearResult: `Phobia, ${major ? "major" : "minor"}`,
                tableResult: total
            }
        }
    }

    const hindrance = {
        "name": game.i18n.localize("SWIM.hindrance-phobia"),
        "type": "hindrance",
        "img": "icons/magic/death/skull-horned-worn-fire-blue.webp",
        "system": {
            "description": `${officialClass}<p>${game.i18n.localize("SWIM.fearResult-PhobiaDesc")}</p>${originalText}`,
            "notes": "",
            "additionalStats": {},
            "favorite": false,
            "major": major,
            "source": ""
        },
        "effects": [effData],
        "flags": {
            swim: {
                fearResult: `Phobia, ${major ? "major" : "minor"}`,
                tableResult: total
            }
        }
    }
    await actor.createEmbeddedDocuments('Item', [hindrance], { renderSheet: true });
}