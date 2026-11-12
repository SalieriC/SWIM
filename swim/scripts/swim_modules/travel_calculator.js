/*******************************************
 * Travel Calculator Macro
 * version v.4.0.0 – one window (TravelApp) instead of three dialogs: the form, the encounter table selection and
 * (without encounters) the result are views of the same window.
 * Made and maintained by SalieriC#8263
 * Future plan: Include random encounters as
 * per the core rules pg.144.
 * Look: styles/unshake.css (shared `.swim-us*` classes) on top of styles/health-centre.css.
 ******************************************/
import * as SWIM from '../constants.js'

const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key))
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => `&#${m.charCodeAt(0)};`)
const TABLE_SETTINGS = [
    ['encounterTableEnemies', 'SWIM.encounterTableEnemiesName'],
    ['encounterTableObstacles', 'SWIM.encounterTableObstaclesName'],
    ['encounterTableStrangers', 'SWIM.encounterTableStrangersName'],
    ['encounterTableTreasures', 'SWIM.encounterTableTreasuresName'],
]

/** Are all four encounter tables set up (read fresh from the settings)? */
function tables_ready() {
    return TABLE_SETTINGS.every(([setting]) => !!game.tables.getName(game.settings.get('swim', setting)))
}

/** Journey time for a distance (in the chosen unit) at a speed (miles per hour). Pure. */
export function travel_times(distance, unit, speedPerHour) {
    //Have to calculate in imperial units unfortunately:
    const miles = unit === 'km' ? distance * 0.621371192237334 : distance
    const speedPerDay = speedPerHour * 8
    const result = miles / speedPerDay
    const resultRaw = miles / speedPerHour
    const days = Math.floor(result)
    const hours = Math.floor((result - days) * 8)
    const rawDays = Math.floor(resultRaw / 24)
    const rawHours = Math.floor(resultRaw % 24)
    const dayWord = t("SWIM.word-days")
    const hourWord = t("SWIM.word-hours")
    return {
        travelDays: days,
        resultText: `${days} ${dayWord}, ${hours} ${hourWord}`,
        resultTextRaw: `${rawDays} ${dayWord}, ${rawHours} ${hourWord}`,
    }
}

export async function travel_calculator() {
    await TravelApp.open()
}

function btn(action, label, { go = false, disabled = false } = {}) {
    return `<button type="button" class="swim-hc-btn ${go ? 'is-go' : ''}" data-action="${action}" ${disabled ? 'disabled' : ''}>${esc(label)}</button>`
}

class TravelApp extends Application {
    #state
    #options
    static #current = null

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'swim-travel',
            classes: ['swim-hc-app', 'swim-us-app'],
            width: 470,
            height: 'auto',
            resizable: false,
        })
    }

    get title() { return t('SWIM.dialogue-travelCalculator') }

    static async open() {
        await TravelApp.#current?.close()
        const app = new TravelApp()
        TravelApp.#current = app
        app.render(true)
    }

    constructor() {
        super()
        const custom = game.settings.get('swim', 'customTravelOptions') ? JSON.parse(game.settings.get('swim', 'customTravelOptions')) : []
        this.#options = [...SWIM.TRAVEL_DEFAULTS_ARRAY, ...custom]
        this.#state = {
            view: 'form', distance: '', unit: 'km', method: this.#options[0]?.id, encounters: true, stealth: false,
            tables: {}, result: null, busy: false,
        }
    }

    /* ------------------------------- rendering ------------------------------ */

    #selectHtml(field, items, selected) {
        return `<select data-field="${field}">${items.map(([v, l]) => `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`
    }

    #formView() {
        const st = this.#state
        const ready = tables_ready()
        const methods = this.#options.map((o) => [o.id, t(o.name)])
        const unit = (id, label) => `<div class="swim-hc-rate-opt ${st.unit === id ? 'is-on' : ''}" data-action="unit" data-unit="${id}" tabindex="0" role="radio" aria-checked="${st.unit === id}">${esc(label)}</div>`
        let body = `<div class="swim-hc-lab">${esc(t('SWIM.word-distance'))}</div>
            <div class="swim-hc-ctl"><input type="text" inputmode="decimal" data-field="distance" value="${esc(st.distance)}" autocomplete="off"></div>
            <div class="swim-hc-lab swim-hc-lab2">${esc(t('SWIM.word-unit'))}</div>
            <div class="swim-hc-rate swim-us-two">${unit('km', t('SWIM.word-kilometres'))}${unit('miles', t('SWIM.word-miles'))}</div>
            <div class="swim-hc-lab swim-hc-lab2">${esc(t('SWIM.dialogue-methodOfTravel'))}</div>
            <div class="swim-hc-ctl">${this.#selectHtml('method', methods, st.method)}</div>
            <div class="swim-hc-ctl">`
        if (ready) {
            body += `<label class="swim-hc-check"><input type="checkbox" data-field="encounters" ${st.encounters ? 'checked' : ''}> <span>${esc(t('SWIM.dialogue-generateRandomEncounters'))}</span></label>`
        }
        body += `<label class="swim-hc-check"><input type="checkbox" data-field="stealth" ${st.stealth ? 'checked' : ''}> <span>${esc(t('SWIM.dialogue-stealthmode'))}</span></label></div>
            <div class="swim-hc-preview">${esc(t('SWIM.dialogue-stealthmodeHint'))}${ready ? '' : `<div>${t('SWIM.dialogue-travelCalculatorWarning')}</div>`}</div>`
        const foot = `${btn('tables', t('SWIM.travel.tables'))}<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('calculate', t('SWIM.travel.calculate'), { go: true, disabled: st.busy })}`
        return { body, foot }
    }

    #tablesView() {
        const st = this.#state
        // `game.tables` is a collection, not an array: copy to an array first (this also keeps the collection itself unsorted).
        const available = Array.from(game.folders.getName("[SWIM] Encounter Tables") ? swim.get_folder_content("[SWIM] Encounter Tables") : game.tables)
            .sort((a, b) => a.name.localeCompare(b.name))
        const names = available.map((tb) => [tb.name, tb.name])
        let body = `<div class="swim-hc-result"><p>${esc(t('SWIM.travel.tablesHint'))}</p></div>`
        for (const [setting, label] of TABLE_SETTINGS) {
            const current = st.tables[setting] ?? game.settings.get('swim', setting)
            const items = names.some(([n]) => n === current) ? names : [[current, current], ...names]
            body += `<div class="swim-hc-lab swim-hc-lab2">${esc(t(label).replace(/:\s*$/, ''))}</div><div class="swim-hc-ctl wide">${this.#selectHtml(`table:${setting}`, items, current)}</div>`
        }
        return { body, foot: `<span class="swim-hc-spacer"></span>${btn('back', t('SWIM.travel.back'))}${btn('saveTables', t('SWIM.travel.saveTables'), { go: true })}` }
    }

    #resultView() {
        const r = this.#state.result
        const line = (label, value) => `<p><b>${esc(label)}:</b> ${esc(value)}</p>`
        const body = `<div class="swim-hc-result">${line(t('SWIM.travel.resDistance'), `${r.distance} ${r.unit}`)}${line(t('SWIM.travel.resMethod'), r.method)}` +
            `${line(t('SWIM.travel.resDays'), r.resultText)}${line(t('SWIM.travel.resNonStop'), r.resultTextRaw)}</div>` +
            `<div class="swim-hc-preview">${esc(t('SWIM.travel.resNote'))}</div>`
        return { body, foot: `<span class="swim-hc-spacer"></span>${btn('close', t('SWIM.travel.close'), { go: true })}` }
    }

    async _renderInner() {
        const st = this.#state
        const view = st.view === 'tables' ? this.#tablesView() : st.view === 'result' ? this.#resultView() : this.#formView()
        return $(`<div class="swim-hc swim-us swim-tc"><div class="swim-hc-body">${view.body}</div><footer class="swim-hc-foot">${view.foot}</footer></div>`)
    }

    /* ------------------------------- interaction ----------------------------- */

    activateListeners(html) {
        super.activateListeners(html)
        html.on('click', '[data-action]', (ev) => {
            if (ev.target.closest('select, option, input, label')) { return }
            this.#onAction(ev)
        })
        html.on('keydown', '[data-action]', (ev) => {
            if ((ev.key === 'Enter' || ev.key === ' ') && ev.currentTarget.tagName !== 'BUTTON' && ev.target === ev.currentTarget) {
                ev.preventDefault()
                this.#onAction(ev)
            }
        })
        html.on('keydown', 'input[data-field="distance"]', (ev) => {
            if (ev.key === 'Enter') { ev.preventDefault(); this.#state.distance = ev.currentTarget.value; this.#calculate() }
        })
        // Values are kept in the state without re-rendering (that would close an opened dropdown).
        html.on('change input', '[data-field]', (ev) => {
            const el = ev.currentTarget
            const field = el.dataset.field
            const value = el.type === 'checkbox' ? el.checked : el.value
            if (field.startsWith('table:')) { this.#state.tables[field.slice(6)] = value } else { this.#state[field] = value }
        })
        html.find('input[data-field="distance"]').trigger('focus')
    }

    async #onAction(ev) {
        const el = ev.currentTarget
        const st = this.#state
        if (st.busy || el.disabled) { return }
        switch (el.dataset.action) {
            case 'unit': if (st.unit === el.dataset.unit) { return } st.unit = el.dataset.unit; break
            case 'tables': st.view = 'tables'; break
            case 'back': st.view = 'form'; st.tables = {}; break
            case 'saveTables':
                for (const [setting] of TABLE_SETTINGS) {
                    if (st.tables[setting] !== undefined) { await game.settings.set('swim', setting, st.tables[setting]) }
                }
                st.tables = {}
                st.view = 'form'
                break
            case 'calculate': return this.#calculate()
            case 'cancel': case 'close': return this.close()
            default: return
        }
        this.render(false)
    }

    async #calculate() {
        const st = this.#state
        const distance = parseFloat(String(st.distance).replace(',', '.'))
        if (!Number.isFinite(distance) || distance <= 0) {
            return ui.notifications.error(t("SWIM.notification-invalidTravelDistance"))
        }
        const option = this.#options.find((o) => o.id === st.method)
        if (!option) { return ui.notifications.error(t("SWIM.notification.generalErrorMsg")) }
        const times = travel_times(distance, st.unit, option.speedPerHour)
        const encounters = st.encounters && tables_ready()
        st.busy = true
        try {
            if (encounters) {
                await create_journey(distance, st.unit, option, times, st.stealth, this.#options)
                return this.close()
            }
            show_travel_image(option, st.stealth)
            //Give a little bit of time to show the window above the image for the GM:
            await swim.wait('250')
            st.result = { distance, unit: st.unit, method: t(option.name), resultText: times.resultText, resultTextRaw: times.resultTextRaw }
            st.view = 'result'
            st.busy = false
            await this.render(false)
            this.bringToTop()
        } finally {
            st.busy = false
        }
    }

    async close(options) {
        if (TravelApp.#current === this) { TravelApp.#current = null }
        return super.close(options)
    }
}

/** Shows the image of the travel method (to everybody unless in stealth mode, then with the sound). */
function show_travel_image(option, stealthMode) {
    const ip = new ImagePopout(option.image).render(true)
    ip.options.title = t(option.name)
    if (!stealthMode) {
        ip.shareImage()
        const volume = game.settings.get('swim', 'defaultVolume')
        if (option.sfx) { swim.play_sfx(option.sfx, volume, true) }
    }
}

/** Draws the cards, evaluates the encounters, creates the journey journal entry and opens it. */
async function create_journey(distance, unit, option, times, stealthMode, totalOptionsArray) {
    const { travelDays, resultText, resultTextRaw } = times
    const method = option.id
    const officialClass = await swim.get_official_class()
    //Draw cards, evaluate them and roll for encounters here.
    //Then create a journal entry with the journey and its encounters which also has an image page and then show this image to all players.

    //First shuffle the deck and draw cards:
    swim.shuffle_deck(false, false)
    let cardsToDraw = travelDays
    if (cardsToDraw >= 54) { cardsToDraw = 54 }
    else if (cardsToDraw === 0) { cardsToDraw = 1 } //Draw at least one card if encounters are requested.
    const cards = swim.draw_cards(cardsToDraw, stealthMode)

    //Now evaluate which cards are face cards:
    const cardsEvaluated = evaluateCards(cards)

    //Now create the jorunal entry, first the prerequisites:
    let folderId = game.folders.getName(`[SWIM] ${game.i18n.localize("SWIM.word-Journeys")}`)?.id
    if (!folderId) {
        //Create folder if non-existent:
        const newFolder = await Folder.create({
            "name": "[SWIM] Journeys",
            "sorting": "a",
            "folder": null,
            "type": "JournalEntry",
            "sort": 0,
            "color": null,
            "flags": {
                "swim": {
                    "isJourneyFolder": true
                }
            }
        })
        folderId = newFolder.id
    }
    let numCurrJourneys = game.folders.get(folderId).contents.length
    const journalContent = await createJournalContent(cardsEvaluated, numCurrJourneys, folderId, method, officialClass, distance, unit, resultText, resultTextRaw, totalOptionsArray)
    const journalEntry = await JournalEntry.create(journalContent)

    // Show image to all and - for the GM - the Journal:
    show_travel_image(option, stealthMode)
    await swim.wait('250')
    const pageID = journalEntry.pages.find(j => j.type === "text")?.id
    journalEntry.sheet.render(true, { pageId: pageID, sheetMode: JournalSheet.VIEW_MODES.SINGLE });
}

function evaluateCards(cards, replaceJokers = false, useAllCards = false) {
    let cardsEvaluated = [];

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];

        if ((
            card.includes("Ace") || card.includes("Jack") || card.includes("Queen") || card.includes("King")
        ) ||
            (
                useAllCards && !card.includes('Joker')
            )) {
            const suit = card.split(" ")[2].toLowerCase();
            cardsEvaluated.push(suit);
        } else if (card.includes("Joker")) {
            cardsEvaluated.push("joker");
        } else {
            cardsEvaluated.push(0);
        }
    }

    if (replaceJokers === true) {
        for (let i = 0; i < cardsEvaluated.length; i++) {
            if (cardsEvaluated[i] === "joker") {
                let newCards = swim.draw_cards(1, false);
                if (newCards[0].includes("Joker")) { //At least I can be sure that there are no more than two jokers in a deck...
                    newCards = swim.draw_cards(1, false);
                }
                let newCard = newCards[0]
                if (useAllCards || (card.includes("Ace") || card.includes("Jack") || card.includes("Queen") || card.includes("King"))) {
                    newCard.split(" ")[2].toLowerCase()
                } else { newCard = 0 }
                cardsEvaluated[i] = newCard;
            }
        }
    }

    return cardsEvaluated;
}

async function createJournalContent(cardsEvaluated, numCurrJourneys, folderId, method, officialClass, distance, unit, resultText, resultTextRaw, totalOptionsArray) {
    //Get Tables:
    const enemiesTableName = game.settings.get('swim', 'encounterTableEnemies')
    const obstaclesTableName = game.settings.get('swim', 'encounterTableObstacles')
    const strangersTableName = game.settings.get('swim', 'encounterTableStrangers')
    const treasuresTableName = game.settings.get('swim', 'encounterTableTreasures')
    const enemiesTable = game.tables.getName(enemiesTableName)
    const obstaclesTable = game.tables.getName(obstaclesTableName)
    const strangersTable = game.tables.getName(strangersTableName)
    const treasuresTable = game.tables.getName(treasuresTableName)

    let text = officialClass + `<h2>` + game.i18n.localize("SWIM.word-Statistics") + `</h2>` + game.i18n.format('SWIM.dialogue-travelCalculatorResults', {
        officialClass: '',
        distance,
        unit,
        resultText,
        resultTextRaw,
        method: game.i18n.localize(totalOptionsArray.find(o => o.id === method).name)
    })
    text += `<h2>${game.i18n.localize("SWIM.dialogue-travelCalculatorEncounters")}</h2>`

    if (cardsEvaluated.every(value => value === 0)) {
        console.log(cardsEvaluated)
        text += `<p>${game.i18n.localize("SWIM.dialogue-travelCalculatorNoEncounters")}</p>`
    } else {
        text += `<p>${game.i18n.localize("SWIM.dialogue-travelCalculatorEncountersIntro")}</p>`
        for (let i = 0; i < cardsEvaluated.length; i++) {
            let description
            let tableDraw
            switch (cardsEvaluated[i]) {
                case "spades":
                    tableDraw = await enemiesTable.draw({ displayChat: false })
                    description = '<p>' + tableDraw.results[0].text + '</p>';
                    text += `<h3>${game.i18n.localize("SWIM.word-Day-singular")} #${i + 1}: ${game.i18n.localize("SWIM.gameTerm-travel-Enemies")}</h3><p>${description}</p>`;
                    break;
                case "hearts":
                    tableDraw = await strangersTable.draw({ displayChat: false })
                    description = '<p>' + tableDraw.results[0].text + '</p>';
                    text += `<h3>${game.i18n.localize("SWIM.word-Day-singular")} #${i + 1}: ${game.i18n.localize("SWIM.gameTerm-travel-Strangers")}</h3><p>${description}</p>`;
                    break;
                case "diamonds":
                    tableDraw = await treasuresTable.draw({ displayChat: false })
                    description = '<p>' + tableDraw.results[0].text + '</p>';
                    text += `<h3>${game.i18n.localize("SWIM.word-Day-singular")} #${i + 1}: ${game.i18n.localize("SWIM.gameTerm-travel-Treasure")}</h3><p>${description}</p>`;
                    break;
                case "clubs":
                    tableDraw = await obstaclesTable.draw({ displayChat: false })
                    description = '<p>' + tableDraw.results[0].text + '</p>';
                    text += `<h3>${game.i18n.localize("SWIM.word-Day-singular")} #${i + 1}: ${game.i18n.localize("SWIM.gameTerm-travel-Obstacle")}</h3><p>${description}</p>`;
                    break;
                case "joker":
                    //I hate jokers...
                    text += `<h3>${game.i18n.localize("SWIM.word-Day-singular")} #${i + 1}: `;
                    description = '<ol><li>'
                    swim.shuffle_deck(false, false) //I could claim you reshuffle after a Joker but I beleive this doesn't apply for travels and I'm lazy so I just reshuffle to not run out of cards.
                    const jokerCards = swim.draw_cards(2, true)
                    //Evaluate cards and redraw jokers:
                    const jokerCardsEvaluated = evaluateCards(jokerCards, true, true)
                    console.log(jokerCardsEvaluated)
                    for (let i = 0; i < jokerCardsEvaluated.length; i++) {
                        if (jokerCardsEvaluated[i].includes('spades')) {
                            tableDraw = await enemiesTable.draw({ displayChat: false })
                            description += tableDraw.results[0].text + '</li>';
                            text += `${game.i18n.localize("SWIM.gameTerm-travel-Enemies")}`;
                        } else if (jokerCardsEvaluated[i].includes('hearts')) {
                            tableDraw = await strangersTable.draw({ displayChat: false })
                            description += tableDraw.results[0].text + '</li>';
                            text += `${game.i18n.localize("SWIM.gameTerm-travel-Strangers")}`;
                        } else if (jokerCardsEvaluated[i].includes('diamonds')) {
                            tableDraw = await treasuresTable.draw({ displayChat: false })
                            description += tableDraw.results[0].text + '</li>';
                            text += `${game.i18n.localize("SWIM.gameTerm-travel-Treasure")}`;
                        } else if (jokerCardsEvaluated[i].includes('clubs')) {
                            tableDraw = await obstaclesTable.draw({ displayChat: false })
                            description += tableDraw.results[0].text + '</li>';
                            text += `${game.i18n.localize("SWIM.gameTerm-travel-Obstacle")}`;
                        }
                        if (i === 0) {
                            text += ' & '
                            description += '<li>'
                        } else if (i === 1) {
                            text += '</h3>'
                            description += '</ol>'
                        }
                    }
                    text += description;
                    break;
                default:
                    // Do nothing for other values
                    break;
            }
        }
    }
    //Some corrections in case the roll table has paragraph tags:
    text = text.replaceAll(/<p><\/p>/gm, "")
    text = text.replaceAll(/<p><p>/gm, "<p>")
    text = text.replaceAll(/<\/p><\/p>/gm, "</p>")

    let content = {
        "name": `${game.i18n.localize("SWIM.word-Journey")} #${(numCurrJourneys + 1).toString().padStart(3, '0')}`, //padStart adds leading zeros so that the number is always three digits long (required for proper sorting)
        "_id": foundry.utils.randomID(16),
        "pages": [
            {
                "sort": 100000,
                "name": "Image",
                "type": "image",
                "_id": foundry.utils.randomID(16),
                "title": {
                    "show": true,
                    "level": 1
                },
                "image": {
                    "caption": `${game.i18n.localize(totalOptionsArray.find(o => o.id === method).name)} ${game.i18n.localize("SWIM.word-Journey")}`
                },
                "src": totalOptionsArray.find(o => o.id === method).image,
                "system": {},
                "ownership": {
                    "default": -1
                }
            },
            {
                "sort": 200000,
                "name": game.i18n.localize("SWIM.dialogue-travelCalculatorJourneyOverview"),
                "type": "text",
                "_id": foundry.utils.randomID(16),
                "title": {
                    "show": true,
                    "level": 1
                },
                "image": {},
                "text": {
                    "format": 1,
                    "content": text
                },
                "ownership": {
                    "default": -1
                }
            }
        ],
        "folder": folderId,
        "sort": 100000,
        "ownership": {
            "default": 0
        },
        "flags": {
            "swim": {
                "isJourney": true
            }
        }
    }

    return content;
}