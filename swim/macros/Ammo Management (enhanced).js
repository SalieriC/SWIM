// Preset for SFX of weapons (Without the //):
//RELOAD|FIRE|AUTOFIRE|SILENCED|SILENCEDAUTOFIRE|EMPTY

let dialogID = "";

async function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function weaponDialog() {
  if (!token) return ui.notifications.error("Please select a token first");

  const actor = token.actor;
  const weapons = actor.items.filter(i =>
    (i.type === "weapon" &&
      //i.data.data.range !== "0" && i.data.data.range !== "" &&
      i.data.data.ammo.trim() !== "" &&
      i.data.data.quantity > 0) ||
    (i.type === "weapon" &&
      //i.data.data.range !== "0" && i.data.data.range !== "" &&
      i.data.data.additionalStats.isConsumable &&
      i.data.data.additionalStats.isConsumable.value === true &&
      i.data.data.quantity > 0)
  );

  if (weapons.length === 0) return ui.notifications.error("You have no reloadable or consumable weapons.");

  let html = getHTML();
  let content = getContent();
  let buttons = getButtons();

  let dialog = new Dialog({
    content, buttons, title: `Attack Dialog`
  }, {
    width: 400,
  });

  dialogID = dialog.appId;

  await dialog._render(true);
  activeListeners();

  function getHTML() {
    let html = document.getElementById(`app-${dialogID}`)?.getElementsByTagName(`select`);
    if (html === undefined) return undefined;
    else return Array.from(html).map(h => h.value);
  }
  function getContent() {
    let selectedWeapon = html !== undefined
      ? html[0]
      : weapons[0].id;

    //console.log(html, selectedWeapon, weapons);

    //Get ammo and filter for the ammo the token actually owns.
    let ammo = weapons
      .find(w => w.id === selectedWeapon).data.data.ammo.trim().split(`|`)
      .filter(a => !!actor.items.getName(a));

    let rate_of_fire = parseInt(weapons.find(w => w.id === selectedWeapon).data.data.rof);
    let defaultShots = 1;
    if (rate_of_fire === 2) { defaultShots = 5; }
    if (rate_of_fire === 3) { defaultShots = 10; }
    if (rate_of_fire === 4) { defaultShots = 20; }
    if (rate_of_fire === 5) { defaultShots = 40; }
    if (rate_of_fire === 6) { defaultShots = 50; }

    return `
    <form>
      <div>
        <p>Here you can fire shots from your weapon or reload it.</p>
        <p>You don't need to adjust the "# of Shots" for realoading. If you change the ammo type you'll keep the old ammo unless it is a Charge Pack.</p>
        <p><b># of Shots per ROF:</b> ROF 1 = 1 Shot; ROF 2 = 5; ROF 3 = 10; ROF 4 = 20; ROF 5 = 40; ROF 6 = 50</p>
      </div>
      <div class="form-group">
        <label for="shots"># of Shots: </label>
        <input id="shots" type="number" min="0" value="${defaultShots}"></input>
      </div>
      <div class="form-group">
        <label for="weapon">Weapon: </label>
        <select id="weapon">${weapons.reduce((acc, val) => acc += `<option value="${val.id}" ${val.id === selectedWeapon ? `selected` : ``}>${val.name}</option>`, ``)}</select>
      </div>
      <div class="form-group">
        <label for="ammo">Ammo: </label>
        <select id="ammo">${ammo.reduce((acc, val) => acc += `<option value="${val}">${val}</option>`, ``)}</select>
      </div>
      <div class="form-group">
        <label for="singleReload">Can only reload one at a time: </label>
        <input id="singleReload" name="Single Reload" type="checkbox"></input>
      </div>
    </form>
    `
  }
  function getButtons() {
    return {
      a: {
        label: "Shoot", callback: shoot,
      },
      b: {
        label: "Reload", callback: reload,
      }
    }
  }
  function activeListeners() {
    document.getElementById("weapon").onchange = update;
  }
  async function update() {
    html = getHTML();
    dialog.data.content = getContent();
    dialog.data.buttons = getButtons();
    await dialog._render(true);
    activeListeners();
  }
  async function shoot(html) {
    let [shots, weapon, ammo] = getValues(html);
    let item_weapon = actor.items.get(weapon);
    let item_ammo = actor.items.getName(`${ammo}`);
    // Getting sfxDelay from game settings
    let sfxDelay = game.settings.get(
        'swim', 'sfxDelay');
    // Getting the sfx from the selected weapon
    let sfx_shot/* = stuff*/;
    let sfx_silenced/* = stuff*/;
    let sfx_shot_auto/* = stuff*/;
    let sfx_silenced_auto/* = stuff*/;
    let sfx_empty;
    if (item_weapon.data.data.additionalStats.sfx) {
      let sfx = item_weapon.data.data.additionalStats.sfx.value.split(`|`);
      sfx_shot = sfx[1];
      sfx_silenced = sfx[3];
      sfx_shot_auto = sfx[2];
      sfx_silenced_auto = sfx[4];
      sfx_empty = sfx[5];
    }
    // Setting a boolean depending on whether or not a weapon is silenced
    let sil = false;
    if (item_weapon.data.data.additionalStats.silenced && item_weapon.data.data.additionalStats.silenced.value === true) {
      sil = true;
    }
    // Getting Weapon and loaded ammo
    const weaponIMG = item_weapon.data.img;
    let currentAmmo
    if (item_weapon.data.data.additionalStats.loadedAmmo) {
      currentAmmo = item_weapon.data.data.additionalStats.loadedAmmo.value;
    }

    // Calculating shots to expend
    const currentCharges = parseInt(item_weapon.data.data.currentShots);
    const newCharges = currentCharges - shots;
    //If no ammo needed, only play SFX
    if (item_weapon.data.data.ammo === "NONE" && item_weapon.data.data.additionalStats.sfx) {
      // Play sound effects
      if (sil === true && sfx_silenced) {
          if (shots === 2) {
            AudioHelper.play({ src: `${sfx_silenced}` }, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({ src: `${sfx_silenced}` }, true);
          }
          else if (shots === 3) {
            //console.log("I AM HERE!");
            AudioHelper.play({ src: `${sfx_silenced}` }, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({ src: `${sfx_silenced}` }, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({ src: `${sfx_silenced}` }, true);
          }
          else if (shots > 3 && sfx_silenced_auto) {
            AudioHelper.play({ src: `${sfx_silenced_auto}` }, true);
          }
          else {
            AudioHelper.play({ src: `${sfx_silenced}` }, true);
          }
        }
        else {
          if (shots === 2) {
            AudioHelper.play({ src: `${sfx_shot}` }, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({ src: `${sfx_shot}` }, true);
          }
          else if (shots === 3) {
            //console.log("I AM HERE!");
            AudioHelper.play({ src: `${sfx_shot}` }, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({ src: `${sfx_shot}` }, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({ src: `${sfx_shot}` }, true);
          }
          else if (shots > 3 && sfx_shot_auto) {
            AudioHelper.play({ src: `${sfx_shot_auto}` }, true);
          }
          else {
            AudioHelper.play({ src: `${sfx_shot}` }, true);
          }
      }
  }
    else if (item_weapon.data.data.additionalStats.isConsumable && item_weapon.data.data.additionalStats.isConsumable.value === true) {
      const currentQuantity = parseInt(item_weapon.data.data.quantity);
      if (currentQuantity <= 0) {
        return ui.notifications.error(`You don't have a ${item_weapon.name} left.`);
      }
      const newQuantity = currentQuantity - shots;
      const updates = [
        { _id: item_weapon.id, "data.quantity": `${newQuantity}` },
      ];
      // Updating the consumable weapon
      await actor.updateOwnedItem(updates);
      // Deleting the consumable weapon if it was the last
      if (newQuantity <= 0) {
        item_weapon.delete();
      }
      // Creating the Chat message
      ChatMessage.create({
        speaker: {
          alias: token.name
        },
        content: `<img src="${weaponIMG}" alt="" width="25" height="25" /> ${token.name} uses ${shots} ${item_weapon.name}(s) and has ${newQuantity} left.`
      })
      // Play sound effects
      if (sfx_shot) {
        AudioHelper.play({ src: `${sfx_shot}` }, true);
      }
    }
    //Stuff for weapons with "doesn't require reload action" checked:
    else if (item_weapon.data.data.autoReload === true) {
      //Throw error if no ammo is left.
      console.log(item_ammo);
      if (item_ammo.data.data.quantity <= 0) { return ui.notifications.error(`You don't have a ${item_ammo.name} left.`); }
      else {
        //Setting new constants to overwrite the old ones
        const currentCharges = parseInt(item_ammo.data.data.quantity);
        const newCharges = currentCharges - shots;
        //Setting up the updates
        const updates = [
          { _id: item_ammo.id, "data.quantity": `${newCharges}` },
        ];
        // Updating the Weapon
        actor.updateOwnedItem(updates);
        //Creating the chat message
        ChatMessage.create({
          speaker: {
            alias: actor.name
          },
          content: `<img src="${weaponIMG}" alt="" width="25" height="25" /> ${actor.name} fires <b>${shots} ${currentAmmo} round(s)</b> from a ${item_weapon.name} and has <b>${newCharges} left</b>.`
        })
        //Playing the SFX
        // Play sound effects
        if (sil === true && sfx_silenced) {
          if (shots === 2) {
            AudioHelper.play({ src: `${sfx_silenced}` }, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({ src: `${sfx_silenced}` }, true);
          }
          else if (shots === 3) {
            //console.log("I AM HERE!");
            AudioHelper.play({ src: `${sfx_silenced}` }, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({ src: `${sfx_silenced}` }, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({ src: `${sfx_silenced}` }, true);
          }
          else if (shots > 3 && sfx_silenced_auto) {
            AudioHelper.play({ src: `${sfx_silenced_auto}` }, true);
          }
          else {
            AudioHelper.play({ src: `${sfx_silenced}` }, true);
          }
        }
        else {
          if (shots === 2) {
            AudioHelper.play({ src: `${sfx_shot}` }, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({ src: `${sfx_shot}` }, true);
          }
          else if (shots === 3) {
            //console.log("I AM HERE!");
            AudioHelper.play({ src: `${sfx_shot}` }, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({ src: `${sfx_shot}` }, true);
            await wait(`${sfxDelay}`);
            AudioHelper.play({ src: `${sfx_shot}` }, true);
          }
          else if (shots > 3 && sfx_shot_auto) {
            AudioHelper.play({ src: `${sfx_shot_auto}` }, true);
          }
          else {
            AudioHelper.play({ src: `${sfx_shot}` }, true);
          }
        }
      }
    }
    // Check if enough bullets are in the weapon to fire the given amount of shots if this is not a consumable weapon and does require loading action.
    else if (currentCharges < shots && item_weapon.data.data.autoReload === false) {
      ui.notifications.error("You have insufficient ammunition.")
      if (sfx_empty && currentCharges === 0) {
        AudioHelper.play({ src: `${sfx_empty}` }, true);
      }
      return;
    }
    else {
      const updates = [
        { _id: item_weapon.id, "data.currentShots": `${newCharges}` },
      ];
      // Updating the Weapon
      actor.updateOwnedItem(updates);
      // Creating the Chat message
      if (!currentAmmo) {
        ChatMessage.create({
          speaker: {
            alias: token.name
          },
          content: `<img src="${weaponIMG}" alt="" width="25" height="25" /> ${token.name} fires <b>${shots} round(s)</b> from a ${item_weapon.name} and has <b>${newCharges} left</b>.`
        })
      } else {
        ChatMessage.create({
          speaker: {
            alias: token.name
          },
          content: `<img src="${weaponIMG}" alt="" width="25" height="25" /> ${token.name} fires <b>${shots} ${currentAmmo} round(s)</b> from a ${item_weapon.name} and has <b>${newCharges} left</b>.`
        })
      }
      // Play sound effects
      if (sil === true && sfx_silenced) {
        if (shots === 2) {
          AudioHelper.play({ src: `${sfx_silenced}` }, true);
          await wait(`${sfxDelay}`);
          AudioHelper.play({ src: `${sfx_silenced}` }, true);
        }
        else if (shots === 3) {
          //console.log("I AM HERE!");
          AudioHelper.play({ src: `${sfx_silenced}` }, true);
          await wait(`${sfxDelay}`);
          AudioHelper.play({ src: `${sfx_silenced}` }, true);
          await wait(`${sfxDelay}`);
          AudioHelper.play({ src: `${sfx_silenced}` }, true);
        }
        else if (shots > 3 && sfx_silenced_auto) {
          AudioHelper.play({ src: `${sfx_silenced_auto}` }, true);
        }
        else {
          AudioHelper.play({ src: `${sfx_silenced}` }, true);
        }
      }
      else {
        if (shots === 2) {
          AudioHelper.play({ src: `${sfx_shot}` }, true);
          await wait(`${sfxDelay}`);
          AudioHelper.play({ src: `${sfx_shot}` }, true);
        }
        else if (shots === 3) {
          //console.log("I AM HERE!");
          AudioHelper.play({ src: `${sfx_shot}` }, true);
          await wait(`${sfxDelay}`);
          AudioHelper.play({ src: `${sfx_shot}` }, true);
          await wait(`${sfxDelay}`);
          AudioHelper.play({ src: `${sfx_shot}` }, true);
        }
        else if (shots > 3 && sfx_shot_auto) {
          AudioHelper.play({ src: `${sfx_shot_auto}` }, true);
        }
        else {
          AudioHelper.play({ src: `${sfx_shot}` }, true);
        }
      }
    }

    // console.log("Shoot | ", shots, weapon, ammo, sil, item_weapon);
  }
  function reload(html) {
    let [shots, weapon, ammo, singleReload] = getValues(html);
    // If no ammo left throw an error message.
    if (!ammo) {
      return ui.notifications.error("You have no ammo left to reload this weapon.");
    }
    let item_weapon = actor.items.get(weapon);
    // Do not allow consumable weapons to be reloaded
    if (item_weapon.data.data.additionalStats.isConsumable && item_weapon.data.data.additionalStats.isConsumable.value === true) {
      return ui.notifications.error("You cannot reload consumable weapons, please use Shooting instead.");
    }
    let item_ammo = actor.items.getName(`${ammo}`);
    //console.log(weapon, item_weapon, ammo, item_ammo);
    const oldAmmo = item_weapon.data.data.additionalStats.loadedAmmo.value;
    let item_oldAmmo;
    if (!oldAmmo) {
      item_oldAmmo = item_ammo;
    }
    else {
      item_oldAmmo = actor.items.getName(`${oldAmmo}`);
    }
    // We suspect that the ammo to reload is the same as the previously loaded one. If not chgType will tell the code to swap the ammo.
    let chgType = false;
    if (item_oldAmmo != item_ammo) {
      chgType = true;
    }
    // Getting the sfx from the selected weapon
    let sfx_reload/* = stuff*/;
    if (item_weapon.data.data.additionalStats.sfx) {
      let sfx = item_weapon.data.data.additionalStats.sfx.value.split(`|`);
      sfx_reload = sfx[0];
    }
    // Getting images from items
    const weaponIMG = item_weapon.data.img;
    const ammoIMG = item_ammo.data.img;

    // Getting current numbers
    const currentCharges = parseInt(item_weapon.data.data.currentShots);
    const maxCharges = parseInt(item_weapon.data.data.shots);
    const requiredCharges = parseInt(item_weapon.data.data.shots - currentCharges);
    const availableAmmo = parseInt(item_ammo.data.data.quantity);
    const oldAmmoQuantity = parseInt(item_oldAmmo.data.data.quantity);
    // Variables for recharging procedure
    let amountToRecharge;
    let newCharges;
    let newAmmo;
    let oldAmmoRefill;
    // Checking if the Ammo is a charge pack. If not or additionalStat is not present ignore it. Charge Packs can only refill if curr and max shots are equal.
    if (item_ammo.data.data.additionalStats.isPack && item_ammo.data.data.additionalStats.isPack.value === true) {
      // Charge Packs only use 1 Quantity to fully charge the weapon
      amountToRecharge = parseInt(item_weapon.data.data.shots);
      newCharges = amountToRecharge;
      newAmmo = availableAmmo - 1;
      //Refill old Charge Pack if it is still full (current and max shots are equal)
      if (chgType === true && currentCharges === maxCharges) {
        oldAmmoRefill = oldAmmoQuantity + 1;
      }
      else if (chgType === true && currentCharges != maxCharges) {
        oldAmmoRefill = oldAmmoQuantity;
      }
    }
    // Checking if user selected to change the ammo type. This is only relevant if not a Charge Pack, if it is, it's already handled above.
    else if (chgType === true) {
      // When changing Ammo type, remaining shots should not become the new Ammo Type.
      amountToRecharge = parseInt(item_weapon.data.data.shots);
      //Change the amount to recharge to 1 if singleReload is checked.
      if (singleReload === true) { amountToRecharge = 1; }
      newCharges = amountToRecharge;
      newAmmo = availableAmmo - amountToRecharge;
      oldAmmoRefill = oldAmmoQuantity + currentCharges;
    }
    else {
      // If the quantity of ammo is less than the amount required, use whatever is left.
      amountToRecharge = Math.min(availableAmmo, requiredCharges);
      //Change the amount to recharge to 1 if singleReload is checked.
      if (singleReload === true) { amountToRecharge = 1; }
      newCharges = currentCharges + amountToRecharge;
      newAmmo = availableAmmo - amountToRecharge;
    }
    // Check if there is ammo left to reload.
    if (availableAmmo < 1) {
      ui.notifications.notify("You are out of ammunition.")
    }
    else if (chgType === true) {
      const updates = [
        { _id: item_weapon.id, "data.currentShots": `${newCharges}`, "data.additionalStats.loadedAmmo.value": `${ammo}` },
        { _id: item_ammo.id, "data.quantity": `${newAmmo}` },
        { _id: item_oldAmmo.id, "data.quantity": `${oldAmmoRefill}` },
      ];

      actor.updateOwnedItem(updates);
      ChatMessage.create({
        speaker: {
          alias: token.name
        },
        content: `<img src="${weaponIMG}" alt="" width="25" height="25" /><img src="${ammoIMG}" alt="" width="25" height="25" /> ${token.name} reloads his/her ${item_weapon.name} with ${item_ammo.name}.`
      })
      if (sfx_reload) {
        AudioHelper.play({ src: `${sfx_reload}` }, true)
      }
    }
    else {
      const updates = [
        { _id: item_weapon.id, "data.currentShots": `${newCharges}`, "data.additionalStats.loadedAmmo.value": `${ammo}` },
        { _id: item_ammo.id, "data.quantity": `${newAmmo}` },
      ];

      actor.updateOwnedItem(updates);
      ChatMessage.create({
        speaker: {
          alias: token.name
        },
        content: `<img src="${weaponIMG}" alt="" width="25" height="25" /><img src="${ammoIMG}" alt="" width="25" height="25" /> ${token.name} reloads his/her ${item_weapon.name} with ${item_ammo.name}.`
      })
      if (sfx_reload) {
        AudioHelper.play({ src: `${sfx_reload}` }, true)
      }
    }

    // Ammo with no more bullets left are NOT deleted because that could cause issues when trying to change the ammo.
  }
  function getValues(html) {
    return [
      html.find(`#shots`)[0].valueAsNumber,
      html.find(`#weapon`)[0].value,
      html.find(`#ammo`)[0].value,
      html.find(`#singleReload`)[0].checked,
    ];
  }
  // V. 3.0.0 By SalieriC#8263. Dialogue Framework: Kekilla#7036
}

weaponDialog();
