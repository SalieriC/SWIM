import * as SWIM from "./constants.js";
import SWIMEffectConfig from "./helpers/custom_effect_config.js";

export async function open_swim_item_config(item) {
    new DocumentConfigForm(item).render(true);
}

export async function open_swim_actor_config(actor) {
    new DocumentConfigForm(actor).render(true);
}

/*
This object works as follows:

configs = {
    type: { options: {...} }
}

type is the type of actor or item. So if you want to add configs for weapons and npc, you would do it like this:

configs = {
    weapon: { options: {...} },
    npc: { options: {...} }
}

the options map contains sections to show in the config window. each section has an arbitrary key and an object that describes
what the section is about. Right now we have the following possibilities (pick one):

- isSectionTitle: if true shows a subheader to differentiate different sections of the config UI.
    - value: text for the subheader
- isBoolean: if true will show a checkbox.
    - id: the name under which to store this config in the flags
    - label: the text to render next to the checkbox
    - value: the default value of the checkbox
- isText: if true will show a textfield.
    - id: the name under which to store this config in the flags
    - label: the text to render next to the textfield
    - value: the default value of the textfield
- isAE: if true will show a button to edit an in-memory ActiveEffect
    - id: the name under which to store this config in the flags
    - label: the text to render on the button
    - value: the default value of the AE

 */
const configs = {
    gear: {
        options: {
            /*ammoTitle: {
                isSectionTitle: true,
                value: "Ammo Management"
            },
            isAmmo: {
                isBoolean: true,
                id: 'isAmmo',
                label: 'Is Ammunition',
                value: false
            },
            ammoAE: {
                isAE: true,
                label: 'Set Ammo Active Effect',
                id: 'ammoActiveEffect',
                value: {}
            }*/
        }
    }
}

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

    constructor(object) {
        super(object);
        this.ammoEffects = {}
    }

    activateListeners(html) {
        super.activateListeners(html);
        html = html[0];

        html.querySelectorAll("[data-action]").forEach(button => {
            button.addEventListener("click", this._onButtonClick.bind(this));
        });
    }

    getData() {
        const config = configs[this.object.type];
        if (config !== undefined) {
            //load and merge flags here
            if ('swim' in this.object.flags && 'config' in this.object.flags.swim) {
                const flagsConfig = this.object.flags.swim.config;
                for (const [_, value] of Object.entries(config.options)) {
                    if (value.id in flagsConfig) {
                        const val = flagsConfig[value.id];
                        if (val !== null && val !== undefined) {
                            value.value = val;
                        }
                    }
                }
            }
            return config;
        }
        return {};
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

        if ('swim' in this.object.flags && 'config' in this.object.flags.swim && id in this.object.flags.swim.config) {
            defaults = this.object.flags.swim.config[id];
        } else {
            defaults = {
                label: `Ammo Effect (${this.object.name})`,
                icon: this.object.data.img
            }
        }

        const effect = await CONFIG.ActiveEffect.documentClass.create(defaults, {
            rendersheet: false,
            parent: this.object
        });

        await new SWIMEffectConfig(effect, {}, (e) => {
            const effect = e.toObject();
            this.ammoEffects[id] = effect;
        }).render(true);
    }

    async _onSubmit(event, {updateData = null, preventClose = false, preventRender = false} = {}) {
        let data = updateData;
        for (const [key, value] of Object.entries(this.ammoEffects)) {
            data = {
                ...data, ...{[key]: value}
            };
            this.object.deleteEmbeddedDocuments("ActiveEffect", [value._id]);
        }
        await super._onSubmit(event, {updateData: data, preventClose: preventClose, preventRender: preventRender});
    }

    async _updateObject(_, formData) {
        //Add flags updating here
        console.log(formData);
        const Data = {
            flags: {
                swim: {
                    config: formData
                }
            }
        };

        try {
            this.object.update(Data);
            console.log(`Flags set on ${this.object.name}.`, this.object);
        } catch (err) {
            console.log(err)
        }
    }
}