const template = `
      <form>
       <div class="form-group">
        <label><img src="modules/swim/assets/icons/misc/bullseye.svg" alt="" width="25" height="25" style="border: 0;" /> <b>Target Number:</b></label> 
        <input name="target" placeholder="0" type="text" autofocus/>
       </div>
       <div class="form-group">
        <label><img src="modules/swim/assets/icons/misc/rolling-dices.svg" alt="" border="0" width="25" height="25" style="border: 0;" /> <b>Result:</b></label> 
        <input name="result" placeholder="0" type="text"/>
      </div>
    </form>`;
    new Dialog({
      title: 'Raise Calculator',
      content: template,
      buttons: {
        one: {
          label: 'Submit',
          callback: html => {
            let target = html.find('input[name="target"]').val();
            let result = html.find('input[name="result"]').val();
            const raises = Math.floor((parseInt(result) - parseInt(target)) / 4)
            if (parseInt(target) > parseInt(result)) {
                ui.notifications.notify(`Failure`);
            } 
            else if (parseInt(target) === parseInt(result)) {
                ui.notifications.notify(`Success`);
            }
            else {
                ui.notifications.notify(`${raises} Raise(s)`);
            }
        },
      },
    },
    default: "one",
}).render(true);

// v.1.0.0 By SalieriC#8263