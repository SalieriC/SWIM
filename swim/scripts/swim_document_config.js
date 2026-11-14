import * as SWIM from "./constants.js";
import SWIMEffectConfig from "./helpers/custom_effect_config.js";
import { SwimWindow, t, esc, btn, tokens_header } from "./helpers/swim_window.js";
import { play_audio } from "./helpers/audio.js";

export async function open_swim_item_config(item) {
    let actor = false
    await swim.run_migration(actor, item)
    SwimWindow.show(new DocumentConfigApp(item));
}

export async function open_swim_actor_config(actor) {
    let item = false
    await swim.run_migration(actor, item)
    SwimWindow.show(new DocumentConfigApp(actor));
}

/*
This object works as follows:

configs = [
     {
        showFor: ['type0', 'type1']
        id: 'asd,
        label: 'asd',
        hint: 'asd',
        value: ''
    },
    {...}
]

The map contains sections and form elements to show in the config window. Each section is an object that describes what the section is about.
Right now we have the following possibilities (pick one):

- isSectionTitle: if true shows a subheader to differentiate different sections of the config UI.
    - showFor: Array of item/actor types to show this element for. Omit entire property to always show.
    - label: text for the subheader
- isBoolean: if true will show a checkbox.
    - showFor: Array of item/actor types to show this element for. Omit entire property to always show.
    - id: the name under which to store this config in the flags
    - label: the loca key for the label
    - hint: the loca key for the hint
    - value: the default value of the checkbox
- isText: if true will show a textfield.
    - showFor: Array of item/actor types to show this element for. Omit entire property to always show.
    - id: the name under which to store this config in the flags
    - label: the loca key for the label
    - hint: the loca key for the hint
    - value: the default value of the textfield
    - useFilePicker: Set to true if you want a file picker for this text field (optional)
    - filePickerData: The datatype of this file picker (can be: "folder", "font", "text", "graphics", "image", "audio", "video", "imagevideo" or empty) (optional)
- isAE: if true will show a button to edit an in-memory ActiveEffect
    - showFor: Array of item/actor types to show this element for. Omit entire property to always show.
    - id: the name under which to store this config in the flags
    - label: the loca key for the label
    - hint: the loca key for the hint
    - value: the default value of the AE (in JSON)
- isNumber: if true will show a number spinner
    - showFor: Array of item/actor types to show this element for. Omit entire property to always show.
    - id: the name under which to store this config in the flags
    - label: the loca key for the label
    - hint: the loca key for the hint
    - value: the default value of the number field
    - min: the minimum value of the number field
    - max: the maximum value of the number field

 */
function swim_config_options() {
    const configs = [
        {
            isSectionTitle: true,
            showFor: ['weapon'],
            label: "SWIM.Config_WeaponConfig"
        },
        {
            isText: true,
            showFor: ['weapon'],
            id: 'loadedAmmo',
            label: 'SWIM.Config_LoadedAmmoName',
            hint: 'SWIM.Config_LoadedAmmoHint',
            value: ""
        },
        {
            isBoolean: true,
            showFor: ['weapon'],
            id: 'isSilenced',
            label: 'SWIM.Config_IsSilencedName',
            hint: 'SWIM.Config_IsSilencedHint',
            value: false
        },
        {
            isBoolean: true,
            showFor: ['weapon'],
            id: 'isConsumable',
            label: 'SWIM.Config_IsConsumableName',
            hint: 'SWIM.Config_IsConsumableHint',
            value: false
        },
        {
            isSectionTitle: true,
            showFor: ['gear'],
            label: "SWIM.Config_AmmoConfig"
        },
        {
            isBoolean: true,
            showFor: ['gear'],
            id: 'isPack',
            label: 'SWIM.Config_IsPackName',
            hint: 'SWIM.Config_IsPackHint',
            value: false
        },
        {
            isAE: true,
            showFor: ['gear'],
            id: 'ammoActiveEffect',
            label: 'SWIM.Config_SetAmmoActiveEffectName',
            hint: 'SWIM.Config_SetAmmoActiveEffectHint',
            value: ''
        },
        {
            isSectionTitle: true,
            showFor: ['character', 'npc'],
            label: "SWIM.Config_GeneralActorConfig"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "pronoun",
            label: "SWIM.Config_PronounName",
            hint: "SWIM.Config_PronounHint",
            value: ""
        },
        {
            isNumber: true,
            showFor: ['character', 'npc'],
            id: 'radRes',
            label: 'SWIM.Config_RadResName',
            hint: 'SWIM.Config_RadResHint',
            value: 0,
        },
        //SFX shown at the bottom(?):
        //Actor SFX:
        {
            isSectionTitle: true,
            showFor: ['weapon', 'character', 'npc'],
            label: "SWIM.Config_SFX"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "shakenSFX",
            label: "SWIM.Config_ShakenSFXName",
            hint: "SWIM.Config_ShakenSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "deathSFX",
            label: "SWIM.Config_IncapSFXName",
            hint: "SWIM.Config_IncapSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "unshakeSFX",
            label: "SWIM.Config_UnshakeSFXName",
            hint: "SWIM.Config_UnshakeSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "stunnedSFX",
            label: "SWIM.Config_StunnedSFXName",
            hint: "SWIM.Config_StunnedSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "soakSFX",
            label: "SWIM.Config_SoakSFXName",
            hint: "SWIM.Config_SoakSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "fatiguedSFX",
            label: "SWIM.Config_FatiguedSFXName",
            hint: "SWIM.Config_FatiguedSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "looseFatigueSFX",
            label: "SWIM.Config_LooseFatigueSFXName",
            hint: "SWIM.Config_LooseFatigueSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        //Weapon SFX:
        {
            isText: true,
            showFor: ['weapon'],
            id: "reloadSFX",
            label: "SWIM.Config_ReloadSFXName",
            hint: "SWIM.Config_ReloadSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['weapon'],
            id: "fireSFX",
            label: "SWIM.Config_FireSFXName",
            hint: "SWIM.Config_FireSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['weapon'],
            id: "autoFireSFX",
            label: "SWIM.Config_AutoFireSFXName",
            hint: "SWIM.Config_AutoFireSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['weapon'],
            id: "silencedFireSFX",
            label: "SWIM.Config_SilencedFireSFXName",
            hint: "SWIM.Config_SilencedFireSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['weapon'],
            id: "silencedAutoFireSFX",
            label: "SWIM.Config_SilencedAutoFireSFXName",
            hint: "SWIM.Config_SilencedAutoFireSFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        {
            isText: true,
            showFor: ['weapon'],
            id: "emptySFX",
            label: "SWIM.Config_EmptySFXName",
            hint: "SWIM.Config_EmptySFXHint",
            value: "",
            useFilePicker: true,
            filePickerData: "audio"
        },
        //Magic Stuff:
        {
            isSectionTitle: true,
            showFor: ['character', 'npc'],
            label: "SWIM.Config_Magic"
        },
        {
            isText: true,
            showFor: ['character', 'npc'],
            id: "mirrorSelfImage",
            label: "SWIM.Config_MirrorSelfImageName",
            hint: "SWIM.Config_MirrorSelfImageHint",
            value: "",
            useFilePicker: true,
            filePickerData: "image"
        },
    ]
    return configs
}

const swimConfigVersion = SWIM.CONFIG_VERSION

/** Value as it is stored: Boolean / Number / String (the Active Effect field is a JSON string). */
function norm(c, v) {
    if (c.isBoolean) { return !!v }
    if (c.isNumber) {
        const n = Number.parseFloat(String(v ?? '').replace(',', '.'))
        return Number.isFinite(n) ? n : Number(c.value)
    }
    return String(v ?? '')
}

/**
 * SWIM Config window of an actor or item (weapon, ammo, character, npc ...), built on SwimWindow.
 * The rows come from `swim_config_options()`; the window works on the SOURCE data of the document: `document.flags` holds the *prepared*
 * data, i.e. including Active Effects that change flags.swim.config.* (e.g. radiation resistance); writing those back as source would
 * apply the effect again on every save. Prepared values that differ are only shown as information. Only changed values are written.
 */
class DocumentConfigApp extends SwimWindow {
    constructor(doc) {
        super({ id: `swim-doc-config-${doc.uuid.replaceAll('.', '-')}`, title: `${t('SWIM.DocumentConfigMenu')}: ${doc.name}`, width: 640 })
        this.doc = doc
        const type = doc.type
        const source = doc._source?.flags?.swim?.config ?? {}
        const prepared = doc.flags?.swim?.config ?? {}
        this.sectionList = []
        let current = null
        for (const c of swim_config_options()) {
            if ('showFor' in c && !c.showFor.includes(type)) { continue }
            if (c.isSectionTitle) { current = { title: c.label, rows: [] }; this.sectionList.push(current); continue }
            if (!current) { current = { title: null, rows: [] }; this.sectionList.push(current) }
            const stored = source[c.id]
            c.saved = norm(c, stored !== undefined && stored !== null ? stored : c.value)
            const eff = prepared[c.id]
            if (!c.isAE && eff !== undefined && eff !== null && JSON.stringify(eff) !== JSON.stringify(c.saved)) { c.effective = eff }
            current.rows.push(c)
            this.state[c.id] = c.saved
        }
        this.rows = this.sectionList.flatMap((sec) => sec.rows)
        this.sourceVersion = source._version
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, { classes: ['swim-hc-app', 'swim-us-app', 'swim-cfg-app', 'swim-cfg-doc'], resizable: true })
    }

    #dirty() { return this.rows.filter((c) => norm(c, this.state[c.id]) !== c.saved) }

    #control(c) {
        const v = this.state[c.id]
        const f = `data-field="${esc(c.id)}"`
        const ico = (action, icon, title, extra = '') => `<button type="button" class="swim-hc-btn swim-cfg-ico" data-action="${action}" data-id="${esc(c.id)}" title="${esc(title)}" ${extra}><i class="${icon}"></i></button>`
        if (c.isBoolean) { return `<input type="checkbox" ${f} ${v ? 'checked' : ''}>` }
        if (c.isNumber) { return `<input type="number" ${f} value="${esc(v)}" ${c.min !== undefined ? `min="${c.min}"` : ''} ${c.max !== undefined ? `max="${c.max}"` : ''} step="any">` }
        if (c.isAE) {
            const embedded = this.doc.isEmbedded
            return `<span class="swim-cfg-aestate" data-id="${esc(c.id)}"></span>
                ${ico('ae-edit', 'far fa-pen-to-square', embedded ? t('SWIM.Config_ButtonDisabled') : t('SWIM.configWin.aeEdit'), embedded ? 'disabled' : '')}
                ${ico('ae-remove', 'far fa-trash', t('SWIM.configWin.aeRemove'))}`
        }
        let out = `<input type="text" ${f} value="${esc(v)}">`
        if (c.useFilePicker) { out += ico('browse', 'fas fa-folder-open', t('SWIM.configWin.browse')) }
        if (c.useFilePicker && c.filePickerData === 'audio') { out += ico('play', 'fas fa-play', t('SWIM.configWin.play')) }
        return out
    }

    #row(c) {
        const label = t(c.label)
        const eff = c.effective !== undefined ? `<small class="swim-cfg-eff"><i class="fas fa-bolt"></i> ${esc(t('SWIM.Config_EffectiveValue'))} <b>${esc(c.effective)}</b></small>` : ''
        return `<div class="swim-cfg-row" data-id="${esc(c.id)}">
            <div class="swim-cfg-info"><b>${esc(label)}</b><small>${esc(t(c.hint))}</small>${eff}</div>
            <div class="swim-cfg-ctl">${this.#control(c)}<button type="button" class="swim-cfg-reset" data-action="reset" data-id="${esc(c.id)}" title="${esc(t('SWIM.configWin.reset'))}"><i class="fas fa-undo"></i></button></div></div>`
    }

    async view() {
        const head = tokens_header([{ token: { name: this.doc.name, texture: { src: this.doc.img } }, small: this.doc.type }])
        const body = this.sectionList.map((sec) => `<section>${sec.title ? `<h4 class="swim-cfg-ptitle">${esc(t(sec.title))}</h4>` : ''}${sec.rows.map((c) => this.#row(c)).join('')}</section>`).join('')
        const foot = `<span class="swim-cfg-count"></span><span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('save', t('SWIM.Save'), { go: true })}`
        return { head, body, foot }
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.on('change input', '[data-field]', () => this.#refresh())
        this.#refresh()
    }

    #refresh() {
        const root = this.element
        if (!root?.length) { return }
        for (const c of this.rows) {
            const row = root.find(`.swim-cfg-row[data-id="${c.id}"]`)
            row.toggleClass('is-changed', norm(c, this.state[c.id]) !== c.saved)
            row.find('.swim-cfg-reset').toggleClass('is-default', norm(c, this.state[c.id]) === norm(c, c.value))
            if (c.isAE) { row.find('.swim-cfg-aestate').text(this.state[c.id] ? t('SWIM.configWin.aeSet') : t('SWIM.configWin.aeNone')) }
        }
        const n = this.#dirty().length
        root.find('.swim-cfg-count').text(n ? t('SWIM.configWin.changes', { count: n }) : t('SWIM.configWin.noChanges'))
        root.find('[data-action="save"]').prop('disabled', !n)
    }

    #set(id, value) {
        this.state[id] = value
        const el = this.element.find(`[data-field="${id}"]`)
        if (el.attr('type') === 'checkbox') { el.prop('checked', !!value) } else { el.val(value) }
        this.#refresh()
    }

    async onAction(action, el) {
        const c = this.rows.find((x) => x.id === el.dataset.id)
        switch (action) {
            case 'reset': return this.#set(c.id, c.isBoolean ? !!c.value : c.isAE ? '' : String(c.value ?? ''))
            case 'browse':
                return new FilePicker({ type: c.filePickerData, current: this.state[c.id], callback: (path) => this.#set(c.id, path) }).browse()
            case 'play':
                if (this.state[c.id]) { play_audio(this.state[c.id], { push: false }).catch((err) => console.warn('SWIM | Could not play sound', err)) }
                return
            case 'ae-edit': return this.#edit_effect(c)
            case 'ae-remove': return this.#set(c.id, '')
            case 'cancel': return this.close()
            case 'save': return this.#save()
        }
    }

    /** The Active Effect (ammo effect) is edited as a temporary effect on the item; its data is stored as JSON when its sheet is saved. */
    async #edit_effect(c) {
        const old = this.state[c.id]
        const defaults = old ? JSON.parse(old) : { name: `Ammo Effect (${this.doc.name})`, icon: this.doc.img }
        const effect = await CONFIG.ActiveEffect.documentClass.create(defaults, { rendersheet: false, parent: this.doc })
        //Set a flag to mark effects to be deleted later.
        await effect.setFlag('swim', 'ammoAeTempEff', true)
        await new SWIMEffectConfig(effect, {}, async (e) => { this.#set(c.id, JSON.stringify(e.toObject())) }).render(true)
    }

    async #save() {
        const changes = {}
        for (const c of this.#dirty()) { changes[c.id] = norm(c, this.state[c.id]) }
        if (!(this.sourceVersion >= swimConfigVersion)) { changes._version = swimConfigVersion }
        this.busy = true
        try {
            if (Object.keys(changes).length > 0) { await this.doc.update({ flags: { swim: { config: changes } } }) }
            console.log(`SWIM | Flags set on ${this.doc.name}.`, this.doc)
        } catch (err) {
            console.error('SWIM | Saving the config failed', err)
            ui.notifications.error(t('SWIM.notification.generalErrorMsg'))
            this.busy = false
            return
        }
        this.busy = false
        return this.close()
    }

    async close(options) {
        //Delete the temporary effects of the ammo effect editor, whether it was saved or not.
        try {
            for (const eff of this.doc.effects) {
                if (eff.flags?.swim?.ammoAeTempEff === true) { await eff.delete() }
            }
        } catch (err) { console.warn('SWIM | Could not remove temporary effects', err) }
        return super.close(options)
    }
}
