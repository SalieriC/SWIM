/*******************************************************
 * SWADE Immersive Macros (SWIM) proudly presents:
 * The Mighty Summoner.
 * This macro tries to handle everything relevant to the
 * Summon power in SWADE. It is in early stages,
 * so bugs may occur. Please create a ticket on the
 * gitHub if you find any problems with it:
 * https://github.com/SalieriC/SWADE-Immersive-Macros/issues/new
 *
 * The Macro natively supports Sound Effects and if you
 * are using the Sequencer module by Wasp
 * (https://foundryvtt.com/packages/sequencer), you can
 * also play a visual effect. SFX and VFX are configured
 * in the module settings of SWIM.
 * 
 * v. 2.0.2
 * By SalieriC
 ******************************************************/
import { execute_as_gm } from "../helpers/socket_helper.js"
import { ActorPickerApp, picker_entry, rank_of_actor } from "../helpers/actor_picker.js"

// Rank needed for Mirror Self (0 Novice ... 4 Legendary): the only summon option with a rank requirement.
const MIRROR_SELF_RANK = 2

function generate_id(length = 16) {
    var result = 'SWIM-';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

export async function summoner_script(data) {
    //const { speaker, _, __, token } = await swim.get_macro_variables()
    const {speaker, character, _, token, item} = await swim.get_data_variables(data, false)

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
    const actor = token.actor

    //Get an ID for this maintenance
    const maintID = generate_id()

    //Set div class based on enabled official module:
    const officialClass = await swim.get_official_class()

    let totalContent = swim.get_folder_content("Summon Creature Presets").filter(item => game.user.isGM || item.testUserPermission(game.user, "LIMITED"));

    let duration = 5
    if (item?.system?.swid === 'zombie') { duration = 600 }
    const concentration = actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-concentration").toLowerCase() && i.type === "edge")
    const summoner = actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-summoner-fc").toLowerCase() && i.type === "edge")
    const druid = actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-druid-fc").toLowerCase() && i.type === "edge")
    if (summoner) { duration = duration * 10 }
    else if (druid) { duration = 600 }
    if (concentration) { duration = duration * 2 }
    const noPP = game.settings.get("swim", "noPowerPoints")
    if (noPP === true) { duration = -1 }

    const defaultDuration = duration

    async function main() {
        const casterRank = rank_of_actor(actor)
        // No Size limit for summons (rank: null). The only rank requirement is Mirror Self (Veteran, rank index 2): greyed out below that, GM can override.
        const entries = totalContent.map(each => picker_entry(each, { rankIdx: null }))
        entries.push(picker_entry(actor, { id: 'mirror', name: game.i18n.localize("SWIM.power-mirrorSelf"), group: 'special', rankIdx: MIRROR_SELF_RANK }))

        const extras = []
        if (!noPP) {
            extras.push({ type: 'number', id: 'duration', label: game.i18n.localize("SWIM.summoner.duration"), hint: game.i18n.localize("SWIM.summoner.durationHint"), value: defaultDuration })
        } else {
            let skills = []
            for (let power of actor.items.filter(p => p.type === "power")) {
                const trait = power.system.actions?.trait
                if (trait && !skills.includes(trait)) { skills.push(trait) }
            }
            if (!skills.length) { skills = actor.items.filter(s => s.type === "skill").map(s => s.name) }
            extras.push({ type: 'select', id: 'skill', label: game.i18n.localize("SWIM.summoner.skill"), options: skills.map(s => ({ value: s, label: s })) })
        }
        extras.unshift({ type: 'checkbox', id: 'raise', label: game.i18n.localize("SWIM.summoner.raise") })

        const result = await ActorPickerApp.prompt({
            title: 'Mighty Summoner',
            intro: game.i18n.localize("SWIM.summoner.intro"),
            introIcon: 'pentagram',
            bond: 'link',
            groupBy: 'folder',
            showRankBadge: false,
            caster: { name: token.name, img: token.document.texture.src, rankIdx: casterRank },
            entries,
            enforceRank: true,
            isGM: game.user.isGM,
            confirmLabel: game.i18n.localize("SWIM.summoner.confirm"),
            confirmIcon: 'pentagram',
            extras,
        })
        if (!result) { return }

        //Get actor based on provided ID:
        const scID = result.id === 'mirror' ? actor.id : result.id
        //Fetching raise:
        const raise = result.values.raise === true
        const summonersName = token.name
        const summonersDisposition = token.document.disposition
        const scActor = game.actors.get(scID)
        const scMaxWounds = scActor.system.wounds.max
        const scName = scActor.prototypeToken.name
        //Get Duration:
        const duration = noPP ? Number(-1) : Number(result.values.duration)
        const skillName = noPP ? result.values.skill : false
        
        // The summoning user becomes Owner of the summoned token's (synthetic) actor right at creation, so they can control it.
        // This is what Warp Gate did (`actorData.ownership`, `delta` in v11); Portal does not do it. Applied while the token is created,
        // so no permission to update the actor afterwards is needed.
        const OWNER_LEVEL = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
        // The summoned creature is also owned by everyone who owns the summoner (matters when the GM summons for a player's token). Not 'default'.
        const summonerOwnership = { ownership: { [game.user.id]: OWNER_LEVEL } }
        for (const [userId, level] of Object.entries(actor.ownership ?? {})) {
            if (userId !== "default" && level === OWNER_LEVEL) summonerOwnership.ownership[userId] = OWNER_LEVEL
        }
        let updates
        if (raise === false) {
            updates = {
                token: { name: `${summonersName}'s ${scName}`, disposition: summonersDisposition, actorLink: false, delta: summonerOwnership }, //don't want to mess with the source actor in case it is linked.
                actor: { name: `${summonersName}'s ${scName}` },
            }
        } else if (raise === true) {
            updates = {
                token: { name: `${summonersName}'s ${scName}`, disposition: summonersDisposition, actorLink: false, delta: summonerOwnership },
                actor: {
                    name: `${summonersName}'s ${scName}`,
                    "system.wounds.max": scMaxWounds + 1
                },
            }
        }

        //Set up the portal:
        const portal = new Portal()
            // Portal only applies updates passed here, not to spawn(). Only the *token* updates are given to Portal:
            // players can't update the summoned creature's actor (no ownership), the GM handler applies `updates.actor` instead.
            .addCreature(scActor, {count: 1, updateData: { token: updates.token }})
            .color(game.user.color.css)
            .texture(scActor.prototypeToken.texture.src)
            .origin(token)
            .range(token.actor.system.attributes.smarts.die.sides)

        // First pick the location only, so the VFX/SFX can play *before* the token appears.
        const picked = await portal.pick()
        // Portal returns false if the placement was cancelled (right click).
        if (!picked) { return }
        await play_sfx(picked)
        // spawn() re-uses the location that was just picked (no second prompt).
        const spawnData = await portal.spawn()
        if (!spawnData?.length) { return }

        //Active Effect:
        let durationRounds
        let durationSeconds
        if (duration === -1) { durationRounds = Number(999999999999999); durationSeconds = Number(999999999999999) }
        else { durationRounds = duration; durationSeconds = duration * 6 }

        let aeData = {
            changes: [],
            icon: "modules/swim/assets/icons/effects/0-summoned.svg",
            name: actor.id === scID ? `${game.i18n.localize("SWIM.label-summonedEntity")} ${game.i18n.localize("SWIM.word-Mirrored")} ${scName}` : `${game.i18n.localize("SWIM.label-summonedEntity")} ${scName}`,
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
        if (actor.system.additionalStats?.maintainedPowers) {
            aeData.changes.push({ key: `system.additionalStats.maintainedPowers.value`, mode: 2, priority: undefined, value: 1 })
        }
        await actor.createEmbeddedDocuments('ActiveEffect', [aeData]);

        const data = {
            summonerID: token.id,
            scID: scID,
            tokenID: spawnData[0]._id,
            actorUpdates: updates.actor, //applied by the GM in summoner_gm()
            maintID: maintID,
            duration: duration,
            mirror: scID === actor._id ? true : false,
            mainFolderID: mainFolder._id,
            raise: raise,
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
        
        await execute_as_gm("summoner", data)
    }

    async function dismiss() {
        new Dialog({
            title: 'Mighty Summoner: Dismiss',
            content: game.i18n.format("SWIM.dialogue-dismiss", { officialClass: officialClass, name: token.name }),
            buttons: {
                one: {
                    label: `<i class="fas fa-paw"></i> Dismiss Creature`,
                    callback: async (_) => {
                        const tokenMaintEffect = actor.effects.find(e => e.flags?.swim?.isSummonedCreature === true)
                        const maintenanceID = tokenMaintEffect.flags?.swim?.maintenanceID
                        await play_sfx({ x: token.center.x, y: token.center.y }) // play_sfx() takes a location (since #12)
                        await swim.wait(`200`) // delay script execution so that the vfx has time to get the tokens position
                        await execute_as_gm("summonerDismiss", {tokenID: token.id, sceneID: game.scenes.current.id})
                        for (let each of game.scenes.current.tokens) {
                            const maintEffect = each.actor?.effects.find(e => e.flags?.swim?.maintenanceID === maintenanceID)
                            if (maintEffect) {
                                await maintEffect.delete()
                            }
                        }
                        const mirrorActor = game.actors.find(a => a.flags?.swim?.maintenanceID === maintenanceID)
                        if (mirrorActor) {
                            await mirrorActor.delete()
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
        // Portal creates the token on the player's own client, so players need the "Create Tokens" permission.
        if (!game.user.can("TOKEN_CREATE")) {
            ui.notifications.error(game.i18n.localize("SWIM.notification.summonerNeedsTokenCreate"), { permanent: true })
            return
        }
        main();
    }

    async function play_sfx(location) {
        //Playing VFX & SFX:
        let spawnSFX = game.settings.get(
            'swim', 'shapeShiftSFX');
        let spawnVFX = game.settings.get(
            'swim', 'shapeShiftVFX');
        await swim.wait(`100`); //I don't know why but VFX won't play when summoning if this isn't here. ¯\_(ツ)_/¯
        if (spawnSFX) { swim.play_sfx(spawnSFX) }
        if (game.modules.get("sequencer")?.active && spawnVFX) {
            let sequence = new Sequence()
                .effect()
                .file(`${spawnVFX}`) //recommendation: "modules/jb2a_patreon/Library/2nd_Level/Misty_Step/MistyStep_01_Regular_Green_400x400.webm"
                .atLocation({ x: location.x, y: location.y })
                .scale(1)
            sequence.play();
            await swim.wait(`800`);
        }
    }
}

export async function summoner_gm(data) {
    let newTokenID = data.tokenID
    let newToken = canvas.tokens.get(newTokenID)
    // The token was created by the player's client; give the GM's canvas a moment to draw it.
    for (let waited = 0; !newToken && waited < 3000; waited += 50) {
        await new Promise(resolve => setTimeout(resolve, 50))
        newToken = canvas.tokens.get(newTokenID)
    }
    if (!newToken) {
        ui.notifications.error(game.i18n.localize("SWIM.notification.generalErrorMsg"))
        throw new Error(`SWIM | Summoner: token ${newTokenID} not found on the GM's canvas (is the GM on the same scene?).`)
    }
    const summonerID = data.summonerID
    const summoner = canvas.tokens.get(summonerID).document

    //Update the summoned creature's actor (name, raise wound). This needs GM permission, players don't own the summoned creature.
    if (data.actorUpdates && !data.mirror) {
        await newToken.document.actor.update(data.actorUpdates)
    }

    //Time for some real bad trickery in case it's a mirrored self:
    if (data.mirror) {
        const summonerActor = summoner.actor
        const scene = newToken.scene
        
        const originalType = summonerActor.type
        const mirrorType = game.settings.get('swim', 'mirrorToken')
        const mirrorImageSrc = summonerActor.flags?.swim?.config?.mirrorSelfImage ? summonerActor.flags?.swim?.config?.mirrorSelfImage : null
        const originalScaleX = summoner.texture.scaleX
        let newScaleX = originalScaleX
        if (mirrorType === 'all' || mirrorType === originalType) { newScaleX = originalScaleX * -1 } //Mirror token if setting chosen.

        let scPreset = game.actors.find(a => (a.id === summonerActor.id)).toObject();
        const packName = game.settings.get('swim', 'specialAbilitiesPack')
        //Creating a copy of the summoner with a few changes:
        scPreset.folder = data.mainFolderID
        scPreset.type = 'npc'
        scPreset.system.wounds.max = data.raise ? 1 : 0
        scPreset.system.wounds.value = 0
        scPreset.system.fatigue.value = 0
        scPreset.system.wildcard = false
        scPreset.system.bennies.max = 0
        scPreset.system.bennies.value = 0
        scPreset.name = `${game.i18n.localize("SWIM.word-Mirrored")} ${summonerActor.name}`
        scPreset.prototypeToken.name = `${game.i18n.localize("SWIM.word-Mirrored")} ${summoner.name}`
        scPreset.prototypeToken.actorLink = true
        scPreset.prototypeToken.texture.scaleX = newScaleX
        if (mirrorImageSrc) {
            scPreset.prototypeToken.texture.src = mirrorImageSrc
            if (mirrorImageSrc.includes('*') || mirrorImageSrc.includes('{')) { scPreset.prototypeToken.randomImg = true }
            else {scPreset.img = mirrorImageSrc}
        }
        scPreset.flags.swim = data.flags.swim
        
        //The copied actor needs to loose the maintenance AE just created, conviniently, it must be the one last created:
        const effIndex = scPreset.effects.length - 1
        if (effIndex >= 0 && scPreset.effects[effIndex].flags?.swim?.owner && scPreset.effects[effIndex].flags?.swim?.owner === true) { scPreset.effects.splice(effIndex, 1) }

        if (packName === 'none' || !packName) {
            scPreset.system.wounds.ignored = scPreset.system.wounds.ignored + 1
            scPreset.system.attributes.spirit.unShakeBonus = scPreset.system.attributes.spirit.unShakeBonus + 2
        }
        let scCopy = await Actor.create(scPreset) //create the new actor first
        //Now that a new actor is created, we need the Construct and Fearless abilities if a pack is defined:
        if (packName && packName != 'none') {
            const pack = game.packs.get(packName)
            const contents = await pack.getDocuments()
            const constructAbility = contents.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.ability-construct").toLowerCase())
            const fearlessAbility = contents.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.ability-fearless").toLowerCase())
            if (constructAbility) { await scCopy.createEmbeddedDocuments('Item', [constructAbility]) }
            if (fearlessAbility) { await scCopy.createEmbeddedDocuments('Item', [fearlessAbility]) }
        }
        //And also reduce the skills by one die type (min d4):
        for (let skill of scCopy.items.filter(s => s.type === 'skill')) {
            if (skill.system.die.sides > 4) { await skill.update({"system.die.sides": skill.system.die.sides - 2}) }
        }
        //And delete the power to the mirror can't reproduce itself:
        const power = scCopy.items.find(p => p.type === 'power' && p.name.toLowerCase() === game.i18n.localize("SWIM.power-summonAlly").toLowerCase())
        if (power) { await power.delete() }

        //Get random image in case this is enabled
        let textureSrc = scCopy.prototypeToken.texture.src
        if(scCopy.prototypeToken.randomImg) {
            let images = await scCopy.getTokenImages();
            textureSrc = images[Math.floor(Math.random() * images.length)];
        }

        //Set token to new actor
        await newToken.document.update({
                                           actorId: scCopy.id,
                                           name: scCopy.prototypeToken.name,
                                           texture: {
                                               scaleX: scCopy.prototypeToken.texture.scaleX,
                                               src: textureSrc
                                           },
                                           randomImg: scCopy.prototypeToken.randomImg
        });
    }

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

    // Setting up AE.
    let aeData = {
        changes: [],
        icon: "modules/swim/assets/icons/effects/0-summoned.svg",
        name: game.i18n.localize("SWIM.label-summoned"),
        duration: {
            rounds: durationRounds,
            seconds: durationSeconds
        },
        flags: data.flags
    }

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
                "key": "system.attributes.vigor.unStunBonus",
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
        name: "",
    }
    let command = summoner.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-command").toLowerCase())
    let holdLine = summoner.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-holdTheLine").toLowerCase())
    let fervor = summoner.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-fervor").toLowerCase())
    if (fervor) {
        commandAeData.name = "Is under exceptional command"
        commandAeData.img = fervor.img
        const fightingTraitName = game.settings.get("swade", "parryBaseSkill")
        for (let weapon of newToken.actor.items.filter(i => i.type === "weapon" && i.system.actions.trait === fightingTraitName)) {
            commandAeData.changes.push({
                "key": `@Weapon{${weapon.name}}[system.actions.dmgMod]`,
                "value": "+1",
                "mode": 2
            })
        }
    } else if (command) {
        commandAeData.name = "Is under command"
        commandAeData.img = command.img
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

export async function summoner_dismiss(data) {
    const scene = await game.scenes.get(data.sceneID)
    const token = await scene.tokens.get(data.tokenID)
    await token.delete()
}