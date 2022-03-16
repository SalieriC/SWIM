let dialogID = "";

async function weaponDialog() {
  if (!token) return ui.notifications.error("Please select a token first");

  const actor = token.actor;
  const weapons = actor.items.filter(i =>
    (i.type === "weapon" &&
      //i.data.data.range !== "0" && i.data.data.range !== "" &&
      i.data.data.ammo !== "" &&
      i.data.data.quantity > 0) ||
    (i.type === "weapon" &&
      //i.data.data.range !== "0" && i.data.data.range !== "" &&
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
      .find(w => w.id === selectedWeapon).data.data.ammo.split(`|`)
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
        <label for="sil">Silenced</label>
        <input id="sil" name="silenced" type="checkbox"></input>
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
    let [shots, weapon, ammo, sil] = getValues(html);
    let item_weapon = actor.items.get(weapon);
    let item_ammo = actor.items.get(ammo)
    // Getting the sfx from the selected weapon
    let sfx_shot/* = stuff*/;
    let sfx_silenced/* = stuff*/;
    let sfx_shot_auto/* = stuff*/;
    let sfx_silenced_auto/* = stuff*/;
    // Getting Weapon image
    const weaponIMG = item_weapon.data.img;

    // Calculating shots to expend
    const currentCharges = parseInt(item_weapon.data.data.currentShots);
    const newCharges = currentCharges - shots;
    if (item_weapon.data.data.additionalStats.isConsumable && item_weapon.data.data.additionalStats.isConsumable.value === true) {
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
    // Check if enough bullets are in the weapon to fire the given amount of shots if this is not a consumable weapon.
    else if (currentCharges < shots) {
      ui.notifications.error("You have insufficient ammunition.")
    }
    else {
      const updates = [
        { _id: item_weapon.id, "data.currentShots": `${newCharges}` },
      ];
      // Updating the Weapon
      actor.updateOwnedItem(updates);
      // Creating the Chat message
      ChatMessage.create({
        speaker: {
          alias: token.name
        },
        content: `<img src="${weaponIMG}" alt="" width="25" height="25" /> ${token.name} fires ${shots} round(s) from a ${item_weapon.name} and has ${newCharges} left.`
      })
      // Play sound effects
      if (sil === true && sfx_silenced) {
        if (shots > 4 && sfx_silenced_auto) {
          AudioHelper.play({ src: `${sfx_silenced_auto}` }, true);
        }
        else {
          AudioHelper.play({ src: `${sfx_silenced}` }, true);
        }
      }
      else {
        if (shots > 4 && sfx_shot_auto) {
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
    let [shots, weapon, ammo, sil] = getValues(html);
    // If no ammo left throw an error message.
    if (!ammo){
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
    // Getting the sfy from the selected weapon
    let sfx_reload/* = stuff*/;
    // Getting images from items
    const weaponIMG = item_weapon.data.img;
    const ammoIMG = item_ammo.data.img;

    // Getting current numbers
    const currentCharges = parseInt(item_weapon.data.data.currentShots);
    const requiredCharges = parseInt(item_weapon.data.data.shots - currentCharges);
    const availableAmmo = parseInt(item_ammo.data.data.quantity);
    const oldAmmoQuantity = parseInt(item_oldAmmo.data.data.quantity);
    // Variables for recharging procedure
    let amountToRecharge;
    let newCharges;
    let newAmmo;
    let oldAmmoRefill;
    // Checking if the Ammo is a charge pack. If not or additionalStat is not present ignore it. Charge Packs cannot refill so refill chgType is ignored.
    if (item_ammo.data.data.additionalStats.isPack && item_ammo.data.data.additionalStats.isPack.value === true) {
      // Charge Packs only use 1 Quantity to fully charge the weapon
      amountToRecharge = parseInt(item_weapon.data.data.shots);
      newCharges = amountToRecharge;
      newAmmo = availableAmmo - 1;
    }
    // Checking if user selected to change the ammo type. Charge Packs cannot refill so refill from chgType is ignored.
    else if (chgType === true) {
      // When changing Ammo type, remaining shots should not become the new Ammo Type.
      amountToRecharge = parseInt(item_weapon.data.data.shots);
      newCharges = amountToRecharge;
      newAmmo = availableAmmo - amountToRecharge;
      oldAmmoRefill = oldAmmoQuantity + currentCharges;
    }
    else {
      // If the quantity of ammo is less than the amount required, use whatever is left.
      amountToRecharge = Math.min(availableAmmo, requiredCharges);
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
      html.find(`#sil`)[0].checked,
    ];
  }
  // V. 1.0.0 By SalieriC#8263. Dialogue Framework: Kekilla#7036
}

weaponDialog();