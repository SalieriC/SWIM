// Many thanks to honeybadger#2614 for the support on setting up the API.

import { ammo_management_script, br2_ammo_management_script } from './swim_modules/ammo_management.js'
import { chase_setup_script } from './swim_modules/chase_setup.js'
import { common_bond_script } from './swim_modules/common_bond.js'
import { deviation_script } from './swim_modules/deviation.js'
import { effect_builder } from './swim_modules/effect_builder.js'
import { falling_damage_script } from './swim_modules/falling_damage.js'
import { fear_table_script } from './swim_modules/fear_table.js'
import { loot_o_mat_script } from './swim_modules/loot-o-mat.js'
import { mark_dead_script } from './swim_modules/mark_dead.js'
import { summoner_script } from './swim_modules/mighty-summoner.js'
import { personal_health_centre_script } from './swim_modules/personal_health_centre.js'
import { radiation_centre_script } from './swim_modules/radiation_centre.js'
import { scale_calculator } from './swim_modules/scale_calculator.js'
import { shape_changer_script } from './swim_modules/shape_changer.js'
import { soak_damage_script } from './swim_modules/soak_damage.js'
import { token_vision_script } from './swim_modules/token_vision.js'
import { unshake_swd_script, unshake_swade_script } from './swim_modules/unshake.js'
import { unstun_script } from './swim_modules/unstun.js'
//import * as SWIM from './constants.js'

export class api {

  // Exposing the globnals.
  static registerFunctions() {
    console.log("SWIM API initialised.")
    api.globals()
  }

  // Setting symbols globally exposed.
  static globals() {
    globalThis['swim'] = {
      // Utility
      get_macro_variables: api._get_macro_variables,
      critFail_check: api._critFail_check,
      get_benny_image: api._get_benny_image,
      check_bennies: api._check_bennies,
      spend_benny: api._spend_benny,
      is_first_gm: api._is_first_gm,
      wait: api._wait,
      get_official_class: api._get_official_class,
      get_actor_sfx: api._get_actor_sfx,
      play_sfx: api._play_sfx,
      // Convenience
      ammo_management: api._ammo_management,
      br2_ammo_management: api._ammo_management_br2,
      chase_setup: api._chase_setup,
      common_bond: api._common_bond,
      deviation: api._deviation,
      effect_builder: api._effect_builder,
      falling_damage: api._falling_damage,
      fear_table: api._fear_table,
      loot_o_mat: api._loot_o_mat,
      mark_dead: api._mark_dead,
      mighty_summoner: api._mighty_summoner,
      personal_health_centre: api._personal_health_centre,
      radiation_centre: api._radiation_centre,
      scale_calculator: api._scale_calculator,
      shape_changer: api._shape_changer,
      soak_damage: api._soak_damage,
      token_vision: api._token_vision,
      unshake: api._unshake,
      unstun: api._unstun
    }
  }

  /*******************************************
   * Utility scripts
   * - Get Macro Variables
   * - Crit Fail Check
   * - Get Benny Image
   * - Check Bennies
   * - Spend Benny
   * - Get SFX
   * - Play SFX
   ******************************************/

  // Get Macro Variables
  static async _get_macro_variables() {
    // Add variables to the evaluation scope
    const speaker = ChatMessage.implementation.getSpeaker();
    const character = game.user.character;
    const actor = game.actors.get(speaker.actor);
    const token = (canvas.ready ? canvas.tokens.get(speaker.token) : null);
    return { speaker, character, actor, token }
  }
  // Crit Fail check
  static async _critFail_check(wildCard, r) {
    let critFail = false;
    if ((isSame_bool(r.dice) && isSame_numb(r.dice) === 1) && wildCard === false) {
      const failCheck = await new Roll("1d6x[Test for Critical Failure]").evaluate({ async: true });
      failCheck.toMessage()
      if (failCheck.dice[0].values[0] === 1) { critFail = true; }
    } else if (wildCard === true) {
      if (isSame_bool(r.dice) && isSame_numb(r.dice) === 1) { critFail = true }
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
    return critFail;
  }
  // Get Benny Image
  static async _get_benny_image() {
    let bennyImage = "systems/swade/assets/bennie.webp"
    let benny_Back = game.settings.get('swade', 'bennyImage3DBack')
    if (benny_Back) {
      bennyImage = benny_Back
    }
    return bennyImage
  }
  // Check Bennies
  static async _check_bennies(token) {
    let tokenBennies = token.actor.system.bennies.value;
    let gmBennies
    let totalBennies
    //Check for actor status and adjust bennies based on edges.
    let actorLuck = token.actor.data.items.find(function (item) { return (item.name.toLowerCase() === game.i18n.localize("SWIM.edge-luck").toLowerCase()) });
    let actorGreatLuck = token.actor.data.items.find(function (item) { return (item.name.toLowerCase() === game.i18n.localize("SWIM.edge-greatLuck").toLowerCase()) });
    let actorCoup = token.actor.data.items.find(function (item) { return (item.name.toLowerCase() === game.i18n.localize("SWIM.ability-coup-50f").toLowerCase()) });
    if ((token.actor.system.wildcard === false) && (actorGreatLuck === undefined)) {
      if ((!(actorLuck === undefined)) && (tokenBennies > 1) && ((actorGreatLuck === undefined))) { tokenBennies = 1; }
      else { tokenBennies = 0; }
    }
    if (actorCoup) { tokenBennies = tokenBennies + 1 }

    // Non GM token has <1 bennie OR GM user AND selected token has <1 benny
    if ((!game.user.isGM && tokenBennies < 1) || (game.user.isGM && tokenBennies < 1 && game.user.getFlag("swade", "bennies") < 1)) {
      ui.notifications.warn("You have no more bennies left.");
    }
    if (game.user.isGM) {
      gmBennies = game.user.getFlag("swade", "bennies");
      totalBennies = tokenBennies + gmBennies
    }
    else {
      totalBennies = tokenBennies
    }
    return { tokenBennies, gmBennies, totalBennies }
  }
  // Spend Benny
  static async _spend_benny(token, sendMessage) {
    let { tokenBennies, gmBennies, totalBennies } = await swim.check_bennies(token)
    //Subtract the spend, use GM benny if user is GM and token has no more bennies left or spend token benny if user is player and/or token has bennies left.
    if (totalBennies < 1) {
      /* This produces duplicate warnings. It's probably enough to have that warning in the check function.
      return ui.notifications.warn("You have no more bennies left.");
      */
      return
    } else if (game.user.isGM && tokenBennies < 1 && gmBennies >= 1) {
      await game.user.setFlag("swade", "bennies", game.user.getFlag("swade", "bennies") - 1)
    } else {
      await token.actor.update({
        "data.bennies.value": tokenBennies - 1,
      })
    }

    //Show the Benny Flip
    if (game.dice3d) {
      game.dice3d.showForRoll(new Roll("1dB").evaluate({ async: false }), game.user, true, null, false);
    }

    if (sendMessage === true) {
      const bennyImage = await swim.get_benny_image()
      ChatMessage.create({
        user: game.user.id,
        content: `<p><img style="border: none;" src="${bennyImage}"" width="25" height="25" /> ${game.user.name} spent a Benny for ${token.name}.</p>`,
      });
    }
  }
  // First GM (not exposed)
  static _first_gm() {
    // Returns the ID of the first active GM
    return game.users.find(u => u.isGM && u.active);
  }
  // Is First GM
  static _is_first_gm() {
    //Returns true if it is the first active GM, False if not.
    return game.user.id === api._first_gm()?.id;
  }
  // Wait
  static async _wait(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
  // Get official Class for HTML
  static async _get_official_class() {
    let officialClass = '<div>'
    if (game.modules.get("swpf-core-rules")?.active) { officialClass = '<div class="swade-core">' }
    else if (game.modules.get("deadlands-core-rules")?.active) { officialClass = '<div class="swade-core">' }
    else if (game.modules.get("sprawl-core-rules")?.active) { officialClass = '<div class="sprawl-core">' }
    else if (game.modules.get("swade-core-rules")?.active) { officialClass = '<div class="swade-core">' }
    return officialClass
  }
  // Get SFX
  static async _get_actor_sfx(actor) {
    let shakenSFX
    let deathSFX
    let unshakeSFX
    let soakSFX
    if (actor.system.additionalStats?.sfx) {
      let sfxSequence = actor.system.additionalStats.sfx.value.split("|")
      shakenSFX = sfxSequence[0]
      deathSFX = sfxSequence[1]
      unshakeSFX = sfxSequence[2]
      soakSFX = sfxSequence[3]
    }
    if (!shakenSFX || shakenSFX === "NULL") { shakenSFX = game.settings.get('swim', 'shakenSFX') }
    if (!deathSFX || deathSFX === "NULL") { deathSFX = game.settings.get('swim', 'incapSFX') }
    if (!unshakeSFX || unshakeSFX === "NULL") { unshakeSFX = game.settings.get('swim', 'looseFatigueSFX'); }
    if (!soakSFX || soakSFX === "NULL") { soakSFX = game.settings.get('swim', 'looseFatigueSFX'); }
    return { shakenSFX, deathSFX, unshakeSFX, soakSFX }
  }
  // Play SFX
  static async _play_sfx(sfx, volume, playForAll = true) {
    if (!volume) {
      volume = game.settings.get(
        'swim', 'defaultVolume')
    }
    AudioHelper.play({ src: `${sfx}`, volume: volume, loop: false }, playForAll);
  }

  /*******************************************
   * Convenience aka "automation" scripts
   * - Ammo Management
   * - Ammo Management for BR2
   * - Chase Setup
   * - Common Bond
   * - Deviation
   * - Effect Builder
   * - Falling Damage
   * - Fear Table
   * - Loot-o-Mat
   * - Mark Dead
   * - Mighty Summoner
   * - Personal Health Centre
   * - Radiation Centre
   * - Scale Calculator
   * - Shape Changer
   * - Soak Damage
   * - Token Vision
   * - (Un-)Shake
   * - (Un-)Stun
   ******************************************/

  // Ammo Management
  static async _ammo_management() {
    ammo_management_script()
  }
  static async _ammo_management_br2(message, actor, item) {
    br2_ammo_management_script(message, actor, item)
  }
  // Chase Setup
  static async _chase_setup() {
    chase_setup_script()
  }
  // Common Bond
  static async _common_bond() {
    common_bond_script()
  }
  // Deviation
  static async _deviation() {
    deviation_script()
  }
  // Effect Builder
  static async _effect_builder(message = false, item = false) {
    /* I honestly don't think this is worth it atm...
    console.log(message)
    const renderData = message ? message.getFlag("betterrolls-swade2", "render_data") : false
    if (renderData && (renderData.trait_roll.is_fumble === true || renderData.trait_roll.old_rolls.length > 0)) { return }
    let isSupportedPower = false
    const SUPPORTED_POWERS = [
      game.i18n.localize("SWIM.power-boost").toLowerCase(),
      game.i18n.localize("SWIM.power-lower").toLowerCase(),
      game.i18n.localize("SWIM.power-smite").toLowerCase(),
      game.i18n.localize("SWIM.power-protection").toLowerCase(),
      game.i18n.localize("SWIM.power-growth").toLowerCase(),
      game.i18n.localize("SWIM.power-shrink").toLowerCase(),
      game.i18n.localize("SWIM.power-sloth").toLowerCase(),
      game.i18n.localize("SWIM.power-speed").toLowerCase(),
      game.i18n.localize("SWIM.power-speedQuickness").toLowerCase(),
      game.i18n.localize("SWIM.power-beastFriend").toLowerCase(),
      game.i18n.localize("SWIM.power-invisibility").toLowerCase(),
      game.i18n.localize("SWIM.power-confusion").toLowerCase(),
      game.i18n.localize("SWIM.power-deflection").toLowerCase(),
      game.i18n.localize("SWIM.power-arcaneProtection").toLowerCase(),
      game.i18n.localize("SWIM.power-burrow").toLowerCase(),
      game.i18n.localize("SWIM.power-damageField").toLowerCase(),
      game.i18n.localize("SWIM.power-darksight").toLowerCase(),
      game.i18n.localize("SWIM.power-detectArcana").toLowerCase(),
      game.i18n.localize("SWIM.power-concealArcana").toLowerCase(),
      game.i18n.localize("SWIM.power-detect").toLowerCase(),
      game.i18n.localize("SWIM.power-conceal").toLowerCase(),
      game.i18n.localize("SWIM.power-disguise").toLowerCase(),
      game.i18n.localize("SWIM.power-environmentalProtection").toLowerCase(),
      game.i18n.localize("SWIM.power-farsight").toLowerCase(),
      game.i18n.localize("SWIM.power-fly").toLowerCase(),
      game.i18n.localize("SWIM.power-intangibility").toLowerCase(),
      game.i18n.localize("SWIM.power-mindLink").toLowerCase(),
      game.i18n.localize("SWIM.power-puppet").toLowerCase(),
      game.i18n.localize("SWIM.power-slumber").toLowerCase(),
      game.i18n.localize("SWIM.power-silence").toLowerCase(),
      game.i18n.localize("SWIM.power-speakLanguage").toLowerCase(),
      game.i18n.localize("SWIM.power-wallWalker").toLowerCase(),
      game.i18n.localize("SWIM.power-warriorsGift").toLowerCase(),
      game.i18n.localize("SWIM.power-empathy").toLowerCase(),
      game.i18n.localize("SWIM.power-blind").toLowerCase(),
      game.i18n.localize("SWIM.power-elementalManipulation").toLowerCase(),
      game.i18n.localize("SWIM.power-easeBurden-tes").toLowerCase(),
    ]
    console.log(SUPPORTED_POWERS)
    for (let power of SUPPORTED_POWERS) if (item.name.toLowerCase().includes(power)) isSupportedPower = true
    if (isSupportedPower === false) { return }*/
    effect_builder()
  }
  // Falling Damage
  static async _falling_damage() {
    falling_damage_script()
  }
  // Fear Table
  static async _fear_table() {
    fear_table_script()
  }
  // Loot-o-Mat
  static async _loot_o_mat() {
    loot_o_mat_script()
  }
  // Mark Dead
  static async _mark_dead() {
    mark_dead_script()
  }
  // Mighty Summoner
  static async _mighty_summoner() {
    summoner_script()
  }
  // Personal Health Centre
  static async _personal_health_centre() {
    personal_health_centre_script()
  }
  // Radiation Centre
  static async _radiation_centre() {
    radiation_centre_script()
  }
  // Scale Calculator
  static async _scale_calculator() {
    scale_calculator()
  }
  // Shape Changer
  static async _shape_changer() {
    shape_changer_script()
  }
  // Soak Damage
  static async _soak_damage(effect) {
    soak_damage_script(effect)
  }
  // Token Vision
  static async _token_vision() {
    token_vision_script()
  }
  // Unshake script
  static async _unshake(effect) {
    if (typeof effect === "string") {
      ui.notifications.error(game.i18n.localize("SWIM.notification.generalErrorMsg"))
      console.error("You were passing a string to the unshake macro. This is likely because you're using an outdated version of the macro. Please either import the newest version from the compendium into your world or change the macro as following: 'swim.unshake()' (without the ').")
      return;
    }
    const version = game.settings.get("swim", "swdUnshake") ? "SWD" : "SWADE"
    if (version === "SWD") { unshake_swd_script(effect) }
    else if (version === "SWADE") { unshake_swade_script(effect) }
  }
  // Unstun script
  static async _unstun(effect) {
    unstun_script(effect)
  }


  /* Call Macros (Deprecated as of version 0.15.0)
  static async start_macro(macroName, compendiumName = 'swim.swade-immersive-macros') {
    let pack = game.packs.get(compendiumName);
    let macro = (await pack.getDocuments()).find(i => (i.data.name == macroName));
    await macro.execute();
  }
  */

  //In the Check for Bennies function, don't forget Coup (50F) which always adds a Benny even if it is an Extra.
}