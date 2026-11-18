# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
☮️ Peace in the world, or the world in pieces. 🕊️

## [3.0.0]
### Added
- Added an illusion actor to be summoned using the Mighty Summoner. This actor serves both as a template for GMs and as an actual illusion to be summoned when using the Illusion power.
- Added macro variable support for Effect Builder (EB), Mighty Summoner (MS), Personal Health Centre (PHC) and Shape Changer (SC).
- - To use any of these as macro actions on items you can use the macro UUIDs from the compendium (recommended) or from the world (I strongly advise against that option unless you know what you're doing).
- - You should also import these macros into your world anew, just in case. But if you use the UUID of the compendium ones this is not strictly necessary.
- - Set the actor option in the action to `Self`, **this is very important!** This way the macro always knows who the caster is.
- - The MS, PHC and SC will then use the passed token as the caster, instead of the selected token.
- - The EB will additionally know which power was used and select this power for you. (This only works with proper default SWIDs on the power items.)
- - All of the former functionality should be accessible if you keep using what you have and/or not using item actions.
- - This change allowed me to set the duration of the *zombie* power to one hour. It only works if executed from the chat card and the items swid is 'zombie' though.
- Added an option for the *light* power in the EB. This requires [Active Token Effects](https://github.com/kandashi/Active-Token-Lighting) by Kandashi to function. The module is optional however, without it the AE won't have any effect.
- Added socketlib and Portal as requirements.
- Added the API call `swim.migrate_world()` (GM only). It migrates the SWIM data of all actors and items in the world in one go. Please make a backup first. Compendiums are not covered.
- Added a setting for the Geiger Counter SFX played by the Radiation Centre (SWIM Configuration > SFX & VFX Options). Leave it empty for no sound.
- Added support for SWADE consumables as potions in the Personal Health Centre (uses one charge per potion). Regular gear items work as before.
- Added sound effects for Shaken, Stunned, Incapacitated / Bleeding Out / Dead, Wounds and Fatigue that play whenever these change, no matter how (SWIM macros, Better Rolls 2, the SWADE damage dialog, the character sheet or other modules). Sounds of the same actor that happen at the same time are merged into one.
- Added a notice if no GM is connected when a macro needs the GM (e.g. Heal Other, Shape Changer, Summoner), instead of failing silently.
- Added a clear error message for players if the Shape Changer has no presets they can see, and if the Mighty Summoner is used without the *Create Tokens* permission.
- Added a line to the SWIM config window that shows the currently effective value if an Active Effect changes a setting (e.g. Radiation Resistance).
- Added validation of all requests that players send to the GM (socketlib). A player can only trigger these for actors they own.
- Added a new selection dialog for the Mighty Summoner and the Shape Changer: a filterable list of cards (image, name, Size, Pace, Parry, Toughness) grouped by the rank required for the creature's Size.
- - Novice: Size -4 to -1, Seasoned: Size 0, Veteran: Size 1 to 2, Heroic: Size 3 to 4, Legendary: Size 5 and up. The rank is shown as a letter in the circle on the right.
- - Creatures above your rank are greyed out. Players can't pick them, the GM still can. Creatures you have no permission for are not shown.
- - Click to select, double-click to select and confirm. Raise, duration and skill are part of the same dialog, "Revert form" is a button in the Shape Changer dialog.
- - The Mighty Summoner version of the dialog has its own look: a pentagram instead of the paw, a link between summoner and creature, and the creatures are grouped by their parent folder (sorted by name) instead of by rank, without the rank circle.
- Rebuilt the Personal Health Centre as one window instead of a chain of dialogs (heal self, heal other, potion, fatigue, reroll).
- - A switch at the top lets you heal yourself or the targeted token (healing yourself is no longer excluded by a target). The Wounds and Fatigue blocks are the tabs, with a short preview of what will happen.
- - Yourself: Natural Healing, Direct healing or a Potion. Someone else: the result of your Healing roll or a Potion. Natural Healing shows its roll inside the window with *Accept* or *Reroll with Benny*.
- - Potions of the healer **and** of the target can be used on the target (e.g. to help an unconscious ally with their own potion). For other characters' potions you need at least `observer` permission on them. The GM client does the work, so no ownership of the target is needed.
- - The texts of the old dialogs were moved to the language file (English only for now).
- Rebuilt Soak Damage as one window instead of a chain of dialogs (main dialog, Holy/Unholy Warrior Power Points, reroll, apply wounds, Incapacitation roll, Bleeding Out roll).
- - Set the incoming Wounds with a stepper (the pips show them as hatched ghosts), then either *Soak roll* (spends a Benny) or *Take the damage*. A preview line tells you what will happen.
- - The Soak roll, the best result and the *Reroll with Benny* option stay inside the window. Holy/Unholy Warrior Power Points are a stepper in the same window.
- - If the damage exceeds your maximum Wounds, the Incapacitation Vigor roll follows in the same window; if you are Incapacitated or Bleeding Out, the window opens directly on that roll (also when triggered by the Bleeding Out effect). Rerolls with Bennies and Elan are inline.
- Rebuilt Unshake and Unstun as one window each instead of a roll followed by a Benny dialog.
- - Unshake: choose between the Spirit roll and spending a Benny right away; the result, a Benny to act and the free reroll (Old Ways Oath) are in the same window. Follows the "Use SWD unshake rules" setting.
- - Unstun: the Vigor roll with the bonuses listed beforehand, the result and *Reroll with Benny* (Elan +2) in the same window. A reroll only changes anything if it is better than the best result so far.
- - Both show the die, the bonus on the roll (Edges, effects) and your Bennies, and look like the Personal Health Centre and Soak Damage windows. The texts of Unstun were moved to the language file (English only for now).
- Rebuilt the Radiation Centre as one window instead of a main dialog followed by reroll dialogs.
- - Roll Vigor to resist Radiation or take the Level of Fatigue right away; the window shows your Fatigue, Rad Resistance and Bennies and previews what will happen (including the Incapacitation and Radiation Poisoning if the maximum Fatigue is exceeded).
- - After a failed roll the free reroll (Soldier) or the reroll with a Benny (Elan +2) are offered in the same window. The Geiger counter still plays only for the user who opened it.
- Rebuilt the Tester as one window instead of a chain of dialogs.
- - Choose *Support* or *Test*, the skill (and the supported skill), and for a Test the desired result (Distracted / Vulnerable). The roll, the bonuses (Elan, Menacing), the reroll with a Benny or the free reroll (Reliable for Support, Humiliate and Taunt for Tests) and *Apply* are all in the same window. The best result is kept.
- - For a Test the target's resist roll now opens as one window for the GM (Strong Willed and Elan of the *target*, reroll with a Benny of the target, result and conditions in one chat message). A Critical Failure on the resist roll no longer costs the target another Benny.
- Rebuilt the Travel Calculator as one window instead of three dialogs.
- - Distance, unit, method of travel, random encounters and stealth mode are in the window; the *Encounter tables* selection is a second view of the same window (no extra dialog) and the result (without encounters) is shown in it as well. With encounters the journey journal is created and opened as before.
- - Distances may now contain decimals (a comma works too).
- Rebuilt Common Bond, Deviation and the Dramatic Task Planner as windows in the same look as the other rebuilt dialogs.
- - Common Bond shows who gives the Benny to whom (portraits, arrow, your Bennies) and asks for confirmation in the same window.
- - Deviation: pick the weapon type and range with one click each and roll. Calling `swim.deviation(weaponType, range)` with both arguments still rolls without any window.
- - Dramatic Task Planner: players, difficulty, custom tokens/turns and the options in one window.
- Rebuilt the Effect Builder as a window with a **searchable power list** (type to filter, Enter picks the first match, arrow keys move through the list).
- - The power of the item the macro was started from is preselected if the Effect Builder supports it (by its SWID); any other power item opens *Other* with that power selected. Without an item *Boost Trait* is preselected.
- - Trait lists are sorted: Attributes A-Z, then Skills A-Z. The window no longer depends on the SUCC module's translations.
- Rebuilt the Fear Table dialog, the Raise Calculator, the Scene Illumination setting and the Mighty Summoner *Dismiss* confirmation as windows (same look as the other rebuilt dialogs).
- - Fear Table: shows the source of fear, the detected modifier (editable, Enter rolls) and the targets as chips. Wrong or missing table settings keep the window open.
- - Raise Calculator: result updates while you type; there is a *Close* button now.
- - Scene Illumination: the four levels are one-click options.
- - Dismiss: confirmation window with the creature's name; all texts translatable.
- Rebuilt Falling Damage and Loot-o-Mat as windows (same look as the other rebuilt dialogs).
- - Falling Damage: one card per selected/targeted token with depth, snow and water; everything is checked before anything is rolled.
- - Loot-o-Mat: all texts (window and chat message) are now translatable; amounts per treasure type in one window. Entering no enemies at all shows a notice instead of rolling 0.
- Tester: the trait dropdowns are sorted alphabetically (Attributes A-Z first, then Skills A-Z in the Support dropdown).
- Tester: the roll of a *Test* no longer closes the window by itself (not on a raise, not when no reroll is left): the target opposes it, so you decide when the roll is high enough and press *Apply*. *Support* still ends at once on a raise or when no reroll is left (a raise is the ceiling). A Critical Failure still ends immediately with a chat message only.
- Links to Foundry documents (journal entries etc.) inside the SWIM windows are now shown as red underlined text instead of Foundry's grey box.
- Rebuilt Chase Setup and Ammo Management as windows in the same look as the other SWIM windows.
- - Ammo Management, Reload: new field **Bullets to load**. It defaults to a full magazine; *Max (n)* and *Just 1* set it with one click. The number is limited to what fits into the weapon and what you have left. Charge Packs ignore it (always a full charge). This replaces the old "Can only reload one at a time" checkbox. Also works for NPCs that don't use ammo from the inventory.
- - Chase Setup: Tables/Cards switch, selects, number of cards and the layout options in one window. Only as many tiles are placed as cards were actually drawn (a deck that runs out no longer causes errors), and the texts are translatable now.
- Rebuilt Token Vision as a window (same look as the other SWIM windows) with all the vision and light options Foundry offers.
- - **Vision:** *Automatic* (default), Basic sight, Low Light Vision, Darkvision, Infravision, Night Vision Device, *Custom* or *No change*. Everybody has basic sight (Full light 1000, Dim 25, Dark 10, Pitch darkness 1). Special vision is only applied where it beats that (e.g. Darkvision only in Pitch darkness, Low Light Vision from Dark on), so nobody gets tinted or grey vision without a benefit; Infravision keeps basic sight and adds heat detection. Automatic looks for the abilities by SWID (`darkvision`, `infravision`, `low-light-vision`, the strongest wins; names and languages no longer matter) and uses the scene illumination (`SWIM Scene Illumination` flag, else the scene darkness) for the basic range. The advanced section shows and edits vision mode, range, angle and every detection mode.
- - **Several tokens (GM):** with more than one token selected every token gets the vision of its own abilities; a choice in the window applies to all of them. Players still use one token.
- - **Scene illumination:** changing a scene's illumination (Scene Illumination button) sets Automatic vision on all tokens of that scene, and a token created on a scene with an illumination level gets it too (GM side, light sources untouched, tokens with vision disabled are skipped).
- - **Light:** None, Candle, Torch, Lantern, Lantern (Bullseye), Flashlight, Custom (every Foundry light setting incl. animation) or *No change*. A light source is now an Active Effect for [Active Token Effects](https://github.com/kandashi/Active-Token-Lighting) on the actor, so it is removed again with the effect (the token's own light comes back). Light sources need ATL, which is now a requirement.
- - A light now has a sensible colour by default (it used to be black unless you picked one).
- Added the setting *Automatic vision adjustments* (SWIM Configuration > Misc, on by default). While it is on, changing a scene's Scene Illumination and placing a token on a scene with an illumination level set up the vision of the tokens automatically. Tokens with *Vision enabled* switched off are never touched. The Automatic option of the Token Vision macro still works when you start it yourself (it also skips tokens without vision).
- Rebuilt Combat Setup as a window and made it available again (GM only: button in the token controls, or `swim.combat_setup()`).
- - Pick the tokens of the scene that join the combat, sorted by disposition (Friendly, Neutral, Hostile, Secret) with *All* / *None* per section. Defeated NPCs are listed but not preselected; tokens already in the combat are not listed.
- - **Group Extras of the same kind** (same creature, disposition and visibility; Wild Cards never) so they share one action card. Optionally only Extras that are within a number of squares of each other. The first one becomes the group leader, you can still change the groups in the Combat Tracker before starting.
- - *Add to Combat* creates the combat if needed and then lets you adjust the groups and press *Start Combat*; *Start the combat right away* does both. If SWADE's Automatic Initiative is off you can let it draw the action cards when the combat starts.
- Added a **SWIM Scene Illumination** section to the Lighting tab of the scene configuration (GM only, marked with a SWIM badge and a red frame). Choose Full light, Dim, Dark or Pitch Darkness while you set up the scene's lighting; it is saved with the scene and is the same value the Scene Illumination button sets. *Not set* removes it again (Token Vision then follows the scene's Darkness Level).
- Added two list settings to the **Item Options** tab of the SWIM Configuration: **Vision SWIDs** and **Potion SWIDs**. Each has an *Edit list* button that opens a small window where you add and remove entries (SWID + a selector for the type) and press *Apply*; *Reset to defaults* restores the standard entries.
- - **Vision SWIDs:** pick which SWID gives which vision type (Darkvision, Infravision, Night Vision Device, Low Light Vision), e.g. `dwarf` = Low Light Vision when your Dwarf ancestry has it built in and there is no separate ability on the sheet. The Token Vision macro and the automatic vision both use the list. The defaults are the old SWIDs (`darkvision`, `infravision`, `low-light-vision`), so nothing changes until you edit it. If a token matches several types the first of Darkvision, Infravision, Night Vision Device, Low Light Vision applies.
- - **Potion SWIDs:** one list for the Health Centre potions, each entry marked as *Health potion* or *Fatigue potion* and with a number *Per use*: how many Wounds it heals or Fatigue levels it cures (default 1, 1-20). The Health Centre uses that number when the potion is selected and no longer shows the + / - buttons for potions (it never heals more than there is to heal). This replaces the two settings with potion names; your old names are converted to SWIDs automatically once (the GM's first login), so custom potions keep working. Items without a SWID are still recognised by the SWID derived from their name. Potions are now found by SWID, so renamed or translated potions work as long as the SWID matches.

- Added **auras** (e.g. a Command range): an Active Effect can be passed on to every token within a radius around the token of its owner. Open an Active Effect (GM), tab **Aura**, and tick *This effect is an aura*.
- - The effect can sit on the actor or on one of its items (e.g. the Command Edge, with *transfer* on). Its changes, icon and conditions are what the others receive, as a copy that lasts as long as they are in range. The effect itself no longer changes its owner, unless you tick *Also affects the owner*.
- - **Radius** in squares, calculated exactly like the auras of the SWADE system (token configuration > Auras): a circle around the token, counted from its edge. A token the circle covers any part of is affected, so a radius of 5 is the same range as an aura of 5. **Affects:** allies (same side as the owner), enemies or everybody.
- - **Range:** *Command range* (the value of the new **Command range** field at the top of the actor's SWIM config, default 5), *Aura 1* / *Aura 2* (the radii set in the SWADE aura settings of the token) or *Custom* (the radius field, only shown then). Change the range on an actor that gets an Edge/ability to raise it and every aura effect of that actor follows.
- - **Name on token** is the name the copy gets on the affected tokens (e.g. *Command* -> *Under Command*). **Also affects Wild Cards** is off by default: leadership Edges normally work on Extras only; switch it on for an Edge that includes Wild Cards. The owner is not affected by this option, see *Also affects the owner*.
- - The aura is inactive while the owner's token is hidden or the owner is Incapacitated, Bleeding Out or Dead. By default several owners of the aura with the same effect name do not stack: the nearest one counts (option *Stacks with the same aura of other tokens*).
- - The first connected GM keeps the copies up to date while tokens move, are placed or removed, and when effects change. Switch the whole feature off with the setting *Aura effects* (SWIM Configuration > Misc); `swim.recalculate_auras()` (GM) updates the scene you are viewing by hand.
- Warrior's Gift in the Effect Builder now grants a Combat Edge to each target. Before the effects are created a window opens (same look as the Shape Changer list): pick one Edge for every target, the Edges are grouped by rank and sorted by name. Edges above the caster's rank are greyed out, only the GM can still pick them.
- - The Edge is a copy from your Edge compendium (keeps its SWID and everything else), named *Edge (Warrior's Gift)*. The effect is named *Warrior's Gift: Edge* and shows the granted Edge in its description. If the caster is not a target, the maintaining effect lists every target with its Edge.
- - The Edge is removed again when its effect ends or is deleted (also when the caster's maintaining effect ends).
- - Which Edges are offered: all Edges of the compendium whose category contains *combat* (any case).
- Effect Builder: every effect the caster gets (the maintaining effect, or the caster's own effect if the caster is a target) now lists all targets in its description instead of the power text. This applies to all powers; for Warrior's Gift the list also shows each target's Edge. The effects of the other targets are unchanged.
- Warrior's Gift: with *Raise* checked before the Edge window opens, all improved Edges (SWID starts with `improved-`) can be picked regardless of rank and GM status.
- Warrior's Gift: hovering an Edge in the window shows its description with the original formatting.
- Warrior's Gift: items an Edge grants are named *Item (Warrior's Gift)* and are removed together with the Edge. Nothing that already exists on the actor is changed.
- Added a small *free reroll* button (circle arrow, tooltip only) left of the *Reroll with Benny* button in Natural Healing, Soak Damage, Unstun, Unshake, Radiation Centre and the Tester windows, for Edges or settings that grant a free reroll. It costs no Benny and gives no Elan bonus. The Tester's Support and Resist windows no longer close on their own when no Benny is left, so the free reroll stays available.
- Added a setting *Edge Compendium* (SWIM Configuration > Item Options). Choose any Item compendium; Warrior's Gift needs it.

### Fixed
- Fixed drop-down lists (`<select>`) being white with unreadable text in Chromium-based browsers in SWIM windows.
- Fixed the aura radius lookup calling a SWADE getter that changes the actor's flags while only reading. (A report of double-clicking a token opening a wrong actor could not be traced to SWIM so far; if it happens again, please check with SWIM disabled.)
- Fixed bonuses that were counted twice in the **Unshake**, **Unstun** and **Soak** windows. Effects that an Edge or ability brings along (they live on the item, not on the actor) were overlooked, so their bonus showed up as an "Other modifier" / "Generic Bonus" and the Edge was added once more. They are now found, and a bonus that is typed into the actor sheet is no longer added on top of an Edge that gives the same +2 (e.g. a Skeleton with Unshake +2 on the sheet and the Undead ability now gets +2, not +4). Other values on the sheet still show as "Other modifier". The rule can be switched off with the new setting *Sheet value replaces Edge bonus* (SWIM settings > Misc, on by default); whenever it takes effect, a console warning says so.
- Replaced the Ko-fi button image (it was no longer available) in the SWIM Configuration and the SWIM chat messages with the current Ko-fi button.
- Fixed the SWIM Configuration saving the number 0 or an unchecked box as an empty value.
- Various bugs in Fear table function.
- - Heart Attack (failed Vigor roll) crashed with `effects is not defined`.
- - *Adrenaline Surge* now uses SWADE's global modifiers (+2 to all traits and damage), so it also covers attribute rolls and items added later.
- Fixed a bug in the migration that overwrote existing data on actors and items.
- Fixed the migration crashing on actors and items that already had a SWIM configuration, and documents without a version needing two runs (and two popups) to be migrated.
- Fixed Shape Changer, Tester (critical failure) and `swim.revert_shape_change()` doing nothing, because they still relied on Warpgate events.
- Fixed Effect Builder and Shape Changer refusing to run without Warpgate.
- Fixed Boost Trait / Lower Trait not finding the attribute name.
- Fixed the Mighty Summoner ignoring its updates when spawning: the creature is now named `<Summoner>'s <Creature>`, copies the disposition, is unlinked and gets the extra wound on a raise.
- Fixed several Mighty Summoner issues for players: summoned tokens could not be controlled, the maintenance effect was not created, and dismissing a summon only played the SFX but not the VFX. A GM summoning for a player-owned token now also gives the player control.
- Fixed the sheet of a dismissed summon staying open.
- Fixed the Mighty Summoner skill dropdown listing options multiple times (no Power Points mode).
- Fixed several Soak Damage issues (while rebuilding it):
- - A Benny (and Power Points) were spent before the roll, even if the roll was cancelled. They are now spent after the roll.
- - Soak bonuses from Active Effects were added as text instead of numbers.
- - The Gritty Damage injury was rolled even if no new Wound was taken.
- - The Incapacitated overlay was removed instead of added in one branch.
- - A critical failure on the Bleeding Out / Incapacitation roll with *Harder To Kill* left the character Bleeding Out when they survived.
- - Marking an NPC or vehicle as dead used the controlled tokens and toggled; it now acts on the right token.
- Removed leftover debug output from `swim.check_bennies()`.
- Fixed Soak failing with a condition mapping error (`defeated` was renamed to `dead` in SUCC).
- Fixed Soak with (Un)Holy Warrior reading and writing the wrong Power Points path.
- Fixed Soak injury effects having the default icon.
- Fixed the Soak reroll dialog showing only the last roll. It now shows the last roll, the best result and the Wounds you will receive.
- Fixed the Shape Changer using the wrong Power Points paths (SWADE 3.3 has Power Point pools).
- Fixed texts showing "undefined" in the Heal Other and Personal Health Centre dialogs (fatigue text, potion list) and some wrong language keys.
- Fixed the Personal Health Centre crashing when drinking a Fatigue potion.
- Fixed the SWD Unshake setting halving the Pace of a Shaken character twice.
- Fixed the missing space in the name of the Ammo Management effect.
- Fixed the Travel Calculator failing to update the encounter tables if there is no *[SWIM] Encounter Tables* folder. (After saving other tables the old dialog also kept using the previous names until the next start; the new window reads them fresh.)
- Fixed Craft Campfire not working with the current Portal version.
- Fixed the SWIM config window (actors and items) applying Active Effects on its values again every time it was saved, so e.g. Radiation Resistance grew with each save. It now shows and saves only the real stored values and writes only what you changed.
- Fixed several Unshake and Unstun issues (while rebuilding them):
- - Unshake: the Benny button was offered without any Bennies (when only a free reroll was left) and removed Shaken for free.
- - Unshake and Unstun: cancelling the roll dialog caused an error, and a Benny was spent before the roll.
- - Unshake and Unstun: a bonus from an Active Effect named like the Edge it belongs to (e.g. Combat Reflexes) was counted twice; a bonus that no effect explains was dropped when the actor had other effects; Unstun added bonus values of several effects as text.
- - Unshake (SWD): the free reroll is only offered while the character is still Shaken. Unstun: a worse reroll after a 4-7 result no longer says "remains Stunned" while the condition was already removed.
- Fixed several Radiation Centre issues (while rebuilding it):
- - The Radiation Poisoning effect was created with the old `label` / `img` properties, so it had no name and the default icon.
- - Fatigue beyond the maximum toggled Incapacitated on the *selected* token (and removed it if it was already there); it now adds it to the right token (NPCs and vehicles die).
- - The Fatigue was calculated from the value at the time the macro was opened, and a Benny was spent before the roll, even if the roll was cancelled. Cancelling the roll dialog also caused an error.
- Fixed the Unshake sound not playing if the Shaken condition was removed with a Benny after a failed roll.
- Fixed the Mark Dead macro playing the death sound when reviving a token. It plays the Soak sound now, as does anything else that removes Incapacitated or Dead.
- Fixed several Tester issues (while rebuilding it):
- - A Benny was spent before the reroll was made, and with no Bennies left a Reliable / Humiliate free reroll was blocked. Cancelling the roll dialog caused an error.
- - Support: the Support effect on the target was not found again reliably (a second Support on the same trait now updates the same effect, capped at +4) and its time stamp / name used old properties.
- - Test: the Retort Edge was checked on the wrong actor (the tester instead of the target) and Strong Willed was applied to the tester instead of the target.
- Fixed the Deviation dialog's weapon type / range radio buttons being broken by unterminated HTML (the first options were not reliably pre-selected).
- Fixed the *One task per player* option of the Dramatic Task Planner being ignored when Challenge Tracker is not installed.
- Fixed the Effect Builder failing with an error on *Proceed* for Conceal Arcana, Slumber, Environmental Protection and Intangibility.
- Fixed the *Damage Field* option of the Effect Builder (Damage Modifier, 2d6 instead of 2d4) never being applied, and Smite failing if a target has no weapon.
- Fixed the Effect Builder switching away from the preselected *Other* power when changing the power and the power item being linked although another power was chosen.
- Fixed the Fear Table's "table name missing" notice showing no table type (wrong localisation call).
- Fixed Mighty Summoner *Dismiss* throwing an error when the summon's maintenance effect was already gone.
- Fixed Falling Damage showing negative damage when snow was deeper than the rolled damage (it is 0 now), and an error with water *and* snow on one token aborting the roll halfway (nothing is rolled any more in that case).
- Loot-o-Mat: an invalid "per x" in the treasure stat (not a positive number) counts as one enemy instead of producing an invalid roll.
- Fixed the Radiation Resistance being shown as "--2" in the Radiation Centre chat message for negative values.
- Fixed various deprecation warnings (`skill` -> `trait`, `label` -> `name`, `actorData`, `permission`, global `duplicate()` / `randomID()`).
- Fixed Chase Setup placing wrong images in Cards mode when the pile wasn't empty, and mentioning the table name after resetting a deck.
- Fixed the melee sound in Ammo Management throwing an error for weapons with RoF 2 or more.
- Fixed Ammo Management giving more ammo than you own when changing the ammo type.
- Fixed the Effect Builder throwing `ATTRIBUTE_LANG_KEYS is not defined` when applying Boost Trait or Lower Trait on an attribute (introduced by the window rebuild).
- Fixed the Travel Calculator's Joker replacement (it referenced an undefined variable and never used the new card).
- Fixed the Chase Setup window not growing / scrolling when the layout options are unfolded.
- The trait dropdowns of the Effect Builder now show "| Attribute | Agility" and "| Skill | Fighting".
- Fixed the combat playlist not being stopped when a combat ends if your *Combat Playlist* setting was not named "Combat". The combat playlist is also no longer stopped and restarted when a combat starts while it is already playing.

### Changed
- Rebuilt the SWIM Config of actors and items in the new dialog style: grouped sections, hint per option, reset button per option, changed options highlighted, file pickers with a **play button for sound options**, and the Active Effect of ammo shown as *Effect set / No effect set*. Closing the window with the X or *Cancel* now discards your changes instead of saving them; use *Save*.
- Rebuilt the SWIM Configuration window in the new dialog style: tabs, a search over all settings, a short hint per setting, changed settings highlighted, a reset button per setting, file pickers (sound settings with a play button) and a counter of unsaved changes. Only the settings you changed are saved.
- Saving the SWIM Configuration no longer reloads the page. Foundry's reload dialog appears only if you changed a setting that needs a reload (Condition Roll Mode, SWD Unshake, Better Rolls 2 support, Ammo Management with BR2); those are marked *Reload needed*.
- Radiation Centre wording: *Gain Fatigue* instead of *Take the Fatigue*, and a failed roll now says "takes a Level of Fatigue. You may spend a Benny to reroll." instead of suggesting a reroll always helps.
- The Mighty Summoner has no Size limit. It lists every creature you have at least `limited` permission for (the GM sees all). Only *Mirror Self* needs the rank Veteran (greyed out below, the GM can still pick it). The Shape Changer shows forms above your rank greyed out instead of hiding them.
- **[BREAKING]** SWIM now requires Foundry v11 and SWADE 3.3.8 or newer (verified with 3.3.11), SUCC 3.3.0 or newer, socketlib and Portal (portal-lib 1.0.7).
- **[BREAKING]** Mighty Summoner only shows summonable actors for which the user has *at least* `limited` permission.
- **[BREAKING]** Shape Changer only shows actor presets for which the user has *at least* `limited` permission.
- Changed `img` property to `icon` when creating Active Effects.
- Changed the Active Effects created by SWIM to use `name` instead of `label`. Ammo effects stored with `label` are converted automatically.
- The Shape Changer now creates the new token itself and the Mighty Summoner uses Portal. Players need the *Create Tokens* permission to summon.
- All sound effects now go through one place and respect the *Default Volume* setting (some used to ignore it). SWIM uses Foundry's core audio API (`foundry.audio.AudioHelper` as soon as available), no additional module needed.
- The sounds for Shaken, Wounds, Fatigue, Incapacitated etc. are no longer played by the individual macros and by Better Rolls 2 hooks, but by one central set of hooks (see Added). Better Rolls 2 still plays the Soak sound. These sounds no longer need the Better Rolls 2 support setting.
- The Mighty Summoner now plays its VFX/SFX at the chosen location before the token appears.
- Lazy migration of actors and items is now done in one go. The world migration dialogs were replaced by `swim.migrate_world()`.
### Removed
- Removed the SUCC *Torch* condition as the light source of Token Vision (the light is an ATL effect now). Torch effects that are still on tokens are removed the next time you set a light with Token Vision.
- Removed Warpgate requirement as it is no longer maintained.
- Removed systems key from the manifest because Foundry was bitching about that for no reason at all.
- Removed the settings-extender and lib-wrapper requirements. Neither is needed by SWIM.
- Removed the Conviction maintenance dialog at the start of a round (it did not work and SUCC adds that functionality).
- Removed the disabled Hold feature (SWADE handles Hold natively).
- Removed the unfinished Power Point Management script.
- Removed the world migration dialogs and their settings.

## [2.6.1] - 2024-05-12
### Fixed
- #148: An error that occured if the Dramtic Task Planner was executed without the Challenge Tracker module enabled.

## [2.6.0] - 2024-05-11
### Added
- Added a hook (`'swimShapeChanged'`) that is called after the shape changer completed the shape changing process. It passes the new token in order to work with that further in code.
- Dramatic Task Planner Macro. Please [read the Wiki](https://github.com/SalieriC/SWIM/wiki/Macros#dramatic-task-planner) on it, it has a couple features that are explained there.
- Added `swim.revert_shape_change(token)` to revert the passed `token` back to its original form.
- Added automatic power backlash execution for the BRSW support.
- - Currently only automates regular backlash.
- - Dynamic Backlash can be set in the SWIM settings but it will only roll on the table (make sure to import it into your world and set the name in the SWIM settings).
- - This can also be turned off independently of th BRSW support.
- - The regular backlash is fully automated and will also revert shape change forms, dismiss summoned creatures and terminate all powers if they are set with the Power Effect Builder.
- - It will also apply Fatigue (or Inc.) as per the base rules.
### Changed
- When removing maintained power, gathering effects is now in a `try` statement so that the function continues if an error occurs (i.e. when the token changed or doesn't exist anymore.)
### Fixed
- Fixed chase deck table not resetting results when resetting a chase scene.
- Shape Changer now properly handles wild card images for shape change presets. The Shape Changer will get a random token image from all possible token images of the SC preset and use that. This does not prevent the user from setting up the prototype actor without wildcard images.
### Known issues
- The Dramatic Task Planner currently doesn't put journal links in the dialogue and chat message, the reason for this is unknown, help would be highly appreciated.

## [2.5.0] - 2024-03-24
### Added
- New SWIM config for actors allowing the user to set up a custom mirror self token image. If using the Mighty Summoner, this image will be used for the mirrored self. If empty it will use the summoners token instead. This setting *does* accept wild card images.
- Added shaken link to official module link list.
### Changed
- Merged both Unshake functions into a single one. This should make it a lot easier to maintain it in the future and (hopefully) not affect the user in any way.
- Mark dead will now apply defeated to NPCs and incapacitated to PCs.
- Moved away from the deprecated SUCC API in favour of the new one (thanks @ddbrown30).
- [BREAKING] Changed the naming of the deflection active effect created by the Effect Builder from "Deflection (range)" to "Deflection (ranged)". This will mean currently active effects will not be recognised by BRSW rolls anymore and need to be adjusted.
### Removed
- Removed the hold functionality in SWIM (or rather disabled it for the moment) as it is broken in SWADE 3.3.6+ and would need a major rework.
### Fixed
- Tester macro failing to create a support effect if a combat is active.
- Added a failsafe to the Effect Builder in the unlikely case of a target not having any skills.
### Known issues
- The actor created as the mirror will only have the proper image if it is not a wild card image path. If it is, the summoners image will be used.
- Deflection malus is added twice in some cases when using it along with BRSW. This is currently being worked on. Disable the action in BRSW as a fix for now.

## [2.4.0] - 2024-01-20
### Added
- Tester macro now remembers the best roll and uses that instead of the last roll.
- Encounter table setup directly from the travel calculator macro.
- Mighty Summoner now respects the summoning tokens disposition and uses it for the summoned token.
- Function to prevent the conviction expiration dialogue from the core system that is added by SUCC.
- Added a failsafe to the ammo management that prevents code failing on a RoF higher than 6.
- Added SUCC 2.3.0 support for the effect builder which means it now uses the new SUCC api and also properly passes the effect duration.
- Chase background images that serve as an example and make the scene be visible easier. Users are encouraged to setup their own however.
- Added a free reroll on failed (but not crit failed) rolls to recover from being shaken if the Old Ways Oath hindrance (Deadlands) is found on the actor. (This is an odd hindrance that allows a free reroll on spirit for some reason.)
### Fixed
- Fixed a critical bug in the Tester macro where on some test rolls the support roll function was called.
- Fixed a critical bug in the Travel Calculator macro that prevented its function if no custom options json was given.
- Fixed some errors in translation strings.
- Fixed a critical error that made the ammo management update an items quantity or shots with a string rather than a number resulting in data loss.
- Fixed a bug that prevented passing the duration of effects in the effect builder to SUCC resulting in faulty duration.

## [2.3.0] - 2023-11-11
### Added
- Several new sfx to be used in the Travel Calculator (see below).  
### Changed
- [BREAKING] Changed BRSW ammo management integration to using the new br_card instead of message. As a result you'll have to delete the old "SWIM: Ammo usage" macro and import the new one from the SWIM macro compendium in the "BR2 Macros" folder. Or replace your existing macros (entire!) code with `swim.br2_ammo_management(br_card, actor, item)`.
- Big Travel calculator refactor to simplify the code a bit and allow for more options and customisation.
- - Added a setting to input a JSON structure that can define custom created means of travel.
- - Added SFX support to Travel Calculator.
- - Added Stealth Mode to Travel Calculator that allows the GM to plan a journey ahead of time without notifying the players or just to silently check the required time (won't play SFX and won't show image).
- - New Constant containing all the default means of travel.
- - Documentation on the new changes and an example JSON for adding your own means of travel.
### Fixed
- Repeating migration warnings.
- Low Light vision providing vision even in pitch darkness using the token vision macro.
- Fixed a bug in the Tester macro where a support roll of less than 4 still showed a +1 support in the chat card.

## [2.2.0] - 2023-10-18
### Added
- Tester Macro to test and support enemies and allies. Please [read its documentation here](https://github.com/SalieriC/SWADE-Immersive-Macros/wiki/Macros#tester) to learn about its current limitations.
- Mighty Summoner now adds +1 damage to all weapons that use the fighting skill if the Fervor edge is found on the summoner.
### Fixed
- Fixed a bug in the unstun macro, that prevented it from finding the Elan edge in other languages.
- Fixed a bug in the Travel Calculator that caused it to break if no tables for random encounters were present.
- Fixed Ammo Management non-functional due to BRSW update.
- Fixed false variable declaration in lang file.

## [2.1.0] - 2023-07-05
### Added
- Travel Calculator is now able to generate encounters.
- - If checked (requires random tables such as those provided by SWIM) it draws a card for each day of travel.
- - SWIM uses its own card deck API introduced in 2.0.0. Yes, it is a card deck and it is fair.
- - Cards with values of 10 or lower are ignored.
- - Face cards and higher trigger an encounter drawn from the tables depending on suit (as per the core rules pg. 144).
- - On a Joker, two more cards are drawn and the results are combined (as per the core rules pg. 144).
- - If a Joker is drawn as part of a card draw triggered from a Joker, the card is redrawn and the Joker is discarded without effect.
- - If encounters are calculated, there won't be a dialogue showing the results, instead a JournalEntry will be created with all the data.
- - The JournalEntry is carefully crafted and created in a folder that is created if not present yet.
- - The image gets shown to all as usual, the JournalEntry is shown to the GM.
- Official modules file in which the div classes and links for the official modules are stored.
- - You can contribute to that list by adding the official modules of your language to the bottom of the list.
- - If you do so please create a PR with the updated file.
- - Also please sort the modules by language, all official modules of a language should be after each other.
- - Please note that SWIM checks from the bottom up, so you'll have to put specialised modules lower and general ones towards the beginning, that's why SWADE Core and SWPF appear first since these are the ones carrying all the basic rules.
- New API function that finds a journal link in the Official modules file.
- New API function that finds a compendium key in the Official modules file.
- Some support for the Brazilian Portuguese core rules module (mclemente).
- Deviation macro localised.
- New art for the deviation clock.
- Size & Scale Calculator localised.
- New localisation strings.
### Changed
- The API function to get the official div class of modules was rewritten to be less hard coded and to use the Official modules files contents instead.
### Fixed
- Calculation bug in travel calulator that sometimes caused faulty results.
- Broken Journal link in Deviation and Scale Calculator.
- Some Weblate issues and manually merged translations (thanks at everyone contributing to the translations).

## [2.0.1] - 2023-07-03
### Fixed
- Fixed a bug in the Mighty Summoner where it always tried to find the Special Abilities, even with no compendium provided, thus causing an error.
- Fixed a bug that caused an error message if the raise calculator button was turned off.
- Fixed error messages that occured if BRSW support was turned on but with the module itself not active in the world.

## [2.0.0] - 2023-07-02
### Added
- The Power Effect Builder now adds the powers description to the active effect if a power item is found on the actor. This currently only works for power effects not handled by SUCC (so every AE except Boost, Lower, Protection and Smite).
- Migration to change all AE data for ammunition to use the new 'name' property instead of 'label'.
- Mighty Summoner now is aware of the Edges "Summoner" and "Druid" (Fantasy Companion) and adjusts the duration accordingly (duration in minutes for Summoner, one hour for Druid). It uses a base duration of 5 however so there might be problems with powers of a different duration. If the "Concentration" Edge is found the duration is doubled after respecting the duration increase from "Druid" or "Summoner". The duration can still be changed manually.
- New Translation strings.
- Keybinding option for the Raise Calculator (mclemente)
- SWIM compendiums get sorted into its own folder if not manually sorted (mclemente)
- Added a setting to allow the selection of a compendium containing special abilities (javierriveracastro)
- Mighty Summoner is now capable of creating a 'Mirror Self'. For that the macros dialogue received a new entry in the selector which is always available and always the last option. It needs to resort to some trickery and creates a new actor in the `[SWIM] Summon Creature` folder structure which is deleted after the mirror is dismissed.
- The 'Mirror Self' token image can be mirrored horizontally, set up in the macro options tab in the SWIM settings.
- Falling damage calculator fully localised.
- New Setting that allows the user to configure the BRSW integration for SWIMs Ammo Management. It can be set to either 'full' (works as before with SFX and reducing ammo), 'sfx only' (only plays SFX but won't reduce any ammo) or 'disabled' (fully disables Ammo Management and SFX and won't show the red button on the BRSW chat card). This allows you - for the first time - to enjoy the sound effects without having to worry about ammunition.
- When soaking wounds, the function now will keep track of your best result and will use that number for the rest of the procedure (rerolling, applying wounds, etc.) until you either roll an even better result or a critical failure (in which case the original amount of wounds is used in the apply wounds dialogue (you can still change it there though)).
- A new travel calculator macro that takes some inputs and calculates the time needed to travel the given distance with the given means of travel. It'll then show a flavour image and the results of the calculation.
- A bunch of flavour images for travelling. They are used in the new travel calculator to create some immersion.
- SWIMs own deck of cards (poker deck with jokers left in) with corresponding functions to draw and shuffle. These are considered helper functions and won't appear anywhere in the module but can be called using `swim.draw_cards(numberOfCards, playSound)` (numberOfCards is the amount you want to draw, playSound is a boolean) and `swim.shuffle_deck(playSound, notification)` (both variables are a boolean). Why? It was easier to write from scratch than dealing with the Foundry card API.
- Four Roll Tables with travel encounters that may or may not fit the setting you're playing. Their main purpose is to be used in the future version of the Travel Calculator.
### Changed
- Migrated all active effect creations to use the 'name' property instead of 'label' as this was changed in Foundry v11.
- Ammo Management now respects the reload type 'single reload' and defaults to one bullet relaod if the weapon is set up like that. As a result, the setting in SWIM that sets the checkbox in the ammo management dialogue was deprecated.
- The Raise Calculator button in the scene controls can now be turned off (mclemente)
- Most console logs will now appear with `SWIM | ` in front of them in order to make their source easier to identify for the user.
### Fixed
- Effect Builder and Fear Table macros being partially broken due to changes in SUCC.
- Fixed a bug that caused some summoned creatures from the Mighty Summoner potentially being actor linked.
- BRSW unable to roll damage for a deleted consumable weapon. This was supposed to be fixed but isn't, so reverted this back to never delete a consumable weapon if it gets to quantity zero.
- Fixed a bug in the falling damage calculator that resulted in it not finding the toughness of a tokens actor.
- Fixed some other bugs when dismissing summoned tokens.
- Fixed deprecation warning resulting from using `effect.flags.core.statusId`.
- Fixed a bug that opened the token vision macro if the macro was used to create the effect.
- Fixed a bug in the Mark Dead macro that prevented the removal of Incapacitation. It now toggles on/off again.
- Fixed adding `system.stats.speed.value` to Shaken if SWD rules are active which required changes in SUCC.
### Removed
- Some translation strings no longer needed.
- Default value for campfire as leaving that in was an oversight. SWIM does not come with a texture for campfires yet, I hiighly recommend the animated one from JB2A though.
- Old compendium .db-files no longer used in v11.
- Compendium Folders is no longer a dependancy.

## [1.5.0] - 2023-05-28
☮️ Peace in the world, or the world in pieces. 🕊️
### Added
- New translation strings, Radiation Centre is now fully localised.
- Support for the Soak Bonus modifier in SWADE. The Soak macro tries to exclude edges which are already set up with an Active Effect but that's not a fuzzy search so it will only exclude its own Edge findings if the edges corresponding AE is named *exactly* like the edge itself. Otherwise it will add the bonus twice. There is no real way around it as it could cause false matchings if I were to introduce a fuzzy search.
### Changed
- Mighty Summoner will now summon tokens without actor link to prevent changes to the original actor. This means GMs don't have to unlink the prototype tokens manually anymore.
- Overhauled the Radiation Centre Macro:
- - Radiation Centre doesn't add a condition for Fatigue from radiation any longer (see below). This deprecation was needed as the new SUCC version doesn't currently have API support to add conditions. This makes the macro work closer to RAW however.
- - Radiation Centre *does* however add an Active Effect if the actor becomes Incapacitated from radiation: As in core this AE represents a chronic disease. A chat message will be created in this case.
### Fixed
- Bug in the Radiation Centre which made it non-functional for NPCs.
- Bugs in Ammo Management resulting from the overhaul in SWADE.
### Deprecated
- The Irradiated condition was deprecated to suit the new SUCC version better.
- Combat setup button as the function behind it is a little buggy and due for an overhaul. Let me know if anyone ever used it, otherwise it won't be a priority.

## [1.4.0] - 2023-03-28
☮️ Peace in the world, or the world in pieces. 🕊️
### Added
- Added a couple failsafes to the Fear Table macro hopefully improving its ability to find what it is looking for.
- Play the unshake SFX when successfully removing Stunned from a BRSW chat card.
- Added full support for injuries added by BRSW. The injury active effect will...
- - ... be given a new name so that it is in line with those placed by SWIM.
- - ... be given a new icon unique to the injury.
- - ... be given new effects that respect the rules a bit better, especially in the case of leg and scar injuries.
- - ... be given the proper SWIM flags needed to remove the injuries with the Personal Health Centre.
- Brought back the token merging effect on the Shape Changer.
- Added `affected` to power effect builder flags.
- Added a warning when a player tries to shape change while the GM is on a different scene. The Warning is displayed to the GM only.
- Shape Changer now sets the linked actor to the one created from the Shape Changer. This happens only if the actor who changes form is currently the linked actor of the user who shape changes (to prevent allied extras from becoming linked). This will never happen for GMs.
### Changed
- Invisible Power Effect doesn't turn tokens fully invisible anymore, instead they get a transparency to not hinder gameplay.
- - The previous alpha value is saved on the token and restored when the effect is removed.
- - As a consequence, SWIM doesn't use the invisible status effect anymore but creates its own AE.
- - Invisible in this fashion sets Alpha to 0.25 and for Intangibility the Alpha was changed to 0.5.
- Updated the Wiki with the new changes.
### Fixed
- Fixed a bug where SWIM didn't pass the proper actor when damage was applied from a BRSW chat card, resulting in sfx not playing.
### Breaking
- Shape Changer doesn't adopt sight and detection modes from the original actor. This was done to prevent the assumed form from becoming worse eyesight in case the creature has superior eyesight compared to the actor assuming the form. As a result, GMs have to set sight and detection modes properly for the Shape Change template.

## [1.3.0] - 2023-03-13
☮️ Peace in the world, or the world in pieces. 🕊️
### Added
- Campfire ambient sound effect.
- New craft campfire macro and script that allows players to create a campfire.
- - It allows the user to select a location where then a campfire is created as a tile including a light source and ambient sound.
- - Currently this works without a roll and no resource consumption but this may be added at a later time.
- - Note that this works best (but does not require) [Monk's Active Tile Triggers](https://foundryvtt.com/packages/monks-active-tiles). Without this module the placed campfire tile, sound and light need to be deleted manually. With Monk's Active Tile Triggers you can simply double click the campfire to delete all of them at once.
- New setting to choose a campfire animation or image.
- Stealth as a skill for consumable weapons, because of mines, I guess?
- Added Compatibility with the generic Unstun Bonus introduced by SWADE in v.2.2: The Unstun Script now checks for that bonus and is backwards compatible, so AEs with `SWIM.unStunMod` as change will still work. **I strongly advise to not mix and match both effect keys on the same actor as this could lead to unexpected behaviour.**
- Effect Builder now supports the Relief: Numb power. Duration is always an hour and it is not maintained according to the rules. It sets the `system.woundsOrFatigue.ignored` property (introduced by SWADE v.2.2) to 1 or 2 with a raise.
- Started work on a new Power Point Management. Far from being completed yet and currently unusable and inaccessible; I just lack the time to complete it right now.
### Changed
- Changed some image styling in some chat messages in the translation strings.
- Consumable weapons are now deleted when the last one is used as BRSW now allows rolling damage for deleted items.
### Fixed
- Fixed another bug that caused the reloading sfx to not play in certain circumstances.
- Arcane Protection from the BRSW support will now reduce damage as it should.
- Fixed a bug that caused the Power Effect Builder to add Arcane Potection when Damage Field was chosen.
- Fixed a bug in the Mighty Summoner that caused the dismiss dialogue to not appear due to changes Warpgate made. This now uses SWIM flags to make it more resilient against changes.
- Fixed a bug in the Effect Builder that caused Pace to not get boosted on applying the Speed effect.

## [1.2.3] - 2022-12-03
### Changed
- Shape Change presets in the dialogue to change shape are now sorted by size and name. The options also show the size.
- Token Vision now respects and uses values taken from SWPF which is fortunately not as lackluster on ranges than SWADE.
### Fixed
- Fixed a bug that caused the ToC block list of SWADE to be reset.
- Fixed a bug in the Ammo Management that caused AEs from ammo to not be applied when the loaded ammo was empty.
- Fixed a bug in the Ammo Management that caused the reload SFX to not be played under certain circumstances.

## [1.2.2] - 2022-11-21
### Added
- New translation strings.
### Changed
- Token vision macro always enables vision unless the "No Change" option was chosen for vision (in which case it just uses the current value).
- Token vision macro now also fully supports the systems infravision sight mode.
- Updated the deflection global actions for BRSW (thanks @grendel111111).
### Fixed
- Fixed a critical Bug in the migration of items. Note that this only affects items migrated manually, the migration that ran automatically was not affected and should be fine.
- Fixed several bugs in the ammo management which made it impossible to use.
- Fixed a bug in Power Effect Builder where a property path was declared faulty.
- Fixed a bug in the Shape Changer Macro that caused the user to not get permission of the actor they change into.
- Fixed a bug in the Shape Changer Macro that caused the function to stop due to sequencer not getting a proper scale for the animation.
- Fixed a few instances where functions didn't get the sound effects properly.

## [1.2.1] - 2022-11-11
### Added
- Two new SFX (night vision device toggled on and off).
- Completely overhauled Token Vision Macro to integrate Foundry v10 features.
- Button in lighting controls of a scene that defines the illumination level of the current scene.
- - This will set the default selected illumination level in the Token Vision macros dialogue.
- - If not set, the macro will make an estimation based on the darkness level of the scene.
- - **WARNING:** The token vision macro will **irreversibly overwrite your configured detection modes on the token!** This is because it's really hard to deal with them atm. It will set up "Basic sight" and "See heat" as the others are not that useful for SWADE right now. I will adjust that when this changes.
- New translation strings.
### Fixed
- Skills on the power effect builder macro now get sorted properly.
- Fixed a bug that caused the initiative tracker showing the wrong turn when toggling on the holding status effect. (SWIM will continue to provide it's own functionality as it is more expanding on the feature.)
- Token Vision macro works again.

## [1.2.0] - 2022-11-05
### Added
- Conviction Maintenance:
- - When a new round in combat starts, a dialogue is shown to players maintaining conviction.
- - In the dialogue, you can choose to spend a Benny to maintain your conviction or...
- - decline and your conviction will be deactivated.
- - The dialogue is not shown if you are out of Bennies and conviction will end.
- - This will only happen if the conviction condition (provided by SUCC) is active, so you can still activate conviction using another effect and maintain it indefinitely if you want.
- New Translation strings.
### Changed
- The `check_bennies` function now takes an optional modifier (boolean) to stop the no more bennies left notification. It defaults to true.

## [1.1.0] - 2022-11-03
### Added
- Highly automated Fear Table macro. Various effects are applied to te selected targets depending on the result of the table.
- - You need to select the cause of the fear, the macro will try to find the Fear modifier for it.
- - Target all of those tokens who were unable to make their spirit roll and the macro will roll on the fear table for each and applies the appropriate effects.
- Added Heart Attack removal to the Personal healing Centre macro.
- New API functions: `swim.shake(token)` and `swim.stun(token)` which adds Shaken and Stunned respectively and plays the appropriate SFX.
### Changed
- **Breaking**: The Fear Table macro now requires exactly one token to be selected and one or more to be targeted.
- Made the callback functions (rolls to unshake, unstun and Bleeding out) optional.
- Added more SWIM compendiums to the toc block list.

## [1.0.0] - 2022-10-31
### Added
- New Setting that lets users choose to use the SWD unshake rules. If this setting is active...
- - ... SWIM will disable the adjust Pace with Wounds Setting and
- - puts an effect to Shaken that halves the actors Pace.
- SWIM now overwrites the callback functions of effects in SWIM, meaning it will initiate its own functions when the character is Shaken, Stunned or Bleeding Out. You are notified about that on your turn.
- A way to add a bonus to unstun rolls using Active Efects. To use it create an active effect with the attribute key `SWIM.unStunMod` (case sensitive), the change mode `Add` and a value of your choosing. A bonus must not have a `+` in front of the number, a penalty needs a `-` in front of the number.
- If the Summoner has the Command edge, the Fervor and/or the Hold the Line! edge, the summoner will add an AE to the summoned creature which respects that.
- New translation strings and extended localization of the module.
- New API function which returns all contents of a folder and its sub-folders up to three layers deep.
- On startup SWIM will check if the actor folder compendium is in the systems block toc list and if not prompt a dialogue to add it as otherwise the folders are invisible.
- Add button in the header of items and actors that opens a SWIM configuration window (@loofou).
- - The button is accessible by the GM and optionally by players (see settings).
- - The data will be saved no matter if you hit save or the close button to prevent accidental data loss.
- - Along with this comes a new way of storing data, menaing that existing actor and item configurations using additional stats would break, so...
- - a migration script is provided that goes through all actors and items of a world (but not compendiums) and updates them to this new way of storing data.
- - all items and actors not covered by the script (i.e. because they're in a compendium or imported later) are migrated as soon as the SWIM config button is pressed. (In this case the actor and all its items are migrated at once or only the item if the button is pressed on the item.) The migration will also start as soon as the new data is needed (i.e. when using a macro that tries to accesses the new stuff on an actor or item.)
- - The migration function is also exposed in case it is needed. See [the wiki](https://github.com/SalieriC/SWADE-Immersive-Macros/wiki/API#run-migration) for more information.
- Added the `get_weapon_sfx` api function to get the sfx from the flags of a weapon.
- Added file pickers for more SFX to actors (becoming stunned, gaining and loosing fatigue).
- Soak Damage macro should now play the death SFX on a perish result.
- A configuration for actors that lets users select a pronoun for each character and NPC. 
- Better BRSW integration: The global actions SWIM needs to function with BRWS together are now set up automatically. Please delete those from SWIM you've set up earlier.
### Changed
- **Breaking:** Changed the API so that the Unshake macro gets the version from the settings rather than being passed to the function. This means that the Unshake macro needs to be replaced by the one in the SWIM compendium.
- - Added a detailed error message explaining the problem in case the old version of the macro is used.
- Adjusted property paths to support FoundryVTT v10.
- SWIM now completely ignores the death flag featured in Health Estimate. Instead the proper incapacitation icon will be set in the Health Estimate settings when the game starts and HE is installed. As a result, HE is not a dependency any longer, though still strongly suggested.
- Adjusted manifest to reflect the FVTT v10 requirements.
- Changed some translation strings.
- Removed settings-extender.js and moved to the regular dependency structure suggested by the lib now.
- A creature summoned with a raise will now receive a max wound in addition to its current max wounds instead of setting it fixed to one. This should cover the Fantasy Companion where some summonable creatures already are resilient.
- General cleanup of code.
- Changed the `get_actor_sfx` api function to get the sfx from the flags instead of the additional stats.
- Ammo Management completely overhauled (@loofou):
- - Refactored the macro completely and added a new design to the dialogue. It now should display the proper options depending on selection (shooting or reloading)
- - Implement Ammo ActiveEffect system: Ammo that has an Active Effect assigned to it using the SWIM configuration on the ammo item, is applying the effect on the actor if the ammo is loaded. The effect is removed when the ammo is unloaded.
- - Ammo management now uses the audio from the SWIM config instead of additional stats as well as other configurations.
- Renamed the module to "SWADE Immersion Module". It describes better what it is now and keeps the cool abbreviation.
### Fixed
- Fixed a bug in the effect builder that didn't set maintainedPowers additional stat up when the caster was also the target.
- Fixed a bug in the Shape Changer that rendered the ignore size rule setting useless (thanks @jdavasligil).
- Fixed a bug when holding which resulted on having the combat tracker focus on top of the tracker instead of the token which should have its turn.
- Fixed a bug that created a second result chat message when an actor rolled a critical failure to unstun.
- Fixed a bug that caused a duplicate dialogue when using the token vision macro.
- Fixed a massive bug that caused a freeze scenario in the fall damage macro in FVTT v10.
- Fixed a bug in the Power Effect Builder that applied Distracted twice on Confusion instead of Distracted and Vulnerable.
- Power Effect Builder is now able apply multiple instances of Protection, Smite, Boost and Lower.
- Typo in the Loot-o-Mat.
### Known Issues
- Holding still breaks on first round of combat but I have no clue why.
- The Shape Changer macro throws a lot of errors when merging. Line 235, 350 and 365 where disabled to prevent that until further investigation. That means that the token merging / blending feature is disabled for now. It otherwise works as it should. The feature will be reindtroduced once the issue was found.
### Removed
- Unshake macros from the compendium were removed and unified into a single macro since the version is now drawn from the settings.
- Removed v10 update warning.
### Deprecated
- Old macros deprecated from the repo. They are still available in a zip file in case s/o wants to check them out.
- Ways to get data from additional stats were completely removed. A migration is provided.

## [0.18.5] - 2022-08-14
### Added
- Soak damage now also handles Bleeding Out rolls.
### Changed
- The `play_sfx` function now accepts a boolean to determine whether the SFX should be played for everyone (true) or just the current user (false). It defaults to true.
### Fixed
- Falling damage now caps at 10d6+10.

## [0.18.4] - 2022-07-22
### Added
- Added FVTT card deck support for the chase setup (thanks a lot @mafamac).
### Fixed
- Two bugs in the PEB that caused either not applying additional changes to protection or not adding it at all.
- Falling damage didn't explode.

## [0.18.3] - 2022-06-13
### Added
- Mighty Summoner: Maintenance Active Effects. Upon summoning a creature, the summoned creature and the summoner will gain an active effect containing the duration and some additional data from SWIM. If either of those effects ands and is deleted, the summoned creature will be dismissed. This works both ways. If the no power point setting is chosen, the duration of the power is near infinite and the maintenance AE on the caster incurs a penalty to the skill as per the no power point setting rule.

## [0.18.2] - 2022-06-11
### Added
- Translation update for german language via weblate.
### Changed
- Changed the global actions for invisibility to also cover detect arcana (@grendel111111).
- Changed the PEB to cover the new Deflection rules and new global actions to automate it in BR2.
### Fixed
- Another faulty translation string in the PHC.
- PHC now passes the correct healed wounds amount to the injury removal function when using generic healing. (It passed the wound value instead of the amount of healed wounds causing it to remove combat injuries if no wounds were healed.)
- PEB now properly applies changes to `maintainedPowers` additional stats if found. This was buggy as of yet.

## [0.18.1] - 2022-05-21
### Added
- Added a setting that disables the rank requirement for players when using the Shape Changer.
- Other option for the Power Effect Builder that allows setting up powers and maintaining them even if they're not (yet) added in the PEB. This (currently) doesn't offer the ability to set up any changes (will be added in a future version).
- New Translation Strings.
### Changed
- The Power Effect Builder now works even if GM and player are not on the same scene.
### Fixed
- Missing translation string in Effect Builder.
- Faulty translation String in the Personal Health Centre.
- Fixed a bug in the ammo management that prevented reloading.
- Fixed a critical bug in the Power Effect Builder.

<a href="https://ko-fi.com/salieric"><img style="border: 0px; display: block; margin-left: auto; margin-right: auto;" src="https://www.ko-fi.com/img/githubbutton_sm.svg" width="223" height="30" /></a>

## [0.18.0] - 2022-05-09
### Added
- Mighty Summoner: Summoned Creatures now get an Active Effect with the appropriate duration. Duration is doubled if the summoner has the Concentration Edge.
- Various new assets (see ReadMe for credits, all altered by SalieriC#8263):  
- New translation strings.
- New Setting rule: No Power Points. This enables near-infinite duration and a -1 to the spellcasting roll on the caster. SWIM does not use the systems setting rule in case that gets changed to do other things as well.
- New Macro: Power Effect Builder. Opens a dialogue to add active effects for almost all maintained core powers. This makes heavy use of the new effect updater by SUCC. **Make sure to update SUCC, unless you want total carnage.**

<details>
<summary>Currently supported Powers</summary>

- - Added boost/lower trait to Power Effect Builder.  
- - Added protection to Power Effect Builder.  
- - Added smite trait to Power Effect Builder.  
- - Added growth/shrink to Power Effect Builder.  
- - Added sloth/speed to Power Effect Builder. 
- - Added Beast Friend to Power Effect Builder.   
- - Added Invisibility to Power Effect Builder.  
- - Added Confusion to Power Effect Builder.
- - Added Deflection to Power Effect Builder.
- - Added Arcane Protection to Power Effect Builder.
- - Added Burrow to Power Effect Builder.
- - Added Damage Field to Power Effect Builder.
- - Added Darksight to Power Effect Builder.
- - Added Detect/Conceal Arcana to Power Effect Builder.
- - Added Disguise to Power Effect Builder.
- - Added Environmental Protection to Power Effect Builder.
- - Added Farsight to Power Effect Builder.
- - Added Fly to Power Effect Builder.
- - Added Intangibility to Power Effect Builder.
- - Added Mind Link to Power Effect Builder.
- - Added Puppet to Power Effect Builder.
- - Added Slumber to Power Effect Builder.
- - Added Silence to Power Effect Builder.
- - Added Speak Language to Power Effect Builder.
- - Added Wall Walker to Power Effect Builder.
- - Added Warrior's Gift to Power Effect Builder.
- - Added Empathy to Power Effect Builder.
- - Added Elemental Manipulation to Power Effect Builder.
- - Added Blind to Power Effect Builder.
</details>  

- - Enabled near-infinite duration on powers if no power points setting rule active.
- - Add an AE to the caster if he is not the target, that gives the casters spellcasting trait a -1 for maintaining the power if the power is found and no power points is active. In case no power points is not used, an AE is added to the caster (if the power is found) thats sole purpose is to track and cancel maintained powers.
- - If there is no active combat, start round of the effects will be set to 0 which ensures that the duration will work if combat starts while the AE is applied.
- If a power effect is set up using the power effect builder, the caster gains the ability to delete the AE on all actors he previously added it to. That means if the caster drops the power (or the duration runs out) it will be dropped on each actor, giving full control over maintenance to the player.
- Localisation for:
- - Fear Table function.
- - Mark Dead function.
- Various new localisation strings.
- New setting to check single reload by default.
- Make tokens invisible (no player owner) or half transparent (player owner) when the invisibility condition is applied.
- Make tokens slightly less visible if an effect called "Intangibility" (or their localised counterpart) is applied.
- Token Vision macro opens up if the torch condition is applied or removed.
- The Holding condition makes the token indeed holding in the combat tracker. Removing the condition prompts the player with a dialogue to choose between acting now or after current turn. The initiative is then set appropriately. This gives the player more control over their own initiative and alleviates GM workload.
- On world load SWIM will set the round time to 6 seconds as appropriate to the setting. This is a temporary implementation and will be removed as soon as the system covers this by itself.
- Added plea for support on SWIM config menu.
### Changed
- Incapacitation and Bleeding Out are added as overlays instead of small icons now. Inc. will be set as small icon if Bleeding Out is applied.
- Changed and fixed Deviation link to be future proof.
### Fixed
- Various errors in the personal health center that prevented chat messages from being created.
- Incorrectly named translation string.
- Fixed a bug in the ammo management where single reloading a weapon which is full would overflow the weapons capacity.
- Fixed a bug that caused weapons which do not require reloading actions to reload anyway.
- Fixed a bug that prevented the removal of Shaken if all Wounds were soaked.  

## [0.17.1] - 2022-04-27
### Fixed
- Faulty Translation string in Ammo Management (@Razortide)  

## [0.17.0] - 2022-04-21
### Added
- Combat Setup Button in the Token Actions:
- - Automatically adds all tokens on the current scene to the combat tracker (excluding NPCs which are incapacitated)
- - Automatically starts combat, drawing initiative for all tokens and sets the turn to the first token
- Settings to define a combat playlist which starts when combat starts
- When combat starts, all playlists are stopped
- - There is a way to define a folder in the settings which holds playlists that are never stopped on combat start.
- Added Macro Option tab in SWIM configuration window.
- Added ability for Shape Change function to have the token be a larger size on a raise. The scale multiplier is a configurable option in the Macro Option tab (@pmoore603).
- Added constants.js file as a central repository for constant values (@pmoore603).
- Dismiss function for the Mighty Summoner: If the selected token is a summoned creature, the owner (and GMs) can choose to dismiss it instead of summoning a new creature.
- Token Vision now supports custom (and preset) light colours.
- Started localization of some macros (@Razortide). This is far from being finished and a long-term project but there will be some amount of process in future releases until it's all done.  
- New sound effect for use in the token vision.
### Changed
- Enhanced Shape Change function to morph changing token into each other by growing/shrinking size and opacity (alpha) of both tokens as needed (@pmoore603).
- - This can be configured (and disabled) in the settings.
- Enhanced numeric input handling for SWIM configuration. Allows number input fields to have min, max, and step fields, which allows fields to be range and precision (decimal places) checked (@pmoore603).
- Token Vision now enables non-GMs to edit their vision type.
### Fixed
- Corrected an issue in the Shape Change function where temporary preset actors were incorrectly cleaned up. The issue happened when the player transforms into the same creature twice (or more) in a row (@pmoore603).

## [0.16.0] - 2022-04-03
### Added
- Common Bond function to give a Benny from one token to another.
- Free Reroll to the Radiation Centre macro if the Soldier Edge is found.
- Added warnings to some functions to install Helath Estimate if it is not installed.
- Localisation for Edges and Abilities. The module should now be *functional* in other languages. Please note that a lot of texts are still not localised. This is a lengthy process that will be done bit by bit over the course of the following months. New functionality will be fully localised however.
- Added Coup (50 Fathoms) to the benny checker.
- Added SFX to execute when BR2 sends the unshake hook.
- Added SFX player to the API.
- Added default volume option to the settings.
- Mighty Summoner macro that summons a creature selected by the user.  
- Soak Damage now allows for Incapacitation rolls and applies appropriate injuries.
- PHC can heal Wounds and remove fatigue for non-owned tokens/actors in the Personal Health Centre (PHC).
- PHC offers a way to use the Healing *skill* in combat to remove Bleeding Out and/or Inc but not Wounds (important because healing Wounds takes ten minutes, stabilising however is an Action).
- PHC now removes combat injuries and those from Incapacitation (unless they are permanent).
- PHC now removes Bleeding Out before and Incapacitation with Wounds.
- PHC now removes the Health Estimate flag if Incapacitated.
- Shape Changer now copies the permission settings from the original actor to give the player owner permissions.
- Shape Changer adds focus to new token.
### Changed
- Refactored the shape changer script to a few less lines (@pmoore603).
- Shape changer now makes the newly created actor the same `type` as the original. This means that PCs will change into PCs and NPCs will change into NPCs, no matter what the preset type is. This is important for the Joker's Wild setting rule to work properly.
- GMs are now able to access all shape change sizes instead of only those the characters rank permits.
- The injury table results are no longer checked with case sensitive translation strings.
### Fixed
- Radiation Centre will now inform about Benny use.
- Small fix in shape changer that will hopefully update the combat.
- Combat injuries were not properly applied in soak damage.
- A bug that caused the PHC to break because of a faulty setting string.
- A leftover variable declaration in the shape changer caused it to fail when trying to play the VFX if executed by a non-GM.
- Fixed missing variable exception error when shape changing (@pmoore603).
- Shape changer now adds elevation of the original token to the newly created token (thanks @pmoore603 for spotting this).
- Shape changer now creates the new actor in the proper folder even if executed by non-GM.
- Shape changer dialogue now gets the proper div class.
- Unstun doesn't remove prone but now properly removes stunned on a raise (thanks @Razortide for spotting).
- Macros now have the proper icons from SUCC.
### Languages:
- English
- German (@Razortide)

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
