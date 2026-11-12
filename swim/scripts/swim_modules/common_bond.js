/*******************************************************
 * Common Bond
 * Transfers a Benny from a selected to a targeted tokens
 * actor.
 *
 * v. 3.0.0 – confirmation window (CommonBondApp) instead of a Dialog.
 * By SalieriC
 ******************************************************/
import { execute_as_gm } from "../helpers/socket_helper.js"
import { SwimWindow, t, esc, btn, tokens_header } from "../helpers/swim_window.js"

export async function common_bond_script() {
    const { speaker, _, __, token } = await swim.get_macro_variables()
    const targets = game.user.targets
    if (!token || canvas.tokens.controlled.length > 1) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"))
        return;
    }
    if (targets.size > 1 || targets.size < 1) {
        ui.notifications.warn(game.i18n.localize("SWIM.notification-targetSingleToken"))
        return
    }
    const target = Array.from(game.user.targets)[0]
    const commonBond = token.actor.items.find(function (item) {
        return ((item.name.toLowerCase() === game.i18n.localize("SWIM.edge-commonBond").toLowerCase()) && item.type === "edge");
    });
    if (!commonBond) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-noCommonBond"))
        return
    }

    const { tokenBennies, gmBennies, totalBennies } = await swim.check_bennies(token)
    if (tokenBennies <= 0) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-noBenniesLeft"))
        return
    }
    await SwimWindow.show(new CommonBondApp(token, target, tokenBennies))
}

class CommonBondApp extends SwimWindow {
    #token
    #target
    #bennies

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, { id: 'swim-common-bond', width: 420 })
    }

    get title() { return t('SWIM.edge-commonBond') }

    constructor(token, target, bennies) {
        super()
        this.#token = token
        this.#target = target
        this.#bennies = bennies
    }

    async view() {
        const text = t('SWIM.commonBond.text', { tokenName: esc(this.#token.name), targetName: esc(this.#target.name) })
        return {
            head: tokens_header([{ token: this.#token, small: t('SWIM.commonBond.from') }, { token: this.#target, small: t('SWIM.commonBond.to') }], { arrow: true, bennies: this.#bennies }),
            body: `<div class="swim-hc-result"><p>${text}</p></div>`,
            foot: `<span class="swim-hc-spacer"></span>${btn('cancel', t('SWIM.picker.cancel'))}${btn('give', t('SWIM.commonBond.give'), { go: true, disabled: this.busy })}`,
        }
    }

    async onAction(action) {
        if (action === 'cancel') { return this.close() }
        if (action !== 'give') { return }
        this.busy = true
        try {
            // The Benny is spent first, as before; the GM then hands it to the target (the relay is validated by the socket guard).
            const { tokenBennies } = await swim.check_bennies(this.#token, false)
            if (tokenBennies <= 0) { return ui.notifications.error(t("SWIM.notification-noBenniesLeft")) }
            await swim.spend_benny(this.#token, false)
            await execute_as_gm("commonBond", { tokenID: this.#token.id, targetID: this.#target.id })
        } catch (e) {
            console.warn('SWIM | Common Bond failed', e)
            return
        } finally {
            this.busy = false
        }
        return this.close()
    }
}

export async function common_bond_gm(data) {
    const tokenID = data.tokenID
    const token = canvas.tokens.get(tokenID)
    const targetID = data.targetID
    const target = canvas.tokens.get(targetID)
    const officialClass = await swim.get_official_class()
    const bennyImage = await swim.get_benny_image()
    const bennyHTML = `<img style="border: none;" src="${bennyImage}"" width="25" height="25" />`

    await target.actor.update({"system.bennies.value": target.actor.system.bennies.value + 1})
    ChatMessage.create({
        user: game.user.id,
        content: game.i18n.format("SWIM.chatMessage-commonBond", {officialClass: officialClass ,bennyHTML: bennyHTML ,tokenName: token.name, targetName: target.name}),
      });
}
