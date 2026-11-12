/*******************************************
 * Dramatic Task Planner macro
 * version 2.0.0 – window (DramaticTaskApp) instead of a Dialog
 * (c): SalieriC, original idea and code base: brunocalado.
 ******************************************/
import { SwimWindow, t, esc, btn, rate_opt, checkbox } from "../helpers/swim_window.js"

const SFX = 'modules/swim/assets/sfx/Dramatic-drum-hit-orangefreesounds.com.ogg'
// players * tokens per player, turns
const DIFFICULTIES = {
    challenging: { perPlayer: 4, turns: 3 },
    difficult: { perPlayer: 6, turns: 4 },
    complex: { perPlayer: 8, turns: 5 },
}

/** Tokens and turns of a standard Dramatic Task. Pure. */
export function task_numbers(players, difficulty) {
    const d = DIFFICULTIES[difficulty] ?? DIFFICULTIES.challenging
    return { tasksTokens: players * d.perPlayer, tasksTurns: d.turns }
}

export async function dramatic_task_planner_script(img) {
    const targets = Array.from(game.user.targets)
    let link = await swim.get_official_journal_link("dramatic_tasks")
    link = link ? `${link}{${t("SWIM.dramaticTask")}}` : t("SWIM.dramaticTask")
    const officialClass = await swim.get_official_class()
    await SwimWindow.show(new DramaticTaskApp({
        chatimage: img || 'icons/commodities/tech/detonator-timer.webp',
        targets, link, officialClass,
        challengeTrackerInstalled: !!game.modules.get('challenge-tracker')?.active,
    }))
}

class DramaticTaskApp extends SwimWindow {
    #ctx

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, { id: 'swim-dramatic-task', width: 440 })
    }

    get title() { return t('SWIM.dramaticTask') }

    constructor(ctx) {
        super()
        this.#ctx = ctx
        this.state = {
            players: String(Math.max(ctx.targets.length, 1)), difficulty: 'challenging', customTokens: '0', customTurns: '0',
            challengeTracker: true, challengeTrackerWindowed: true, challengeTrackerRounds: false, taskPerPlayer: false, playSfx: true,
        }
    }

    async view() {
        const st = this.state
        const { challengeTrackerInstalled, link } = this.#ctx
        const intro = await TextEditor.enrichHTML(`<p>${link}</p>`, { async: true })
        const diff = (id, label) => rate_opt('difficulty', 'value', id, label, st.difficulty === id)
        const num = (field, value) => `<input type="number" min="0" max="100" data-field="${field}" value="${esc(value)}">`
        let checks = ''
        if (challengeTrackerInstalled) {
            checks += checkbox('challengeTracker', 'Challenge Tracker (CT)', st.challengeTracker)
            checks += checkbox('challengeTrackerWindowed', `CT ${t("challengeTracker.labels.editForm.trackerOptions.windowed")}`, st.challengeTrackerWindowed)
            checks += checkbox('challengeTrackerRounds', `CT ${t("SWIM.task-ct-showTurns")}`, st.challengeTrackerRounds)
        }
        checks += checkbox('taskPerPlayer', t("SWIM.task-taskPerPlayer"), st.taskPerPlayer)
        checks += checkbox('playSfx', t("SWIM.task-playSFX"), st.playSfx)
        return {
            body: `<div class="swim-hc-result">${intro}</div>
                <div class="swim-hc-lab">${esc(t('SWIM.word-Player'))}</div>
                <div class="swim-hc-ctl"><input type="number" min="1" max="100" data-field="players" value="${esc(st.players)}"></div>
                <div class="swim-hc-lab swim-hc-lab2">${esc(t('SWIM.word-Difficulty'))}</div>
                <div class="swim-hc-rate swim-us-three">${diff('challenging', t('SWIM.taskDifficulty-Challenging'))}${diff('difficult', t('SWIM.taskDifficulty-Difficult'))}${diff('complex', t('SWIM.taskDifficulty-Complex'))}</div>
                <div class="swim-hc-lab swim-hc-lab2">${esc(t('SWIM.task-custom'))}</div>
                <div class="swim-hc-preview">${esc(t('SWIM.dialogue.task-customHint'))}
                  <div class="swim-us-row"><label>${esc(t('SWIM.word-Tokens'))} ${num('customTokens', st.customTokens)}</label><label>${esc(t('SWIM.word-Turns'))} ${num('customTurns', st.customTurns)}</label></div></div>
                <div class="swim-hc-lab swim-hc-lab2">${esc(t('SWIM.word-Options'))}</div>
                <div class="swim-us-checks">${checks}</div>`,
            foot: `<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('plan', t('SWIM.taskWin.plan'), { go: true })}`,
        }
    }

    async onAction(action, el) {
        switch (action) {
            case 'difficulty':
                if (this.state.difficulty === el.dataset.value) { return }
                this.state.difficulty = el.dataset.value
                return this.render(false)
            case 'cancel': return this.close()
            case 'plan':
                this.busy = true
                try { await this.#plan() } finally { this.busy = false }
                return this.close()
        }
    }

    /** Builds the GM whisper (and opens the Challenge Tracker(s)). */
    async #plan() {
        const st = this.state
        const { chatimage, targets, link, officialClass, challengeTrackerInstalled } = this.#ctx
        const players = Math.max(1, Math.floor(Number(st.players)) || 1)
        const customTokens = Number(st.customTokens) || 0
        const customTurns = Number(st.customTurns) || 0
        const ct = challengeTrackerInstalled ? { on: !!st.challengeTracker, windowed: !!st.challengeTrackerWindowed, rounds: !!st.challengeTrackerRounds } : { on: false }
        const taskPerPlayer = !!st.taskPerPlayer
        const useNames = targets.length === players && taskPerPlayer
        const custom = customTokens !== 0 && customTurns !== 0

        let message = `<h2><img style="vertical-align:middle" src=${chatimage} width="28" height="28"> ${link}</h2>`
        if (taskPerPlayer) {
            for (let i = 0; i < players; i++) {
                const name = targets.length > 0 ? targets[i]?.name ?? false : false
                message += custom ? this.#custom(customTokens, customTurns, ct, useNames, name) : this.#standard(1, st.difficulty, ct, useNames, name)
            }
        } else {
            message += custom ? this.#custom(customTokens, customTurns, ct, useNames) : this.#standard(players, st.difficulty, ct, useNames)
        }

        await ChatMessage.create({
            content: await TextEditor.enrichHTML(officialClass + message + '</div>'),
            whisper: ChatMessage.getWhisperRecipients("GM"),
        })
        if (st.playSfx) { swim.play_sfx(SFX, game.settings.get("swim", "defaultVolume"), true) }
    }

    #openTracker(ct, tokens, turns, useNames, name) {
        if (!ct.on) { return }
        let title = t("SWIM.dramaticTask")
        if (useNames) { title += ` ${t("SWIM.word-for")} ${name}` }
        ChallengeTracker.open({ outerTotal: tokens, innerTotal: ct.rounds ? turns : 0, title, windowed: ct.windowed })
    }

    #standard(players, difficulty, ct, useNames, name = false) {
        const { tasksTokens, tasksTurns } = task_numbers(players, difficulty)
        const difficultyName = t(`SWIM.taskDifficulty-${DIFFICULTIES[difficulty] ? difficulty : 'challenging'}`)
        const playersCountWord = t(players === 1 ? "SWIM.word-player" : "SWIM.word-players")
        const playerName = useNames ? `<b>${esc(name)}</b>` : `<b>${players}</b> ${playersCountWord}`
        const message = game.i18n.format("SWIM.task.message.main", { difficultyName, playerName, tasksTokens, tasksTurns })
        this.#openTracker(ct, tasksTokens, tasksTurns, useNames, name)
        return message
    }

    #custom(tokens, turns, ct, useNames, name = false) {
        let message = useNames ? `${t("SWIM.dramaticTask")} ${t("SWIM.word-for")} <b>${esc(name)}</b>:` : ''
        message += game.i18n.format("SWIM.task.message.customTask", { tokens, turns })
        this.#openTracker(ct, tokens, turns, useNames, name)
        return message
    }
}
