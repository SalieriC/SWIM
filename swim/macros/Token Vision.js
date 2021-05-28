// Open a dialog for quickly changing token vision parameters of the controlled tokens.
// This macro was originally written by @Sky#9453
// https://github.com/Sky-Captain-13/foundry
// SWADE (this) version by SalieriC

// Since return only works in functions, the sole purpose of the main() function is to stop the macro from executing if no token is selected.
main();

function main() {
  // Checking if at least one token is defined.
  if (canvas.tokens.controlled.length === 0) {
    ui.notifications.error("Please select a token first");
    return;
  }
  // Add Vision Type only if the Game Master is using the Macro
  let dialogue_content;
  if (game.user.isGM) {
    dialogue_content = `
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
          <option value="infrVis">Infravision</option>
          <option value="fullNiVis">Full Night Vision</option>
        </select>
      </div>
    </form>
`;
  } else {
    dialogue_content = `
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
    `;
  }

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
    close: html => {
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
          // Get Vision Type Values
          if (game.user.isGM){
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
            case "infrVis":
              dimSight = 1000;
              brightSight = 0;
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
            default:
              dimLight = token.data.dimLight;
              brightLight = token.data.brightLight;
              lightAngle = token.data.lightAngle;
              lockRotation = token.data.lockRotation;
          }
          // Update Token
          console.log(token);
          token.update({
            vision: true,
            dimSight: dimSight,
            brightSight: brightSight,
            dimLight: dimLight,
            brightLight: brightLight,
            lightAngle: lightAngle,
            lockRotation: lockRotation
          });
        }
        else {
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
            default:
              dimLight = token.data.dimLight;
              brightLight = token.data.brightLight;
              lightAngle = token.data.lightAngle;
              lockRotation = token.data.lockRotation;
          }
          // Update Token
          console.log(token);
          token.update({
            vision: true,
            dimLight: dimLight,
            brightLight: brightLight,
            lightAngle: lightAngle,
            lockRotation: lockRotation
          });
        }
        }
      }
    }
  }).render(true);
  // v.2.0.4
}