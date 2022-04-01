# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]  
### Added
- Free Reroll to the Radiation Centre macro if the Soldier Edge is found.
- Added warnings to some functions to install Helath Estimate if it is not installed.
- Localisation for Edges and Abilities.  
- Added Coup (50 Fathoms) to the benny checker.
- Added SFX to execute when BR2 sends the unshake hook.
- Added SFX player to the API.
- Added default volume option to the settings.
- Mighty Summoner macro that summons a creature selected by the user.  
- Soak Damage now allows for Incapacitation rolls and applies appropriate injuries.
- Heal Wounds and remove fatigue for non-owned tokens/actors in the Personal Health Centre (PHC).
- PHC now removes combat injuries and those from Incapacitation (unless they are permanent).
- PHC now removes Bleeding Out and Incapacitation before Wounds.
- PHC now removes the Health Estimate flag if Incapacitated is removed.
- Shape Changer now copies the permission settings from the original actor to give the player owner permissions.
### Changed
- Refactored the shape changer script to a few less lines (@pmoore603).
- Shape changer now makes the newly created actor the same `type` as the original. This means that PCs will change into PCs and NPCs will change into NPCs, no matter what the preset type is. This is important for the Joker's Wild setting rule to work properly.
### Fixed
- Radiation Centre will now inform about Benny use.
- Small update fix in shape changer that will hopefully update the combat.
- Combat injuries were not properly applied in soak damage.
- A bug that caused the PHC to break because of a faulty setting string.
- A leftover variable declaration in the shape changer caused it to fail when trying to play the VFX if executed by a non-GM.
- Fixed missing variable exception error when shape changing (@pmoore603).
- Shape changer now adds elevation of the original token to the newly created token (thanks @pmoore603 for spotting this).
- Shape changer now creates the new actor in the proper folder even if executed by non-GM.
- Shape changer dialogue now gets the proper div class.

## [0.15.0] - 2022-03-18
### Added  
- A full-fledged, all-new API the module makes much use of now. Thanks to honeybadger#2614 for the suport on setting it up.  
- Finally an auto-updateable BR2 Ammo Management macro. You'll need to import it from the BR2 folder inside the SWIM compendium into your world (or just copy and paste the one line of code to the macro you already have) and you're set, no need to manually update it ever again (hopefully).  
- A documentation for the new API.
- A new configuration menu with tabs (made by @javierriveracastro).  
- Default options for the chase setup.
### Changed
- **BREAKING:** Due to changes in Foundry VTT core all script macros had to be pulled out of the compendium and are now maintained as .js files in the module itself. As a Result, *all auto-update macros became unusable*. You need to import the new auto-update macros in your world (and delete the old ones), then you'll be set up for the future. This time for good (hopefully).  
- More options on laying out cards for other chase scenes (made by @pmoore603).  
- Shape Changer now adds the new token (the target of the shape shift) up in the combat tracker.  
### Fixed
- Players were unable to execute the macros due to permission enforcement changes in FVTT core. This is fixed via the aboce change.  
- Players are now able to use the Shape Changer macro. Before it was GM only because of permission issues. Now it relays the script to the GM.  
### Removed
- Deprecated all the standard macros. They are still available for reference on the repo but won't be maintained anymore. The core features are integrated into the module now and others may follow.  

## [0.14.1] - 2022-03-06  
### Added
- Stealth added as a Skill for Consumable Weapons in the BR2 Ammo Management macro.  
### Fixed  
- Fixed a bug in the (Un-)Shake and Soak Damage macros where they were still using the old way of toggling the status which caused the status to not be toggled properly.
- Fixed a bug in the BR2 ammo usage macro that caused it to not get the ammo without te loaded ammo additional stat.
- Fixed a bug that made the Unshake macro non-functional.
- Fixed a bug that prevented installing the module.  

## [0.14.0] - 2022-02-15  
### Added  
- [SUCC](https://github.com/SalieriC/SUCC) dependency. SWADE v.1+ handles conditions inherently different from the way they were handled before, thus making CUB not viable any longer. Since CUB will likely take a long time until it is compatible with SWADE once again, I have teamed up with Javier again to create SUCC which works similar to CUBs Enhanced Conditions but it built for SWADE and thus requires less setup.
- A new setting to register the Irradiated Condition.
- Hijacked (or rather: replaced) the SWADE systems "Clear Chase" button and added the Chase Layout Manager instead. Make sure to only use it on one of the chase layout scenes. Nothing bad will happen otherwise but the macro may not place the cards as expected.
- Added a compendium with a chase deck roll table and a compendium with the cards for that table since SWADE is going to remove the compendium with the images.
### Removed
- CUB dependency. Please disable CUB in your world and use [SUCC](https://github.com/SalieriC/SUCC) instead to continue using SWIM.
- All the condition icons as they are now in SUCC.
- CUB imports as they are of no use now.
- CUB setup documentation as it is not needed anymore.
- Removed SWADE Systems chase button from the left scene controls.
### Fixed  
- A bug in the shape changer macro that could cause issues when updating skills.  
- A bug in the shape changer macro that caused players not showing all their options to shift into in creature form.
- Fixed a bug in the Deviation Macro, that made it non-functional.
### Changed  
- Changed the way token size settings are applied in the shape changer macro to reduce load and thus improve performance.  
- Changed the macros to use [SUCC](https://github.com/SalieriC/SUCC) rather than CUB for handling conditions.
- Changed the check for the Irradiated condition in the radiation centre macro from CUB to SUCC and added a dialogue for GMs to activate it from the macro itself.
- Changed the license of the chase layouts. They may *not* be redistributed under any circumstances.

## [0.13.0] - 2022-01-21  
### Added
- Function to test for crit fails in the swim class, to make it centrally available for all macros.  
- Shape Changer Macro which does everything for you, you just need to set up some presets the players can shape shift into.  
### Fixed  
- Fixes a bug with duplicate chat messages in the (Un-)Shake Macros.  
- Fixed showing an npc as crit failing when it rolled a single 1. 
### Changed  
- Set all compendiums from SWIM to be hidden from players by default.  
### Known Issues  
- Shape Changer Macro does not update permissions on the duplicate actor. This currently cannot be changed due to limitations in Foundry core.  
- Shape Changer Macro does not delete powers on the presets yet.  

## [0.12.3] - 2022-01-16  
### Fixed  
- Fixes a bug with faulty libWrapper dependency.
  
## [0.12.2] - 2022-01-15  
### Added
- Added "Amorphous" (The After) to the (Un-)Shake macros.
### Fixed
- Added the dependencies to the manifest and added a warning to the init hook if they are not present.
- Also added libWrapper, not required by SWIM itself but by compendium-folders so I stuck it in there because FVTT doesn't check dependencies of dependencies.

## [0.12.1] - 2021-12-27  
### You need to update these macros:  
- None, unless you're still using the script macros ([see releases notes to 0.10.1](https://github.com/SalieriC/SWADE-Immersive-Macros/releases/tag/v.0.10.1)).  
- - Seriously, if you've not done so yet, do so now. This is the last major release this message will be shown.  
### Added  
- Gritty Damage (Soak Damage macro) now applies the appropriate Active Effects. Since I am not including a table for this and had issues with the sub-tables, it searches the table results text for words it can allocate to an AE. Thus it is important to use either the original table or include those words in your own table (case insensitive): "unmentionables", "arm", "leg", "guts", "broken", "battered", "busted", "head", "hideous scar", "blinded" and "brain". Do *not* use any of these words in other table results.  
### Changed  
- Soak Damage macro now doesn't exclude the GM from applying Gritty Damage any longer. Instead it only applies them to PCs by default. You can activate Gritty Damage for NPCs in the modules settings though.  

## [0.12.0] - 2021-12-17  
### You need to update these macros:  
- BR2 Ammo Usage  
- None other, unless you're still using the script macros ([see releases notes to 0.10.1](https://github.com/SalieriC/SWADE-Immersive-Macros/releases/tag/v.0.10.1)).  
- - Seriously, if you've not done so yet, do so now. This is the last major release this message will be shown.  
### Added  
- New game setting, allowing GMs to rule that NPCs do not use Ammo items from inventory. NPCs will still use Ammo in the weapon (magazines, clips, etc.) but won't require an item to draw ammo from. Instead they will just reload the weapon to the maximum shots (or by 1 shot if "Single Reload" is checked) without using an item from the inventory. This is especially useful for official modules which do not populate actors with ammunition, making prep for SWIM compatibility a little easier.  
- CUBs latest methods to apply status effects to the (Un-)Stun macro, making it a lot more stable and fixing a bug at the same time.  
- Radiation Centre macro. This macro rolls Vigor and applies Fatigue based on the result from radiation and is also able to apply Fatigue from radiation directly. It makes use of a new status called "Irradiated". An optional additional stat "Radiation Resistance" with the key "radRes" can be added to actors to provide a direct modifier to the roll, useful for settings which make heavy use of Radiation. The additional stat does not need to be set up in order for the macro to function.  
- "Irradiated" status added to the CUB mapping file in the module.  
### Fixed  
- Deprecation warnings, should be compatible with Foundry VTT v9 now. Let me know if I missed something.  
- (Un-)Stun macro adding a new prone status.  
### Removed  
- Prone image game setting, as it is no longer needed with the changes in CUB. The (Un-)Stun macro will now apply the prone status directly, instead of the icon. The macro will also check if the status is set up and throw a warning if not.  
- Removed Sprawlrunners CSS usage on the Falling Damage macro as it doesn't work well in the chat message.  
### Known issues  
- There are a couple of deprecation warnings caused when executing some macros which actually come from CUB. This is due to the fact that CUB has not been updated to v9 yet and will likely cause issues on v9 because of that. This is nothing I can change right now. Wait until CUB has been updated before updating to FVTT v9.  

## [0.11.0] - 2021-12-05  
### You need to update these macros:  
- None, unless you're still using the script macros ([see releases notes to 0.10.1](https://github.com/SalieriC/SWADE-Immersive-Macros/releases/tag/v.0.10.1)).  
### Added  
- **Falling Damage Macro.** It supports all options from the core rules and rolls for each selected and targeted token individually. Dialogue CSS credit: Kyane von Schnitzel#8654. The macros chat message uses the CSS of the activated core module (if any), supported are SWADE, Deadlands, Sprawlrunners and Pathfinder. It works without these modules as well though.  
**Bounty Notice:** I have very limited time atm. Everyone who creates merge requests with (working) updates to the macros which respect changes from Foundry version 9 (and thus gets rid of the warnings in the console) will receive a reward in the form of a free, high quality Battle Map. You may choose from one of these settings: Medieval Fantasy, Western or Pirates. A merge request covering three or more macros (that have not yet been covered) will be rewarded with an export of the selected map, set up with walls, lights and everything. The first merge request that covers *all* macros and works will be rewarded with a custom made battle map made after *your* specifications (within a reasonable degree of detail).  

## [0.10.3] - 2021-11-16  
### You need to update these macros:  
- None, unless you're still using the script macros ([see releases notes to 0.10.1](https://github.com/SalieriC/SWADE-Immersive-Macros/releases/tag/v.0.10.1)).  
### Fixed  
- The chat message of Soak Wounds now shows the systems benny image.  
### Added  
- The two Unshake macros now utilise the actors `data.attributes.spirit.unShakeBonus` data. As of yet, the system does not support this but the bonus is added in case a script changed it on an actor. It also checks all Active Effects on the actor for this and applies the modifier individually if the AE is active, making it finally possible to affect the Unschake macro with AEs (and thus items that use AEs to affect unshake).  
**Warning:** Do *not* use an AE to set the `data.attributes.spirit.unShakeBonus` for Edges that are already covered by the Unshake macors, otherwise the bonus will be added twice.  

## [0.10.2] - 2021-11-15  
### You need to update these macros:  
- None, unless you're still using the script macros (see previous releases notes).  
### Fixed  
- Fixed a bug in data structure resulting in not getting owned potions in the Personal Health Centre macro.  
- Fixed a minor bug that resulted in not waiting for the drinking sound before the next sfx.  
### Changed (**Breaking**)  
- Changed the setup for Potion names from comma-space seperated (', ') to pipe seperated ('|'). You need to adjust the settings manually if you're already using SWIM, otherwise the macro will not find the potions. This was done to make comma useable in potion names for better sorting (i.e. `Healing Potion, lesser`). So a string like "Healing Potion, Greater Healing Potion" now needs to be changed to "Healing Potion|Greater Healing Potion".  

## [0.10.1] - 2021-11-11  
### You need to update these macros:  
- **All of them.** (Now featuring: Automatic updates, see below.)  
### Fixed  
- Mark dead now gets the correct SFX from the actor.  
- Mark dead and Soak Damage updated to obey the current flag use for marking a token as dead of Health Estimate.  
### Added  
- Automatic updates for macros by using dummy macros that just call the original. From now on, use all the macors in the compendiums "User Macros (use these)" folder. The other folder contains the script macros which you don't need anymore.  
- - If you're using the BR2 Macros for handling ammo and power sfx you need to copy those into your world as usual. I'm, working on a solution for this as well but haven't found one yet.  

## [0.10.0] - 2021-10-31  
**Note:** From my testing this is compatible with Foundry 0.8.x but - as usual with software development - problems may occur. Please report them on this repo as usual.  
**Bounty Notice:** I have very limited time atm. Everyone who creates merge requests with (working) updates to the macros which respect changes from Foundry version 9 (and thus gets rid of the warnings in the console) will receive a reward in the form of a free, high quality Battle Map. You may choose from one of these settings: Medieval Fantasy, Western or Pirates. A merge request covering three or more macros (that have not yet been covered) will be rewarded with an export of the selected map, set up with walls, lights and everything. The first merge request that covers *all* macros and works will be rewarded with a custom made battle map made after *your* specifications (within a reasonable degree of detail).  
### You need to update these macros:  
- SWIM: Ammo Management  
- (Un-)Shake (both)  
- (Un-)Stun  
- Ammo Management (enhanced)  
- Mark Dead  
- Soak Damage  
- Spend Benny
- Chase Setup  
### New Macros:  
- Loot-o-Mat (see ReadMe)  
### Added
- Support for the *weaken undead* power (Hellfrost) in the Unshake (SWD) macro that disables the +2 bonus if the token is undead but has an active effect called "Undead" that is disabled.  
- Support for actor specific shaken and unshake sfx.  
- The macros now use the Benny image configured in the system.  
- Ammo Management now supports attack sounds for regular, frenzy and improved frenzy attacks, this requires the Ammo field to contain "MELEE".  
### Fixed  
- Fixed a bug that sometimes prevented a second shot sfx to be played in the BR2 integration.  

## [0.9.0] - 2021-07-05  
**Possibly** compatible with Foundry 0.8.x but I can't say for sure.  
### You need to update these macros:  
- Ammo Management (enhanced)  
- SWIM: Ammo Management  
### Added  
- Now also features the ability to play SFX only without the need for ammunition. For this just set the Ammo on the weapon to be `NONE` (exactly like this). This may be useful if you want SFX for melee weapons. It uses the same sfx path structure (see below), so you'll have the same sfx for melee and ranged attacks unfortunately.   
- Chase Setup macro for a quick setup that takes only a click. Also supports cleaning the table.  
- Six chase layouts, one for foot/riding chases, one for (ground) vehicle chases and one for ship (watercraft, aircraft and spacecraft) chases/battles with regular and modern theme each. See the [Chase Scenes documentation](https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/documentation/Chase%20Scenes.md) for details.  
- Immersion macro to play SFX when using powers in BR2. It does not manage Power Points, just plays a sound effect when using a power.  
### Fixed  
- Fixed the BR2 integration .json files. Now it isn't neccessary any longer to set up a World Global Action for each skill, the integration will trigger whenever a weapon or power is rolled on, no matter the skill, even untrained.  

## [0.8.0] - 2021-07-01
**Possibly** compatible with Foundry 0.8.x but I can't say for sure.  
### You need to update these macros:  
- (Un-)Stun  
- Ammo Management (enhanced)  
- SWIM: Ammo Management  
### Added  
- Ammo Management: Now supports Weapons that do not require a reload action (i.e. bows).  
- Ammo Management: Now offers a way to only reload a single bullet instead of reloading the entire weapon. This is especially useful for revolvers and such.  
- Ammo Management: Charge Packs can now change the ammo type but old Charge Packs are only refilled if the weapons current shots are equal the maximum shots as there is no way to track remaining charges on a Charge Pack.  
- Ammo Management (BR2 integration only): Now supports weapons which *may* be thrown but don't need to. It filters for a set of Skills and only applies ammo usage if such skills are found. See the [documentation on Ammo Management](https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/documentation/Ammo%20Management%20Setup.md) for further details.  
- BR2 integration for ammo management now gets the correct amount of shots from BR2 (requires [Better Rolls 2 (BR2)](https://foundryvtt.com/packages/betterrolls-swade2) **greater** than version 2.36.).  

## [0.7.0] - 2021-05-29  
### You need to update these macros:  
- All of them.  
### Fixed  
- All Macros that became broken due to the Foundry Version 0.7.10
- Fixed a bug in the Unshake (SWADE) macro that removed Shaken on a Failure.  
### Added  
- Reload and Reload (enhanced) macro.  
- BR2 integration for Shooting action.  
- Scale calculator macro, thanks @brunocalado.  
- Deviation macro, thanks @brunocalado.  
- (Un-)Stun now also applies Elan bonus on rerolls if the selected token has that edge.  
## VERY IMPORTANT:  
Most of these macros cannot be used as they are, reading the [ReadMe](https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/README.md) is **mandatory**!  
If you want to use the new Ammo Managemenet, make sure to read the [Documentation on Ammo Management](https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/documentation/Ammo%20Management%20Setup.md) as well!  
I can't stress enough how important it is to do so. *Do not blame me, if something goes sideways if you haven't read and followed the steps outlined there!*  

## [0.6.1] - 2021-03-10
### You need to update these macros:
- Spend Benny
- (Un-)Shake (both versions)
- (Un-)Stun
- Personal Health Centre
- Power Point Management
- Soak Damage
### Fixed
- Removed the border of images in chat messages.
- Fixed a breaking bug that caused the module to not work if SWADE Spices & Flavours was not installed (thx @Khitan#9089 for bringing it to my attention).

## [0.6.0] - 2021-03-10
### You need to update these macros:
- (Un-)Stunned
- Personal Health Centre
### Added
- RollTable importer macro.
- Cure Fatigue and Healing Potion options added to the Personal Health Centre macro.
- - Drinking a potion reduces its quantity. If it was the last it gets removed.
- - Drinking a potion has its own sfx (configurable in the settings).
- - Potion names can be configures in the modules settings. Must be **exact** names (also case sensitive) and seperated by `, `.
- Added a drinking sfx to the assets.
### Fixed
- Unstun chat message on spending a Benny was giving false information.

## [0.5.0] - 2021-03-08
### You need to update these macros:
- (Un-)Shake (both versions)
- (Un-)Stun
- Fear Table
- Personal Health Centre
- Power Point Management
- Soak Damage
- Token Vision
- Raise Calculator (both versions)
### Added
- Raise Calculator (Dynamic) now accessible from the basic controls on the left side.
- Default Buttons to most dialogues (where it makes sense).
- Added autofocus to input fields in dialogues (where it makes sense).
- Added autoselection of input content when rendering a dialogue as well es on selecting the input to reduce the amount of mouse usage needed to operate the macros.
- Documentation on how to set up CUB.
### Changed
- The Dynamic version of the Raise Calculator now changes the output on typing (even more dynamically), thus the Result input doesn't need to loose focus anymore.
### Fixed
- Token Vision Makro was not working for non GM users.

## [0.4.0] - 2021-03-07
### You need to update these macros:
None.  
### Added
- **Macro:** Raise Calculator
- **Macro:** Raise Calculator (Dynamic)

## [0.3.0] - 2021-03-03
### You need to update these macros:
- (Un-)Shake (both versions)
- (Un-)Stun
- Personal Health Centre
- Soak Damage
### Added
- Support for Special Abilities
- Ability Converter macro (**read the ReadME!**)
- Thick Fur (Saga of the Goblin Horde) for +2 Soak Rolls in the Soak Damage macro.
### Fixed
- Minor bug that caused some macros to not display all included Edges in the results chat message (thanks javierrivera#4813 for spotting that).

## [0.2.0] - 2021-02-26
### You need to update these macros:
- Personal Health Centre.
- Soak Damage.
### Added
- Added a male *huh* sfx for removing Fatigue (and healing for now).
- Added a heartbeat sfx for Inc.!
- Added a checkbox to activate Gritty Damage.
### Changed
- Injury Table is now independent of Gritty Damage.
### Fixed
- Fixed a typo that caused the injury table localisation to not show.
- Fixed Personal Health Centre playing sound even if no wounds were healed.
- Fixed Personal Health Centre showing a message reading that wounds will be removed even if no wounds were healed.

## [0.1.0] - 2021-02-24
### Added
- Initial Release
