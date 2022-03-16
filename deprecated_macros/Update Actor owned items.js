//Created by 🌈Kandashi (He/Him)🌈#6698; minor addition by SalieriC#8263

//dialog to ask for compendium

//dialog to ask for item from compendium

//confirmation dialog - make sure make sure

//search items directory for same item & update
//search actors directory for same item on actors & update
//search each canvas for tokens whose actors have same items on actors & update

compendium_dialog();


function compendium_dialog() {
    let confirmed = false;
    let packs = game.packs.filter(p => (game.user.isGM || !p.private) && p.entity === "Item");
    let dialog_content = `
        <p>Choose Compendium</p>
        <div class = "form-group">
            <label>Select the Compendium the entity you want to update resides.</label>
            <select id="comp" name="comp">`;
    for (let pack of packs) {
        dialog_content += `<option value="${pack.collection}">${pack.metadata.label}</option>`;
    }
    dialog_content += `</select></div>`;

    new Dialog({
        title: ``,
        content: dialog_content,
        buttons:
        {
            one:
            {
                icon: `<i class="fas fa-check"></i>`,
                lable: "Continue",
                callback: () => confirmed = true
            },
            two:
            {
                icon: `<i class="fas fa-times"></i>`,
                lable: "Cancel",
                callback: () => confirmed = false
            }
        },
        default: "Cancel",
        close: html => {
            if (confirmed) {
                let selection_id = html.find(`[name=comp]`)[0].value;
                item_dialog(selection_id);
            }
        }
    }).render(true);
}

async function item_dialog(selection_id = "") {
    let pack = game.packs.get(selection_id);
    let packContent = await pack.getContent();

    for (let item of packContent){

    update_ItemDirectory(item);
    update_ItemActors(item);
    update_ItemScenes(item);
    }
    await ui.notifications.notify(`All Actors have been updated. Please refresh now.`);
}

async function update_ItemDirectory(item) {
    let items = game.items.filter(i => i.name === item.name);
    for (let i of items) {
        await i.update(item.data);
    }
}

async function update_ItemActors(item) {
    for (let a of game.actors) {
        for (let i of a.items) {
            if (item.name === i.name) {
                await i.update(item.data);
            }
        }
    }
}

async function update_ItemScenes(item) {
    for (let s of game.scenes) {
        for (let t of s.data.tokens) {
            if (!t.actorLink) {
                for (let i of t.actorData.items) {
                    if (i.name === item.name) {
                        await i.update(item.data);
                    }
                }
            }
        }
    }
}