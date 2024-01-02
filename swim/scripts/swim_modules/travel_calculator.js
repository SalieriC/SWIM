/*******************************************
 * Travel Calculator Macro
 * version v.3.0.1
 * Made and maintained by SalieriC#8263
 * Future plan: Include random encounters as
 * per the core rules pg.144.
 ******************************************/
import * as SWIM from '../constants.js'

export async function travel_calculator() {
    //Get Tables:
    const enemiesTableName = game.settings.get('swim', 'encounterTableEnemies')
    const obstaclesTableName = game.settings.get('swim', 'encounterTableObstacles')
    const strangersTableName = game.settings.get('swim', 'encounterTableStrangers')
    const treasuresTableName = game.settings.get('swim', 'encounterTableTreasures')
    const enemiesTable = game.tables.getName(enemiesTableName)
    const obstaclesTable = game.tables.getName(obstaclesTableName)
    const strangersTable = game.tables.getName(strangersTableName)
    const treasuresTable = game.tables.getName(treasuresTableName)

    //Set div class based on enabled official module:
    const officialClass = await swim.get_official_class()

    const defaultOptionsArray = SWIM.TRAVEL_DEFAULTS_ARRAY
    const customOptionsArray = game.settings.get('swim', 'customTravelOptions') ? JSON.parse(game.settings.get('swim', 'customTravelOptions')) : []
    const totalOptionsArray = [...defaultOptionsArray, ...customOptionsArray]

    let options = ""
    for (let each of totalOptionsArray) {
        options += `<option value=${each.id}>${game.i18n.localize(each.name)}</option>`
    }

    let dialogueContent = `${officialClass}
    <div>
      <label for="distance"><b>${game.i18n.localize('SWIM.word-distance')}:</b></label>
      <input type="text" id="distance" name="distance" required pattern="[0-9]+" autofocus />
    </div>
    <div>
      <label for="unit"><b>${game.i18n.localize('SWIM.word-unit')}:</b></label>
      <input type="radio" id="km" name="unit" value="km" checked>
      <label for="km">${game.i18n.localize('SWIM.word-kilometres')}</label>
      <input type="radio" id="miles" name="unit" value="miles">
      <label for="miles">${game.i18n.localize('SWIM.word-miles')}</label>
    </div>`
    if (enemiesTable && obstaclesTable && strangersTable && treasuresTable) {
        dialogueContent += `<div>
        <label for="generateEncounters"><b>${game.i18n.localize("SWIM.dialogue-generateRandomEncounters")}:</b></label>
        <input type="checkbox" id="generateEncounters" name="generateEncounters" checked= "true">
        </div>`
    }
    dialogueContent += `<div>
      <label for="method"><b>${game.i18n.localize('SWIM.dialogue-methodOfTravel')}:</b></label>
      <select id="method" name="method">${options}</select>
    </div>
    <div>
        <label for="stealthMode"><b>${game.i18n.localize("SWIM.dialogue-stealthmode")}:</b></label>
        <input type="checkbox" id="stealthMode" name="stealthMode">
        <p>${game.i18n.localize("SWIM.dialogue-stealthmodeHint")}</p>
    </div>`
    if (!enemiesTable || !obstaclesTable || !strangersTable || !treasuresTable) {
        dialogueContent += `${game.i18n.localize("SWIM.dialogue-travelCalculatorWarning")}`
    }
    dialogueContent += `</div>`

    new Dialog({
        title: game.i18n.localize('SWIM.dialogue-travelCalculator'),
        content: dialogueContent,
        buttons: {
            one: {
                label: game.i18n.localize('SWIM.dialogue-accept'),
                callback: (html) => {
                    const distance = html.find('[name="distance"]').val();
                    const unit = html.find('[name="unit"]:checked').val();
                    const method = html.find('[name="method"]').val();
                    let generateEncounters = false
                    if (enemiesTable && obstaclesTable && strangersTable && treasuresTable) {
                        generateEncounters = html.find('#generateEncounters')[0].checked;
                    }
                    if (!distance || distance <= 0) {
                        return ui.notifications.error(game.i18n.localize("SWIM.notification-invalidTravelDistance"));
                    }
                    let stealthMode = html.find('#stealthMode')[0].checked;
                    calculate_results(distance, unit, method, generateEncounters, stealthMode, totalOptionsArray)
                },
            },
            two: {
                label: game.i18n.localize('SWIM.dialogue-cancel'),
            },
        },
        default: 'one',
        render: (html) => {
            $("#swim-dialogue").css("height", "auto"); // Adjust the dialogue to its content. Also fixes the error of scroll bar on first dialogue after login/reload.
            //html.find('[name="distance"]').focus();
        },
    }, {
        id: "swim-dialogue"
    }).render(true);
}

async function calculate_results(distance, unit, method, generateEncounters, stealthMode, totalOptionsArray) {
    //Have to calculate in retarded units unfortunately:
    const originalDistance = distance
    if (unit === 'km') {
        distance = distance * 0.621371192237334;
    }

    let speedPerHour = totalOptionsArray.find(o => o.id === method).speedPerHour

    // Calculate the result based on distance and speedPerHour
    const speedPerDay = speedPerHour * 8
    let result = distance / speedPerDay;
    let resultRaw = distance / speedPerHour
    //Convert result to days and hours:
    let days = Math.floor(result);
    const travelDays = days
    let hours = Math.floor((result - days) * 8);
    let resultText = days + ` ${game.i18n.localize("SWIM.word-days")}` + ", " + hours + ` ${game.i18n.localize("SWIM.word-hours")}`

    // Convert resultRaw to days and hours
    days = Math.floor(resultRaw / 24);
    hours = Math.floor(resultRaw % 24);

    let resultTextRaw = days + ` ${game.i18n.localize("SWIM.word-days")}` + ", " + hours + ` ${game.i18n.localize("SWIM.word-hours")}`;

    show_results(originalDistance, unit, method, resultText, resultTextRaw, generateEncounters, travelDays, stealthMode, totalOptionsArray)
}

async function show_results(distance, unit, method, resultText, resultTextRaw, generateEncounters, travelDays, stealthMode, totalOptionsArray) {
    const officialClass = await swim.get_official_class()
    if (generateEncounters) {
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
        const ip = new ImagePopout(totalOptionsArray.find(o => o.id === method).image).render(true);
        ip.options.title = game.i18n.localize(totalOptionsArray.find(o => o.id === method).name)
        if (stealthMode === false) {
            ip.shareImage();
            const sfx = totalOptionsArray.find(o => o.id === method).sfx
            const volume = game.settings.get('swim', 'defaultVolume')
            if (sfx) {
                swim.play_sfx(sfx, volume, true)
            }
        }
        await swim.wait('250')
        console.log(journalEntry.pages.find(j => j.type === "text"))
        const pageID = journalEntry.pages.find(j => j.type === "text")?.id
        console.log(pageID)
        journalEntry.sheet.render(true, { pageId: pageID, sheetMode: JournalSheet.VIEW_MODES.SINGLE });
        //journalEntry.sheet.render(true)
    } else {
        const ip = new ImagePopout(totalOptionsArray.find(o => o.id === method).image).render(true);
        ip.options.title = game.i18n.localize(totalOptionsArray.find(o => o.id === method).name)
        if (!stealthMode) {
            ip.shareImage();
            const sfx = totalOptionsArray.find(o => o.id === method).sfx
            const volume = game.settings.get('swim', 'defaultVolume')
            if (sfx) {
                swim.play_sfx(sfx, volume, true)
            }
        }

        //Give a little bit of time to show the dialogue above the image for the GM:
        await swim.wait('250')

        new Dialog({
            title: game.i18n.localize('SWIM.dialogue-travelCalculator'),
            content: `${game.i18n.format('SWIM.dialogue-travelCalculatorResults', {
                officialClass,
                distance,
                unit,
                resultText,
                resultTextRaw,
                method: game.i18n.localize(totalOptionsArray.find(o => o.id === method).name)
            })} </div>`,
            buttons: {
                one: {
                    label: game.i18n.localize("SWIM.dialogue-accept"),
                }
            },
            default: "one",
        }).render(true);
    }
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
        "_id": randomID(16),
        "pages": [
            {
                "sort": 100000,
                "name": "Image",
                "type": "image",
                "_id": randomID(16),
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
                "_id": randomID(16),
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