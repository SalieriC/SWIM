let tableName;

async function main() {
    const contentFromClipboard = await navigator.clipboard.readText();
    let allNames = contentFromClipboard.split("\n");
    let allNamesDeduplicated = Array.from(new Set(allNames))
    let number = allNamesDeduplicated.length
    let data = { name: `${tableName}`, formula: `1d${number}` };
    var table = await RollTable.create(data);
    let tableData = []

    for (let i = 0; i < allNamesDeduplicated.length; ++i) {
        let result = {};
        result.type = 0;
        result.text = allNamesDeduplicated[i];
        result.weight = 1;
        result.range = [i + 1, i + 1];
        tableData.push(result)
    }
    await table.createEmbeddedDocuments("TableResult", tableData);
    
    await ui.notifications.notify(`RollTable with ${number} entries created as "${tableName}".`);
}

new Dialog({
    title: "RollTable importer",
    content: `<form>
    <p>This macro will import your current clipboard as a RollTable. Each result of your table must be a single line in your clipboard without leading numbers (1.; 2); 3:; etc).</p>
    <p>The amount of lines will determine the dice formula with a weight of 1.</p>
    <p><b>Example:</b> If you have 100 lines in your table the formula will be 1d100.</p>
    <div class="form-group">
    <label for="name_of_table"><i class="fas fa-file-signature"></i> <b>Table Name: </b></label>
        <input id="name_of_table" name="name_of_table" type="string" value="Table Name" onClick="this.select();"></input>
        </div>
        </form>`,
    buttons: {
        one: {
            icon: "<i class='fas fa-file-import'></i>",
            label: "Import",
            callback: (html) => {
                tableName = String(html.find("#name_of_table")[0].value);
                main();
            }
        }
    },
    default: "one",
    render: ([dialogContent]) => {
        dialogContent.querySelector(`input[name="name_of_table"`).focus();
        dialogContent.querySelector(`input[name="name_of_table"`).select();
    },
    // v.2.0.1 Original by Tommycore#2125, v.2 by SalieriC#8263, with a little help from FloRad#2142.
}).render(true)
