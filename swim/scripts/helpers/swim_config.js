import { SwimWindow, t, esc, btn } from './swim_window.js'
import { play_audio } from './audio.js'

/*******************************************
 * SWIM Configuration window (replaces the old FormApplication + customConfig.hbs).
 * Tabs, live search over all tabs, changed rows highlighted, per-setting reset, file pickers (+ sound preview), saves only what changed
 * and - instead of reloading the page blindly - asks with Foundry's own dialog if a setting that needs a reload was changed.
 * Settings come from `settingVariables` in settings.js; `reload: true` on an entry marks a setting that is only read at start-up.
 ******************************************/

/** Value of a setting as it is stored: Boolean / Number / String. */
function norm(s, v) {
    if (s.config_type === Boolean) { return !!v }
    if (s.config_type === Number) {
        const n = Number.parseFloat(String(v ?? '').replace(',', '.'))
        return Number.isFinite(n) ? n : Number(s.default)
    }
    return String(v ?? '')
}

/** Foundry's own "reload" dialog (falls back to a plain confirm if the core helper is missing). */
export async function reload_confirm() {
    if (typeof SettingsConfig !== 'undefined' && typeof SettingsConfig.reloadConfirm === 'function') { return SettingsConfig.reloadConfirm({ world: true }) }
    const yes = await Dialog.confirm({ title: t('SWIM.configWin.reloadTitle'), content: `<p>${esc(t('SWIM.configWin.reloadBody'))}</p>` })
    if (yes) {
        if (game.user.isGM) { game.socket.emit('reload') }
        window.location.reload()
    }
}

export class SwimConfigApp extends SwimWindow {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, { classes: ['swim-hc-app', 'swim-us-app', 'swim-cfg-app'], resizable: true })
    }

    constructor(settings) {
        super({ id: 'swim-custom-config', title: t('SWIM.ConfigMenuName'), width: 780 })
        this.settings = settings
        this.tabs = [...new Set(settings.map((s) => s.tab))]
        this.state.tab = this.tabs[0]
        this.state.q = ''
        for (const s of settings) {
            const v = game.settings.get('swim', s.id)
            this.state[s.id] = s.config_type === Boolean ? !!v : String(v ?? '')
        }
    }

    #saved(s) { return norm(s, game.settings.get('swim', s.id)) }
    #dirty() { return this.settings.filter((s) => norm(s, this.state[s.id]) !== this.#saved(s)) }

    #control(s) {
        const v = this.state[s.id]
        const f = `data-field="${esc(s.id)}"`
        if (s.config_type === Boolean) { return `<input type="checkbox" ${f} ${v ? 'checked' : ''}>` }
        if (Array.isArray(s.options) && s.options.length) {
            const opts = s.options.map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(v) ? 'selected' : ''}>${esc(o.locaString ? t(o.locaString) : (o.name ?? o.value))}</option>`).join('')
            return `<select ${f}>${opts}</select>`
        }
        if (s.config_type === Number) {
            return `<input type="number" ${f} value="${esc(v)}" ${s.min !== undefined ? `min="${s.min}"` : ''} ${s.max !== undefined ? `max="${s.max}"` : ''} step="${s.step ?? 'any'}">`
        }
        let out = `<input type="text" ${f} value="${esc(v)}">`
        if (s.picker) { out += `<button type="button" class="swim-hc-btn swim-cfg-ico" data-action="browse" data-id="${esc(s.id)}" title="${esc(t('SWIM.configWin.browse'))}"><i class="fas fa-folder-open"></i></button>` }
        if (s.picker === 'audio') { out += `<button type="button" class="swim-hc-btn swim-cfg-ico" data-action="play" data-id="${esc(s.id)}" title="${esc(t('SWIM.configWin.play'))}"><i class="fas fa-play"></i></button>` }
        return out
    }

    #row(s) {
        const name = t(`SWIM.${s.id}Name`)
        const hint = t(`SWIM.${s.id}Hint`)
        const badge = s.reload ? `<span class="swim-cfg-badge" title="${esc(t('SWIM.configWin.needsReloadTip'))}">${esc(t('SWIM.configWin.needsReload'))}</span>` : ''
        return `<div class="swim-cfg-row" data-id="${esc(s.id)}" data-text="${esc(`${name} ${hint}`.toLowerCase())}">
            <div class="swim-cfg-info"><b>${esc(name)}</b>${badge}<small>${esc(hint)}</small></div>
            <div class="swim-cfg-ctl">${this.#control(s)}<button type="button" class="swim-cfg-reset" data-action="reset" data-id="${esc(s.id)}" title="${esc(t('SWIM.configWin.reset'))}"><i class="fas fa-undo"></i></button></div></div>`
    }

    async view() {
        const head = `<div class="swim-cfg-top"><input type="search" class="swim-cfg-search" value="${esc(this.state.q)}" placeholder="${esc(t('SWIM.configWin.search'))}"></div>
            <div class="swim-cfg-tabs">${this.tabs.map((tab) => `<div class="swim-hc-rate-opt swim-cfg-tab" data-action="tab" data-tab="${esc(tab)}" tabindex="0" role="tab">${esc(tab)}</div>`).join('')}</div>`
        const panels = this.tabs.map((tab) => `<section class="swim-cfg-panel" data-tab="${esc(tab)}"><h4 class="swim-cfg-ptitle">${esc(tab)}</h4>${this.settings.filter((s) => s.tab === tab).map((s) => this.#row(s)).join('')}</section>`).join('')
        const body = `${panels}<p class="swim-cfg-none" hidden>${esc(t('SWIM.configWin.noResults'))}</p>
            <div class="swim-cfg-donate"><p><strong>${esc(t('SWIM.configWin.donate'))}</strong></p><a href="https://ko-fi.com/Q5Q72EE4Z" target="_blank" rel="noopener"><img height="36" style="border:0;height:36px;" src="https://storage.ko-fi.com/cdn/kofi2.png?v=6" alt="Buy Me a Coffee at ko-fi.com"></a></div>`
        const foot = `<span class="swim-cfg-count"></span><span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('save', t('SWIM.Save'), { go: true })}`
        return { head, body, foot }
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.on('change input', '[data-field]', () => this.#refresh())
        html.on('input', '.swim-cfg-search', (ev) => { this.state.q = ev.currentTarget.value; this.#filter() })
        this.#show_tab(this.state.tab)
        this.#filter()
        this.#refresh()
    }

    /** Highlights changed rows, shows reset buttons for non-default values, updates the counter and the save button. */
    #refresh() {
        const root = this.element
        if (!root?.length) { return }
        for (const s of this.settings) {
            const row = root.find(`.swim-cfg-row[data-id="${s.id}"]`)
            row.toggleClass('is-changed', norm(s, this.state[s.id]) !== this.#saved(s))
            row.find('.swim-cfg-reset').toggleClass('is-default', norm(s, this.state[s.id]) === norm(s, s.default))
        }
        const n = this.#dirty().length
        root.find('.swim-cfg-count').text(n ? t('SWIM.configWin.changes', { count: n }) : t('SWIM.configWin.noChanges'))
        root.find('[data-action="save"]').prop('disabled', !n)
    }

    #show_tab(tab) {
        this.state.tab = tab
        const root = this.element
        root.find('.swim-cfg-tab').each((_, el) => { el.classList.toggle('is-on', el.dataset.tab === tab) })
        root.find('.swim-cfg-panel').each((_, el) => { el.classList.toggle('is-on', el.dataset.tab === tab) })
    }

    /** Live search over all tabs: while something is typed all matching rows of every tab are shown. */
    #filter() {
        const root = this.element
        const q = this.state.q.trim().toLowerCase()
        root.toggleClass('is-search', !!q)
        let any = false
        root.find('.swim-cfg-panel').each((_, panel) => {
            let hits = 0
            panel.querySelectorAll('.swim-cfg-row').forEach((row) => {
                const hide = !!q && !row.dataset.text.includes(q)
                row.hidden = hide
                if (!hide) { hits++ }
            })
            panel.classList.toggle('is-empty', !!q && hits === 0)
            if (hits) { any = true }
        })
        root.find('.swim-cfg-none').prop('hidden', !q || any)
    }

    #set(id, value) {
        this.state[id] = value
        const input = this.element.find(`[data-field="${id}"]`)
        if (input.attr('type') === 'checkbox') { input.prop('checked', !!value) } else { input.val(value) }
        this.#refresh()
    }

    async onAction(action, el) {
        const s = this.settings.find((x) => x.id === el.dataset.id)
        switch (action) {
            case 'tab': return this.#show_tab(el.dataset.tab)
            case 'reset': return this.#set(s.id, s.config_type === Boolean ? !!s.default : String(s.default ?? ''))
            case 'browse':
                return new FilePicker({ type: s.picker, current: this.state[s.id], callback: (path) => this.#set(s.id, path) }).browse()
            case 'play':
                if (this.state[s.id]) { play_audio(this.state[s.id], { push: false }).catch((err) => console.warn('SWIM | Could not play sound', err)) }
                return
            case 'cancel': return this.close()
            case 'save': return this.#save()
        }
    }

    async #save() {
        const changed = this.#dirty()
        if (!changed.length) { return this.close() }
        this.busy = true
        try {
            for (const s of changed) { await game.settings.set('swim', s.id, norm(s, this.state[s.id])) }
        } catch (err) {
            console.error('SWIM | Saving the configuration failed', err)
            ui.notifications.error(t('SWIM.notification.generalErrorMsg'))
            this.busy = false
            return
        }
        this.busy = false
        await this.close()
        if (changed.some((s) => s.reload)) { reload_confirm() }
    }
}
