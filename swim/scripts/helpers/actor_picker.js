/**
 * The actor picker dialog, used by the Mighty Summoner and the Shape Changer.
 *
 * - Header: the caster and (live) the picked creature, a short explanation and a filter.
 * - Body, two grouping modes (`groupBy`):
 *   - 'rank' (Shape Changer): grouped by the rank that is required for the creature's Size
 *     (Novice: Size -4 to -1, Seasoned: Size 0, Veteran: Size 1 to 2, Heroic: Size 3 to 4, Legendary: Size 5+), sorted by Size.
 *   - 'folder' (Summoner): grouped by the name of the actor's parent folder, folders and creatures sorted by name.
 *   Entries with a `rankIdx` above the caster's rank are greyed out when `enforceRank` is on (players can't pick them, the GM can).
 *   Click a row (or Tab + Enter / Space) to select it, double-click to select and confirm.
 * - Optional extras between list and footer (checkbox, number, select) and an optional second action ("Revert form").
 * - Footer: Cancel / [Revert] / Confirm (enabled once a creature is selected).
 *
 * `ActorPickerApp.prompt({...})` resolves with `{ action: 'select' | 'revert', id, values }` or `null` (cancelled / closed).
 * `values` holds the extras by id (checkbox: boolean, number: Number, select: string).
 * Styles: styles/actor-picker.css (registered in module.json), shared by both dialogs; variants are modifier classes on the
 * root (`swim-ap--folders`, `swim-ap--no-rank-badge`). Look is based on the Mimic dialog.
 */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => `&#${m.charCodeAt(0)};`);
const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key));

/** Pentagram in a circle (Font Awesome has none that is free). Follows the text colour and size. */
const PENTAGRAM_SVG = `<svg class="swim-ap-glyph" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
  <circle cx="12" cy="12" r="10.6" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <path d="M12 2.4 L17.64 19.77 L2.87 9.03 L21.13 9.03 L6.36 19.77 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
</svg>`;

/** Icon markup: 'pentagram' = the glyph above, anything else is taken as Font Awesome classes. */
const icon_html = (icon) => (icon === 'pentagram' ? PENTAGRAM_SVG : `<i class="${esc(icon)}"></i>`);

/** Index 0-4 (Novice ... Legendary) of the rank required for a creature of this Size. */
export function rank_for_size(size) {
    size = Number(size) || 0;
    if (size <= -1) return 0;
    if (size === 0) return 1;
    if (size <= 2) return 2;
    if (size <= 4) return 3;
    return 4;
}

/** Index 0-4 of an actor's rank, from its advances (same thresholds as SWADE). */
export function rank_of_actor(actor) {
    const advances = Number(actor?.system?.advances?.value) || 0;
    if (advances < 4) return 0;
    if (advances < 8) return 1;
    if (advances < 12) return 2;
    if (advances < 16) return 3;
    return 4;
}

/** Localised rank names (SWADE's own), Novice first. */
export function rank_names() {
    return ['Novice', 'Seasoned', 'Veteran', 'Heroic', 'Legendary'].map((r) => t(`SWADE.Ranks.${r}`));
}

/** Entry for the picker from an actor. `extra` can override id/name/group/folder/rankIdx (`rankIdx: null` = no rank requirement). */
export function picker_entry(actor, extra = {}) {
    const stats = actor.system?.stats ?? {};
    const size = Number(stats.size) || 0;
    return {
        id: actor.id,
        name: actor.name,
        img: actor.img,
        size,
        pace: stats.speed?.adjusted ?? stats.speed?.value,
        parry: stats.parry?.value,
        toughness: stats.toughness?.value,
        armor: stats.toughness?.armor,
        rankIdx: rank_for_size(size),
        folder: actor.folder?.name ?? '',
        ...extra,
    };
}

export class ActorPickerApp extends Application {
    #opts;
    #selected = null;
    #resolve;
    #done = false;

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'swim-actor-picker',
            classes: ['swim-ap-app'],
            width: 500,
            height: 'auto',
            resizable: false,
        });
    }

    /**
     * @param {object} data
     * @param {string} data.title
     * @param {string} data.intro                    plain text shown under the header
     * @param {{name,img,rankIdx}} data.caster
     * @param {Array} data.entries                   see picker_entry(); `group: 'special'` puts an entry in its own group on top
     * @param {'rank'|'folder'} [data.groupBy='rank']
     * @param {boolean} [data.showRankBadge=true]    the circle with the rank letter on the right of each row (rank mode only)
     * @param {'arrow'|'link'} [data.bond='arrow']   what is drawn between the caster and the picked creature in the header
     * @param {string} [data.introIcon='fas fa-paw'] icon in front of the intro text ('pentagram' or Font Awesome classes)
     * @param {boolean} [data.enforceRank=false]     grey out (and for players block) entries whose `rankIdx` is above the caster's rank
     * @param {boolean} [data.isGM]
     * @param {string} data.confirmLabel
     * @param {string} [data.confirmIcon]          'pentagram' or Font Awesome classes
     * @param {{label:string, icon?:string}} [data.revert]   second action, always enabled
     * @param {Array<{type:'checkbox'|'number'|'select', id, label, hint?, value?, options?:[{value,label}]}>} [data.extras]
     * @returns {Promise<{action:string, id?:string, values:object}|null>}
     */
    static prompt(data) {
        return new Promise((resolve) => new ActorPickerApp(data, resolve).render(true));
    }

    constructor(data, resolve) {
        super();
        this.#opts = data;
        this.#resolve = resolve;
        this.options.title = data.title;
    }

    get title() {
        return this.#opts.title;
    }

    /* -------------------------------- helpers -------------------------------- */

    #rankName = (idx) => String(rank_names()[idx] ?? '?');
    #locked = (e) => this.#opts.enforceRank === true && e.rankIdx != null && e.rankIdx > (this.#opts.caster.rankIdx ?? 0);
    #byRank = () => (this.#opts.groupBy ?? 'rank') === 'rank';
    #blocked = (e) => this.#locked(e) && !this.#opts.isGM;
    #entry = (id) => this.#opts.entries.find((e) => e.id === id);

    /* -------------------------------- rendering ------------------------------- */

    async _renderInner() {
        const { caster, intro, introIcon, bond, confirmLabel, confirmIcon, revert, extras } = this.#opts;
        const bondHtml = bond === 'link'
            ? `<span class="swim-ap-bond" title="${esc(t('SWIM.picker.bound'))}"><i class="fas fa-link"></i></span>`
            : `<i class="fas fa-arrow-right swim-ap-arrow"></i>`;
        const modifiers = [this.#byRank() ? '' : 'swim-ap--folders', this.#byRank() && this.#opts.showRankBadge !== false ? '' : 'swim-ap--no-rank-badge'].join(' ').trim();
        const extrasHtml = (extras ?? []).map((x) => this.#extra(x)).join('');
        return $(`
      <div class="swim-ap ${modifiers}">
        <header class="swim-ap-head">
          <div class="swim-ap-who">
            <span class="swim-ap-actor"><img class="swim-ap-token" src="${esc(caster.img)}" alt=""><b>${esc(caster.name)}</b></span>
            ${bondHtml}
            <span class="swim-ap-actor swim-ap-picked"><img class="swim-ap-token" src="" alt="" hidden>
              <i class="fas fa-question swim-ap-token swim-ap-token-empty"></i><b>…</b></span>
          </div>
          <p class="swim-ap-help">${icon_html(introIcon ?? 'fas fa-paw')} ${esc(intro)}</p>
          <label class="swim-ap-search"><i class="fas fa-search"></i>
            <input type="search" class="swim-ap-filter" placeholder="${esc(t('SWIM.picker.filter'))}" autocomplete="off"></label>
        </header>
        <div class="swim-ap-list" role="listbox"></div>
        ${extrasHtml ? `<div class="swim-ap-extras">${extrasHtml}</div>` : ''}
        <footer class="swim-ap-foot">
          <span class="swim-ap-status" role="status" aria-live="polite"></span>
          <span class="swim-ap-spacer"></span>
          <button type="button" class="swim-ap-cancel"><i class="fas fa-times"></i> ${esc(t('SWIM.picker.cancel'))}</button>
          ${revert ? `<button type="button" class="swim-ap-revert">${icon_html(revert.icon ?? 'fas fa-user-alt')} ${esc(revert.label)}</button>` : ''}
          <button type="button" class="swim-ap-apply" disabled>${icon_html(confirmIcon ?? 'fas fa-check')} <span>${esc(confirmLabel)}</span></button>
        </footer>
      </div>`);
    }

    #extra(x) {
        const hint = x.hint ? `<small class="swim-ap-hint">${esc(x.hint)}</small>` : '';
        if (x.type === 'checkbox') {
            return `<label class="swim-ap-field swim-ap-check"><input type="checkbox" data-extra="${esc(x.id)}" ${x.value ? 'checked' : ''}>
              <span>${esc(x.label)}${hint}</span></label>`;
        }
        if (x.type === 'number') {
            return `<label class="swim-ap-field"><span>${esc(x.label)}${hint}</span>
              <input type="number" data-extra="${esc(x.id)}" value="${esc(x.value)}"></label>`;
        }
        if (x.type === 'select') {
            const options = (x.options ?? []).map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('');
            return `<label class="swim-ap-field"><span>${esc(x.label)}${hint}</span><select data-extra="${esc(x.id)}">${options}</select></label>`;
        }
        return '';
    }

    activateListeners(html) {
        super.activateListeners(html);
        const root = html[0];
        const list = root.querySelector('.swim-ap-list');
        const filter = root.querySelector('.swim-ap-filter');
        this.#renderList(root);

        filter.addEventListener('input', () => this.#renderList(root));
        root.querySelector('.swim-ap-cancel').addEventListener('click', () => this.close());
        root.querySelector('.swim-ap-apply').addEventListener('click', () => this.#confirm(root, 'select'));
        root.querySelector('.swim-ap-revert')?.addEventListener('click', () => this.#confirm(root, 'revert'));

        list.addEventListener('click', (ev) => {
            const row = ev.target.closest('.swim-ap-row');
            if (row) this.#select(root, row.dataset.id);
        });
        list.addEventListener('dblclick', (ev) => {
            const row = ev.target.closest('.swim-ap-row');
            if (!row || this.#blocked(this.#entry(row.dataset.id))) return;
            this.#select(root, row.dataset.id);
            this.#confirm(root, 'select');
        });
        list.addEventListener('keydown', (ev) => {
            if (ev.key !== 'Enter' && ev.key !== ' ') return;
            const row = ev.target.closest('.swim-ap-row');
            if (!row) return;
            ev.preventDefault();
            this.#select(root, row.dataset.id);
        });
        filter.focus();
    }

    #select(root, id) {
        const entry = this.#entry(id);
        if (!entry || this.#blocked(entry)) return; // players can't pick creatures above their rank
        this.#selected = id;
        root.querySelectorAll('.swim-ap-row').forEach((row) => {
            const on = row.dataset.id === id;
            row.classList.toggle('is-selected', on);
            row.setAttribute('aria-selected', String(on));
        });
        const picked = root.querySelector('.swim-ap-picked');
        const img = picked.querySelector('img');
        img.src = entry.img;
        img.hidden = false;
        picked.querySelector('.swim-ap-token-empty').hidden = true;
        picked.querySelector('b').textContent = entry.name;
        this.#updateFooter(root);
    }

    #updateFooter(root) {
        const entry = this.#entry(this.#selected);
        root.querySelector('.swim-ap-apply').disabled = !entry;
        const status = root.querySelector('.swim-ap-status');
        if (entry && this.#locked(entry)) {
            status.textContent = t('SWIM.picker.gmOverride', { name: this.#opts.caster.name });
        } else if (entry) {
            status.textContent = t('SWIM.picker.selected', { name: entry.name });
        } else {
            status.textContent = t('SWIM.picker.available', { count: this.#opts.entries.filter((e) => !this.#blocked(e)).length });
        }
    }

    #renderList(root) {
        const q = root.querySelector('.swim-ap-filter').value.trim().toLowerCase();
        const shown = this.#opts.entries.filter((e) => !q || String(e.name ?? '').toLowerCase().includes(q));
        const byRank = this.#byRank();
        const collator = new Intl.Collator(game.i18n.lang, { numeric: true, sensitivity: 'base' });
        // Group key: 'special' entries on top, then by rank index (rank mode) or by the name of the parent folder (folder mode).
        const keyOf = (e) => (e.group === 'special' ? 'special' : byRank ? e.rankIdx : `folder:${e.folder ?? ''}`);
        const groups = new Map();
        for (const e of shown) {
            const key = keyOf(e);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(e);
        }
        const compareKeys = (a, b) => {
            if (a === 'special' || b === 'special') return a === b ? 0 : a === 'special' ? -1 : 1;
            return byRank ? a - b : collator.compare(a, b);
        };
        const html = [...groups.entries()]
            .sort((a, b) => compareKeys(a[0], b[0]))
            .map(([key, entries]) => {
                let title;
                if (key === 'special') title = t('SWIM.picker.special');
                else if (byRank) title = this.#rankName(key);
                else title = key.slice('folder:'.length) || t('SWIM.picker.noFolder');
                const sorted = key === 'special'
                    ? entries
                    : [...entries].sort((a, b) => (byRank ? a.size - b.size : 0) || collator.compare(String(a.name), String(b.name)));
                return `<section class="swim-ap-group"><h4>${esc(title)}</h4>${sorted.map((e) => this.#row(e)).join('')}</section>`;
            })
            .join('');
        root.querySelector('.swim-ap-list').innerHTML = html || `<p class="swim-ap-empty">${esc(t('SWIM.picker.noMatch', { query: q }))}</p>`;
        if (this.#selected && shown.some((e) => e.id === this.#selected)) this.#select(root, this.#selected);
        else this.#updateFooter(root);
    }

    #row(e) {
        const locked = this.#locked(e);
        const chip = (label, value, extra = '') =>
            value === undefined || value === null || value === '' ? '' : `<span class="swim-ap-chip" title="${esc(label)}">${esc(label)} <b>${esc(value)}</b>${extra}</span>`;
        const toughness = e.toughness === undefined ? '' : chip(t('SWADE.Tough'), e.toughness, e.armor ? ` (${esc(e.armor)})` : '');
        const chips = [
            e.group === 'special' ? '' : chip(t('SWADE.Size'), e.size > 0 ? `+${e.size}` : e.size),
            chip(t('SWADE.Pace'), e.pace),
            chip(t('SWADE.Parry'), e.parry),
            toughness,
        ].join('');
        const rankName = e.rankIdx == null ? '' : this.#rankName(e.rankIdx);
        const badge = esc(rankName[0] ?? '');
        const badgeTitle = e.rankIdx == null ? '' : e.group === 'special' ? t('SWIM.picker.requiresRankOnly', { rank: rankName }) : t('SWIM.picker.requiresRank', { rank: rankName, size: e.size });
        const classes = ['swim-ap-row', locked ? 'is-locked' : '', locked && !this.#opts.isGM ? 'is-blocked' : ''].join(' ').trim();
        return `<div class="${classes}" data-id="${esc(e.id)}" role="option" tabindex="0" aria-selected="false" ${locked ? 'aria-disabled="' + String(!this.#opts.isGM) + '"' : ''}
        title="${esc(locked ? badgeTitle : e.name)}">
      <img class="swim-ap-icon" src="${esc(e.img)}" alt="" draggable="false">
      <span class="swim-ap-name"><span class="swim-ap-nametext">${esc(e.name)}</span><span class="swim-ap-chips">${chips}</span></span>
      ${this.#byRank() && this.#opts.showRankBadge !== false ? `<span class="swim-ap-rank" title="${esc(badgeTitle)}">${badge}</span>` : ''}
    </div>`;
    }

    /* -------------------------------- lifecycle ------------------------------- */

    #values(root) {
        const values = {};
        for (const el of root.querySelectorAll('[data-extra]')) {
            values[el.dataset.extra] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value;
        }
        return values;
    }

    #confirm(root, action) {
        if (this.#done) return;
        if (action === 'select' && !this.#selected) return;
        this.#done = true;
        this.#resolve({ action, id: action === 'select' ? this.#selected : undefined, values: this.#values(root) });
        super.close();
    }

    async close(options) {
        if (!this.#done) {
            this.#done = true;
            this.#resolve(null);
        }
        return super.close(options);
    }
}
