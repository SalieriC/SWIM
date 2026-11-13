/*******************************************
 * Chase Setup Macro
 * To be used with the SWIM chase layouts,
 * Advanced options allow adjustmend for any
 * scene (by pmoore603).
 * version 3.0.0 – window (ChaseApp) instead of a Dialog
 * By SalieriC#8263, flag use inspired by a macro from brunocalado#1650, assisted by Kekilla#7036, more layout options by pmoore603.
 ******************************************/
import { SwimWindow, t, esc, btn, rate_opt } from "../helpers/swim_window.js"

const FLIP_SOUND = "systems/swade/assets/card-flip.wav"

/** How many cards will really be set up: a whole number between 0 and `max`. */
export function clamp_cards(wanted, max) {
    const n = Math.floor(Number(wanted))
    if (!Number.isFinite(n) || n < 0) { return 0 }
    return Math.min(n, Number(max))
}

/** Position (in pixels) of the i-th card. `cfg`: { perRow, deckRight, deckDown, cardWidth, cardHeight, borderHoriz, borderVert } (sizes already in pixels). */
export function card_position(i, cfg) {
    const row = Math.floor(i / cfg.perRow)
    const col = i % cfg.perRow
    return {
        x: cfg.deckRight + col * (cfg.cardWidth + cfg.borderHoriz),
        y: cfg.deckDown + row * (cfg.cardHeight + cfg.borderVert),
    }
}

/** The cards that arrived in a pile after dealing: everything that wasn't in it before. */
export function new_cards(cardsNow, idsBefore) {
    const before = new Set(idsBefore)
    return cardsNow.filter((c) => !before.has(c.id))
}

export async function chase_setup_script() {
    if (!canvas.scene) { return ui.notifications.error(t("SWIM.chase.noScene")) }
    await SwimWindow.show(new ChaseApp())
}

const setting = (key) => game.settings.get('swim', `chaseDeck-${key}`)

class ChaseApp extends SwimWindow {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, { id: 'swim-chase-setup', width: 480 })
    }

    get title() { return t('SWIM.chase.title') }

    constructor() {
        super()
        const defaultDeck = game.settings.get('swim', 'chaseDeck')
        //Filter tables to only include those likely to be set up.
        const tables = game.tables.filter((tb) => tb.name !== `${defaultDeck}` && (tb.name.includes('Chase') || tb.name.includes('Deck') || tb.name.includes('Cards')))
        const first = defaultDeck ? game.tables.getName(`${defaultDeck}`) : null
        this.tables = [...(first ? [first] : []), ...tables].map((tb) => tb.name)
        this.decks = game.cards.filter((c) => c.type === 'deck').map((c) => c.name)
        this.piles = game.cards.filter((c) => c.type === 'pile').map((c) => c.name)
        Object.assign(this.state, {
            mode: 'tables',
            table: this.tables[0], deck: this.decks[0], pile: this.piles[0],
            draw: String(setting('CardsToDraw')),
            gridPixels: String(setting('GridWithPixels')),
            borderHoriz: String(setting('BorderHorizontal')), borderVert: String(setting('BorderVertical')),
            cardHeight: String(setting('CardHeight')), cardWidth: String(setting('CardWidth')),
            deckDown: String(setting('DeckDown')), deckRight: String(setting('DeckRight')),
            layoutOpen: false,
        })
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('details').on('toggle', (ev) => { this.state.layoutOpen = ev.currentTarget.open })
    }

    async view() {
        const s = this.state
        const cards = s.mode === 'cards'
        const select = (field, list, sel) => list.length
            ? `<select data-field="${field}">${list.map((n) => `<option value="${esc(n)}" ${n === sel ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`
            : `<em>${t('SWIM.chase.none')}</em>`
        const row = (label, control) => `<div class="swim-am-row"><label class="swim-hc-lab">${label}</label>${control}</div>`
        const num = (field, label) => `<label><span>${label}</span><input type="number" min="0" data-field="${field}" value="${esc(s[field])}"></label>`

        let body = `<div class="swim-hc-rate swim-us-two">${rate_opt('mode', 'mode', 'tables', t('SWIM.chaseSetupTablesName'), !cards)}${rate_opt('mode', 'mode', 'cards', t('SWIM.chaseSetupCardsName'), cards)}</div>`
        if (cards) {
            body += row(t('SWIM.chaseSetupDeck'), select('deck', this.decks, s.deck)) + row(t('SWIM.chaseSetupPile'), select('pile', this.piles, s.pile))
        } else {
            body += row(t('SWIM.chaseSetupTable'), select('table', this.tables, s.table))
        }
        body += row(t('SWIM.chase.numCards'), `<div><input type="number" min="0" data-field="draw" value="${esc(s.draw)}"></div>`)
        body += `<details class="swim-ch-layout" ${s.layoutOpen ? 'open' : ''}><summary>${t('SWIM.chase.layout')}</summary>
            <h5>${t('SWIM.chase.pixels')}</h5>
            <div class="swim-ch-pair">${num('gridPixels', t('SWIM.chase.gridPixels'))}</div>
            <div class="swim-ch-pair">${num('borderHoriz', t('SWIM.chase.borderHoriz'))}${num('borderVert', t('SWIM.chase.borderVert'))}</div>
            <h5>${t('SWIM.chase.cardSize')}</h5>
            <div class="swim-ch-pair">${num('cardHeight', t('SWIM.chase.height'))}${num('cardWidth', t('SWIM.chase.width'))}</div>
            <h5>${t('SWIM.chase.deckPosition')}</h5>
            <div class="swim-ch-pair">${num('deckDown', t('SWIM.chase.down'))}${num('deckRight', t('SWIM.chase.right'))}</div>
            </details>`
        return {
            body,
            foot: `${btn('reset', t('SWIM.chase.reset'))}<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('draw', t('SWIM.chase.draw'), { go: true })}`,
        }
    }

    async onAction(action, el) {
        if (action === 'cancel') { return this.close() }
        if (action === 'mode') { this.state.mode = el.dataset.mode; return this.render() }
        if (action !== 'draw' && action !== 'reset') { return }
        this.busy = true
        try {
            const done = action === 'draw' ? await this.#make_chase() : await this.#reset_chase()
            if (done) { return this.close() }
        } finally {
            this.busy = false
        }
    }

    async #make_chase() {
        const s = this.state
        const isTables = s.mode === 'tables'
        const maxCards = Number(setting('MaxCards')) // Default: 18
        const perRow = Number(setting('CardsPerRow')) || 1 // Default: 9
        const gridPixels = Number(s.gridPixels) || 0
        const cfg = {
            perRow,
            borderHoriz: Number(s.borderHoriz) || 0,
            borderVert: Number(s.borderVert) || 0,
            cardHeight: (Number(s.cardHeight) || 0) * gridPixels,
            cardWidth: (Number(s.cardWidth) || 0) * gridPixels,
            deckDown: (Number(s.deckDown) || 0) * gridPixels,
            deckRight: (Number(s.deckRight) || 0) * gridPixels,
        }
        let cardsToDraw = Number(s.draw)
        if (cardsToDraw > maxCards) {
            ui.notifications.error(t('SWIM.chase.tooMany', { max: maxCards }))
            ui.notifications.notify(t('SWIM.chase.tooManyFallback', { max: maxCards }))
        }
        cardsToDraw = clamp_cards(cardsToDraw, maxCards)
        if (cardsToDraw < 1) { ui.notifications.error(t('SWIM.chase.noCards')); return false }

        let images = []
        if (isTables) {
            const table = game.tables.getName(s.table)
            if (!table) { ui.notifications.error(t('SWIM.chase.noTable')); return false }
            images = (await table.drawMany(cardsToDraw, { displayChat: false })).results.map((r) => r.img)
        } else {
            const deck = game.cards.getName(s.deck)
            const pile = game.cards.getName(s.pile)
            if (!deck || !pile) { ui.notifications.error(t('SWIM.chase.noDeck')); return false }
            const before = pile.cards.map((c) => c.id)
            await deck.deal([pile], cardsToDraw, { chatNotification: false })
            images = new_cards(pile.cards.contents ?? [...pile.cards], before).map((c) => c.img)
        }

        swim.play_sfx(FLIP_SOUND);

        // Only as many tiles as cards were actually drawn (a deck can run out).
        const tiles = images.map((img, i) => ({
            texture: { src: img },
            width: cfg.cardWidth,
            height: cfg.cardHeight,
            ...card_position(i, cfg),
            'flags.swim.isChaseCard': true,
        }))
        await TileDocument.createDocuments(tiles, { parent: canvas.scene })
        return true
    }

    async #reset_chase() {
        const s = this.state
        const isTables = s.mode === 'tables'
        const source = isTables ? s.table : s.deck
        if (isTables) {
            const table = game.tables.getName(s.table)
            if (!table) { ui.notifications.error(t('SWIM.chase.noTable')); return false }
            await table.resetResults()
        } else {
            const deck = game.cards.getName(s.deck)
            if (!deck) { ui.notifications.error(t('SWIM.chase.noDeck')); return false }
            await deck.reset({ chatNotification: false })
            await deck.shuffle({ chatNotification: false })
        }

        swim.play_sfx(FLIP_SOUND);

        const delete_ids = canvas.scene.tiles.filter((tile) => !!tile.getFlag('swim', 'isChaseCard')).map((tile) => tile.id)
        await canvas.scene.deleteEmbeddedDocuments("Tile", delete_ids)
        ui.notifications.info(t('SWIM.chase.resetDone', { name: source }))
        return true
    }
}
