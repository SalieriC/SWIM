/**
*  This macro will mark the selected token as dead.
*  If the selected token is dead, it will be marked
   as alive instead.
*  It requires CUB to be set up and Health Estimate.
*  Originally from Health Estimate, altered by SalieriC.
*/

//Set up
let incapSFX = game.settings.get(
  'swim', 'incapSFX');
  if (token.actor.data.data.additionalStats.sfx) {
    let sfxSequence = token.actor.data.data.additionalStats.sfx.value.split("|");
    incapSFX = sfxSequence[1];
  }

main();

function main() {
  if (canvas.tokens.controlled.length === 0) {
    ui.notifications.error("Please select a token first");
    return;
  }

  for (let e of canvas.tokens.controlled) {
    let hasAlive = !e.document.getFlag("healthEstimate", "dead")
    e.document.setFlag("healthEstimate", "dead", hasAlive)
    async function toggleCondition(condition, token, { warn = true } = {}) {
      if (!condition || !token) return;
  
      game.cub.hasCondition(condition, token, { warn })
        ? await game.cub.removeCondition(condition, token, { warn })
        : await game.cub.addCondition(condition, token, { warn });
  
      return game.cub.hasCondition(condition, token, { warn });
    }
  
    toggleCondition(`Incapacitated`, e);
  }
    ui.notifications.info("Marked as dead/alive.");
    AudioHelper.play({ src: `${incapSFX}` }, true);

  // v.3.0.0
}