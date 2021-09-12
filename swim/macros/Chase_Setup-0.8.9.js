//To be used with the included chase layouts.

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
  <p>Number of Cards to Draw: <input id="drawAmt" type="number" style="width: 50px;" value=18></p>
  `/*`
  <p>
    Height: <input id="height" type="number" style="width: 50px" value=300>
    Width: <input id="width" type="number" style="width: 50px" value=200>
  </p>
  `*/;
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
    let _height = 300;
    let _width = 200;
    if (cardsToDraw > 18) {
        ui.notifications.error("You can't set up more than 18 cards on this layout.")
        ui.notifications.notify("Setting up 18 cards instead.")
        cardsToDraw = 18;
    }

    let cardDraws = (
        await game.tables
            .find((el) => el.data.name == tableName)
            .drawMany(cardsToDraw, { displayChat: false })
    ).results;
    
    AudioHelper.play({ src: `systems/swade/assets/card-flip.wav` }, true);
    
    for (let i = 0; i < cardsToDraw; i++) {
        let xPosition = 500 + i % 9 * 200;
        let yPosition = (i > 8) ? 1500 : 1200;
        /*if (i > 8) {
            yStart = 1500;
        }*/
        const tileData = {
            img: cardDraws[i].data.img,
            width: _width,
            height: _height,
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
    /*const chaseCards = await canvas.scene.data.tiles.filter(t => t.flags?.swim?.isChaseCard === true);
    if (chaseCards.length) {
        for await (const card of chaseCards) {
            await card.delete();
        }*/
    const delete_ids = canvas.scene.data.tiles
        //.filter(t => !!t.value?.data?.flags?.swim?.isChaseCard)
        .filter(t => !!t.getFlag('swim', 'isChaseCard') === true)
        .map(t => t.id);

    await canvas.scene.deleteEmbeddedDocuments("Tile", delete_ids);
    ui.notifications.info(`All tiles from ${tableName} have been shuffled into the deck.`)
//v.1.0.1 by SalieriC#8263, flag use inspired by a macro from brunocalado#1650, assisted by Kekilla#7036
}