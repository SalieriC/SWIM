/* This macro will spend a benny for the selected token and gives an error message if there are none left.
If the user is a GM, it will also spend GM bennies if he has some left but the token does not.
If Dice So Nice is installed, it will also trigger the benny roll animation. */

main();

async function main() {
    // No Token is Selected
    if (!token || canvas.tokens.controlled.length > 1) {
        ui.notifications.error("Please select a single token first.");
        return;
    }

    // Checking for SWADE Spices & Flavours and setting up the Benny image.
    let bennyImage = "icons/commodities/currency/coin-embossed-octopus-gold.webp";
    let benny_Back = game.settings.get('swade', 'bennyImage3DBack');
        if (benny_Back) {
            bennyImage = benny_Back;
        }

    let bennies = token.actor.data.data.bennies.value;

    // Non GM token has <1 bennie OR GM user AND selected token has <1 benny
    if ((!game.user.isGM && bennies < 1) || (game.user.isGM && bennies < 1 && game.user.getFlag("swade", "bennies") < 1)) {
        ui.notifications.error("You have no more bennies left.")
        return;
    }

    //Subtract the spend, use GM benny if user is GM and token has no more bennies left or spend token benny if user is player and/or token has bennies left.
    if (game.user.isGM && bennies < 1) {
        game.user.setFlag("swade", "bennies", game.user.getFlag("swade", "bennies") - 1)
    } else {
        token.actor.update({
            "data.bennies.value": bennies - 1,
        })
    }

    //Show the Benny Flip
    if (game.dice3d) {
        game.dice3d.showForRoll(new Roll("1dB").roll(), game.user, true, null, false);
    }

    //Chat Message to let the everyone know a benny was spent
    ChatMessage.create({
        user: game.user._id,
        content: `<p><img style="border: none;" src="${bennyImage}"" width="25" height="25" /> ${game.user.name} spent a Benny for ${token.name}.</p>`,
    });
    // Code by Spacemandev#6256, idea and fixing the code by SalieriC#8263, Dice So Nice benny roll by javierrivera#4813.
}