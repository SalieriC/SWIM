# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
