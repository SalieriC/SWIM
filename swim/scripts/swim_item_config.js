
export async function open_swim_item_config(itemOrActor) {
    if(itemOrActor instanceof SwadeActor) {
        ui.notifications.warning("We do not support actors yet.");
        return;
    }

    new ItemConfigForm(itemOrActor).render();
}

class ItemConfigForm extends FormApplication {
    constructor(myObject) {
        super(myObject, { title: myObject.name });
        // The rest of the constructor
    }

    static get defaultOptions() {
        let options = super.defaultOptions;
        options.id = 'swim-item-config';
        options.template = "/modules/swim/templates/swim_item_config.hbs";
        options.width = SWIM.CONFIG_WINDOW_WIDTH;
        options.height = SWIM.CONFIG_WINDOW_HEIGHT;
        return options;
    }

    activateListeners(html) {
        return super.activateListeners(html);
    }

    getData() {
        if(this.object.type === 'gear') {
            return {item: this.object};
        }
        return {};
    }

    async _updateObject(_, formData) {
        //Add flags updating here

        this.render();
    }
}