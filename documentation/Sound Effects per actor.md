# Sound Efects per actor
SWIM enables you to have different sound effects (SFX) for each actor in your game. Utilising this you can make a dying goblin sound different than a dying dragon for example.  

## Setting up actor SFX
Setting sound effects up is easy:
1. Navigate to the SWADE system settings and open the Setting Configuration Options.
2. Click on the Additional Stats tab.
3. Create a new additional stat for actors.
4. The Stat Key *must* be "sfx" (without quotation marks, and all lower case). Name may be anything, Data Type *must* be "Text".
5. Save your changes.
  
Now, you can enable this additional stat on any actor in your game world. In the resulting text field paste the SFX file paths modified like so:
`path/to/injuredSFX.ogg|path/to/deathSFX.mp3|path/to/unshakeSFX.ogg|path/to/soakSFX.mp3|`
File extension can be anything a sound file can be, `.mp3` and `.ogg` are just examples. File paths need to be relative to your data folder (when in doubt use a new playlist file to find the file path). The file paths *must* be seperated by the pipe symbol `|`.  
I hope to find a way to set up the sounds in a more user friendly way in the future, if I do, I'll write a migration script so non of your set up now will be in vain.  

## Using actor SFX
The SFX will be found automatically when using the macros (i.e. the Unshake macro) and played accordingly. If the SFX for a specific actor is set up, it will overwrite the standard settings in the SWIM configuration. If you don't set the file paths up, SWIM will use its default values.

## Where do I get so many SFX?
That's the difficult part here. I suggest looking at mods for various games. You're often free to use these which come with the mod, for private purposes at least. But please check if you are allowed to do so first. I cannot be held responsible for your failure to check permissions that may or may not be granted to you.