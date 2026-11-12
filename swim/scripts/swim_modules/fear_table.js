import { swimConditions } from '../helpers/conditions.js'
import { SwimWindow, t, esc, btn, token_img, tokens_header } from '../helpers/swim_window.js'
/*******************************************
 * Fear Table Macro.
 * v. 4.0.0 – window (FearApp) instead of a Dialog
 * v. 3.0.4 by SalieriC#8263, original creator unknown.
 *******************************************/
export async function fear_table_script() {
    let { speaker, _, __, token } = await swim.get_macro_variables()
    const targets = Array.from(game.user.targets)
    const officialClass = await swim.get_official_class()

    // No Token is Selected
    if (!token || canvas.tokens.controlled.length > 1 || targets.length < 1) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectOneAndTargetAnyNumber"));
        return;
    }

    const fearAbility = token.actor.items.find(a => a.system.swid === "fear" && a.type === "ability") //Failsafe in case other items include the word "Fear".
    let fearPenalty = 0
    let fearPenaltyInverse = 0
    if (fearAbility) {
        const name = fearAbility.name
        let num = name.match(/[-−+‐][0-9]/gm)
        if (num) {
            num = num[0].replace(/[-−‐]/gm, "-")
            fearPenalty = Number(num)
            fearPenaltyInverse = fearPenalty * -1 //Make the modifier positive for the table.
        } else { //Failsafe in case there is no number on the found item.
            fearPenalty = 0
            fearPenaltyInverse = 0
        }
    }

    // Rolls on the fear table for every target and applies the effects.
    async function roll_fear(modifier) {
        const fearTableName = game.settings.get('swim', 'fearTable');
        if (!fearTableName) {
            ui.notifications.error(game.i18n.format("SWIM.notification.tableNameMissing", { type: game.i18n.localize("SWIM.fear") }));
            return false
        }
        const fearTable = game.tables.getName(`${fearTableName}`)
        if (!fearTable) {
            ui.notifications.error(game.i18n.format("SWIM.notification.tableNotFound", { tableName: fearTableName }))
            return false
        }
        for (let target of targets) {
            const roll = new Roll('1d20 + @mod', { mod: modifier });
            const results = await fearTable.draw({ displayChat: false, roll });
            const total = results.roll.total
            const chatData = `<div class="table-draw">
            <ol class="table-results">
                    <li class="table-result flexrow" data-result-id="${results.results[0]._id}">
                        <img class="result-image" src="${results.results[0].img}" />
                        <div class="result-text"><strong style="text-align:center">${target.name}</strong><br />${results.results[0].text}</div>
                    </li>
                </ol>
            </div>`
            await ChatMessage.create({ content: chatData });
            await swim.wait(100) //Fights the race condition so that effect chat messages are created before the next targets result.
            await add_effects(total, target)
        }
        let fearSFX = game.settings.get('swim', 'fearSFX');
        if (fearSFX) { swim.play_sfx(fearSFX); }
        return true
    }

    await SwimWindow.show(new FearApp({ token, targets, fearPenalty, fearPenaltyInverse, roll: roll_fear }))

    async function add_effects(total, target) {
        const token = target
        const actor = target.actor
        const hesitant = actor.system.initiative.hasHesitant === true ? true : actor.items.find(i => i.name === game.i18n.localize("SWIM.hindrance-hesitant") && i.type === "hindrance")
        if (hesitant && total >= 14 && total <= 15) { total = 16 } //If already hesitant, adjust total to panicked instead.
        if (total <= 3) {
            //Adrenaline Surge (act as if a joker this turn): +2 to all trait rolls and damage rolls.
            //SWADE global modifiers (system.stats.globalMods.*) apply to every Trait and damage roll, no per-item changes needed.
            const changes = [
                { key: 'system.stats.globalMods.trait', mode: 2, priority: undefined, value: 2 },
                { key: 'system.stats.globalMods.damage', mode: 2, priority: undefined, value: 2 }
            ]

            let duration = {
                rounds: 0,
                startRound: token.combatant != null ? game.combat.round : 0,
                startTurn: 0,
                turns: 1
            }

            let effData = {
                changes: changes,
                icon: "icons/magic/life/heart-cross-strong-flame-purple-orange.webp",
                name: game.i18n.localize("SWIM.fearResult-AdrenalineSurge"),
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
            await swimConditions.add('distracted', actor);
        } else if (total >= 7 && total <= 9) {
            //Vulnerable
            await swimConditions.add('vulnerable', actor);
        } else if (total >= 10 && total <= 12) {
            //Shaken
            await swimConditions.add('shaken', actor);
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
            if (await swimConditions.has('stunned', actor) === false) {
                await swim.stun(token)
            }
        } else if (total >= 14 && total <= 15) {
            //Frightened: Hesitant until end of encounter, panicked if alread is hesitant
            await swimConditions.add('frightened', actor);
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
            await gain_phobia(actor, major, total)
        } else if (total >= 20 && total <= 21) {
            //Phobia, Major
            const major = true
            await gain_phobia(actor, major, total)
        } else if (total >= 22) {
            //Heart Attack: Vigor at -2; Success = Stunned, Failure = Death in 2d6 Rounds, healing at -4 saves him but remains Inc.
            const roll = await actor.rollAttribute('vigor', {
                title: game.i18n.localize("SWIM.fearResult-HeartAttack"),
                flavour: game.i18n.localize("SWIM.fearResult-HeartAttack"),
                additionalMods: [
                    {
                        label: game.i18n.localize("SWIM.fearResult-HeartAttack"),
                        value: -2,
                    },
                ],
            })
            const total = roll.total
            let chatData = ""
            if (total >= 4) {
                if (await swimConditions.has('stunned', actor) === false) {
                    await swim.stun(token)
                }
                chatData = `${officialClass}<p>${game.i18n.format("SWIM.chatMessage-heartAttackSuccessMessage", { name: token.name })}</p></div>`
            } else {
                const pronoun = swim.get_pronoun(actor)
                const roundRoll = await new Roll(`2d6`).evaluate({ async: false });
                const rounds = roundRoll.total
                // SUCC's addCondition returns the created/updated effects.
                const effects = await swimConditions.add('heart-attack', token, {forceOverlay: true});
                const eff = effects?.[0] //Only expect a single effect returned.
                const data = {
                    duration: {
                        rounds: rounds,
                        startRound: token.combatant != null ? game.combat.round : 0,
                        seconds: rounds * 6
                    },
                    flags: {
                        swade: {
                            expiration: 3,
                            loseTurnOnHold: true
                        }
                    }
                }
                if (eff) { await eff.update(data) }
                chatData = `${officialClass}<p>${game.i18n.format("SWIM.chatMessage-heartAttackFailureMessage", { name: token.name, rounds: rounds, pronoun: pronoun })}</p></div>`
            }
            ChatMessage.create({ content: chatData });
        }
    }
}

async function gain_phobia(actor, major, total) {
    const officialClass = await swim.get_official_class()
    const hindranceCompendium = await swim.get_official_compendium_key('hindrances')
    let originalText = ``
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
        name: game.i18n.localize("SWIM.fearResult-Phobia"),
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

class FearApp extends SwimWindow {
    #ctx

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, { id: 'swim-fear-table', width: 460 })
    }

    get title() { return t('SWIM.fear') }

    constructor(ctx) {
        super()
        this.#ctx = ctx
        this.state = { fearModifier: String(ctx.fearPenaltyInverse) }
    }

    async view() {
        const { token, targets, fearPenalty } = this.#ctx
        const chips = targets.map((tg) => `<span class="swim-hc-chip"><img src="${esc(token_img(tg))}" alt="" width="18" height="18"> ${esc(tg.name)}</span>`).join(' ')
        return {
            head: tokens_header([{ token, small: t('SWIM.fearWin.source') }]),
            body: `<div class="swim-hc-result"><p>${t('SWIM.fearWin.intro')}</p><p>${t('SWIM.fearWin.detected', { mod: fearPenalty })}</p></div>
                <div class="swim-hc-lab">${esc(t('SWIM.fearWin.modifier'))}</div>
                <div class="swim-hc-ctl"><input type="number" data-field="fearModifier" value="${esc(this.state.fearModifier)}"></div>
                <div class="swim-hc-lab swim-hc-lab2">${esc(t('SWIM.fearWin.targets'))}</div><div class="swim-fear-targets">${chips}</div>`,
            foot: `<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('roll', t('SWIM.fearWin.roll'), { go: true })}`,
        }
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('input[data-field="fearModifier"]').trigger('focus').trigger('select')
        html.on('keydown', 'input[data-field="fearModifier"]', (ev) => {
            if (ev.key === 'Enter') { ev.preventDefault(); this.state.fearModifier = ev.currentTarget.value; this.onAction('roll') }
        })
    }

    async onAction(action) {
        if (action === 'cancel') { return this.close() }
        if (action !== 'roll') { return }
        const modifier = parseInt(this.state.fearModifier) || 0
        this.busy = true
        let ok = false
        try { ok = await this.#ctx.roll(modifier) } finally { this.busy = false }
        if (ok) { return this.close() }
    }
}
