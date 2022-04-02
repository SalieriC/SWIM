/*******************************************************
 * Common Bond
 * Transfers a Benny from a selected to a targeted tokens
 * actor.
 * 
 * v. 1.0.0
 * By SalieriC
 ******************************************************/
export async function common_bond_script() {
    const { speaker, _, __, token } = await swim.get_macro_variables()
    //Set div class based on enabled official module:
    const officialClass = await swim.get_official_class()
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
    const commonBond = token.actor.data.items.find(function (item) {
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

    new Dialog({
        title: game.i18n.format("SWIM.edge-commonBond"),
        content: game.i18n.format("SWIM.dialogue-commonBond", {officialClass: officialClass, tokenName: token.name, targetName: target.name}),
        buttons: {
            one: {
                label: game.i18n.localize("SWIM.dialogue-accept"),
                callback: async (_) => {
                    let message = false
                    await swim.spend_benny(token, message)
                    const data = {
                        tokenID: token.id,
                        targetID: target.id
                    }
                    warpgate.event.notify("SWIM.commonBond", data)
                }
            },
            two: {
                label: game.i18n.localize("SWIM.dialogue-cancel"),
                callback: async () => {
                    return
                }
            }
        },
        default: "one",
    }).render(true);
}

export async function common_bond_gm(data) {
    const tokenID = data.tokenID
    const token = canvas.tokens.get(tokenID)
    const targetID = data.targetID
    const target = canvas.tokens.get(targetID)
    const officialClass = await swim.get_official_class()
    const bennyImage = await swim.get_benny_image()
    const bennyHTML = `<img style="border: none;" src="${bennyImage}"" width="25" height="25" />`

    await target.actor.update({"data.bennies.value": target.actor.data.data.bennies.value + 1})
    ChatMessage.create({
        user: game.user.id,
        content: game.i18n.format("SWIM.chatMessage-commonBond", {officialClass: officialClass ,bennyHTML: bennyHTML ,tokenName: token.name, targetName: target.name}),
      });
}