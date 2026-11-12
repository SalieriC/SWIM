/*******************************************
 * Scene Illumination – window (SceneLightApp) instead of a Dialog.
 * Sets `flags.swim.config.illuminationLevel` of the current scene (none | dim | dark | pitch).
 ******************************************/
import { SwimWindow, t, btn, rate_opt } from "./swim_window.js"

const LEVEL_DARKNESS = { none: 0, dim: 0.5, dark: 0.75, pitch: 1 }
const LEVELS = [['none', 'SWIM.illuminationType-full'], ['dim', 'SWIM.illuminationType-dim'], ['dark', 'SWIM.illuminationType-dark'], ['pitch', 'SWIM.illuminationType-pitchDarkness']]

/** The level that is preselected: the stored flag, else derived from the scene's darkness. Pure. */
export function illumination_level(flagLevel, darkness) {
    const d = flagLevel in LEVEL_DARKNESS ? LEVEL_DARKNESS[flagLevel] : darkness
    if (d <= 0.1) { return 'none' }
    if (d <= 0.5) { return 'dim' }
    if (d <= 0.75) { return 'dark' }
    return 'pitch'
}

export async function adjust_scene_light() {
    const scene = game.scenes.current
    if (!scene) { return ui.notifications.error(t("SWIM.notification.generalErrorMsg")) }
    await SwimWindow.show(new SceneLightApp(scene))
}

class SceneLightApp extends SwimWindow {
    #scene

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, { id: 'swim-scene-light', width: 460 })
    }

    get title() { return t('SWIM.sceneIlluminationName') }

    constructor(scene) {
        super()
        this.#scene = scene
        this.state = { level: illumination_level(scene.flags?.swim?.config?.illuminationLevel, scene.darkness) }
    }

    async view() {
        const opts = LEVELS.map(([id, key]) => rate_opt('level', 'value', id, t(key), this.state.level === id)).join('')
        return {
            body: `<div class="swim-hc-result"><p>${t('SWIM.sceneIlluminationHint')}</p></div>
                <div class="swim-hc-lab">${t('SWIM.illumination')}</div><div class="swim-hc-rate">${opts}</div>`,
            foot: `<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('save', t('SWIM.sceneLight.save'), { go: true })}`,
        }
    }

    async onAction(action, el) {
        switch (action) {
            case 'level':
                if (this.state.level === el.dataset.value) { return }
                this.state.level = el.dataset.value
                return this.render(false)
            case 'cancel': return this.close()
            case 'save':
                this.busy = true
                try {
                    await this.#scene.update({ flags: { swim: { config: { illuminationLevel: this.state.level } } } })
                } finally {
                    this.busy = false
                }
                ui.notifications.info(t("SWIM.sceneIlluminationNotification"))
                return this.close()
        }
    }
}
