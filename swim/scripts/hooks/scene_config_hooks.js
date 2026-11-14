import { LEVELS } from "../helpers/adjust_scene_light.js"
import { esc, t } from "../helpers/swim_window.js"

const FIELD = "flags.swim.config.illuminationLevel"

/**
 * SWIM section in the Lighting tab of the scene configuration: the Scene Illumination level (the same flag the Scene Illumination button sets),
 * so it is not forgotten when a scene is set up. The radio buttons are part of the form, Foundry saves them with the rest of the scene.
 * "Not set" removes the flag again (the Token Vision then follows the scene's Darkness Level).
 */
export function scene_config_hooks() {
    Hooks.on("renderSceneConfig", (app, html) => {
        if (!game.user.isGM) { return }
        const tab = html.find('.tab[data-tab="lighting"]')
        if (!tab.length || tab.find(".swim-sc-illum").length) { return }
        const scene = app.document ?? app.object
        const stored = scene?.flags?.swim?.config?.illuminationLevel
        const current = LEVELS.some(([id]) => id === stored) ? stored : ""
        const options = [["", "SWIM.sceneConfig.notSet"], ...LEVELS]
        const opts = options.map(([id, key]) => `<label class="${id === current ? "is-on" : ""}"><input type="radio" name="${FIELD}" value="${id}" ${id === current ? "checked" : ""}>${esc(t(key))}</label>`).join("")
        const section = $(`<fieldset class="swim-sc-illum">
            <legend><span class="swim-sc-badge">SWIM</span>${esc(t("SWIM.sceneConfig.title"))}</legend>
            <div class="swim-sc-opts">${opts}</div>
            <p class="swim-sc-note">${esc(t("SWIM.sceneConfig.hint"))}</p></fieldset>`)
        section.on("change", "input", () => {
            // braces matter: jQuery's each() stops when the callback returns false
            section.find("label").each((_, l) => { l.classList.toggle("is-on", l.querySelector("input").checked) })
        })
        const anchor = tab.find('[name="darkness"]').closest(".form-group")
        if (anchor.length) { anchor.after(section) } else { tab.prepend(section) }
        app.setPosition({ height: "auto" })
    })

    // "Not set" arrives as an empty string: don't store that, remove the flag instead.
    Hooks.on("preUpdateScene", (scene, changes) => {
        const cfg = foundry.utils.getProperty(changes, "flags.swim.config")
        if (!cfg || cfg.illuminationLevel !== "") { return }
        delete cfg.illuminationLevel
        if (scene.flags?.swim?.config?.illuminationLevel) { cfg["-=illuminationLevel"] = null }
    })
}
