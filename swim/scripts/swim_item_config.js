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
        return super.activateListeners(html);
    }

    getData() {
        return {obj: this.object};
    }

    async _updateObject(_, formData) {
        //Add flags updating here

        this.render();
    }
}