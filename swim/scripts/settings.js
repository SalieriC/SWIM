/* globals game, FormApplication, $ */

export const settingVariables = [
    {id: 'grittyDamage', config_type: Boolean, tab: "Setting Rules", default: false},
    {id: 'grittyDamageNPC', config_type: Boolean, tab: "Setting Rules", default: false},
    {id: 'natHeal_Time', config_type: String, tab: "Setting Rules", default: 'five days'},
    {id: 'npcAmmo', config_type: Boolean, tab: "Setting Rules",  default: false},
    {id: 'healthPotionOptions', config_type: String, tab: "Item Options",
        default: 'Minor Health Potion|Health Potion|Greater Health Potion|Minor Healing Potion|Healing Potion|Greater Healing Potion'},
    {id: 'fatiguePotionOptions', config_type: String, tab: "Item Options",
        default: 'Minor Potion of Well-Being|Potion of Well-Being|Greater Potion of Well-Being|Minor Recreational Potion|Recreational Potion|Greater Recreational Potion'},
    {id: 'injuryTable', config_type: String, tab: "Roll Tables", default: 'Injury Table'},
    {id: 'fearTable', config_type: String, tab: "Roll Tables", default: 'Fear Table'},
    {id: 'chaseDeck', config_type: String, tab: "Roll Tables", default: 'Chase Deck'},
    {id: 'sfxDelay', config_type: Number, tab: "SFX & VFX Options", default: '110'},
    {id: 'shakenSFX', config_type: window.Azzu.SettingsTypes.FilePickerAudio, tab: "SFX & VFX Options",
        default: 'modules/swim/assets/sfx/Pain-sound-effect-converted-Alexander-www.orangefreesounds.com.ogg'},
    {id: 'incapSFX', config_type: window.Azzu.SettingsTypes.FilePickerAudio, tab: "SFX & VFX Options",
        default: 'modules/swim/assets/sfx/HeartBeat-sound-effect-2-altered-Alexander-www.orangefreesounds.com.ogg'},
    {id: 'stunSFX', config_type: window.Azzu.SettingsTypes.FilePickerAudio, tab: "SFX & VFX Options",
        default: 'modules/swim/assets/sfx/Body-Thud-altered-www.fesliyanstudios.com.ogg'},
    {id: 'woundedSFX', config_type: window.Azzu.SettingsTypes.FilePickerAudio, tab: "SFX & VFX Options",
        default: 'modules/swim/assets/sfx/Ripping-Flesh-altered-www.fesliyanstudios.com.ogg'},
    {id: 'fatiguedSFX', config_type: window.Azzu.SettingsTypes.FilePickerAudio, tab: "SFX & VFX Options",
        default: 'modules/swim/assets/sfx/Hard-Breathing-Medium-Pace-altered-www.fesliyanstudios.com.ogg'},
    {id: 'fearSFX', config_type: window.Azzu.SettingsTypes.FilePickerAudio, tab: "SFX & VFX Options",
        default: 'modules/swim/assets/sfx/Suspense_Sound_Effect_altered_-_David_Fesliyan-www.FesliyanStudios.com.ogg'},
    {id: 'healSFX', config_type: window.Azzu.SettingsTypes.FilePickerAudio, tab: "SFX & VFX Options",
        default: 'modules/swim/assets/sfx/Huh-converted-Alexander-www.orangefreesounds.com.ogg'},
    {id: 'looseFatigueSFX', config_type: window.Azzu.SettingsTypes.FilePickerAudio, tab: "SFX & VFX Options",
        default: 'modules/swim/assets/sfx/Huh-converted-Alexander-www.orangefreesounds.com.ogg'},
    {id:  'potionSFX', config_type: window.Azzu.SettingsTypes.FilePickerAudio, tab: "SFX & VFX Options",
        default: 'modules/swim/assets/sfx/Drinking-Water-altered-www.fesliyanstudios.com.ogg'},
    {id: 'shapeShiftSFX', config_type: window.Azzu.SettingsTypes.FilePickerAudio, tab: "SFX & VFX Options",
        default: ''},
    {id: 'shapeShiftVFX', config_type: window.Azzu.SettingsTypes.FilePickerVideo, tab: "SFX & VFX Options",
        default: ''},
    {id: 'irradiationSetting', config_type: Boolean, tab: "Additional Conditions", default: false},
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
    game.settings.registerMenu('swim', 'custom-config', {
        name: game.i18n.localize("SWIM.ConfigMenuName"),
        label: game.i18n.localize("SWIM.ConfigMenuLabel"),
        icon: 'fas fa-fish',
        hint: game.i18n.localize("SWIM.ConfigMenuHint"),
        type: CustomConfigForm
    });
    for (let setting of settingVariables) {
        game.settings.register('swim', setting.id, {
            name: game.i18n.localize(`SWIM.${setting.id}Name`),
            hint: game.i18n.localize(`SWIM.${setting.id}Hint`),
            type: setting.config_type,
            default: setting.default,
            scope: 'world',
            config: false
        });
    }
}

class CustomConfigForm extends FormApplication {
    static get defaultOptions() {
        let options = super.defaultOptions;
        options.id = 'swim-custom-config';
        options.template = "/modules/swim/templates/customConfig.hbs";
        options.width = 630;
        options.height = 600;
        return options;
    }

    activateListeners(html) {
        html.find('.swim-tab-header').on('click', this.change_tab);
        return super.activateListeners(html);
    }

    change_tab(event) {
        const tab_name = event.currentTarget.dataset.tab;
        $('.swim-tab').each((_, tab) => {
            if (tab.dataset.tab === tab_name) {
                $(tab).addClass('active');
            } else {
                $(tab).removeClass('active');
            }
        });
    }

    getData() {
        let tabs = {};
        for (let setting of settingVariables) {
            if (! tabs.hasOwnProperty(setting.tab)) {
                tabs[setting.tab] = [];
            }
            tabs[setting.tab].push(
                {id: setting.id,
                 is_boolen: setting.config_type === Boolean,
                 use_audio_picker: setting.config_type === window.Azzu.SettingsTypes.FilePickerAudio,
                 use_video_picker: setting.config_type === window.Azzu.SettingsTypes.FilePickerVideo,
                 value: game.settings.get('swim', setting.id),
                 name: game.i18n.localize(`SWIM.${setting.id}Name`),
                 hint: game.i18n.localize(`SWIM.${setting.id}Hint`)});
        }
        return {tabs: tabs};
    }

    async _updateObject(_, formData) {
        for (let id in formData) {
            if (formData[id]) {
                await game.settings.set('swim', id, formData[id]);
            } else {
                await game.settings.set('swim', id, '');
            }
        }
        window.location.reload();
    }
}