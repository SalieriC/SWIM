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
                label: "Let me play already!",
                callback: async (html) => {
                    let start = html.find("#startMigration")[0].checked
                    if (start === true) {
                        await game.settings.set('swim', 'v1MigrationDone', true)
                        ui.notifications.notify("Starting Migration now, please be patient. Your world will reload after completion.")
                        for (let actor of game.actors) {
                            //Process all actors...
                        } for (let item of game.items) {
                            //Process all items...
                        }
                    }
                }
            }
        },
    }).render(true);
}