const updateItems = async function (folderName) {

    let abilityFolder = await game.folders.find(folder => folder.name === folderName && folder.type === 'Item')

    for (const item of abilityFolder.content) {
        await item.update({ type: 'ability', subtype: 'special' })
    }

    for (const actor of game.actors) {
        for (const item of actor.items) {
            if (item.type === 'edge' || item.type === 'hindrance') {
                let specialAbility = await abilityFolder.content.find(ability => ability.name === item.name)
            
                if (typeof specialAbility !== 'undefined') {
                    await item.update(specialAbility.data)
                }
            }
        }
    }
    await ui.notifications.info("Converting finished.");
}

new Dialog ({
    title: 'Ability Converter',
    content: `<form><p>This will convert <b>all</b> Edges and Hindrances in a single folder to the new Ability type of SWADE 0.7.x and thus requires that version of the system.</p>
    <p>Below you'll need to enter the name of the folder you wish to process. It <b>must not</b> contain any <i>real</i> Edges or Hindrances, only those you wish to become Special Abilities. It also must not contain sub-folders. <b>Make a Backup before you continue!</b></p>
    <p>After converting, the macro will convert <b>all Edges and Hindrances on all actors</b> with any of the names, the macro found in the given folder.</p>
    <div class="form-group">
        <label for="folderName">Folder name:</label>
        <input id="folderName" name="folderName" type="string" value="SWADE Monstrous Abilities"></input>
    </div>
    </form>`,
    buttons: {
        one: {
            label: "Process.",
            callback: (html) => {
                let folderName = String(html.find("#folderName")[0].value);
                updateItems(`${folderName}`)
            }
        },
        two: {
            label: "On second thought...",
            callback: (html) => {}
        }
    }
    // v.2.0.1 by 'Kristian Serrano#5077', dialogue by SalieriC#8263
}).render(true);