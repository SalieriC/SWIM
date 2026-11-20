/**
 * Base class of all SWIM windows on Foundry v14's ApplicationV2.
 *
 * SWIM's windows were written against Application V1 (`static get defaultOptions`, `_renderInner()` returning jQuery,
 * `activateListeners(html)` with jQuery). ApplicationV2 replaces that API, and Application V1 is removed in Foundry v16.
 * This class keeps the small part of the V1 contract SWIM's windows use and implements it on ApplicationV2:
 *
 * - `static get defaultOptions()` returns V1 style options (`id, classes, width, height, resizable, title`), they are translated to V2 options.
 * - `_renderInner()` returns the window content (jQuery, HTMLElement or HTML string); it is put into the window on every render.
 * - `activateListeners(html)` is called after every render with the jQuery of the content root (the content is replaced on a render, listeners never stack).
 * - `render(true/false)` works as before (V2 accepts the boolean).
 *
 * Notes for subclasses: `this.element` is an HTMLElement now (not jQuery); the window title is `this.options.window.title` (or override `get title()`).
 * jQuery itself is still loaded by Foundry v14 and is used inside the windows; new code should prefer plain DOM.
 */
const { ApplicationV2 } = foundry.applications.api

/** V1 style options -> ApplicationV2 options. */
function to_v2(o) {
    const { id, classes, width, height, resizable, title, minimizable } = o
    const v2 = {
        classes: [...(classes ?? [])],
        position: { height: height ?? 'auto' },
        window: { resizable: !!resizable, minimizable: minimizable ?? true },
    }
    if (id) { v2.id = id }
    if (width !== undefined) { v2.position.width = width }
    if (title) { v2.window.title = title }
    return v2
}

export class LegacyApp extends ApplicationV2 {
    /** V1 style defaults; subclasses merge their own on top with `foundry.utils.mergeObject(super.defaultOptions, {...})`. */
    static get defaultOptions() {
        return { classes: [], width: 470, height: 'auto', resizable: false }
    }

    constructor(options = {}) {
        super(to_v2(foundry.utils.mergeObject(new.target.defaultOptions, options, { inplace: false })))
    }

    /** @returns {Promise<jQuery|HTMLElement|string>} The content of the window. */
    async _renderInner() { return '' }

    /** @param {jQuery} html The content root. */
    activateListeners(html) { }

    async _renderHTML(context, options) {
        const inner = await this._renderInner()
        if (inner instanceof HTMLElement) { return inner }
        if (inner?.jquery) { return inner[0] }
        const tpl = document.createElement('template')
        tpl.innerHTML = String(inner ?? '').trim()
        return tpl.content.firstElementChild ?? document.createElement('div')
    }

    _replaceHTML(result, content, options) {
        content.replaceChildren(result)
        this.activateListeners($(result))
    }
}
