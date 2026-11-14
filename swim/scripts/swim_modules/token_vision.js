import { SwimWindow, t, esc, btn, token_img, tokens_header, rate_opt } from '../helpers/swim_window.js'
import { illumination_level } from '../helpers/adjust_scene_light.js'
import { LIST_TYPES, get_list, item_swids, swids_for } from '../helpers/swid_lists.js'
/*******************************************
 * Token Vision macro for SWADE
 * v. 6.0.0 – window (TokenVisionApp) instead of a Dialog; several tokens at once for the GM; vision from SWIDs;
 *            light sources are Active Token Effects (ATL) instead of the SUCC torch condition.
 * v. 5.2.1 by SalieriC#8263
 * Inspired by @Sky#9453:
 * https://github.com/Sky-Captain-13/foundry
 ******************************************/

/** The special vision types, strongest first: if a token matches several, the first one wins (the SWIDs are in the SWIM Configuration > Item Options > Vision SWIDs). */
export const VISION_TYPES = LIST_TYPES.visionSwids
const LEVEL_RANGE = { none: 1000, dim: 25, dark: 10, pitch: 0 }
const LEVELS = ['none', 'dim', 'dark', 'pitch']
const LEVEL_LANG = { none: 'SWIM.tokenVisionWin.lvlNone', dim: 'SWIM.tokenVisionWin.lvlDim', dark: 'SWIM.tokenVisionWin.lvlDark', pitch: 'SWIM.tokenVisionWin.lvlPitch' }
const TYPE_LANG = {
    basic: 'SWIM.tokenVisionWin.basic',
    'low-light-vision': 'SWIM.ability-lowLightVision',
    darkvision: 'SWIM.ability-darkvision-swpf',
    infravision: 'SWIM.ability-infravision',
    nvd: 'SWIM.tokenVision-nightVisionDevice',
}
const NVD_ON = 'modules/swim/assets/sfx/night_vision_device-on.ogg'
const NVD_OFF = 'modules/swim/assets/sfx/night_vision_device-off.ogg'

const num = (v, d) => {
    const n = Number.parseFloat(String(v ?? '').replace(',', '.'))
    return Number.isFinite(n) ? n : d
}

/* ---------- vision (pure helpers) ---------- */

/** Which of the optional modes of the SWADE system are registered. */
export function vision_caps() {
    return { infraMode: !!CONFIG.Canvas?.visionModes?.infraVision, heat: !!CONFIG.Canvas?.detectionModes?.seeHeat }
}

/** The vision type a token has through the SWIDs of its items (list *Vision SWIDs* of the SWIM Configuration), or null. */
export function find_vision_swid(actor, entries = get_list('visionSwids')) {
    const swids = new Set()
    for (const i of actor?.items ?? []) { for (const s of item_swids(i)) { swids.add(s) } }
    return VISION_TYPES.find((type) => [...swids_for('visionSwids', type, entries)].some((s) => swids.has(s))) ?? null
}
export const estimate_type = (actor) => find_vision_swid(actor) ?? 'basic'

/** Illumination level of a scene: SWIM flag, else derived from the darkness (same rule as Scene Illumination). */
export const scene_level = (scene) => illumination_level(scene?.flags?.swim?.config?.illuminationLevel, scene?.darkness ?? 0)

/** How far a special vision type sees in the dark (none: not usable in pitch darkness). */
const SPECIAL = {
    'low-light-vision': { range: 25, mode: 'darkvision', pitch: false },
    darkvision: { range: 10, mode: 'darkvision', pitch: true },
    infravision: { range: 25, mode: 'infraVision', pitch: true },
    nvd: { range: 25, mode: 'lightAmplification', pitch: true },
}

/**
 * The values of a vision type under an illumination level. -> {mode, range, angle, detection, special}
 * Everybody gets basic sight (1000 / 25 / 10 / 1 for Full / Dim / Dark / Pitch, the vision range follows the level).
 * A special type is only applied if its range exceeds that (`special` = true); otherwise the result is plain basic sight,
 * so nobody gets a tinted or grey vision that gives no benefit.
 */
export function vision_preset(type, level, caps = {}) {
    const base = LEVEL_RANGE[level] ?? 0
    const basic = Math.max(base, 1)
    const detection = (basicRange, heat = { enabled: false, range: 0 }) => {
        const d = { basicSight: { enabled: true, range: basicRange } }
        if (caps.heat) { d.seeHeat = heat }
        return d
    }
    const sp = SPECIAL[type]
    if (sp && sp.range > base && (sp.pitch || level !== 'pitch')) {
        if (type === 'infravision') {
            const mode = caps.infraMode ? 'infraVision' : 'darkvision'
            return { mode, range: sp.range, angle: 360, detection: detection(basic, { enabled: true, range: sp.range }), special: true }
        }
        return { mode: sp.mode, range: sp.range, angle: 360, detection: detection(sp.range), special: true }
    }
    return { mode: 'basic', range: base, angle: 360, detection: detection(basic), special: false }
}

/** Update data for a token with Automatic vision (SWID estimate under `level`), or null if it is already set up that way. */
export function auto_vision_update(td, level, caps = vision_caps()) {
    const cfg = vision_preset(estimate_type(td.actor), level, caps)
    if (!CONFIG.Canvas?.visionModes?.[cfg.mode]) { cfg.mode = 'basic' }
    cfg.enabled = true
    const upd = vision_update({ mode: td.sight.visionMode, detectionModes: td.detectionModes }, cfg)
    const same = td.sight.visionMode === cfg.mode && td.sight.range === cfg.range && td.sight.angle === cfg.angle
        && JSON.stringify(upd.detectionModes) === JSON.stringify((td.detectionModes ?? []).map((d) => ({ id: d.id, enabled: !!d.enabled, range: d.range ?? 0 })))
    return same ? null : upd
}

/**
 * Sets Automatic vision on the tokens of a scene (vision-disabled tokens and tokens without actor are skipped). Returns the number updated.
 * Without `manual` (the scene/placement hooks) nothing happens if the setting "Automatic vision adjustments" is off.
 */
export async function auto_vision_scene(scene, tokenDocs = scene.tokens, { manual = false } = {}) {
    if (!manual && !game.settings.get('swim', 'automaticVision')) { return 0 }
    const level = scene_level(scene)
    const updates = []
    for (const td of tokenDocs) {
        if (!td.actor || td.sight?.enabled === false) { continue }
        const upd = auto_vision_update(td, level)
        if (upd) { updates.push({ _id: td.id, ...upd }) }
    }
    if (updates.length) { await scene.updateEmbeddedDocuments('Token', updates) }
    return updates.length
}

/** Existing detection modes of a token with the wanted ones merged in (other modes stay untouched). */
export function merge_detection(existing, wanted) {
    const list = (existing ?? []).map((d) => ({ id: d.id, enabled: !!d.enabled, range: d.range ?? 0 }))
    for (const [id, d] of Object.entries(wanted ?? {})) {
        const e = list.find((x) => x.id === id)
        if (e) { e.enabled = !!d.enabled; e.range = d.range } else { list.push({ id, enabled: !!d.enabled, range: d.range }) }
    }
    return list
}

/** Defaults a vision mode brings along (Foundry's token config copies them into the sight fields on a mode change). */
export function vision_defaults(mode) {
    const d = CONFIG.Canvas?.visionModes?.[mode]?.vision?.defaults ?? {}
    const out = {}
    for (const k of ['attenuation', 'brightness', 'saturation', 'contrast', 'color']) { if (d[k] !== undefined) { out[k] = d[k] } }
    return out
}

/** The update data for one token. `current` = {mode, detectionModes}. */
export function vision_update(current, cfg, defaultsFor = vision_defaults) {
    const sight = { enabled: cfg.enabled !== false, range: cfg.range, angle: cfg.angle, visionMode: cfg.mode }
    if (current.mode !== cfg.mode) { Object.assign(sight, defaultsFor(cfg.mode)) }
    return { sight, detectionModes: merge_detection(current.detectionModes, cfg.detection) }
}

/* ---------- light (pure helpers) ---------- */

export const LIGHT_COLOURS = { candle: '#fffcbb', fire: '#f8c377', magnesium: '#e52424', white: '#ffffff' }
const COLOUR_LANG = { candle: 'SWIM.tokenVision-candleColour', fire: 'SWIM.tokenVision-fireTorchColour', magnesium: 'SWIM.tokenVision-magnesiumTorchColour', white: 'SWIM.tokenVision-whiteFlashlightComlour' }
export const LIGHT_PRESETS = {
    candle: { bright: 2, dim: 0, angle: 360, colour: 'candle', lang: 'SWIM.tokenVision-candle' },
    torch: { bright: 4, dim: 0, angle: 360, colour: 'fire', lang: 'SWIM.tokenVision-torch' },
    lantern: { bright: 4, dim: 0, angle: 360, colour: 'candle', lang: 'SWIM.tokenVision-lantern' },
    bullseye: { bright: 4, dim: 0, angle: 52.5, colour: 'candle', lang: 'SWIM.tokenVision-lanternBullseye' },
    flashlight: { bright: 10, dim: 0, angle: 52.5, colour: 'white', lang: 'SWIM.tokenVision-flashlight' },
}

/** Full light configuration (Foundry's defaults for everything a preset does not set). */
export function default_light_cfg(key = 'torch') {
    const p = LIGHT_PRESETS[key] ?? LIGHT_PRESETS.torch
    return {
        bright: p.bright, dim: p.dim, angle: p.angle, color: LIGHT_COLOURS[p.colour],
        alpha: 0.5, coloration: 1, luminosity: 0.5, attenuation: 0.5, saturation: 0, contrast: 0, shadows: 0, darkMin: 0, darkMax: 1,
        animType: '', animSpeed: 5, animIntensity: 5, animReverse: false,
    }
}
const LIGHT_FIELDS = Object.keys(default_light_cfg())
export const light_state = (cfg) => Object.fromEntries(LIGHT_FIELDS.map((k) => [`l_${k}`, typeof cfg[k] === 'boolean' ? cfg[k] : String(cfg[k] ?? '')]))
export function read_light(state) {
    const d = default_light_cfg()
    const n = (k) => num(state[`l_${k}`], d[k])
    const colour = /^#[0-9a-f]{6}$/i.test(state.l_color ?? '') ? state.l_color : d.color
    return {
        bright: Math.max(0, n('bright')), dim: Math.max(0, n('dim')), angle: Math.min(360, Math.max(1, n('angle'))), color: colour,
        alpha: n('alpha'), coloration: Math.round(n('coloration')), luminosity: n('luminosity'), attenuation: n('attenuation'),
        saturation: n('saturation'), contrast: n('contrast'), shadows: n('shadows'), darkMin: n('darkMin'), darkMax: n('darkMax'),
        animType: String(state.l_animType ?? ''), animSpeed: n('animSpeed'), animIntensity: n('animIntensity'), animReverse: !!state.l_animReverse,
    }
}

/** ATL changes of a light. `full` (custom) writes every light field, a preset only radius, angle and colour. */
export function light_changes(cfg, full) {
    const ch = (key, value) => ({ key: `ATL.light.${key}`, mode: 5, value: String(value), priority: null })
    const out = [ch('bright', cfg.bright), ch('dim', cfg.dim), ch('angle', cfg.angle), ch('color', cfg.color)]
    if (full) {
        out.push(ch('alpha', cfg.alpha), ch('coloration', cfg.coloration), ch('luminosity', cfg.luminosity), ch('attenuation', cfg.attenuation),
            ch('saturation', cfg.saturation), ch('contrast', cfg.contrast), ch('shadows', cfg.shadows),
            ch('darkness.min', cfg.darkMin), ch('darkness.max', cfg.darkMax))
    }
    if (cfg.animType) { out.push(ch('animation', JSON.stringify({ type: cfg.animType, speed: cfg.animSpeed, intensity: cfg.animIntensity, reverse: !!cfg.animReverse }))) }
    return out
}
const signature = (changes) => JSON.stringify(changes.map((c) => [c.key, String(c.value), c.mode]))

export const atl_active = () => !!game.modules.get('ATL')?.active
const light_name = (key) => (LIGHT_PRESETS[key] ? t(LIGHT_PRESETS[key].lang) : t('SWIM.tokenVisionWin.customLight'))
const light_icon = (key) => `modules/swim/assets/icons/effects/light-${LIGHT_PRESETS[key] ? key : 'custom'}.svg`

/** The SWIM light effect of an actor -> {light, cfg} or null. */
export function current_light(actor) {
    const e = actor?.effects?.find((x) => x.flags?.swim?.tokenVision)
    const f = e?.flags?.swim?.tokenVision
    return f ? { light: f.light, cfg: { ...default_light_cfg(), ...(f.cfg ?? {}) } } : null
}

/**
 * Sets (`light` = {key, cfg}) or removes (`light` = null) the SWIM light effect of an actor; also removes the legacy SUCC torch effect.
 * @returns {Promise<boolean>} whether something changed
 */
export async function apply_light(actor, light) {
    const ours = actor.effects.filter((e) => e.flags?.swim?.tokenVision)
    const legacy = actor.effects.filter((e) => e.flags?.succ?.conditionId === 'torch')
    let changed = false
    const remove = [...legacy.map((e) => e.id), ...ours.slice(light ? 1 : 0).map((e) => e.id)]
    if (remove.length) { await actor.deleteEmbeddedDocuments('ActiveEffect', remove); changed = true }
    if (!light) { return changed }
    const changes = light_changes(light.cfg, light.key === 'custom')
    const data = { name: light_name(light.key), icon: light_icon(light.key), changes, flags: { swim: { tokenVision: { light: light.key, cfg: light.cfg } } } }
    const existing = ours[0]
    if (existing) {
        if (signature(existing.changes) === signature(changes) && existing.name === data.name) { return changed }
        await existing.update(data)
    } else {
        await actor.createEmbeddedDocuments('ActiveEffect', [data])
    }
    return true
}

/* ---------- entry ---------- */

export async function token_vision_script() {
    const { token } = await swim.get_macro_variables()
    const controlled = canvas.tokens.controlled
    let tokens = (controlled.length ? [...controlled] : (token ? [token] : [])).filter((tk) => tk.actor)
    if (!tokens.length) { return ui.notifications.error(t('SWIM.tokenVisionWin.noToken')) }
    if (tokens.length > 1 && !game.user.isGM) { return ui.notifications.error(t('SWIM.notification-selectSingleToken')) }
    await SwimWindow.show(new TokenVisionApp(tokens))
}

/* ---------- window ---------- */

const VISION_OPTS = [
    ['auto', 'fas fa-magic', 'SWIM.tokenVisionWin.auto'],
    ['basic', 'fas fa-eye', 'SWIM.tokenVisionWin.basic'],
    ['low-light-vision', 'fas fa-cloud-moon', 'SWIM.ability-lowLightVision'],
    ['darkvision', 'fas fa-moon', 'SWIM.ability-darkvision-swpf'],
    ['infravision', 'fas fa-temperature-high', 'SWIM.ability-infravision'],
    ['nvd', 'fas fa-binoculars', 'SWIM.tokenVision-nightVisionDevice'],
    ['custom', 'fas fa-sliders-h', 'SWIM.tokenVisionWin.custom'],
    ['keep', 'fas fa-minus', 'SWIM.noChange'],
]
const LIGHT_OPTS = [
    ['none', 'fas fa-ban', 'SWIM.none'],
    ['candle', 'fas fa-fire-flame-simple', 'SWIM.tokenVision-candle'],
    ['torch', 'fas fa-fire', 'SWIM.tokenVision-torch'],
    ['lantern', 'fas fa-lightbulb', 'SWIM.tokenVision-lantern'],
    ['bullseye', 'fas fa-bullseye', 'SWIM.tokenVision-lanternBullseye'],
    ['flashlight', 'fas fa-sun', 'SWIM.tokenVision-flashlight'],
    ['custom', 'fas fa-sliders-h', 'SWIM.tokenVisionWin.custom'],
    ['keep', 'fas fa-minus', 'SWIM.noChange'],
]

const detection_ids = () => Object.keys(CONFIG.Canvas?.detectionModes ?? {})
const label_of = (entry, fallback) => game.i18n.localize(entry?.label ?? fallback)

class TokenVisionApp extends SwimWindow {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, { id: 'swim-token-vision', width: 540 })
    }

    get title() { return t('SWIM.tokenVision-title') }

    constructor(tokens) {
        super()
        this.tokens = tokens
        this.multi = tokens.length > 1
        this.sceneLevel = scene_level(tokens[0].document.parent ?? canvas.scene)
        this.caps = vision_caps()
        this.atl = atl_active()
        const cur = this.multi ? null : current_light(tokens[0].actor)
        Object.assign(this.state, { vision: 'auto', illumination: 'scene', light: cur ? cur.light : (this.multi ? 'keep' : 'none'), open_vision: false, open_light: false })
        Object.assign(this.state, light_state(cur?.cfg ?? default_light_cfg('torch')))
        this.#reload_vision()
    }

    #level() { return this.state.illumination === 'scene' ? this.sceneLevel : this.state.illumination }

    /** One entry per token: what the current choice means for it. */
    #plan() {
        const s = this.state
        return this.tokens.map((token) => {
            if (s.vision === 'keep') { return { token, type: 'keep' } }
            if (s.vision === 'custom') { return { token, type: 'custom', cfg: this.#custom_vision() } }
            const found = s.vision === 'auto' ? find_vision_swid(token.actor) : null
            const type = s.vision === 'auto' ? (found ?? 'basic') : s.vision
            // Automatic never touches a token whose vision is disabled (an explicit choice does and enables it)
            const skip = s.vision === 'auto' && token.document.sight?.enabled === false
            return { token, type, found, skip, cfg: vision_preset(type, this.#level(), this.caps) }
        })
    }

    #custom_vision() {
        const s = this.state
        const detection = {}
        for (const id of detection_ids()) { detection[id] = { enabled: !!s[`dm_${id}_on`], range: Math.max(0, num(s[`dm_${id}_range`], 0)) } }
        return { enabled: !!s.v_enabled, mode: s.v_mode || 'basic', range: Math.max(0, num(s.v_range, 0)), angle: Math.min(360, Math.max(1, num(s.v_angle, 360))), detection }
    }

    /** Fills the advanced fields from the current choice (first token); a custom choice or "no change" keeps what is typed. */
    #reload_vision() {
        const s = this.state
        if (s.vision === 'keep' || s.vision === 'custom') { return }
        const { token, cfg } = this.#plan()[0]
        const td = token.document
        s.v_enabled = true
        s.v_mode = cfg.mode
        s.v_range = String(cfg.range)
        s.v_angle = String(cfg.angle)
        const merged = merge_detection(td.detectionModes, cfg.detection)
        for (const id of detection_ids()) {
            const d = merged.find((x) => x.id === id)
            s[`dm_${id}_on`] = !!d?.enabled
            s[`dm_${id}_range`] = String(d?.range ?? 0)
        }
    }

    #range_text(range) { return range >= 1000 ? t('SWIM.tokenVisionWin.unlimited') : String(range) }

    #vision_preview() {
        const s = this.state
        if (s.vision === 'keep') { return esc(t('SWIM.tokenVisionWin.visionKeep')) }
        const mode_label = (mode) => label_of(CONFIG.Canvas?.visionModes?.[mode], mode)
        const line = (p) => {
            const name = p.type === 'custom' ? t('SWIM.tokenVisionWin.custom') : t(TYPE_LANG[p.type] ?? TYPE_LANG.basic)
            const nobenefit = p.type !== 'custom' && p.type !== 'basic' && !p.cfg.special ? ` <small>(${esc(t('SWIM.tokenVisionWin.noBenefit', { type: t(TYPE_LANG[p.type]) }))})</small>` : ''
            if (p.skip) { return `<small>${esc(t('SWIM.tokenVisionWin.visionOff'))}</small>` }
            return `<b>${esc(p.type === 'custom' || p.cfg.special || p.type === 'basic' ? name : t(TYPE_LANG.basic))}</b>${nobenefit} · ${esc(t('SWIM.tokenVisionWin.range', { range: this.#range_text(p.cfg.range) }))} · ${esc(p.cfg.angle)}° · ${esc(mode_label(p.cfg.mode))}`
        }
        const plan = this.#plan()
        if (this.multi && s.vision !== 'custom') {
            const rows = plan.slice(0, 8).map((p) => `<div class="swim-tv-line"><img src="${esc(token_img(p.token))}" alt="" width="16" height="16"> ${esc(p.token.name)}: ${line(p)}</div>`)
            if (plan.length > 8) { rows.push(`<div class="swim-tv-line">${esc(t('SWIM.tokenVisionWin.more', { count: plan.length - 8 }))}</div>`) }
            return rows.join('')
        }
        const p = plan[0]
        let note = ''
        if (s.vision === 'auto') { note = `<br><small>${esc(p.found ? t('SWIM.tokenVisionWin.fromAbility') : t('SWIM.tokenVisionWin.noAbility'))}</small>` }
        return line(p) + note
    }

    #light_preview() {
        const s = this.state
        if (s.light === 'keep') { return esc(t('SWIM.tokenVisionWin.lightKeep')) }
        if (s.light === 'none') { return esc(t('SWIM.tokenVisionWin.lightNone')) }
        const c = read_light(s)
        return `<b>${esc(light_name(s.light))}</b> · ${esc(t('SWIM.tokenVisionWin.lightSummary', { bright: c.bright, dim: c.dim, angle: c.angle }))}`
    }

    #opt(action, key, icon, label, on, off = false) {
        return `<div class="swim-hc-rate-opt swim-tv-opt ${on ? 'is-on' : ''} ${off ? 'is-off' : ''}" data-action="${action}" data-key="${esc(key)}" tabindex="0" role="radio" aria-checked="${!!on}"><i class="${icon}"></i><span>${esc(t(label))}</span></div>`
    }

    #num(name, label, kind, attrs = '', disabled = false) {
        return `<label><span>${esc(t(label))}</span><input type="number" step="any" data-field="${name}" data-adv="${kind}" value="${esc(this.state[name])}" ${attrs} ${disabled ? 'disabled' : ''}></label>`
    }

    #select(name, label, kind, options, disabled = false) {
        const cur = String(this.state[name] ?? '')
        return `<label><span>${esc(t(label))}</span><select data-field="${name}" data-adv="${kind}" ${disabled ? 'disabled' : ''}>${options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === cur ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`
    }

    #vision_advanced() {
        const s = this.state
        const off = this.multi && s.vision === 'auto'
        const modes = Object.entries(CONFIG.Canvas?.visionModes ?? {}).map(([id, m]) => [id, label_of(m, id)])
        const rows = detection_ids().map((id) => `<div class="swim-tv-dm"><label class="swim-hc-check"><input type="checkbox" data-field="dm_${esc(id)}_on" data-adv="vision" ${s[`dm_${id}_on`] ? 'checked' : ''} ${off ? 'disabled' : ''}> <span>${esc(label_of(CONFIG.Canvas.detectionModes[id], id))}</span></label>
            <input type="number" min="0" step="any" data-field="dm_${esc(id)}_range" data-adv="vision" value="${esc(s[`dm_${id}_range`])}" ${off ? 'disabled' : ''}></div>`).join('')
        return `<details class="swim-tv-adv" data-open="vision" ${s.open_vision ? 'open' : ''}><summary>${esc(t('SWIM.tokenVisionWin.advVision'))}</summary>
            ${off ? `<p class="swim-tv-hint">${esc(t('SWIM.tokenVisionWin.perToken'))}</p>` : ''}
            <div class="swim-tv-grid2">
                <label class="swim-hc-check"><input type="checkbox" data-field="v_enabled" data-adv="vision" ${s.v_enabled ? 'checked' : ''} ${off ? 'disabled' : ''}> <span>${esc(t('SWIM.tokenVisionWin.sightEnabled'))}</span></label>
                ${this.#select('v_mode', 'SWIM.tokenVisionWin.visionMode', 'vision', modes, off)}
                ${this.#num('v_range', 'SWIM.tokenVisionWin.visionRange', 'vision', 'min="0"', off)}
                ${this.#num('v_angle', 'SWIM.tokenVisionWin.angle', 'vision', 'min="1" max="360"', off)}
            </div>
            <h5>${esc(t('SWIM.tokenVisionWin.detection'))}</h5>${rows}</details>`
    }

    #light_advanced() {
        const s = this.state
        const anims = [['', t('SWIM.tokenVisionWin.animNone')], ...Object.entries(CONFIG.Canvas?.lightAnimations ?? {}).map(([id, a]) => [id, label_of(a, id)])]
        const techniques = []
        try {
            const shader = typeof AdaptiveLightingShader !== 'undefined' ? AdaptiveLightingShader : foundry.canvas?.rendering?.shaders?.AdaptiveLightingShader
            for (const v of Object.values(shader?.COLORATION_TECHNIQUES ?? {})) { if (typeof v?.id === 'number') { techniques.push([v.id, game.i18n.localize(v.label)]) } }
        } catch (err) { /* no technique list: the field is left out */ }
        const k = 'light'
        return `<details class="swim-tv-adv" data-open="light" ${s.open_light ? 'open' : ''}><summary>${esc(t('SWIM.tokenVisionWin.advLight'))}</summary>
            <div class="swim-tv-grid2">
                ${this.#num('l_bright', 'SWIM.tokenVisionWin.bright', k, 'min="0"')}${this.#num('l_dim', 'SWIM.tokenVisionWin.dim', k, 'min="0"')}
                ${this.#num('l_angle', 'SWIM.tokenVisionWin.angle', k, 'min="1" max="360"')}${this.#num('l_alpha', 'SWIM.tokenVisionWin.opacity', k, 'min="0" max="1"')}
                ${techniques.length ? this.#select('l_coloration', 'SWIM.tokenVisionWin.coloration', k, techniques) : ''}${this.#num('l_luminosity', 'SWIM.tokenVisionWin.luminosity', k, 'min="-1" max="1"')}
                ${this.#num('l_attenuation', 'SWIM.tokenVisionWin.attenuation', k, 'min="0" max="1"')}${this.#num('l_saturation', 'SWIM.tokenVisionWin.saturation', k, 'min="-1" max="1"')}
                ${this.#num('l_contrast', 'SWIM.tokenVisionWin.contrast', k, 'min="-1" max="1"')}${this.#num('l_shadows', 'SWIM.tokenVisionWin.shadows', k, 'min="0" max="1"')}
                ${this.#num('l_darkMin', 'SWIM.tokenVisionWin.darkMin', k, 'min="0" max="1"')}${this.#num('l_darkMax', 'SWIM.tokenVisionWin.darkMax', k, 'min="0" max="1"')}
            </div>
            <h5>${esc(t('SWIM.tokenVisionWin.animation'))}</h5>
            <div class="swim-tv-grid2">
                ${this.#select('l_animType', 'SWIM.tokenVisionWin.animation', k, anims)}${this.#num('l_animSpeed', 'SWIM.tokenVisionWin.animSpeed', k, 'min="0" max="10"')}
                ${this.#num('l_animIntensity', 'SWIM.tokenVisionWin.animIntensity', k, 'min="0" max="10"')}
                <label class="swim-hc-check"><input type="checkbox" data-field="l_animReverse" data-adv="light" ${s.l_animReverse ? 'checked' : ''}> <span>${esc(t('SWIM.tokenVisionWin.animReverse'))}</span></label>
            </div></details>`
    }

    async view() {
        const s = this.state
        const levelLabel = t(LEVEL_LANG[this.sceneLevel])
        let head
        if (this.multi) {
            const chips = this.tokens.slice(0, 12).map((tk) => `<span class="swim-hc-chip"><img src="${esc(token_img(tk))}" alt="" width="18" height="18"> ${esc(tk.name)}</span>`).join(' ')
            head = `<div class="swim-hc-who"><div class="swim-tv-multi"><b>${esc(t('SWIM.tokenVisionWin.multiTitle', { count: this.tokens.length }))}</b> <small>${esc(t('SWIM.tokenVisionWin.scene', { level: levelLabel }))}</small><div class="swim-fear-targets">${chips}</div></div></div>`
        } else {
            head = tokens_header([{ token: this.tokens[0], small: t('SWIM.tokenVisionWin.scene', { level: levelLabel }) }])
        }

        let body = this.multi ? `<div class="swim-hc-preview swim-tv-note">${esc(t('SWIM.tokenVisionWin.multiNote'))}</div>` : ''
        // Vision
        body += `<div class="swim-hc-lab">${esc(t('SWIM.tokenVision-visionType'))}</div>
            <div class="swim-hc-rate">${VISION_OPTS.map(([k, icon, lang]) => this.#opt('vision', k, icon, lang, s.vision === k)).join('')}</div>
            <div class="swim-hc-preview swim-tv-preview" data-kind="vision">${this.#vision_preview()}</div>`
        if (s.vision !== 'keep' && s.vision !== 'custom') {
            body += `<div class="swim-hc-lab swim-hc-lab2">${esc(t('SWIM.illumination'))}</div>
                <div class="swim-hc-rate swim-tv-five">${rate_opt('level', 'level', 'scene', t('SWIM.tokenVisionWin.lvlScene'), s.illumination === 'scene')}${LEVELS.map((l) => rate_opt('level', 'level', l, t(LEVEL_LANG[l]), s.illumination === l)).join('')}</div>`
        }
        if (s.vision !== 'keep') { body += this.#vision_advanced() }

        // Light
        const lit = s.light !== 'keep' && s.light !== 'none'
        body += `<div class="swim-hc-lab swim-hc-lab2">${esc(t('SWIM.tokenVision-lightSource'))}</div>
            <div class="swim-hc-rate">${LIGHT_OPTS.map(([k, icon, lang]) => this.#opt('light', k, icon, lang, s.light === k, !this.atl && k !== 'none' && k !== 'keep')).join('')}</div>`
        if (!this.atl) { body += `<div class="swim-hc-preview swim-tv-warn">${esc(t('SWIM.tokenVisionWin.atlMissing'))}</div>` }
        body += `<div class="swim-hc-preview swim-tv-preview" data-kind="light">${this.#light_preview()}</div>`
        if (lit) {
            const sw = Object.entries(LIGHT_COLOURS).map(([k, hex]) => `<span class="swim-tv-swatch ${String(s.l_color).toLowerCase() === hex ? 'is-on' : ''}" data-action="swatch" data-colour="${hex}" title="${esc(t(COLOUR_LANG[k]))}" style="background:${hex}" tabindex="0" role="button"></span>`).join('')
            body += `<div class="swim-hc-ctl"><span>${esc(t('SWIM.tokenVisionWin.colour'))}</span><span class="swim-tv-swatches">${sw}</span><input type="color" data-field="l_color" value="${esc(s.l_color)}" title="${esc(t('SWIM.tokenVision-customColour'))}"></div>`
            body += this.#light_advanced()
        }

        const apply = this.multi ? t('SWIM.tokenVisionWin.applyMany', { count: this.tokens.length }) : t('SWIM.tokenVisionWin.apply')
        return { head, body, foot: `<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('apply', apply, { go: true })}` }
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('details[data-open]').on('toggle', (ev) => {
            this.state[`open_${ev.currentTarget.dataset.open}`] = ev.currentTarget.open
            this.setPosition({ height: 'auto' }) // the window has to grow / shrink with the folded options
        })
        // Editing an advanced field turns the choice into "Custom" without a re-render (that would eat the click on a button).
        html.on('change', '[data-adv]', (ev) => {
            const kind = ev.currentTarget.dataset.adv
            if (this.state[kind === 'vision' ? 'vision' : 'light'] === 'custom') { return }
            this.state[kind === 'vision' ? 'vision' : 'light'] = 'custom'
            html.find(`[data-action="${kind}"]`).each((i, el) => el.classList.toggle('is-on', el.dataset.key === 'custom'))
            html.find(`.swim-tv-preview[data-kind="${kind}"]`).html(kind === 'vision' ? this.#vision_preview() : this.#light_preview())
        })
    }

    async onAction(action, el) {
        const s = this.state
        if (action === 'cancel') { return this.close() }
        if (action === 'vision') {
            s.vision = el.dataset.key
            this.#reload_vision()
            return this.render()
        }
        if (action === 'level') {
            s.illumination = el.dataset.level
            this.#reload_vision()
            return this.render()
        }
        if (action === 'light') {
            const key = el.dataset.key
            if (el.classList.contains('is-off')) { return }
            s.light = key
            if (LIGHT_PRESETS[key]) { Object.assign(s, light_state(default_light_cfg(key))) }
            return this.render()
        }
        if (action === 'swatch') { s.l_color = el.dataset.colour; return this.render() }
        if (action === 'apply') { return this.#apply() }
    }

    async #apply() {
        const s = this.state
        this.busy = true
        try {
            const scene = this.tokens[0].document.parent
            let nvdOn = false
            let nvdOff = false
            const updates = []
            for (const p of this.#plan()) {
                if (p.type === 'keep' || p.skip) { continue }
                const td = p.token.document
                const cur = td.sight.visionMode
                if (p.cfg.mode === 'lightAmplification' && cur !== 'lightAmplification') { nvdOn = true }
                if (cur === 'lightAmplification' && p.cfg.mode !== 'lightAmplification') { nvdOff = true }
                const cfg = this.caps && CONFIG.Canvas?.visionModes?.[p.cfg.mode] ? p.cfg : { ...p.cfg, mode: 'basic' }
                updates.push({ _id: td.id, ...vision_update({ mode: cur, detectionModes: td.detectionModes }, cfg) })
            }
            if (updates.length) { await scene.updateEmbeddedDocuments('Token', updates) }

            let lightChanged = false
            if (s.light !== 'keep') {
                const wanted = s.light === 'none' ? null : { key: s.light, cfg: read_light(s) }
                if (wanted && !this.atl) {
                    ui.notifications.warn(t('SWIM.tokenVisionWin.atlMissing'))
                } else {
                    const done = new Set()
                    for (const token of this.tokens) {
                        const actor = token.actor
                        if (!actor || done.has(actor.uuid)) { continue }
                        done.add(actor.uuid)
                        if (await apply_light(actor, wanted)) { lightChanged = true }
                    }
                }
            }

            let sfx
            if (nvdOn) { sfx = NVD_ON } else if (nvdOff) { sfx = NVD_OFF } else if (lightChanged) { sfx = game.settings.get('swim', 'lightSFX') }
            if (sfx) { swim.play_sfx(sfx) }
        } catch (err) {
            console.error('SWIM | Token Vision failed', err)
            ui.notifications.error(t('SWIM.notification.generalErrorMsg'))
            return
        } finally {
            this.busy = false
        }
        return this.close()
    }
}
