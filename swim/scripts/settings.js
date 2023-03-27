/* globals game, FormApplication, $ */

import * as SWIM from './constants.js'

export const settingVariables = [
    {id: 'swdUnshake', config_type: Boolean, tab: "Setting Rules", default: false},
    {id: 'grittyDamage', config_type: Boolean, tab: "Setting Rules", default: false},
    {id: 'grittyDamageNPC', config_type: Boolean, tab: "Setting Rules", default: false},
    {id: 'natHeal_Time', config_type: String, tab: "Setting Rules", default: 'five days'},
    {id: 'npcAmmo', config_type: Boolean, tab: "Setting Rules",  default: false},
    {id: 'noPowerPoints', config_type: Boolean, tab: "Setting Rules",  default: false},
    {id: 'healthPotionOptions', config_type: String, tab: "Item Options",
        default: 'Minor Health Potion|Health Potion|Greater Health Potion|Minor Healing Potion|Healing Potion|Greater Healing Potion'},
    {id: 'fatiguePotionOptions', config_type: String, tab: "Item Options",
        default: 'Minor Potion of Well-Being|Potion of Well-Being|Greater Potion of Well-Being|Minor Recreational Potion|Recreational Potion|Greater Recreational Potion'},
    {id: 'injuryTable', config_type: String, tab: "Tables & Playlists", default: 'Injury Table'},
    {id: 'fearTable', config_type: String, tab: "Tables & Playlists", default: 'Fear Table'},
    {id: 'chaseDeck', config_type: String, tab: "Tables & Playlists", default: 'Chase Deck'},
    {id: 'combatPlaylistManagement', config_type: Boolean, tab: "Tables & Playlists", default: true},
    {id: 'combatPlaylist', config_type: String, tab: "Tables & Playlists", default: 'Combat'},
    {id: 'noStopFolder', config_type: String, tab: "Tables & Playlists", default: 'Ambient'},
    {id: 'chaseDeck-MaxCards', config_type: Number, tab: "Chase Layout", default: '18'},
    {id: 'chaseDeck-CardsPerRow', config_type: Number, tab: "Chase Layout", default: '9'},
    {id: 'chaseDeck-CardsToDraw', config_type: Number, tab: "Chase Layout", default: '18'},
    {id: 'chaseDeck-GridWithPixels', config_type: Number, tab: "Chase Layout", default: '50'},
    {id: 'chaseDeck-BorderHorizontal', config_type: Number, tab: "Chase Layout", default: '0'},
    {id: 'chaseDeck-BorderVertical', config_type: Number, tab: "Chase Layout", default: '0'},
    {id: 'chaseDeck-CardHeight', config_type: Number, tab: "Chase Layout", default: '6'},
    {id: 'chaseDeck-CardWidth', config_type: Number, tab: "Chase Layout", default: '4'},
    {id: 'chaseDeck-DeckDown', config_type: Number, tab: "Chase Layout", default: '24'},
    {id: 'chaseDeck-DeckRight', config_type: Number, tab: "Chase Layout", default: '10'},
    {id: 'shapeChange-raiseScaleMultiplier', config_type: Number, tab: "Macro Options", default: SWIM.RAISE_SCALE_DEFAULT,
        min: SWIM.RAISE_SCALE_MIN, max: SWIM.RAISE_SCALE_MAX, step: 0.01},
    {id: 'shapeChange-numMorphs', config_type: Number, tab: "Macro Options", default: SWIM.NUM_MORPHS_DEFAULT,
        min: SWIM.NUM_MORPHS_MIN, max: SWIM.NUM_MORPHS_MAX, step: 1},
    {id: 'effectBuilder-usePowerIcons', config_type: Boolean, tab: "Macro Options", default: false},
    {id: 'ammoMgm-defaultSingleReload', config_type: Boolean, tab: "Macro Options", default: false},
    {id: 'ignoreShapeChangeSizeRule', config_type: Boolean, tab: "Macro Options", default: false},
    {id: 'campfireImgOn', config_type: window.Azzu.SettingsTypes.FilePickerVideo, tab: "Macro Options", default: "modules/jb2a_patreon/Library/Generic/Fire/Campfire/Bonfire_02_Regular_Orange_400x400.webm"},
    /* Comment that out for the moment as I have no idea yet how to change the behaviour on blind. Maybe this is better suited in SUCC anyway.
    {id: 'blindMode', config_type: String, tab: 'Macro Options', default: 'none', 
        options: [
            {value: 'none', locaString: 'SWIM.Option-noEffect'},
            {value: 'sense', locaString: 'SWIM.Option-senseAll'},
            {value: 'tremor', locaString: 'SWIM.Option-tremorSense'},
            {value: 'full', locaString: 'SWIM.Option-fullBlind'},
        ]},*/
    {id: 'br2Support', config_type: Boolean, tab: "SFX & VFX Options", default: false},
    {id: 'sfxDelay', config_type: Number, tab: "SFX & VFX Options", default: '110'},
    {id: 'defaultVolume', config_type: Number, tab: "SFX & VFX Options", default: '1' },
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
    {id: 'healVFX', config_type: window.Azzu.SettingsTypes.FilePickerVideo, tab: "SFX & VFX Options",
        default: ''},
    {id: 'looseFatigueSFX', config_type: window.Azzu.SettingsTypes.FilePickerAudio, tab: "SFX & VFX Options",
        default: 'modules/swim/assets/sfx/Huh-converted-Alexander-www.orangefreesounds.com.ogg'},
    {id:  'potionSFX', config_type: window.Azzu.SettingsTypes.FilePickerAudio, tab: "SFX & VFX Options",
        default: 'modules/swim/assets/sfx/Drinking-Water-altered-www.fesliyanstudios.com.ogg'},
    {id: 'shapeShiftSFX', config_type: window.Azzu.SettingsTypes.FilePickerAudio, tab: "SFX & VFX Options",
        default: ''},
    {id: 'shapeShiftVFX', config_type: window.Azzu.SettingsTypes.FilePickerVideo, tab: "SFX & VFX Options",
        default: ''},
    {id:  'lightSFX', config_type: window.Azzu.SettingsTypes.FilePickerAudio, tab: "SFX & VFX Options",
        default: 'modules/swim/assets/sfx/Fireball-Super-Quick-Whoosh-www.fesliyanstudios.com.ogg'},
    {id: 'callbackMode', config_type: String, tab: 'Misc', default: 'manual', 
        options: [
            {value: 'manual', locaString: 'SWIM.Option-manual'},
            //{value: 'automatic', locaString: 'SWIM.Option-automatic'},
            {value: 'disabled', locaString: 'SWIM.Option-disabled'}
        ]},
    {id: 'irradiationSetting', config_type: Boolean, tab: "Misc", default: false},
];

export function register_settings() {
    // Documentation Read
    game.settings.register('swim', 'docReadV1.1.0', {
        name: game.i18n.localize("SWIM.docReadName"),
        hint: game.i18n.localize("SWIM.docReadHint"),
        type: Boolean,
        default: false,
        scope: 'world',
        config: true,
    });
    game.settings.register('swim', 'allowUserConfig', {
        name: game.i18n.localize("SWIM.allowUserConfigName"),
        hint: game.i18n.localize("SWIM.allowUserConfigHint"),
        type: Boolean,
        default: true,
        scope: 'world',
        config: true,
    });
    game.settings.register('swim', 'br2Message', {
        name: "br2MessageName",
        hint: "br2MessageHint",
        type: Boolean,
        default: false,
        scope: 'world',
        config: false,
    });
    game.settings.register('swim', 'v1MigrationDone', {
        name: "v1MigrationName",
        hint: "v1MigrationHint",
        type: Boolean,
        default: false,
        scope: 'world',
        config: false,
    });
    game.settings.registerMenu('swim', 'custom-config', {
        name: game.i18n.localize("SWIM.ConfigMenuName"),
        label: game.i18n.localize("SWIM.ConfigMenuLabel"),
        icon: 'fas fa-swimmer',
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
        options.width = SWIM.CONFIG_WINDOW_WIDTH;
        options.height = SWIM.CONFIG_WINDOW_HEIGHT;
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
                 is_boolean: setting.config_type === Boolean,
                 is_numeric: setting.config_type === Number,
                 options: setting.options ? setting.options : "",
                 min: setting.min,
                 max: setting.max,
                 step: setting.step,
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
