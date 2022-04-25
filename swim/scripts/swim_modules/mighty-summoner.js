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
 * v. 1.1.2
 * By SalieriC
 ******************************************************/
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
    const range = actor.data.data.attributes.smarts.die.sides

    //Set div class based on enabled official module:
    const officialClass = await swim.get_official_class()

    let folder = game.folders.getName("Summon Creature Presets");
    let content = folder.content;
    let totalContent = folder.children.reduce((acc, subFolder) => {
        acc = acc.concat(subFolder.content);
        return acc;
    }, content);

    async function main() {
        //Pre-selecting shape change actors based on rank:
        let scOptions;
        for (let each of totalContent) {
            scOptions = scOptions + `<option value="${each.id}">${each.data.name}</option>`;
        }

        new Dialog({
            title: 'Mighty Summoner',
            content: `${officialClass}
            <p>Please select a creature you want to summon and confirm.</p>
            <p>Afterwards please select a position on the canvas by clicking anywhere within your range.</p>
            <div class="form-group">
                <label for="selected_sc">Creature: </label>
                <select id="selected_sc">${scOptions}</select>
            </div>
            <div class="form-group">
                <label for="raise">Cast with a raise: </label>
                <input id="raise" name="raiseBox" type="checkbox"></input>
            </div>
        </div>`,
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
                        const scName = scActor.data.token.name

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
                                    "data.wounds.max": 1
                                },
                            }
                        }
                        let spawnData = await warpgate.spawn(scActor.name, updates)
                        await play_sfx(spawnData)

                        const data = {
                            summonerID: token.id,
                            scID: scID,
                            tokenID: spawnData[0]
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
            title: 'Mighty Summoner',
            content: game.i18n.format("SWIM.dialogue-dismiss", {officialClass: officialClass, name: token.name}),
            buttons: {
                one: {
                    label: `<i class="fas fa-paw"></i> Dismiss Creature`,
                    callback: async (_) => {
                        const dismissData = [token.id]
                        await play_sfx(dismissData)
                        await swim.wait(`200`) // delay script execution so that the vfx has time to get the tokens position
                        await warpgate.dismiss(token.id, game.scenes.current.id)
                    }
                }
            },
            default: "one",
        }).render(true);
    }

    if ((token.data.flags?.warpgate?.sourceActorId && actor.data.flags?.warpgate?.control?.user) && (game.user.isGM || game.user.id === token.actor.data.flags?.warpgate?.control?.user)) {
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

    // Setting up AE with duration that notifies about the powers end time.
    let aeData = {
        changes: [],
        icon: "modules/swim/assets/icons/effects/0-summoned.svg",
        label: game.i18n.localize("SWIM.label-summoned"),
        duration: {
            rounds: 5,
        },
        flags: {
            swade: {
                expiration: 3
            }
        }
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
        aeData.duration.startRound = game.combat.data.round
    }
    // Apply AE
    await newToken.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
 }
