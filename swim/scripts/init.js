function register_settings() {
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
        default: 'Minor Health Potion, Health Potion, Greater Health Potion, Minor Healing Potion, Healing Potion, Greater Healing Potion',
        scope: 'world',
        config: true,
    });
    // Fatigue Potion Names
    game.settings.register('swim', 'fatiguePotionOptions', {
        name: game.i18n.localize("SWIM.fatiguePotionOptionsName"),
        hint: game.i18n.localize("SWIM.fatiguePotionOptionsHint"),
        type: String,
        default: 'Minor Potion of Well-Being, Potion of Well-Being, Greater Potion of Well-Being, Minor Recreational Potion, Recreational Potion, Greater Recreational Potion',
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
    // Prone Image
    game.settings.register('swim', 'proneIMG', {
        name: game.i18n.localize("SWIM.proneIMGName"),
        hint: game.i18n.localize("SWIM.proneIMGHint"),
        type: window.Azzu.SettingsTypes.FilePickerImage,
        default: 'modules/swim/assets/icons/status_markers/2-Prone.png',
        scope: 'world',
        config: true,
        /*onChange: () => {
            window.location.reload();
        }*/
    });
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
}

// Add Raise Calculator Button
Hooks.on('getSceneControlButtons', function (hudButtons) {
    let hud = hudButtons.find(val => { return val.name == "token"; });
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
});

Hooks.on(`ready`, () => {
    console.log('SWADE Immersive Macros | Ready');
    register_settings();
});