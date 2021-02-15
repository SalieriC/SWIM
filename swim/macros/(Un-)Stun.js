// Customise the prone status image:
let proneIconPath = `data/modules/swim/assets/icons/status_markers/2-Prone.png`;

async function rollUnstun() {
  if (!token || canvas.tokens.controlled.length > 1) {
    ui.notifications.error("Please select a single token token first.");
    return;
  }

  const edgeNames = ['combat reflexes'];
  const actorAlias = speaker.alias;
  // ROLL VIGOR AND CHECK COMBAT REFLEXES
  const r = await token.actor.rollAttribute('vigor');
  const edges = token.actor.data.items.filter(function (item) {
    return edgeNames.includes(item.name.toLowerCase()) && item.type === "edge";
  });
  let rollWithEdge = r.total;
  let edgeText = "";
  for (let edge of edges) {
    rollWithEdge += 2;
    edgeText = `<br/><i>+ ${edge.name}</i>`;
  }

  let chatData = `${actorAlias} rolled <span style="font-size:150%"> ${rollWithEdge} </span>`;
  // Checking for a Critical Failure.
  if (isSame_bool(r.dice) && isSame_numb(r.dice) === 1) {
    ui.notifications.notify("You've rolled a Critical Failure!");
    let chatData = `${actorAlias} rolled a <span style="font-size:150%"> Critical Failure! </span>`;
    ChatMessage.create({ content: chatData });
  }
  else {
    if (rollWithEdge > 3 && rollWithEdge <= 7) {
      chatData += ` and is no longer Stunned but remains Vulnerable until end of next turn.`;
      token.actor.update({ "data.status.isVulnerable": true });
      token.actor.update({ "data.status.isStunned": false });
    } else if (rollWithEdge >= 8) {
      chatData += `, is no longer Stunned and looses Vulnerable after the turn.`;
      token.actor.update({ "data.status.isDistracted": false });
      token.actor.update({ "data.status.isStunned": false });
      if (token.data.effects.includes(`${proneIconPath}`)) {
        token.toggleEffect(`${proneIconPath}`)
      };
    } else {
      chatData += ` and remains Stunned.`;
    }
    chatData += ` ${edgeText}`;
  }
  ChatMessage.create({ content: chatData });
}

// Functions to determine a critical failure. This one checks if all dice rolls are the same.
function isSame_bool(d = []) {
  return d.reduce((c, a, i) => {
    if (i === 0) return true;
    return c && a.total === d[i - 1].total;
  }, true);
}

// Functions to determine a critical failure. This one checks what the number of the "same" was.
function isSame_numb(d = []) {
  return d.reduce((c, a, i) => {
    if (i === 0 || d[i - 1].total === a.total) return a.total;
    return null;
  }, 0);
}

if (token.actor.data.data.status.isStunned === true) {
  rollUnstun()
} else if (token) {
  if (token.actor.data.data.status.isStunned === false) {
    token.actor.update({ "data.status.isStunned": true });
  };

  if (!token.data.effects.includes(`${proneIconPath}`)) {
    token.toggleEffect(`${proneIconPath}`)
  };
  token.actor.update({ "data.status.isDistracted": true });
  token.actor.update({ "data.status.isVulnerable": true });
  //AudioHelper.play({ src: "SFXURL" }, true);
}

// v.1.0.1 Made by SalieriC#8263 using original Code from Shteff.