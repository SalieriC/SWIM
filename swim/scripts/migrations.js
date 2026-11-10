import * as SWIM from "./constants.js";

/**
 * Lazy per-document migration (config flag version 0 -> 1 -> CONFIG_VERSION).
 * Called by swim.run_migration() whenever an actor/item config is needed and by migrate_world().
 * @param {boolean} silent  suppress the per-document notifications (used by migrate_world)
 */
export async function update_migration(actor, item, currVersion, silent = false) {
    if (!currVersion || currVersion < 1) {
        let name = actor ? actor.name : item.name
        if (!silent) ui.notifications.warn(`Starting Migration for ${name}, please wait.`)
        let allItems = []
        if (item) { allItems.push(item) }
        if (actor) {
            console.log("SWIM | Starting migration for", actor)
            for (let item of actor.items) { allItems.push(item) }
            if (actor.system.additionalStats?.sfx?.value && typeof actor.system.additionalStats?.sfx?.value === "string") {
                const sfxSequence = actor.system.additionalStats?.sfx?.value
                const sfxSplit = sfxSequence.split("|")
                const shakenSFX = sfxSplit[0] ? sfxSplit[0] : ""
                const deathSFX = sfxSplit[1] ? sfxSplit[1] : ""
                const unshakeSFX = sfxSplit[2] ? sfxSplit[2] : ""
                const soakSFX = sfxSplit[3] ? sfxSplit[3] : ""
                const flagData = {
                    flags: {
                        swim: {
                            config: {
                                shakenSFX: shakenSFX,
                                deathSFX: deathSFX,
                                unshakeSFX: unshakeSFX,
                                soakSFX: soakSFX,
                                _version: 1
                            }
                        }
                    }
                }
                await actor.update(flagData)
                await actor.update({ "system.additionalStats.-=sfx": null })
            } else {
                const flagData = {
                    flags: {
                        swim: {
                            config: {
                                _version: 1
                            }
                        }
                    }
                }
                if (actor.system.additionalStats?.radRes?.value) {
                    flagData.flags.swim.config.radRes = Number(actor.system.additionalStats?.radRes?.value)
                    await actor.update({ "system.additionalStats.-=radRes": null })
                }
                await actor.update(flagData)
            }
        } for (let item of allItems) {
            if (item.flags?.swim?.config?._version >= 1) {
                continue
            }
            //Process all items...
            let isPack = false
            let loadedAmmo = ""
            let isConsumable = false
            let sfxSequence = "" // RELOAD|FIRE|AUTOFIRE|SILENCED|SILENCEDAUTOFIRE|EMPTY
            let silenced = false

            let reloadSfx = ""
            let fireSfx = ""
            let autofireSfx = ""
            let silencedfireSfx = ""
            let silencedautofireSfx = ""
            let emptyfireSfx = ""
            if (item.system.additionalStats?.sfx?.value && typeof item.system.additionalStats?.sfx?.value === "string") {
                sfxSequence = item.system.additionalStats?.sfx?.value
                let sfxSplit = sfxSequence.split("|")
                if (item.type === "power") {
                    fireSfx = sfxSplit[0]
                } else if (item.system.ammo.toLowerCase() === "melee") {
                    reloadSfx = "null"
                    fireSfx = "null"
                    autofireSfx = "null"
                    silencedfireSfx = "null"
                    silencedautofireSfx = "null"
                    emptyfireSfx = "null"
                } else {
                    reloadSfx = sfxSplit[0] ? sfxSplit[0] : "null"
                    fireSfx = sfxSplit[1] ? sfxSplit[1] : "null"
                    autofireSfx = sfxSplit[2] ? sfxSplit[2] : "null"
                    silencedfireSfx = sfxSplit[3] ? sfxSplit[3] : "null"
                    silencedautofireSfx = sfxSplit[4] ? sfxSplit[4] : "null"
                    emptyfireSfx = sfxSplit[5] ? sfxSplit[5] : "null"
                }
            } if (item.system.additionalStats?.isPack?.value && typeof item.system.additionalStats?.isPack?.value === "boolean") {
                isPack = item.system.additionalStats?.isPack?.value
                await item.update({ "system.additionalStats.-=isPack": null })
            } if (item.system.additionalStats?.isConsumable?.value && typeof item.system.additionalStats?.isConsumable?.value === "boolean") {
                isConsumable = item.system.additionalStats?.isConsumable?.value
                await item.update({ "system.additionalStats.-=isConsumable": null })
            } if (item.system.additionalStats?.silenced?.value && typeof item.system.additionalStats?.silenced?.value === "boolean") {
                silenced = item.system.additionalStats?.silenced?.value
                await item.update({ "system.additionalStats.-=silenced": null })
            } if (item.system.additionalStats?.loadedAmmo?.value && typeof item.system.additionalStats?.loadedAmmo?.value === "string") {
                loadedAmmo = item.system.additionalStats?.loadedAmmo?.value
                await item.update({ "system.additionalStats.-=loadedAmmo": null })
            }
            const flagData = {
                flags: {
                    swim: {
                        config: {
                            reloadSFX: reloadSfx.toLowerCase() === "null" || reloadSfx.toLowerCase() === "reload" ? "" : reloadSfx,
                            fireSFX: fireSfx.toLowerCase() === "null" || fireSfx.toLowerCase() === "fire" ? "" : fireSfx,
                            autoFireSFX: autofireSfx.toLowerCase() === "null" || autofireSfx.toLowerCase() === "autofire" ? "" : autofireSfx,
                            silencedFireSFX: silencedfireSfx.toLowerCase() === "null" || silencedfireSfx.toLowerCase() === "silenced" ? "" : silencedfireSfx,
                            silencedAutoFireSFX: silencedautofireSfx.toLowerCase() === "null" || silencedautofireSfx.toLowerCase() === "silencedautofire" ? "" : silencedautofireSfx,
                            emptySFX: emptyfireSfx.toLowerCase() === "null" || emptyfireSfx.toLowerCase() === "empty" ? "" : emptyfireSfx,
                            isPack: isPack,
                            isConsumable: isConsumable,
                            isSilenced: silenced,
                            loadedAmmo: loadedAmmo,
                            _version: 1
                        }
                    }
                }
            }
            await item.update(flagData)
        }
        if (!silent) ui.notifications.notify(`Migration for ${actor ? actor.name : item.name} finished.`)
    } if (!currVersion || currVersion < 2) { //No version at all: run both steps in one go (previously the second step only ran on the next call).
        let name = actor ? actor.name : item.name
        if (!silent) ui.notifications.warn(`Starting Migration for ${name}, please wait.`)
        let allItems = []
        if (item) { allItems.push(item) }
        if (actor) {
            //Process actor...
            console.log("SWIM | Starting migration for", actor)
            for (let item of actor.items) { allItems.push(item) }
            let flagData
            if (actor.flags?.swim?.config) {
                flagData = {
                    flags: {
                        swim: {
                            config: actor.flags.swim.config
                        }
                    }
                }
                flagData.flags.swim.config._version = SWIM.CONFIG_VERSION
            }
            else {
                flagData = {
                    flags: {
                        swim: {
                            config: {
                                _version: SWIM.CONFIG_VERSION
                            }
                        }
                    }
                }
            }
            await actor.update(flagData)
        } for (let item of allItems) {
            if (item.flags?.swim?.config?._version >= 2) {
                continue
            }
            console.log("SWIM | Starting migration for", item)
            //Process all items...
            if (item.flags?.swim?.config?.ammoActiveEffect) {
                const oldAmmoAE = item.flags.swim.config.ammoActiveEffect
                const newAmmoAE = oldAmmoAE.replace(/"label":/g, '"name":');
                const flagData = {
                    flags: {
                        swim: {
                            config: item.flags.swim.config
                        }
                    }
                }
                flagData.flags.swim.config.ammoActiveEffect = newAmmoAE
                flagData.flags.swim.config._version = SWIM.CONFIG_VERSION
                await item.update(flagData)
            } else {
                let flagData
                if (item.flags?.swim?.config) {
                    flagData = {
                        flags: {
                            swim: {
                                config: item.flags.swim.config
                            }
                        }
                    }
                    flagData.flags.swim.config._version = SWIM.CONFIG_VERSION
                }
                else {
                    flagData = {
                        flags: {
                            swim: {
                                config: {
                                    _version: SWIM.CONFIG_VERSION
                                }
                            }
                        }
                    }
                }
                await item.update(flagData)
            }
        }
    }
}

/**
 * Migrates the whole world in one go (GM only): all world actors, all world items and all items owned by actors.
 * Compendiums are not touched (import documents first or let them migrate when they are used).
 * Documents that are already up to date are skipped. Make a backup first.
 * API: swim.migrate_world()
 */
export async function migrate_world() {
    if (!game.user.isGM) {
        ui.notifications.error(game.i18n.localize("SWIM.notification.migrationGMOnly"))
        return
    }
    const version = d => d.flags?.swim?.config?._version
    const outdated = d => !(version(d) >= SWIM.CONFIG_VERSION)
    //Items that carry (legacy) SWIM data or are weapons. Other item types would only get empty default flags.
    const legacyKeys = ["sfx", "isPack", "isConsumable", "silenced", "loadedAmmo"]
    const hasSwimData = i => i.flags?.swim?.config !== undefined || i.type === "weapon"
        || legacyKeys.some(k => i.system?.additionalStats?.[k] !== undefined)
    let migrated = 0, failed = 0
    const run = async (actor, item, doc) => {
        try {
            await update_migration(actor, item, version(doc), true)
            migrated++
        } catch (err) {
            failed++
            console.error("SWIM | World migration failed for", doc, err)
        }
    }
    const actors = game.actors.filter(outdated)
    ui.notifications.info(game.i18n.format("SWIM.notification.migrationWorldStart", { actors: actors.length }))
    for (const actor of actors) { await run(actor, false, actor) } //Also migrates the items owned by the actor.
    //Remaining items: world items and items of actors that were already up to date.
    const items = game.items.contents.concat(game.actors.contents.flatMap(a => a.items.contents))
    for (const item of items) {
        if (outdated(item) && hasSwimData(item)) { await run(false, item, item) }
    }
    ui.notifications.info(game.i18n.format("SWIM.notification.migrationWorldDone", { migrated, failed }))
    console.log(`SWIM | World migration finished: ${migrated} migrated, ${failed} failed.`)
}
