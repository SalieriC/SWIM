/**
 * The Active Effect sheet with a callback, used to edit an "in-memory" effect (the ammo effect in the SWIM document config).
 * Foundry v14: the sheet is an ApplicationV2 (`DocumentSheetV2`); the callback is called after the form was saved.
 */
export default class SWIMEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {

    /**
     * @param {ActiveEffect} object The effect to edit.
     * @param {object} [options] Application options.
     * @param {Function} [callback] Called with the effect after it was saved.
     */
    constructor(object, options = {}, callback = () => { }) {
        super({ ...options, document: object })
        this.callback = callback
    }

    async _processSubmitData(event, form, submitData, options) {
        await super._processSubmitData(event, form, submitData, options)
        await this.callback(this.document)
    }
}
