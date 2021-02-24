const table = game.tables.entities.find(t => t.name === "Action Cards");
table.reset();
ui.notifications.info("Action Deck shuffled.");
AudioHelper.play({ src: `systems/swade/assets/card-flip.wav` }, true);