/**
 * Token effects: Foundry v14 lets an Active Effect change the token of its actor directly, a change whose key starts with `token.`
 * (allowed roots: name, width, height, depth, shape, texture, alpha, disposition, light, sight, detectionModes, ring, turnMarker,
 * movementAction, flags). This replaces the module Active Token Effects (ATL) that SWIM used before (its keys were `ATL.light.*`).
 * Values are real numbers/booleans/strings (the change value is not a string any more), object fields are changed per leaf
 * (`token.light.animation.type`, ...).
 */
import { change } from "./effect_data.js"

/** One `token.*` change, by default an override. */
export const token_change = (path, value, type = 'override') => change(`token.${path}`, type, value)

/**
 * Changes of a light source. `cfg` = SWIM's light configuration (bright, dim, angle, color, ... animType, animSpeed, animIntensity, animReverse).
 * `full` writes every light field (custom light), otherwise only radius, angle and colour (presets).
 */
export function light_changes(cfg, full) {
    const ch = (key, value) => token_change(`light.${key}`, value)
    const out = [ch('bright', cfg.bright), ch('dim', cfg.dim), ch('angle', cfg.angle), ch('color', cfg.color)]
    if (full) {
        out.push(ch('alpha', cfg.alpha), ch('coloration', cfg.coloration), ch('luminosity', cfg.luminosity), ch('attenuation', cfg.attenuation),
            ch('saturation', cfg.saturation), ch('contrast', cfg.contrast), ch('shadows', cfg.shadows),
            ch('darkness.min', cfg.darkMin), ch('darkness.max', cfg.darkMax))
    }
    if (cfg.animType) {
        out.push(ch('animation.type', cfg.animType), ch('animation.speed', cfg.animSpeed), ch('animation.intensity', cfg.animIntensity), ch('animation.reverse', !!cfg.animReverse))
    }
    return out
}

/** The Light power: bright 3 (raise: beam, 5), a yellow sunburst. */
export function light_power_changes(raise) {
    return [
        token_change('light.bright', raise ? 5 : 3),
        token_change('light.animation.type', 'sunburst'),
        token_change('light.animation.speed', 1),
        token_change('light.animation.intensity', 1),
        token_change('light.color', '#fffa61'),
        token_change('light.alpha', 0.25),
        token_change('light.angle', raise ? 52.5 : 360),
    ]
}

/** The Darksight power: sees in the dark (darkvision) without range limit. */
export function darksight_changes() {
    return [token_change('sight.range', 1000, 'add'), token_change('sight.visionMode', 'darkvision')]
}
