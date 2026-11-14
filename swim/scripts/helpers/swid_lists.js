/*******************************************
 * SWID lists: the GM-editable settings that map SWIDs of items to a "type"
 * (SWIM Configuration > Item Options, edited with the list editor window in list_editor.js).
 *  - `visionSwids`: SWID -> vision type (darkvision | infravision | nvd | low-light-vision), used by Token Vision (macro and automatic)
 *  - `potionSwids`: SWID -> potion type (health | fatigue) + `amount` (Wounds healed / Fatigue cured per use), used by the Personal Health Centre
 * A list is stored as JSON text: [{"swid": "dwarf", "type": "low-light-vision"}, ...]
 * No UI in here, so it can be imported anywhere (socket guard, Token Vision, Health Centre).
 ******************************************/

/** The same slug SWADE makes of an item name for its SWID (lower case, no accents/symbols, spaces to dashes). Also used to tidy what the GM types. */
export function slugify(input) {
    return String(input ?? '')
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+/g, '')
        .replace(/-+$/g, '')
}
export const norm_swid = slugify

/** Types each list knows (the order of the vision types is also their priority if a token matches several). */
export const LIST_TYPES = {
    visionSwids: ['darkvision', 'infravision', 'nvd', 'low-light-vision'],
    potionSwids: ['health', 'fatigue'],
}

const OLD_HEALTH_POTIONS = 'Minor Health Potion|Health Potion|Greater Health Potion|Minor Healing Potion|Healing Potion|Greater Healing Potion'
const OLD_FATIGUE_POTIONS = 'Minor Potion of Well-Being|Potion of Well-Being|Greater Potion of Well-Being|Minor Recreational Potion|Recreational Potion|Greater Recreational Potion'
/** Wounds healed / Fatigue levels cured per use of a potion (`amount` of a potion entry): 1 unless the GM sets more, at most MAX_AMOUNT. */
export const MAX_AMOUNT = 20
const from_names = (names, type) => names.split('|').map((n) => ({ swid: slugify(n), type, amount: 1 })).filter((e) => e.swid)

/** What the lists contain before the GM changes anything (the old behaviour). */
export const DEFAULT_LISTS = {
    visionSwids: [
        { swid: 'darkvision', type: 'darkvision' },
        { swid: 'infravision', type: 'infravision' },
        { swid: 'low-light-vision', type: 'low-light-vision' },
    ],
    potionSwids: [...from_names(OLD_HEALTH_POTIONS, 'health'), ...from_names(OLD_FATIGUE_POTIONS, 'fatigue')],
}

/** Setting value (JSON text) of a list. */
export const serialize_list = (entries) => JSON.stringify(entries.map((e) => (e.amount === undefined ? { swid: e.swid, type: e.type } : { swid: e.swid, type: e.type, amount: e.amount })))

/** Entries of a list from its stored text: tidied SWIDs, only known types, no empty or double entries. `null` if the text is no list at all. */
export function parse_list(text, id) {
    let raw
    try { raw = typeof text === 'string' ? JSON.parse(text) : text } catch (err) { return null }
    if (!Array.isArray(raw)) { return null }
    const seen = new Set()
    const out = []
    for (const e of raw) {
        const swid = norm_swid(e?.swid)
        if (!swid || !LIST_TYPES[id].includes(e?.type) || seen.has(`${swid}|${e.type}`)) { continue }
        seen.add(`${swid}|${e.type}`)
        if (id === 'potionSwids') {
            const amount = Math.round(Number(e.amount))
            out.push({ swid, type: e.type, amount: Number.isFinite(amount) ? Math.min(Math.max(amount, 1), MAX_AMOUNT) : 1 })
        } else {
            out.push({ swid, type: e.type })
        }
    }
    return out
}

/** The list as the setting holds it now (the defaults if the setting is missing or damaged). */
export function get_list(id) {
    let value
    try { value = game.settings.get('swim', id) } catch (err) { /* not registered */ }
    return parse_list(value, id) ?? DEFAULT_LISTS[id].map((e) => ({ ...e }))
}

/** Set of the SWIDs of a list that have this type. */
export function swids_for(id, type, entries = get_list(id)) {
    return new Set(entries.filter((e) => e.type === type).map((e) => e.swid))
}

/** The SWIDs an item counts as: its SWID, or - for items that never got one ("none") - the slug of its name, which is what SWADE would have made. */
export function item_swids(item) {
    const swid = norm_swid(item?.system?.swid)
    if (swid && swid !== 'none' && swid !== 'any') { return new Set([swid]) }
    const name = norm_swid(item?.name)
    return new Set(name ? [name] : [])
}

/** Is this item a potion of this type ('health' | 'fatigue') according to the potion list? */
export function is_potion_of(item, type, entries = get_list('potionSwids')) {
    const swids = swids_for('potionSwids', type, entries)
    return [...item_swids(item)].some((s) => swids.has(s))
}

/** Wounds / Fatigue levels a potion item heals per use according to the list (the highest of its matching entries; 0 = not a potion of this type). */
export function potion_amount(item, type, entries = get_list('potionSwids')) {
    const swids = item_swids(item)
    return entries.filter((e) => e.type === type && swids.has(e.swid)).reduce((max, e) => Math.max(max, e.amount ?? 1), 0)
}

/**
 * One time: turns the old potion name settings (Health Potion Names / Potion of cure Fatigue Names, separated by |) into SWIDs of the
 * new list. The old settings stay readable (hidden), they are just not used any more. GM only, once per world.
 */
export async function migrate_potion_names() {
    if (game.settings.get('swim', 'potionSwidsMigrated')) { return false }
    const entries = [
        ...from_names(String(game.settings.get('swim', 'healthPotionOptions') ?? ''), 'health'),
        ...from_names(String(game.settings.get('swim', 'fatiguePotionOptions') ?? ''), 'fatigue'),
    ]
    await game.settings.set('swim', 'potionSwids', serialize_list(parse_list(entries, 'potionSwids') ?? []))
    await game.settings.set('swim', 'potionSwidsMigrated', true)
    return true
}
