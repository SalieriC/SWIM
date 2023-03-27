export async function brsw_hooks() {
    //BR2 Hooks
    Hooks.on(`BRSW-Unshake`, async (message, actor) => {
        if (game.settings.get("swim", "br2Support") === true) {
            const { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(actor)
            if (unshakeSFX) {
                await swim.play_sfx(unshakeSFX)
            }
        }
    })
    Hooks.on(`BRSW-Unstun`, async (message, actor) => {
        if (game.settings.get("swim", "br2Support") === true) {
            const { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(actor)
            if (unshakeSFX) {
                await swim.play_sfx(unshakeSFX)
            }
        }
    })
    /*Hooks.on("BRSW-AfterShowDamageCard", async (actor, wounds, message) => {
        console.log(actor, wounds, message)
    });*/
    Hooks.on("BRSW-AfterApplyDamage", async (token, final_wounds, final_shaken, incapacitated, initial_wounds, initial_shaken, soaked) => {
        if (game.settings.get("swim", "br2Support") === true) {
            const { shakenSFX, deathSFX, unshakeSFX, stunnedSFX, soakSFX, fatiguedSFX, looseFatigueSFX } = await swim.get_actor_sfx(token.actor)
            const volume = Number(game.settings.get("swim", "defaultVolume"))
            if (soaked >= 1) {
                await swim.play_sfx(soakSFX, volume)
            } else if (incapacitated === true) {
                await swim.play_sfx(deathSFX, volume)
            } else if (final_wounds > initial_wounds || final_shaken === true) {
                await swim.play_sfx(shakenSFX, volume)
            }
        }
    });
    Hooks.on("BRSW-InjuryAEApplied", async (message, effects, type) => {
        if (game.settings.get("swim", "br2Support") === true) {
            if (swim.is_first_gm() === false) { return } //Let the GM user handle things.
            for (let effect of effects) {
                await update_brsw_injury(effect, type)
            }
        }
    });
}

async function update_brsw_injury(effect, type) {
    console.warn("You are using SWIM with BRSW support, injury Active Effects from BRSW will be adjusted. Please report on the SWIM repository in case of unexpected results and bugs!")
    const actor = effect.parent
    let img
    let newLabel
    let newChanges = false
    console.log(effect)
    switch (effect.label) {
        case game.i18n.localize("BRSW.Unmentionables"):
            img = "icons/skills/wounds/blood-drip-droplet-red.webp"
            newLabel = game.i18n.localize("SWIM.injury-unmentionables")
            break;
        case game.i18n.localize("BRSW.Arm"):
            img = "icons/skills/wounds/bone-broken-marrow-red.webp"
            newLabel = game.i18n.localize("SWIM.injury-armUnusable")
            //Dummy AE without actual changes.
            break;
        case game.i18n.localize("BRSW.Broken"):
            img = "icons/skills/wounds/bone-broken-marrow-yellow.webp"
            newLabel = game.i18n.localize("SWIM.injury-gutsBroken")
            //Guts broken, create AE with system.attributes.agility.die.sides -2
            newChanges = {
                key: 'system.attributes.agility.die.sides',
                mode: 2,
                value: -2
            }
            break;
        case game.i18n.localize("BRSW.Battered"):
            img = "icons/skills/wounds/blood-cells-disease-green.webp"
            newLabel = game.i18n.localize("SWIM.injury-gutsBattered")
            //Guts battered, create AE with system.attributes.vigor.die.sides -2
            newChanges = {
                key: 'system.attributes.vigor.die.sides',
                mode: 2,
                value: -2
            }
            break;
        case game.i18n.localize("BRSW.Busted"):
            img = "icons/skills/wounds/blood-spurt-spray-red.webp"
            newLabel = game.i18n.localize("SWIM.injury-gutsBusted")
            //Guts busted, created AE with system.attributes.strength.die.sides -2
            newChanges = {
                key: 'system.attributes.strength.die.sides',
                mode: 2,
                value: -2
            }
            break;
        case game.i18n.localize("BRSW.Scar"):
            img = "icons/skills/wounds/injury-stapled-flesh-tan.webp"
            newLabel = game.i18n.localize("SWIM.injury-headScar")
            //hideous scar, create AE with @Skill{Persuasion}[system.die.modifier] -2
            newChanges = {
                key: `@Skill{${game.i18n.localize("SWIM.skill-persuasion")}}[system.die.modifier]`,
                mode: 2,
                value: -2
            }
            break;
        case game.i18n.localize("BRSW.Blinded"):
            img = "icons/skills/wounds/injury-eyes-blood-red-pink.webp"
            newLabel = game.i18n.localize("SWIM.injury-headBlinded")
            //Dummy AE without actual changes.
            break;
        case game.i18n.localize("BRSW.Brain"):
            img = "icons/skills/wounds/anatomy-organ-brain-pink-red.webp"
            newLabel = game.i18n.localize("SWIM.injury-headBrainDamage")
            //Brain damage, create AE with system.attributes.smarts.die.sides -2
            newChanges = {
                key: 'system.attributes.smarts.die.sides',
                mode: 2,
                value: -2
            }
            break;
        case game.i18n.localize("BRSW.Leg"):
            img = "icons/skills/wounds/bone-broken-knee-beam.webp"
            newLabel = game.i18n.localize("SWIM.injury-legSlow")
            //leg, create AE with appropriate value depending on whether or not the character is slow already
            const slow = actor.items.find(function (item) {
                return ((item.name.toLowerCase() === game.i18n.localize("SWIM.hindrance-slow").toLowerCase()) ||
                    (item.name.toLowerCase() === game.i18n.localize("SWIM.hindrance-slow").toLowerCase())) &&
                    item.type === "hindrance";
            });
            if (!slow) {
                //Actor isn't slow, create AE with minor slow effect = system.stats.speed.runningDie -2 && system.stats.speed.value -1
                if (actor.system.stats.speed.runningDie === 4) {
                    //Running die is a d4 already, alter AE like so: system.stats.speed.runningDie.modifier -1 && system.stats.speed.value -1
                    newChanges = {
                        key: 'system.stats.speed.runningDie.modifier',
                        mode: 2,
                        value: -1
                    }, {
                        key: 'system.stats.speed.value',
                        mode: 2,
                        value: -1
                    }
                } else {
                    //AE as above
                    newChanges = {
                        key: 'system.stats.speed.runningDie',
                        mode: 2,
                        value: -2
                    }, {
                        key: 'system.stats.speed.value',
                        mode: 2,
                        value: -1
                    }
                }
            } else if (slow.system.major === false) {
                //Actor is minor slow, create AE with major slow effect = system.stats.speed.runningDie -2 && system.stats.speed.value -2 && @Skill{Athletics}[system.die.modifier] -2
                newLabel = game.i18n.localize("SWIM.injury-legSlowMajor")
                if (actor.system.stats.speed.runningDie === 4) {
                    //Running die is a d4 already, alter AE like so: system.stats.speed.runningDie.modifier -1 && system.stats.speed.value -2
                    newChanges = {
                        key: 'system.stats.speed.runningDie.modifier',
                        mode: 2,
                        value: -1
                    }, {
                        key: 'system.stats.speed.value',
                        mode: 2,
                        value: -2
                    }, {
                        key: `@Skill{${game.i18n.localize("SWIM.skill-athletics")}}[system.die.modifier]`,
                        mode: 2,
                        value: -2
                    }
                } else {
                    //AE as above
                    newChanges = {
                        key: 'system.stats.speed.runningDie',
                        mode: 2,
                        value: -2
                    }, {
                        key: 'system.stats.speed.value',
                        mode: 2,
                        value: -2
                    }, {
                        key: `@Skill{${game.i18n.localize("SWIM.skill-athletics")}}[system.die.modifier]`,
                        mode: 2,
                        value: -2
                    }
                }
            } //Do nothing if actor is major slow already.
            break;
        default:
            img = "icons/skills/wounds/injury-stitched-flesh-red.webp"
            newLabel = effect.label
    }
    if (type === "gritty") {
        newLabel += `${game.i18n.localize("swim.injury-combat")}`
    } else if (type === "permanent") { //NEED TO CHECK THE TYPE IN BRSW, "permanent" IS AN ASSUMPTION.
        newLabel += `${game.i18n.localize("swim.injury-permanent")}`;
    }
    let updateData = {
        icon: img,
        label: newLabel,
        changes: newChanges ? [newChanges] : effect.changes,
        flags: {
            swim: {
                isCombatInjury: type === "gritty" ? true : false,
                isPermanent: type === "permanent" ? true : false //NEED TO CHECK THE TYPE IN BRSW, "permanent" IS AN ASSUMPTION.
            }
        }
    }
    await effect.update(updateData)
}