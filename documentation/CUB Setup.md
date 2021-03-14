# Combat Utility Belt (CUB)
For details about CUB please [click here](https://foundryvtt.com/packages/combat-utility-belt/).  

# Setting up CUB
CUB is not bug free at all but the setup is rather easy once you know the drill.

## General Settings
Once installed *and activated* navigate to the game settings (the gears icon in the right sidebar) and click on "CUBPuter". then click on the arrow (>) next to "--Select a Gadget--". Select "Enhanced Conditions" and select the following option:  
<p align="center"> <img src="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/img/cub_setup/CUBPuter.jpg?raw=true"> </p>  
Click "Save Gadget Settings".  

## Triggler Settings
Navigate to the game settings (the gears icon in the right sidebar) and click on "Triggler". You want only "Simple Trigger" which is the default option, so let's carry on.  
You need to select Triggers for all conditions which have checkboxes on the character sheet, these are: Shaken, Distracted, Vulnerable, Stunned, Entangled and Bound.  
- **Category:** Select "status".  
- **Attribute:** Select "isShaken".  
- **Property 1:** You don't need that.  
- **Operator:** Select "=".  
- **Value:** Type "true" (without "").  
- **Property 1:** You don't need that.  
Click Save. Now change the "true" to "false" and click save. This will set up the trigger for Shaken and later enables us to add the condition icon to be shown on the token once the checkbox in the sheet is used (or one of the macros (de-)activates it).  
<p align="center"> <img src="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/img/cub_setup/CUBTriggler1.jpg?raw=true"> </p>  
Repeat the steps above for all conditions. Remember to *always click save* when you've set up one individual trigger. This is very important. When you click on "--Existing Triggers--" it should look like this (order doesn't matter):
<p align="center"> <img src="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/img/cub_setup/CUBTriggler2.jpg?raw=true"> </p>  
Click save just to be sure and close the window.  You are almost done.

## Condition Lab Settings
Navigate to the game settings (the gears icon in the right sidebar) and click on "Condition Lab". Here comes the easy part: Click on "import" at the top of the window. Choose the "cub-swade-condition-map.json" file in `modules/swim/assets/imports/` and import it (you can download it from this repo if you can't select the file on the server). If you have the core rules activated before importing most conditions will be linked already. This is not required though, but highly recommended if you own the core rules module.  
Now the Condition Lab should look like this:  
<p align="center"> <img src="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/img/cub_setup/CUBConditionLab1.jpg?raw=true"> </p>  
Now you need to set up the triggers. Remember the conditions from above? They are Shaken, Distracted, Vulnerable, Stunned, Entangled and Bound.  
Shaken is at the top. Click on "--No Apply Trigger Set--" and choose "status.isSkaken. = true". For "--No Remove Trigger Set--" choose "status.isSkaken. = false":  
<p align="center"> <img src="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/img/cub_setup/CUBConditionLab2.jpg?raw=true"> </p>  
Do this for all conditions mentioned above and be very careful to always choose "true" for "Apply" and "false" for "Remove".  
<p align="center"> <img src="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/img/cub_setup/CUBConditionLab3.jpg?raw=true"> </p>  
<p align="center"> <img src="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/img/cub_setup/CUBConditionLab4.jpg?raw=true"> </p>  
Now click save and you are done.  

## Optional: Active Effects  
You can set up Active Effects to the conditions if you want. For This click on the hand symbol <img src="https://github.com/SalieriC/SWADE-Immersive-Macros/blob/main/img/cub_setup/CUBAEs1.jpg?raw=true"> next to an condition in the Condition lab.  
The AE window opens. Click on "Effects" and click "+". Now you can set up an Active Effect. In the official Foundry discord server in the swade channel you can find a list of the most common effect keys (see the pinned messages). You can also import my JournalEntry* to have them in your world.  
When you want to set up multiple AEs on CUB, there is a bug where on clicking + the currenty entry disappears and no second one is created. Just click + again and everything will be fine.  
Do this for every condition you wish. I can't give away more precise explanations as I obviously don't want to give away more rulings than necessary. But you'll fiogure it out by looking at the keys and the conditions rulings.

*Go to the JournalEntry tab in the right sidebar, create a new JournalEntry (name doesn't matter) and once created right click on it, select import and choose this file: `modules/swim/assets/imports/fvtt-JournalEntry-Attribute_Keys_for_Active_Effects.json`.