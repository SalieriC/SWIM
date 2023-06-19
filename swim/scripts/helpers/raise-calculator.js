export async function raise_calculator() {
    new Dialog({
        title: game.i18n.localize("SWIM.raiseCalculator-label"),
        content: `
            <form>
                <div class="form-group">
					<div style="display: flex; align-items: center;">
						<img style="margin-right: 10px; border: 0;" src="modules/swim/assets/icons/misc/bullseye.svg" alt="" width="25" height="25" />
						<label><b>${game.i18n.localize("SWIM.raiseCalculator-targetNumber")}:</b></label>
					</div>
                    <input name="target" placeholder="0" type="number" />
                </div>
                <div class="form-group">
					<div style="display: flex; align-items: center;">
						<img style="margin-right: 10px; border: 0;" src="modules/swim/assets/icons/misc/rolling-dices.svg" alt="" border="0" width="25" height="25" />
						<label><b>${game.i18n.localize("SWIM.raiseCalculator-roll")}:</b></label>
					</div>
                    <input name="result" placeholder="0" type="number" />
                </div>
                <div style="display: flex; align-items: center;">
					<img style="margin-right: 10px; border: 0;" name="calculation" src="modules/swim/assets/icons/misc/raise_black.svg" alt="" width="25" height="25" />
					<p name="calculation"><b>${game.i18n.localize("SWIM.raiseCalculator-result")}</b></p>
				</div>
            </form>`,
        buttons: {},
        render: ([dialogContent]) => {
            dialogContent.querySelector(`input[name="target"]`).focus();
            ["target", "result"].forEach((input) => {
                ["input", "change"].forEach((evt) => {
                    dialogContent.querySelector(`input[name="${input}"]`).addEventListener(evt, (event) => {
                        const textInput = event.target;
                        const form = textInput.closest("form");
                        const calcImage = form.querySelector(`img[name="calculation"]`);
                        const calcResult = form.querySelector(`p[name="calculation"]`);
                        const target = form.querySelector('input[name="target"]').value;
                        const result = form.querySelector('input[name="result"]').value;
                        if (target === "" || result === "") return;
                        const raises = Math.floor((parseInt(result) - parseInt(target)) / 4);
                        if (parseInt(target) > parseInt(result)) {
                            calcImage.src = "modules/swim/assets/icons/misc/raise_red.svg";
                            calcResult.innerHTML = `<b>${game.i18n.localize("SWIM.raiseCalculator-failure")}</b>`;
                        } else if (parseInt(target) <= parseInt(result) && raises < 1) {
                            calcImage.src = "modules/swim/assets/icons/misc/raise_yellow.svg";
                            calcResult.innerHTML = `<b>${game.i18n.localize("SWIM.raiseCalculator-success")}</b>`;
                        } else {
                            calcImage.src = "modules/swim/assets/icons/misc/raise_green.svg";
                            if (raises < 2) {
                                calcResult.innerHTML = `<b>${game.i18n.format("SWIM.raiseCalculator-raises-singular", {
                                    raises,
                                })}</b>`;
                            } else {
                                calcResult.innerHTML = `<b>${game.i18n.format("SWIM.raiseCalculator-raises-plural", {
                                    raises,
                                })}</b>`;
                            }
                        }
                    });
                });
            });
        },
    }).render(true);
}
