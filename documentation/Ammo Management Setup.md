# Acknowledgement  
This macro is actually several macros with one goal: To completely overhaul the ammo usage of the core system by introducing new features, a way to handle grenades and other consumable weapons, sound effects and more. It even supports ammo for melee weapons.  
In order to use one of these macros, you first need to do some initial setup. This is required because the macro relies heavily on additional stats from the SWADE system. Currently these must be provided by the user but hopefully I can provide them with the module itself.  

## Current Features:
- Reduces amount of current `Shots` in the weapon, d'oh!.  
- Does not need to be set up for each weapon, one macro to rule them all.  
- Reloads a weapon at will.  
- - Supports different kinds of ammo (i.e. "Bullets, Large"; "Bullets, Large (AP)"; "Bullets, Large (Hollow Point)" and so on).  
- - Stores information about currently loaded ammo in the weapon itself.  
- - Supports reloading the weapon with another kind of ammo at will (will give back the remaining ammo in the weapon).  
- - Ammo must be set up as a `gear` type item.
- - Using the last amount of the ammo item will **not** delete the item from the inventory because one might want to swap ammo later.  
- - Offers a way to only load a single bullet instead of the entire weapon (i.e. for revolvers).  
- Supports weapons that do not require a reload action (i.e. bows).  
- - Such weapons must be marked (system offers this by default).
- - Such weapon *must not* have Shots of anything other than `0`. So put `0` in both Shots fields on the weapon.  
- - Such weapons use the ammo from the inventory instead of the one on the weapon.  
- - The Ammo Management (enhanced) macro will always use the ammo given in the selection of the dialogue.  
- - Since BR2 does not open the dialogue, the BR2 integration *requires* the user to set up the `Loaded Ammo` additional stat (see below). The macro will then always use the ammo which is present in this field. For changing ammo just use the reload option of the Ammo Management (enhanced) macro and it'll set up the chosen ammo in that field without doing anything else.  
- Support for `Charge Packs` (i.e. batteries, gas tanks, ghost rock etc.):  
- - One `Charge Pack` will reload all current `Shots` in a weapon.  
- - Remaining `Shots` on weapons are lost upon reloading with a `Charge Pack`.  
- - If you change from one `Charge Pack` to another (for changing ammo types), it only refills the old ammo if the current shots are equal the maximum shots in the weapon, otherwise remaining shots are lost as there is no way to track remaining shots on Charge Packs. This makes it somewhat possible to use Charge Packs as magazines but Players will then always *throw away* magazines which are not full. This is very unlikely to be ever changed as it would conflict with the way Charge Packs were intended (they shall always reload the entire weapon, no matter the max charges of a weapon, so storing remaining charges on Charge Packs is not an option).  
- - `Charge Pack` ammo will always overwrite the single bullet reload (see above) as they are intended to always reload the entire *magazine*.  
- Support for `Consumable Weapons` (i.e. throwing knives, grenades, Spears, etc.).  
- - The Macro will ignore current and maximum `Shots` on `Consumable Weapons` and instead uses their `Quantity` as a measurement of how many are left.  
- - Using the last `Consumable Weapon` will delete the item from the inventory. (Disabled in BR2 integration because that breaks rerolls.)
- - BR2 integration only: Also supports weapons which can be thrown but don't need to. Currently it checks for "Athletics", "Athletics (Throwing)", "Athletics (Explosives)" and  "Throwing" and assumes that consumable weapons always use either. If a consumable weapon does not use any of these skills, the macro stops. If an action is used in BR2 that initiates a roll with one of these skills, the macro continues as usual.
- Extensive support for Sound Effects (sfx), the following sfx can be configured:  
- - Reload sfx.  
- - Shooting/using sfx.  
- - Autofire sfx.  
- - Silenced shooting sfx.  
- - Silenced autofire sfx.  
- - Empty sfx (when the current `shots` are exactly zero).  
- - A sound effect for "burst" is planned but not yet done.  
- Each sfx can be set up individually for each weapon.  
- Optional integration for [Better Rolls 2 (BR2)](https://foundryvtt.com/packages/betterrolls-swade2).
- Now also features the ability to play SFX only without the need for ammunition. For this just set the Ammo on the weapon to be `NONE` (exactly like this). This may be useful if you want SFX for melee weapons. It uses the same sfx path structure (see below), so you'll have the same sfx for melee and ranged attacks unfortunately.  

# Additional Stats  
If you don't know about additional stats, you can read about them [here](https://gitlab.com/peginc/swade/-/wikis/settings/setting-configurator).  

## Setup of Additional Stats  
Head to the System Settings, click on the "Open Setting Configurator button and scroll down. You can create additional stats for items there. The screenshot below shows the stats you need to create. The "Stat Key", "Data Type" and "Has Max Value" must be set up exactly like in the Screenshot. Only the "Label" may be different.  
<p align="center"> <img src="https://raw.githubusercontent.com/SalieriC/SWADE-Immersive-Macros/main/img/BR2_integration/shooting_additional-stats.jpg"> </p>  
Don't forget to save when you're done.  
## Explanation  
Here is an explanation on what each of these do. Read it carefully as it will tell you on which items these need to be set up.  
- "isPack" (ammo items): Marks an items as a charge pack. If a weapon uses this as ammunition, it will only use *one quantity* of the ammo to reload the entire weapon; remaining shots are lost upon reloading or changing the ammo type. This is something like a battery or gas tank.  
- "loadedAmmo" (weapons): This shows which ammo is currently loaded in the weapons magazine or the like. It is important for the macro to know what ammo type is currently loaded in the weapon, when changin the ammo type. The macro can then put remaining shots back in the quantity of the previously loaded ammo unless it's a charge pack).  
- "isConsumable" (consumable weapons): Consumable weapons are most commonly thrown weapons like daggers, knives, grenades, spears and the like. This stat will tell the macro that it shall reduce the *quantity* of the weapon, instead of the shots (this is important because of the carry weight calculation, which doesn't work with the shots stats of weapons).  
- "sfx" (weapons): Here you can set up all the sfx of a weapon. See below for further details.  
- "silenced" (weapons): Some weapons may be equipped with a suppressor. You only need to activate this on weapons which can be equipped with a suppressor. If the checkbox is checked on a weapon, the macro uses another sound effect if set up on the "sfx" stat.  

## The sfx stat  
This is a tricky one, please read carefully:  
Here you can set up all the sound effects you want in a weapon, seperated by pipe/bar, this is a vertical line and looks like this: |  
The fact that there are multiple sound effects in a single stat makes it rather crowded and hard to read for the user but it is the best solution I came up with which I can do as of yet.  
Here is a sample which shows the correct order of the sound effects:  
`RELOAD|FIRE|AUTOFIRE|SILENCED|SILENCEDAUTOFIRE|EMPTY`  
I suggest to use this template and populate it with the relative file paths of your sound effects one at a time. The macro will **not** fail if one sound isn't given. You may just leave the default in the template or type "NULL" or something in it. If you want no sounds at all, just leave it empty or don't activate the additional stat at all.  
- RELOAD: The sfx to be played on reloading the weapon.  
- FIRE: The sfx to be played on firing the weapon.  
- AUTOFIRE: This is for automatic guns. Whenever 5 or more bullets are spent, it will use this sound.  
- SILENCED: This is used if the "silenced" stat is checked instead of the regular FIRE sound.  
- SILENCEDAUTOFIRE: Same as above but played when 5 or more bullets are spent.  
- EMPTY: This sound is played when the weapon is empty and the player tries to fire it anyway.  
Note that currently no three round burst sfx is supported. Doing this would mean introducing two more variables (burst and burst for suppressed weapons). I thought this would be a bit too much. Let me know if you really need it.  
One of the easiest things to do to get the relative file paths of your weapon sounds is adding them to playlists and then just copy the file path from there into the template.  

# Ammunition  
The core system currently supports this stat on a weapon but unfortunately it is not shown until you activate the ammo management of the system. But we want to not use the systems default ammo management. I've created a request to also show it when ammo management is disabled. For now we need a workaround though. Fortunately, there is one:  

## Setting up ammunition  
Head to the System Settings, click on the "Open Setting Configurator button and find the checkbox for "Ammunition Management". Check it.  
Now open all your weapon items that use ammunition and click on their "Actions & Effects" tab. You'll find a row called "Ammunition" there. Populate it with the **exact** names of the ammunition items this weapon shall use. I can't stress enough that the names must be **exact**. Double check this.  
You can actually set up multiple ammunition types for each weapon. To do so, just seperate them with pipe/bar as with the sfx stat above. Here is an example:  
`Bullets, Large|Bullets, Large (AP)|Bullets, Large (Hollow Point)`  
Don't use spaces unless the ammo items contain them. If the weapon uses only one ammo type, just enter the **exact** name and forget about the `|`. Ammo items must be of type `gear`.  
You may also set up ammunition for melee weapons if they use any. Examples inglude the Gunblade from Final Fantasy VIII or the Shishkebab from Fallout. Or a simple ol' chainsaw. You **must not** enter ammunition for melee weapons, those must be marked as consumable weapons (see above), the macro will then use their quantity instead of shots and ammo.  
When you're done head back to the System Settings, click on the "Open Setting Configurator button and find the checkbox for "Ammunition Management" once again. Uncheck it. This will disable the systems ammo management but unfortunately also hide the "Ammunition" row. Don't worry though, the stat is still stored in the item including whatever you've just entered. The only downside to this workaround is that you can't quickly edit the accepted ammo, so **double check** for **exact** names. You can always activate the Ammunition Management option in the settings to make changes though.  

## Using Better Rolls 2 as a workaround  
If you're using [Better Rolls 2 (BR2)](https://foundryvtt.com/packages/betterrolls-swade2), you have another workaropund at your disposal: Leave the Ammunition Management enabled in the settings and disable the option "Subtrackt ammo by default" in the Better Rolls 2 module configuration. As long as the players don't use the systems default rolls you'll be fine.  
For BR2 users there is also a neat integration, allowing you to use the Shooting macro by default when rolling from a weapon.  

# Better Rolls 2 integration  
If you're using Better Rolls 2, there is a way to fully automate the Shooting part of the macro. Each skill roll from the weapon will then execute the macro, play the sfx (if set up) and use the ammo properly. To set this up you need to set it as a "runSkillMacro" [Global Action](https://github.com/javierriveracastro/betteroll-swade/blob/version_2/GLOBAL_ACTIONS.md) in Better Rolls 2. Before using this though, *make sure to disable the ammo management by BR2* (see above). This is not so difficult as you might think:  
1. Import the macro `SWIM: Ammo usage` from the compendium into your world.  
2. Head over to your module settings and click on "World Global actions" in the BR2 settings.  
3. Click "New action".  
4. Paste the code from [this file (Shooting)](https://raw.githubusercontent.com/SalieriC/SWADE-Immersive-Macros/main/swim/assets/imports/BR2-shooting-integration.json) into the text box.  
5. Save.  
6. Repeat steps 3-5 for the following skills if you wish:  
- [Fighting](https://raw.githubusercontent.com/SalieriC/SWADE-Immersive-Macros/main/swim/assets/imports/BR2-fighting-integration.json)  
- [Athletics](https://raw.githubusercontent.com/SalieriC/SWADE-Immersive-Macros/main/swim/assets/imports/BR2-athletics-integration.json)  
- [Untrained](https://raw.githubusercontent.com/SalieriC/SWADE-Immersive-Macros/main/swim/assets/imports/BR2-untrained-integration.json)  

That is all there is to it. Now, whenever a *Shooting*, *Fighting*, *Athletics* or *Untrained* roll is initiated from a weapon card, the macro will execute and - if it detects circumstances which require it to do its thing - uses the ammo.  If you have no melee weapons which use ammo, don't use the integration for Fighting, it'll cause more harm than good then.

## Disabling the BR2 integrated ammo management button  
This is a bonus for any overachiever out there. This can't be done manually and requires a little bit of coding.  
1. Locate your `betterrolls-swade2` folder in your foundry `data/modules` folder.  
2. Open the `templates` folder and locate the `item_card.html`.  
3. Open it with a decent text editor. Notepad++ works but any IDE (if you have one) works better.  
4. Replace `{{# if ammo }}<div class="brws-attribute-buttons">` with `<!--{{# if ammo }}<div class="brws-attribute-buttons">`.  
6. Replace `</div>{{/if}}` nine lines below with `</div>{{/if}}-->`.  

This will disable the ammo management button from BR2 in the item cards, preventing your players from accidentally using it.  

## Current problems and limitations  
~~Currently the macro just guesses the amount of ammo used based on the amount of trait dice. This is prone to errors of course as it will not get the correct amount of shots used for Burst Fire mode, Double Tap and Fanning the Hammer (Deadlands). In these cases I advice to disable the `SWIM: Ammo usage` action in the BR2 chat card before rolling. This issue will hopefully be resolved soon but depends on Better Rolls 2 as the chat card currently does not include the amount of shots the macro can use for proper calculations.~~  
Has been fixed with BR2 versions **above** 2.36.  

~~Due to current limitations the BR2 integration can also not yet detect wether or not a melee weapon was thrown. This means the macro will fire off all the time if a melee weapon is marked as a consumable weapon but used in melee combat. There are three workarounds, from best to worst:  
1. Instruct your players to disable the `SWIM: Ammo usage` action in the BR2 chat card before rolling on these specific weapons.  
2. Set up extra variants of these weapons for thrown purposes.  
3. Don't use the BR2 integration for Fighting and Athletics (not so great).  

I hope that this issue will be resolved as well once the BR2 chat card includes the amount of ammo used but I'm not sure. I do work on another solution but it seems out of reach anytime soon as well.~~  
The macro now supports a workaround for this by filtering for the used skill. Not a perfect solution but the best that is possible yet.  
