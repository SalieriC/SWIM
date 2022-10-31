export default class SWIMEffectConfig extends ActiveEffectConfig {

    constructor(object, options, callback) {
        super(object, options);
        this.callback = callback;
    }

    async _updateObject(event, formData) {
        await super._updateObject(event, formData);
        this.callback(this.object);
    }
}