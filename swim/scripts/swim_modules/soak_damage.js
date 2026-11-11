import { swimConditions } from '../helpers/conditions.js'
/*******************************************
 * Soak Damage
 * v. 7.0.0 – one window (SoakApp) instead of a chain of Dialogs.
 * Code by SalieriC#8263.
 *
 * Everything happens in one window: the incoming Wounds, the Soak roll (with Power Points for (Un)Holy Warrior), the result with
 * "Reroll with Benny" / "Apply Wounds", and – if the character gets Incapacitated – the Incapacitation roll right after.
 * Called while Incapacitated or Bleeding Out (also by SWADE at the start of the turn of a bleeding character) it opens on the
 * Incapacitation / Bleeding Out roll. Look: styles/soak-damage.css on top of the building blocks of styles/health-centre.css.
 *******************************************/
const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key))
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => `&#${m.charCodeAt(0)};`)
const BIG = (n) => `<span style="font-size:150%"> ${n} </span>`

export async function soak_damage_script(effect = false) {
    let { speaker, _, __, token } = await swim.get_macro_variables()

    // No Token is Selected
    if ((!token || canvas.tokens.controlled.length > 1) && !effect) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
        return;
    } else if (effect) {
        // Called by SWADE for a bleeding out character (see init.js, effectCallbacks).
        const actor = effect.parent
        const doc = actor.isToken ? actor.token : canvas.scene.tokens.find(tk => tk.actor.id === actor.id)
        token = doc?.object ?? doc
        const nameKey = game.user.character?.id === actor.id ? `${game.i18n.localize("SWIM.word-you")} ${game.i18n.localize("SWIM.word-are")}` : `${token.name} ${game.i18n.localize("SWIM.word-is")}`
        ui.notifications.notify(game.i18n.format("SWIM.notification-bleedingRoll", { tokenName: nameKey }));
    }
    await SoakApp.open(token, effect ? token.name : (speaker?.alias ?? token.name))
}

/* ------------------------------------------------------------------------------------------------ */
/* Rules helpers                                                                                    */
/* ------------------------------------------------------------------------------------------------ */

/** The Soak bonuses of an actor: Active Effects on `soakBonus`, the remaining generic bonus, Iron Jaw & co., Power Points, Elan on rerolls. */
export function soak_bonuses(actor, { pp, elan } = {}) {
    const edgeNames = [
        game.i18n.localize("SWIM.edge-ironJaw").toLowerCase(),
        game.i18n.localize("SWIM.ability-thickFur-sagaOfTheGoblinHorde").toLowerCase()
    ]
    let total = 0
    const lines = []
    const signed = (n) => `${n < 0 ? '-' : '+'} ${Math.abs(n)}`
    const img = (src) => `<img src="${esc(src)}" alt="" width="15" height="15" style="border:0" />`

    // Bonus from Active Effects (and the generic bonus left over after them):
    const effectNames = []
    let fromEffects = 0
    for (const effect of actor.effects) {
        if (effect.disabled === false && !edgeNames.includes(effect.name)) { // only enabled effects not made by a recognised Edge
            for (const change of effect.changes) {
                if (change.key !== "system.attributes.vigor.soakBonus") { continue }
                const value = parseFloat(change.value)
                if (!Number.isFinite(value)) { continue }
                effectNames.push(effect.name.toLowerCase())
                fromEffects += value
                total += value
                lines.push(`${signed(value)} ${img(effect.img)}${esc(effect.name)}`)
            }
        }
    }
    const generic = Number(actor.system.attributes.vigor.soakBonus) || 0
    if (generic > fromEffects) {
        total += generic - fromEffects
        lines.push(`${signed(generic - fromEffects)} ${esc(t('SWIM.soak.genericBonus'))}`)
    }

    // Edges, but not if an Active Effect with the same name covers them already (deliberately not a fuzzy search):
    const edges = actor.items.filter((i) => edgeNames.includes(i.name.toLowerCase()) && (i.type === "edge" || i.type === "ability"))
    for (const edge of edges) {
        if (!effectNames.includes(edge.name.toLowerCase())) {
            total += 2
            lines.push(`+ 2 ${img(edge.img)}${esc(edge.name)}`)
        }
    }

    // Power Points of (Un)Holy Warrior are a bonus to the roll in the amount of the Power Points spent:
    if (typeof pp === "number" && pp > 0) {
        total += pp
        lines.push(esc(t('SWIM.soak.linePP', { pp })))
    }
    // Elan: +2 on rerolls.
    if (elan) {
        total += 2
        lines.push(`+ 2 ${esc(elan.name)}`)
    }
    return { total, lines }
}

/** What applying `amount` Wounds does – used for the preview. `wounds`/`max` are the current values. */
export function describe_apply({ name, wounds, max, isCharacter, grit }, amount) {
    const set = wounds + amount
    const lines = []
    if (amount === 0) { lines.push(t('SWIM.soak.noteNoWounds', { name })) }
    else if (set <= max) {
        lines.push(t('SWIM.soak.noteWounds', { from: wounds, to: set }))
        lines.push(t('SWIM.soak.noteShaken', { name }))
        if (grit) { lines.push(t('SWIM.soak.noteInjury')) }
    } else if (isCharacter) {
        lines.push(t('SWIM.soak.noteIncapacitated', { name }))
    } else {
        lines.push(t('SWIM.soak.noteDefeated', { name }))
    }
    return lines
}

function condition_name(id) {
    const effect = CONFIG.statusEffects?.find((e) => e.id === id)
    const name = effect?.name ?? effect?.label
    return name ? game.i18n.localize(name) : id
}

/** Incapacitated stays on the character while Bleeding Out (without overlay); after stabilising the overlay comes back. */
async function apply_inc_overlay(token) {
    if (await swimConditions.has('incapacitated', token) === true) {
        const incCondition = await swimConditions.get_from('incapacitated', token.actor)
        if (incCondition.flags?.core?.overlay === false) { await incCondition.update({ "flags.core.overlay": true }) }
    } else {
        await swimConditions.add('incapacitated', token, { forceOverlay: true })
    }
}

/** Gritty Damage injury (roll on the injury table, create the Active Effect). */
async function apply_injury(token, permanent, combat) {
    const actor = token.actor
    const injuryTable = game.settings.get('swim', 'injuryTable')
        //roll on injury table:
        let result = await game.tables.getName(`${injuryTable}`).draw();
        let text = result.results[0].text;
        const img = result.results[0].img;
        let injuryData = {
            changes: [],
            flags: {
                swim: {
                    isCombatInjury: combat,
                    isPermanent: permanent
                }
            }
        };
        injuryData.icon = img; // ActiveEffect icon field in Foundry v11 (`img` is v12+ and is ignored)
        if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-unmentionables").toLowerCase())) {
            //unmentionables; create dummy AE without actual effect
            injuryData.name = game.i18n.localize("SWIM.injury-unmentionables");
        } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-arm").toLowerCase())) {
            //arm; create a dummy AE without actual effect
            injuryData.name = game.i18n.localize("SWIM.injury-armUnusable");
        } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-leg").toLowerCase())) {
            //leg, create AE with appropriate value depending on whether or not the character is slow already
            const slow = token.actor.items.find(function (item) {
                return ((item.name.toLowerCase() === game.i18n.localize("SWIM.hindrance-slow").toLowerCase()) ||
                    (item.name.toLowerCase() === game.i18n.localize("SWIM.hindrance-slow").toLowerCase())) &&
                    item.type === "hindrance";
            });
            if (!slow) {
                //Actor isn't slow, create AE with minor slow effect = system.stats.speed.runningDie -2 && system.stats.speed.value -1
                injuryData.name = game.i18n.localize("SWIM.injury-legSlow");
                if (token.actor.system.stats.speed.runningDie === 4) {
                    //Running die is a d4 already, alter AE like so: system.stats.speed.runningDie.modifier -1 && system.stats.speed.value -1
                    injuryData.changes.push({
                        key: 'system.stats.speed.runningDie.modifier',
                        mode: 2,
                        value: -1
                    }, {
                        key: 'system.stats.speed.value',
                        mode: 2,
                        value: -1
                    }
                    )
                } else {
                    //AE as above
                    injuryData.changes.push({
                        key: 'system.stats.speed.runningDie',
                        mode: 2,
                        value: -2
                    }, {
                        key: 'system.stats.speed.value',
                        mode: 2,
                        value: -1
                    })
                }
            } else if (slow.system.major === false) {
                //Actor is minor slow, create AE with major slow effect = system.stats.speed.runningDie -2 && system.stats.speed.value -2 && @Skill{Athletics}[system.die.modifier] -2
                injuryData.name = game.i18n.localize("SWIM.injury-legSlow");
                if (token.actor.system.stats.speed.runningDie === 4) {
                    //Running die is a d4 already, alter AE like so: system.stats.speed.runningDie.modifier -1 && system.stats.speed.value -2
                    injuryData.changes.push({
                        key: 'system.stats.speed.runningDie.modifier',
                        mode: 2,
                        value: -1
                    }, {
                        key: 'system.stats.speed.value',
                        mode: 2,
                        value: -2
                    }, {
                        key: `@Skill{${game.i18n.localize("SWIM.skill-athletics")}}[system.die.modifier]`,
                        mode: 2,
                        value: -2
                    })
                } else {
                    //AE as above
                    injuryData.changes.push({
                        key: 'system.stats.speed.runningDie',
                        mode: 2,
                        value: -2
                    }, {
                        key: 'system.stats.speed.value',
                        mode: 2,
                        value: -2
                    }, {
                        key: `@Skill{${game.i18n.localize("SWIM.skill-athletics")}}[system.die.modifier]`,
                        mode: 2,
                        value: -2
                    })
                }
                //Do nothing if actor is major slow already.
            }
        } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-guts").toLowerCase())) {
            //evaluate all the guts:
            if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-broken").toLowerCase())) {
                //Guts broken, create AE with system.attributes.agility.die.sides -2
                injuryData.name = game.i18n.localize("SWIM.injury-gutsBroken");
                injuryData.changes.push({
                    key: 'system.attributes.agility.die.sides',
                    mode: 2,
                    value: -2
                })
            } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-battered").toLowerCase())) {
                //Guts battered, create AE with system.attributes.vigor.die.sides -2
                injuryData.name = game.i18n.localize("SWIM.injury-gutsBattered");
                injuryData.changes.push({
                    key: 'system.attributes.vigor.die.sides',
                    mode: 2,
                    value: -2
                })
            } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-busted").toLowerCase())) {
                //Guts busted, created AE with system.attributes.strength.die.sides -2
                injuryData.name = game.i18n.localize("SWIM.injury-gutsBusted");
                injuryData.changes.push({
                    key: 'system.attributes.strength.die.sides',
                    mode: 2,
                    value: -2
                })
            }
        } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-head").toLowerCase())) {
            //evaluate all the head results:
            if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-hideousScar").toLowerCase())) {
                //hideous scar, create AE with @Skill{Persuasion}[system.die.modifier] -2
                injuryData.name = game.i18n.localize("SWIM.injury-headScar");
                injuryData.changes.push({
                    key: `@Skill{${game.i18n.localize("SWIM.skill-persuasion")}}[system.die.modifier]`,
                    mode: 2,
                    value: -2
                })
            } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-blinded").toLowerCase())) {
                //Blinded, create dummy AE without actual effect
                injuryData.name = game.i18n.localize("SWIM.injury-headBlinded");
            } else if (text.toLowerCase().includes(game.i18n.localize("SWIM.injuryTable-brain").toLowerCase())) {
                //Brain damage, create AE with system.attributes.smarts.die.sides -2
                injuryData.name = game.i18n.localize("SWIM.injury-headBrainDamage");
                injuryData.changes.push({
                    key: 'system.attributes.smarts.die.sides',
                    mode: 2,
                    value: -2
                })
            }
        }
        if (permanent === false && combat === true) {
            injuryData.name += `${game.i18n.localize("swim.injury-combat")}`;
        } else if (permanent === true && combat === false) {
            injuryData.name += `${game.i18n.localize("swim.injury-permanent")}`;
        }
        //Create the AE:
        await actor.createEmbeddedDocuments('ActiveEffect', [injuryData]);
}

/* ------------------------------------------------------------------------------------------------ */
/* The window                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

class SoakApp extends Application {
    #token
    #alias
    #state
    #hooks = []
    #refresh
    #done = false
    #busy = false
    #bounds = { wounds: [0, 20], pp: [0, 0], apply: [0, 20] }
    static #current = null

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'swim-soak-damage',
            classes: ['swim-hc-app', 'swim-sd-app'],
            width: 470,
            height: 'auto',
            resizable: false,
        })
    }

    get title() { return t('SWIM.soak.title') }

    /** Opens the window (only one at a time). Bleeding Out / Incapacitated open on the Vigor roll instead of the damage. */
    static async open(token, alias) {
        await SoakApp.#current?.close()
        const bleeding = await swimConditions.has('bleeding-out', token)
        const incapacitated = await swimConditions.has('incapacitated', token)
        const kind = bleeding ? 'bleed' : incapacitated ? 'incap' : null
        const app = new SoakApp(token, alias, kind)
        SoakApp.#current = app
        app.render(true)
    }

    constructor(token, alias, kind) {
        super()
        this.#token = token
        this.#alias = alias
        this.#state = {
            phase: kind ? 'vigorPrompt' : 'choose',
            wounds: 1, method: null, pp: 0, apply: 0,
            soak: null,
            vigor: kind ? this.#newVigor(kind) : null,
        }
        this.#refresh = foundry.utils.debounce(() => { if (this.rendered && !this.#busy && !this.#done) this.render(false) }, 150)
        for (const name of ['updateActor', 'createActiveEffect', 'deleteActiveEffect', 'updateItem']) {
            this.#hooks.push([name, Hooks.on(name, () => this.#refresh())])
        }
    }

    #newVigor(kind) { return { kind, best: -1, bestLines: [], last: null, lines: [], elan: false, reroll: false } }

    /* -------------------------------- data -------------------------------- */

    async #snapshot() {
        const token = this.#token
        const actor = token.actor
        const sys = actor.system
        const cond = {}
        for (const id of ['shaken', 'incapacitated', 'bleeding-out', 'dead']) { cond[id] = !!(await swimConditions.has(id, token)) }
        const { totalBennies } = await swim.check_bennies(token, false)
        const holyNames = [game.i18n.localize("SWIM.edge-holyWarrior").toLowerCase(), game.i18n.localize("SWIM.edge-unholyWarrior").toLowerCase()]
        const byName = (name) => actor.items.find((i) => i.type === 'edge' && i.name.toLowerCase() === game.i18n.localize(name).toLowerCase())
        const isCharacter = actor.type === 'character'
        const snap = {
            token, actor, name: token.name, img: token.document.texture.src,
            wounds: sys.wounds.value, max: sys.wounds.max, bennies: totalBennies,
            pp: sys.powerPoints?.general?.value ?? 0,
            holy: actor.items.find((i) => i.type === 'edge' && holyNames.includes(i.name.toLowerCase())),
            elan: byName("SWIM.edge-elan"), hardToKill: byName("SWIM.edge-hardToKill"), harderToKill: byName("SWIM.edge-harderToKill"),
            isCharacter, cond,
            grit: game.settings.get('swim', 'grittyDamage') === true && (isCharacter || (actor.type === 'npc' && game.settings.get('swim', 'grittyDamageNPC') === true)),
        }
        const st = this.#state
        this.#bounds.pp = [0, snap.holy ? Math.min(4, snap.pp) : 0]
        st.pp = Math.min(Math.max(st.pp, this.#bounds.pp[0]), this.#bounds.pp[1])
        if (!st.method || (st.method === 'soak' && (snap.bennies < 1 || st.wounds < 1))) { st.method = snap.bennies > 0 && st.wounds > 0 ? 'soak' : 'apply' }
        return snap
    }

    /* ------------------------------- rendering ------------------------------ */

    #stepper(field, value) {
        const [min, max] = this.#bounds[field]
        return `<span class="swim-hc-step"><button type="button" data-action="step" data-field="${field}" data-dir="-1" ${value <= min ? 'disabled' : ''}>−</button>` +
            `<span class="n">${value}</span><button type="button" data-action="step" data-field="${field}" data-dir="1" ${value >= max ? 'disabled' : ''}>+</button></span>`
    }

    #pips(value, max, incoming = 0) {
        if (max > 8) { return `<div class="swim-hc-num">${value}${incoming ? ` +${incoming}` : ''}</div>` }
        return `<div class="swim-hc-pips w">${Array.from({ length: max }, (_, i) => `<span class="swim-hc-pip ${i < value ? 'is-full' : i < value + incoming ? 'is-incoming' : ''}"></span>`).join('')}</div>`
    }

    #header(snap, incoming = 0) {
        const chips = [['shaken', false], ['incapacitated', true], ['bleeding-out', true], ['dead', true]]
            .filter(([id]) => snap.cond[id]).map(([id, bad]) => `<span class="swim-hc-chip ${bad ? 'is-bad' : ''}">${esc(condition_name(id))}</span>`).join('')
        const block = (label, value, extra = '') => `<div class="swim-hc-track swim-sd-static"><h5><span>${esc(label)}</span><span>${extra}</span></h5>${value}</div>`
        return `<div class="swim-hc-who"><div class="swim-hc-seg is-on swim-sd-static"><img src="${esc(snap.img)}" alt=""><span><small>${esc(t('SWIM.soak.title'))}</small><b>${esc(snap.name)}</b></span></div></div>
          <div class="swim-hc-patient"><div class="swim-hc-chips">${chips}</div><div class="swim-hc-tracks">
            ${block(t('SWIM.healthCentre.wounds'), this.#pips(snap.wounds, snap.max, incoming), `${snap.wounds}/${snap.max}`)}
            ${block(t('SWIM.healthCentre.bennies'), `<div class="swim-hc-num">${snap.bennies}</div>`)}
            ${snap.holy ? block(t('SWIM.soak.powerPoints'), `<div class="swim-hc-num">${snap.pp}</div>`) : ''}
          </div></div>`
    }

    #card(id, icon, title, hint, { on, off, controls = '' }) {
        return `<div class="swim-hc-method ${on ? 'is-on' : ''} ${off ? 'is-off' : ''}" ${off ? 'aria-disabled="true"' : `data-action="method" data-method="${id}" tabindex="0" role="radio" aria-checked="${on}"`}>
          <span class="swim-hc-ico"><i class="${icon}"></i></span>
          <span class="swim-hc-mbody"><b>${esc(title)}</b><small>${esc(hint)}</small>${on && controls ? `<div class="swim-hc-ctl">${controls}</div>` : ''}</span></div>`
    }

    #btn(action, label, { go = false, danger = false, disabled = false } = {}) {
        return `<button type="button" class="swim-hc-btn ${go ? 'is-go' : ''} ${danger ? 'is-danger' : ''}" data-action="${action}" ${disabled ? 'disabled' : ''}>${esc(label)}</button>`
    }

    #applyBlock(snap, amount) {
        return `<div class="swim-sd-row"><span>${esc(t('SWIM.soak.woundsToApply'))}</span>${this.#stepper('apply', amount)}</div>` +
            `<div class="swim-hc-preview">${describe_apply(snap, amount).map(esc).join(' ')}</div>`
    }

    #chooseView(snap) {
        const st = this.#state
        const soak = this.#card('soak', 'fas fa-dice-d20', t('SWIM.soak.soakName'), snap.bennies < 1 ? t('SWIM.soak.noBennies') : st.wounds < 1 ? t('SWIM.soak.noWoundsToSoak') : t('SWIM.soak.soakHint'), {
            on: st.method === 'soak', off: snap.bennies < 1 || st.wounds < 1,
            controls: snap.holy ? `${esc(t('SWIM.soak.powerPointsToSpend'))} ${this.#stepper('pp', st.pp)}` : '',
        })
        const apply = this.#card('apply', 'fas fa-heart-broken', t('SWIM.soak.applyName'), t('SWIM.soak.applyHint'), { on: st.method === 'apply' })
        const preview = st.method === 'soak'
            ? t('SWIM.soak.previewSoak')
            : describe_apply(snap, st.wounds).join(' ')
        const label = st.method === 'soak' ? t('SWIM.soak.rollBtn') : st.wounds === 0 ? t('SWIM.soak.applyShaken') : t('SWIM.soak.applyBtn', { n: st.wounds })
        return {
            body: `<div class="swim-hc-lab">${esc(t('SWIM.soak.incoming'))}</div>
              <div class="swim-sd-row"><span>${esc(t('SWIM.healthCentre.wounds'))}</span>${this.#stepper('wounds', st.wounds)}</div>
              <div class="swim-hc-lab swim-hc-lab2">${esc(t('SWIM.soak.whatDo'))}</div>${soak}${apply}
              <div class="swim-hc-preview">${esc(preview)}</div>`,
            foot: `<span class="swim-hc-spacer"></span>${this.#btn('cancel', t('SWIM.picker.cancel'))}${this.#btn('confirm', label, { go: true })}`,
        }
    }

    #soakResultView(snap) {
        const st = this.#state
        const s = st.soak
        const name = snap.name
        let top
        if (s.crit) {
            top = `<div class="swim-hc-big is-bad">${esc(t('SWIM.gameTerm-CritFail'))}</div><p>${esc(t('SWIM.soak.critAll', { n: st.wounds }))}</p>`
        } else {
            const lines = [t('SWIM.soak.resultRoll', { total: s.last, rounded: s.rounded })]
            if (s.best > s.rounded) { lines.push(t('SWIM.soak.resultBest', { best: s.best })) }
            lines.push(s.best < 1 ? t('SWIM.soak.resultNone') : t('SWIM.soak.resultSome', { best: s.best, n: st.wounds }))
            top = `<div class="swim-hc-big">${s.last}</div>${s.lines.length ? `<p class="swim-sd-lines">${s.lines.join('<br/>')}</p>` : ''}${lines.map((l) => `<p>${esc(l)}</p>`).join('')}`
        }
        const reroll = !s.crit && snap.bennies > 0 ? this.#btn('reroll', t('SWIM.healthCentre.reroll', { count: snap.bennies })) : ''
        return {
            body: `<div class="swim-hc-result">${top}</div>${this.#applyBlock(snap, st.apply)}`,
            foot: `<small>${esc(t('SWIM.healthCentre.benniesLeft', { count: snap.bennies }))}</small><span class="swim-hc-spacer"></span>${reroll}${this.#btn('applyResult', st.apply === 0 ? t('SWIM.soak.applyShaken') : t('SWIM.soak.applyBtn', { n: st.apply }), { go: true })}`,
        }
    }

    #vigorTitle(kind) { return t(kind === 'bleed' ? 'SWIM.dialogue-bleedingOutRoll' : 'SWIM.dialogue-incapacitationRoll') }

    #vigorPromptView() {
        const kind = this.#state.vigor.kind
        return {
            body: `<div class="swim-hc-result"><div class="swim-hc-lab">${esc(this.#vigorTitle(kind))}</div>${t(kind === 'bleed' ? 'SWIM.soak.bleedText' : 'SWIM.soak.incapText')}</div>`,
            foot: `<span class="swim-hc-spacer"></span>${this.#btn('cancel', t('SWIM.healthCentre.close'))}${this.#btn('vigorRoll', t('SWIM.dialogue-rollVigor').replace(/<[^>]*>/g, '').trim(), { go: true })}`,
        }
    }

    #vigorResultView(snap) {
        const v = this.#state.vigor
        const bad = v.best < 4
        const text = t(`SWIM.soak.${v.kind}${bad ? 'Bad' : 'Mid'}`)
        const lines = [v.last !== v.best ? t('SWIM.soak.vigorBest', { last: v.last, best: v.best }) : '', text, t('SWIM.soak.bestKept')]
        if (snap.elan) { lines.push(t('SWIM.soak.elanReroll')) }
        return {
            body: `<div class="swim-hc-result"><div class="swim-hc-lab">${esc(this.#vigorTitle(v.kind))}</div><div class="swim-hc-big ${bad ? 'is-bad' : ''}">${v.best}</div>
              ${v.bestLines.length ? `<p class="swim-sd-lines">${v.bestLines.join('<br/>')}</p>` : ''}${lines.filter(Boolean).map((l) => `<p>${esc(l)}</p>`).join('')}</div>`,
            foot: `<small>${esc(t('SWIM.healthCentre.benniesLeft', { count: snap.bennies }))}</small><span class="swim-hc-spacer"></span>` +
                `${this.#btn('vigorReroll', t('SWIM.healthCentre.reroll', { count: snap.bennies }))}${this.#btn('vigorApply', t('SWIM.soak.applyResult'), { go: true })}`,
        }
    }

    async _renderInner() {
        const st = this.#state
        const snap = await this.#snapshot()
        let view
        let incoming = 0
        if (st.phase === 'choose') { view = this.#chooseView(snap); incoming = st.method === 'apply' || st.method === 'soak' ? st.wounds : 0 }
        else if (st.phase === 'soakResult') { view = this.#soakResultView(snap); incoming = st.apply }
        else if (st.phase === 'vigorResult') { view = this.#vigorResultView(snap) }
        else { view = this.#vigorPromptView() }
        return $(`<div class="swim-hc swim-sd">${this.#header(snap, incoming)}<div class="swim-hc-body">${view.body}</div><footer class="swim-hc-foot">${view.foot}</footer></div>`)
    }

    /* ------------------------------- interaction ----------------------------- */

    activateListeners(html) {
        super.activateListeners(html)
        html.on('click', '[data-action]', (ev) => {
            if (ev.target.closest('select, option, input, label')) { return }
            this.#onAction(ev)
        })
        html.on('keydown', '[data-action]', (ev) => {
            if ((ev.key === 'Enter' || ev.key === ' ') && ev.currentTarget.tagName !== 'BUTTON' && ev.target === ev.currentTarget) {
                ev.preventDefault()
                this.#onAction(ev)
            }
        })
    }

    async #onAction(ev) {
        const el = ev.currentTarget
        const st = this.#state
        if (this.#busy || el.disabled) { return }
        switch (el.dataset.action) {
            case 'method': if (st.method === el.dataset.method) { return } st.method = el.dataset.method; break
            case 'step': {
                const field = el.dataset.field
                const [min, max] = this.#bounds[field]
                st[field] = Math.min(Math.max(st[field] + Number(el.dataset.dir), min), max)
                break
            }
            case 'cancel': return this.close()
            case 'confirm': return this.#confirm()
            case 'reroll': return this.#soakRoll(true)
            case 'applyResult': return this.#applyFromResult()
            case 'vigorRoll': return this.#vigorRoll(false)
            case 'vigorReroll': return this.#vigorRoll(true)
            case 'vigorApply': return this.#vigorResolve()
            default: return
        }
        this.render(false)
    }

    async #finish() {
        this.#done = true
        await this.close()
    }

    async #confirm() {
        const st = this.#state
        if (st.method === 'apply') { return this.#applyWounds(st.wounds) }
        return this.#soakRoll(false)
    }

    /* ------------------------------ Soak roll ------------------------------- */

    /** The Vigor roll to soak Wounds. The Benny (and the Power Points) are spent after the roll was actually made. */
    async #soakRoll(isReroll) {
        const st = this.#state
        const token = this.#token
        const actor = token.actor
        const snap = await this.#snapshot()
        if (snap.bennies < 1) { return ui.notifications.warn(t('SWIM.notification-noBenniesLeft')) }
        const s = st.soak ?? (st.soak = { best: 0, bestTotal: 0, bestLines: [], ppSpent: false, elan: false })
        if (isReroll && snap.elan) { s.elan = true }
        const pp = !s.ppSpent && snap.holy ? st.pp : 0
        if (pp > snap.pp) { return ui.notifications.notify(t('SWIM.dialogue-insufficientPowerPoints')) }
        if (pp > 4) { return ui.notifications.error(t('SWIM.dialogue-cannotUseMoreThanFourPP')) }

        this.#busy = true
        try {
            const r = await actor.rollAttribute('vigor')
            if (!r) { return } // the roll dialog was cancelled: nothing is spent
            await swim.spend_benny(token, true)
            if (pp > 0) {
                await actor.update({ "system.powerPoints.general.value": snap.pp - pp })
                s.ppSpent = true
                s.ppUsed = pp
            }
            const bonus = soak_bonuses(actor, { pp: s.ppUsed, elan: s.elan })
            const total = r.total + bonus.total
            const rounded = Math.max(0, Math.floor(total / 4))
            Object.assign(s, { last: total, rounded, lines: bonus.lines, crit: false })

            const wildCard = !(actor.system.wildcard === false && actor.type === "npc")
            if (await swim.critFail_check(wildCard, r) === true) {
                s.crit = true
                st.apply = st.wounds // a Critical Failure: all Wounds, the player may still change the number
                ui.notifications.notify(t("SWIM.notification-critFailApplyWounds"))
                await ChatMessage.create({ content: t("SWIM.chatMessage-unshakeResultCritFail", { name: this.#alias }) })
                st.phase = 'soakResult'
                return
            }
            if (!s.hasBest || rounded > s.best) { s.bestTotal = total; s.bestLines = bonus.lines; s.hasBest = true }
            s.best = Math.max(s.best, rounded)
            if (rounded >= 1) {
                const { soakSFX } = await swim.get_actor_sfx(actor)
                if (soakSFX) { swim.play_sfx(soakSFX) }
            }
            if (rounded >= st.wounds) { return await this.#soakedAll() }
            st.apply = st.wounds - s.best
            st.phase = 'soakResult'
        } finally {
            this.#busy = false
            if (!this.#done) { this.render(false) }
        }
    }

    #soakChat(s, snap) {
        const pronoun = swim.get_pronoun(snap.actor)
        let chat = t("SWIM.chatMessage-unshakeResultRoll", { name: this.#alias, rollWithEdge: s.bestTotal })
        chat += s.best < 1 ? t("SWIM.chatMessage-soakNoWounds") : t("SWIM.chatMessage-soakSomeWounds", { rounded: s.best, pronoun })
        return `${chat}${s.bestLines.map((l) => `<br/><i>${l}</i>`).join('')}`
    }

    async #soakedAll() {
        const s = this.#state.soak
        const token = this.#token
        const pronoun = swim.get_pronoun(token.actor)
        const chat = t("SWIM.chatMessage-unshakeResultRoll", { name: this.#alias, rollWithEdge: s.bestTotal }) + t("SWIM.chatMessage-soakAllWounds", { pronoun })
        if (await swimConditions.has('shaken', token) === true) { await swimConditions.remove('shaken', token) }
        await ChatMessage.create({ content: `${chat}${s.bestLines.map((l) => `<br/><i>${l}</i>`).join('')}` })
        await this.#finish()
    }

    async #applyFromResult() {
        const st = this.#state
        if (!st.soak.crit) {
            const snap = await this.#snapshot()
            await ChatMessage.create({ content: this.#soakChat(st.soak, snap) })
        }
        return this.#applyWounds(st.apply)
    }

    /** Applies Wounds: Wounds + Shaken, or Incapacitated (character: Incapacitation roll follows in this window, NPC: defeated). */
    async #applyWounds(amount) {
        const token = this.#token
        const actor = token.actor
        const snap = await this.#snapshot()
        amount = Math.max(0, Math.floor(Number(amount) || 0))
        const setWounds = snap.wounds + amount
        let exceeded = false
        this.#busy = true
        try {
            if (setWounds <= snap.max && setWounds > 0) {
                await actor.update({ "system.wounds.value": setWounds })
                await swimConditions.add('shaken', token)
            } else if (amount === 0) {
                await swimConditions.add('shaken', token)
            } else {
                await actor.update({ "system.wounds.value": snap.max })
                // Characters are Incapacitated, NPCs and vehicles are defeated (same as Mark Dead).
                await swimConditions.add(snap.isCharacter ? 'incapacitated' : 'dead', token, { forceOverlay: true })
                exceeded = true
            }
            if (amount > 0 && setWounds > 0 && snap.grit && !exceeded) { await apply_injury(token, false, true) }
        } finally {
            this.#busy = false
        }
        if (exceeded && snap.isCharacter) {
            this.#state.phase = 'vigorPrompt'
            this.#state.vigor = this.#newVigor('incap')
            return this.render(false)
        }
        return this.#finish()
    }

    /* ----------------------- Incapacitation / Bleeding Out ------------------ */

    async #vigorRoll(isReroll) {
        const st = this.#state
        const v = st.vigor
        const token = this.#token
        const actor = token.actor
        const snap = await this.#snapshot()
        if (isReroll) {
            if (snap.bennies < 1) { return ui.notifications.warn(t('SWIM.notification-noBenniesLeft')) }
            if (snap.elan) { v.elan = true }
        }
        this.#busy = true
        try {
            const r = await actor.rollAttribute('vigor')
            if (!r) { return }
            if (isReroll) { await swim.spend_benny(token, true) }
            let total = r.total
            const lines = []
            if (v.kind === 'incap' && snap.hardToKill) {
                const bonus = actor.system.wounds.value - actor.system.wounds.ignored
                total += bonus
                lines.push(`+ ${bonus} <img src="${esc(snap.hardToKill.img)}" alt="" width="15" height="15" style="border:0" />${esc(snap.hardToKill.name)}`)
            }
            if (v.elan) { total += 2; lines.push(`+ ${esc(snap.elan.name)}`) }

            const wildCard = !(actor.system.wildcard === false && actor.type === "npc")
            if (await swim.critFail_check(wildCard, r) === true) {
                return await this.#vigorCrit(snap)
            }
            if (total >= v.best) { v.best = total; v.bestLines = lines }
            v.last = total
            v.lines = lines
            const { totalBennies } = await swim.check_bennies(token, false)
            if (totalBennies > 0 && v.best < 8) {
                st.phase = 'vigorResult'
                return
            }
            return await this.#vigorResolve()
        } finally {
            this.#busy = false
            if (!this.#done) { this.render(false) }
        }
    }

    async #vigorCrit(snap) {
        const v = this.#state.vigor
        const token = this.#token
        const alias = this.#alias
        const harder = snap.harderToKill
        const survive = async () => {
            // Survives "somehow": no longer Bleeding Out, stays Incapacitated.
            if (v.kind === 'bleed') {
                await swimConditions.remove('bleeding-out', token)
                await apply_inc_overlay(token)
            }
        }
        if (harder) {
            const roll = (await new Roll('1d2').evaluate()).total
            if (roll === 1) {
                ui.notifications.notify(t("SWIM.notification.critFailHarderToKillFail", { harderToKillName: harder.name }))
                await ChatMessage.create({ content: t("SWIM.chat.critFailHarderToKillFail", { actorAlias: alias, harderToKillName: harder.name }) })
                await this.#perish()
            } else {
                ui.notifications.notify(t("SWIM.notification.critFailHarderToKillSuccess", { harderToKillName: harder.name }))
                await ChatMessage.create({ content: t("SWIM.chat.critFailHarderToKillSuccess", { actorAlias: alias, harderToKillName: harder.name }) })
                await survive()
            }
        } else {
            ui.notifications.notify(t('SWIM.soak.notifyCritPerish'))
            await ChatMessage.create({ content: t('SWIM.soak.chatCritPerish', { name: alias }) })
            await this.#perish()
        }
        return this.#finish()
    }

    async #perish() {
        const token = this.#token
        if (await swimConditions.has('bleeding-out', token)) { await swimConditions.remove('bleeding-out', token) }
        await swimConditions.add('dead', token, { forceOverlay: true })
    }

    /** Applies the best result of the Vigor roll. */
    async #vigorResolve() {
        const st = this.#state
        const v = st.vigor
        const token = this.#token
        const alias = this.#alias
        const best = v.best
        const snap = await this.#snapshot()
        let outcome = ''
        this.#busy = true
        try {
            if (v.kind === 'incap') {
                if (best < 4) {
                    // Permanent injury and Bleeding Out (the Incapacitated overlay makes room for the Bleeding Out one).
                    await apply_injury(token, true, false)
                    if (await swimConditions.has('incapacitated', token) === true) {
                        const incCondition = await swimConditions.get_from('incapacitated', token.actor)
                        if (incCondition.flags?.core?.overlay === true) { await incCondition.update({ "flags.core.overlay": false }) }
                    }
                    await swimConditions.add('bleeding-out', token, { forceOverlay: true })
                    outcome = t('SWIM.soak.incapPermanent', { name: alias })
                } else {
                    await apply_injury(token, false, false)
                    outcome = t(best >= 8 ? 'SWIM.soak.incapTemp24' : 'SWIM.soak.incapTemp', { name: alias })
                }
            } else if (best < 4 && snap.harderToKill) {
                const harder = snap.harderToKill
                const roll = (await new Roll('1d2').evaluate()).total
                if (roll === 1) {
                    ui.notifications.notify(t('SWIM.soak.notifyHtkFail', { roll: best, edge: harder.name }))
                    outcome = t('SWIM.soak.bleedHtkFail', { name: alias, edge: harder.name })
                    await this.#perish()
                } else {
                    ui.notifications.notify(t('SWIM.soak.notifyHtkSuccess', { roll: best, edge: harder.name }))
                    outcome = t('SWIM.soak.bleedHtkSuccess', { name: alias, edge: harder.name })
                    await swimConditions.remove('bleeding-out', token)
                    await apply_inc_overlay(token)
                }
            } else if (best < 4) {
                outcome = t('SWIM.soak.bleedPerish', { name: alias })
                await this.#perish()
            } else if (best < 8) {
                outcome = t('SWIM.soak.bleedStill', { name: alias })
            } else {
                outcome = t('SWIM.soak.bleedStable', { name: alias })
                await swimConditions.remove('bleeding-out', token)
                await apply_inc_overlay(token)
            }
        } finally {
            this.#busy = false
        }
        const rolled = t("SWIM.chatMessage-unshakeResultRoll", { name: alias, rollWithEdge: best })
        await ChatMessage.create({ content: `${rolled} ${outcome}${v.bestLines.map((l) => `<br/><i>${l}</i>`).join('')}` })
        return this.#finish()
    }

    async close(options) {
        for (const [name, id] of this.#hooks) { Hooks.off(name, id) }
        this.#hooks = []
        this.#done = true
        if (SoakApp.#current === this) { SoakApp.#current = null }
        return super.close(options)
    }
}
