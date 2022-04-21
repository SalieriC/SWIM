/************************************** 
 * Token Vision
 * 
 * Open a dialog for quickly changing 
 * token vision parameters of the 
 * controlled tokens.
 * This was originally written by @Sky#9453
 * as a macro.
 * https://github.com/Sky-Captain-13/foundry
 * SWADE (this) version and light colour
 * additions by SalieriC

 * Version 3.0.0
**************************************/
main();

async function main() {
  // Checking if at least one token is defined.
  if (canvas.tokens.controlled.length === 0) {
    ui.notifications.error("Please select a token first");
    return;
  }
  let currentColour = token.data.light.color
  console.log(currentColour)
  // Add Vision Type only if the Game Master is using the Macro
  let dialogue_content;
    dialogue_content = `
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
`;

  let applyChanges = false;
  new Dialog({
    title: `Token Vision Configuration`,
    content: dialogue_content,
    buttons: {
      yes: {
        icon: "<i class='fas fa-check'></i>",
        label: `Apply Changes`,
        callback: () => applyChanges = true
      },
      no: {
        icon: "<i class='fas fa-times'></i>",
        label: `Cancel Changes`
      },
    },
    default: "yes",
    close: async (html) => {
      if (applyChanges) {
        for (let token of canvas.tokens.controlled) {
          let visionType;
          let lightSource = html.find('[name="light-source"]')[0].value || "none";
          let dimSight = 0;
          let brightSight = 0;
          let dimLight = 0;
          let brightLight = 0;
          let lightAngle = 360;
          let lockRotation = token.data.lockRotation;
          let alpha = token.data.light.alpha;  
          let animIntensity = token.data.light.animation.intensity; 
          let animSpeed = token.data.light.animation.speed; 
          let animType = token.data.light.animation.type;
          // Get Vision Type Values
          visionType = html.find('[name="vision-type"]')[0].value || "none";
          let presetChoice = html.find('[id="colour-presets"]')[0].value;
          let colourChoice
          if (presetChoice === "picker") {colourChoice = html.find('[id="colour-choice"]')[0].value;}
          else if (presetChoice === "candle") {colourChoice = "#fffcbb"}
          else if (presetChoice === "fire") {colourChoice = "#f8c377"}
          else if (presetChoice === "magnesium") {colourChoice = "#e52424"}
          else if (presetChoice === "white") {colourChoice = "#FFFFFF"}
          let lightColour = colourChoice;
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
            case "DarkVis":
              dimSight = 0;
              brightSight = 10;
              break;
            case "infrVis":
              dimSight = 0;
              brightSight = 10;
              break;
            case "fullNiVis":
              dimSight = 0;
              brightSight = 1000;
              break;
            case "nochange":
            default:
              dimSight = token.data.dimSight;
              brightSight = token.data.brightSight;
          }
          // Get Light Source Values
          switch (lightSource) {
            case "none":
              dimLight = 0;
              brightLight = 0;
              animIntensity = 0
              animSpeed = 0
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
              break;
            case "nochange":
            default:
              dimLight = token.data.dimLight;
              brightLight = token.data.brightLight;
              lightAngle = token.data.lightAngle;
              lockRotation = token.data.lockRotation;
              alpha = token.data.light.alpha; 
              lightColour = lightColour; 
              animIntensity = token.data.light.animation.intensity; 
              animSpeed = token.data.light.animation.speed; 
              animType = token.data.light.animation.type;
          }
          // Update Token
          //console.log(token);
          await token.document.update({
            vision: true,
            dimSight: dimSight,
            brightSight: brightSight,
            //dimLight: dimLight,
            //brightLight: brightLight,
            //lightAngle: lightAngle,
            lockRotation: lockRotation,
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
            }
          });
        }
      }
    }
  }).render(true);
}