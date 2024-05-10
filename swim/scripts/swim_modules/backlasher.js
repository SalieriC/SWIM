export async function backlasher(card, backlashSetting) {
    if (backlashSetting === 'dynamic') {
        await dynamic_backlash(card)
        return
    }
    let actor = card.actor

    // If shape changed, terminate active powers and revert form first:
    if (card.actor.getFlag('swim', 'scOwner') && card.token) {
        let powersToTerminate = []
        for (let eff of actor.effects) {
            if ((eff.flags?.swim) && (eff.flags.swim.maintainedPower || eff.flags.swim.maintainedSummon)) {
                powersToTerminate.push(eff._id)
            }
        }
        if (powersToTerminate.length > 0) {
            await actor.deleteEmbeddedDocuments('ActiveEffect', powersToTerminate)
        }
        actor = game.actors.get(card.actor.getFlag('swim', 'scOwner'))
        await swim.wait('500') // Give the deletion some time to complete.
        await swim.revert_shape_change(card.token)
        await swim.wait('2000') // Give the revert some time to complete.
    }

    const currFatigue = actor.system.fatigue.value
    const maxFatigue = actor.system.fatigue.max
    const officialClass = await swim.get_official_class()
    const backlashLink = await swim.get_official_journal_link("activation")
    //let message = `${officialClass}<h1>${backlashLink}{Backlash!}</h1><p><b>${actor.name}</b> rolled a Critical Failure when trying to invoke a power and `
    let message = game.i18n.format("SWIM.Backlasher.Message-1", {officialClass, backlashLink: `${backlashLink}{${game.i18n.localize("SWIM.Backlasher.Backlash")}!}`, name: actor.name})
    // Setting up SFX paths:
    const {
        shakenSFX,
        deathSFX,
        unshakeSFX,
        stunnedSFX,
        soakSFX,
        fatiguedSFX,
        looseFatigueSFX
    } = await swim.get_actor_sfx(actor)
    const volume = game.settings.get('swim', 'defaultVolume')
    // Making Changes:
    if (currFatigue + 1 <= maxFatigue) {
        await actor.update({"system.fatigue.value": currFatigue + 1})
        await swim.play_sfx(fatiguedSFX, volume, true)
        //message += `gained a level of Fatigue!<br />`
        message += game.i18n.localize("SWIM.Backlasher.Message-2")
    } else if (currFatigue + 1 > maxFatigue) {
        if (actor.type === 'npc') {
            await game.succ.addCondition('dead', actor, {forceOverlay: true})
        } else if (actor.type === 'character') {
            await game.succ.addCondition('incapacitated', actor, {forceOverlay: true})
        }
        await swim.play_sfx(deathSFX, volume, true)
        //message += `collapses from exhaustion!<br />`
        message += game.i18n.localize("SWIM.Backlasher.Message-3")
    }
    // Also terminate all active powers:
    //message += `All active powers immediately terminate`
    message += game.i18n.localize("SWIM.Backlasher.Message-4")
    let powersToTerminate = []
    for (let eff of actor.effects) {
        if ((eff.flags?.swim) && (eff.flags.swim.maintainedPower || eff.flags.swim.maintainedSummon)) {
            powersToTerminate.push(eff._id)
        }
    }
    if (powersToTerminate.length > 0) {
        await actor.deleteEmbeddedDocuments('ActiveEffect', powersToTerminate)
        //message += ` (powers set up using SWIM functions have been automatically terminated)`
        message += game.i18n.localize("SWIM.Backlasher.Message-5")
    }
    //message += `.</p></div>`
    message += game.i18n.localize("SWIM.Backlasher.Message-6")
    let chatData = {
        content: await TextEditor.enrichHTML(message)
    };
    ChatMessage.create(chatData, {});
}

async function dynamic_backlash(card) {
    const actor = card.actor
    const officialClass = await swim.get_official_class()
    const backlashLink = await swim.get_official_journal_link("activation")
    const dynamicBacklashLink = await swim.get_official_journal_link("dynamic_backlash")
    //let message = `${officialClass}<h1>${backlashLink}{Backlash!}</h1><p><b>${actor.name}</b> rolled a Critical Failure when trying to invoke a power and `
    let message = game.i18n.format("SWIM.Backlasher.Message-1", {officialClass, backlashLink: `${backlashLink}{${game.i18n.localize("SWIM.Backlasher.Backlash")}!}`, name: actor.name})
    //message += 'suffers {backlashLink}:</p></div>'
    message += game.i18n.format("SWIM.Backlasher.Message-7", {backlashLink: `${dynamicBacklashLink}{${game.i18n.localize("SWIM.Backlasher.DynamicBacklash")}}`})
    const tableName = game.settings.get('swim', 'backlashTable')
    const table = game.tables.getName(tableName)
    if (!table) { return ui.notifications.error(game.i18n.localize("SWIM.warn-noBacklashTable")) }
    const tableDraw = await table.draw({ displayChat: false }, { });
    const resultImg = tableDraw.results[0].img
    const resultText = tableDraw.results[0].text
    message += resultText
    let chatData = {
        content: await TextEditor.enrichHTML(message)
    };
    ChatMessage.create(chatData, {});
}