// Many thanks to honeybadger#2614 for the support on setting up the API.

import { chase_setup_script } from './swim_modules/chase_setup.js'
import { common_bond_script } from './swim_modules/common_bond.js'
import { craft_campfire_script } from './swim_modules/craft_campfire.js'
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
import { travel_calculator } from './swim_modules/travel_calculator.js'
import { unshake_swd_script, unshake_swade_script } from './swim_modules/unshake.js'
import { unstun_script } from './swim_modules/unstun.js'
import { update_migration } from './migrations.js'
import * as SWIM from './constants.js'
import { OFFICIAL_MODULES } from './official_modules.js'
import { showWeaponAmmoDialog, br2_ammo_management_script } from "./swim_modules/ammo_management.js"
import { tester_script } from './swim_modules/tester.js'

let deck = [...SWIM.DECK_OF_CARDS]

export class api {

  // Exposing the globnals.
  static registerFunctions() {
    console.log("SWIM | API initialised.")
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
      get_official_journal_link: api._get_official_journal_link,
      get_official_compendium_key: api._get_official_compendium_key,
      get_actor_sfx: api._get_actor_sfx,
      get_weapon_sfx: api._get_weapon_sfx,
      play_sfx: api._play_sfx,
      get_folder_content: api._get_folder_content,
      run_migration: api._run_migration,
      get_pronoun: api._get_pronoun,
      generate_id: api._generate_id,
      draw_cards: api._draw_cards,
      shuffle_deck: api._shuffle_deck,
      // Convenience
      ammo_management: api._ammo_management,
      br2_ammo_management: api._ammo_management_br2,
      chase_setup: api._chase_setup,
      common_bond: api._common_bond,
      craft_campfire: api._craft_campfire,
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
      travel_calculator: api._travel_calculator,
      unshake: api._unshake,
      shake: api._shake,
      unstun: api._unstun,
      stun: api._stun,
      tester: api._tester
    }
  }

  /*******************************************
   * Utility scripts
   * - Get Macro Variables
   * - Crit Fail Check
   * - Get Benny Image
   * - Check Bennies
   * - Spend Benny
   * - First GM
   * - Is First GM
   * - Wait
   * - Get Official Class
   * - Get Official Journal Link
   * - Get Official Compendium Key
   * - Get SFX
   * - Play SFX
   * - Get Folder Contents
   * - Run Migration
   * - Get Pronoun
   * - Generate ID
   * - Get random cards
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
  static async _check_bennies(token, notify = true) {
    let tokenBennies = token.actor.system.bennies.value;
    let gmBennies
    let totalBennies
    //Check for actor status and adjust bennies based on edges.
    let actorLuck = token.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-luck").toLowerCase())
    let actorGreatLuck = token.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-greatLuck").toLowerCase())
    let actorCoup = token.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.ability-coup-50f").toLowerCase())
    if ((token.actor.system.wildcard === false) && (actorGreatLuck === undefined)) {
      if ((!(actorLuck === undefined)) && (tokenBennies > 1) && ((actorGreatLuck === undefined))) { tokenBennies = 1; }
      else { tokenBennies = 0; }
    }
    if (actorCoup) { tokenBennies = tokenBennies + 1 }

    // Non GM token has <1 bennie OR GM user AND selected token has <1 benny
    if (notify === true && ((!game.user.isGM && tokenBennies < 1) || (game.user.isGM && tokenBennies < 1 && game.user.getFlag("swade", "bennies") < 1))) {
      ui.notifications.warn("You have no more bennies left.");
    }
    if (game.user.isGM) {
      gmBennies = game.user.bennies;
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
        "system.bennies.value": tokenBennies - 1,
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
    const moduleIDs = Object.keys(OFFICIAL_MODULES).reverse();

    for (const moduleID of moduleIDs) {
      const module = OFFICIAL_MODULES[moduleID];
      const isActive = game.modules.get(moduleID)?.active;

      if (isActive) {
        return module.class;
      }
    }

    return "<div>"; //Return a regular div if no active modules class div is found.
  }
  // Get Journal Link from active official module
  static async _get_official_journal_link(searchString) {
    const moduleIDs = Object.keys(OFFICIAL_MODULES).reverse();

    for (const moduleID of moduleIDs) {
      const module = OFFICIAL_MODULES[moduleID];
      const isActive = game.modules.get(moduleID)?.active;

      if (isActive && module.links && module.links[searchString]) {
        return module.links[searchString];
      }
    }

    return null; // Return null if no active module with matching link is found
  }
  // Get Compendium Key from active official module
  static async _get_official_compendium_key(searchString) {
    const moduleIDs = Object.keys(OFFICIAL_MODULES).reverse();

    for (const moduleID of moduleIDs) {
      const module = OFFICIAL_MODULES[moduleID];
      const isActive = game.modules.get(moduleID)?.active;

      if (isActive && module.compendiums && module.compendiums[searchString]) {
        return module.compendiums[searchString];
      }
    }

    return null; // Return null if no active module with matching compendium key is found
  }
  // Get SFX
  static async _get_actor_sfx(actor) {
    let item = false
    await swim.run_migration(actor, item) //Run migration if needed.

    let shakenSFX = game.settings.get('swim', 'shakenSFX')
    let deathSFX = game.settings.get('swim', 'incapSFX')
    let unshakeSFX = game.settings.get('swim', 'looseFatigueSFX')
    let stunnedSFX = game.settings.get('swim', 'stunSFX')
    let soakSFX = game.settings.get('swim', 'looseFatigueSFX')
    let fatiguedSFX = game.settings.get('swim', 'fatiguedSFX')
    let looseFatigueSFX = game.settings.get('swim', 'looseFatigueSFX')
    if (actor.flags?.swim?.config) {
      shakenSFX = actor.flags.swim.config.shakenSFX ? actor.flags.swim.config.shakenSFX : game.settings.get('swim', 'shakenSFX')
      deathSFX = actor.flags.swim.config.deathSFX ? actor.flags.swim.config.deathSFX : game.settings.get('swim', 'incapSFX')
      unshakeSFX = actor.flags.swim.config.unshakeSFX ? actor.flags.swim.config.unshakeSFX : game.settings.get('swim', 'looseFatigueSFX')
      stunnedSFX = actor.flags.swim.config.stunnedSFX ? actor.flags.swim.config.stunnedSFX : game.settings.get('swim', 'stunSFX')
      soakSFX = actor.flags.swim.config.soakSFX ? actor.flags.swim.config.soakSFX : game.settings.get('swim', 'looseFatigueSFX')
      fatiguedSFX = actor.flags.swim.config.fatiguedSFX ? actor.flags.swim.config.fatiguedSFX : game.settings.get('swim', 'fatiguedSFX')
      looseFatigueSFX = actor.flags.swim.config.looseFatigueSFX ? actor.flags.swim.config.looseFatigueSFX : game.settings.get('swim', 'looseFatigueSFX')
    }
    return { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX }
    // const { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(actor)
  }
  static async _get_weapon_sfx(weapon) {
    let actor = false
    await swim.run_migration(actor, weapon) //Run migration if needed.

    let reloadSFX
    let fireSFX
    let autoFireSFX
    let silencedFireSFX
    let silencedAutoFireSFX
    let emptySFX
    if (weapon.flags?.swim?.config) {
      reloadSFX = weapon.flags.swim.config.reloadSFX
      fireSFX = weapon.flags.swim.config.fireSFX
      autoFireSFX = weapon.flags.swim.config.autoFireSFX
      silencedFireSFX = weapon.flags.swim.config.silencedFireSFX
      silencedAutoFireSFX = weapon.flags.swim.config.silencedAutoFireSFX
      emptySFX = weapon.flags.swim.config.emptySFX
    }
    return { reloadSFX, fireSFX, autoFireSFX, silencedFireSFX, silencedAutoFireSFX, emptySFX }
    // const { reloadSFX, fireSFX, autoFireSFX, silencedFireSFX, silencedAutoFireSFX, emptySFX } = await swim.get_weapon_sfx(weapon)
  }
  // Play SFX
  static async _play_sfx(sfx, volume, playForAll = true) {
    if (!volume) {
      volume = game.settings.get(
        'swim', 'defaultVolume')
    }
    AudioHelper.play({ src: `${sfx}`, volume: volume, loop: false }, playForAll);
  }

  static _get_folder_content(folderName) {
    // This returns all contents of a folder and all its sub-folders on up to three layers. It gets the contents no matter of permission.
    const folder = game.folders.getName(folderName);
    return folder.contents.concat(folder.getSubfolders(true).flatMap(f => f.contents));

    /* alternative version that only goes one layer deep:
    let folder = game.folders.getName(folderName);
    let content = folder.contents; //in v9 it was `content` now it's `contents` but only on the first layer...
    let totalContent = folder.children.reduce((acc, subFolder) => {
        acc = acc.concat(subFolder.documents); //Within children it is `documents` instead of `contents` for whatever reason.
        return acc;
    }, content);
    console.log(totalContent)
    */
  }

  static async _run_migration(actor, item) {
    const currVersion = actor ? actor?.flags?.swim?.config?._version : item.flags?.swim?.config?._version
    item = actor ? false : item //Failsafe should s/o pass both.
    if (currVersion < SWIM.CONFIG_VERSION || !currVersion) {
      await update_migration(actor, item, currVersion)
      if (actor && actor.isToken) {
        let originalActor = game.actors.get(actor.id)
        if (originalActor) { await update_migration(originalActor, item, currVersion) }
      }
    }
  }

  //Get the defined pronoun or 'its' if undefined
  static _get_pronoun(actorOrToken) {
    let actor = actorOrToken
    if (actorOrToken.actor) {
      actor = actorOrToken.actor
    }
    let pronoun = game.i18n.localize("SWIM.Defaults_Pronoun") // english default: 'its'
    if (actor.flags?.swim?.config?.pronoun) {
      pronoun = actor.flags.swim.config.pronoun
    }
    return pronoun
  }

  //Generate random SWIM-ID
  static _generate_id(length = 16) {
    var result = 'SWIM-';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() *
        charactersLength));
    }
    return result;
  }

  //Get random cards
  static _draw_cards(numCards, sound = true) {
    if (numCards <= 0) {
      console.log("SWIM | Invalid number of cards.")
      ui.notifications.warn(game.i18n.localize("SWIM.notification-invalidNumber"))
      return []
    } else if (numCards > deck.length) {
      console.log("SWIM | There are not enough cards in the deck left. Use 'swim.shuffle_deck()' to shuffle.")
      ui.notification.warn(game.i18n.localize("SWIM.notification-notEnoughCards"))
      return []
    }

    const drawnCards = [];
    for (let i = 0; i < numCards; i++) {
      drawnCards.push(deck.shift());
    }

    if (sound) {
      const volume = game.settings.get('swim', 'defaultVolume')
      swim.play_sfx('systems/swade/assets/card-flip.wav', volume, false)
    }

    console.log("SWIM | Cards drawn:", drawnCards)
    return drawnCards;
  }

  //Shuffle Deck
  static _shuffle_deck(sound = true, notification = true) {
    //First get the original deck of cards:
    deck = [...SWIM.DECK_OF_CARDS]

    // Now do a Fisher-Yates shuffle starting from the last element and swap it with a randomly selected element:
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    if (sound) {
      const volume = game.settings.get('swim', 'defaultVolume')
      swim.play_sfx('systems/swade/assets/card-flip.wav', volume, false)
    } if (notification) {
      ui.notifications.notify(game.i18n.localize("SWIM.notification-deckShuffled"))
    }

    return deck;
  }

  /*******************************************
   * Convenience aka "automation" scripts
   * - Ammo Management
   * - Ammo Management for BR2
   * - Chase Setup
   * - Common Bond
   * - Craft Campfire
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
   * - Travel Calculator
   * - (Un-)Shake
   * - Shake
   * - (Un-)Stun
   * - Stun
   * - Tester
   ******************************************/

  // Ammo Management
  static async _ammo_management() {
    //ammo_management_script()
    showWeaponAmmoDialog();
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
  //Craft Campfire
  static async _craft_campfire() {
    await craft_campfire_script()
  }
  // Deviation
  static async _deviation() {
    deviation_script()
  }
  // Effect Builder
  static async _effect_builder(message = false, item = false) {
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
  // Travel Calculator
  static async _travel_calculator() {
    travel_calculator()
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
  //Shake a token
  static async _shake(token) {
    const { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(token.actor)
    await succ.apply_status(token, 'shaken', true)
    if (shakenSFX) {
      AudioHelper.play({ src: `${shakenSFX}` }, true);
    }
  }
  // Unstun script
  static async _unstun(effect) {
    unstun_script(effect)
  }
  //Stun a token
  static async _stun(token) {
    const { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(token.actor)
    let conditionsToApply = []
    if (await succ.check_status(token, 'stunned') === false) {
      conditionsToApply.push('stunned')
    };

    if (await succ.check_status(token, 'prone') === false) {
      conditionsToApply.push('prone')
    };
    conditionsToApply.push('distracted')
    conditionsToApply.push('vulnerable')
    await succ.apply_status(token, conditionsToApply, true)
    if (stunnedSFX) {
      AudioHelper.play({ src: `${stunnedSFX}` }, true);
    }
  }
  //Tester
  static async _tester() {
    await tester_script()
  }
}