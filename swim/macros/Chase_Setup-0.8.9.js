//To be used with the included chase layouts.

// Card related constants
const MAX_CARDS=18;
const CARDS_PER_ROW=9;
const DEF_NUM_CARDS=CARDS_PER_ROW;
// Pixel related constants
const DEF_GRID_PIXELS=50;
const DEF_BORDER_HORIZ=0;
const DEF_BORDER_VERT=0;
// Card dimensions in grid units
const DEF_CARD_HEIGHT=6;
const DEF_CARD_WIDTH=4;
// Deck origin in grid units
const DEF_DECK_DOWN=2
const DEF_DECK_RIGHT=2

getRequirements();

function getRequirements() {
    let cardsList = "";
    let defaultDeck = game.settings.get(
        'swim', 'chaseDeck');
    if (defaultDeck) {
        let defaultOption = game.tables.getName(`${defaultDeck}`)
        if (defaultOption) {
        cardsList += `<option value="${defaultOption.name}">${defaultOption.name}</option>`;
        }
    }
    //Filter tables to only include those likely to be set up.
    const options = game.tables.filter(t =>
        t.name !== `${defaultDeck}` && (
        t.name.includes(`Chase`) ||
        t.name.includes(`Deck`) ||
        t.name.includes(`Cards`))
        );
    Array.from(options).map((el) => {
        cardsList += `<option value="${el.data.name}">${el.data.name}</option>`
    });

    let template = `
        <p>Table to Draw From: <select id="tableName">${cardsList}</select></p>
        <p>Number of Cards to Draw: <input id="drawAmt" type="number" style="width: 50px;" value=${DEF_NUM_CARDS}></p>
        <hr>
        <p>Pixel Sizes:</p>
        <p>Per Grid Unit: <input id="gridPixels" type="number" style="width: 50px;" value=${DEF_GRID_PIXELS}></p>
        <p>
            Horizontal Border: <input id="borderHoriz" type="number" style="width: 50px;" value=${DEF_BORDER_HORIZ}>
            Vertical Border: <input id="borderVert" type="number" style="width: 50px;" value=${DEF_BORDER_VERT}>
        </p>
        <hr>
        <p>Card Dimensions (in grid units):</p>
        <p>
            Height: <input id="cardHeight" type="number" style="width: 50px;" value=${DEF_CARD_HEIGHT}>
            Width: <input id="cardWidth" type="number" style="width: 50px;" value=${DEF_CARD_WIDTH}>
        </p>
        <hr>
        <p>Position of Deck From Top Left (in grid units):</p>
        <p>
            Down: <input id="deckDown" type="number" style="width: 50px;" value=${DEF_DECK_DOWN}>
            Right: <input id="deckRight" type="number" style="width: 50px;" value=${DEF_DECK_RIGHT}>
        </p>
        `;

    new Dialog({
        title: "Chase Layout Manager",
        content: template,
        buttons: {
            ok: {
                label: `<i class="fas fa-check"></i> Draw`,
                callback: async (html) => {
                    makeChase(html);
                },
            },
            reset: {
                label: `<i class="fas fa-recycle"></i> Reset`,
                callback: async (html) => {
                    resetChase(html);
                }
            },
            cancel: {
                label: `<i class="fas fa-times"></i> Cancel`,
            },
        },
    }).render(true);
}

async function makeChase(html) {
    let tableName = html.find("#tableName")[0].value;
    let cardsToDraw = html.find("#drawAmt")[0].value;
    let gridPixels = Number(html.find("#gridPixels")[0].value);
    let borderHoriz = Number(html.find("#borderHoriz")[0].value);
    let borderVert = Number(html.find("#borderVert")[0].value);
    let cardHeight = Number(html.find("#cardHeight")[0].value) * gridPixels;
    let cardWidth = Number(html.find("#cardWidth")[0].value) * gridPixels;
    let deckDown = Number(html.find("#deckDown")[0].value) * gridPixels;
    let deckRight = Number(html.find("#deckRight")[0].value) * gridPixels;
    if (cardsToDraw > MAX_CARDS) {
        ui.notifications.error("You can't set up more than " + MAX_CARDS + " cards on this layout.")
        ui.notifications.notify("Setting up " + MAX_CARDS + " cards instead.")
        cardsToDraw = MAX_CARDS;
    }

    let cardDraws = (
        await game.tables
            .find((el) => el.data.name == tableName)
            .drawMany(cardsToDraw, { displayChat: false })
    ).results;
    
    AudioHelper.play({ src: `systems/swade/assets/card-flip.wav` }, true);
    
    for (let i = 0; i < cardsToDraw; i++) {
        let row = parseInt( i / CARDS_PER_ROW );
        let col = i % CARDS_PER_ROW;
        let xPosition = deckRight + ( col * ( cardWidth + borderHoriz ) );
        let yPosition = deckDown + ( row * ( cardHeight + borderVert ) );
        
        const tileData = {
            img: cardDraws[i].data.img,
            width: cardWidth,
            height: cardHeight,
            x: xPosition,
            y: yPosition,
            'flags.swim.isChaseCard': true
        };
        await TileDocument.create(tileData, { parent: canvas.scene });
    }
}

async function resetChase(html) {
    let tableName = html.find("#tableName")[0].value;
    const table = await game.tables.find((t) => t.data.name === tableName);
    table.reset();
    AudioHelper.play({ src: `systems/swade/assets/card-flip.wav` }, true);

    const delete_ids = canvas.scene.data.tiles
        .filter(t => !!t.getFlag('swim', 'isChaseCard') === true)
        .map(t => t.id);

    await canvas.scene.deleteEmbeddedDocuments("Tile", delete_ids);
    ui.notifications.info(`All tiles from ${tableName} have been shuffled into the deck.`)
//v.1.0.1 by SalieriC#8263, flag use inspired by a macro from brunocalado#1650, assisted by Kekilla#7036
}
