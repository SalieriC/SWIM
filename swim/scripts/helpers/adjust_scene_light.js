export async function adjust_scene_light() {
    const scene = game.scenes.current
    let sceneDarkness = scene.darkness
    let selectFull = ""
    let selectDim = ""
    let selectDark = ""
    let selectPitch = ""
    if (scene.flags?.swim?.config?.illuminationLevel) {
        if (scene.flags?.swim?.config?.illuminationLevel === "none") { sceneDarkness = 0 }
        else if (scene.flags?.swim?.config?.illuminationLevel === "dim") { sceneDarkness = 0.5 }
        else if (scene.flags?.swim?.config?.illuminationLevel === "dark") { sceneDarkness = 0.75 }
        else if (scene.flags?.swim?.config?.illuminationLevel === "pitch") { sceneDarkness = 1 }
    }
    if (sceneDarkness <= 0.1) { selectFull = "selected" }
    else if (sceneDarkness <= 0.5) { selectDim = "selected" }
    else if (sceneDarkness <= 0.75) { selectDark = "selected" }
    else if (sceneDarkness <= 1) { selectPitch = "selected" }

    const illuminationTypes = `
        <option value="none" ${selectFull}>${game.i18n.localize("SWIM.illuminationType-full")}</option>
        <option value="dim" ${selectDim}>${game.i18n.localize("SWIM.illuminationType-dim")}</option>
        <option value="dark" ${selectDark}>${game.i18n.localize("SWIM.illuminationType-dark")}</option>
        <option value="pitch" ${selectPitch}>${game.i18n.localize("SWIM.illuminationType-pitchDarkness")}</option>
    `

    let dialogue_content = `
        <p>${game.i18n.localize("SWIM.sceneIlluminationHint")}</p>
        <div class="form-group">
            <label>${game.i18n.localize("SWIM.illumination")}: </label>
            <select id="illumination-type" name="illumination-type">
              ${illuminationTypes}
            </select>
          </div>
    `
    
    let dialogueButtons = {
        yes: {
            label: game.i18n.localize("SWIM.dialogue-accept"),
            callback: async (html) => {
                let illuminationType = html.find('[name="illumination-type"]')[0].value
                const updateData = {
                    flags: {
                      swim: {
                        config: {
                            illuminationLevel: illuminationType
                        }
                      }
                    }
                  }
                await scene.update(updateData)
                ui.notifications.notify(game.i18n.format("SWIM.sceneIlluminationNotification"))
                console.log("SWIM | Flags set on scene.", scene)
            }
        },
        no: {
            label: game.i18n.localize("SWIM.dialogue-cancel")
        }
    }

    // Main Dialogue    
    new Dialog({
        title: game.i18n.localize("SWIM.sceneIlluminationName"),
        content: dialogue_content,
        buttons: dialogueButtons,
        default: "yes",
    }).render(true);
}