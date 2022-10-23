import * as SWIM from "./constants.js";
import SWIMEffectConfig from "./helpers/custom_effect_config.js";

export async function open_swim_item_config(item) {
    let actor = false
    await swim.run_migration(actor, item)
    new DocumentConfigForm(item).render(true);
}

export async function open_swim_actor_config(actor) {
    let item = false
    await swim.run_migration(actor, item)
    new DocumentConfigForm(actor).render(true);
}

/*
This object works as follows:

configs = [
     {
        showFor: ['type0', 'type1']
        id: 'asd,
        label: 'asd',
        hint: 'asd',
        value: ''
    },
    {...}
]

The map contains sections and form elements to show in the config window. Each section is an object that describes what the section is about.
Right now we have the following possibilities (pick one):

- isSectionTitle: if true shows a subheader to differentiate different sections of the config UI.
    - showFor: Array of item/actor types to show this element for. Omit entire property to always show.
    - label: text for the subheader
- isBoolean: if true will show a checkbox.
    - showFor: Array of item/actor types to show this element for. Omit entire property to always show.
    - id: the name under which to store this config in the flags
    - label: the loca key for the label
    - hint: the loca key for the hint
    - value: the default value of the checkbox
- isText: if true will show a textfield.
    - showFor: Array of item/actor types to show this element for. Omit entire property to always show.
    - id: the name under which to store this config in the flags
    - label: the loca key for the label
    - hint: the loca key for the hint
    - value: the default value of the textfield
    - useFilePicker: Set to true if you want a file picker for this text field (optional)
    - filePickerData: The datatype of this file picker (can be: "folder", "font", "text", "graphics", "image", "audio", "video", "imagevideo" or empty) (optional)
- isAE: if true will show a button to edit an in-memory ActiveEffect
    - showFor: Array of item/actor types to show this element for. Omit entire property to always show.
    - id: the name under which to store this config in the flags
    - label: the loca key for the label
    - hint: the loca key for the hint
    - value: the default value of the AE (in JSON)
- isNumber: if true will show a number spinner
    - showFor: Array of item/actor types to show this element for. Omit entire property to always show.
    - id: the name under which to store this config in the flags
    - label: the loca key for the label
    - hint: the loca key for the hint
    - value: the default value of the number field
    - min: the minimum value of the number field
    - max: the maximum value of the number field

 */
function swim_config_options() {
    const configs = [
        {
            isSectionTitle: true,
            showFor: ['weapon'],
            label: "SWIM.Config_WeaponConfig"
        },
        {
            isText: true,
            showFor: ['weapon'],
            id: 'loadedAmmo',
            label: 'SWIM.Config_LoadedAmmoName',
            hint: 'SWIM.Config_LoadedAmmoHint',
            value: ""
        },
        {
            isBoolean: true,
            showFor: ['weapon'],
            id: 'isSilenced',
            label: 'SWIM.Config_IsSilencedName',
            hint: 'SWIM.Config_IsSilencedHint',
            value: false
        },
        {
            isBoolean: true,
            showFor: ['weapon'],
            id: 'isConsumable',
            label: 'SWIM.Config_IsConsumableName',
            hint: 'SWIM.Config_IsConsumableHint',
            value: false
        },
        {
            isSectionTitle: true,
            showFor: ['gear'],
            label: "SWIM.Config_AmmoConfig"
        },
        {
            isBoolean: true,
            showFor: ['gear'],
            id: 'isPack',
            label: 'SWIM.Config_IsPackName',
            hint: 'SWIM.Config_IsPackHint',
            value: false
        },
        {
            isAE: true,
            showFor: ['gear'],
            id: 'ammoActiveEffect',
            label: 'SWIM.Config_SetAmmoActiveEffectName',
            hint: 'SWIM.Config_SetAmmoActiveEffectHint',
            value: ''
        },
        {
            isSectionTitle: true,
            showFor: ['character', 'npc'],
            label: "SWIM.Config_GeneralActorConfig"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "pronoun",
            label: "SWIM.Config_PronounName",
            hint: "SWIM.Config_PronounHint",
            value: ""
        },
    ]

    if (game.settings.get("swim", "irradiationSetting")) {
        configs.push({
            isNumber: true,
            showFor: ['character', 'npc'],
            id: 'radRes',
            label: 'SWIM.Config_RadResName',
            hint: 'SWIM.Config_RadResHint',
            value: 0,
        })
    }

    configs.push(
        //SFX shown at the bottom(?):
        //Actor SFX:
        {
            isSectionTitle: true,
            showFor: ['weapon', 'character', 'npc'],
            label: "SWIM.Config_SFX"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "shakenSFX",
            label: "SWIM.Config_ShakenSFXName",
            hint: "SWIM.Config_ShakenSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "deathSFX",
            label: "SWIM.Config_IncapSFXName",
            hint: "SWIM.Config_IncapSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "unshakeSFX",
            label: "SWIM.Config_UnshakeSFXName",
            hint: "SWIM.Config_UnshakeSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "stunnedSFX",
            label: "SWIM.Config_StunnedSFXName",
            hint: "SWIM.Config_StunnedSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "soakSFX",
            label: "SWIM.Config_SoakSFXName",
            hint: "SWIM.Config_SoakSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "fatiguedSFX",
            label: "SWIM.Config_FatiguedSFXName",
            hint: "SWIM.Config_FatiguedSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "looseFatigueSFX",
            label: "SWIM.Config_LooseFatigueSFXName",
            hint: "SWIM.Config_LooseFatigueSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        //Weapon SFX:
        {
            isText: true,
            showFor: ['weapon'],
            id: "reloadSFX",
            label: "SWIM.Config_ReloadSFXName",
            hint: "SWIM.Config_ReloadSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['weapon'],
            id: "fireSFX",
            label: "SWIM.Config_FireSFXName",
            hint: "SWIM.Config_FireSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['weapon'],
            id: "autoFireSFX",
            label: "SWIM.Config_AutoFireSFXName",
            hint: "SWIM.Config_AutoFireSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['weapon'],
            id: "silencedFireSFX",
            label: "SWIM.Config_SilencedFireSFXName",
            hint: "SWIM.Config_SilencedFireSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['weapon'],
            id: "silencedAutoFireSFX",
            label: "SWIM.Config_SilencedAutoFireSFXName",
            hint: "SWIM.Config_SilencedAutoFireSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['weapon'],
            id: "emptySFX",
            label: "SWIM.Config_EmptySFXName",
            hint: "SWIM.Config_EmptySFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
    )
    return configs
}

const swimConfigVersion = SWIM.CONFIG_VERSION

class DocumentConfigForm extends FormApplication {

    static get defaultOptions() {
        let options = super.defaultOptions;
        options.id = 'swim-document-config';
        options.title = "SWIM Config"
        options.template = "/modules/swim/templates/swim_document_config.hbs";
        options.width = SWIM.ITEM_CONFIG_WINDOW_WIDTH;
        options.height = SWIM.ITEM_CONFIG_WINDOW_HEIGHT;
        return options;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html = html[0];

        html.querySelectorAll("[data-action]").forEach(button => {
            button.addEventListener("click", this._onButtonClick.bind(this));
        });
    }

    getData() {
        const configs = swim_config_options()
        const type = this.object.type;
        let data = [];

        for (const c of configs) {
            //load and merge flags here
            if ('showFor' in c && !c.showFor.includes(type))
                continue;

            if ('swim' in this.object.flags && 'config' in this.object.flags.swim) {
                const flagsConfig = this.object.flags.swim.config;

                if (c.id in flagsConfig) {
                    const val = flagsConfig[c.id];
                    if (val !== null && val !== undefined) {
                        c.value = val;
                    }
                }
            }

            data.push(c);
        }

        return { options: data };
    }

    async _onButtonClick(event) {
        event.preventDefault();
        const action = event.currentTarget.dataset.action;
        if (this[action])
            await this[action](event);
    }

    async _setActiveEffect(event) {
        let defaults;
        const id = event.currentTarget.dataset.id;
        const oldVal = this.form.elements[id].value;

        if (typeof oldVal === 'string' && oldVal.length === 0) {
            defaults = {
                label: `Ammo Effect (${this.object.name})`,
                icon: this.object.data.img
            }
        } else {
            defaults = JSON.parse(oldVal);
        }

        const effect = await CONFIG.ActiveEffect.documentClass.create(defaults, {
            rendersheet: false,
            parent: this.object
        });
        //Set a flag to mark effects to be deleted later.
        await effect.setFlag('swim', 'ammoAeTempEff', true)

        await new SWIMEffectConfig(effect, {}, async (e) => {
            const effect = e.toObject();
            this.form.elements[id].value = JSON.stringify(effect);
        }).render(true);
        
    }

    async _removeActiveEffect(event) {
        const id = event.currentTarget.dataset.id;
        this.form.elements[id].value = '';
    }

    async _updateObject(_, formData) {
        //Merge in version
        formData = { ...{ _version: swimConfigVersion }, ...formData };

        const Data = {
            flags: {
                swim: {
                    config: formData
                }
            }
        };

        try {
            this.object.update(Data);
            // Fallback that deletes all AEs that are marked as temporary:
            for (let eff of this.object.effects) {
                if (eff.flags?.swim?.ammoAeTempEff === true) { await eff.delete() }
            }
            console.log(`Flags set on ${this.object.name}.`, this.object);
        } catch (err) {
            console.log(err)
        }
    }
}