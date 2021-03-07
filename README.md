# SWADE Immersive Macros (SWIM)
This is a selection of macros for Savage Worlds Players and GMs alike.  

## Usage instructions
You'll find all the macros in a new compendium delivered by the module. It contains all the macros. You can either import the macros or replace the code of your existing macros. Once that is done you can start using them although I strongly suggest taking a look at the module settings. There are quite a few which might be interesting for you.  
**Please read this ReadMe in full, as it contains important instructions on how to use this module.**
**Important:** You might need to update the macros you've imported when you update the module. I hope to find a method to automate this in the future.  

## License
The Code of the macros and modules is licensed under the GPU 3.0 License ([see License](https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/LICENSE)).
The SFX is used with permission and may use another License (see Assets section below for details).
Some macros contain SWADE rulings in a way that the macros execute them and sometimes include short notices. They do not contain detailed information about the rulings. This is Licensed under the [Savage Worlds Fan License](https://www.peginc.com/licensing/).  
<p align="center"> <img src="https://www.peginc.com/wp-content/uploads/2012/04/SW_Logo_FP-1-300x187.jpg"> </p>  
“This game references the Savage Worlds game system, available from Pinnacle Entertainment Group at www.peginc.com. Savage Worlds and all associated logos and trademarks are copyrights of Pinnacle Entertainment Group. Used with permission. Pinnacle makes no representation or warranty as to the quality, viability, or suitability for purpose of this product.”

## Help needed!
Are you a creator of sound effects or art and want to contribute? This is great, I'd like to include some assets like macro icons and sound effects in here. Icons need to be square (or round), sound effects need to be short and easily recogniseable. If you want to include your work here I'll gladly give you full credit with links to your homepage for users to check out your other stuff.  
You have nothing to offer? Oh you're so wrong. Please [create issues](https://github.com/SalieriC/SWADE-Immersive-Macros/issues/new) here on the GitHub to contribute as well. Tell me which macros or functionality you want to see and inform me about bugs this way and I'll see what I can do about it. No promises I can deliver though and please no hard feelings should I decline your request. Please check for [open issues](https://github.com/SalieriC/SWADE-Immersive-Macros/issues) before creating new ones though.  
You can reach me on Discord with general questions as well: SalieriC#8263

### Current Assets
In this repository you can find a number of assets already.  
- **SWADE status markers:** Most of them are created by `Mike deBoston (he)#4382`, but some are created by myself as well. Used with permission. Stock art: [Game-Icons.net](https://game-icons.net/).  
- **Other Icons:** [Game-Icons.net](https://game-icons.net/).  
- **SFX:** (see their file name for origin)
- - [Fesliyan Studios](www.fesliyanstudios.com), all used with explicit permission (thank you so much), [see their License here](https://www.fesliyanstudios.com/policy).  
- - [Orange Free Sounds](https://orangefreesounds.com/), all used unter the [CC BY-NC 4.0 License](https://creativecommons.org/licenses/by-nc/4.0/), converted to *.ogg and possibly altered (see file name), Author is in the file names as well.  

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
Now here is the deal: The macro is aware of any core Edges and Special Abilities that can alter the unshake roll and *automatically* adjusts the roll. You can set up own ones as well by adding them to the `const edgeNames` object (inside the []); put them in '' and only use lower case. The macro requires you to set up Special Abilities like Undead as Edges or Abilities though, so keep that in mind. Also the macro currently does not add a +2 on a reroll if the token has Elan. *Keep in mind that only english Edge names are supported yet.*  
The macro is also aware of Snake Eyes (Critical Failure) and offers no use of a Benny when Snake Eyes occur. It does *not* check for Snake Eyes on Extras though.  
This macro comes in two variants: SWADE and SWD. I like the SWD rules regarding Shaken much better but the choice is yours. Here are the differences:  
**SWD:** To act this turn you need a raise, success removes Shaken but you may only act *next* turn. While Shaken your Pace is halved.  
**SWADE:** To act you'll only need a success.  

### (Un-)Stun
**Requirements:**  
- [Combat Utility Belt](https://foundryvtt.com/packages/combat-utility-belt/) for the status effects.

**Immersion setting:** SFX.  
**Suggested icon:** `modules/swim/assets/icons/status_markers/2-Stunned.png`  
**Description:**  
This macro is very similar to the (Un-)Shake macro but handles Stunned. If the selected token (needs one selected) is not Stunned, it will be marked as such, including all the effects that come with it. Otherwise it will roll to unstun and adds/removes conditions according to the result. It is aware of Snake Eyes. It supports SFX on applying Stunned in the same way as (Un-)Shake. **Important:** Set up the path to your prone image to the exact same path as your prone image in the modules setting.

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
<p align="center"> <img src="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/img/macros/Soaking%20Wounds.jpg?raw=true"> </p>  

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
<p align="center"> <img src="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/img/macros/Power%20Point%20Management.jpg?raw=true"> </p>  

### Personal Health Centre  
**Requirements:**
- [Health Estimate](https://foundryvtt.com/packages/healthEstimate/)
- [Combat Utility Belt](https://foundryvtt.com/packages/combat-utility-belt/) for the status effects.  

**Immersion setting:** SFX.  
**Description:**  
This macro is more or less the opposite of the Soak Damage macro. It offers functionality to remove wounds in a generic way (i.e. due to the Healing Skill or Power) and also a way to roll on Natural Healing, interpreting the results, removing wounds, offerring rerolls and is aware of Snake Eyes (adds another Wound or Inc.!). It supports Fast Healer and (on rerolls) Elan as well.  
It also supporst the Regeneration Special/Racial Ability but it must be set up as an Edge or Ability called "Fast Regeneration" or "Slow Regeneration". Then it adjusts the time that needs to be passed until a Natural Healing roll can be made. If your setting calls for longer or shorter periods of time until a Natural Healing roll can be made (Hellfrost comes to mind), then you can set this up in the modules settings.  
It uses the sfx for Wounds, Inc.! and Healing.  
The macro is also capable of removing Fatigue using a given number, which also supports a unique SFX.  
<p align="center"> <img src="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/img/macros/Personal%20Health%20Centre.jpg?raw=true"> </p>  

### Token Vision  
**Requirements:** None.  
**Immersion setting:** None yet.  
**Description:**  
This macro is based on a macro from [@Sky#9453](https://github.com/Sky-Captain-13/foundry) and supported DnD vision and lighting. I altered it to suit Savage Worlds. I have to say though, that information on vision and illumination is very lackluster in SWADE with regards to VTT software. It works fine on an actual tabletop but not with dynamic lighting on VTTs. I had to bring some personal taste in but I tried to stay as true to the rules as I could.  
The macro works different for players and GMs. For players it only shows options to equip light sources (activates them in the token settings), GMs are alos able to update the tokens vision. All options work for *all* tokens that are selected. Here are the options explained:
**Light Source:**  
- No Change: Does not change the current settings.
- None: Deactivates all emit light settings.
- Candle: 2" radius of bright light.  
- Lamp: 4" radius of bright light.  
- Bullseye: 4" beam of bright light with an angle of 52.5 degree.(1)  
- Torch: 4" radius of bright light.  
- Flashlight: 10" beam of bright light in an angle of 52.2 degrees.(1)  
**Vision Type:**  
- No Change: Does not change the current settings.  
- Pitch Darkness (0"): The token cannot see past itself.  
- Dark (10"): Token has dim vision of 10".  
- Dim: Token has dim vision of 1000" (the maximum allowed by Foundry).  
- Low Light Vision: As dim.  
- Infravision: As dim.  
- Full Night Vision: Token has bright vision of 1000" (the maximum allowed by Foundry).  
In general it is best to set up a universal/global light source instead of touching the vision type as that's what SWADE relies on. But the options are there in case the GM forgets to set it up and needs to act quickly.  
(1) These options also lock the token rotation because the core rules uses portrait style tokens. If you use top-down view tokens instead you may want to change that in the macros code.  

### Shuffle Action Deck  
**Requirements:** None.  
**Immersion setting:** System card deal sound.  
**Description:**  
A very basic macro that resets the roll table from which the action cards are drawn. It's mainly there to fix issues when the table doesn't reset during combat.  

### Raise Calculator & Raise Calculator (Dynamic)  
**Requirements:** None.  
**Immersion setting:** None.  
**Description:**  
Two rather simple macros to calculate Raises inside Foundry. The first one offers a Dialogue and gives a Notification with your amount of Raises. The Dynamic one is more usable in my opinion. It changes the amount of Raises dynamically, depending on your input. Whenever you change and leave (click anywhere else) the result input box the text below is adjusted and will show you the amount of raises. It does not have a button because a button isn't needed. You could keep this one open at all times and change the values whenever you want.  
Below are screenshots from the dynamic version:  
<p align="center"> <img src="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/img/macros/Raise%20Calculator%201.jpg?raw=true"> <img src="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/img/macros/Raise%20Calculator%202.jpg?raw=true"> </p>   
<p align="center"> <img src="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/img/macros/Raise%20Calculator%203.jpg?raw=true"> <img src="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/img/macros/Raise%20Calculator%204.jpg?raw=true"> </p>   

### Ability Converter  
**Requirements:** SWADE 0.17.0 and above.  
**Immersion setting:** None.  
**Description:**  
**Use this at your own risk!**  
This is a utility macro not intended to be used a) by the players and b) regularly. It's basically a one time thing. If you've already set up Special Abilities as Edges and Hindrances this will help you convert them:  
1. **Crate a backup of your entire world.**  
2. Create a folder containing all Special Abilities, nothing else and no sub-folders.  
3. Run the macro.  
4. Read the insctructions carefully and enter the folders name.  
5. Click "Process." and Wait for the message stating the converter is done. (**Do not shut down/reload your world!** Best do nothing at all while the converter is doing its thing.)  
6. Reload your World (F5 on PC).  
This converts everything in the folder and all of those on your actors (world only, not in compendiums). And only those in the folder. You'll have to go through your actors and convert those Abilities manually that are not in your folder. This means it will not cover things like `Weakness (Fire)` unless you've set them all up. But it should still help you reduce your work by some degree.  
**Warning:** This is a dangerous macro and might break your actors. I'm not kidding about the backup, **create one!** Seriously, do it. I had to restore my world multiple times during the testing, just make a damn backup please. (Which is why it isn't included in the compendium.) And don't blame anyone if the macro destroys something, neither I, nor `Kristian Serrano#5077` (the author of the macro) will take responsibility for any broken stuff, use at your own risk.  