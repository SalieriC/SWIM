let text = `<img style="border: 0;" src="modules/swim/assets/icons/misc/raise_black.svg" alt="" width="25" height="25" /> Your Raises will show here once you leave the Result field.`;

new Dialog({
    title: 'Raise Calculator',
    content: `
        <form>
        <div class="form-group">
        <label><img src="modules/swim/assets/icons/misc/bullseye.svg" alt="" width="25" height="25" style="border: 0;" /> <b>Target Number:</b></label> 
        <input name="target" placeholder="0" type="text" autofocus onClick="this.select();"/>
       </div>
       <div class="form-group">
        <label><img src="modules/swim/assets/icons/misc/rolling-dices.svg" alt="" border="0" width="25" height="25" style="border: 0;" /> <b>Result:</b></label> 
        <input name="result" placeholder="0" type="text" onClick="this.select();"/>
      </div>
        <p class="calculation">${text}</p>
      </form>`,
    buttons: {},
    render: ([dialogContent]) => {
        dialogContent.querySelector(`input[name="result"`).addEventListener("change", (event) => {
            const textInput = event.target;
            const form = textInput.closest("form")
            const calcResult = form.querySelector(".calculation");
            const target = form.querySelector('input[name="target"]').value;
            const result = form.querySelector('input[name="result"]').value;
            let raises = Math.floor((parseInt(result) - parseInt(target)) / 4);
            if (parseInt(target) > parseInt(result)) {
                calcResult.innerHTML = `<img style="border: 0;" src="modules/swim/assets/icons/misc/raise_red.svg" alt="" width="25" height="25" /> <b>Failure</b>`;
            }
            else if (parseInt(target) <= parseInt(result) && raises < 1) {
                calcResult.innerHTML = `<img style="border: 0;" src="modules/swim/assets/icons/misc/raise_yellow.svg" alt="" width="25" height="25" /> <b>Success</b>`;
            }
            else {
                calcResult.innerHTML = `<img style="border: 0;" src="modules/swim/assets/icons/misc/raise_green.svg" alt="" width="25" height="25" /> <b>${raises} Raise(s)</b>`;
            }
        });
    },
}).render(true);

// v.1.0.1 By SalieriC#8263, with help from Rawny#2166.