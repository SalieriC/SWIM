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
        default: 'false',
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
}

Hooks.on(`ready`, () => {
    console.log('SWADE Immersive Macros | Ready');
    register_settings();
});