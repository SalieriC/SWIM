const version = 'v1.1.0';
const chatimage = "https://raw.githubusercontent.com/brunocalado/mestre-digital/master/Foundry%20VTT/Macros/Savage%20Worlds/icons/clock.webp";

/* Deviation p99 SWADE
If a blast template misses, it deviates 1d6″
for thrown weapons (such as grenades) and
2d6″ for fired projectiles. Multiply by 2 if the
attack was made at Medium Range, 3 if Long,
and 4 for Extreme.

Next roll a d12 and read it like a clock
facing to determine the direction the missile
deviates. A weapon can never deviate more
than half the distance to the original target
(that keeps it from going behind the thrower).

source: https://raw.githubusercontent.com/brunocalado/mestre-digital/master/Foundry%20VTT/Macros/Savage%20Worlds/Deviation.js; altered by SalieriC.
icon: icons/weapons/artillery/cannon-engraved-gold.webp
*/

let coreRules = false;
if (game.modules.get("swade-core-rules")?.active) {coreRules = true;}

getRequirements();

function getRequirements() {
  let template = `
  <h2>Weapon Type</h2>
  <table style="width:100%">
  <tr>
    <td><input type="radio" id="thrown" name="weapontype" value="thrown"><label for="thrown">Thrown weapon</label></td>
    <td><input type="radio" id="projectile" name="weapontype" value="projectile" checked="checked><label for="projectile">Projectile</label></td>    
  </tr>
  </table>  
  <h2>Range</h2>
  <table style="width:100%">
  <tr>
    <td><input type="radio" id="short" name="range" value="short" checked="checked><label for="thrown">Short</label></td>
    <td><input type="radio" id="medium" name="range" value="medium"><label for="projectile">Medium</label></td>    
    <td><input type="radio" id="long" name="range" value="long"><label for="projectile">Long</label></td>    
    <td><input type="radio" id="extreme" name="range" value="extreme"><label for="projectile">Extreme</label></td>    
  </tr>
  </table>    
  `;
  new Dialog({
    title: "Deviation",
    content: template,
    buttons: {
      ok: {
        label: "Go!",
        callback: async (html) => {
          rollForIt(html);
        },
      }
    },
  }).render(true);
}

function rollForIt(html) {
  const weapontype=html.find('input[name="weapontype"]:checked').val();
  const range=html.find('input[name="range"]:checked').val();
  let deviation;
  
  if (weapontype=='thrown') {
    deviation = diceRoll('1d6', range);
  } else {
    deviation = diceRoll('2d6', range);
  }
}

function diceRoll(die, range) {
  const rangeMultiplier = rangeCheck(range);
  let direction = new Roll('1d12').roll();
  let roll = new Roll(die).roll();
  let message = `<h2>Deviation</h2>`;
  if (coreRules === true) {message = `<div class="swade-core"><h2>@Compendium[swade-core-rules.swade-rules.xxEcWExtn36PPxg0]{Deviation}</h2>`;}
  message += `<p>Move the blast <b>${roll.total*rangeMultiplier}"</b> to <b style="color:red">${direction.total}</b> O'Clock.</p>`;
  if (directionCheck(direction.total)) {
    message += `<p><b style="color:red">A weapon can never deviate more than half the distance to the original target (that keeps it from going behind the thrower).</b></p>`;
  }
  message += `<p style="text-align:center"><img style="vertical-align:middle; border: none;" src=${chatimage} width="200" height="200"><p>`;
  if (coreRules === true) {message += `</div>`}

  let tempChatData = {
    type: CHAT_MESSAGE_TYPES.ROLL,
    roll: roll,
    rollMode: game.settings.get("core", "rollMode"),
    content: message
  };     
  ChatMessage.create(tempChatData);  
  return roll.total;
}

function rangeCheck(range) {
  if (range=='short') {
    return 1;
  } else if (range=='medium') {
    return 2;
  } else if (range=='long') {
    return 3;
  } else if (range=='extreme') {
    return 4;
  }
}

function directionCheck(direction) {
  console.log(direction);
  if (direction==4 || direction==5 || direction==6 || direction==7 || direction==8) {
    return true
  } else {
    return false
  } 
  // v. 1.0.0 - Original code by brunocalado, modified by SalieriC#8263.
  // Image source: https://freesvg.org/analogue-clock-vector-graphics
}