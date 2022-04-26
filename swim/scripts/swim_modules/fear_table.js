/*******************************************
 * Fear Table Macro.
 * v. 2.1.0 by SalieriC#8263, original creator unknown.
 *******************************************/
export async function fear_table_script() {
    const dialog = new Dialog({
        title: game.i18n.localize("SWIM.fear"),
        content: game.i18n.format("SWIM.dialogue-fearContent"),
        default: 'roll',
        buttons: {
            roll: {
                label: game.i18n.localize("SWIM.dialogue-roll"),
                callback: (html) => {
                    let modifier = html.find('.fearTable input[name="fearModifier"]')[0].value;
    
                    if (modifier === '') {
                        modifier = 0;
                    }
                    
                    modifier = parseInt(modifier);
                    const roll = new Roll('1d20 + @mod', { mod: modifier });
                    let fearTableName = game.settings.get(
                        'swim', 'fearTable');
                        if (fearTableName) {
                            let fearTable = game.tables.getName(`${fearTableName}`)
                            if (!fearTable) {
                                ui.notifications.error(game.i18n.format("SWIM.notification.tableNotFound", {tableName: fearTableName}))
                                return
                            } else {
                                fearTable.draw({ roll });
                            }
                        }
                        else {
                            ui.notifications.error(game.i18n.localize("SWIM.notification.tableNameMissing", {type: game.i18n.localize("SWIM.fear")}));
                            return;
                        }
                    let fearSFX = game.settings.get(
                        'swim', 'fearSFX');
                    if (fearSFX) {
                        AudioHelper.play({ src: `${fearSFX}` }, true);
                    }                
                }
            }
        },
        render: ([dialogContent]) => {
            dialogContent.querySelector(`input[name="fearModifier"`).focus();
        },
        default: "roll"
    });
    dialog.render(true);
}