import { unshake_swd_script, unshake_swade_script } from './swim_modules/unshake.js'
import { unstun_script } from './swim_modules/unstun.js'

export class api {

static registerSettings() {
  api.globals()
}

static globals() {
  globalThis['swim'] = {
    unshake : api._unshake,
    unstun : api._unstun,
    critFail_check: api._critFail_check
  }
}

  // Unshake script
  static async _unshake(version) {
    if (version === "SWD") { unshake_swd_script() }
    else if (version === "SWADE") { unshake_swade_script() }
  }

  // Unstun script
  static async _unstun() {
    unstun_script()
  }

  /* Call Macros (Deprecated as of version 0.15.0)
  static async start_macro(macroName, compendiumName = 'swim.swade-immersive-macros') {
    let pack = game.packs.get(compendiumName);
    let macro = (await pack.getDocuments()).find(i => (i.data.name == macroName));
    await macro.execute();
  }
  */

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

  //In the Check for Bennies function, don't forget Coup (50F) which always adds a Benny even if it is an Extra.
}