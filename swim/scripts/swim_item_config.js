import * as SWIM from "./constants.js";

export async function open_swim_item_config(item) {
    new ItemConfigForm(item).render(true);
}

export async function open_swim_actor_config(actor) {
    ui.notifications.warn("We do not support actors yet.");
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

    activateListeners(html) {
        super.activateListeners(html);
        html = html[0];

        html.querySelectorAll("[data-action]").forEach(button => {
            button.addEventListener("click", this._onButtonClick.bind(this));
        });
    }

    getData() {
        if (this.object.type === 'gear') {
            return {
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
            };
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
        const oldValue = event.currentTarget.dataset.value;

        if (typeof oldValue === 'string' && oldValue.trim().length > 0) {
            defaults = JSON.parse(oldValue);
        } else {
            defaults = {
                label: 'Ammo Effect',
                icon: '/icons/svg/mystery-man-black.svg'
            }
        }

        const effect = await CONFIG.ActiveEffect.documentClass.create(defaults, {
            renderSheet: true,
            parent: this.object
        });
        console.log(effect);

        const effectString = JSON.stringify(effect);
    }

    async _updateObject(_, formData) {
        //Add flags updating here

        this.render(true);
    }
}