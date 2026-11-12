/*******************************************
 * Deviation macro (blast templates that miss)
 * version 3.0.0 – window (DeviationApp) instead of a Dialog
 * (c): brunocalado; altered by SalieriC.
 * `deviation_script(weapontype, range)` with both arguments rolls at once (no window); weapontype 'thrown' | 'projectile',
 * range 'short' | 'medium' | 'long' | 'extreme'.
 ******************************************/
import { SwimWindow, t, btn, rate_opt } from "../helpers/swim_window.js"

const CHAT_IMAGE = "modules/swim/assets/svg/clock.svg"
const RANGE_MULTIPLIER = { short: 1, medium: 2, long: 3, extreme: 4 }

/** Directions (o'clock) at which a weapon can't deviate more than half the distance (it would go behind the thrower). */
export const is_half_distance_direction = (direction) => direction >= 4 && direction <= 8

export async function deviation_script(weapontype = false, range = false) {
    if (weapontype && range) {
        return roll_deviation(weapontype, range)
    }
    await SwimWindow.show(new DeviationApp())
}

/** Rolls direction and distance and posts the chat message. Thrown weapons deviate 1d6, projectiles 2d6, times the range multiplier. */
export async function roll_deviation(weapontype, range) {
    const officialClass = await swim.get_official_class()
    const deviationLink = await swim.get_official_journal_link("deviation")
    const rangeMultiplier = RANGE_MULTIPLIER[range] ?? 1
    const direction = await new Roll('1d12').roll()
    const roll = await new Roll(weapontype === 'thrown' ? '1d6' : '2d6').roll()
    const title = t("SWIM.dialogue-DeviationTile")
    let message = `${officialClass}<h2>${deviationLink ? `${deviationLink}{${title}}` : title}</h2>`
    message += game.i18n.format("SWIM.dialogue-DeviationMessage1", { modifiedTotal: roll.total * rangeMultiplier, direction: direction.total })
    if (is_half_distance_direction(direction.total)) {
        message += t("SWIM.dialogue-DeviationMessage2")
    }
    message += game.i18n.format("SWIM.dialogue-DeviationMessage3", { chatimage: CHAT_IMAGE })
    message += `</div>`
    await ChatMessage.create({
        roll: roll,
        rollMode: game.settings.get("core", "rollMode"),
        content: message,
    })
    return roll.total
}

class DeviationApp extends SwimWindow {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, { id: 'swim-deviation', width: 420 })
    }

    get title() { return t('SWIM.dialogue-DeviationTile') }

    constructor() {
        super()
        this.state = { weapontype: 'projectile', range: 'short' }
    }

    async view() {
        const st = this.state
        const types = rate_opt('weapontype', 'value', 'thrown', t('SWIM.word-ThrownWeapon'), st.weapontype === 'thrown') +
            rate_opt('weapontype', 'value', 'projectile', t('SWIM.word-Projectile'), st.weapontype === 'projectile')
        const ranges = ['short', 'medium', 'long', 'extreme'].map((r) => rate_opt('range', 'value', r, t(`SWIM.gameTerm-range-${r}`), st.range === r)).join('')
        return {
            body: `<div class="swim-hc-lab">${t('SWIM.word-weaponType')}</div><div class="swim-hc-rate swim-us-two">${types}</div>
                <div class="swim-hc-lab swim-hc-lab2">${t('SWIM.gameTerm-range')}</div><div class="swim-hc-rate">${ranges}</div>`,
            foot: `<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('roll', t('SWIM.deviation.roll'), { go: true })}`,
        }
    }

    async onAction(action, el) {
        const st = this.state
        switch (action) {
            case 'weapontype': case 'range':
                if (st[action] === el.dataset.value) { return }
                st[action] = el.dataset.value
                return this.render(false)
            case 'cancel': return this.close()
            case 'roll':
                this.busy = true
                try { await roll_deviation(st.weapontype, st.range) } finally { this.busy = false }
                return this.close()
        }
    }
}
