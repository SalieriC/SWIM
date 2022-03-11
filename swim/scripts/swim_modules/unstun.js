import { swim } from 'modules/swim/scripts/swim-class.js';

/*******************************************
 * Unstun macro for SWADE
 * version v.3.6.1
 * Made and maintained by SalieriC#8263 using original Code from Shteff.
 ******************************************/

 export function unstun_script() {
   // No Token is Selected
   if (!token || canvas.tokens.controlled.length > 1) {
     ui.notifications.error("Please select a single token first.");
     return;
   }
 
   // Setting up SFX path.
   let stunSFX = game.settings.get(
     'swim', 'stunSFX');
 
   let unshakeSFX;
   if (token.actor.data.data.additionalStats.sfx) {
     let sfxSequence = token.actor.data.data.additionalStats.sfx.value.split("|");
     unshakeSFX = sfxSequence[2];
   }
 
   // Checking for system Benny image.
   let bennyImage = "icons/commodities/currency/coin-embossed-octopus-gold.webp";
     let benny_Back = game.settings.get('swade', 'bennyImage3DBack')
     if (benny_Back) {
       bennyImage = benny_Back;
     }
 
   //Checking for Elan
   const elan = token.actor.data.items.find(function (item) {
     return item.name.toLowerCase() === "elan" && item.type === "edge";
   });
   let bennies;
   let bv;
   let elanBonus;
 
   async function rollUnstun() {
 
     const edgeNames = ['combat reflexes'];
     const actorAlias = speaker.alias;
     // ROLL VIGOR AND CHECK COMBAT REFLEXES
     const r = await token.actor.rollAttribute('vigor');
     const edges = token.actor.data.items.filter(function (item) {
       return edgeNames.includes(item.name.toLowerCase()) && (item.type === "edge" || item.type === "ability");
     });
     let rollWithEdge = r.total;
     let edgeText = "";
     for (let edge of edges) {
       rollWithEdge += 2;
       edgeText += `<br/><i>+ ${edge.name}</i>`;
     }
 
     // Apply +2 if Elan is present and if it is a reroll.
     if (typeof elanBonus === "number") {
       rollWithEdge += 2;
       edgeText = edgeText + `<br/><i>+ Elan</i>.`;
     }
 
     let chatData = `${actorAlias} rolled <span style="font-size:150%"> ${rollWithEdge} </span>`;
     // Checking for a Critical Failure.
     let wildCard = true;
     if (token.actor.data.data.wildcard === false && token.actor.type === "npc") { wildCard = false }
     let critFail = await swim.critFail_check(wildCard, r)
     if (critFail === true) {
       ui.notifications.notify("You've rolled a Critical Failure!");
       let chatData = `${actorAlias} rolled a <span style="font-size:150%"> Critical Failure! </span>`;
       ChatMessage.create({ content: chatData });
     }
     else {
       if (rollWithEdge > 3 && rollWithEdge <= 7) {
         chatData += ` and is no longer Stunned but remains Vulnerable until end of next turn.`;
         await succ.apply_status(token, 'vulnerable', true)
         await succ.apply_status(token, 'stunned', false)
         if (unshakeSFX) { AudioHelper.play({ src: `${unshakeSFX}` }, true); }
         useBenny();
       } else if (rollWithEdge >= 8) {
         chatData += `, is no longer Stunned and looses Vulnerable after the turn.`;
         await succ.apply_status(token, 'distracted', false)
         await succ.apply_status(token, 'stunned', false)
         await succ.apply_status(token, 'prone', false)
         if (unshakeSFX) { AudioHelper.play({ src: `${unshakeSFX}` }, true); }
       } else {
         chatData += ` and remains Stunned.`;
         useBenny();
       }
       chatData += ` ${edgeText}`;
     }
     ChatMessage.create({ content: chatData });
   }
 
   function useBenny() {
     bv = checkBennies();
     if (bv > 0) {
       new Dialog({
         title: 'Spend a Benny?',
         content: `Do you want to spend a Benny to reroll? (You have ${bv} Bennies left.)`,
         buttons: {
           one: {
             label: "Yes.",
             callback: (html) => {
               spendBenny();
               if (!!elan) {
                 elanBonus = 2;
               }
               rollUnstun();
             }
           },
           two: {
             label: "No.",
             callback: (html) => { return; },
           }
         },
         default: "one"
       }).render(true)
     }
     else {
       return;
     }
   }
 
   // Check for Bennies
   function checkBennies() {
     bennies = token.actor.data.data.bennies.value;
 
     // Non GM token has <1 bennie OR GM user AND selected token has <1 benny
     if ((!game.user.isGM && bennies < 1) || (game.user.isGM && bennies < 1 && game.user.getFlag("swade", "bennies") < 1)) {
       ui.notifications.error("You have no more bennies left.");
     }
     if (game.user.isGM) {
       bv = bennies + game.user.getFlag("swade", "bennies");
     }
     else {
       bv = bennies;
     }
     return bv;
   }
 
   // Spend Benny function
   async function spendBenny() {
     bennies = token.actor.data.data.bennies.value;
     //Subtract the spend, use GM benny if user is GM and token has no more bennies left or spend token benny if user is player and/or token has bennies left.
     if (game.user.isGM && bennies < 1) {
       game.user.setFlag("swade", "bennies", game.user.getFlag("swade", "bennies") - 1)
     } else {
       token.actor.update({
         "data.bennies.value": bennies - 1,
       })
     }
 
     //Show the Benny Flip
     if (game.dice3d) {
       game.dice3d.showForRoll(new Roll("1dB").evaluate({ async:false }), game.user, true, null, false);
     }
 
     //Chat Message to let the everyone know a benny was spent
     ChatMessage.create({
       user: game.user.id,
       content: `<p><img style="border: none;" src="${bennyImage}"" width="25" height="25" /> ${game.user.name} spent a Benny for ${token.name}.</p>`,
     });
   }
 
   if (await succ.check_status(token, 'stunned') === true) {
     rollUnstun()
   } else if (token) {
     if (await succ.check_status(token, 'stunned') === false) {
       await succ.apply_status(token, 'stunned', true)
     };
 
     if (await succ.check_status(token, 'prone') === false) {
       await succ.apply_status(token, 'prone', true)
     };
     await succ.apply_status(token, 'distracted', true)
     await succ.apply_status(token, 'vulnerable', true)
     if (stunSFX) {
       AudioHelper.play({ src: `${stunSFX}` }, true);
     }
   }
 }