/*******************************************
 * Raise Calculator – window (RaiseApp) instead of a Dialog. The result updates while typing.
 ******************************************/
import { SwimWindow, t, esc, btn } from "./swim_window.js"

const ICON = "modules/swim/assets/icons/misc/"

/** Result of a roll against a target number. Pure. Returns { level: 'failure'|'success'|'raises', raises }. */
export function raise_result(target, roll) {
    const raises = Math.floor((roll - target) / 4)
    if (target > roll) { return { level: 'failure', raises: 0 } }
    if (raises < 1) { return { level: 'success', raises: 0 } }
    return { level: 'raises', raises }
}

/** Image and text for the result. `null` while a number is missing. */
export function raise_display(targetText, rollText) {
    if (targetText === '' || rollText === '' || targetText == null || rollText == null) { return null }
    const target = parseInt(targetText), roll = parseInt(rollText)
    if (Number.isNaN(target) || Number.isNaN(roll)) { return null }
    const r = raise_result(target, roll)
    if (r.level === 'failure') { return { img: `${ICON}raise_red.svg`, text: t("SWIM.raiseCalculator-failure") } }
    if (r.level === 'success') { return { img: `${ICON}raise_yellow.svg`, text: t("SWIM.raiseCalculator-success") } }
    return { img: `${ICON}raise_green.svg`, text: t(r.raises < 2 ? "SWIM.raiseCalculator-raises-singular" : "SWIM.raiseCalculator-raises-plural", { raises: r.raises }) }
}

export async function raise_calculator() {
    await SwimWindow.show(new RaiseApp())
}

class RaiseApp extends SwimWindow {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, { id: 'swim-raise-calculator', width: 340 })
    }

    get title() { return t('SWIM.raiseCalculator-label') }

    constructor() {
        super()
        this.state = { target: '', roll: '' }
    }

    async view() {
        const st = this.state
        const row = (field, icon, label) => `<div class="swim-rc-row"><img src="${ICON}${icon}" alt="" width="25" height="25"><b>${esc(label)}:</b>
            <input type="number" placeholder="0" data-field="${field}" value="${esc(st[field])}"></div>`
        const res = raise_display(st.target, st.roll) ?? { img: `${ICON}raise_black.svg`, text: t("SWIM.raiseCalculator-result") }
        return {
            body: `${row('target', 'bullseye.svg', t('SWIM.raiseCalculator-targetNumber'))}${row('roll', 'rolling-dices.svg', t('SWIM.raiseCalculator-roll'))}
                <div class="swim-rc-row swim-rc-result"><img data-rc="img" src="${res.img}" alt="" width="25" height="25"><b data-rc="text">${esc(res.text)}</b></div>`,
            foot: `<span class="swim-hc-spacer"></span>${btn('close', t('SWIM.travel.close'))}`,
        }
    }

    activateListeners(html) {
        super.activateListeners(html)
        // Update only the result line while typing (a re-render would take the focus away from the input).
        html.on('input change', 'input[data-field]', () => {
            const res = raise_display(this.state.target, this.state.roll)
            if (!res) { return }
            html.find('[data-rc="img"]').attr('src', res.img)
            html.find('[data-rc="text"]').text(res.text)
        })
        html.find('input[data-field="target"]').trigger('focus')
    }

    async onAction(action) {
        if (action === 'close') { return this.close() }
    }
}
