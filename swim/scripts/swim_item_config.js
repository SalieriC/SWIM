import * as SWIM from "./constants.js";
import SWIMEffectConfig from "./helpers/custom_effect_config.js";

export async function open_swim_item_config(item) {
    new ItemConfigForm(item).render(true);
}

export async function open_swim_actor_config(actor) {
    ui.notifications.warn("We do not support actors yet.");
}

//Add more actor or item types here
const configs = {
    gear: {
        options: {
            ammo_title: {
                isSectionTitle: true,
                value: "Ammo Management"
            },
            isAmmo: {
                isBoolean: true,
                id: 'is-ammo',
                label: 'Is Ammunition',
                value: false
            },
            ammoAE: {
                isAE: true,
                label: 'Set Ammo Active Effect',
                id: 'ammo-active-effect',
                value: ''
            }
        }
    }
}

class ItemConfigForm extends FormApplication {

    static get defaultOptions() {
        let options = super.defaultOptions;
        options.id = 'swim-item-config';
        options.title = "SWIM Config"
        options.template = "/modules/swim/templates/swim_item_config.hbs";
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
            if ('swim-item-config' in this.object.flags) {
                for (const [key, value] of Object.entries(config.options)) {
                    if (value.id in this.object.flags['swim-item-config']) {
                        const val = this.object.flags['swim-item-config'][value.id];
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

        if ('swim-item-config' in this.object.flags && id in this.object.flags['swim-item-config']) {
            defaults = this.object.flags['swim-item-config'][id];
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
                ["swim-item-config"]: formData
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