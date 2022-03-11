import { swim } from './swim-class.js';

function register_settings() {
    // Documentation Read
    game.settings.register('swim', 'docRead', {
        name: game.i18n.localize("SWIM.docReadName"),
        hint: game.i18n.localize("SWIM.docReadHint"),
        type: Boolean,
        default: false,
        scope: 'user',
        config: true,
    });
    // Chase Deck Name
    game.settings.register('swim', 'chaseDeck', {
        name: game.i18n.localize("SWIM.chaseDeckName"),
        hint: game.i18n.localize("SWIM.chaseDeckHint"),
        type: String,
        default: 'Chase Deck',
        scope: 'world',
        config: true,
    });
    // Gritty Damage Injury Table Name
    game.settings.register('swim', 'injuryTable', {
        name: game.i18n.localize("SWIM.injuryTableName"),
        hint: game.i18n.localize("SWIM.injuryTableHint"),
        type: String,
        default: 'Injury Table',
        scope: 'world',
        config: true,
    });
    // Gritty Damage Setting Rule
    game.settings.register('swim', 'grittyDamage', {
        name: game.i18n.localize("SWIM.grittyDamageName"),
        hint: game.i18n.localize("SWIM.grittyDamageHint"),
        type: Boolean,
        default: false,
        scope: 'world',
        config: true,
    });
    // Gritty Damage for NPCs
    game.settings.register('swim', 'grittyDamageNPC', {
        name: game.i18n.localize("SWIM.grittyDamageNPCName"),
        hint: game.i18n.localize("SWIM.grittyDamageNPCHint"),
        type: Boolean,
        default: false,
        scope: 'world',
        config: true,
    });
    // Fear Table Name
    game.settings.register('swim', 'fearTable', {
        name: game.i18n.localize("SWIM.fearTableName"),
        hint: game.i18n.localize("SWIM.fearTableHint"),
        type: String,
        default: 'Fear Table',
        scope: 'world',
        config: true,
    });
    // Health Potion Names
    game.settings.register('swim', 'healthPotionOptions', {
        name: game.i18n.localize("SWIM.healthPotionOptionsName"),
        hint: game.i18n.localize("SWIM.healthPotionOptionsHint"),
        type: String,
        default: 'Minor Health Potion|Health Potion|Greater Health Potion|Minor Healing Potion|Healing Potion|Greater Healing Potion',
        scope: 'world',
        config: true,
    });
    // Fatigue Potion Names
    game.settings.register('swim', 'fatiguePotionOptions', {
        name: game.i18n.localize("SWIM.fatiguePotionOptionsName"),
        hint: game.i18n.localize("SWIM.fatiguePotionOptionsHint"),
        type: String,
        default: 'Minor Potion of Well-Being|Potion of Well-Being|Greater Potion of Well-Being|Minor Recreational Potion|Recreational Potion|Greater Recreational Potion',
        scope: 'world',
        config: true,
    });
    // Natural Healing time
    game.settings.register('swim', 'natHeal_time', {
        name: game.i18n.localize("SWIM.natHeal_TimeName"),
        hint: game.i18n.localize("SWIM.natHeal_TimeHint"),
        type: String,
        default: 'five days',
        scope: 'world',
        config: true,
    });
    // SFX sfxDelay
    game.settings.register('swim', 'sfxDelay', {
        name: game.i18n.localize("SWIM.sfxDelayName"),
        hint: game.i18n.localize("SWIM.sfxDelayHint"),
        type: Number,
        default: '110',
        scope: 'world',
        config: true,
    });
    // Ammo usage for NPCs
    game.settings.register('swim', 'npcAmmo', {
        name: game.i18n.localize("SWIM.npcAmmoName"),
        hint: game.i18n.localize("SWIM.npcAmmoHint"),
        type: Boolean,
        default: false,
        scope: 'world',
        config: true,
    });
    // Shaken SFX
    game.settings.register('swim', 'shakenSFX', {
        name: game.i18n.localize("SWIM.shakenSFXName"),
        hint: game.i18n.localize("SWIM.shakenSFXHint"),
        type: window.Azzu.SettingsTypes.FilePickerAudio,
        default: 'modules/swim/assets/sfx/Pain-sound-effect-converted-Alexander-www.orangefreesounds.com.ogg',
        scope: 'world',
        config: true,
    });
    // Incapacitation SFX
    game.settings.register('swim', 'incapSFX', {
        name: game.i18n.localize("SWIM.incapSFXName"),
        hint: game.i18n.localize("SWIM.incapSFXHint"),
        type: window.Azzu.SettingsTypes.FilePickerAudio,
        default: 'modules/swim/assets/sfx/HeartBeat-sound-effect-2-altered-Alexander-www.orangefreesounds.com.ogg',
        scope: 'world',
        config: true,
    });
    // Stunned SFX
    game.settings.register('swim', 'stunSFX', {
        name: game.i18n.localize("SWIM.stunSFXName"),
        hint: game.i18n.localize("SWIM.stunSFXHint"),
        type: window.Azzu.SettingsTypes.FilePickerAudio,
        default: 'modules/swim/assets/sfx/Body-Thud-altered-www.fesliyanstudios.com.ogg',
        scope: 'world',
        config: true,
    });
    // Prone Image deprecated, as it is no longer needed with changes in CUB.
    // Wounded SFX
    game.settings.register('swim', 'woundedSFX', {
        name: game.i18n.localize("SWIM.woundedSFXName"),
        hint: game.i18n.localize("SWIM.woundedSFXHint"),
        type: window.Azzu.SettingsTypes.FilePickerAudio,
        default: 'modules/swim/assets/sfx/Ripping-Flesh-altered-www.fesliyanstudios.com.ogg',
        scope: 'world',
        config: true,
    });
    // Fatigue SFX
    game.settings.register('swim', 'fatiguedSFX', {
        name: game.i18n.localize("SWIM.fatiguedSFXName"),
        hint: game.i18n.localize("SWIM.fatiguedSFXHint"),
        type: window.Azzu.SettingsTypes.FilePickerAudio,
        default: 'modules/swim/assets/sfx/Hard-Breathing-Medium-Pace-altered-www.fesliyanstudios.com.ogg',
        scope: 'world',
        config: true,
    });
    // Fear SFX
    game.settings.register('swim', 'fearSFX', {
        name: game.i18n.localize("SWIM.fearSFXName"),
        hint: game.i18n.localize("SWIM.fearSFXHint"),
        type: window.Azzu.SettingsTypes.FilePickerAudio,
        default: 'modules/swim/assets/sfx/Suspense_Sound_Effect_altered_-_David_Fesliyan-www.FesliyanStudios.com.ogg',
        scope: 'world',
        config: true,
    });
    // Healing SFX
    game.settings.register('swim', 'healSFX', {
        name: game.i18n.localize("SWIM.healSFXName"),
        hint: game.i18n.localize("SWIM.healSFXHint"),
        type: window.Azzu.SettingsTypes.FilePickerAudio,
        default: 'modules/swim/assets/sfx/Huh-converted-Alexander-www.orangefreesounds.com.ogg',
        scope: 'world',
        config: true,
    });
    // Removing Fatigue SFX
    game.settings.register('swim', 'looseFatigueSFX', {
        name: game.i18n.localize("SWIM.looseFatigueSFXName"),
        hint: game.i18n.localize("SWIM.looseFatigueSFXHint"),
        type: window.Azzu.SettingsTypes.FilePickerAudio,
        default: 'modules/swim/assets/sfx/Huh-converted-Alexander-www.orangefreesounds.com.ogg',
        scope: 'world',
        config: true,
    });
    // Potion SFX
    game.settings.register('swim', 'potionSFX', {
        name: game.i18n.localize("SWIM.potionSFXName"),
        hint: game.i18n.localize("SWIM.potionSFXHint"),
        type: window.Azzu.SettingsTypes.FilePickerAudio,
        default: 'modules/swim/assets/sfx/Drinking-Water-altered-www.fesliyanstudios.com.ogg',
        scope: 'world',
        config: true,
    });
    // Shape Shift SFX
    game.settings.register('swim', 'shapeShiftSFX', {
        name: game.i18n.localize("SWIM.shapeShiftSFXName"),
        hint: game.i18n.localize("SWIM.shapeShiftSFXHint"),
        type: window.Azzu.SettingsTypes.FilePickerAudio,
        default: '',
        scope: 'world',
        config: true,
    });
    // Shape Shift VFX
    game.settings.register('swim', 'shapeShiftVFX', {
        name: game.i18n.localize("SWIM.shapeShiftVFXName"),
        hint: game.i18n.localize("SWIM.shapeShiftVFXHint"),
        type: window.Azzu.SettingsTypes.FilePickerVideo,
        default: '',
        scope: 'world',
        config: true,
    });
    // Irradiation Condition
    game.settings.register('swim', 'irradiationSetting', {
        name: game.i18n.localize("SWIM.irradiationSettingName"),
        hint: game.i18n.localize("SWIM.irradiationSettingHint"),
        type: Boolean,
        default: false,
        scope: 'world',
        config: true,
        onChange: () => {
            window.location.reload();
        }
    });
}

/*Hooks.on('getCardsDirectoryEntryContext', function (stuff) {
    console.log(stuff)
})*/

Hooks.on('getSceneControlButtons', function (hudButtons) {
    // Add Raise Calculator Button
    let hud = hudButtons.find(val => { return val.name == "token"; })
    if (hud) {
        hud.tools.push({
            name: "SWIM.openRaiseCalculatorName",
            title: "SWIM.openRaiseCalculatorHint",
            icon: "fas fa-plus-square",
            button: true,
            onClick: async () => {
                let text = `<img style="border: 0;" src="modules/swim/assets/icons/misc/raise_black.svg" alt="" width="25" height="25" /> Your Raises will show here once you leave the Result field.`;

                new Dialog({
                    title: 'Raise Calculator',
                    content: `
                        <form>
                        <div class="form-group">
                        <label><img src="modules/swim/assets/icons/misc/bullseye.svg" alt="" width="25" height="25" style="border: 0;" /> <b>Target Number:</b></label>
                        <input name="target" placeholder="0" type="number" onClick="this.select();"/>
                        </div>
                        <div class="form-group">
                        <label><img src="modules/swim/assets/icons/misc/rolling-dices.svg" alt="" border="0" width="25" height="25" style="border: 0;" /> <b>Result:</b></label>
                        <input name="result" placeholder="0" type="number" onClick="this.select();"/>
                        </div>
                        <p class="calculation">${text}</p>
                        </form>`,
                    buttons: {},
                    render: ([dialogContent]) => {
                        dialogContent.querySelector(`input[name="target"`).focus();
                        dialogContent.querySelector(`input[name="result"`).addEventListener("input", (event) => {
                            const textInput = event.target;
                            const form = textInput.closest("form")
                            const calcResult = form.querySelector(".calculation");
                            const target = form.querySelector('input[name="target"]').value;
                            const result = form.querySelector('input[name="result"]').value;
                            let raises = Math.floor((parseInt(result) - parseInt(target)) / 4);
                            if (parseInt(target) > parseInt(result)) {
                                calcResult.innerHTML = `<img style="border: 0;" src="modules/swim/assets/icons/misc/raise_red.svg" alt="" width="25" height="25" /> <b>Failure</b>`;
                            }
                            else if (parseInt(target) <= parseInt(result) && raises < 1) {
                                calcResult.innerHTML = `<img style="border: 0;" src="modules/swim/assets/icons/misc/raise_yellow.svg" alt="" width="25" height="25" /> <b>Success</b>`;
                            }
                            else {
                                calcResult.innerHTML = `<img style="border: 0;" src="modules/swim/assets/icons/misc/raise_green.svg" alt="" width="25" height="25" /> <b>${raises} Raise(s)</b>`;
                            }
                        });
                    },
                }).render(true);
            }
        });
    }

    // Hijack the systems chase setup:
    let tilesButton = hudButtons.find(val => { return val.name == "tiles"; })
    let chaseButtonIndex = tilesButton.tools.findIndex(object => { return object.name === "clear-chase-cards" })
    if (chaseButtonIndex !== -1) {
        tilesButton.tools.splice(chaseButtonIndex, 1)
    }
    tilesButton.tools.push({
        name: 'chase-setup',
        title: game.i18n.localize("SWIM.ChaseSetup"),
        icon: "fas fa-shipping-fast",
        button: true,
        onClick: async () => { swim.start_macro(`[Script] Chase Setup`) }
    })
});

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