/*******************************************
 * Token Vision macro for SWADE
 * This macro was originally written by @Sky#9453
 * https://github.com/Sky-Captain-13/foundry
 * Converted and maintained for SWADE by SalieriC
 * version 3.0.0
 * Original code (an eternity ago) by Shteff, altered by Forien, edited and maintained by SalieriC#8263.
 ******************************************/

export async function token_vision_script() {
    main()
    function main() {
        if (canvas.tokens.controlled[0] === undefined) {
            ui.notifications.error("Please select at least one token first")
            return
        }

        // Add Vision Type only if the Game Master is using the Macro
        let dialogue_content = `
    <form>
      <div class="form-group">
        <label>Light Source:</label>
        <select id="light-source" name="light-source">
          <option value="nochange">No Change</option>
          <option value="none">None</option>
          <option value="candle">Candle</option>
          <option value="lamp">Lantern</option>
          <option value="bullseye">Lantern (Bullseye)</option>
          <option value="torch">Torch</option>
          <option value="flLight">Flashlight</option>
        </select>
      </div>
      <div class="form-group">
        <label>Vision Type:</label>
        <select id="vision-type" name="vision-type">
          <option value="nochange">No Change</option>
          <option value="pDark">Pitch Darkness (0")</option>
          <option value="dark">Dark (10")</option>
          <option value="dim">Dim</option>
          <option value="lowLiVis">Low Light Vision</option>
          <option value="darkVis">Dark Vision (SWPF)</option>
          <option value="infrVis">Infravision</option>
          <option value="fullNiVis">Full Night Vision</option>
        </select>
      </div>
    </form>
`;

        let dialogButtons = {
            yes: {
                icon: "<i class='fas fa-check'></i>",
                label: `Apply`,
                callback: (html) => {
                    changeVision(html);
                }
            },
            no: {
                icon: "<i class='fas fa-times'></i>",
                label: `Cancel`
            }
        }

        // Main Dialogue    
        new Dialog({
            title: `Token Vision`,
            content: dialogue_content,
            buttons: dialogButtons,
            default: "yes",
        }).render(true);
    }

    async function changeVision(html) {
        for (let tokenD of canvas.tokens.controlled) {
            let visionType;
            let lightSource = html.find('[name="light-source"]')[0].value || "none";
            let dimSight = 0;
            let brightSight = 0;
            let dimLight = 0;
            let brightLight = 0;
            let lightAngle = 360;
            let lockRotation = tokenD.data.lockRotation;

            // Get Vision Type Values
            visionType = html.find('[name="vision-type"]')[0].value || "none";
            switch (visionType) {
                case "pDark":
                    dimSight = 0;
                    brightSight = 0;
                    break;
                case "dark":
                    dimSight = 10;
                    brightSight = 0;
                    break;
                case "dim":
                    dimSight = 1000;
                    brightSight = 10;
                    break;
                case "lowLiVis":
                    dimSight = 1000;
                    brightSight = 0;
                    break;
                case "darkVis":
                    dimSight = 0;
                    brightSight = 10;
                    break;
                case "infrVis":
                    dimSight = 1000;
                    brightSight = 0;
                    break;
                case "fullNiVis":
                    dimSight = 0;
                    brightSight = 1000;
                    break;
                case "nochange":
                    break;
                default:
                    dimSight = tokenD.data.dimSight;
                    brightSight = tokenD.data.brightSight;
            }
            // Get Light Source Values
            switch (lightSource) {
                case "none":
                    dimLight = 0;
                    brightLight = 0;
                    break;
                case "candle":
                    dimLight = 0;
                    brightLight = 2;
                    break;
                case "lamp":
                    dimLight = 0;
                    brightLight = 4;
                    break;
                case "bullseye":
                    dimLight = 0;
                    brightLight = 4;
                    lockRotation = true;
                    lightAngle = 52.5;
                    break;
                case "torch":
                    dimLight = 0;
                    brightLight = 4;
                    break;
                case "flLight":
                    dimLight = 0;
                    brightLight = 10;
                    lockRotation = true;
                    lightAngle = 52.5;
                    break;
                case "nochange":
                    break;
                default:
                    dimLight = tokenD.data.light.dim;
                    brightLight = tokenD.data.light.bright;
                    lightAngle = tokenD.data.light.angle;
                    lockRotation = tokenD.data.lockRotation;
                    break;
            }
            // Update Token
            const updatePromise = await tokenD.document.update({
                vision: true,
                dimSight: dimSight,
                brightSight: brightSight,
                light: {
                    dim: dimLight,
                    bright: brightLight,
                    angle: lightAngle
                },
                lockRotation: lockRotation
            });
        }
    }
}