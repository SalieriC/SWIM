/*******************************************************
 * SWADE Immersive Macros (SWIM) proudly presents:
 * The Mighty Summoner.
 * This macro tries to handle everything relevant to the
 * Summon power in SWADE. It is in early stages,
 * so bugs may occur. Please create a ticket on the
 * gitHub if you find any problems with it:
 * https://github.com/SalieriC/SWADE-Immersive-Macros/issues/new
 *
 * This requires Warp Gate by honeybadger:
 * https://foundryvtt.com/packages/warpgate
 *
 * The Macro natively supports Sound Effects and if you
 * are using the Sequencer module by Wasp
 * (https://foundryvtt.com/packages/sequencer), you can
 * also play a visual effect. SFX and VFX are configured
 * in the module settings of SWIM.
 * 
 * v. 1.2.5
 * By SalieriC
 ******************************************************/
 function generate_id (length = 16) {
    var result           = 'SWIM-';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
      charactersLength));
    }
   return result;
  }

 export async function summoner_script() {
    const { speaker, _, __, token } = await swim.get_macro_variables()

    if (!game.modules.get("warpgate")?.active) {
        ui.notifications.error(game.i18n.localize("SWIM.notification.warpgateRequired"));
        console.error("The SWIM Mighty Summoner macro requires Warp Gate by honeybadger. It is needed to replace the token. Please install and activate Warp Gate to use the Shape Changer macro: https://foundryvtt.com/packages/warpgate - If you enjoy Warp Gate please consider donating to honeybadger at his KoFi page: https://ko-fi.com/trioderegion")
        return;
    }

    const mainFolder = game.folders.getName("[SWIM] Summon Creature");
    if (!mainFolder) {
        ui.notifications.error(game.i18n.localize("SWIM.notification.setupSWIMSummonCreature"));
        return;
    }

    // Check if a token is selected.
    if ((!token || canvas.tokens.controlled.length > 1)) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
        return;
    }
    const actor = token.actor;
    const range = actor.system.attributes.smarts.die.sides

    //Get an ID for this maintenance
    const maintID = generate_id()
    
    //Set div class based on enabled official module:
    const officialClass = await swim.get_official_class()

    let totalContent = swim.get_folder_content("Summon Creature Presets")

    let duration = 5
    const concentration = token.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-concentration") && i.type === "edge")
    if (concentration) { duration = duration * 2 }
    const noPP = game.settings.get("swim", "noPowerPoints")
    if (noPP === true) { duration = -1 }

    async function main() {
        //Pre-selecting shape change actors based on rank:
        let scOptions;
        for (let each of totalContent) {
            scOptions = scOptions + `<option value="${each.id}">${each.name}</option>`;
        }
        let content = `${officialClass}
        <p>Please select a creature you want to summon and confirm.</p>
        <p>Afterwards please select a position on the canvas by clicking anywhere within your range.</p>
        <div class="form-group">
            <label for="selected_sc">Creature: </label>
            <select id="selected_sc">${scOptions}</select>
        </div>
        <div class="form-group">
            <label for="raise"><p>Cast with a raise: </label>
            <input id="raise" name="raiseBox" type="checkbox"></input></p>
        </div>`
        if (noPP === false) {
            content += `<p>Enter a Duration in rounds. (Permanent is -1; an hour is 600.)</p>
        <div class="form-group">
            <label for="duration"><p>Duration: </label>
            <input id="duration" name="duration" type="number", value="${duration}"></p></input>
        </div>`
        } if (noPP) {
            let skillOptions = ""
            for (let power of actor.items.filter(p => p.type === "power")) {
                if (!skillOptions.includes(power.system.actions.skill)) {
                    skillOptions += skillOptions + `<option value="${power.system.actions.skill}">${power.system.actions.skill}</option>`
                }
            }
            if (!skillOptions) {
                for (let skill of actor.items.filter(s => s.type === "skill")) {
                    skillOptions = skillOptions + `<option value="${skill.name}">${skill.name}</option>`
                }
            }
            content += `
            <div class='form-group'>
                <label for='skillSelection'><p>Skill used to cast the power:</label>
                <select id='skillSelection'>${skillOptions}</select></p>
            </div>
            </div>`
        }
        content += `</div>`

        new Dialog({
            title: 'Mighty Summoner',
            content: content,
            buttons: {
                one: {
                    label: `<i class="fas fa-paw"></i> Summon Creature`,
                    callback: async (html) => {
                        //Get actor based on provided ID:
                        const scID = html.find(`#selected_sc`)[0].value;
                        //Fetching raise:
                        const raise = html.find(`#raise`)[0].checked;
                        const summonersName = token.name
                        const scActor = game.actors.get(scID)
                        const scMaxWounds = scActor.system.wounds.max
                        const scName = scActor.prototypeToken.name
                        //Get Duration:
                        const duration = noPP ? Number(-1) : Number(html.find(`#duration`)[0].value)
                        const skillName = noPP ? html.find(`#skillSelection`)[0].value : false

                        let updates
                        if (raise === false) {
                            updates = {
                                token: {name: `${summonersName}'s ${scName}`},
                                actor: {name: `${summonersName}'s ${scName}`},
                            }
                        } else if (raise === true) {
                            updates = {
                                token: {name: `${summonersName}'s ${scName}`},
                                actor: {
                                    name: `${summonersName}'s ${scName}`,
                                    "system.wounds.max": scMaxWounds + 1
                                },
                            }
                        }
                        let spawnData = await warpgate.spawn(scActor.name, updates)
                        await play_sfx(spawnData)

                        //Active Effect:
                        let durationRounds
                        let durationSeconds
                        if (duration === -1) { durationRounds = Number(999999999999999); durationSeconds = Number(999999999999999) }
                        else { durationRounds = duration ; durationSeconds = duration * 6 }

                        let aeData = {
                            changes: [],
                            icon: "modules/swim/assets/icons/effects/0-summoned.svg",
                            label: `${game.i18n.localize("SWIM.label-summonedEntity")} ${scName}`,
                            duration: {
                                rounds: durationRounds,
                                seconds: durationSeconds
                            },
                            flags: {
                                swade: {
                                    expiration: 3
                                },
                                swim: {
                                    maintainedSummon: true,
                                    maintenanceID: maintID,
                                    owner: true,
                                    isSummonedCreature: false
                                }
                            }
                        }
                        if (noPP) {
                            aeData.changes.push({ key: `@Skill{${skillName}}[system.die.modifier]`, mode: 2, priority: undefined, value: -1 })
                        }
                        if (token.actor.system.additionalStats?.maintainedPowers) {
                            aeData.changes.push({ key: `system.additionalStats.maintainedPowers.value`, mode: 2, priority: undefined, value: 1 })
                        }
                        await token.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);

                        const data = {
                            summonerID: token.id,
                            scID: scID,
                            tokenID: spawnData[0],
                            maintID: maintID,
                            duration: duration,
                            flags: {
                                swade: {
                                    expiration: 3
                                },
                                swim: {
                                    maintainedSummon: true,
                                    maintenanceID: maintID,
                                    owner: false,
                                    isSummonedCreature: true,
                                    userId: game.user.id
                                }
                            }
                        }
                        warpgate.event.notify("SWIM.summoner", data)
                    }
                }
            },
            default: "one",
        }).render(true);
    }

    async function dismiss() {
        new Dialog({
            title: 'Mighty Summoner: Dismiss',
            content: game.i18n.format("SWIM.dialogue-dismiss", {officialClass: officialClass, name: token.name}),
            buttons: {
                one: {
                    label: `<i class="fas fa-paw"></i> Dismiss Creature`,
                    callback: async (_) => {
                        const tokenMaintEffect = token.actor.effects.find(e => e.flags?.swim?.isSummonedCreature === true)
                        const maintenanceID = tokenMaintEffect.flags?.swim?.maintenanceID
                        const dismissData = [token.id]
                        await play_sfx(dismissData)
                        await swim.wait(`200`) // delay script execution so that the vfx has time to get the tokens position
                        await warpgate.dismiss(token.id, game.scenes.current.id)
                        for (let each of game.scenes.current.tokens) {
                            const maintEffect = each.actor.effects.find(e => e.flags?.swim?.maintenanceID === maintenanceID)
                            if (maintEffect) {
                                await maintEffect.delete()
                            }
                        }
                    }
                }
            },
            default: "one",
        }).render(true);
    }

    if ((token.document.flags?.swim?.isSummonedCreature === true) && (game.user.isGM || game.user.id === token.document.flags?.swim?.userId)) {
        dismiss()
    } else {
        main();
    }

    async function play_sfx(spawnData) {
        //Playing VFX & SFX:
        let spawnSFX = game.settings.get(
            'swim', 'shapeShiftSFX');
        let spawnVFX = game.settings.get(
            'swim', 'shapeShiftVFX');
        if (spawnSFX) { swim.play_sfx(spawnSFX) }
        if (game.modules.get("sequencer")?.active && spawnVFX) {
            let tokenD = canvas.tokens.get(spawnData[0])
            let sequence = new Sequence()
                .effect()
                .file(`${spawnVFX}`) //recommendation: "modules/jb2a_patreon/Library/2nd_Level/Misty_Step/MistyStep_01_Regular_Green_400x400.webm"
                .atLocation(tokenD)
                .scale(1)
            sequence.play();
            await swim.wait(`800`);
        }
    }
 }

 export async function summoner_gm(data) {
    const newTokenID = data.tokenID
    const newToken = canvas.tokens.get(newTokenID)
    const summonerID = data.summonerID
    const summoner = canvas.tokens.get(summonerID)
    //let duration = data.duration
    //Duration is now handled on the summoners AE, no need to do it here.
    let durationRounds = Number(999999999999999)
    let durationSeconds = Number(999999999999999)

    //Add Flags to token:
    const tokenFlags = {
        flags: {
            swim: data.flags.swim
        }
    }
    await newToken.document.update(tokenFlags)

    // Setting up AE with duration that notifies about the powers end time.
    let aeData = {
        changes: [],
        icon: "modules/swim/assets/icons/effects/0-summoned.svg",
        label: game.i18n.localize("SWIM.label-summoned"),
        duration: {
            rounds: durationRounds,
            seconds: durationSeconds
        },
        flags: data.flags
    }

    // Double the duration if the caster has concentration:
    const concentration = summoner.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-concentration") && i.type === "edge")
    if (concentration) { aeData.duration.rounds = aeData.duration.rounds * 2 }

    if (summoner.combatant != null) {
        let oldCombatData = summoner.combatant.toObject()
        await update_combat(oldCombatData)
    }
    async function update_combat(oldCombatData) {
        await newToken.toggleCombat()
        let combatData = newToken.combatant.toObject()
        combatData.flags = oldCombatData.flags
        combatData.initiative = oldCombatData.initiative
        combatData.flags.swade.groupId = oldCombatData._id
        delete combatData.flags.swade.isGroupLeader

        // Apply combat data to the summoned creature
        await newToken.combatant.update(combatData)
        // Make Summoner a group leader
        oldCombatData.flags.swade.isGroupLeader = true
        delete oldCombatData.flags.swade.groupId
        await summoner.combatant.update(oldCombatData)
        aeData.duration.startRound = game.combat.round
    }
    // Apply AE
    await newToken.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);

    //Apply leadership AEs:
    let commandAeData = {
        changes: [
            {
                "key": "SWIM.unStunMod",
                "value": "1",
                "mode": 2
            },
            {
                "key": "system.attributes.spirit.unShakeBonus",
                "value": "1",
                "mode": 2
            }
        ],
        icon: "",
        label: "",
    }
    let command = summoner.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-command").toLowerCase())
    let holdLine = summoner.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-holdTheLine").toLowerCase())
    let fervor = summoner.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-fervor").toLowerCase())
    if (fervor) {
        commandAeData.label = "Is under exceptional command"
        commandAeData.icon = fervor.img
    } else if (command) {
        commandAeData.label = "Is under command"
        commandAeData.icon = command.img
    } 
    if (holdLine) {
        commandAeData.changes.push(
            {
                "key": "system.stats.toughness.value",
                "value": "1",
                "mode": 2
            }
        )
    }
    if (fervor || command) {
        await newToken.actor.createEmbeddedDocuments('ActiveEffect', [commandAeData]);
    }
 }
