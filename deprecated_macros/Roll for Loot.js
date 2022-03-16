const tableID = `Enter_Loot_Table_Name_or_ID_here`;

new Dialog({
    title: 'Roll for loot',
    content: `
        <form>
        <div class="form-group">
            <label for="amount"><b>Amount of Loot: </b></label>
            <input id="amount" name="amount" type="number" value="1" onClick="this.select();"></input>
        </div>
        </form>`,
    buttons: {
        one: {
            label: `Roll for loot`,
            callback: (html) => {
                console.log(`start getting stuff`);
                let amount = Number(html.find("#amount")[0].value);
                game.tables.get(`${tableID}`).drawMany(amount);
            }
        },
    },
    render: ([dialogContent]) => {
        dialogContent.querySelector(`input[name="amount"`).focus();
        dialogContent.querySelector(`input[name="amount"`).select();
    },
    default: "one"
    // v.1.0.1 by SalieriC#8263.
}).render(true)