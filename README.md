# SWADE-Immersive-Macros
This is a selection of macros for Savage Worlds Players and GMs alike.
In this repository you won't find any files for download in your Foundry (yet?), no module (yet?) and such, only macros in *.js files. In order to have them in your game you need to create a new macro (just click an empty space in your macro bar) and paste the macros code inside. **Important:** Set the type to be a script macro, otherwise it won't work.

## Help needed!
Are you a creator of sound effects or art and want to contribute? This is great, I'd like to include some assets like macro icons and sound effects in here. Icons need to be square (or round), sound effects need to be short and easily recogniseable. If you want to include your work here I'll gladly give you full credit with links to your homepage for users to check out your other stuff.
You have nothing to offer? Oh you're so wrong. Please [create issues](https://github.com/SalieriC/SWADE-Immersive-Macros/issues/new) here on the GitHub to contribute as well. Tell me which macros or functionality you want to see and inform me about bugs this way and I'll see what I can do about it. No promises I can deliver though and please no hard feelings should I decline your request. Please check for [open issues](https://github.com/SalieriC/SWADE-Immersive-Macros/issues) before creating new ones though.

## Immersion settings
Here you'll find the immersion settings and how to set them up.
### SFX
You can set up one or more sound effects (SFX) in this macro. To do so uncomment (remove the //) the line(s) containing "AudioHelper..." (almost at the end of the macro) and put a URL to a sound file in. This can be a (direct) link to a sound file from the web (any link ending with the extension of a sound file i.e. `.../sound.mp3`) or the relative file path to a sound file inside your Foundry data folder. Most macros will tell you the lines with the AudioHelper code at the very top.
**Important:** Once the AudioHelper executes you can do *nothing* to stop it except reloading (F5 on PC). Only use *very short* sounds (a few seconds at most).
**Where to get SFX:** There are many websites dedicated to offering sfx to download free of charge or paid for audiobooks and such. Also check out mods for video games such as Fallout or Skyrim. Some mods have awesome sfx which you can easily extract from the mod. Just check if that is allowed by the creator before doing so. I cannot be held resposible for any breach of trade agreements, copyright, terms of use, etc.

## Description
Below you'll find some descriptions on the macros. Some require other modules to work properly. Some are compatible with other modules though, well they should be compatible with mostly anything really so I won't give a full list. Instead I'll give you a list of modules that *enhance* the functionality of the macro.
In the very last line all macros tell you their version number. Use it to check whether or not you're using the latest version.

### Spend Benny
**Requirements:** None.
**Compatibility:**
- [Dice So Nice](https://foundryvtt.com/packages/dice-so-nice/) for the Benny throw.
- [SWADE Spices & Flavours](https://github.com/SalieriC/SWADE-Spices-Flavours) for configuring the Benny image.
**Immersion setting:** None.
**Description:**
This macro will basically just spend a Benny. It does use the animation from Dice So Nice if it is installed and activated but doesn't require DSN. With SWADE Spices & Flavours you can customise the look of the Benny.
The macro will use the Bennies of the selected token (needs a token selected to function properly). If the user is a GM it will also use the GMs Bennies but will *always* spend token Bennies first and only touches GM Bennies once the token is out of Bennies. It also gives a warning if no more Bennies are left.
*This macro is the basis for most of the other macros.* Whenever a macro uses a Benny, it will do so using the code from this macro and thus having all its features which I won't detail for other macros.

### (Un-)Shake
**Requirements:** None.
**Compatibility:**
- [Dice So Nice](https://foundryvtt.com/packages/dice-so-nice/) for the Benny throw.
- [SWADE Spices & Flavours](https://github.com/SalieriC/SWADE-Spices-Flavours) for configuring the Benny image.
- [Combat Utility Belt](https://foundryvtt.com/packages/combat-utility-belt/) for the status effect.
**Immersion setting:** SFX.
**Description:**
This macro will first check whether or not the selected token (needs a token to be selected) is marked as Shaken (checks for the checkbox on the sheet). If the token is *not* Shaken, it will mark it as Shaken (tick the checkbox). It it is Shaken, then it will prompt a system roll. After rolling it gives a chat message detailing the result. If the result is best it will remove Skaken and that's it. If the roll could've been better it opens a dialogue giving the user the option to spend a Benny to remove Shaken. If accepted a Benny is spent (if there are Bennies left) and removes Shaken. The user can also decline which just closes the dialogue. The dialogue will not appear if there are no more Bennies left (including GM Bennies if the user is a GM). It also tells the user how many Bennies are left in the dialogue.
Now here is the deal: The macro is aware of any core Edges and Special Abilities that can alter the unshake roll and *automatically* adjusts the roll. You can set up own ones as well by adding them to the `const edgeNames` object (inside the []); put them in '' and only use lower case. The macro requires you to set up Special Abilities like Undead as Edges though, so keep that in mind.
The macro is also aware of Snake Eyes (Critical Failure) and offers no use of a Benny when Snake Eyes occur. It does *not* check for Snake Eyes on Extras though.
This macro comes in two variants: SWADE and SWD. I like the SWD rules regarding Shaken much better but the choice is yours. Here are the differences:
**SWD:** To act this turn you need a raise, success removes Shaken but you may only act *next* turn. While Shaken your Pace is halved.
**SWADE:** To act you'll only need a success.