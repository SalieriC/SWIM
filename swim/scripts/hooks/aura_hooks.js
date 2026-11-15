import SWIMEffectConfig from "../helpers/custom_effect_config.js"
import { DEFAULTS, DISPOSITIONS, aura_config, scenes_of_actor, scenes_of_effect, schedule_auras, set_auras_enabled, state } from "../helpers/auras.js"
import { esc, t } from "../helpers/swim_window.js"

/**
 * Aura hooks (see helpers/auras.js for the rules).
 * - `install_aura_suppression()` (init): an enabled aura source changes nothing on its own owner.
 * - `aura_hooks()` (ready): the first active GM keeps the copies on the other tokens up to date; GM only "Aura" tab in the Active Effect sheet.
 */

const TAB = "swimAura"
const MOVE_KEYS = ["x", "y", "width", "height", "hidden", "disposition", "actorId", "actorLink"]

/**
 * `ActiveEffect#isSuppressed` is "system logic that makes an effect ineligible for application" (Foundry v11, checked lazily when the actor
 * applies its effects, also for transferred item effects). An enabled aura source is suppressed, so it does not change its own owner;
 * the owner gets a copy only if "Also affects the owner" is set. Returns false (and warns) if the getter cannot be found: then the owner
 * is affected by the source as well, everything else still works.
 */
export function install_aura_suppression() {
    const proto = CONFIG.ActiveEffect?.documentClass?.prototype
    if (!proto || Object.prototype.hasOwnProperty.call(proto, "__swimAuraSuppression")) { return false }
    let owner = proto
    let desc
    while (owner && !(desc = Object.getOwnPropertyDescriptor(owner, "isSuppressed"))) { owner = Object.getPrototypeOf(owner) }
    if (!desc?.get) {
        console.warn("SWIM | ActiveEffect#isSuppressed not found: the owner of an aura is affected by the aura effect itself.")
        return false
    }
    Object.defineProperty(proto, "__swimAuraSuppression", { value: true })
    Object.defineProperty(proto, "isSuppressed", {
        configurable: true,
        get() { return desc.get.call(this) || (state.enabled && aura_config(this) !== null) },
    })
    return true
}

/** The form of the Active Effect sheet writes the five aura fields even for effects that are no aura: drop them unless the effect is (or becomes) one. */
export function strip_idle_aura(effect, changes) {
    const incoming = foundry.utils.getProperty(changes, "flags.swim.aura")
    if (!incoming || typeof incoming !== "object") { return false }
    const stored = effect.flags?.swim?.aura
    if (stored || (incoming.enabled ?? false) === true) { return false }
    delete changes.flags.swim.aura
    return true
}

/** Markup of the Aura tab (pure; field names are saved with the form of the sheet). */
export function aura_tab_html(stored = {}) {
    const cfg = { ...DEFAULTS, ...stored }
    const disp = DISPOSITIONS.map((d) => `<option value="${d}" ${cfg.disposition === d ? "selected" : ""}>${esc(t(`SWIM.aura.affects-${d}`))}</option>`).join("")
    const row = (label, hint, input) => `<div class="form-group"><label>${esc(t(label))}</label><div class="form-fields">${input}</div><p class="hint">${esc(t(hint))}</p></div>`
    return {
        nav: `<a class="item" data-tab="${TAB}"><i class="fa-solid fa-bullseye"></i> ${esc(t("SWIM.aura.tab"))}</a>`,
        section: `<section class="tab swim-au" data-tab="${TAB}">
            <p class="swim-au-intro"><span class="swim-au-badge">SWIM</span>${esc(t("SWIM.aura.intro"))}</p>
            ${row("SWIM.aura.enabled", "SWIM.aura.enabledHint", `<input type="checkbox" name="flags.swim.aura.enabled" data-dtype="Boolean" ${cfg.enabled ? "checked" : ""}>`)}
            ${row("SWIM.aura.radius", "SWIM.aura.radiusHint", `<input type="number" name="flags.swim.aura.radius" data-dtype="Number" min="0" step="1" value="${esc(cfg.radius)}">`)}
            ${row("SWIM.aura.affects", "SWIM.aura.affectsHint", `<select name="flags.swim.aura.disposition">${disp}</select>`)}
            ${row("SWIM.aura.self", "SWIM.aura.selfHint", `<input type="checkbox" name="flags.swim.aura.self" data-dtype="Boolean" ${cfg.self ? "checked" : ""}>`)}
            ${row("SWIM.aura.stack", "SWIM.aura.stackHint", `<input type="checkbox" name="flags.swim.aura.stack" data-dtype="Boolean" ${cfg.stack ? "checked" : ""}>`)}
            <p class="swim-au-note">${esc(t("SWIM.aura.note"))}</p></section>`,
    }
}

export function aura_hooks() {
    set_auras_enabled(game.settings.get("swim", "auraEffects"))
    const works = () => state.enabled && swim.is_first_gm()
    const tidy = (scenes) => { for (const s of scenes) { schedule_auras(s) } }

    // --- tokens: moved, resized, hidden, disposition changed, placed, removed ---
    Hooks.on("updateToken", (tokenDoc, changes) => {
        if (!works() || !MOVE_KEYS.some((k) => k in changes)) { return }
        schedule_auras(tokenDoc.parent)
    })
    Hooks.on("createToken", (tokenDoc) => { if (works()) { schedule_auras(tokenDoc.parent) } })
    Hooks.on("deleteToken", (tokenDoc) => { if (works()) { schedule_auras(tokenDoc.parent) } })

    // --- effects: aura sources switched on/off/edited/removed, and conditions that put a source out of action (Incapacitated, Dead). Copies are ignored. ---
    const on_effect = (effect) => { if (works() && !effect.flags?.swim?.auraOf) { tidy(scenes_of_effect(effect)) } }
    Hooks.on("createActiveEffect", on_effect)
    Hooks.on("updateActiveEffect", on_effect)
    Hooks.on("deleteActiveEffect", on_effect)
    // deleting an item does not fire the hooks of its effects
    const on_item = (item) => { if (works() && item.parent?.documentName === "Actor" && item.effects?.some((e) => e.flags?.swim?.aura)) { tidy(scenes_of_actor(item.parent)) } }
    Hooks.on("createItem", on_item)
    Hooks.on("deleteItem", on_item)

    // --- the setting: switching it off removes all copies, switching it on makes them again ---
    Hooks.on("updateSetting", (setting) => {
        if (setting.key !== "swim.auraEffects") { return }
        set_auras_enabled(setting.value === true || setting.value === "true")
        if (swim.is_first_gm()) { for (const s of game.scenes) { schedule_auras(s) } }
    })

    // --- Aura tab in the Active Effect sheet (GM only) ---
    Hooks.on("preUpdateActiveEffect", (effect, changes) => { strip_idle_aura(effect, changes) })
    Hooks.on("renderActiveEffectConfig", (app, html) => {
        if (!game.user.isGM || app instanceof SWIMEffectConfig) { return }
        const nav = html.find("nav.sheet-tabs")
        if (!nav.length || html.find(`section[data-tab="${TAB}"]`).length) { return }
        const tab = aura_tab_html(app.document.flags?.swim?.aura)
        nav.append(tab.nav)
        html.find("section.tab").last().after(tab.section)
        // after a re-render Foundry has activated the tab before it existed
        try { const tabs = app._tabs?.[0]; if (tabs?.active === TAB) { tabs.activate(TAB) } } catch (err) { console.warn("SWIM | Aura tab", err) }
    })

    // --- catch up: the GM who loads the world brings the scene he is looking at in line ---
    if (works()) { tidy([canvas.scene ?? game.scenes.current].filter(Boolean)) }
}
