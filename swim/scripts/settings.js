export const settingVariables = [
    {id: 'grittyDamage', config_type: "Boolean", tab: "Setting Rules"},
    {id: 'grittyDamageNPC', config_type: "Boolean", tab: "Setting Rules"},
    {id: 'natHeal_time', config_type: "String", tab: "Setting Rules"},
    {id: 'npcAmmo', config_type: "Boolean", tab: "Setting Rules"},
    {id: 'healthPotionOptions', config_type: "String", tab: "Item Options"},
    {id: 'fatiguePotionOptions', config_type: "String", tab: "Item Options"},
    {id: 'injuryTable', config_type: "String", tab: "Roll Tables"},
    {id: 'fearTable', config_type: "String", tab: "Roll Tables"},
    {id: 'chaseDeck', config_type: "String", tab: "Roll Tables"},
    {id: 'sfxDelay', config_type: "Number", tab: "SFX & VFX Options"},
    {id: 'shakenSFX', config_type: "FilePickerAudio", tab: "SFX & VFX Options"},
    {id: 'incapSFX', config_type: "FilePickerAudio", tab: "SFX & VFX Options"},
    {id: 'stunSFX', config_type: "FilePickerAudio", tab: "SFX & VFX Options"},
    {id: 'woundedSFX', config_type: "FilePickerAudio", tab: "SFX & VFX Options"},
    {id: 'fatiguedSFX', config_type: "FilePickerAudio", tab: "SFX & VFX Options"},
    {id: 'fearSFX', config_type: "FilePickerAudio", tab: "SFX & VFX Options"},
    {id: 'healSFX', config_type: "FilePickerAudio", tab: "SFX & VFX Options"},
    {id: 'looseFatigueSFX', config_type: "FilePickerAudio", tab: "SFX & VFX Options"},
    {id: 'shapeShiftVFX', config_type: "FilePickerAudio", tab: "SFX & VFX Options"},
    {id: 'irradiationSetting', config_type: "Boolean", tab: "Additional Conditions"},
];

export function register_settings() {
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