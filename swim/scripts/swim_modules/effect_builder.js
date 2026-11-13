/*******************************************************
 * SWADE Immersive Macros (SWIM) proudly presents:
 * The Effect Builder.
 * This allows users to apply power effects to any token
 * no matter if they have ownership or not. It respects
 * the standard rules and increased duration from the
 * concentration edge.
 *
 * v. 9.0.0 – window (EffectBuilderApp) with a searchable power list instead of a Dialog.
 * v. 8.0.0
 * By SalieriC#8263; dialogue resizing by Freeze#2689.
 *
 * Powers on hold for now:
 * - Entangle (as it may get much easier by the system soon)
 * - Illusion (want something in conjunction with WarpGate similar to the summoner but need to check how exactly that could work out first.
 * - Telekinesis (because of the unwilling targets problem)
 * 
 * The Light power uses Active Token Effects which is not updated to v14 and might need a replacement.
 ******************************************************/
import * as SWIM from '../constants.js'
import { execute_as_gm } from "../helpers/socket_helper.js"
import { SwimWindow, t, esc, btn, token_img, tokens_header, rate_opt, checkbox } from "../helpers/swim_window.js"

// ============================================================================
// PART 1: The window (EffectBuilderApp)
// v. 9.0.0 – window instead of a Dialog: searchable power list, state driven options.
// ============================================================================

// SWADE system lang keys use the 3-letter form (e.g. SWADE.AttrAgi), not the full attribute name.
const ATTRIBUTES = [
    ['agility', "SWADE.AttrAgi"],
    ['smarts', "SWADE.AttrSma"],
    ['spirit', "SWADE.AttrSpr"],
    ['strength', "SWADE.AttrStr"],
    ['vigor', "SWADE.AttrVig"],
]

const ATTRIBUTE_KEYS = Object.fromEntries(ATTRIBUTES)

/** The powers the Effect Builder can handle: [value, lang key of the label]. */
export const POWERS = [
    ['boost', 'SWIM.power-boostTrait'], ['lower', 'SWIM.power-lowerTrait'],
    ['arcaneProtection', 'SWIM.power-arcaneProtection'], ['beastFriend', 'SWIM.power-beastFriend'], ['blind', 'SWIM.power-blind'],
    ['burrow', 'SWIM.power-burrow'], ['conceal', 'SWIM.power-concealArcana'], ['confusion', 'SWIM.power-confusion'],
    ['damageField', 'SWIM.power-damageField'], ['darksight', 'SWIM.power-darksight'], ['deflection', 'SWIM.power-deflection'],
    ['disguise', 'SWIM.power-disguise'], ['detect', 'SWIM.power-detectArcana'], ['burden-tes', 'SWIM.power-easeBurden-tes'],
    ['elementalManipulation', 'SWIM.power-elementalManipulation'], ['empathy', 'SWIM.power-empathy'],
    ['environmentalProtection', 'SWIM.power-environmentalProtection'], ['farsight', 'SWIM.power-farsight'], ['fly', 'SWIM.power-fly'],
    ['growth', 'SWIM.power-growth'], ['shrink', 'SWIM.power-shrink'], ['intangibility', 'SWIM.power-intangibility'],
    ['invisibility', 'SWIM.power-invisibility'], ['light', 'SWIM.power-light'], ['mindLink', 'SWIM.power-mindLink'],
    ['protection', 'SWIM.power-protection'], ['puppet', 'SWIM.power-puppet'], ['relief', 'SWIM.power-relief'],
    ['silence', 'SWIM.power-silence'], ['sloth', 'SWIM.power-sloth'], ['slumber', 'SWIM.power-slumber'], ['smite', 'SWIM.power-smite'],
    ['speakLanguage', 'SWIM.power-speakLanguage'], ['speed', 'SWIM.power-speed'], ['wallWalker', 'SWIM.power-wallWalker'],
    ['warriorsGift', 'SWIM.power-warriorsGift'], ['other', 'SWIM.power-other'],
]
const SUPPORTED = new Set(POWERS.map(([v]) => v))
// A power item of the system covers several builder powers (one SWID, two effects):
const GROUPS = { boost: ['boost', 'lower'], growth: ['growth', 'shrink'], speed: ['speed', 'sloth'], detect: ['detect', 'conceal'], silence: ['silence'] }
// The SWID list maps the combined Sound/Silence power to 'sound', the builder offers 'silence':
const ALIASES = { sound: 'silence' }
// Options per power (what the old dialog showed):
const RAISE = new Set(['boost', 'lower', 'beastFriend', 'invisibility', 'arcaneProtection', 'burrow', 'darksight', 'detect', 'disguise', 'elementalManipulation',
    'empathy', 'farsight', 'fly', 'light', 'mindLink', 'puppet', 'relief', 'silence', 'speakLanguage', 'wallWalker', 'warriorsGift', 'blind', 'other'])
const NOTHING = new Set(['sloth', 'confusion', 'environmentalProtection', 'intangibility', 'slumber'])

/** The power that is preselected: the item's SWID if the builder supports that power, 'other' for any other power item, 'boost' without item. Pure. */
export function resolve_default_power(item) {
    if (!item) { return 'boost' }
    const mapped = SWIM.SWID_POWER_LIST[item.system?.swid]
    const power = ALIASES[mapped] ?? mapped
    return power && SUPPORTED.has(power) ? power : 'other'
}

/** Is the (item's) power the selected one, or the same SWADE power with another effect (Boost/Lower, Growth/Shrink, ...)? Pure. */
export function item_matches_power(item, selected) {
    const base = resolve_default_power(item)
    if (base === 'other') { return false }
    return base === selected || (GROUPS[base] ?? []).includes(selected)
}

const normalize = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Filters `[value, label]` entries by a search text (all words must be contained in the label or the value; accents/case ignored). Pure. */
export function filter_powers(entries, query) {
    const words = normalize(query).split(/\s+/).filter(Boolean)
    if (!words.length) { return entries }
    return entries.filter(([value, label]) => {
        const hay = `${normalize(label)} ${normalize(value)}`
        return words.every((w) => hay.includes(w))
    })
}

export async function effect_builder(data = false) {
    const targets = game.user.targets
    const {speaker, character, actor, token, item} = await swim.get_data_variables(data, false)

    if (!token || canvas.tokens.controlled.length > 1 || targets.size === 0) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleTargetMultiToken"))
        return
    }
    await SwimWindow.show(new EffectBuilderApp(token, Array.from(targets), item))
}

class EffectBuilderApp extends SwimWindow {
    #token
    #targets
    #item
    #noPP
    #concentration
    #maintID
    #focusSearch = true

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, { id: 'swim-effect-builder', width: 520 })
    }

    get title() { return t('SWIM.dialogue-powerEffectBuilderTitle') }

    constructor(token, targets, item) {
        super()
        this.#token = token
        this.#targets = targets
        this.#item = item
        this.#noPP = game.settings.get("swim", "noPowerPoints")
        this.#concentration = token.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-concentration") && i.type === "edge")
        this.#maintID = swim.generate_id()
        this.state = {
            power: resolve_default_power(item), search: '',
            raise: false, strong: false, damage: false, quickness: false,
            protectionAmount: '2', protectionType: 'armor', damageBonus: '2', sizeAmount: '1', dieSteps: '1', deflection: 'Melee',
            otherPower: item?.name ?? '', durRounds: '0', durMinutes: '0',
        }
        if (this.state.power === 'shrink') { this.state.sizeAmount = '-1' }
    }

    /* ------------------------------- rendering ------------------------------ */

    #powerEntries() {
        const entries = POWERS.map(([value, key]) => [value, t(key)])
        const other = entries.pop()
        entries.sort((a, b) => a[1].localeCompare(b[1], game.i18n.lang, { sensitivity: 'base' }))
        return [...entries, other] // 'Other' stays last
    }

    #select(field, items, selected) {
        return `<select data-field="${field}">${items.map(([v, l]) => `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`
    }

    #row(label, control) {
        return `<div class="swim-hc-lab swim-hc-lab2">${esc(label)}</div><div class="swim-hc-ctl">${control}</div>`
    }

    #number(field, attrs = '') {
        return `<input type="number" data-field="${field}" value="${esc(this.state[field])}" ${attrs}>`
    }

    /** Per target: attributes A-Z, then the target's skills A-Z. */
    #traitSelects() {
        const attrs = ATTRIBUTES.map(([id, key]) => [id, `${t('SWIM.effectWin.attribute')} ${t(key)}`])
            .sort((a, b) => a[1].localeCompare(b[1], game.i18n.lang, { sensitivity: 'base' }))
        return this.#targets.map((tg) => {
            const skills = tg.actor.items.filter((s) => s.type === "skill").map((s) => s.name)
                .sort((a, b) => a.localeCompare(b, game.i18n.lang, { sensitivity: 'base' }))
                .map((n) => [n, `${t('SWIM.effectWin.skill')} ${n}`])
            const field = `trait:${tg.id}`
            if (this.state[field] === undefined) { this.state[field] = 'agility' }
            return this.#row(`${t('SWIM.dialogue-powerEffectBuilderAffectedTraitOf')} (${tg.name})`, this.#select(field, [...attrs, ...skills], this.state[field]))
        }).join('')
    }

    #weaponSelects() {
        return this.#targets.map((tg) => {
            const weapons = tg.actor.items.filter((w) => w.type === "weapon" && w.system.quantity >= 1).map((w) => [w.name, w.name])
            if (!weapons.length) { return '' }
            const field = `weapon:${tg.id}`
            if (!weapons.some(([n]) => n === this.state[field])) { this.state[field] = weapons[0][0] }
            return this.#row(`${t('SWIM.dialogue-powerEffectBuilderSmiteWeaponOf')} ${tg.name}`, this.#select(field, weapons, this.state[field]))
        }).join('')
    }

    #optionsHtml() {
        const st = this.state
        const p = st.power
        let html = ''
        const text = (s) => `<div class="swim-hc-preview">${s}</div>`
        if (p === 'boost' || p === 'lower') { html += this.#traitSelects() }
        if (p === 'protection') {
            html += this.#row(t('SWIM.effectWin.amount'), this.#number('protectionAmount', 'min="1"'))
            html += `<div class="swim-hc-rate swim-us-two" style="margin-top:6px">${rate_opt('protectionType', 'value', 'armor', t('SWIM.effectWin.armour'), st.protectionType === 'armor')}${rate_opt('protectionType', 'value', 'toughness', t('SWIM.effectWin.toughness'), st.protectionType === 'toughness')}</div>`
        }
        if (p === 'smite') {
            html += this.#weaponSelects()
            html += this.#row(t('SWIM.effectWin.amount'), this.#number('damageBonus', 'min="1"'))
        }
        if (p === 'growth') { html += this.#row(t('SWIM.effectWin.growthAmount'), this.#number('sizeAmount', 'min="1"')) }
        if (p === 'shrink') { html += this.#row(t('SWIM.effectWin.shrinkAmount'), this.#number('sizeAmount', 'max="-1"')) }
        if (p === 'burden-tes') { html += text(t('SWIM.effectWin.burdenHint')) + this.#row(t('SWIM.effectWin.dieSteps'), this.#number('dieSteps')) }
        if (p === 'deflection') {
            html += this.#row(t('SWIM.effectWin.attackType'), this.#select('deflection', [['Melee', t('SWIM.gameTerm-Melee')], ['Ranged', t('SWIM.gameTerm-Ranged')], ['Raise', t('SWIM.gameTerm-Raise')]], st.deflection))
        }
        if (p === 'light') { html += text(t('SWIM.effectWin.lightHint')) }
        if (p === 'other') {
            const powers = this.#token.actor.items.filter((i) => i.type === "power").map((i) => i.name)
            if (powers.length) {
                if (!powers.includes(st.otherPower)) { st.otherPower = powers[0] }
                html += this.#row(t('SWIM.effectWin.power'), this.#select('otherPower', powers.map((n) => [n, n]), st.otherPower))
            } else {
                html += text(t('SWIM.effectWin.noPowers'))
            }
            if (!this.#noPP) {
                html += this.#row(t('SWIM.effectWin.durationRounds'), this.#number('durRounds', 'min="0"'))
                html += this.#row(t('SWIM.effectWin.durationMinutes'), this.#number('durMinutes', 'min="0"'))
            }
        }
        let checks = ''
        if (p === 'speed') { checks += checkbox('quickness', t('SWIM.effectWin.quickness'), st.quickness) }
        if (p === 'burrow' || p === 'conceal') { checks += checkbox('strong', t('SWIM.effectWin.strong'), st.strong) }
        if (p === 'damageField') { checks += checkbox('damage', t('SWIM.effectWin.damageMod'), st.damage) }
        if (RAISE.has(p)) { checks += checkbox('raise', t(p === 'light' ? 'SWIM.effectWin.beam' : 'SWIM.effectWin.raise'), st.raise) }
        if (checks) { html += `<div class="swim-hc-ctl" style="margin-top:8px">${checks}</div>` }
        if (!html || NOTHING.has(p)) { html = text(t('SWIM.effectWin.nothing')) }
        return html
    }

    async view() {
        const st = this.state
        const entries = this.#powerEntries()
        const visible = new Set(filter_powers(entries, st.search).map(([v]) => v))
        const items = entries.map(([v, l]) => `<div class="swim-eb-item ${v === st.power ? 'is-on' : ''}" data-action="power" data-value="${esc(v)}" tabindex="0" role="option" aria-selected="${v === st.power}" ${visible.has(v) ? '' : 'hidden'}>${esc(l)}</div>`).join('')
        const chips = this.#targets.map((tg) => `<span class="swim-hc-chip"><img src="${esc(token_img(tg))}" alt="" width="18" height="18"> ${esc(tg.name)}</span>`).join(' ')
        const selectedLabel = entries.find(([v]) => v === st.power)?.[1] ?? ''
        return {
            head: tokens_header([{ token: this.#token, small: t('SWIM.effectWin.caster') }]),
            body: `<div class="swim-hc-result"><p>${t('SWIM.effectWin.hint', { caster: esc(this.#token.name) })}</p></div>
                <div class="swim-hc-lab">${esc(t('SWIM.effectWin.targets'))}</div><div class="swim-fear-targets">${chips}</div>
                <div class="swim-hc-lab swim-hc-lab2">${esc(t('SWIM.effectWin.power'))}</div>
                <div class="swim-hc-ctl"><input type="text" class="swim-eb-search" placeholder="${esc(t('SWIM.effectWin.search'))}" value="${esc(st.search)}" autocomplete="off"></div>
                <div class="swim-eb-list" role="listbox">${items}<div class="swim-eb-none" ${visible.size ? 'hidden' : ''}>${esc(t('SWIM.effectWin.noMatch'))}</div></div>
                <div class="swim-hc-lab swim-hc-lab2">${esc(selectedLabel)}</div>
                <div class="swim-eb-options">${this.#optionsHtml()}</div>`,
            foot: `<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('apply', t('SWIM.effectWin.apply'), { go: true, disabled: this.busy })}`,
        }
    }

    /* ------------------------------- interaction ----------------------------- */

    activateListeners(html) {
        super.activateListeners(html)
        const list = html.find('.swim-eb-list')
        const items = () => list.find('.swim-eb-item:not([hidden])').toArray()
        // Filter while typing: only toggles the items (a re-render would take the focus away from the search field).
        html.on('input', '.swim-eb-search', (ev) => {
            this.state.search = ev.currentTarget.value
            const visible = new Set(filter_powers(this.#powerEntries(), this.state.search).map(([v]) => v))
            list.find('.swim-eb-item').each((_, el) => { el.hidden = !visible.has(el.dataset.value) })
            list.find('.swim-eb-none')[0].hidden = visible.size > 0
        })
        html.on('keydown', '.swim-eb-search', (ev) => {
            if (ev.key === 'Enter') {
                ev.preventDefault()
                const first = items()[0]
                if (first) { this.onAction('power', first) }
            } else if (ev.key === 'ArrowDown') {
                ev.preventDefault()
                items()[0]?.focus()
            } else if (ev.key === 'Escape' && this.state.search) {
                ev.stopPropagation()
                ev.currentTarget.value = ''
                ev.currentTarget.dispatchEvent(new Event('input', { bubbles: true }))
            }
        })
        html.on('keydown', '.swim-eb-item', (ev) => {
            if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') { return }
            ev.preventDefault()
            const all = items()
            const i = all.indexOf(ev.currentTarget)
            if (ev.key === 'ArrowUp' && i <= 0) { return html.find('.swim-eb-search').trigger('focus') }
            all[Math.min(Math.max(i + (ev.key === 'ArrowDown' ? 1 : -1), 0), all.length - 1)]?.focus()
        })
        list.find('.is-on')[0]?.scrollIntoView({ block: 'nearest' })
        if (this.#focusSearch) {
            this.#focusSearch = false
            html.find('.swim-eb-search').trigger('focus')
        }
    }

    async onAction(action, el) {
        const st = this.state
        switch (action) {
            case 'power':
                if (st.power === el.dataset.value) { return }
                st.power = el.dataset.value
                if (st.power === 'growth') { st.sizeAmount = '1' } else if (st.power === 'shrink') { st.sizeAmount = '-1' }
                st.raise = false
                return this.render(false)
            case 'protectionType':
                if (st.protectionType === el.dataset.value) { return }
                st.protectionType = el.dataset.value
                return this.render(false)
            case 'cancel': return this.close()
            case 'apply': {
                this.busy = true
                let done = false
                try { done = await this.#submit() } finally { this.busy = false }
                if (done) { return this.close() }
            }
        }
    }

    /** The caster's power item for the chosen power: the passed item (if it is that power), the chosen one for 'Other', else found by name. */
    #findPower(selected, powerName) {
        if (selected === 'other') { return this.#token.actor.items.find((p) => p.type === "power" && p.name === powerName) }
        if (this.#item && item_matches_power(this.#item, selected)) { return this.#item }
        return this.#token.actor.items.find((p) => p.name.toLowerCase().includes(powerName.toLowerCase()) && p.type === "power")
    }

    /** Collects the data (same payload as before) and hands it to the GM. Returns false if the input is invalid. */
    async #submit() {
        const st = this.state
        const selected = st.power
        const token = this.#token
        const noPP = this.#noPP
        const concentration = this.#concentration
        const targetIDs = this.#targets.map((tg) => tg.id)
        const casterIsTarget = targetIDs.includes(token.id)
        const usePowerIcons = game.settings.get("swim", "effectBuilder-usePowerIcons")
        const powerName = selected === "other" ? st.otherPower : game.i18n.localize(`SWIM.power-${selected}`)
        const power = this.#findPower(selected, powerName)

        const data = {
            sceneID: game.scenes.current.id, targetIDs, casterID: token.id, maintenanceID: this.#maintID,
            type: selected, powerID: power?._id,
            icon: usePowerIcons && power ? power.img : false,
            duration: 5, durationRounds: 5, durationSeconds: undefined, noPP, concentration,
        }
        const degree = () => (RAISE.has(selected) && st.raise ? "raise" : "success")

        switch (selected) {
            case "boost":
            case "lower":
                data.degree = degree()
                data.traits = this.#targets.map((tg) => ({ targetID: tg.id, traitName: st[`trait:${tg.id}`] }))
                break
            case "protection":
                data.bonus = Number(st.protectionAmount)
                data.protectionType = st.protectionType
                break
            case "smite":
                data.bonus = Number(st.damageBonus)
                // Only targets that have a weapon to choose from.
                data.weapons = this.#targets.filter((tg) => st[`weapon:${tg.id}`]).map((tg) => ({ targetID: tg.id, weaponName: st[`weapon:${tg.id}`] }))
                break
            case "growth":
            case "shrink":
                data.change = Number(st.sizeAmount)
                break
            case "sloth":
                data.change = 0.5
                data.duration = 1
                break
            case "speed":
                data.change = 2
                data.quickness = !!st.quickness
                break
            case "deflection":
                data.deflectionType = st.deflection
                break
            case "burden-tes":
                data.change = Number(st.dieSteps)
                if (!data.change) {
                    ui.notifications.warn(game.i18n.localize("SWIM.notififaction.enterNumberUnequalZero"))
                    return false
                }
                data.durationNoCombat = concentration ? 20 * 60 : 10 * 60
                break
            case "confusion":
                break
            case "damageField":
                data.damage = !!st.damage
                break
            case "other":
                data.degree = degree()
                data.durationRounds = noPP ? Number(999999999999999) : Number(st.durRounds)
                data.durationSeconds = noPP ? Number(999999999999999) : (Number(st.durMinutes) / 60)
                if (data.durationRounds === 0 && data.durationSeconds > 0) {
                    data.durationRounds = data.durationSeconds * 6
                } else if (data.durationSeconds === 0 && data.durationRounds > 0) {
                    data.durationSeconds = undefined
                } else if (data.durationRounds === 0 && data.durationSeconds === 0) {
                    data.durationRounds = concentration ? 10 : 5
                }
                break
            default: // all other powers: Raise (if offered) and the Strong modifier
                data.degree = degree()
                if (["beastFriend", "invisibility", "relief"].includes(selected)) { data.caster = token.name }
                if (selected === "burrow" || selected === "conceal") { data.strong = !!st.strong }
        }

        // Flag for caster penalty effect
        if (!casterIsTarget && !(["confusion", "blind", "relief", "sloth"].includes(selected))) {
            data.addCasterPenalty = true
        }

        data.power = power
        await execute_as_gm("effectBuilder", data)
        return true
    }
}

// ============================================================================
// PART 2: GM-Side Effect Creation
// ============================================================================

export async function effect_builder_gm(data) {
    const noPP = game.settings.get("swim", "noPowerPoints")
    const type = data.type
    const casterID = data.casterID
    const playerScene = game.scenes.get(data.sceneID)
    const caster = playerScene.tokens.get(casterID)
    const casterIsTarget = data.targetIDs.find(t => t === casterID)

    // Find the power being used
    const power = data.powerID
        ? caster.actor.items.find(p => p.id === data.powerID)
        : caster.actor.items.find(p => p.name.toLowerCase().includes(game.i18n.localize(`SWIM.power-${type}`).toLowerCase()) && p.type === "power")

    // ========================================================================
    // Calculate additional changes for caster When caster is also a target
    // and noPP is true, we need to apply the spellcasting penalty
    // (-1 to skill) and maintainedPowers counter (mainly for Hellfrost).
    // ========================================================================
    let additionalChange = []
    if (casterIsTarget && noPP && !(["blind","confusion","sloth"].includes(type))) {
        if (power) {
            const skillName = power.system.actions.trait
            additionalChange.push({
                key: `@Skill{${skillName}}[system.die.modifier]`,
                mode: 2,
                priority: undefined,
                value: -1
            })
            if (caster.actor.system.additionalStats?.maintainedPowers) {
                additionalChange.push({
                    key: `system.additionalStats.maintainedPowers.value`,
                    mode: 2,
                    priority: undefined,
                    value: 1
                })
            }
        } else if (caster.actor.system.additionalStats?.maintainedPowers) {
            additionalChange.push({
                key: `system.additionalStats.maintainedPowers.value`,
                mode: 2,
                priority: undefined,
                value: 1
            })
        }
    }

    // Common flags for all effects
    const commonFlags = {
        maintainedPower: true,
        maintaining: game.i18n.localize(`SWIM.power-${type}`),
        targets: data.targetIDs,
        maintenanceID: data.maintenanceID,
        owner: false,
        powerID: power?.id,
        affected: true
    }

    // Duration helper
    const getDuration = (target, baseDur) => {
        if (power || noPP) {
            return {
                rounds: Number(999999999999999),
                seconds: Number(999999999999999),
                startRound: target.combatant != null ? game.combat.round : 0
            }
        }
        return {
            rounds: baseDur,
            startRound: target.combatant != null ? game.combat.round : 0
        }
    }

    // ========================================================================
    // Icon mapping
    // ========================================================================
    const ICONS = {
        boost: "modules/swim/assets/icons/effects/m-boost.svg",
        lower: "modules/swim/assets/icons/effects/m-lower.svg",
        protection: "modules/swim/assets/icons/effects/m-protection.svg",
        smite: "modules/swim/assets/icons/effects/m-smite.svg",
        growth: "modules/swim/assets/icons/effects/m-growth.svg",
        shrink: "modules/swim/assets/icons/effects/m-shrink.svg",
        sloth: "modules/swim/assets/icons/effects/m-sloth.svg",
        speed: "modules/swim/assets/icons/effects/m-speed.svg",
        quickness: "modules/swim/assets/icons/effects/m-quickness.svg",
        burden: "modules/swim/assets/icons/effects/m-burden.svg",
        easeBurden: "modules/swim/assets/icons/effects/m-ease_burden.svg",
        beastFriend: "modules/swim/assets/icons/effects/m-beastFriend.svg",
        confusion: "modules/swim/assets/icons/effects/m-confusion.svg",
        deflection: "modules/swim/assets/icons/effects/m-deflection.svg",
        arcaneProtection: "modules/swim/assets/icons/effects/m-arcaneProtection.svg",
        burrow: "modules/swim/assets/icons/effects/m-burrow.svg",
        damageField: "modules/swim/assets/icons/effects/m-damageField.svg",
        darksight: "modules/swim/assets/icons/effects/m-darksight.svg",
        concealArcana: "modules/swim/assets/icons/effects/m-concealArcana.svg",
        detectArcana: "modules/swim/assets/icons/effects/m-detectArcana.svg",
        disguise: "modules/swim/assets/icons/effects/m-disguise.svg",
        elementalManipulation: "modules/swim/assets/icons/effects/m-elementalManipulation.svg",
        empathy: "modules/swim/assets/icons/effects/m-empathy.svg",
        environmentalProtection: "modules/swim/assets/icons/effects/m-environmentalProtection.svg",
        farsight: "modules/swim/assets/icons/effects/m-farsight.svg",
        fly: "modules/swim/assets/icons/effects/m-fly.svg",
        intangibility: "modules/swim/assets/icons/effects/m-intangibility.svg",
        invisibility: "modules/succ/assets/icons/m-invisible.svg",
        light: "modules/swim/assets/icons/effects/m-light.svg",
        mindLink: "modules/swim/assets/icons/effects/m-mindLink.svg",
        puppet: "modules/swim/assets/icons/effects/m-puppet.svg",
        relief: "modules/swim/assets/icons/effects/m-reliefNumb.svg",
        slumber: "modules/swim/assets/icons/effects/m-slumber.svg",
        silence: "modules/swim/assets/icons/effects/m-silence.svg",
        speakLanguage: "modules/swim/assets/icons/effects/m-speakLanguage.svg",
        wallWalker: "modules/swim/assets/icons/effects/m-wallWalker.svg",
        warriorsGift: "modules/swim/assets/icons/effects/m-warriorsGift.svg",
        blind: "modules/swim/assets/icons/effects/m-blind.svg"
    }

    const getIcon = (type) => data.icon || ICONS[type] || false

    // ========================================================================
    // Effect Name Generator
    // ========================================================================
    const getEffectName = (type, data) => {
        switch (type) {
            case "protection":
                return `${game.i18n.localize("SWIM.power-protection")} (${game.i18n.localize(`SWIM.gameTerm-${data.protectionType}`).toLowerCase()})`
            case "smite":
                return `${game.i18n.localize("SWIM.power-smite")} (${data.bonus > 0 ? '+' : ''}${data.bonus})`
            case "burden":
                return data.change > 0
                    ? game.i18n.localize("SWIM.power-easeBurden-tes")
                    : game.i18n.localize("SWIM.power-burden-tes")
            case "invisibility":
                return data.degree === "raise"
                    ? `${game.i18n.localize("SWIM.power-invisibility")} (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                    : game.i18n.localize("SWIM.power-invisibility")
            case "beastFriend":
                return `${data.caster}'s ${game.i18n.localize("SWIM.power-beastFriend")}${data.degree === "raise" ? ` (${game.i18n.localize("SWIM.raise").toLowerCase()})` : ''}`
            case "burrow": {
                let label = game.i18n.localize("SWIM.power-burrow")
                if (data.degree === "raise") label += ` (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                if (data.strong) label += ` (${game.i18n.localize("SWIM.modifierStrong").toLowerCase()})`
                return label
            }
            case "concealArcana":
                return data.strong
                    ? `${game.i18n.localize("SWIM.power-concealArcana")} (${game.i18n.localize("SWIM.modifierStrong").toLowerCase()})`
                    : game.i18n.localize("SWIM.power-concealArcana")
            case "deflection":
                return `${game.i18n.localize("SWIM.power-deflection")} (${game.i18n.localize(`SWIM.gameTerm-${data.deflectionType}`).toLowerCase()})`
            case "fly":
                return data.degree === "raise"
                    ? `${game.i18n.localize("SWADE.Flying")} (24\")`
                    : `${game.i18n.localize("SWADE.Flying")} (12\")`
            case "relief":
                return data.degree === "raise"
                    ? `${game.i18n.localize("SWIM.power-relief")}: ${game.i18n.localize("SWIM.power-relief_numb")} (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                    : `${game.i18n.localize("SWIM.power-relief")}: ${game.i18n.localize("SWIM.power-relief_numb")}`
            case "light":
                return data.degree === "raise"
                    ? `${game.i18n.localize("SWIM.power-light")} (${game.i18n.localize("SWIM.beam")})`
                    : game.i18n.localize("SWIM.power-light")
            case "blind":
                return data.degree === "raise"
                    ? `${game.i18n.localize("SWIM.power-blind")} (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                    : game.i18n.localize("SWIM.power-blind")
            case "damageField":
                return data.damage
                    ? `${game.i18n.localize("SWIM.power-damageField")} (2d6)`
                    : `${game.i18n.localize("SWIM.power-damageField")} (2d4)`
            case "puppet":
                return `${data.casterName}'s ${game.i18n.localize("SWIM.power-puppet")}${data.degree === "raise" ? ` (${game.i18n.localize("SWIM.raise").toLowerCase()})` : ''}`
            case "other":
                return data.degree === "raise"
                    ? `${power.name} (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                    : power.name
            default:
                const raisePowers = ["arcaneProtection", "darksight", "detectArcana", "disguise",
                    "elementalManipulation", "empathy", "environmentalProtection", "farsight",
                    "mindLink", "silence", "speakLanguage", "wallWalker", "warriorsGift"]
                if (raisePowers.includes(type)) {
                    return data.degree === "raise"
                        ? `${game.i18n.localize(`SWIM.power-${type}`)} (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                        : game.i18n.localize(`SWIM.power-${type}`)
                }
                return game.i18n.localize(`SWIM.power-${type}`)
        }
    }

    // ========================================================================
    // Expiration Times
    // ========================================================================
    const EXPIRATION = {
        relief: 2, confusion: 2, sloth: 3, growth: 3, shrink: 3, speed: 3,
        burden: 3, beastFriend: 3, invisibility: 3, deflection: 3, arcaneProtection: 3,
        burrow: 3, damageField: 3, darksight: 3, concealArcana: 3, detectArcana: 3,
        disguise: 3, elementalManipulation: 3, empathy: 3, environmentalProtection: 3,
        farsight: 3, fly: 3, intangibility: 3, light: 3, mindLink: 3,
        puppet: 3, slumber: 3, silence: 3, speakLanguage: 3, wallWalker: 3, warriorsGift: 3, blind: 3
    }

    // ========================================================================
    // Helper: Create effect with proper handling of additionalChanges
    // ========================================================================
    const createEffect = async (targetID, effectData) => {
        const target = playerScene.tokens.get(targetID)
        const isCaster = targetID === casterID

        if (isCaster && additionalChange.length > 0) {
            effectData.changes = (effectData.changes || []).concat(additionalChange)
        }

        if (isCaster && noPP && effectData.duration) {
            effectData.duration.rounds = Number(999999999999999)
            if (effectData.duration.seconds !== undefined) {
                effectData.duration.seconds = Number(999999999999999)
            }
        }

        await target.actor.createEmbeddedDocuments('ActiveEffect', [effectData])
    }

    // ========================================================================
    // Power Type Handler with Dispatch pattern
    // ========================================================================
    const handlers = {
        // BOOST
        async boost() {
            for (const target of data.traits) {
                const targetToken = playerScene.tokens.get(target.targetID)
                const isCaster = target.targetID === casterID
                const baseDur = data.duration || 5
                const duration = getDuration(targetToken, baseDur)

                let keyPath, traitName
                const traitValue = target.traitName

                if (["agility", "smarts", "spirit", "strength", "vigor"].includes(traitValue)) {
                    keyPath = `system.attributes.${traitValue}.die.sides`
                    traitName = game.i18n.localize(ATTRIBUTE_KEYS[traitValue])
                } else {
                    const skill = targetToken.actor.items.find(s => s.name.toLowerCase() === traitValue.toLowerCase())
                    keyPath = `@Skill{${skill?.name}}[system.die.sides]`
                    traitName = skill?.name || traitValue
                }

                const valueMod = data.degree === "raise" ? 4 : 2

                let aeData = {
                    changes: [{
                        key: keyPath,
                        mode: 2,
                        priority: undefined,
                        value: valueMod
                    }],
                    icon: data.icon || ICONS.boost,
                    name: `${game.i18n.localize("SWIM.power-boostTrait")} (${traitName})`,
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }
                await createEffect(target.targetID, aeData)
            }
        },

        // LOWER
        async lower() {
            for (const target of data.traits) {
                const targetToken = playerScene.tokens.get(target.targetID)
                const isCaster = target.targetID === casterID
                const baseDur = data.duration || 5
                const duration = getDuration(targetToken, baseDur)

                let keyPath, traitName
                const traitValue = target.traitName

                if (["agility", "smarts", "spirit", "strength", "vigor"].includes(traitValue)) {
                    keyPath = `system.attributes.${traitValue}.die.sides`
                    traitName = game.i18n.localize(ATTRIBUTE_KEYS[traitValue])
                } else {
                    const skill = targetToken.actor.items.find(s => s.name.toLowerCase() === traitValue.toLowerCase())
                    keyPath = `@Skill{${skill?.name}}[system.die.sides]`
                    traitName = skill?.name || traitValue
                }

                const valueMod = data.degree === "raise" ? -4 : -2

                let aeData = {
                    changes: [{
                        key: keyPath,
                        mode: 2,
                        priority: undefined,
                        value: valueMod
                    }],
                    icon: data.icon || ICONS.lower,
                    name: `${game.i18n.localize("SWIM.power-lowerTrait")} (${traitName})`,
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }
                await createEffect(target.targetID, aeData)
            }
        },

        // PROTECTION
        async protection() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID
                const baseDur = data.duration || 5
                const duration = getDuration(target, baseDur)

                const type = data.protectionType.charAt(0).toUpperCase() + data.protectionType.slice(1)
                const isArmor = type === "Armor"

                let aeData = {
                    changes: [{
                        key: isArmor ? `system.stats.toughness.armor` : `system.stats.toughness.value`,
                        mode: 2,
                        priority: undefined,
                        value: data.bonus
                    }],
                    icon: data.icon || ICONS.protection,
                    name: `${game.i18n.localize("SWIM.power-protection")} (${type.toLowerCase()})`,
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }
                await createEffect(targetID, aeData)
            }
        },

        // SMITE
        async smite() {
            for (const target of data.weapons) {
                const targetToken = playerScene.tokens.get(target.targetID)
                const isCaster = target.targetID === casterID
                const baseDur = data.duration || 5
                const duration = getDuration(targetToken, baseDur)

                let aeData = {
                    changes: [{
                        key: `@Weapon{${target.weaponName}}[system.actions.dmgMod]`,
                        mode: 2,
                        priority: undefined,
                        value: data.bonus
                    }],
                    icon: data.icon || ICONS.smite,
                    name: `${game.i18n.localize("SWIM.power-smite")} (${target.weaponName})`,
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }
                await createEffect(target.targetID, aeData)
            }
        },

        // GROWTH
        async growth() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID
                const baseDur = data.duration || 5
                const duration = getDuration(target, baseDur)
                const change = data.change

                let aeData = {
                    changes: [],
                    icon: data.icon || ICONS.growth,
                    name: game.i18n.localize("SWIM.power-growth"),
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }

                const targetStr = target.actor.system.attributes.strength.die.sides + change * 2
                if (targetStr <= 12) {
                    aeData.changes.push({
                        key: `system.attributes.strength.die.sides`,
                        mode: 2,
                        value: change * 2
                    })
                } else {
                    const toMax = 12 - target.actor.system.attributes.strength.die.sides
                    const rest = change - (toMax / 2)
                    aeData.changes.push({
                        key: `system.attributes.strength.die.sides`,
                        mode: 2,
                        value: toMax
                    })
                    aeData.changes.push({
                        key: `system.attributes.strength.die.modifier`,
                        mode: 2,
                        value: rest
                    })
                }

                aeData.changes.push({
                    key: `system.stats.size`,
                    mode: 2,
                    value: change
                })

                if (target.actor.system.details.autoCalcToughness === false) {
                    aeData.changes.push({
                        key: `system.stats.toughness.value`,
                        mode: 2,
                        value: change
                    })
                }

                await createEffect(targetID, aeData)
            }
        },

        // RELIEF
        async relief() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID

                const duration = {
                    seconds: Number(3600),
                    rounds: Number(600),
                    startRound: target.combatant != null ? game.combat.round : 0
                }

                let aeData = {
                    changes: [{
                        key: `system.woundsOrFatigue.ignored`,
                        mode: 2,
                        value: data.degree === "raise" ? 2 : 1
                    }],
                    icon: data.icon || ICONS.relief,
                    name: data.degree === "raise"
                        ? `${game.i18n.localize("SWIM.power-relief")}: ${game.i18n.localize("SWIM.power-relief_numb")} (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                        : `${game.i18n.localize("SWIM.power-relief")}: ${game.i18n.localize("SWIM.power-relief_numb")}`,
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 2 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true,
                            maintainedPower: false
                        }
                    }
                }
                await createEffect(targetID, aeData)
            }
        },

        // SHRINK
        async shrink() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID
                const baseDur = data.duration || 5
                const duration = getDuration(target, baseDur)
                const change = data.change

                let aeData = {
                    changes: [],
                    icon: data.icon || ICONS.shrink,
                    name: game.i18n.localize("SWIM.power-shrink"),
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }

                const targetStr = target.actor.system.attributes.strength.die.sides + change * 2
                if (targetStr <= 4) {
                    const toMin = 4 - target.actor.system.attributes.strength.die.sides
                    aeData.changes.push({
                        key: `system.attributes.strength.die.sides`,
                        mode: 2,
                        value: toMin
                    })
                } else {
                    aeData.changes.push({
                        key: `system.attributes.strength.die.sides`,
                        mode: 2,
                        value: change * 2
                    })
                }

                aeData.changes.push({
                    key: `system.stats.size`,
                    mode: 2,
                    value: change
                })

                if (target.actor.system.details.autoCalcToughness === false) {
                    aeData.changes.push({
                        key: `system.stats.toughness.value`,
                        mode: 2,
                        value: change
                    })
                }

                await createEffect(targetID, aeData)
            }
        },

        // SPEED
        async speed() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID
                const baseDur = data.duration || 5
                const duration = getDuration(target, baseDur)
                const change = data.change

                let aeData = {
                    changes: [{
                        key: `system.stats.speed.value`,
                        mode: 5,
                        value: target.actor.system.stats.speed.value * change
                    }],
                    icon: data.quickness ? (data.icon || ICONS.quickness) : (data.icon || ICONS.speed),
                    name: data.quickness
                        ? game.i18n.localize("SWIM.power-speedQuickness")
                        : game.i18n.localize("SWIM.power-speed"),
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }
                await createEffect(targetID, aeData)
            }
        },

        // SLOTH
        async sloth() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const change = data.change || 0.5

                let duration = {}
                if (target.combatant != null) {
                    duration = {
                        rounds: 0,
                        startRound: game.combat.round,
                        startTurn: 0,
                        turns: 1
                    }
                }

                let aeData = {
                    changes: [{
                        key: `system.stats.speed.value`,
                        mode: 5,
                        value: Math.round(target.actor.system.stats.speed.value * change)
                    }],
                    icon: data.icon || ICONS.sloth,
                    name: game.i18n.localize("SWIM.power-sloth"),
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            maintainedPower: false
                        }
                    }
                }
                await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData])
            }
        },

        // BURDEN / EASE BURDEN
        async burden() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID
                const change = data.change

                const duration = {
                    rounds: noPP ? Number(999999999999999) : (data.duration || 5),
                    seconds: noPP ? Number(999999999999999) : data.durationNoCombat,
                    startRound: target.combatant != null ? game.combat.round : 0
                }

                let aeData = {
                    changes: [{
                        key: `system.attributes.strength.encumbranceSteps`,
                        mode: 2,
                        value: change
                    }],
                    icon: change > 0 ? ICONS.easeBurden : (data.icon || ICONS.burden),
                    name: change > 0
                        ? game.i18n.localize("SWIM.power-easeBurden-tes")
                        : game.i18n.localize("SWIM.power-burden-tes"),
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }
                await createEffect(targetID, aeData)
            }
        },

        // BEAST FRIEND
        async beastFriend() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID

                const duration = {
                    seconds: noPP ? Number(999999999999999) : data.durationNoCombat,
                    rounds: noPP ? Number(999999999999999) : (data.duration || 5) / 6,
                    startRound: target.combatant != null ? game.combat.round : 0
                }

                let aeData = {
                    changes: [],
                    icon: data.icon || ICONS.beastFriend,
                    name: data.degree === "raise"
                        ? `${data.caster}'s ${game.i18n.localize("SWIM.power-beastFriend")} (${game.i18n.localize("SWIM.raise").toLowerCase()})`
                        : `${data.caster}'s ${game.i18n.localize("SWIM.power-beastFriend")}`,
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }
                await createEffect(targetID, aeData)
            }
        },

        // CONFUSION
        async confusion() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)

                let duration = {}
                if (target.combatant != null) {
                    duration = {
                        rounds: 0,
                        startRound: game.combat.round,
                        startTurn: 0,
                        turns: 1
                    }
                }

                let aeData = {
                    changes: [
                        {key: `system.status.isDistracted`, mode: 5, value: true},
                        {key: `system.status.isVulnerable`, mode: 5, value: true}
                    ],
                    icon: data.icon || ICONS.confusion,
                    name: game.i18n.localize("SWIM.power-confusion"),
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: 2 },
                        swim: {
                            ...commonFlags,
                            maintainedPower: false
                        }
                    }
                }
                await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData])
            }
        },

        // GENERIC HANDLER - For all other power types
        async generic() {
            for (const targetID of data.targetIDs) {
                const target = playerScene.tokens.get(targetID)
                const isCaster = targetID === casterID
                const baseDur = data.duration || 5

                let duration = getDuration(target, baseDur)

                if (data.durationNoCombat !== undefined) {
                    duration.seconds = noPP ? Number(999999999999999) : data.durationNoCombat
                    duration.rounds = noPP ? Number(999999999999999) : (data.duration || baseDur) / 6
                }
                if (data.durationRounds !== undefined || data.durationSeconds !== undefined) {
                    duration.rounds = noPP ? Number(999999999999999) : data.durationRounds
                    duration.seconds = noPP ? Number(999999999999999) : data.durationSeconds
                }

                let aeData = {
                    changes: [],
                    icon: getIcon(type),
                    name: getEffectName(type, data),
                    duration,
                    description: power ? power.system.description : "",
                    flags: {
                        swade: { expiration: EXPIRATION[type] || 3 },
                        swim: {
                            ...commonFlags,
                            owner: isCaster,
                            affected: true
                        }
                    }
                }

                // Special cases
                if (type === "damageField") {
                    aeData.name = data.damage
                        ? `${game.i18n.localize("SWIM.power-damageField")} (2d6)`
                        : `${game.i18n.localize("SWIM.power-damageField")} (2d4)`
                }
                if (type === "darksight") {
                    aeData.changes = [
                        {"key": "ATL.sight.range", "value": "1000", "mode": 2, "priority": null},
                        {"key": "ATL.sight.visionMode", "value": "darkvision", "mode": 5, "priority": null}
                    ]
                }
                if (type === "puppet") {
                    aeData.name = `${data.casterName}'s ${game.i18n.localize("SWIM.power-puppet")}${data.degree === "raise" ? ` (${game.i18n.localize("SWIM.raise").toLowerCase()})` : ''}`
                }
                if (type === "light") {
                    const brightness = data.degree === "raise" ? "5" : "3"
                    const angle = data.degree === "raise" ? "52.5" : "360"
                    aeData.changes = [
                        {"key": "ATL.light.bright", "value": brightness, "mode": 5, "priority": null},
                        {"key": "ATL.light.animation", "value": "{type: \"sunburst\", speed: 1, intensity: 1}", "mode": 5, "priority": null},
                        {"key": "ATL.light.color", "value": "#fffa61", "mode": 5, "priority": null},
                        {"key": "ATL.light.alpha", "value": "0.25", "mode": 5, "priority": null},
                        {"key": "ATL.light.angle", "value": angle, "mode": 5, "priority": null}
                    ]
                }

                await createEffect(targetID, aeData)
            }
        }
    }

    // EXECUTE THE APPROPRIATE HANDLER
    const handler = handlers[type] || handlers.generic
    await handler.call(handlers)

    // CREATE CASTER PENALTY EFFECT (if needed)
    if (data.addCasterPenalty && power) {
        const skillName = power.system.actions.trait
        const durationRounds = data.durationRounds || (data.duration ? data.duration : 5)
        const durationSeconds = data.durationSeconds

        let aeData = {
            changes: [],
            icon: power.img,
            name: type === "other"
                ? game.i18n.format("SWIM.label-maintaining", {powerName: power.name})
                : game.i18n.format("SWIM.label-maintaining", {powerName: game.i18n.localize(`SWIM.power-${type}`)}),
            duration: {
                seconds: noPP ? Number(999999999999999) : durationSeconds,
                startRound: caster.combatant != null ? game.combat.round : 0,
                rounds: noPP ? Number(999999999999999) : durationRounds
            },
            description: power ? power.system.description : "",
            flags: {
                swade: { expiration: 3 },
                swim: {
                    ...commonFlags,
                    owner: true,
                    affected: false
                }
            }
        }

        if (noPP) {
            aeData.changes.push({
                key: `@Skill{${skillName}}[system.die.modifier]`,
                mode: 2,
                priority: undefined,
                value: -1
            })
        }

        if (caster.actor.system.additionalStats?.maintainedPowers) {
            aeData.changes.push({
                key: `system.additionalStats.maintainedPowers.value`,
                mode: 2,
                priority: undefined,
                value: 1
            })
        }

        await caster.actor.createEmbeddedDocuments('ActiveEffect', [aeData])
    }
}
