/*
 * Deprecated in favour of the systems native reshuffle button in the combat tracker.
 */

const table = game.tables.getName("Action Cards");
table.reset();
ui.notifications.info("Action Deck shuffled.");
AudioHelper.play({ src: `systems/swade/assets/card-flip.wav` }, true);