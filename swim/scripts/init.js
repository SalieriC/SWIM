import { api } from './api.js';
import { register_settings } from './settings.js'
import { swim_buttons } from './buttons.js'

/*Hooks.on('getCardsDirectoryEntryContext', function (stuff) {
    console.log(stuff)
})*/

Hooks.on('getSceneControlButtons', function (hudButtons) {
    swim_buttons(hudButtons)
});

Hooks.on('setup', api.RegisterFunctions)

Hooks.on(`ready`, () => {
    if (!game.modules.get('settings-extender')?.active && game.user.isGM) {
        let key = "install and activate";
        if(game.modules.get('settings-extender')) key = "activate";
        ui.notifications.error(`SWIM requires the 'settings-extender' module. Please ${key} it.`)
    }
    if (!game.modules.get('compendium-folders')?.active && game.user.isGM) {
        let key = "install and activate";
        if(game.modules.get('compendium-folders')) key = "activate";
        ui.notifications.error(`SWIM requires the 'compendium-folders' module. Please ${key} it.`)
    }

    console.log('SWADE Immersive Macros | Ready');
    register_settings();
    if (game.settings.get('swim', 'irradiationSetting') === true) {
        CONFIG.statusEffects.push({ id: "irradiated", label: "Irradiated", icon: "modules/succ/assets/icons/0-irradiated.svg" });
    }

    if (game.settings.get('swim', 'docRead') === false) {
        new Dialog({
            title: 'Welcome to SWIM',
            content: `<form>
                <h1>Welcome to SWIM</h1>
                <p>SWIM means SWADE Immersive Macros and that's exactly what you get.</p>
                <p>Please make sure to read the <a href="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/README.md">ReadMe</a> and the <a href="https://github.com/SalieriC/SWADE-Immersive-Macros/tree/main/documentation">documentation</a> on the GitHub. Don't blame me if you don't quite get how SWIM works when it is in there. If it is not in there however, feel free to drop me a DM on Discord: SalieriC#8263</p>
                <p>Please also note that SWIM overrides some SWADE System behaviour, especially the chase cleanup. Instead you'll find the same button in the same spot (Tile controls on the left) that sets up a chase for you. Make sure to use the Chase Layouts provided by SWIM and found in a compendium with this, on other scenes the cards may not align properly. <strong>Do not blame FloRad</strong> if that is not working, it is provided by SWIM, not the system.</p>
                <p>Check this Box if you have read this dalogue and the ReadMe/Documentation of SWIM. Then this dalogue won't show up again.<p>
                <hr />
                <div class="form-group">
                    <label for="readIt">I declare that I have read all of the above and I won't bother the SWADE or PEG Inc. team with questions and problems regarding SWIM or I may be struck down by lightning: </label>
                    <input id="readIt" name="Read it!" type="checkbox"></input>
                </div>
                <hr />
                <p>Please also consider to donate if you really like SWIM. This is one of the few ways of letting me know that SWIM is actually used and appreciated by some. =)</p>
                <p><a href="https://ko-fi.com/salieric"><img style="border: 0px; display: block; margin-left: auto; margin-right: auto;" src="https://www.ko-fi.com/img/githubbutton_sm.svg" width="223" height="30" /></a></p>
            </form>`,
            buttons: {
                one: {
                    label: "Let me play already!",
                    callback: (html) => {
                        let readIt = html.find("#readIt")[0].checked
                        if (readIt) {
                            game.settings.set('swim', 'docRead', true)
                        }
                    }
                }
            },
        }).render(true);
    }
});