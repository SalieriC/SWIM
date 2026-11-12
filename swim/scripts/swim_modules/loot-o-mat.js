/********************************************************* 
 * Loot-o-Mat 
 * A loot Macro for Hellfrost and other SaWo Settings.
 * 
 * This macro relies on an Additional Stat set up on your
 * actors: "treasure" (type string, no max value). Your
 * bestiary needs this Additional Stat on the actors to
 * function. 
 * Allowed treasure types are: "Meager", "Worthwhile",
 * "Rich" and "Treasure Trove" which are common loot
 * types i.e. in Hellfrost, 50 Fathoms or the Fantasy 
 * Companion.
 * It is also common to these settings to state treasure
 * per x opponents (i.e. "Meager, per 5 Orcs"). In this
 * case set up the Additional Stat like this:
 * "Meager, per x", "Meager per x" or "Meager/x"
 * where x is the amount of enemies as a number NOT a word.
 * These three options are covered by the macro, use no
 * other format!
 * 
 * How does it work?
 * The macro searches all selected and targeted tokens
 * (it won't use duplicates if targeted and selected
 * tokens are the same, don't worry) for the additional
 * stat "treasure" and makes a roll for loot, then it
 * creates a chat message with the random loot amount.
 * Alternatively, you can use the macro with no tokens
 * targeted/selected and a window will appear that
 * lets you enter the amount of enemies with their
 * different loot types individually. This window will 
 * also open when none of the selected and targeted 
 * tokens has the Additional Stat so you can safely use 
 * the macro without this.
 * If the loot type is set up with an amount of enemies
 * like above (i.e. "Meager, per 5"), the number is used
 * for division and the result is rounded to two decimals.
 * In Hellfrost this represents Silver Scields, in Settings
 * which don't use a sub-currency (like 50f), just ignore
 * or round off manually.
 * 
 * v. 2.0.0 – window (LootApp) instead of a Dialog, texts in lang keys
 * v. 1.2.1 by SalieriC#8263
*********************************************************/
import { SwimWindow, t, esc, btn } from "../helpers/swim_window.js"

const TYPES = [
    { id: 'meager', multiplier: 1, img: "icons/commodities/currency/coins-assorted-mix-copper.webp", heading: 'SWIM.loot.meager' },
    { id: 'worthwhile', multiplier: 10, img: "icons/commodities/currency/coins-assorted-mix-silver.webp", heading: 'SWIM.loot.worthwhile' },
    { id: 'rich', multiplier: 100, img: "icons/commodities/currency/coins-plain-stack-gold.webp", heading: 'SWIM.loot.rich' },
    { id: 'trove', multiplier: 1000, img: "icons/commodities/currency/coins-assorted-mix-platinum.webp", heading: 'SWIM.loot.trove' },
]
const TYPE_BY_TEXT = { "meager": 'meager', "worthwhile": 'worthwhile', "rich": 'rich', "treasure trove": 'trove' }

/** Parses the Additional Stat "treasure": "Meager", "Meager, per 5", "Meager per 5", "Meager/5". Returns { type, rolls } (rolls = 1 or 1/x) or null. Pure. */
export function parse_treasure(text) {
    const lootType = String(text ?? '').toLowerCase().trim()
    if (!lootType) { return null }
    let parts = [lootType]
    if (lootType.includes("per") || lootType.includes("/")) {
        if (lootType.includes(", per")) { parts = lootType.split(", per ") }
        else if (lootType.includes("per")) { parts = lootType.split(" per ") }
        else { parts = lootType.split("/") }
    }
    const type = TYPE_BY_TEXT[parts[0].trim()]
    if (!type) { return null }
    if (parts.length === 1) { return { type, rolls: 1 } }
    const lootMod = Number(parts[1])
    return { type, rolls: lootMod > 0 ? 1 / lootMod : 1 }
}

/** Dice formula for the amounts of rolls per type. */
export function loot_formula(rolls) {
    return TYPES.map((ty) => `(1d10*${ty.multiplier}*${rolls[ty.id] ?? 0})`).join('+')
}

/** Rolls the loot and posts the chat message. */
async function roll_loot(rolls, name) {
    const roll = await new Roll(loot_formula(rolls)).evaluate()
    const result = Math.round(roll.total * 100) / 100
    const type = result >= 1000 ? TYPES[3] : result >= 100 ? TYPES[2] : result >= 10 ? TYPES[1] : TYPES[0]
    const treasure = `
<div class="swade-core">
<h2><img style="border: 0;" src=${type.img} width="25" height="25" /> ${t(type.heading)}</h2>
<p>${t('SWIM.loot.found', { result, name: esc(name) })}</p>
</div>
`
    await ChatMessage.create({ content: treasure })
}

export async function loot_o_mat_script() {
    const { speaker, _, __, token } = await swim.get_macro_variables()
    const targets = game.user.targets
    let name = t('SWIM.loot.yourEnemy')
    let tokens = null

    if (canvas.tokens.controlled.length > 1 || targets.size > 1 || (targets.size + canvas.tokens.controlled.length > 1)) {
        name = t('SWIM.loot.yourEnemies')
        //use deduplication to get rid of those which are both, selected and targeted:
        tokens = [...new Set([...canvas.tokens.controlled, ...targets])]
    } else if (token) {
        name = token.name
        tokens = [token]
    } else if (targets.size === 1) {
        tokens = [...targets]
    }

    if (tokens) {
        const rolls = { meager: 0, worthwhile: 0, rich: 0, trove: 0 }
        for (const tk of tokens) {
            const parsed = parse_treasure(tk.actor?.system?.additionalStats?.treasure?.value)
            if (parsed) { rolls[parsed.type] += parsed.rolls }
        }
        if (Object.values(rolls).some((n) => n > 0)) { return roll_loot(rolls, name) }
    }
    await SwimWindow.show(new LootApp(name, !!tokens))
}

class LootApp extends SwimWindow {
    #name
    #notDetected

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, { id: 'swim-loot-o-mat', width: 430 })
    }

    get title() { return "Loot-o-Mat" }

    constructor(name, notDetected) {
        super()
        this.#name = name
        this.#notDetected = notDetected
        this.state = { meager: '0', worthwhile: '0', rich: '0', trove: '0' }
    }

    async view() {
        const rows = TYPES.map((ty) => `<div class="swim-lm-row"><img src="${esc(ty.img)}" alt="" width="20" height="20"><span>${esc(t(`SWIM.loot.${ty.id}Short`))} <small>(1d10×${ty.multiplier} GS)</small></span>
            <input type="number" min="0" data-field="${ty.id}" value="${esc(this.state[ty.id])}"></div>`).join('')
        return {
            body: `<div class="swim-hc-result"><p>${esc(t(this.#notDetected ? 'SWIM.loot.introNotDetected' : 'SWIM.loot.intro'))}</p></div>${rows}`,
            foot: `<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('roll', t('SWIM.loot.roll'), { go: true })}`,
        }
    }

    async onAction(action) {
        if (action === 'cancel') { return this.close() }
        if (action !== 'roll') { return }
        const rolls = {}
        for (const ty of TYPES) { rolls[ty.id] = Math.max(0, Number(this.state[ty.id]) || 0) }
        const total = Object.values(rolls).reduce((a, b) => a + b, 0)
        if (total <= 0) { return ui.notifications.warn(t('SWIM.loot.nothing')) }
        this.busy = true
        try {
            await roll_loot(rolls, total > 1 ? t('SWIM.loot.yourEnemies') : this.#name)
        } finally {
            this.busy = false
        }
        return this.close()
    }
}
