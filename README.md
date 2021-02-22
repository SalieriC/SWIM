# SWADE Immersive Macros (SWIM)
This is a selection of macros for Savage Worlds Players and GMs alike.  
**Warning:** This module is currently a pre-release. It is currently in the making, please read carefully on how to use it and expect bugs.

## Pre-Release usage instructions
The macros are currently not accessible inside Foundry for development reasons. For the pre-release you need to import the macros manually. To do so:
1. Navigate to you Foundry data folder and find the module inside the modules folder, the folder is called `swim`.  
2. Open the macros folder and find the macros you're interested in. (Or find the macros [here](https://github.com/SalieriC/SWADE-Immersive-Macros/tree/main/swim/macros) and skip 3.)  
3. Open the macro using an IDE like Visual Studio Code or Notepad++.  
4. Copy the entire code (CTRL+A and CTRL+C on Windows).
5. In Foundry create a new macro and paste the code in (CTRL+V on Windows).  
6. Set the macro to be a script macro (this is very important).  
7. Configure the module to your liking (not all sound effects have assets yet, you need to find your own) and start experimenting.  
8. If you find bugs or have other suggestions please read the `Help needed!` section below.  
9. Repeat this process when the module gets updated.

## License
The Code of the macros and modules is licensed under the GPU 3.0 License ([see License](https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/LICENSE)).
The SFX is used with permission and may use another License (see Assets section below for details).
Some macros contain SWADE rulings in a way that the macros execute them and sometimes include short notices. They do not contain detailed information about the rulings. This is Licensed under the (Savage Worlds Fan License)[https://www.peginc.com/licensing/].  
<p align="center"> <img src="https://www.peginc.com/wp-content/uploads/2012/04/SW_Logo_FP-1-300x187.jpg"> </p>  
“This game references the Savage Worlds game system, available from Pinnacle Entertainment Group at www.peginc.com. Savage Worlds and all associated logos and trademarks are copyrights of Pinnacle Entertainment Group. Used with permission. Pinnacle makes no representation or warranty as to the quality, viability, or suitability for purpose of this product.”

## Help needed!
Are you a creator of sound effects or art and want to contribute? This is great, I'd like to include some assets like macro icons and sound effects in here. Icons need to be square (or round), sound effects need to be short and easily recogniseable. If you want to include your work here I'll gladly give you full credit with links to your homepage for users to check out your other stuff.  
You have nothing to offer? Oh you're so wrong. Please [create issues](https://github.com/SalieriC/SWADE-Immersive-Macros/issues/new) here on the GitHub to contribute as well. Tell me which macros or functionality you want to see and inform me about bugs this way and I'll see what I can do about it. No promises I can deliver though and please no hard feelings should I decline your request. Please check for [open issues](https://github.com/SalieriC/SWADE-Immersive-Macros/issues) before creating new ones though.  
You can reach me on Discord with general questions as well: SalieriC#8263

### Current Assets
In this repository you can find a number of assets already.  
- **SWADE status markers:** Most of them are created by `Mike deBoston (he)#4382`, but some are created by myself as well. Used with permission. Stock art: [Game-Icons.net](https://game-icons.net/).  
- **SFX:** (see their file name for origin)
- - [Fesliyan Studios](www.fesliyanstudios.com), all used with explicit permission (thank you so much), [see their License here](https://www.fesliyanstudios.com/policy).  

Assets are used in the macros. You can also set up your own assets in the modules configuration. There you can change file paths.

## Immersion settings
Here you'll find the immersion settings and how to set them up.
### SFX
You can set up one or more sound effects (SFX) for this macro. To do so go to the modules configuration and pick the sound effects you like.  
**Important:** Once the AudioHelper (the method to play the SFX) executes you can do *nothing* to stop it except reloading (F5 on PC). Only use *very short* sounds (a few seconds at most).  
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
**Suggested icon:** `systems/swade/assets/benny/benny-chip-front.png`  
**Description:**  
This macro will basically just spend a Benny. It does use the animation from Dice So Nice if it is installed and activated but doesn't require DSN. With SWADE Spices & Flavours you can customise the look of the Benny. This module will automatically find if you're using Spices & Flavours and uses the back image of the Benny if you've set one up.  
The macro will use the Bennies of the selected token (needs a token selected to function). If the user is a GM it will also use the GMs Bennies but will *always* spend token Bennies first and only touches GM Bennies once the token is out of Bennies. It also gives a warning if no more Bennies are left.  
*This macro is the basis for most of the other macros.* Whenever a macro uses a Benny, it will do so using the code from this macro and thus having all its features which I won't detail for other macros.  

### (Un-)Shake
**Requirements:** None.  
**Compatibility:**  
- [Dice So Nice](https://foundryvtt.com/packages/dice-so-nice/) for the Benny throw.
- [SWADE Spices & Flavours](https://github.com/SalieriC/SWADE-Spices-Flavours) for configuring the Benny image.
- [Combat Utility Belt](https://foundryvtt.com/packages/combat-utility-belt/) for the status effect.

**Immersion setting:** SFX.  
**Suggested icon:** `modules/swim/assets/icons/status_markers/0-Shaken.png`  
**Description:**  
This macro will first check whether or not the selected token (needs a token to be selected) is marked as Shaken (checks for the checkbox on the sheet). If the token is *not* Shaken, it will mark it as Shaken (tick the checkbox). It it is Shaken, then it will prompt a system roll. After rolling it gives a chat message detailing the result. If the result is best it will remove Skaken and that's it. If the roll could've been better it opens a dialogue giving the user the option to spend a Benny to remove Shaken. If accepted a Benny is spent (if there are Bennies left) and removes Shaken. The user can also decline which just closes the dialogue. The dialogue will not appear if there are no more Bennies left (including GM Bennies if the user is a GM). It also tells the user how many Bennies are left in the dialogue.  
Now here is the deal: The macro is aware of any core Edges and Special Abilities that can alter the unshake roll and *automatically* adjusts the roll. You can set up own ones as well by adding them to the `const edgeNames` object (inside the []); put them in '' and only use lower case. The macro requires you to set up Special Abilities like Undead as Edges though, so keep that in mind. Also the macro currently does not add a +2 on a reroll if the token has Elan. *Keep in mind that only english Edge names are supported yet.*  
The macro is also aware of Snake Eyes (Critical Failure) and offers no use of a Benny when Snake Eyes occur. It does *not* check for Snake Eyes on Extras though.  
This macro comes in two variants: SWADE and SWD. I like the SWD rules regarding Shaken much better but the choice is yours. Here are the differences:  
**SWD:** To act this turn you need a raise, success removes Shaken but you may only act *next* turn. While Shaken your Pace is halved.  
**SWADE:** To act you'll only need a success.  

### (Un-)Stun
**Requirements:** None.  
**Compatibility:**  
- [Combat Utility Belt](https://foundryvtt.com/packages/combat-utility-belt/) for the status effects.

**Immersion setting:** SFX.  
**Suggested icon:** `modules/swim/assets/icons/status_markers/2-Stunned.png`  
**Description:**  
This macro is very similar to the (Un-)Shake macro but handles Stunned. If the selected token (needs one selected) is not Stunned, it will be marked as such, including all the effects that come with it. Otherwise it will roll to unstun and adds/removes conditions according to the result. It is aware of Snake Eyes. It supports SFX on applying Stunned in the same way as (Un-)Shake.

### Soak Damage
**Requirements:**
- [Health Estimate](https://foundryvtt.com/packages/healthEstimate/)
- [Combat Utility Belt](https://foundryvtt.com/packages/combat-utility-belt/) for the status effects.  

**Immersion setting:** SFX.  
**Suggested icon:** `modules/swim/assets/icons/status_markers/3-Incapacitated.png`  
**Description:**  
One of the most complex macros I ever wrote. It soaks and applies Wounds. It tries to cover everything from SWADE core and guides the user through the process. It is aware of (Un)Holy Warrior and Elan. It follows the core rules and thus is aware of Critical Failures.  
It also supports SFX again. You can configure a path to your desired SFX in the modules configuration.  
You can also use the Gritty Damage setting rule by adding the name of your Injury Table in the modules config. It must be the *exact* name of your Injury Table, best copy and paste it. **Gritty damage is only used for non-GM accounts.** Gritty damage will not be used when you have not set up an ID. So just leave this setting empty if you don't desire to use it.

### Fear Table
**Requirements:** None.  
**Immersion setting:** SFX.  
**Suggested icon:** `modules/swim/assets/icons/status_markers/2c-Frightened.png`  
**Description:**  
This does mostly the same as the macro in the core rules module except you can manually set up the name of your Fear table and it has the option to play a sfx on execution.  
This macro basically just opens a dialogue that asks for a fear modifier and then rolls on your Fear table with that modifier. Remember the rules on this: Negative fear modifiers become positive in the table, so do not enter negative numbers unless you know what you're doing.

### Mark Death
**Requirements:**  
- [Health Estimate](https://foundryvtt.com/packages/healthEstimate/)
- [Combat Utility Belt](https://foundryvtt.com/packages/combat-utility-belt/) for the status effects.  

**Immersion setting:** SFX.  
**Description:**  
This is a rather simple macro that marks a token as Incapacitated! and is mainly intended for NPC Extras. It requires CUB to toggle the Inc.! status and Health Estimate.  
The macro plays a sound effect on execution and will mark all selected as Inc.! It works both ways though and can uncheck Inc.! if needed.  

### Power Point Management  
**Incompatibility:**  This macro is *not* compatible with the power point management offered by the SWADE system. Disable it if you want to use this macro.  
**Requirements:**
- [Health Estimate](https://foundryvtt.com/packages/healthEstimate/)
- [Combat Utility Belt](https://foundryvtt.com/packages/combat-utility-belt/) for the status effects.  

**Immersion setting:** SFX.  
**Description:**  
Oh boy, this one was a pain to create and a great way to learn. It tries to handle all core methods of recharging and spending Power Points and also supports Deadlands The Weird West in the sense of that it offers Whateley Blood. It handles Fatigue and Wounds and only shows the Soul Drain or Whateley Blood stuff if the Edge is found on the character (no language support yet). It will spend as many PP as you set up in the dialogue or recharge as many. It also offerst to recharge 5 by spending a Benny or said Edges.  
SFX works differently here. You need to set up a Playlist called "Magic Effects" and the macro will get all the tracks in it and then plays the selected when PP are spent (not recharged). This offers more flexebility.  
In terms of other SFX: The macro again uses the Incapacitation sfx and the wounded sfx but also a new one played on taking a level of Fatigue.  

### Healing Wounds  
**Requirements:**
- [Health Estimate](https://foundryvtt.com/packages/healthEstimate/)
- [Combat Utility Belt](https://foundryvtt.com/packages/combat-utility-belt/) for the status effects.  

**Immersion setting:** SFX.  
**Description:**  
This macro is more or less the opposite of the Soak Damage macro. It offers functionality to remove wounds in a generic way (i.e. due to the Healing Skill or Power) and also a way to roll on Natural Healing, interpreting the results, removing wounds, offerring rerolls and is aware of Snake Eyes (adds another Wound or Inc.!).  
It uses the sfx for Wounds, Inc.! and Healing.  
The macro is also capable of removing Fatigue using a given number, which also supports a unique SFX.  