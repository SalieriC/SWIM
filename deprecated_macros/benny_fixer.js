/*
V.1.0.0
This macro will check all actors in your current world and set all non wild card actors' 
max and current Bennies to 0 unless they have edges that may alter this. The macro comes
with a list of edges in english but can be extended with edges from other languages or
other settings in Line 16 of this macro.
The max and current Bennies will be set to the amount of edges found on that actor.
Please note that it looks for Special Abilities as well, so you can populate the
`const edgeNames` with Special Abilities as well.
This macro WILL fail if requirements are not present on the actor. So if it finds Great Luck but
not Luck for example, it will only set the Bennies to 1.
*/

let actors = game.actors;
for (let actor of actors) {
    const edgeNames = ['luck', 'great luck', 'luck, great', 'luck (imp)'];
    const edges = actor.data.items.filter(function (item) {
        return edgeNames.includes(item.name.toLowerCase()) && (item.type === "edge" || item.type === "ability");
    });
    if (actor.system.wildcard === false && edges.length === 0) {
        await actor.update({"data.bennies.max": 0});
        await actor.update({"data.bennies.value": 0});
    }
    else if (actor.system.wildcard === false && edges.length > 0) {
        let amount = edges.length;
        await actor.update({"data.bennies.max": amount});
        await actor.update({"data.bennies.value": amount});
    }
}