import SWIMEffectConfig from "../helpers/custom_effect_config.js"
import { DEFAULTS, DISPOSITIONS, RANGES, aura_config, scenes_of_actor, scenes_of_effect, schedule_auras, set_auras_enabled, state } from "../helpers/auras.js"
import { esc, t } from "../helpers/swim_window.js"

/**
 * Aura hooks (see helpers/auras.js for the rules).
 * - `install_aura_suppression()` (init): an enabled aura source changes nothing on its own owner.
 * - `aura_hooks()` (ready): the first active GM keeps the copies on the other tokens up to date; GM only "Aura" tab in the Active Effect sheet.
 */

const TAB = "swimAura"
const MOVE_KEYS = ["x", "y", "width", "height", "hidden", "disposition", "actorId", "actorLink", "delta", "actorData"]

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
export function aura_tab_html(stored = {}, app_name = "") {
    const cfg = { ...DEFAULTS, ...stored }
    const disp = DISPOSITIONS.map((d) => `<option value="${d}" ${cfg.disposition === d ? "selected" : ""}>${esc(t(`SWIM.aura.affects-${d}`))}</option>`).join("")
    const rng = RANGES.map((r) => `<option value="${r}" ${cfg.range === r ? "selected" : ""}>${esc(t(`SWIM.aura.range-${r}`))}</option>`).join("")
    const row = (label, hint, input, cls = "") => `<div class="form-group ${cls}" ${cls && cfg.range !== "custom" ? 'style="display:none"' : ""}><label>${esc(t(label))}</label><div class="form-fields">${input}</div><p class="hint">${esc(t(hint))}</p></div>`
    return {
        section: `<p class="swim-au-intro"><span class="swim-au-badge">SWIM</span>${esc(t("SWIM.aura.intro"))}</p>
            ${row("SWIM.aura.enabled", "SWIM.aura.enabledHint", `<input type="checkbox" name="flags.swim.aura.enabled" data-dtype="Boolean" ${cfg.enabled ? "checked" : ""}>`)}
            ${row("SWIM.aura.range", "SWIM.aura.rangeHint", `<select name="flags.swim.aura.range">${rng}</select>`)}
            ${row("SWIM.aura.radius", "SWIM.aura.radiusHint", `<input type="number" name="flags.swim.aura.radius" data-dtype="Number" min="0" step="1" value="${esc(cfg.radius)}">`, "swim-au-radius")}
            ${row("SWIM.aura.affects", "SWIM.aura.affectsHint", `<select name="flags.swim.aura.disposition">${disp}</select>`)}
            ${row("SWIM.aura.name", "SWIM.aura.nameHint", `<input type="text" name="flags.swim.aura.name" value="${esc(cfg.name)}" placeholder="${esc(app_name)}">`)}
            ${row("SWIM.aura.wildcards", "SWIM.aura.wildcardsHint", `<input type="checkbox" name="flags.swim.aura.wildcards" data-dtype="Boolean" ${cfg.wildcards ? "checked" : ""}>`)}
            ${row("SWIM.aura.self", "SWIM.aura.selfHint", `<input type="checkbox" name="flags.swim.aura.self" data-dtype="Boolean" ${cfg.self ? "checked" : ""}>`)}
            ${row("SWIM.aura.stack", "SWIM.aura.stackHint", `<input type="checkbox" name="flags.swim.aura.stack" data-dtype="Boolean" ${cfg.stack ? "checked" : ""}>`)}
            <p class="swim-au-note">${esc(t("SWIM.aura.note"))}</p>`,
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

    // --- the range of a source comes from its actor (Command range in the SWIM config, SWADE auras): changed there -> recalculate ---
    Hooks.on("updateActor", (actor, changes) => {
        if (!works() || !(foundry.utils.hasProperty(changes, "flags.swim.config.commandRange") || foundry.utils.hasProperty(changes, "flags.swade.auras"))) { return }
        tidy(scenes_of_actor(actor))
    })

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
        // v14: ApplicationV2 sheet. Tab buttons are `.tabs [data-group][data-tab]` (data-action="tab"), tab contents `.tab[data-group][data-tab]`.
        // The sheet re-renders single parts, so nav and section are checked on their own.
        const group = "sheet"
        const navButton = html.querySelector(`.tabs [data-group="${group}"][data-tab]:last-of-type, .tabs [data-group="${group}"][data-tab]`)
        const last_section = [...html.querySelectorAll(`.tab[data-group="${group}"]`)].at(-1)
        if (!navButton || !last_section) { return }
        const tab = aura_tab_html(app.document.flags?.swim?.aura, app.document.name)
        if (!html.querySelector(`.tabs [data-tab="${TAB}"]`)) {
            const nav = [...html.querySelectorAll(`.tabs [data-group="${group}"][data-tab]`)].at(-1).cloneNode(false)
            nav.classList.remove("active")
            nav.dataset.tab = TAB
            nav.dataset.tooltip = t("SWIM.aura.tab")
            nav.setAttribute("aria-label", t("SWIM.aura.tab"))
            nav.innerHTML = `<i class="fa-solid fa-bullseye"></i>`
            navButton.parentElement.append(nav)
        }
        if (!html.querySelector(`.tab[data-tab="${TAB}"]`)) {
            const section = document.createElement("section")
            section.className = "tab swim-au"
            section.dataset.group = group
            section.dataset.tab = TAB
            section.innerHTML = tab.section
            last_section.after(section)
            // the number field only matters for "Custom"
            const radius = section.querySelector(".swim-au-radius")
            section.querySelector('select[name="flags.swim.aura.range"]')?.addEventListener("change", (ev) => { if (radius) { radius.style.display = ev.currentTarget.value === "custom" ? "" : "none" } })
        }
        // after a re-render Foundry has activated the tab before it existed
        if (app.tabGroups?.[group] === TAB) { app.changeTab(TAB, group, { force: true, updatePosition: false }) }
    })

    // --- catch up: the GM who loads the world brings the scene he is looking at in line ---
    if (works()) { tidy([canvas.scene ?? game.scenes.current].filter(Boolean)) }
}
