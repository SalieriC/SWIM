/*******************************************
 * Token Vision macro for SWADE
 * This macro was originally written by @Sky#9453
 * https://github.com/Sky-Captain-13/foundry
 * 
 * version 4.1.0
 * Original code (an eternity ago) by Shteff,
 * altered by Forien, edited and maintained 
 * by SalieriC#8263.
 ******************************************/

export async function token_vision_script(condition = false) {
    main()
    async function main() {
        if (canvas.tokens.controlled[0] === undefined) {
            ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"))
            return
        }
        const { speaker, character, actor, token } = await swim.get_macro_variables()
        let currentColour = token.document.light.color

        // Add Vision Type only if the Game Master is using the Macro
        let dialogue_content = `
        <form>
        <dt>
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
          <dd>
          <div class="form-group">
            <label>Light Colour Presets:</label>
            <select id="colour-presets" name="colour-presets">
              <option value="picker">Current/Custom (use picker)</option>
              <option value="candle">Candle Colour</option>
              <option value="fire">Fire Torch Colour</option>
              <option value="magnesium">Magnesium Torch Colour</option>
              <option value="white">White/Flashlight Colour</option>
            </select>
          </div>
          </dd><dd>
          <div class="form-group">
            <label>Custom Colour:</label>
            <input type="color" id="colour-choice" value="${currentColour}" style="width:50%;" align="right">
          </div>
          </dd></dt><dt>
          <div class="form-group">
            <label>Vision Type:</label>
            <select id="vision-type" name="vision-type">
              <option value="nochange">No Change</option>
              <option value="pDark">Pitch Darkness (0")</option>
              <option value="dark">Dark (10")</option>
              <option value="dim">Dim</option>
              <option value="lowLiVis">Low Light Vision</option>
              <option value="DarkVis">Dark Vision (SWPF)</option>
              <option value="infrVis">Infravision</option>
              <option value="fullNiVis">Full Night Vision</option>
            </select>
          </div>
          </dt>
        </form>
        `

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
            let sfx
            let visionType;
            let lightSource = html.find('[name="light-source"]')[0].value || "none";
            let dimSight = 0;
            let brightSight = 0;
            let dimLight = 0;
            let brightLight = 0;
            let lightAngle = 360;
            let lockRotation = tokenD.document.lockRotation;
            let alpha = tokenD.document.light.alpha;
            let animIntensity = tokenD.document.light.animation.intensity;
            let animSpeed = tokenD.document.light.animation.speed;
            let animType = tokenD.document.light.animation.type;
            // Get Vision Type Values
            visionType = html.find('[name="vision-type"]')[0].value || "none";
            let presetChoice = html.find('[id="colour-presets"]')[0].value;
            let colourChoice
            if (presetChoice === "picker") { colourChoice = html.find('[id="colour-choice"]')[0].value; }
            else if (presetChoice === "candle") { colourChoice = "#fffcbb" }
            else if (presetChoice === "fire") { colourChoice = "#f8c377" }
            else if (presetChoice === "magnesium") { colourChoice = "#e52424" }
            else if (presetChoice === "white") { colourChoice = "#FFFFFF" }
            let lightColour = colourChoice;
            let activeLight = false
            if (tokenD.document.light.bright >= 1 || tokenD.document.light.dim >= 1) { activeLight = true }

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
                    //break;
                default:
                    dimSight = tokenD.dimRadius;
                    brightSight = tokenD.brightRadius;
            }
            // Get Light Source Values
            switch (lightSource) {
                case "none":
                    dimLight = 0;
                    brightLight = 0;
                    animIntensity = 0
                    animSpeed = 0
                    sfx = game.settings.get("swim", "lightSFX")
                    activeLight = false
                    break;
                case "candle":
                    dimLight = 0;
                    brightLight = 2;
                    lightAngle = 360
                    alpha = 0.5
                    lightColour = colourChoice
                    animIntensity = 3
                    animSpeed = 3
                    animType = "torch"
                    sfx = game.settings.get("swim", "lightSFX")
                    activeLight = true
                    break;
                case "lamp":
                    dimLight = 0;
                    brightLight = 4;
                    lightAngle = 360
                    alpha = 0.5
                    lightColour = colourChoice
                    animIntensity = 3
                    animSpeed = 3
                    animType = "torch"
                    sfx = game.settings.get("swim", "lightSFX")
                    activeLight = true
                    break;
                case "bullseye":
                    dimLight = 0;
                    brightLight = 4;
                    lockRotation = true;
                    lightAngle = 52.5;
                    alpha = 0.5
                    lightColour = colourChoice
                    animIntensity = 3
                    animSpeed = 3
                    animType = "torch"
                    sfx = game.settings.get("swim", "lightSFX")
                    activeLight = true
                    break;
                case "torch":
                    dimLight = 0;
                    brightLight = 4;
                    lightAngle = 360
                    alpha = 0.5
                    lightColour = colourChoice
                    animIntensity = 3
                    animSpeed = 3
                    animType = "torch"
                    sfx = game.settings.get("swim", "lightSFX")
                    activeLight = true
                    break;
                case "flLight":
                    dimLight = 0;
                    brightLight = 10;
                    lockRotation = true;
                    lightAngle = 52.5;
                    alpha = 0.5
                    lightColour = colourChoice
                    animIntensity = 0
                    animSpeed = 0
                    sfx = game.settings.get("swim", "lightSFX")
                    activeLight = true
                    break;
                case "nochange":
                    //break;
                default:
                    dimLight = tokenD.document.light.dim;
                    brightLight = tokenD.document.light.bright;
                    lightAngle = tokenD.document.light.angle;
                    lockRotation = tokenD.document.lockRotation;
                    alpha = tokenD.document.light.alpha;
                    lightColour = lightColour;
                    animIntensity = tokenD.document.light.animation.intensity;
                    animSpeed = tokenD.document.light.animation.speed;
                    animType = tokenD.document.light.animation.type;
                    break;
            }
            // Update Token
            const updatePromise = await tokenD.document.update({
                vision: true,
                dimSight: dimSight,
                brightSight: brightSight,
                light: {
                    alpha: alpha,
                    angle: lightAngle,
                    bright: brightLight,
                    dim: dimLight,
                    color: lightColour,
                    animation: {
                        intensity: animIntensity,
                        speed: animSpeed,
                        type: animType
                    }
                },
                lockRotation: lockRotation
            });
            if (sfx) {
                const volume = game.settings.get("swim", "defaultVolume")
                await swim.play_sfx(sfx, volume)
            }
            if (!condition) {
                if (activeLight === false) {
                    let ae = await succ.get_condition_from(tokenD, 'torch')
                    if (ae) { await ae.setFlag('swim', 'deactivatedFromMacro', true) }//set flags to prevent duplicate message in init.js
                }
                await succ.apply_status(tokenD, 'torch', activeLight, false, {swim: {activatedFromMacro: true}})//pass additional data to prevent duplicate message in init.js
            }
        }
    }
}