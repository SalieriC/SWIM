import { auto_vision_scene } from "../swim_modules/token_vision.js"

/**
 * Keeps the vision of tokens in line with the SWIM scene illumination (GM side, only the first active GM works).
 * - The illumination flag of a scene changes -> Automatic vision for every token of that scene.
 * - A token is created on a scene that has the flag -> Automatic vision for that token.
 * Light sources are never touched; tokens with vision disabled are skipped.
 */
export function vision_hooks() {
    Hooks.on("updateScene", async (scene, changes) => {
        if (!swim.is_first_gm()) { return }
        if (foundry.utils.getProperty(changes, "flags.swim.config.illuminationLevel") === undefined) { return }
        try { await auto_vision_scene(scene) } catch (err) { console.error("SWIM | Automatic vision for the scene failed", err) }
    })
    Hooks.on("createToken", async (tokenDoc) => {
        if (!swim.is_first_gm()) { return }
        const scene = tokenDoc.parent
        if (!scene?.flags?.swim?.config?.illuminationLevel) { return }
        try { await auto_vision_scene(scene, [tokenDoc]) } catch (err) { console.error("SWIM | Automatic vision for the token failed", err) }
    })
}
