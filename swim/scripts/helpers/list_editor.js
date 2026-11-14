import { SwimWindow, t, esc, btn } from './swim_window.js'
import { DEFAULT_LISTS, LIST_TYPES, MAX_AMOUNT, norm_swid, parse_list, serialize_list } from './swid_lists.js'

/** Texts of the types and the window of each list (the lists themselves are in swid_lists.js). */
export const LIST_EDITORS = {
    visionSwids: {
        title: 'SWIM.listEditor.visionTitle',
        intro: 'SWIM.listEditor.visionIntro',
        types: { darkvision: 'SWIM.ability-darkvision-swpf', infravision: 'SWIM.ability-infravision', nvd: 'SWIM.tokenVision-nightVisionDevice', 'low-light-vision': 'SWIM.ability-lowLightVision' },
    },
    potionSwids: {
        title: 'SWIM.listEditor.potionTitle',
        intro: 'SWIM.listEditor.potionIntro',
        types: { health: 'SWIM.listEditor.typeHealth', fatigue: 'SWIM.listEditor.typeFatigue' },
        amount: true, // number field: Wounds healed / Fatigue levels cured per use
    },
}

/**
 * Sub window of the SWIM Configuration: a list of SWIDs, each with a type (selector). Entries can be added and removed,
 * "Reset to defaults" brings back the original list. *Apply* hands the new list (JSON text) to `onApply`; nothing is saved before the
 * configuration itself is saved.
 */
export class ListEditorApp extends SwimWindow {
    #id
    #rows = []
    #next = 0

    /** @param {{id: string, text: string, onApply: (json: string) => void}} cfg id: 'visionSwids' | 'potionSwids'; text: current stored value */
    constructor({ id, text, onApply }) {
        super({ id: `swim-list-editor-${id}`, title: t(LIST_EDITORS[id].title), width: 540 })
        this.#id = id
        this.onApply = onApply
        this.#fill(parse_list(text, id) ?? DEFAULT_LISTS[id])
    }

    #fill(entries) {
        this.#rows = []
        for (const e of entries) { this.#add_row(e.swid, e.type, e.amount) }
    }

    #add_row(swid = '', type = LIST_TYPES[this.#id][0], amount = 1) {
        const rid = this.#next++
        this.#rows.push(rid)
        this.state[`swid:${rid}`] = swid
        this.state[`type:${rid}`] = type
        this.state[`amount:${rid}`] = amount
        return rid
    }

    async view() {
        const def = LIST_EDITORS[this.#id]
        const types = Object.entries(def.types)
        const cls = def.amount ? ' has-amount' : ''
        const rows = this.#rows.map((rid) => `<div class="swim-le-row${cls}">
            <input type="text" data-field="swid:${rid}" value="${esc(this.state[`swid:${rid}`])}" placeholder="${esc(t('SWIM.listEditor.placeholder'))}" spellcheck="false" autocomplete="off">
            <select data-field="type:${rid}">${types.map(([value, key]) => `<option value="${esc(value)}" ${this.state[`type:${rid}`] === value ? 'selected' : ''}>${esc(t(key))}</option>`).join('')}</select>
            ${def.amount ? `<input type="number" min="1" max="${MAX_AMOUNT}" step="1" data-field="amount:${rid}" value="${esc(this.state[`amount:${rid}`])}" title="${esc(t('SWIM.listEditor.amountTip'))}">` : ''}
            <button type="button" class="swim-hc-btn swim-cfg-ico" data-action="remove" data-rid="${rid}" title="${esc(t('SWIM.listEditor.remove'))}"><i class="fas fa-trash"></i></button></div>`).join('')
        const body = `<div class="swim-hc-result"><p>${esc(t(def.intro))}</p></div>
            <div class="swim-le-head${cls}"><span>${esc(t('SWIM.listEditor.swid'))}</span><span>${esc(t('SWIM.listEditor.type'))}</span>${def.amount ? `<span title="${esc(t('SWIM.listEditor.amountTip'))}">${esc(t('SWIM.listEditor.amount'))}</span>` : ''}<span></span></div>
            ${rows || `<p class="swim-le-empty">${esc(t('SWIM.listEditor.empty'))}</p>`}
            <div class="swim-le-tools">${btn('add', t('SWIM.listEditor.add'))}${btn('defaults', t('SWIM.listEditor.defaults'))}</div>`
        const foot = `<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('apply', t('SWIM.listEditor.apply'), { go: true })}`
        return { body, foot }
    }

    async onAction(action, el) {
        switch (action) {
            case 'add': {
                this.#add_row()
                await this.render(false)
                this.element?.find('input[type="text"]').last().trigger('focus')
                return
            }
            case 'remove':
                this.#rows = this.#rows.filter((rid) => String(rid) !== el.dataset.rid)
                return this.render(false)
            case 'defaults':
                this.#fill(DEFAULT_LISTS[this.#id])
                return this.render(false)
            case 'cancel': return this.close()
            case 'apply': {
                const entries = this.#rows.map((rid) => ({ swid: norm_swid(this.state[`swid:${rid}`]), type: this.state[`type:${rid}`], amount: this.state[`amount:${rid}`] }))
                this.onApply(serialize_list(parse_list(entries, this.#id) ?? []))
                return this.close()
            }
        }
    }
}
