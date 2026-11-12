/*******************************************
 * Small base class + helpers for the simple SWIM windows (Common Bond, Deviation, Dramatic Task Planner, ...).
 * One window per id at a time; the content is rendered from `view()` as `{ body, foot }` HTML (same look and building blocks as the
 * Health Centre: styles/health-centre.css + styles/unshake.css, root `.swim-hc.swim-us`).
 * Subclasses: set `static defaultOptions` (id, title), keep their values in `this.state`, override `view()` and `onAction(action, el)`.
 * Values of elements with `data-field="name"` are written to `this.state[name]` without a re-render (a re-render would close an opened
 * dropdown); checkboxes give booleans, number inputs strings.
 ******************************************/

export const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key))
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => `&#${m.charCodeAt(0)};`)
export const token_img = (token) => (token.document ?? token).texture?.src ?? token.texture?.src ?? ''

export function btn(action, label, { go = false, disabled = false } = {}) {
    return `<button type="button" class="swim-hc-btn ${go ? 'is-go' : ''}" data-action="${action}" ${disabled ? 'disabled' : ''}>${esc(label)}</button>`
}

/** A row of tokens (portrait, small caption, name) for the window header; `arrow: true` puts an arrow between them. */
export function tokens_header(tokens, { arrow = false, bennies = null } = {}) {
    const segs = tokens.map(({ token, small }) => `<div class="swim-hc-seg is-on swim-us-static"><img src="${esc(token_img(token))}" alt=""><span><small>${esc(small)}</small><b>${esc(token.name)}</b></span></div>`)
    const who = segs.join(arrow ? '<span class="swim-us-arrow"><i class="fas fa-arrow-right"></i></span>' : '')
    const track = bennies === null ? '' : `<div class="swim-hc-patient"><div class="swim-hc-tracks"><div class="swim-hc-track swim-us-static"><h5><span>${esc(t('SWIM.healthCentre.bennies'))}</span></h5><div class="swim-hc-num">${bennies}</div></div></div></div>`
    return `<div class="swim-hc-who">${who}</div>${track}`
}

/** One selectable option of a row (`<div class="swim-hc-rate">`): radio-like, handled by `onAction(action, el)` through `data-action`. */
export function rate_opt(action, dataKey, value, label, on) {
    return `<div class="swim-hc-rate-opt ${on ? 'is-on' : ''}" data-action="${action}" data-${dataKey}="${esc(value)}" tabindex="0" role="radio" aria-checked="${!!on}">${esc(label)}</div>`
}

export function checkbox(field, label, checked) {
    return `<label class="swim-hc-check"><input type="checkbox" data-field="${field}" ${checked ? 'checked' : ''}> <span>${esc(label)}</span></label>`
}

export class SwimWindow extends Application {
    static #open = new Map()

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['swim-hc-app', 'swim-us-app'],
            width: 470,
            height: 'auto',
            resizable: false,
        })
    }

    /** Opens `app`, closing an older window with the same id. */
    static async show(app) {
        await SwimWindow.#open.get(app.options.id)?.close()
        SwimWindow.#open.set(app.options.id, app)
        await app.render(true)
        return app
    }

    state = {}
    busy = false

    /** @returns {Promise<{body: string, foot: string, head?: string}>} */
    async view() { return { body: '', foot: '' } }
    async onAction(action, el, ev) { }

    async _renderInner() {
        const v = await this.view()
        return $(`<div class="swim-hc swim-us">${v.head ?? ''}<div class="swim-hc-body">${v.body}</div><footer class="swim-hc-foot">${v.foot}</footer></div>`)
    }

    activateListeners(html) {
        super.activateListeners(html)
        const run = (ev) => {
            const el = ev.currentTarget
            if (this.busy || el.disabled) { return }
            this.onAction(el.dataset.action, el, ev)
        }
        html.on('click', '[data-action]', (ev) => {
            if (ev.target.closest('select, option, input, label')) { return }
            run(ev)
        })
        html.on('keydown', '[data-action]', (ev) => {
            if ((ev.key === 'Enter' || ev.key === ' ') && ev.currentTarget.tagName !== 'BUTTON' && ev.target === ev.currentTarget) {
                ev.preventDefault()
                run(ev)
            }
        })
        html.on('change input', '[data-field]', (ev) => {
            const el = ev.currentTarget
            this.state[el.dataset.field] = el.type === 'checkbox' ? el.checked : el.value
        })
    }

    async close(options) {
        if (SwimWindow.#open.get(this.options.id) === this) { SwimWindow.#open.delete(this.options.id) }
        return super.close(options)
    }
}
