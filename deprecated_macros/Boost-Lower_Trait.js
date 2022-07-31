/***********************************************************************************
 * Boost/Lower Trait Macro.
 * v.1.0.0
 * Created by SirDiesalot#2922
 * Adjusted for SWIM by SalieriC#8263
 * Requires SWADE v.0.21.0 or higher.
 * Dev note: Needs update for FVTT 9+ (.createEmbeddedDocuments)
***********************************************************************************/
main()

const UPICON = "modules/swim/assets/icons/status_markers/m-boost.png"
const DOWNICON = "modules/swim/assets/icons/status_markers/m-lower.png"

async function main() {
    let tokens = []
    game.user.targets.forEach(token => {tokens.push(token)})
    if (tokens.length == 0) {
        ui.notifications.error("No tokens targeted");
        return;
    }
    let traits = {
        "Agility": { 
            type: "attribute",
            name: "Agility",
            modkey: "data.attributes.agility.die.modifier",
            diekey: "data.attributes.agility.die.sides"
        },
        "Smarts": { 
            type: "attribute",
            name: "Smarts",
            modkey: "data.attributes.smarts.die.modifier",
            diekey: "data.attributes.smarts.die.sides"
        },
        "Sprit": { 
            type: "attribute",
            name: "Sprit",
            modkey: "data.attributes.spirit.die.modifier",
            diekey: "data.attributes.spirit.die.sides"
        },
        "Strength": { 
            type: "attribute",
            name: "Strength",
            modkey: "data.attributes.strength.die.modifier",
            diekey: "data.attributes.strength.die.sides"
        },
        "Vigor": { 
            type: "attribute",
            name: "Vigor",
            modkey: "data.attributes.vigor.die.modifier",
            diekey: "data.attributes.vigor.die.sides"
        }
    }

    for (var token of tokens) {
        let skills = token.actor.items.filter(e => e.type == "skill")
        for (const skill of skills) {
            let name = skill.data.name
            traits[name] = { type: "skill", name: name, 
                             modkey: `@Skill{${name}}[data.die.modifier]`, 
                             diekey: `@Skill{${name}}[data.die.sides]` }
        }
    }

    var traitoptions = `<select id="select-trait" name="select-trait">`
    for (let trait in traits) {
        traitoptions += `<option value="${trait}">${trait}</option>`
    }
    traitoptions += `</select>`

    var applyChanges = false
    var raise = false
    new Dialog({
        title: "Boost/Lower Trait",
        content: `
        <form>
           <p><label>Which Trait?<br> ${traitoptions} </label></p>
           <p><label>
              Boost or Lower?</br>
              <select id="select-direction" name="select-direction">
                  <option value="Boost">Boost</option>
                  <option value="Lower">Lower</option>
              </select>
            </label></p>
        </form>
        `,
        buttons: {
            apply: {
                label: "Apply",
                callback: () => {applyChanges = true; raise}
            },
            raise: {
                label: "Apply with raise",
                callback: () => {applyChanges = true; raise = true}
            },
            cancel: {
                label: "Cancel"
            }
        },
        default: "apply",
        close: html => {
            if (applyChanges) {
                let direction = html.find('[name="select-direction"]')[0].value
                let trait = html.find('[name="select-trait"]')[0].value
                createEffect(tokens, traits, direction, trait, raise)
            }
        }
    }).render(true)
}

async function createEffect(tokens, traits, direction, trait, raise) {
    trait = traits[trait]
    for (var token of tokens) {
        let currentdie = 0;
        let currentmod = 0;
        if (trait["type"] == "attribute") {
            var part
            let value = token.actor.data
            for (part of trait["diekey"].split(".")) {
                value = value[part]
            }
            currentdie = value
            value = token.actor.data
            for (part of trait["modkey"].split(".")) {
                value = value[part]
            }
            currentmod = value
        } else {
            let skill = token.actor.items.filter(s => s.type == "skill").find(s => s.data.name == trait["name"])
            if (skill) {
                currentdie = skill.system.die.sides
                currentmod = skill.system.die.modifier
            } 
        }
        if (currentdie == 0) {
            continue
        }
        if (currentdie == 4 && direction == "Lower") {
            continue
        }
        let diemod = 2
        let modmod = 0
        if (direction == "Lower") {
            diemod = -2
        }
        if (currentdie == 6 && direction == "Lower" && raise) {
            diemod = -1
        } else if (currentdie == 12 && direction == "Boost") {
            diemod = 0
            modmod = 1
        }
        if (raise) {
            diemod *= 2
            modmod *= 2
        }
        if (currentdie == 10 && direction == "Boost" && raise) {
            diemod = 2
            modmod = 1
        }
        var effectData = {
            label: `${raise ? "major" : "minor"} ${direction} ${trait.name}`,
            icon: direction == "Lower" ? DOWNICON : UPICON,
            changes: [{                    
                "key": trait["diekey"],
                "mode": 2,
                "value": diemod,
                "priority": 0
            },{
                "key": trait["modkey"],
                "mode": 2,
                "value": modmod,
                "priority": 0
            }]
        }
        applyUniqueEffect(token.actor, effectData)
    }
}

async function removeNamedEffect(actor, effectData) {
    // Look to see if there's already a Cover effect
    const item = actor.data.effects.find(i =>i.label === effectData.label);
    if (item != undefined) {
        // Delete it if there is one
        const deleted = await ageSystemActor.deleteEmbeddedEntity("ActiveEffect", item._id); // Deletes one EmbeddedEntity
    }
}

// define applyUniqueEffect function
async function applyUniqueEffect(actor, effectData) {
    // Look to see if there's already a Cover effect
    removeNamedEffect(actor, effectData);

    // Create a new fresh one with the new settings
    await actor.createEmbeddedEntity("ActiveEffect", effectData); 
}