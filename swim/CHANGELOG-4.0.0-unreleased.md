# SWIM 4.0.0 (Foundry v14) - [Unreleased]

> Release 3.0.0 = everything in `CHANGELOG-unreleased.md` (the v11 revival). This file collects the changes made while porting SWIM to Foundry v14 (SWADE 6.x).
> Same style as the 3.0.0 file: Added / Fixed / Changed / Removed, sub-bullets as `- -`.

## [Unreleased]

### Changed
- Requires Foundry VTT v14 and SWADE 6.x. Support for Foundry v11 is dropped.

- Active Effects are created in Foundry v14 / SWADE 6 format (changes with a type, image, duration with expiry). All of SWIM's effects (powers, injuries, fear, conditions, ammo, auras) are written this way.
- Movement uses SWADE 6's new pace (`system.pace`): Speed/Sloth now multiply the pace instead of setting a fixed value, Shaken with SWD Unshake halves it, leg injuries and Panicked read the new running die and modifier.
- All SWIM windows run on Foundry's current window framework (ApplicationV2); the welcome and Better Rolls dialogs use Foundry's new dialog class. Look and behaviour stay the same.
- Uses Foundry v14's own APIs for sound, text enrichment, file picking and textures.

### Fixed
- Automatic vision no longer copies the values of a Darksight/Light effect into the token itself.
- Better Rolls 2: Backlash on a critical failure and the BR2 ammo usage read the current Better Rolls card data again (they used field names that no longer exist).
- The Raise Calculator / Combat Setup buttons were added twice if the setting was switched on again.
- Leg injuries from Better Rolls: the Slow effect now gets all its changes (previously only the last one was applied).

- SWIM's settings (Scene Illumination, Auras) are added to Foundry v14's scene and effect sheets, the toolbar buttons and the "SWIM" button of actor and item sheets use v14's new interfaces (the SWIM button is now in the sheet's window menu).

### Removed
- Active Token Effects (ATL) is no longer needed; light and vision effects use Foundry's own token effects.

## Bug batch (first v14 test)
- Chase Setup / Craft Campfire: tile textures are anchored in the centre by default in v14; cards and the campfire now use `anchorX/anchorY: 0`. Obsolete tile fields (`overhead`, `z`, `roof`, `occlusion.mode`) removed.
- Aura tab in the Active Effect config shows its label again.
- Combat Setup: grouped tokens are now put into real SWADE 6 Combatant Groups (leader set on the group).
- Effect Builder: missing icons (boost, lower, protection, smite, fly, light) now use SUCC / SWIM assets that exist.
- Shape Changer: changing the actor type works in v14 (ForcedReplacement of `system`).
- Craft Campfire: texture rotation removed (it pivoted around the top-left anchor and shifted the image); the tile's own random rotation stays.
- Craft Campfire: tile is now centre anchored (x/y = picked point), so it sits exactly on the cursor and rotates around its centre.
- BRSW support: uses `game.brsw.addActions` (BRSW 5.19+; `add_actions` was only a deprecated alias that is gone in 5.33).
- Unshake / Unstun / Soak callbacks: SWIM re-registers them after BRSW's ready hook, so SWIM's macros run at turn start instead of BRSW's card.
- Fix: BRSW's API only exists after its ready hook; SWIM now waits for `brswReady` before adding its actions / callbacks.
