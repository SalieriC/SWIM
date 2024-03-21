/*******************************************
 * Token Vision macro for SWADE
 * Created by SalieriC#8263
 * version 5.2.1
 * Inspired by @Sky#9453:
 * https://github.com/Sky-Captain-13/foundry
 ******************************************/
export async function token_vision_script(condition = false) {
    const { speaker, _, __, token } = await swim.get_macro_variables()

    if (!token || canvas.tokens.controlled.length > 1) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"))
        return
    }
    const actor = token.actor
    const scene = token.scene
    let currentColour = token.document.light.color
    let sceneDarkness = token.scene.darkness
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
        <option value="nochange"}>${game.i18n.localize("SWIM.noChange")}</option>    
        <option value="none" ${selectFull}>${game.i18n.localize("SWIM.illuminationType-full")}</option>
        <option value="dim" ${selectDim}>${game.i18n.localize("SWIM.illuminationType-dim")}</option>
        <option value="dark" ${selectDark}>${game.i18n.localize("SWIM.illuminationType-dark")}</option>
        <option value="pitch" ${selectPitch}>${game.i18n.localize("SWIM.illuminationType-pitchDarkness")}</option>
    `

    const lowLightVision = actor.items.find(a => a.type === "ability" && a.name === game.i18n.localize("SWIM.ability-lowLightVision"))
    const infravision = actor.items.find(a => a.type === "ability" && a.name === game.i18n.localize("SWIM.ability-infravision"))
    const darkvision = actor.items.find(a => a.type === "ability" && a.name === game.i18n.localize("SWIM.ability-darkvision-swpf"))
    let visionTypes = `
        <option value="nochange">${game.i18n.localize("SWIM.noChange")}</option>    
        <option value="none">${game.i18n.localize("SWIM.none")}</option>
    `
    if (lowLightVision) { visionTypes += `<option value="lowLiVis" selected>${game.i18n.localize("SWIM.ability-lowLightVision")}</option>` }
    if (infravision) { visionTypes += `<option value="infraVis" selected>${game.i18n.localize("SWIM.ability-infravision")}</option>` }
    if (darkvision) { visionTypes += `<option value="darkVis" selected>${game.i18n.localize("SWIM.ability-darkvision-swpf")}</option>` }
    visionTypes += `<option value="niViDi">${game.i18n.localize("SWIM.tokenVision-nightVisionDevice")}</option>`

    let dialogue_content = `
        <form>
        <dt>
          <div class="form-group">
            <label>${game.i18n.localize("SWIM.tokenVision-lightSource")}:</label>
            <select id="light-source" name="light-source">
              <option value="nochange">${game.i18n.localize("SWIM.noChange")}</option>
              <option value="none">${game.i18n.localize("SWIM.none")}</option>
              <option value="candle">${game.i18n.localize("SWIM.tokenVision-candle")}</option>
              <option value="lantern">${game.i18n.localize("SWIM.tokenVision-lantern")}</option>
              <option value="bullseye">${game.i18n.localize("SWIM.tokenVision-lanternBullseye")}</option>
              <option value="torch">${game.i18n.localize("SWIM.tokenVision-torch")}</option>
              <option value="flLight">${game.i18n.localize("SWIM.tokenVision-flashlight")}</option>
            </select>
          </div>
          <dd>
          <div class="form-group">
            <label>${game.i18n.localize("SWIM.tokenVision-lightColourPresets")}:</label>
            <select id="colour-presets" name="colour-presets">
              <option value="picker">${game.i18n.localize("SWIM.tokenVision-currentCustom")}</option>
              <option value="candle">${game.i18n.localize("SWIM.tokenVision-candleColour")}</option>
              <option value="fire">${game.i18n.localize("SWIM.tokenVision-fireTorchColour")}</option>
              <option value="magnesium">${game.i18n.localize("SWIM.tokenVision-magnesiumTorchColour")}</option>
              <option value="white">${game.i18n.localize("SWIM.tokenVision-whiteFlashlightComlour")}</option>
            </select>
          </div>
          </dd><dd>
          <div class="form-group">
            <label>${game.i18n.localize("SWIM.tokenVision-customColour")}:</label>
            <input type="color" id="colour-choice" value="${currentColour}" style="width:50%;" align="right">
          </div>
          </dd></dt><dt>
          <div class="form-group">
            <label>${game.i18n.localize("SWIM.illumination")}:</label>
            <select id="illumination-type" name="illumination-type">
              ${illuminationTypes}
            </select>
          </div>
          </dt><dt>
          <div class="form-group">
            <label>${game.i18n.localize("SWIM.tokenVision-visionType")}:</label>
            <select id="vision-type" name="vision-type">
              ${visionTypes}
            </select>
          </div>
          </dt>
        </form>
        `
    
    let dialogueButtons = {
        yes: {
            //icon: "<i class='fas fa-check'></i>",
            label: game.i18n.localize("SWIM.dialogue-accept"),
            callback: (html) => {
                changeVision(token, html, condition);
            }
        },
        no: {
            //icon: "<i class='fas fa-times'></i>",
            label: game.i18n.localize("SWIM.dialogue-cancel")
        }
    }

    // Main Dialogue    
    new Dialog({
        title: game.i18n.localize("SWIM.tokenVision-title"),
        content: dialogue_content,
        buttons: dialogueButtons,
        default: "yes",
    }).render(true);
}

async function changeVision(token, html, condition) {
    const tokenD = token.document
    let sfx
    let lightSource = html.find('[name="light-source"]')[0].value
    let visionType = html.find('[name="vision-type"]')[0].value
    let illuminationType = html.find('[name="illumination-type"]')[0].value
    let visionRange = 0
    let enableSight = visionType === "noChange" ? token.sight.enabled : true
    let visionRangeCurr = tokenD.sight.range
    let visionAngle = tokenD.sight.angle
    let visionMode = tokenD.sight.visionMode
    let lightRadiusDim = tokenD.light.dim
    let lightRadiusBright = tokenD.light.bright
    let lightAngle = tokenD.light.angle
    let presetChoice = html.find('[id="colour-presets"]')[0].value;
    let colourChoice = tokenD.light.color ? "#ffffff" : tokenD.light.color
        if (presetChoice === "picker") { colourChoice = html.find('[id="colour-choice"]')[0].value; }
        else if (presetChoice === "candle") { colourChoice = "#fffcbb" }
        else if (presetChoice === "fire") { colourChoice = "#f8c377" }
        else if (presetChoice === "magnesium") { colourChoice = "#e52424" }
        else if (presetChoice === "white") { colourChoice = "#FFFFFF" }
    let lightColour = tokenD.light.color
    let detectionModes = [
        {
            id: "basicSight",
            enabled: false,
            range: 0
        },
        {
            id: "seeHeat",
            enabled: false,
            range: 0
        }
    ]
    let activeLight = false
        if (tokenD.light.bright >= 1 || tokenD.light.dim >= 1) { activeLight = true }

    if (lightSource === "none") {
        lightRadiusDim = 0
        lightRadiusBright = 0
        activeLight = false
        sfx = game.settings.get("swim", "lightSFX")
    } else if (lightSource === "candle") {
        lightRadiusDim = 0
        lightRadiusBright = 2
        lightAngle = 360
        lightColour = colourChoice
        activeLight = true
        sfx = game.settings.get("swim", "lightSFX")
    } else if (lightSource === "lantern" || lightSource === "torch") {
        lightRadiusDim = 0
        lightRadiusBright = 4
        lightAngle = 360
        lightColour = colourChoice
        activeLight = true
        sfx = game.settings.get("swim", "lightSFX")
    } else if (lightSource === "bullseye") {
        lightRadiusDim = 0
        lightRadiusBright = 4
        lightAngle = 52.5
        lightColour = colourChoice
        activeLight = true
        sfx = game.settings.get("swim", "lightSFX")
    } else if (lightSource === "flLight") {
        lightRadiusDim = 0
        lightRadiusBright = 10
        lightAngle = 52.5
        lightColour = colourChoice
        activeLight = true
        sfx = game.settings.get("swim", "lightSFX")
    }

    if (illuminationType === "none") {
        visionRange = 1000
        visionAngle = 360
        detectionModes[0].range = 1000
        detectionModes[0].enabled = true
    } else if (illuminationType === "dim") {
        visionRange = 25
        visionAngle = 360
        detectionModes[0].range = 25
        detectionModes[0].enabled = true
    } else if (illuminationType === "dark") {
        visionRange = 10
        visionAngle = 360
        detectionModes[0].range = 10
        detectionModes[0].enabled = true
    } else if (illuminationType === "pitch") {
        visionRange = 0
        visionAngle = 360
        detectionModes[0].range = 0
        detectionModes[0].enabled = true
    }

    if (visionType === "none" || (visionType === "lowLiVis" && illuminationType === "pitch")) {
        if (visionMode === "lightAmplification") { sfx = "modules/swim/assets/sfx/night_vision_device-off.ogg" }
        visionMode = "basic"
        detectionModes[0].range = detectionModes[0].range >= 1 ? detectionModes[0].range : 1
        detectionModes[0].enabled = true
    } else if (visionType === "lowLiVis") {
        if (visionMode === "lightAmplification") { sfx = "modules/swim/assets/sfx/night_vision_device-off.ogg" }
        visionMode = "darkvision"
        visionRange = visionRange >= 25 ? visionRange : 25
        visionAngle = 360
        detectionModes[0].range = detectionModes[0].range >= 25 ? detectionModes[0].range : 25
        detectionModes[0].enabled = true
    } else if (visionType === "infraVis") {
        if (visionMode === "lightAmplification") { sfx = "modules/swim/assets/sfx/night_vision_device-off.ogg" }
        visionRange = 25
        visionRange = visionRange >= 0 ? visionRange : 0
        visionAngle = 360
        visionMode = "infraVision"
        detectionModes[0].range = 0
        detectionModes[0].enabled = false
        detectionModes[1].range = 25
        detectionModes[1].enabled = true
    } else if (visionType === "darkVis") {
        if (visionMode === "lightAmplification") { sfx = "modules/swim/assets/sfx/night_vision_device-off.ogg" }
        visionMode = "darkvision"
        visionRange = visionRange >= 10 ? visionRange : 10
        visionAngle = 360
        detectionModes[0].range = detectionModes[0].range >= 10 ? detectionModes[0].range : 10
        detectionModes[0].enabled = true
    } else if (visionType === "niViDi") {
        if (visionMode != "lightAmplification") { sfx = "modules/swim/assets/sfx/night_vision_device-on.ogg" }
        visionMode = "lightAmplification"
        visionRange = visionRange >= 25 ? visionRange : 25
        visionAngle = 360
        detectionModes[0].range = detectionModes[0].range >= 25 ? detectionModes[0].range : 25
        detectionModes[0].enabled = true
    }

    if (illuminationType === "nochange" && visionType === "nochange") {
        visionRange = tokenD.sight.range
    }

    let updates = {
        detectionModes: detectionModes,
        light: {
            angle: lightAngle,
            bright: lightRadiusBright,
            color: lightColour,
            dim: lightRadiusDim
        },
        sight: {
            angle: visionAngle,
            range: visionRange,
            visionMode: visionMode,
            enabled: enableSight
        }
    }
    await tokenD.update(updates)

    if (sfx) {
        const volume = game.settings.get("swim", "defaultVolume")
        await swim.play_sfx(sfx, volume)
    }

    if (!condition) {
        if (activeLight === false) {
            let ae = await game.succ.getConditionFrom('torch', tokenD)
            if (ae) { await ae.setFlag('swim', 'deactivatedFromMacro', true) }//set flags to prevent duplicate message in init.js
            await game.succ.removeCondition('torch', tokenD);
        } else {
            await game.succ.addCondition('torch', tokenD, {forceOverlay: false, effectOptions: {swim: {activatedFromMacro: true}}});//pass additional data to prevent duplicate message in init.js
        }
    }
}