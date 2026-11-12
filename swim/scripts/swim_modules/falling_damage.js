/*******************************************
 * Falling Damage Macro.
 * This macro automatically calculates falling damage for all selected tokens.
 * It is capable of factoring in water and snow/soft surfaces as per the core rules.
 * v. 3.0.0 – window (FallingDamageApp) instead of a Dialog
 * v. 2.2.1 by SalieriC#8263, CSS of the dialogue by Kyane von Schnitzel#8654
 * (Do not remove credits, even if editing.)
 *******************************************/
import { SwimWindow, t, esc, btn, token_img } from "../helpers/swim_window.js"

const WOUNDS_LINK = "@Compendium[swim.swade-immersive-macros.AWEIhBfGUmhQlww5]"

/** Damage formula for a fall: (1d6x+1) per 2" of depth, capped at 10 (10d6+10). */
export function fall_formula(fallingDepth) {
    const halvedDepth = Math.ceil(fallingDepth / 2) //damage per 2"
    return halvedDepth >= 10 ? `(1d6x+1)*10` : `(1d6x+1)*${halvedDepth}`
}

/** Soft ground (snow) reduces the damage by its depth, water halves it on a success and negates it on a raise. Never below 0. */
export function apply_surface(damage, snowDepth, waterSuccess) {
    let dived = false
    if (snowDepth > 0) {
        damage = damage - snowDepth
    } else if (waterSuccess === "success") {
        damage = Math.ceil(damage / 2)
    } else if (waterSuccess === "raise") {
        dived = true
        damage = 0
    }
    return { damage: Math.max(0, damage), dived }
}

/** What the damage does to the target (the rules text for the chat). `isHardy`: has the Hardy ability. Returns an HTML snippet. */
export function fall_outcome(toughness, damage, isShaken, isHardy) {
    const raises = Math.floor((damage - toughness) / 4)
    const noHarm = `<p>=> ${t("SWIM.fallingDamageCalculator-resultNoHarm")}</p>`
    const wounds = (n, word) => `<p>=> ${n} ${WOUNDS_LINK}{${t(word)}}.</p>`
    if (toughness > damage) { return noHarm }
    if (isShaken === false && raises <= 0) { return `<p>=> ${t("SWIM.gameTerm-Shaken")}</p>` }
    if (isShaken === false && raises >= 1) { return `<p>=> ${t("SWIM.fallingDamageCalculator-resultShakenAnd", { raises })} ${WOUNDS_LINK}{${t("SWIM.gameTerm-Wound-plural")}}.</p>` }
    if (isShaken === true && raises <= 1) {
        if (!isHardy || raises === 1) { return wounds(1, "SWIM.gameTerm-Wound-singular") }
        return noHarm
    }
    return wounds(raises - 1, "SWIM.gameTerm-Wound-plural")
}

export async function falling_damage_script() {
    //use deduplication to get rid of those which are both, selected and targeted:
    const tokens = [...new Set([...canvas.tokens.controlled, ...game.user.targets])];
    if (tokens.length === 0) {
        return ui.notifications.error(t("SWIM.notification-selectOrTargetOneOrMoreTokens"));
    }
    await SwimWindow.show(new FallingDamageApp(tokens))
}

/** Rolls the falls of all entries and returns the chat HTML. entries: [{token, fallingDepth, snowDepth, water}] */
async function resolve_falls(entries) {
    const officialClass = await swim.get_official_class()
    const icon = "modules/swim/assets/icons/macros/falling_sbed_game-icons.net.png"
    let content = `${officialClass}<h2><img style="border: 0;" src=${icon} width="35" height="35" /> ${t("SWIM.fallingDamageCalculator-damageFromFalling")}</h2>`
    for (const { token, fallingDepth, snowDepth, water } of entries) {
        content += `<h3><img style="border: 0;" src=${token_img(token)} width="35" height="35" /> ${esc(token.name)}</h3>`
        const roll = await new Roll(fall_formula(fallingDepth)).evaluate()
        const { damage, dived } = apply_surface(roll.total, snowDepth, water)
        content += dived
            ? t("SWIM.fallingDamageCalculator-fallsButDives", { tokenName: esc(token.name), fallingDepth })
            : t("SWIM.fallingDamageCalculator-fallsAndTakesDamage", { tokenName: esc(token.name), fallingDepth, damage })
        const actor = token.actor
        const isHardy = actor.items.find((item) => item.name.toLowerCase() === t("SWIM.ability-hardy").toLowerCase() && item.type === "ability")
        content += fall_outcome(actor.system.stats.toughness.value, damage, actor.system.status.isShaken, isHardy)
    }
    return content + `</div>`
}

class FallingDamageApp extends SwimWindow {
    #tokens

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, { id: 'swim-falling-damage', width: 470 })
    }

    get title() { return t('SWIM.fallingDamageCalculator') }

    constructor(tokens) {
        super()
        this.#tokens = tokens
        for (const tk of tokens) {
            this.state[`depth:${tk.id}`] = '0'
            this.state[`snow:${tk.id}`] = '0'
            this.state[`water:${tk.id}`] = 'na'
        }
    }

    async view() {
        const waters = [['na', t('SWIM.word-na')], ['success', t('SWIM.raiseCalculator-success')], ['raise', t('SWIM.gameTerm-Raise')]]
        let body = `<div class="swim-hc-result"><p>${t('SWIM.falling.introDepth')}</p><p>${t('SWIM.falling.introSnow')}</p><p>${t('SWIM.falling.introWater')}</p></div>`
        for (const tk of this.#tokens) {
            const num = (kind, label) => `<label><small>${label}</small><input type="number" min="0" data-field="${kind}:${tk.id}" value="${esc(this.state[`${kind}:${tk.id}`])}"></label>`
            const sel = this.state[`water:${tk.id}`]
            body += `<div class="swim-fd-token"><div class="swim-hc-seg is-on swim-us-static"><img src="${esc(token_img(tk))}" alt=""><span><b>${esc(tk.name)}</b></span></div>
                <div class="swim-fd-fields">${num('depth', t('SWIM.falling.depth'))}${num('snow', t('SWIM.falling.snow'))}
                <label><small>${t("SWIM.falling.water")}</small><select data-field="water:${tk.id}">${waters.map(([v, l]) => `<option value="${v}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label></div></div>`
        }
        return { body, foot: `<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('roll', t('SWIM.falling.roll'), { go: true })}` }
    }

    async onAction(action) {
        if (action === 'cancel') { return this.close() }
        if (action !== 'roll') { return }
        const entries = this.#tokens.map((token) => ({
            token,
            fallingDepth: Math.max(0, Number(this.state[`depth:${token.id}`]) || 0),
            snowDepth: Math.max(0, Number(this.state[`snow:${token.id}`]) || 0),
            water: this.state[`water:${token.id}`],
        }))
        // Validate everything first, so nothing is rolled if one token has both water and snow.
        if (entries.some((e) => e.water !== "na" && e.snowDepth !== 0)) {
            return ui.notifications.error(t("SWIM.fallingDamageCalculator-cantCombineWaterAndSnow"))
        }
        this.busy = true
        try {
            await ChatMessage.create({ content: await resolve_falls(entries) })
        } finally {
            this.busy = false
        }
        return this.close()
    }
}
