import { LegacyApp } from "./legacy_app.js"
/**
 * The Edge picker for Warrior's Gift (Effect Builder): one Combat Edge for each target.
 *
 * Same look as the actor picker (Shape Changer / Summoner, styles/actor-picker.css) plus styles/edge-picker.css:
 * - Header: the caster and one button per target (portrait, name, the Edge picked for it). The highlighted target is the one the next click
 *   on an Edge is for; after a pick the next target without an Edge is selected automatically.
 * - Body: a filter and the Edges grouped by rank (Novice ... Legendary), sorted by name. Edges above the caster's rank are greyed out;
 *   players can't pick them, the GM can. The portraits at the right of a row show which targets got that Edge (click it again to take it back).
 * - Footer: Cancel / Grant Edges (enabled once every target has an Edge).
 *
 * `EdgePickerApp.prompt({...})` resolves with `[{targetID, edgeID}]` (in the order of the targets) or `null` (cancelled / closed).
 */

import { rank_names } from "./actor_picker.js"
import { is_improved_edge } from "./combat_edges.js"

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => `&#${m.charCodeAt(0)};`)
const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key))

export class EdgePickerApp extends LegacyApp {
    #opts
    #assign = new Map() // targetID -> edge id
    #active
    #resolve
    #done = false

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "swim-edge-picker",
            classes: ["swim-ap-app", "swim-ep-app"],
            width: 540,
            height: "auto",
            resizable: false,
        })
    }

    /**
     * @param {object} data
     * @param {string} data.title
     * @param {{name,img,rankIdx}} data.caster
     * @param {Array<{id,name,img}>} data.targets
     * @param {Array} data.edges        from load_combat_edges()
     * @param {boolean} [data.isGM]     the GM can pick Edges above the caster's rank
     * @param {boolean} [data.raise]    Raise: improved Edges (SWID 'improved-...') are open to everyone
     * @returns {Promise<Array<{targetID:string, edgeID:string}>|null>}
     */
    static prompt(data) {
        return new Promise((resolve) => new EdgePickerApp(data, resolve).render(true))
    }

    constructor(data, resolve) {
        super()
        this.#opts = data
        this.#resolve = resolve
        this.#active = data.targets[0]?.id
        this.options.window.title = data.title
    }

    get title() { return this.#opts.title }

    /* -------------------------------- helpers -------------------------------- */

    #rankName = (idx) => String(rank_names()[idx] ?? "?")
    // With a Raise the improved versions of Edges ('improved-...') are never locked, whatever the rank (and for everyone).
    #locked = (e) => e.rankIdx > (this.#opts.caster.rankIdx ?? 0) && !(this.#opts.raise && is_improved_edge(e.swid))
    #blocked = (e) => this.#locked(e) && !this.#opts.isGM
    #entry = (id) => this.#opts.edges.find((e) => e.id === id)
    #targetsOf = (edgeId) => this.#opts.targets.filter((x) => this.#assign.get(x.id) === edgeId)

    /* -------------------------------- rendering ------------------------------- */

    async _renderInner() {
        const { caster, targets } = this.#opts
        const rank = this.#rankName(caster.rankIdx ?? 0)
        const buttons = targets.map((tg) => `
          <button type="button" class="swim-ep-target" data-target="${esc(tg.id)}">
            <img class="swim-ap-token" src="${esc(tg.img)}" alt="">
            <span><b>${esc(tg.name)}</b><small class="swim-ep-pick"></small></span>
          </button>`).join("")
        return $(`
      <div class="swim-ap swim-ep swim-ap--no-rank-badge">
        <header class="swim-ap-head">
          <div class="swim-ep-who">
            <span class="swim-ap-actor"><img class="swim-ap-token" src="${esc(caster.img)}" alt=""><b>${esc(caster.name)}</b></span>
            <i class="fas fa-arrow-down swim-ap-arrow"></i>
            <div class="swim-ep-targets" role="tablist">${buttons}</div>
          </div>
          <p class="swim-ap-help"><i class="fas fa-fist-raised"></i> ${esc(t("SWIM.warriorsGiftWin.help", { caster: caster.name, rank }))}</p>
          <label class="swim-ap-search"><i class="fas fa-search"></i>
            <input type="search" class="swim-ap-filter" placeholder="${esc(t("SWIM.warriorsGiftWin.filter"))}" autocomplete="off"></label>
        </header>
        <div class="swim-ap-list" role="listbox"></div>
        <footer class="swim-ap-foot">
          <span class="swim-ap-status" role="status" aria-live="polite"></span>
          <span class="swim-ap-spacer"></span>
          <button type="button" class="swim-ap-cancel"><i class="fas fa-times"></i> ${esc(t("SWIM.picker.cancel"))}</button>
          <button type="button" class="swim-ap-apply" disabled><i class="fas fa-fist-raised"></i> <span>${esc(t("SWIM.warriorsGiftWin.confirm"))}</span></button>
        </footer>
      </div>`)
    }

    activateListeners(html) {
        super.activateListeners(html)
        const root = html[0]
        const list = root.querySelector(".swim-ap-list")
        const filter = root.querySelector(".swim-ap-filter")
        this.#renderList(root)
        this.#paint(root)

        filter.addEventListener("input", () => { this.#renderList(root); this.#paint(root) })
        root.querySelector(".swim-ap-cancel").addEventListener("click", () => this.close())
        root.querySelector(".swim-ap-apply").addEventListener("click", () => this.#confirm())
        root.querySelector(".swim-ep-targets").addEventListener("click", (ev) => {
            const button = ev.target.closest(".swim-ep-target")
            if (!button) { return }
            this.#active = button.dataset.target
            this.#paint(root)
            // Show the Edge of that target:
            list.querySelector(".swim-ap-row.is-selected")?.scrollIntoView({ block: "nearest" })
        })
        list.addEventListener("click", (ev) => {
            const row = ev.target.closest(".swim-ap-row")
            if (row) { this.#choose(root, row.dataset.id) }
        })
        list.addEventListener("dblclick", (ev) => {
            // One target: double-click picks and confirms.
            const row = ev.target.closest(".swim-ap-row")
            if (!row || this.#opts.targets.length !== 1) { return }
            const entry = this.#entry(row.dataset.id)
            if (!entry || this.#blocked(entry)) { return }
            this.#assign.set(this.#active, entry.id)
            this.#confirm()
        })
        list.addEventListener("keydown", (ev) => {
            if (ev.key !== "Enter" && ev.key !== " ") { return }
            const row = ev.target.closest(".swim-ap-row")
            if (!row) { return }
            ev.preventDefault()
            this.#choose(root, row.dataset.id)
        })
        this.#tooltips(root, list)
        filter.focus()
    }

    /* ------------------------------- tooltip --------------------------------- */

    /** The description of an Edge with its HTML formatting (enriched once, then cached). */
    async #descriptionHTML(e) {
        this.#enriched ??= new Map()
        if (!this.#enriched.has(e.id)) {
            let html = e.description || ""
            try { html = await foundry.applications.ux.TextEditor.implementation.enrichHTML(html) } catch { /* the plain HTML is fine */ }
            this.#enriched.set(e.id, html)
        }
        return this.#enriched.get(e.id)
    }
    #enriched

    /** A floating tooltip beside the hovered row: name, why it is locked (if so), the requirements and the description. */
    #tooltips(root, list) {
        const tip = document.createElement("div")
        tip.className = "swim-ep-tip"
        tip.setAttribute("role", "tooltip")
        tip.hidden = true
        document.body.appendChild(tip)
        this.#tip = tip
        let current = null
        const hide = () => { current = null; tip.hidden = true }
        const place = (row) => {
            const r = row.getBoundingClientRect()
            const w = tip.offsetWidth, h = tip.offsetHeight, gap = 10
            let left = r.right + gap
            if (left + w > window.innerWidth - 4) { left = Math.max(4, r.left - gap - w) }
            const top = Math.min(Math.max(4, r.top), Math.max(4, window.innerHeight - h - 4))
            tip.style.left = `${left}px`
            tip.style.top = `${top}px`
        }
        list.addEventListener("mouseover", async (ev) => {
            const row = ev.target.closest(".swim-ap-row")
            if (!row) { return }
            if (row === current) { return }
            current = row
            const e = this.#entry(row.dataset.id)
            if (!e) { return hide() }
            const lock = this.#locked(e)
                ? `<p class="swim-ep-tip-lock">${esc(this.#opts.isGM
                    ? t("SWIM.warriorsGiftWin.gmOverride", { name: this.#opts.caster.name })
                    : t("SWIM.warriorsGiftWin.requiresRank", { name: e.name, rank: this.#rankName(e.rankIdx), caster: this.#opts.caster.name }))}</p>`
                : ""
            tip.innerHTML = `<h5>${esc(e.name)}</h5>${e.requirements ? `<p class="swim-ep-tip-req">${esc(e.requirements)}</p>` : ""}${lock}<div class="swim-ep-tip-desc">…</div>`
            tip.hidden = false
            place(row)
            const html = await this.#descriptionHTML(e)
            if (current !== row) { return }
            tip.querySelector(".swim-ep-tip-desc").innerHTML = html || `<em>${esc(t("SWIM.warriorsGiftWin.noDescription"))}</em>`
            place(row)
        })
        list.addEventListener("mouseleave", hide)
        list.addEventListener("scroll", hide, { passive: true })
        list.addEventListener("mouseout", (ev) => { if (!ev.relatedTarget || !list.contains(ev.relatedTarget)) { hide() } })
    }
    #tip

    /** Gives the Edge to the highlighted target (or takes it back if it already has it) and moves on to the next target without an Edge. */
    #choose(root, id) {
        const entry = this.#entry(id)
        if (!entry || this.#blocked(entry) || !this.#active) { return }
        if (this.#assign.get(this.#active) === id) {
            this.#assign.delete(this.#active)
        } else {
            this.#assign.set(this.#active, id)
            const order = this.#opts.targets.map((x) => x.id)
            const start = order.indexOf(this.#active)
            const next = [...order.slice(start + 1), ...order.slice(0, start)].find((x) => !this.#assign.has(x))
            if (next) { this.#active = next }
        }
        this.#paint(root)
    }

    /** Updates everything that depends on the picks (target buttons, marks on the rows, footer) without rebuilding the list. */
    #paint(root) {
        const { targets } = this.#opts
        const pick = (id) => this.#entry(this.#assign.get(id))
        for (const button of root.querySelectorAll(".swim-ep-target")) {
            const id = button.dataset.target
            const entry = pick(id)
            button.classList.toggle("is-active", id === this.#active)
            button.classList.toggle("is-done", !!entry)
            button.setAttribute("aria-selected", String(id === this.#active))
            button.querySelector(".swim-ep-pick").textContent = entry ? entry.name : t("SWIM.warriorsGiftWin.noPick")
        }
        const activeEdge = this.#assign.get(this.#active)
        for (const row of root.querySelectorAll(".swim-ap-row")) {
            const on = row.dataset.id === activeEdge
            row.classList.toggle("is-selected", on)
            row.setAttribute("aria-selected", String(on))
            row.querySelector(".swim-ep-by").innerHTML = this.#targetsOf(row.dataset.id)
                .map((tg) => `<img src="${esc(tg.img)}" alt="" title="${esc(tg.name)}">`).join("")
        }
        const done = targets.filter((x) => this.#assign.has(x.id)).length
        root.querySelector(".swim-ap-apply").disabled = done < targets.length
        const status = root.querySelector(".swim-ap-status")
        const lockedPick = targets.map((x) => pick(x.id)).find((e) => e && this.#locked(e))
        status.textContent = lockedPick
            ? t("SWIM.warriorsGiftWin.gmOverride", { name: this.#opts.caster.name })
            : t("SWIM.warriorsGiftWin.progress", { done, total: targets.length })
        status.title = status.textContent
    }

    #renderList(root) {
        const q = root.querySelector(".swim-ap-filter").value.trim().toLowerCase()
        const shown = this.#opts.edges.filter((e) => !q || e.name.toLowerCase().includes(q))
        const collator = new Intl.Collator(game.i18n.lang, { numeric: true, sensitivity: "base" })
        const groups = new Map()
        for (const e of shown) {
            if (!groups.has(e.rankIdx)) { groups.set(e.rankIdx, []) }
            groups.get(e.rankIdx).push(e)
        }
        const html = [...groups.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([rankIdx, entries]) => {
                const rows = [...entries].sort((a, b) => collator.compare(a.name, b.name)).map((e) => this.#row(e)).join("")
                return `<section class="swim-ap-group"><h4>${esc(this.#rankName(rankIdx))}</h4>${rows}</section>`
            })
            .join("")
        root.querySelector(".swim-ap-list").innerHTML = html || `<p class="swim-ap-empty">${esc(t("SWIM.warriorsGiftWin.noMatch", { query: q }))}</p>`
    }

    #row(e) {
        const locked = this.#locked(e)
        const chip = (value) => (value ? `<span class="swim-ap-chip">${esc(value)}</span>` : "")
        const classes = ["swim-ap-row", locked ? "is-locked" : "", locked && !this.#opts.isGM ? "is-blocked" : ""].join(" ").trim()
        return `<div class="${classes}" data-id="${esc(e.id)}" role="option" tabindex="0" aria-selected="false" ${locked ? `aria-disabled="${String(!this.#opts.isGM)}"` : ""}>
      <img class="swim-ap-icon" src="${esc(e.img)}" alt="" draggable="false">
      <span class="swim-ap-name"><span class="swim-ap-nametext">${esc(e.name)}</span><span class="swim-ap-chips">${chip(e.category)}${chip(e.requirements)}</span></span>
      <span class="swim-ep-by"></span>
    </div>`
    }

    /* -------------------------------- lifecycle ------------------------------- */

    #confirm() {
        if (this.#done) { return }
        if (this.#opts.targets.some((x) => !this.#assign.has(x.id))) { return }
        this.#done = true
        this.#resolve(this.#opts.targets.map((x) => ({ targetID: x.id, edgeID: this.#assign.get(x.id) })))
        this.close() // (#done is set: no null is sent; removes the tooltip)
    }

    async close(options) {
        this.#tip?.remove()
        if (!this.#done) {
            this.#done = true
            this.#resolve(null)
        }
        return super.close(options)
    }
}
