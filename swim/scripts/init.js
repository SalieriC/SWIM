function register_settings() {
    // Gritty Damage Injury Table ID
    game.settings.register('swim', 'injuryTableID', {
        name: game.i18n.localize("SWIM.injuryTableName"),
        hint: game.i18n.localize("SWIM.inmjuryTableHint"),
        type: String,
        default: '',
        scope: 'world',
        config: true,
        onChange: () => {
            window.location.reload();
        }
    });
    // Gritty Damage Injury Table ID
    game.settings.register('swim', 'shakenSFX', {
        name: game.i18n.localize("SWIM.shakenSFXName"),
        hint: game.i18n.localize("SWIM.shakenSFXHint"),
        type: window.Azzu.SettingsTypes.FilePickerImage,
        default: '',
        scope: 'world',
        config: true,
        onChange: () => {
            window.location.reload();
        }
    });
}

Hooks.on(`ready`, () => {
    console.log('SWADE Immersive Macros | Ready');
    register_settings();
});