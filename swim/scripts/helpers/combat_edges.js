/*******************************************
 * Combat Edges for the Warrior's Gift power (Effect Builder).
 *
 * The Edges come from the compendium chosen in the setting `edgesPack` (SWIM Configuration > Item Options). A "Combat Edge" is an Edge
 * whose category contains the word "combat" (case insensitive). The rank of an Edge is read from its requirements (the rank requirement
 * of SWADE; an Edge without one counts as Novice).
 *
 * Pure helpers (no Foundry): `rank_from_value`, `edge_rank_index`, `is_combat_category`, `granted_line`, `affects_block`.
 * Foundry side: `load_combat_edges` (client, for the picker and the socket guard), `edge_item_data` (GM, the data of the temporary Edge).
 * The temporary Edge keeps its SWID and everything else, only the name says that it comes from the power and `flags.swim.warriorsGift`
 * remembers where it came from. It is deleted together with the effect that grants it (hooks/effect_hooks.js).
 ******************************************/

import { rank_names } from "./actor_picker.js"

const RANK_KEYS = ["novice", "seasoned", "veteran", "heroic", "legendary"]
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => `&#${m.charCodeAt(0)};`)

/**
 * Rank index 0-4 (Novice ... Legendary) from what SWADE stores in a rank requirement: the index (number or numeric text), the lang key
 * ('SWADE.Ranks.Seasoned', also the initial value of the data model) or a rank name (English or localized, `names`). null if unknown. Pure.
 */
export function rank_from_value(value, names = []) {
    if (typeof value === "number") { return Number.isInteger(value) && value >= 0 && value <= 4 ? value : null }
    if (typeof value !== "string") { return null }
    const text = value.trim()
    if (!text) { return null }
    if (/^\d+$/.test(text)) { return rank_from_value(Number(text)) }
    const last = norm(text.split(".").pop())
    const byKey = RANK_KEYS.indexOf(last)
    if (byKey >= 0) { return byKey }
    const byName = names.findIndex((n) => norm(n) === norm(text))
    return byName >= 0 ? byName : null
}

/**
 * The rank (0-4) an Edge requires, from `system.requirements`: a list of requirement objects (`{type: 'rank', value}`), or the old
 * format (an object whose `value` is a text like "Seasoned, Agility d8+"). No rank requirement = Novice. Pure.
 */
export function edge_rank_index(requirements, names = []) {
    let list = []
    if (Array.isArray(requirements)) {
        list = requirements
    } else if (requirements && typeof requirements === "object") {
        if (typeof requirements.value === "string") {
            for (const part of requirements.value.split(",")) {
                const rank = rank_from_value(part, names)
                if (rank !== null) { return rank }
            }
            return 0
        }
        list = Object.values(requirements)
    }
    for (const req of list) {
        if (req?.type !== "rank") { continue }
        const rank = rank_from_value(req.value, names)
        if (rank !== null) { return rank }
    }
    return 0
}

/** Does the category contain one of the words (default: "combat"), ignoring case? Pure. */
export function is_combat_category(category, words = ["combat"]) {
    const text = norm(category)
    return words.some((w) => norm(w) && text.includes(norm(w)))
}

/** The line at the top of the effect description: which Edge it grants (plain HTML, names escaped). Pure. */
export function granted_line(label, edgeName) {
    return `<p><strong>${esc(label)}</strong> ${esc(edgeName)}</p>`
}

/** The block for the maintaining effect of the caster: who is affected with which Edge (`pairs`: `[{target, edge}]`). Pure. */
export function affects_block(label, pairs) {
    if (!pairs?.length) { return "" }
    return `<p><strong>${esc(label)}</strong></p><ul>${pairs.map((p) => `<li>${esc(p.target)}: ${esc(p.edge)}</li>`).join("")}</ul>`
}

/** Is this an improved version of an Edge (SWID 'improved-...')? With a Raise those are open to everyone. Pure. */
export function is_improved_edge(swid) {
    return String(swid ?? "").startsWith("improved-")
}

/** Plain entry for the picker and the guard from an Edge document. */
export function edge_entry(doc, names = []) {
    let requirements = ""
    try { requirements = String(doc.system?.requirementString ?? "") } catch { /* only a label */ }
    return {
        id: doc.id,
        uuid: doc.uuid,
        name: doc.name,
        img: doc.img,
        swid: doc.system?.swid ?? "",
        category: String(doc.system?.category ?? ""),
        requirements,
        description: String(doc.system?.description ?? ""),
        rankIdx: edge_rank_index(doc.system?.requirements, names),
    }
}

/** The compendium pack of the setting, or null (nothing chosen, not found, not an Item pack). */
export function edges_pack(packId = game.settings.get("swim", "edgesPack")) {
    if (!packId || packId === "none") { return null }
    const pack = game.packs.get(packId)
    return pack && pack.documentName === "Item" ? pack : null
}

/**
 * All Combat Edges of the Edge compendium, sorted by name: `[{id, uuid, name, img, swid, category, requirements, rankIdx}]`.
 * Returns null if no usable compendium is set (the caller shows the hint to the settings).
 */
export async function load_combat_edges(packId) {
    const pack = edges_pack(packId)
    if (!pack) { return null }
    const names = rank_names()
    const words = ["combat", game.i18n.localize("SWIM.warriorsGiftWin.combatWord")]
    const docs = await pack.getDocuments({ type: "edge" })
    const collator = new Intl.Collator(game.i18n.lang, { numeric: true, sensitivity: "base" })
    return docs
        .filter((d) => d.type === "edge" && is_combat_category(d.system?.category, words))
        .map((d) => edge_entry(d, names))
        .sort((a, b) => collator.compare(a.name, b.name))
}

/**
 * The data to create the temporary Edge on a target (GM side): a copy of the compendium Edge (SWID, effects, everything), named
 * "<Edge> (<Power>)", flagged with `flags.swim.warriorsGift` and the source in `flags.core.sourceId`. null if the Edge is not found.
 */
export async function edge_item_data(packId, edgeID, { maintenanceID, casterID } = {}) {
    const pack = edges_pack(packId)
    const doc = pack ? await pack.getDocument(edgeID) : null
    if (!doc || doc.type !== "edge") { return null }
    const data = doc.toObject()
    delete data._id
    delete data.folder
    delete data.sort
    delete data.ownership
    data.name = game.i18n.format("SWIM.warriorsGiftWin.edgeName", { name: doc.name, power: game.i18n.localize("SWIM.power-warriorsGift") })
    if (data.flags?.swade) { delete data.flags.swade.hasGranted } // SWADE sets it when it grants the items of the Edge
    foundry.utils.setProperty(data, "flags.core.sourceId", doc.uuid)
    foundry.utils.setProperty(data, "flags.swim.warriorsGift", { maintenanceID, casterID, edge: doc.name })
    return data
}
