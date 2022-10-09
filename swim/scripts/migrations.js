export async function v10_migration() {
    new Dialog({
        title: 'SWIM v.1.0.0 Migration',
        content: `<form>
                <h1>SWIM v.1.0.0 Migration</h1>
                <p>It is with great pleasure that I can now present to you SWADE Immersive Macros version 1.0.0.</p>
                <p>Yes, that's right, it finally is a full release. Why is that? Well, SWIM made quite the progress and I don't want to bore you with a history lesson,
                just this much: SWIM now has a proper configuration on each actor and item. No more messing around with additional stats.</p>
                <p>To not loose all the configuration you did however, you need to run this migration. It will process actors and items, get their SWIM configuration, save them
                in a proper way and then remove the additional stats not needed any longer.</p>
                <p>This will only cover actors and items inside your world. Before you continue, you should thus import all actors and items saved inside any compendiums,
                if you wish them to be processed.</p>
                <p>As it naturally comes with being human, there is a slight chance that the migration will irrevertibly mess something up but I did my very best to write this
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
                label: "Ok",
                callback: async (html) => {
                    let start = html.find("#startMigration")[0].checked
                    if (start === true) {
                        ui.notifications.notify("Starting Migration now, please be patient. Your world will reload after completion.")
                        let allItems = []
                        allItems.push(game.items)
                        for (let actor of game.actors) {
                            //Process all actors...
                            for (let item of actor.items) { allItems.push(item) }
                            if (actor.system.additionalStats?.sfx?.value && actor.system.additionalStats?.sfx?.dtype === "String") {
                                const sfxSequence = actor.system.additionalStats?.sfx?.value
                                const sfxSplit = sfxSequence.split("|")
                                const shakenSFX = sfxSplit[0]
                                const deathSFX = sfxSplit[1]
                                const unshakeSFX = sfxSplit[2]
                                const soakSFX = sfxSplit[3]
                                const flagData = { //Verify how they are structured in final release.
                                    flags: {
                                        swim: {
                                            config: {
                                                shakenSFX: shakenSFX,
                                                deathSFX: deathSFX,
                                                unshakeSFX: unshakeSFX,
                                                soakSFX: soakSFX
                                            }
                                        }
                                    }
                                }
                                await actor.update(flagData)
                            }
                        } for (let item of allItems) {
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
                            if (actor.system.additionalStats?.sfx?.value && actor.system.additionalStats?.sfx?.dtype === "String") {
                                sfxSequence = actor.system.additionalStats?.sfx?.value
                                sfxSplit = sfxSequence.split("|")
                                reloadSfx = sfxSplit[0]
                                fireSfx = sfxSplit[1]
                                autofireSfx = sfxSplit[2]
                                silencedfireSfx = sfxSplit[3]
                                silencedautofireSfx = sfxSplit[4]
                                emptyfireSfx = sfxSplit[5]
                            } if (actor.system.additionalStats?.isPack?.value && actor.system.additionalStats?.isPack?.dtype === "Boolean") {
                                isPack = actor.system.additionalStats?.isPack?.value
                            } if (actor.system.additionalStats?.isConsumable?.value && actor.system.additionalStats?.isConsumable?.dtype === "Boolean") {
                                isConsumable = actor.system.additionalStats?.isConsumable?.value
                            } if (actor.system.additionalStats?.silenced?.value && actor.system.additionalStats?.silenced?.dtype === "Boolean") {
                                silenced = actor.system.additionalStats?.silenced?.value
                            } if (actor.system.additionalStats?.loadedAmmo?.value && actor.system.additionalStats?.loadedAmmo?.dtype === "String") {
                                loadedAmmo = actor.system.additionalStats?.loadedAmmo?.value
                            }
                            const flagData = { //Verify how they are structured in final release.
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
                                            loadedAmmo: loadedAmmo
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