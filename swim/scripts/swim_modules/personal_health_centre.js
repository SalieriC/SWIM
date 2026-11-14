/*******************************************
 * Personal Health Centre
 * // v.8.0.0 – one dialog (HealthCentreApp) instead of a chain of Dialogs.
 * By SalieriC#8263; fixing bugs supported by FloRad#2142. Potion usage inspired by grendel111111#1603; asynchronous playback of sfx by Freeze#2689.
 *
 * The window: patient switch (Myself / Target, only if another token is targeted), Wounds / Fatigue blocks as tabs,
 * the methods that fit the patient (Natural Healing, Direct healing, Potion – or the result of a Healing roll for someone else),
 * a preview line and one confirm button. Natural Healing shows its roll inside the same window (Accept / Reroll with Benny).
 * Potions of the healer AND of the target can be used on the target (the GM handler `healPotion` consumes them).
 * Styles: styles/health-centre.css
 ******************************************/
import { execute_as_gm } from "../helpers/socket_helper.js"
import { swimConditions } from '../helpers/conditions.js'
import { play_audio } from '../helpers/audio.js'
import { get_list, is_potion_of, potion_amount } from '../helpers/swid_lists.js'

const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key))
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => `&#${m.charCodeAt(0)};`)
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Can this item be used as a potion? Regular gear is used up via `quantity`; SWADE consumables as long as charges are left on the stack. */
export function is_usable_potion_item(item) {
    if (item.type === "gear") { return Number(item.system.quantity) > 0 }
    if (item.type === "consumable") {
        const { quantity, charges } = item.system
        return ((Number(quantity) - 1) * Number(charges.max) + Number(charges.value)) > 0
    }
    return false
}

/** How many potions are left on this item (gear: quantity, consumable: charges over the whole stack). */
function potion_count(item) {
    if (item.type === "consumable") {
        const { quantity, charges } = item.system
        return (Number(quantity) - 1) * Number(charges.max) + Number(charges.value)
    }
    return Number(item.system.quantity)
}

/** Uses up one potion. Consumables go through SWADE's own `consume()` (uses a charge, handles stacks and deletes the item only if "destroy on empty" is checked), regular gear loses one `quantity` and is deleted at 0. */
async function use_potion_item(actor, item) {
    if (item.type === "consumable") {
        await item.consume(1)
    } else {
        await actor.updateEmbeddedDocuments("Item", [{ _id: item.id, "system.quantity": item.system.quantity - 1 }])
        if (item.system.quantity < 1) { item.delete() }
    }
}

/** Potion items of an actor for a track ('wounds' | 'fatigue'): their SWIDs are matched against the potion list of the SWIM Configuration. */
function potions_of(actor, track) {
    const entries = get_list('potionSwids')
    const type = track === 'wounds' ? 'health' : 'fatigue'
    return actor.items.filter((i) => is_potion_of(i, type, entries) && is_usable_potion_item(i))
}

/* ------------------------------------------------------------------------------------------------ */
/* Rules (pure helpers, also used for the preview)                                                  */
/* ------------------------------------------------------------------------------------------------ */

/** Healing wounds: Bleeding Out and Incapacitated are removed first and each uses up one healed Wound. */
export function simulate_wounds(wounds, bleeding, incapacitated, amount) {
    let n = Math.max(0, Number(amount) || 0)
    const removeBleed = bleeding && n > 0
    if (removeBleed) { n-- }
    const removeInc = incapacitated && n > 0
    if (removeInc) { n-- }
    const healed = Math.max(0, Math.min(n, wounds))
    return { removeBleed, removeInc, healed, overflow: n > wounds, newWounds: wounds - healed }
}

/** What heal_other_gm() will do for a Healing roll result – only for the preview text. Mirrors the handler. */
export function other_outcome({ rating, track, combat, wounds, woundsMax, bleeding, incapacitated, heartAttack, fatigue }) {
    const notes = []
    if (rating === 'fa') { return [['noteNothing']] }
    if (track === 'fatigue') {
        if (rating === 'cf') { return [['noteNothing']] }
        const n = Math.min(rating === 'ra' ? 2 : 1, fatigue)
        notes.push(['noteFatigue', { n }])
        notes.push([rating === 'ra' ? 'noteReliefRaise' : 'noteReliefSuccess'])
        return notes
    }
    if (rating === 'cf') {
        if (wounds >= woundsMax) { notes.push([incapacitated ? 'noteCritFailBleed' : 'noteCritFailIncap']) }
        else { notes.push(['noteCritFailWound']) }
        return notes
    }
    if (heartAttack) { return [['noteHeart']] }
    if (rating === 'su') {
        if (bleeding) { return [['noteBleed']] }
        if (incapacitated) {
            notes.push(['noteIncap'])
            if (!combat) { notes.push(['noteHeal', { n: Math.min(1, wounds) }]) }
            return notes
        }
        return [['noteHeal', { n: Math.min(1, wounds) }]]
    }
    // raise
    let amount = 2
    if (bleeding) { notes.push(['noteBleed']); amount-- }
    if (incapacitated) { notes.push(['noteIncap']); if (combat) { amount = 0 } }
    if (amount > 0) { notes.push(['noteHeal', { n: Math.min(amount, wounds) }]) }
    return notes
}

/** Heals wounds of a token (any client that may update the actor, or a GM): conditions first, then Wounds, injuries and VFX. */
export async function heal_wounds(token, amount) {
    const actor = token.actor
    const wounds = actor.system.wounds.value
    const bleeding = await swimConditions.has('bleeding-out', token)
    const incapacitated = await swimConditions.has('incapacitated', token)
    const sim = simulate_wounds(wounds, bleeding, incapacitated, amount)
    if (sim.removeBleed) { await swimConditions.remove('bleeding-out', token) }
    if (sim.removeInc) { await swimConditions.remove('incapacitated', token) }
    if (sim.removeBleed || sim.removeInc) { ui.notifications.notify(t('SWIM.healthCentre.notifyConditionsFirst')) }
    if (sim.overflow) { ui.notifications.error(t('SWIM.healthCentre.notifyCantHealMore')) }
    if (sim.healed > 0) {
        await actor.update({ "system.wounds.value": sim.newWounds })
        await removeInjury(actor, sim.healed)
        ui.notifications.notify(t('SWIM.healthCentre.notifyWoundsHealed', { n: sim.healed }))
        await playHealFX(token)
    }
    return sim
}

/** Removes Fatigue levels from a token. */
export async function cure_fatigue(token, amount) {
    const actor = token.actor
    const fatigue = actor.system.fatigue.value
    let n = Math.max(0, Number(amount) || 0)
    if (n > fatigue) {
        n = fatigue
        ui.notifications.error(t('SWIM.healthCentre.notifyCantCureMore'))
    }
    if (n > 0) {
        await actor.update({ "system.fatigue.value": fatigue - n })
        ui.notifications.notify(t('SWIM.healthCentre.notifyFatigueCured', { n }))
        await playHealFX(token)
    }
    return n
}

/** A natural healing critical failure: one more Wound (Incapacitated if beyond the maximum). */
async function apply_wound(token) {
    const actor = token.actor
    const next = actor.system.wounds.value + 1
    if (next <= actor.system.wounds.max) {
        await actor.update({ "system.wounds.value": next })
    } else {
        await actor.update({ "system.wounds.value": actor.system.wounds.max })
        await swimConditions.add('incapacitated', token, { forceOverlay: true })
    }
}

function effect_text(track, amount) {
    return t(track === 'wounds' ? 'SWIM.healthCentre.effectWounds' : 'SWIM.healthCentre.effectFatigue', { amount })
}

/** Chat message for a potion. `source`: 'self' (own potion, own use), 'healer' (healer's potion for the target), 'target' (the target's own potion). */
async function potion_chat({ healer, patient, item, track, amount, source }) {
    const key = source === 'self' ? 'chatPotionSelf' : source === 'healer' ? 'chatPotionYours' : 'chatPotionTheirs'
    const content = t(`SWIM.healthCentre.${key}`, {
        icon: `<img style="border: none;" src="${esc(item.img)}" alt="" width="25" height="25" />`,
        name: healer.name,
        target: patient.name,
        pronoun: swim.get_pronoun(patient),
        potion: item.name,
        effect: effect_text(track, amount),
    })
    await ChatMessage.create({ speaker: { alias: healer.name }, content })
}

/**
 * GM side of "use a potion on someone else". The potion of the healer or of the target is used up and the target is healed.
 * (A player may not own the target, so all of it happens here. The payload is validated in socket_guard.js.)
 */
export async function heal_potion_gm(data) {
    const healer = canvas.tokens.get(data.tokenID)
    const patient = canvas.tokens.get(data.targetID)
    if (!healer || !patient) {
        ui.notifications.error(t("SWIM.notification.generalErrorMsg"))
        throw new Error("SWIM | healPotion: token not found on the GM's canvas (is the GM on the same scene?).")
    }
    const owner = data.owner === 'target' ? patient.actor : healer.actor
    const item = owner.items.get(data.itemID)
    if (!item || !is_usable_potion_item(item)) {
        ui.notifications.error(t('SWIM.healthCentre.potionGone'))
        return
    }
    const potionSFX = game.settings.get('swim', 'potionSFX')
    const snapshot = { img: item.img, name: item.name }
    await use_potion_item(owner, item)
    await potion_chat({ healer, patient, item: snapshot, track: data.track, amount: data.amount, source: data.owner === 'target' ? 'target' : 'healer' })
    if (potionSFX) {
        const duration = (await play_audio(potionSFX))?.duration
        if (duration) { await wait(duration * 1000) }
    }
    if (data.track === 'wounds') { await heal_wounds(patient, data.amount) }
    else { await cure_fatigue(patient, data.amount) }
}

/* ------------------------------------------------------------------------------------------------ */
/* Entry point                                                                                      */
/* ------------------------------------------------------------------------------------------------ */

export async function personal_health_centre_script(data) {
    const { speaker, token } = await swim.get_data_variables(data, false)
    const target = Array.from(game.user.targets)[0]

    // Check if a token is selected.
    if (!token || canvas.tokens.controlled.length > 1 || game.user.targets.size > 1) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectOrTargetOneOrMoreTokens"));
        return;
    }
    // Another token targeted: it is the patient by default, yourself stays one click away. Targeting yourself = no target.
    const other = target && target.id !== token.id ? target : null
    new HealthCentreApp(token, other, speaker).render(true)
}


/* ------------------------------------------------------------------------------------------------ */
/* The window                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

const CONDITION_CHIPS = [['incapacitated', true], ['bleeding-out', true], ['heart-attack', true], ['shaken', false], ['stunned', false]]
const RATINGS = [['cf', 'SWIM.gameTerm-CritFail', 'cf'], ['fa', 'SWIM.gameTerm-Failure', ''], ['su', 'SWIM.gameTerm-Success', ''], ['ra', 'SWIM.gameTerm-Raise', 'ra']]
const RATING_ENUM = { cf: 'critFail', su: 'success', ra: 'raise' }

function condition_name(id) {
    const effect = CONFIG.statusEffects?.find((e) => e.id === id)
    const name = effect?.name ?? effect?.label
    return name ? game.i18n.localize(name) : id
}

class HealthCentreApp extends Application {
    #token
    #target
    #speaker
    #state
    #hooks = []
    #refresh
    #done = false
    #busy = false
    #bounds = { min: 1, max: 1 }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'swim-health-centre',
            classes: ['swim-hc-app'],
            width: 470,
            height: 'auto',
            resizable: false,
        })
    }

    get title() {
        return t('SWIM.healthCentre.title')
    }

    constructor(token, target, speaker) {
        super()
        this.#token = token
        this.#target = target
        this.#speaker = speaker
        this.#state = { patient: target ? 'target' : 'self', track: null, method: null, amount: 1, potion: '', rating: 'su', combat: false, view: 'choose', nat: null, elanBonus: false }
        // keep pips / chips live while the window is open (the macro may take a while, others may heal in the meantime)
        this.#refresh = foundry.utils.debounce(() => { if (this.rendered && !this.#busy && !this.#done) this.render(false) }, 150)
        for (const name of ['updateActor', 'createActiveEffect', 'deleteActiveEffect', 'updateItem', 'createItem', 'deleteItem']) {
            this.#hooks.push([name, Hooks.on(name, () => this.#refresh())])
        }
    }

    /* -------------------------------- data -------------------------------- */

    async #snapshot() {
        const st = this.#state
        const isSelf = st.patient === 'self' || !this.#target
        const token = isSelf ? this.#token : this.#target
        const actor = token.actor
        const sys = actor.system
        const cond = {}
        for (const [id] of CONDITION_CHIPS) { cond[id] = !!(await swimConditions.has(id, token)) }
        const snap = {
            isSelf, token, actor, name: token.name, img: token.document.texture.src,
            wounds: sys.wounds.value, woundsMax: sys.wounds.max, fatigue: sys.fatigue.value, fatigueMax: sys.fatigue.max,
            bleeding: cond['bleeding-out'], incapacitated: cond['incapacitated'], heartAttack: cond['heart-attack'], cond,
        }
        snap.canWounds = snap.wounds > 0 || (!isSelf && (snap.bleeding || snap.incapacitated || snap.heartAttack))
        snap.canFatigue = snap.fatigue > 0

        // Which tab: keep the choice if it is still possible, else the first one with something to treat.
        if (st.track === 'wounds' && !snap.canWounds) { st.track = null }
        if (st.track === 'fatigue' && !snap.canFatigue) { st.track = null }
        if (!st.track) { st.track = snap.canWounds ? 'wounds' : snap.canFatigue ? 'fatigue' : null }
        snap.track = st.track

        // Potions: always the healer's; for someone else also the target's, if the user may look into the target's inventory.
        snap.potions = []
        if (snap.track) {
            for (const item of potions_of(this.#token.actor, snap.track)) { snap.potions.push({ owner: 'healer', item }) }
            if (!isSelf && (game.user.isGM || actor.testUserPermission(game.user, 'OBSERVER'))) {
                for (const item of potions_of(actor, snap.track)) { snap.potions.push({ owner: 'target', item }) }
            }
            const type = snap.track === 'wounds' ? 'health' : 'fatigue'
            const entries = get_list('potionSwids')
            for (const p of snap.potions) { p.value = `${p.owner}:${p.item.id}`; p.amount = potion_amount(p.item, type, entries) }
            if (!snap.potions.some((p) => p.value === st.potion)) { st.potion = snap.potions[0]?.value ?? '' }
        }

        // Methods that fit the patient.
        snap.methods = !snap.track ? [] : isSelf ? (snap.track === 'wounds' ? ['natural', 'direct', 'potion'] : ['direct', 'potion']) : ['roll', 'potion']
        if (!snap.methods.includes(st.method)) { st.method = snap.methods[0] ?? null }
        snap.method = st.method

        // Amount for direct healing / potions.
        const max = snap.track === 'fatigue' ? snap.fatigue : snap.wounds + (snap.bleeding ? 1 : 0) + (snap.incapacitated ? 1 : 0)
        this.#bounds = { min: 1, max: Math.max(1, max) }
        st.amount = Math.min(Math.max(st.amount, this.#bounds.min), this.#bounds.max)
        snap.amount = st.amount
        // A potion heals what the potion list of the SWIM Configuration says for its SWID (no stepper), but never more than there is to heal.
        snap.fixedAmount = snap.method === 'potion'
        if (snap.fixedAmount) {
            const choice = snap.potions.find((p) => p.value === st.potion)
            snap.amount = Math.min(Math.max(choice?.amount ?? 1, 1), this.#bounds.max)
        }
        return snap
    }

    /** The preview text under the methods: what will happen, in plain words. */
    #preview(snap) {
        const st = this.#state
        const n = (key, data) => t(`SWIM.healthCentre.${key}`, { name: snap.name, ...data })
        const lines = []
        const wounds = (amount) => {
            const sim = simulate_wounds(snap.wounds, snap.bleeding, snap.incapacitated, amount)
            if (sim.removeBleed) { lines.push(n('noteBleed')) }
            if (sim.removeInc) { lines.push(n('noteIncap')) }
            lines.push(n('noteWounds', { from: snap.wounds, to: sim.newWounds }))
        }
        if (snap.method === 'natural') {
            lines.push(snap.bleeding || snap.incapacitated ? n('previewNaturalConditions') : n('previewNatural'))
        } else if (snap.method === 'roll') {
            for (const [key, data] of other_outcome({
                rating: st.rating, track: snap.track, combat: st.combat, wounds: snap.wounds, woundsMax: snap.woundsMax,
                bleeding: snap.bleeding, incapacitated: snap.incapacitated, heartAttack: snap.heartAttack, fatigue: snap.fatigue,
            })) { lines.push(n(key, data)) }
        } else if (snap.method === 'direct' || snap.method === 'potion') {
            if (snap.method === 'potion' && !snap.potions.length) { return n('noPotion') }
            if (snap.track === 'wounds') { wounds(snap.amount) }
            else { lines.push(n('noteFatigueChange', { from: snap.fatigue, to: Math.max(0, snap.fatigue - snap.amount) })) }
        }
        return lines.map((l) => esc(l)).join(' ')
    }

    /* ------------------------------- rendering ------------------------------ */

    #stepper(snap) {
        return `<span class="swim-hc-step"><button type="button" data-action="step" data-dir="-1" ${snap.amount <= this.#bounds.min ? 'disabled' : ''}>−</button>` +
            `<span class="n">${snap.amount}</span><button type="button" data-action="step" data-dir="1" ${snap.amount >= this.#bounds.max ? 'disabled' : ''}>+</button></span>`
    }

    #method(snap, id, icon, title, hint, controls = '') {
        const on = snap.method === id
        return `<div class="swim-hc-method ${on ? 'is-on' : ''}" data-action="method" data-method="${id}" tabindex="0" role="radio" aria-checked="${on}">
          <span class="swim-hc-ico"><i class="${icon}"></i></span>
          <span class="swim-hc-mbody"><b>${esc(title)}</b><small>${esc(hint)}</small>${on && controls ? `<div class="swim-hc-ctl">${controls}</div>` : ''}</span></div>`
    }

    #potionControls(snap) {
        if (!snap.potions.length) { return '' }
        const options = snap.potions.map((p) => {
            const qty = potion_count(p.item)
            let label = `${p.item.name} (${qty})`
            if (!snap.isSelf) {
                label = p.owner === 'healer'
                    ? t('SWIM.healthCentre.potionYours', { name: p.item.name, qty })
                    : t('SWIM.healthCentre.potionTheirs', { name: p.item.name, qty, owner: snap.name })
            }
            return `<option value="${esc(p.value)}" ${p.value === this.#state.potion ? 'selected' : ''}>${esc(label)}</option>`
        }).join('')
        const unit = t(snap.track === 'wounds' ? 'SWIM.healthCentre.unitWounds' : 'SWIM.healthCentre.unitFatigue')
        return `<select data-field="potion">${options}</select> ${esc(unit)} <span class="swim-hc-step"><span class="n">${snap.amount}</span></span>`
    }

    #methodList(snap) {
        const st = this.#state
        const wounds = snap.track === 'wounds'
        const unit = t(wounds ? 'SWIM.healthCentre.unitWounds' : 'SWIM.healthCentre.unitFatigue')
        let html = `<div class="swim-hc-lab">${esc(t(snap.isSelf ? (wounds ? 'SWIM.healthCentre.howHeal' : 'SWIM.healthCentre.howCure') : 'SWIM.healthCentre.rollResult'))}</div>`
        if (snap.isSelf) {
            if (snap.methods.includes('natural')) {
                html += this.#method(snap, 'natural', 'fas fa-dice-d20', t('SWIM.healthCentre.naturalName'), t('SWIM.healthCentre.naturalHint', { time: this.#natHealTime() }))
            }
            html += this.#method(snap, 'direct', wounds ? 'fas fa-hand-holding-medical' : 'fas fa-plus',
                t(wounds ? 'SWIM.healthCentre.directName' : 'SWIM.healthCentre.cureName'), t(wounds ? 'SWIM.healthCentre.directHint' : 'SWIM.healthCentre.cureHint'),
                `${esc(unit)} ${this.#stepper(snap)}`)
        } else {
            const rate = RATINGS.map(([id, key, cls]) => `<div class="swim-hc-rate-opt ${cls} ${st.rating === id ? 'is-on' : ''}" data-action="rating" data-rating="${id}" tabindex="0" role="radio" aria-checked="${st.rating === id}">${esc(t(key))}</div>`).join('')
            html += `<div class="swim-hc-rate">${rate}</div>`
            if (wounds) {
                html += `<label class="swim-hc-check"><input type="checkbox" data-field="combat" ${st.combat ? 'checked' : ''}> <span>${esc(t('SWIM.healthCentre.combat'))}</span></label>`
            }
        }
        // Potions are listed for every patient, but only if there is one to use.
        if (snap.potions.length) {
            html += `<div class="swim-hc-lab swim-hc-lab2">${esc(t('SWIM.healthCentre.orPotion'))}</div>`
            html += this.#method(snap, 'potion', 'fas fa-flask', t('SWIM.healthCentre.potionName'), t('SWIM.healthCentre.potionHint', { count: snap.potions.length }), this.#potionControls(snap))
        }
        return html
    }

    #natHealTime() {
        const actor = this.#token.actor
        const has = (type, key) => actor.items.some((i) => i.type === type && i.name.toLowerCase() === game.i18n.localize(key).toLowerCase())
        let time = game.settings.get('swim', 'natHeal_Time')
        if (has('edge', 'SWIM.edge-fastHealer')) { time = 'three days' }
        if (has('ability', 'SWIM.ability-slowRegeneration')) { time = 'day' }
        if (has('ability', 'SWIM.ability-fastRegeneration')) { time = 'round' }
        return time
    }

    #pips(value, max, cls) {
        if (max > 8) { return `<div class="swim-hc-num">${value}</div>` }
        return `<div class="swim-hc-pips ${cls}">${Array.from({ length: max }, (_, i) => `<span class="swim-hc-pip ${i < value ? 'is-full' : ''}"></span>`).join('')}</div>`
    }

    #resultView(snap) {
        const nat = this.#state.nat
        const n = (key, data) => t(`SWIM.healthCentre.${key}`, { name: snap.name, ...data })
        if (nat.crit) {
            return { body: `<div class="swim-hc-result"><div class="swim-hc-lab">${esc(n('naturalName'))}</div><div class="swim-hc-big is-bad">${esc(t('SWIM.gameTerm-CritFail'))}</div><p>${esc(n('resultCrit'))}</p></div>`,
                foot: `<span class="swim-hc-spacer"></span><button type="button" class="swim-hc-btn" data-action="cancel">${esc(t('SWIM.healthCentre.close'))}</button>` }
        }
        const lines = []
        lines.push(n('resultRoll', { total: nat.total, rounded: nat.heal }))
        if (nat.extras.length) { lines.push(nat.extras.map((e) => `+ ${e}`).join(', ')) }
        const sim = nat.sim
        if (sim.removeBleed) { lines.push(n('noteBleed')) }
        if (sim.removeInc) { lines.push(n('noteIncap')) }
        lines.push(nat.rounded < 1 ? n('resultNone') : n('noteWounds', { from: snap.wounds, to: sim.newWounds }))
        const reroll = nat.improvable ? `<button type="button" class="swim-hc-btn" data-action="reroll">${esc(t('SWIM.healthCentre.reroll', { count: nat.bennies }))}</button>` : ''
        return {
            body: `<div class="swim-hc-result"><div class="swim-hc-lab">${esc(n('naturalName'))}</div><div class="swim-hc-big">${nat.total}</div>${lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div>`,
            foot: `<small>${esc(t('SWIM.healthCentre.benniesLeft', { count: nat.bennies }))}</small><span class="swim-hc-spacer"></span>${reroll}` +
                `<button type="button" class="swim-hc-btn is-go" data-action="accept">${esc(t(nat.rounded < 1 ? 'SWIM.healthCentre.close' : 'SWIM.healthCentre.accept'))}</button>`,
        }
    }

    async _renderInner() {
        const st = this.#state
        const snap = await this.#snapshot()
        const t2 = (key, data) => t(`SWIM.healthCentre.${key}`, data)

        const who = this.#target ? `<div class="swim-hc-who">
            ${[['self', this.#token, t2('patientMyself')], ['target', this.#target, t2('patientTarget')]].map(([id, tok, label]) => `
            <div class="swim-hc-seg ${st.patient === id ? 'is-on' : ''}" data-action="patient" data-patient="${id}" tabindex="0" role="radio" aria-checked="${st.patient === id}">
              <img src="${esc(tok.document.texture.src)}" alt=""><span><small>${esc(label)}</small><b>${esc(tok.name)}</b></span></div>`).join('')}
          </div>` : ''

        const chips = CONDITION_CHIPS.filter(([id]) => snap.cond[id]).map(([id, bad]) => `<span class="swim-hc-chip ${bad ? 'is-bad' : ''}">${esc(condition_name(id))}</span>`).join('')
        const benniesChip = snap.isSelf && snap.actor.system.bennies ? `<span class="swim-hc-chip">${esc(t2('bennies'))} ${snap.actor.system.bennies.value}</span>` : ''
        const tab = (id, label, value, max, ok, cls) => `<div class="swim-hc-track ${cls} ${snap.track === id ? 'is-on' : ''} ${ok ? '' : 'is-off'}" ${ok ? `data-action="track" data-track="${id}" tabindex="0" role="tab"` : 'aria-disabled="true"'}>
            <h5><span>${esc(label)}</span><span>${value}/${max}</span></h5>${this.#pips(value, max, cls)}</div>`
        const patient = `<div class="swim-hc-patient"><div class="swim-hc-chips">${chips}${benniesChip}</div><div class="swim-hc-tracks">
            ${tab('wounds', t2('wounds'), snap.wounds, snap.woundsMax, snap.canWounds, 'w')}${tab('fatigue', t2('fatigue'), snap.fatigue, snap.fatigueMax, snap.canFatigue, 'f')}</div></div>`

        let body, foot
        if (st.view === 'result' && st.nat) {
            ({ body, foot } = this.#resultView(snap))
        } else if (!snap.track) {
            body = `<div class="swim-hc-empty">${esc(t2('nothingToTreat', { name: snap.name }))}</div>`
            foot = `<span class="swim-hc-spacer"></span><button type="button" class="swim-hc-btn" data-action="cancel">${esc(t2('close'))}</button>`
        } else {
            const preview = this.#preview(snap)
            body = `${this.#methodList(snap)}${preview ? `<div class="swim-hc-preview">${preview}</div>` : ''}`
            let label, enabled = true
            const wounds = snap.track === 'wounds'
            if (snap.method === 'natural') { label = t2('rollBtn') }
            else if (snap.method === 'direct') { label = t2(wounds ? 'healBtn' : 'cureBtn', { n: snap.amount }) }
            else if (snap.method === 'potion') { label = t2('usePotion'); enabled = snap.potions.length > 0 }
            else { label = st.rating === 'fa' ? t2('nothing') : t2('healTarget', { name: snap.name }) }
            foot = `<small>${snap.isSelf ? '' : esc(t2('sentToGM'))}</small><span class="swim-hc-spacer"></span>` +
                `<button type="button" class="swim-hc-btn" data-action="cancel">${esc(t('SWIM.picker.cancel'))}</button>` +
                `<button type="button" class="swim-hc-btn is-go" data-action="confirm" ${enabled ? '' : 'disabled'}>${esc(label)}</button>`
        }
        return $(`<div class="swim-hc">${who}${patient}<div class="swim-hc-body">${body}</div><footer class="swim-hc-foot">${foot}</footer></div>`)
    }

    /* ------------------------------- interaction ----------------------------- */

    activateListeners(html) {
        super.activateListeners(html)
        html.on('click', '[data-action]', (ev) => {
            // The potion <select> sits inside the clickable method card: a click on it must not re-render the window (that destroyed the opened dropdown).
            if (ev.target.closest('select, option, input, label')) { return }
            this.#onAction(ev)
        })
        html.on('keydown', '[data-action]', (ev) => {
            if ((ev.key === 'Enter' || ev.key === ' ') && ev.currentTarget.tagName !== 'BUTTON' && ev.target === ev.currentTarget) {
                ev.preventDefault()
                this.#onAction(ev)
            }
        })
        html.on('change', '[data-field]', (ev) => {
            const el = ev.currentTarget
            if (el.dataset.field === 'potion') { this.#state.potion = el.value }
            if (el.dataset.field === 'combat') { this.#state.combat = el.checked }
            this.render(false)
        })
    }

    async #onAction(ev) {
        const el = ev.currentTarget
        const st = this.#state
        if (this.#busy || el.disabled) { return }
        switch (el.dataset.action) {
            case 'patient': st.patient = el.dataset.patient; st.track = null; st.method = null; st.amount = 1; break
            case 'track': st.track = el.dataset.track; st.method = null; st.amount = 1; break
            case 'method': if (st.method === el.dataset.method) { return } st.method = el.dataset.method; break
            case 'rating': st.rating = el.dataset.rating; break
            case 'step': st.amount += Number(el.dataset.dir); break
            case 'cancel': return this.close()
            case 'confirm': return this.#confirm()
            case 'accept': return this.#accept()
            case 'reroll': return this.#reroll()
            default: return
        }
        this.render(false)
    }

    async #finish() {
        this.#done = true
        await this.close()
    }

    async #confirm() {
        const snap = await this.#snapshot()
        const st = this.#state
        const token = this.#token
        const wounds = snap.track === 'wounds'

        if (snap.isSelf) {
            if (snap.method === 'natural') { return this.#roll() }
            if (snap.method === 'direct') {
                await this.#finish()
                if (wounds) { await heal_wounds(token, st.amount) }
                else {
                    const cured = await cure_fatigue(token, st.amount)
                    await ChatMessage.create({ speaker: { alias: token.name }, content: t('SWIM.healthCentre.chatFatigueLost', { name: token.name, n: cured }) })
                }
                return
            }
            // own potion
            const choice = snap.potions.find((p) => p.value === st.potion)
            if (!choice) { return }
            await this.#finish()
            const potionSFX = game.settings.get('swim', 'potionSFX')
            const snapshot = { img: choice.item.img, name: choice.item.name }
            await use_potion_item(token.actor, choice.item)
            await potion_chat({ healer: token, patient: token, item: snapshot, track: snap.track, amount: snap.amount, source: 'self' })
            if (potionSFX) {
                const duration = (await play_audio(potionSFX))?.duration
                if (duration) { await wait(duration * 1000) }
            }
            if (wounds) { await heal_wounds(token, snap.amount) } else { await cure_fatigue(token, snap.amount) }
            return
        }

        // someone else
        const target = this.#target
        if (snap.method === 'potion') {
            const choice = snap.potions.find((p) => p.value === st.potion)
            if (!choice) { return }
            const payload = { tokenID: token.id, targetID: target.id, track: snap.track, amount: snap.amount, owner: choice.owner, itemID: choice.item.id }
            await this.#finish()
            return execute_as_gm("healPotion", payload)
        }
        const rating = RATING_ENUM[st.rating]
        const payload = { targetID: target.id, tokenID: token.id, rating, method: wounds ? 'heal' : 'relief', combatHealing: st.combat }
        await this.#finish()
        if (!rating) { return ui.notifications.notify(t('SWIM.notification.nothingToDo')) }
        return execute_as_gm("healOther", payload)
    }

    /** Natural Healing: the Vigor roll. The result is shown inside this window (Accept / Reroll with Benny). */
    async #roll() {
        const token = this.#token
        const actor = token.actor
        const st = this.#state
        this.#busy = true
        try {
            const r = await actor.rollAttribute('vigor')
            if (!r) { return } // the roll dialog was cancelled
            const edgeName = game.i18n.localize("SWIM.edge-fastHealer").toLowerCase()
            const edges = actor.items.filter((i) => i.name.toLowerCase() === edgeName && (i.type === "edge" || i.type === "ability"))
            const extras = edges.map((e) => e.name)
            let total = r.total + 2 * edges.length
            if (st.elanBonus) { total += 2; extras.push('Elan') }

            let wildCard = true
            if (actor.system.wildcard === false && actor.type === "npc") { wildCard = false }
            const crit = await swim.critFail_check(wildCard, r)
            if (crit === true) {
                ui.notifications.notify(t('SWIM.healthCentre.notifyCritFail'))
                await apply_wound(token)
                await ChatMessage.create({ content: t('SWIM.healthCentre.chatNaturalCrit', { name: speaker_name(this.#speaker, token) }) })
                st.nat = { crit: true }
                st.view = 'result'
                return
            }
            const rounded = Math.max(0, Math.floor(total / 4))
            const heal = Math.min(rounded, 2) // 2 Wounds are the maximum for a Natural Healing roll
            const wounds = actor.system.wounds.value
            const sim = simulate_wounds(wounds, !!(await swimConditions.has('bleeding-out', token)), !!(await swimConditions.has('incapacitated', token)), heal)
            const { totalBennies } = await swim.check_bennies(token, false)
            st.nat = { total, rounded, heal, extras, sim, bennies: totalBennies, improvable: rounded < 2 && totalBennies > 0 && sim.healed < Math.min(2, wounds) }
            st.view = 'result'
        } finally {
            this.#busy = false
            if (!this.#done) { this.render(false) }
        }
    }

    async #reroll() {
        const token = this.#token
        await swim.spend_benny(token, true)
        if (token.actor.items.some((i) => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-elan").toLowerCase() && i.type === "edge")) { this.#state.elanBonus = true }
        return this.#roll()
    }

    async #accept() {
        const token = this.#token
        const nat = this.#state.nat
        const snap = await this.#snapshot()
        await this.#finish()
        if (!nat || nat.crit) { return }
        const name = speaker_name(this.#speaker, token)
        const pronoun = swim.get_pronoun(token)
        const wounds = snap.wounds
        let outcome
        if (nat.rounded < 1) { outcome = t('SWIM.healthCentre.outNone') }
        else if (nat.sim.healed >= wounds) { outcome = t('SWIM.healthCentre.outAll', { pronoun }) }
        else if (nat.sim.healed >= 2) { outcome = t('SWIM.healthCentre.outMax', { pronoun }) }
        else { outcome = t('SWIM.healthCentre.outSome', { n: nat.sim.healed, pronoun, wounds }) }
        const conditions = [nat.sim.removeBleed ? t('SWIM.healthCentre.noteBleed', { name: token.name }) : '', nat.sim.removeInc ? t('SWIM.healthCentre.noteIncap', { name: token.name }) : ''].filter(Boolean).join(' ')
        const extras = nat.extras.map((e) => `<br/><i>+ ${esc(e)}</i>`).join('')
        if (nat.heal > 0) { await heal_wounds(token, nat.heal) }
        await ChatMessage.create({ content: `${t('SWIM.healthCentre.chatNatural', { name, total: nat.total })}${outcome}${conditions ? ` ${esc(conditions)}` : ''}${extras}` })
    }

    async close(options) {
        for (const [name, id] of this.#hooks) { Hooks.off(name, id) }
        this.#hooks = []
        this.#done = true
        return super.close(options)
    }
}

function speaker_name(speaker, token) {
    return speaker?.alias ?? token.name
}

/* ------------------------------------------------------------------------------------------------ */
/* Healing someone else with a Healing roll result: GM side                                         */
/* ------------------------------------------------------------------------------------------------ */

export async function heal_other_gm(data) {
    const targetID = data.targetID
    const target = canvas.tokens.get(targetID)
    const targetActor = target.actor
    const targetWounds = targetActor.system.wounds.value
    const targetWoundsMax = targetActor.system.wounds.max
    const targetFatigue = targetActor.system.fatigue.value
    const targetHeartAttack = await swimConditions.has('heart-attack', targetActor)
    const targetInc = await swimConditions.has('incapacitated', targetActor)
    const targetBleedOut = await swimConditions.has('bleeding-out', targetActor)
    const tokenID = data.tokenID
    const token = canvas.tokens.get(tokenID)
    const tokenActor = token.actor
    const rating = data.rating
    const method = data.method
    const combatHealing = data.combatHealing
    const { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(targetActor)
    let amount
    let chatContent

    if (rating === "critFail") {
        //Apply another wound or cancel
        if (method === "relief") {
            return
        } else if (method === "heal") {
            //Apply another Wound
            if (targetWounds === targetWoundsMax) {
                //Make INC!
                if (targetInc) {
                    await swimConditions.add('bleeding-out', targetActor, {forceOverlay: true});
                    if (await swimConditions.has('incapacitated', token) === true) {
                        const incCondition = await swimConditions.get_from('incapacitated', token.actor)
                        if (incCondition.flags?.core?.overlay === true) {
                            await incCondition.update({"flags.core.overlay": false})
                        }
                    }
                    chatContent = game.i18n.format("SWIM.chatMessage-healOtherCritFailAndBleedOut", {tokenName : token.name, targetName : target.name})
                } else {
                    await swimConditions.add('incapacitated', targetActor, {forceOverlay: true});
                    chatContent = game.i18n.format("SWIM.chatMessage-healOtherCritFailAndIncap", {tokenName : token.name, targetName : target.name})
                }
                await createchatMessage()
            } else {
                amount = 1
                await apply()
                chatContent = game.i18n.format("SWIM.chatMessage-healOtherCritFailAndWound", {tokenName : token.name, targetName : target.name})
                await createchatMessage()
            }
        }
    } else if (rating === "success") {
        //Heal one Wound or Fatigue
        if (method === "relief") {
            amount = 1
            await apply()
            chatContent = game.i18n.format("SWIM.chatMessage-healOtherRelief", {tokenName : token.name, targetName : target.name})
            await createchatMessage()
            await swimConditions.remove('shaken', targetActor);
        } else if (method === "heal" && targetHeartAttack === true) {
            await swimConditions.remove('heart-attack', targetActor);
            await swimConditions.add('incapacitated', targetActor, {forceOverlay: true});
            chatContent = game.i18n.format("SWIM.chatMessage-healOtherCureHeartAttack", {tokenName : token.name, targetName : target.name})
            await createchatMessage()
        } else if (method === "heal" && (targetInc === true || targetBleedOut === true || (targetInc === true && targetBleedOut === true))) {
            // Remove Bleeding out/Incap before any wounds
            if (targetBleedOut) {
                await swimConditions.remove('bleeding-out', targetActor);
                if (await swimConditions.has('incapacitated', token) === true) {
                    const incCondition = await swimConditions.get_from('incapacitated', token.actor)
                    if (incCondition.flags?.core?.overlay === false) {
                        await incCondition.update({"flags.core.overlay": true})
                    }
                }
                chatContent = game.i18n.format("SWIM.chatMessage-healOtherCureBleedOut", {tokenName : token.name, targetName : target.name})
            } else if (targetInc) {
                await swimConditions.remove('incapacitated', targetActor);
                chatContent = game.i18n.format("SWIM.chatMessage-healOtherCureIncap", {tokenName : token.name, targetName : target.name}) //Incapacitation: Healing at least one Wound on an Incapacitated patient removes that state (and restores consciousness if he was knocked out). -> so a Wound is healed in any case(?).
                if (combatHealing === false) {
                    amount = 1
                    await removeInjury(targetActor, amount)
                    await apply()
                }
            }
            await createchatMessage()
        } else if (method === "heal") {
            amount = 1
            await removeInjury(targetActor, amount)
            await apply()
            chatContent = game.i18n.format("SWIM.chatMessage-healOtherSuccess", {tokenName : token.name, targetName : target.name})
            await createchatMessage()
        }
    } else if (rating === "raise") {
        //Heal two Wounds or remove two Fatigue
        if (method === "relief") {
            //Heal two Fatigue and remove Shaken and Stunned
            amount = 2
            await apply()
            chatContent = game.i18n.format("SWIM.chatMessage-healOtherRaiseRelief", {tokenName : token.name, targetName : target.name})
            await createchatMessage()
            await swimConditions.remove('shaken', targetActor);
            await swimConditions.remove('stunned', targetActor);
            await swimConditions.remove('vulnerable', targetActor);
        } else if (method === "heal" && targetHeartAttack === true) {
            await swimConditions.remove('heart-attack', targetActor);
            await swimConditions.add('incapacitated', targetActor, {forceOverlay: true});
            chatContent = game.i18n.format("SWIM.chatMessage-healOtherCureHeartAttack", {tokenName : token.name, targetName : target.name})
            await createchatMessage()
        } else if (method === "heal") {
            amount = 2
            if (targetInc === true || targetBleedOut === true || (targetInc === true && targetBleedOut === true)) {
                // Remove Bleeding out/Incap before any wounds
                if (targetBleedOut) {
                    await swimConditions.remove('bleeding-out', targetActor);
                    amount = amount - 1
                    chatContent = game.i18n.format("SWIM.chatMessage-healOtherCureBleedOut", {tokenName : token.name, targetName : target.name})
                } if (targetInc) {
                    await swimConditions.remove('incapacitated', targetActor);
                    //amount = amount - 1 //Incapacitation: Healing at least one Wound on an Incapacitated patient removes that state (and restores consciousness if he was knocked out). -> so a Wound is healed in any case(?).
                    chatContent += game.i18n.format("SWIM.chatMessage-healOtherCureIncapContinued", {targetName : target.name})
                    if (combatHealing === true) {amount = 0}
                    if (amount <= 0) { await createchatMessage() }
                }
            } if (amount > 0) {
                //Heal two Wounds
                await removeInjury(targetActor, amount)
                await apply()
                if (amount === 2) {
                    chatContent = game.i18n.format("SWIM.chatMessage-healOtherRaise", {tokenName : token.name, targetName : target.name})
                } else if (amount === 1) {
                    chatContent += game.i18n.format("SWIM.chatMessage-healOtherRaiseContinued", {targetName : target.name})
                }
                await createchatMessage()
            }
        }
    } else {
        ui.notifications.error(game.i18n.localize("SWIM.notification.generalErrorMsg"));
        console.error("The heal_other_gm() function wasn't passed the proper success rating. Please report this to the SWIM developer on the repository or directly to him on Discord: SalieriC#8263.")
    }
    async function apply() {
        if (rating === "critFail" && method === "heal") {
            let setWounds = targetWounds + amount
            if (targetWoundsMax <= setWounds) {
                setWounds = targetWoundsMax
                await swimConditions.add('incapacitated', targetActor);
            }
            targetActor.update({ "system.wounds.value": setWounds })
        } else if (method === "relief") {
            if (targetFatigue < amount) { amount = targetFatigue }
            targetActor.update({ "system.fatigue.value": targetFatigue - amount })
            await playHealFX(target, unshakeSFX)
        } else if (method === "heal") {
            if (targetWounds < amount) { amount = targetWounds }
            targetActor.update({ "system.wounds.value": targetWounds - amount })
            await playHealFX(target, soakSFX)
        }
    }

    async function createchatMessage() {
        ChatMessage.create({
            user: game.user.id,
            content: chatContent,
        });
    }
}

async function removeInjury(actor, healedWounds) {
    let activeEffects = actor.effects
    let injuries = []
    let aeIDsToRemove = []
    for (let effect of activeEffects) {
        if (effect.flags?.swim) {
            injuries.push(effect)
        }
    }
    injuries.reverse() //Reverse to remove combat injuries in proper order, from most recent to least recent.
    for (let injury of injuries) {
        let combat = injury.flags.swim.isCombatInjury
        let permanent = injury.flags.swim.isPermanent
        if (permanent === false && combat === true) {
            //remove if wound is healed
            if (healedWounds > 0) {
                aeIDsToRemove.push(injury.id)
                healedWounds = healedWounds - 1
            }
        } else if (permanent === false && combat === false) {
            // Is a temorary injury from Inc.
            if (actor.system.wounds.value === 0) {
                // Remove the injury if all Wounds are healed.
                aeIDsToRemove.push(injury.id)
            }
        }
    }
    await actor.deleteEmbeddedDocuments("ActiveEffect", aeIDsToRemove)
}

async function playHealFX(token, sfx) {
    let healVFX = game.settings.get(
        'swim', 'healVFX');
    if (game.modules.get("sequencer")?.active && healVFX) {
        let healVFX = game.settings.get(
            'swim', 'healVFX');
        //let tokenD = canvas.tokens.controlled[0];
        let scale = token.scale;
        let sequence = new Sequence()
            .effect()
            .file(`${healVFX}`) //recommendation: "modules/jb2a_patreon/Library/2nd_Level/Misty_Step/MistyStep_01_Regular_Green_400x400.webm"
            .atLocation(token)
            .scale(scale)
        sequence.play();
    }
}
