main();

async function main() {
    new Dialog({
        name: "Patch All Actors",
        content: `
    <h1> Actor Patcher </h1>
    <p> This script will overwrite <b>ALL</b> actors with skills, edges, hindrances, powers, special abilities and gear from the SWADE-Core-Rules compendium. If an item with a matching name is found, it'll be replaced with the full text description, along with actions, and additional information</p>
    <h1> PLEASE MAKE A BACKUP BEFORE RUNNING THIS MACRO </h1>
    <h2> Continue? </h2> 
    `,
        buttons: {
            continue: {
                label: "Patch!",
                callback: async () => {
                    await patchAllActors();
                    ui.notifications.info("Finished patching all actors!");
                }
            },
            cancel: {
                label: "Cancel"
            }
        }
    }).render(true);
}

async function patchAllActors() {
    let updateItems = async (actor) => {
        for (let item of actor.items) {
            let patchedItem;
            if (['weapon', 'armor', 'shield', 'gear'].includes(item.data.type)) {
                //gear pack
                let searchID = (await game.packs.get("swpf-core-rules.swpf-gear").getIndex()).find(el => el.name == item.name)?._id;
                if (searchID) {
                    patchedItem = duplicate(await game.packs.get("swpf-core-rules.swpf-gear").getDocument(searchID))
                    item.update(patchedItem)
                }
            } else if (item.data.type == "hindrance") {
                let searchID = (await game.packs.get("swpf-core-rules.swpf-hindrances").getIndex()).find(el => el.name.includes(item.name))?._id;
                if (searchID) {
                    // Fuzzy matching to better patch against the savaged.us imports
                    patchedItem = duplicate(await game.packs.get("swpf-core-rules.swpf-hindrances").getDocument(searchID))
                    const originalName = item.data.name;
                    const originalSeverity = item.data.data.major;
                    let oldDesc = item.data.data.description;
                    if (oldDesc && oldDesc.includes('<div class="swpf-core">')) {
                        let pendingDesc = oldDesc.replaceAll('<div class="swpf-core">', '');
                        oldDesc = pendingDesc.replaceAll('</div>', '');
                    }
                    let newDesc = patchedItem.data.description;
                    if (oldDesc && newDesc && newDesc.includes('<div class="swpf-core">')) {
                        let pendingDesc = newDesc.replaceAll('<div class="swpf-core">', '');
                        newDesc = pendingDesc.replaceAll('</div>', '');
                    }
                    let patchDesc = `<div class="swpf-core">${oldDesc}<hr />${newDesc}</div>`;
                    if (!oldDesc) { patchDesc = newDesc };
                    await item.update(patchedItem);
                    await item.update({
                        "name": originalName,
                        "data.description": patchDesc,
                        "img": patchedItem.img,
                        "data.major": originalSeverity
                    })
                }
            } else if (item.data.type == "ability") {
                let searchID = (await game.packs.get("swpf-core-rules.swpf-abilities").getIndex()).find(el => item.name.includes(el.name))?._id;
                if (searchID) {
                    // Fuzzy matching to better patch against the naming conventions
                    patchedItem = duplicate(await game.packs.get("swpf-core-rules.swpf-abilities").getDocument(searchID))
                    const originalName = item.data.name;
                    let oldDesc = item.data.data.description;
                    if (oldDesc && oldDesc.includes('<div class="swpf-core">')) {
                        let pendingDesc = oldDesc.replaceAll('<div class="swpf-core">', '');
                        oldDesc = pendingDesc.replaceAll('</div>', '');
                    }
                    let newDesc = patchedItem.data.description;
                    if (oldDesc && newDesc && newDesc.includes('<div class="swpf-core">')) {
                        let pendingDesc = newDesc.replaceAll('<div class="swpf-core">', '');
                        newDesc = pendingDesc.replaceAll('</div>', '');
                    }
                    let patchDesc = `<div class="swpf-core">${oldDesc}<hr />${newDesc}</div>`;
                    if (!oldDesc) { patchDesc = newDesc };
                    
                    const createdItem = await actor.createOwnedItem(patchedItem);
                    const newItem = actor.data.items.get(createdItem[0]._id);
                    console.log(item);
                    console.log(newItem);
                    await KABAnewItem.update({
                        "name": originalName,
                        "data.description": patchDesc,
                        //"img": patchedItem.img,
                        "_id": item._id
                    });
                    await item.delete();
                }
            } else if (item.data.type == "edge") {
                let searchID = (await game.packs.get("swpf-core-rules.swpf-edges").getIndex()).find(el => el.name == item.name)?._id;
                if (searchID) {
                    patchedItem = duplicate(await game.packs.get("swpf-core-rules.swpf-edges").getDocument(searchID))
                    item.update(patchedItem)
                }
            } else if (item.data.type == "skill") {
                let searchString = item.name
                if (["★ Athletics", "★ Notice", "★ Persuasion", "★ Stealth", "★ Common Knowledge"].includes(item.name)) {
                    searchString = item.name.split("★ ")[1]
                }
                let searchID = (await game.packs.get("swpf-core-rules.swpf-skills").getIndex()).find(el => el.name == searchString)?._id;
                if (searchID) {
                    patchedItem = duplicate(await game.packs.get("swpf-core-rules.swpf-skills").getDocument(searchID))
                    item.update({
                        "name": patchedItem.name,
                        "img": patchedItem.img,
                        "data.description": patchedItem.data.description //Don't want to override the Die
                    })
                }
            } else if (item.data.type == "power") {
                let searchID = (await game.packs.get("swpf-core-rules.swpf-powers").getIndex()).find(el => el.name == item.name)?._id;
                if (searchID) {
                    patchedItem = duplicate(await game.packs.get("swpf-core-rules.swpf-powers").getDocument(searchID))
                    item.update({
                        "data.description": patchedItem.data.description,
                        "img": patchedItem.img
                    })
                }
            }
        }
    }

    await game.actors.updateAll(async (actor) => ({
        items: await updateItems(actor)
    }))
}