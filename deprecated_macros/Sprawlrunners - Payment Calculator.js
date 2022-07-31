let pcActorFolderID;
let cryptos;
let karma;
let icons = [`<i class="fab fa-cc-amazon-pay fa-3x"></i>`, `<i class="fas fa-money-check-alt fa-3x"></i>`, `<i class="fab fa-cc-stripe fa-3x"></i>`, `<i class="fab fa-cc-paypal fa-3x"></i>`, `<i class="fab fa-google-wallet fa-3x"></i>`, `<i class="fab fa-google-pay fa-3x"></i>`, `<i class="fab fa-cc-visa fa-3x"></i>`, `<i class="fab fa-cc-mastercard fa-3x"></i>`, `<i class="fab fa-cc-jcb fa-3x"></i>`, `<i class="fab fa-cc-discover fa-3x"></i>`, `<i class="fab fa-cc-diners-club fa-3x"></i>`, `<i class="fab fa-cc-apple-pay fa-3x"></i>`];

function numberWithCommas(cryptosSplit) {
    return cryptosSplit.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}
function numberWithCommas(cryptos) {
    return cryptos.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

async function calc() {
    //randomise payment icon
    let randomIcon = icons[Math.floor(Math.random()*icons.length)];

    //Start the chat data
    let chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker(),
        content: `<p>${randomIcon} <b>Your payment has arrived!</b></p><ul>`
    };


    // Get all PCs first
    let chars = game.actors.entities
        .filter(e => e.data.type === 'character' && e.hasPlayerOwner && e.data.folder === pcActorFolderID);
    let numberPCs = chars.length;
    
    //calculate cryptos per pc
    let cryptosSplit = (cryptos / numberPCs);
    let karmaTotal = (karma * numberPCs);
    let cryptosSeperated = numberWithCommas(cryptosSplit);
    let totalCryptosSplit = numberWithCommas(cryptos);

    for (const char of chars) {
        let currCryptos = char.system["additionalStats"]["cryptos"].value;
        let currKarma = char.system["additionalStats"]["karma"].value;

        chatData.content += "<li>"
            + char.name
            + " received: <b>¢"
            + cryptosSeperated
            + "</b> and <b>☯"
            + karma
            + " </b></li>";

        char.update({ "data.additionalStats.cryptos.value": currCryptos + cryptosSplit });
        char.update({ "data.additionalStats.karma.value": currKarma + karma });

    }

    // Finish building the output, & write it to chat
    chatData.content +=
        "</ul><p>Total Cryptos earned: <b>¢" + totalCryptosSplit + "</b></p>"
        + "<p>Total Karma earned: <b>☯" + karmaTotal + "</b></p>";

    ChatMessage.create(chatData, {});
}
new Dialog({
    title: 'Mission Rewards',
    content: `<p>Here you can reward player characters with their mission rewards.</p>
        <p>Please provide the folder names where the current Group of PCs are located.</p>
        <p>Make sure the folder name is <b>unique</b> to work properly.</p>
        <p>The Cryptos will be split evenly amongst all players.</p>
        <form>
        <div class="form-group">
            <label for="name_of_pc_folder"><i class="fas fa-user-alt"></i> <b>PC Folder Name: </b></label>
            <input id="name_of_pc_folder" name="name_of_pc_folder" type="string" value="Runners" onClick="this.select();"></input>
        </div>
        <div class="form-group">
            <label for="cryptos"><i class="fas fa-yen-sign"></i> <b>Cryptos: </b></label>
            <input id="cryptos" name="cryptos" type="number" value="10000" onClick="this.select();"></input>
        </div>
        <div class="form-group">
            <label for="karma"><i class="fas fa-yin-yang"></i> <b>Karma: </b></label>
            <input id="karma" name="karma" type="number" value="5" onClick="this.select();"></input>
        </div>
        </form>`,
    buttons: {
        one: {
            label: `<i class="fas fa-file-invoice-dollar"></i>Submit`,
            callback: (html) => {
                let pcActorFolder = String(html.find("#name_of_pc_folder")[0].value);
                cryptos = Number(html.find("#cryptos")[0].value);
                karma = Number(html.find("#karma")[0].value);
                pcActorFolderID = game.folders.getName(`${pcActorFolder}`).data.id;
                calc();
            }
        },
    },
    default: "one"
}).render(true)