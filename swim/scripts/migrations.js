import * as SWIM from "./constants.js";

export async function v10_migration() {
    new Dialog({
        title: 'SWIM v.1.0.0 Migration',
        content: `<form>
                <h1>SWIM v.1.0.0 Migration</h1>
                <p>It is with great pleasure that I can now present to you SWADE Immersive Macros version 1.0.0.</p>
                <p>Yes, that's right, it finally is a full release. Why is that? Well, SWIM made quite the progress and I don't want to bore you with a history lesson,
                just this much: SWIM now has a proper configuration on each actor and item thanks to Loofou. No more messing around with additional stats.</p>
                <p>To not loose all the configuration you did however, you need to run this migration. It will process actors and items, get their SWIM configuration, save them
                in a proper way and then remove the additional stats not needed any longer.</p>
                <p>This will only cover actors and items inside your world. Before you continue, you should thus import all actors and items saved inside any compendiums,
                if you wish them to be processed. Otherwise they will be migrated as soon as their SWIM config menu is opened or as they're needed.</p>
                <p>As it naturally comes with being human, there is a slight chance that the migration will irreversibly mess something up but I did my very best to write this
                migration in a way that should prevent this from happening. That said, I cannot be held responsible for any damage or data loss. <strong>Please make a backup before you proceed!</strong></p>
                <hr />
                <div class="form-group">
                    <label for="startMigration">I have made a backup and now wish to start your fancy migration: </label>
                    <input id="startMigration" name="Start Migration" type="checkbox"></input>
                </div>
                <hr />
                <p>Please also consider to donate if you really like SWIM. This is one of the few ways of letting me know that SWIM is actually used and appreciated by some. =)</p>
                <p><a href="https://ko-fi.com/salieric"><img style="border: 0px; display: block; margin-left: auto; margin-right: auto;" src="https://www.ko-fi.com/img/githubbutton_sm.svg" width="223" height="30" /></a></p>
            </form>`,
        buttons: {
            one: {
                label: "Run Migration",
                callback: async (html) => {
                    let start = html.find("#startMigration")[0].checked
                    if (start === true) {
                        ui.notifications.warn("Starting Migration now, please be patient. Your world will reload after completion.", { permanent: true })
                        let allItems = []
                        for (let item of game.items) { allItems.push(item) }
                        for (let actor of game.actors) {
                            //Process all actors...
                            console.log("SWIM | Starting migration for", actor)
                            for (let item of actor.items) { allItems.push(item) }
                            if (actor.system.additionalStats?.sfx?.value && typeof actor.system.additionalStats?.sfx?.value === "string") {
                                const sfxSequence = actor.system.additionalStats?.sfx?.value
                                const sfxSplit = sfxSequence.split("|")
                                const shakenSFX = sfxSplit[0] ? sfxSplit[0] : ""
                                const deathSFX = sfxSplit[1] ? sfxSplit[1] : ""
                                const unshakeSFX = sfxSplit[2] ? sfxSplit[2] : ""
                                const soakSFX = sfxSplit[3] ? sfxSplit[3] : ""
                                const flagData = { //Verify how they are structured in final release.
                                    flags: {
                                        swim: {
                                            config: {
                                                shakenSFX: shakenSFX,
                                                deathSFX: deathSFX,
                                                unshakeSFX: unshakeSFX,
                                                soakSFX: soakSFX,
                                                _version: SWIM.CONFIG_VERSION
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
                            if (item.flags?.swim?.config?._version) {
                                continue
                            }
                            console.log("SWIM | Starting migration for", item)
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
                            } if (item.system.additionalStats?.silenced?.value && item.system.additionalStats?.silenced?.value === "boolean") {
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
                    }
                    await game.settings.set('swim', 'v1MigrationDone', true)
                    window.location.reload();
                }
            }
        },
    }).render(true);
}

export async function v11_migration() {
    new Dialog({
        title: 'SWIM v.2.0.0 Migration',
        content: `<form>
                <h1>SWIM v.2.0.0 Migration</h1>
                <p>In Foundry v11 there was a change in the way active effects are named, while all actual AEs should be migrated by Foundry itself, the data stored by SWIM will not. 
                You need to run this migration to update all of SWIMs data to v11. This cannot be undone and will affect all of your actors and items in this world. 
                Actors and items in compendiums will be migrated once they are accessed by SWIM. Please make sure to create a backup before you proceed.</p>
                <hr />
                <div class="form-group">
                    <label for="startMigration">I have made a backup and now wish to start your fancy migration: </label>
                    <input id="startMigration" name="Start Migration" type="checkbox"></input>
                </div>
                <hr />
                <p>Please also consider to donate if you really like SWIM. This is one of the few ways of letting me know that SWIM is actually used and appreciated by some. =)</p>
                <p><a href="https://ko-fi.com/salieric"><img style="border: 0px; display: block; margin-left: auto; margin-right: auto;" src="https://www.ko-fi.com/img/githubbutton_sm.svg" width="223" height="30" /></a></p>
            </form>`,
        buttons: {
            one: {
                label: "Run Migration",
                callback: async (html) => {
                    let start = html.find("#startMigration")[0].checked
                    if (start === true) {
                        ui.notifications.warn("Starting Migration now, please be patient. Your world will reload after completion.", { permanent: true })
                        let allItems = []
                        for (let item of game.items) { allItems.push(item) }
                        for (let actor of game.actors) {
                            //Process all actors...
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
                                flagData.config._version = SWIM.CONFIG_VERSION
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
                                if (actor.flags?.swim?.config) {
                                    flagData = {
                                        flags: {
                                            swim: {
                                                config: actor.flags.swim.config
                                            }
                                        }
                                    }
                                    flagData.config._version = SWIM.CONFIG_VERSION
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
                    await game.settings.set('swim', 'v2MigrationDone', true)
                    window.location.reload();
                }
            }
        },
    }).render(true);
}

export async function update_migration(actor, item, currVersion) {
    if (!currVersion || currVersion < 1) {
        let name = actor ? actor.name : item.name
        ui.notifications.warn(`Starting Migration for ${name}, please wait.`)
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
        ui.notifications.notify(`Migration for ${actor.name} finished.`)
    } if (currVersion < 2) {
        let name = actor ? actor.name : item.name
        ui.notifications.warn(`Starting Migration for ${name}, please wait.`)
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