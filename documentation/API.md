# SWIM API
As of version 0.15.0 SWIM features an ever expanding API which allows users to make use of some of its functions. Especially worth mentioning being all the (former) macros SWIM had. These are now backed into the module directly and their functions are exposed, meaning you can access them in macros and your own module directly.  

## Helper Functions
Especially useful for macro and module devs may be the following helper functions:

### Get Macro Variables
Macros get a number of variables from FVTT core directly, namely `speaker`, `character`, `actor` and `token`. These are usually not available in other contexts however which is why SWIM offers a simple way to get them:  
`swim.get_macro_variables()`  
Returns the four variables available in script macros. Best used like this:  
`const { speaker, character, actor, token } = await swim.get_macro_variables()`  

### Critfail Check
Checks if a roll made was a critical failure.  
`swim.critFail_check(wildcard, roll)`
- `wildcard` {boolean}: Wild Card status of the character that made the roll. If `false` it will make another roll `1d6x` according to the SWADE core rules, if `true` the script will just compare the both dice.  
- `roll` {object}: The roll that was made and needs to be checked for a critfail.  
It returns `true` in case of a critfail or `false` if not.  
**Warning:** Currently doesn't support rolls with multiple trait dice. Feeling advantures? Make a Pull Request to fix it. =)  

### Get Benny Image
Returns the file path of the *back side* of the benny configured in the SWADE core settings.  
`swim.get_benny_image()`

### Check Bennies
Checks the passed token for available Bennies.  
`swim.check_bennies(token)`
- `token` {object}: The token you want to check for Bennies.  
Returns `{ tokenBennies, gmBennies, totalBennies }`.  
- `tokenBennies` {number}: The amount of Bennies the *token* has.  
- `gmBennies` {number}: The amount of Bennies the *GM* has, *if* the function is executed from a GMs account.  
- `totalBennies` {number}: The amount of Bennies the *player* has for that specific token (token Bennies + GM Bennies if executed by a GM).
It assumes that non Wild Cards have 0 Bennies and checks for `Luck` and `Great Luck` set up as Edges to apply additional Bennies. You have more Edges/Special Abilities that add Bennies? Create an issue and I'll include them.  

### Spend Benny
Checks for avvailable Bennies first (see above) and spends one if available. If the token has none and the player is a GM, it spends a GM Benny.  
`swim.spend_benny(token, message)`  
- `token` {object}: The token for which a Benny shall be spent.  
- `message` {boolean}: If `true` a chat message will be created that notifies about the spent Benny.
Note that the game will show the benny flip if DiceSoNice! is active.  

### Is First GM
Checks whether or not the player in question is the first GM that is logged in and returns `true` if that is the case.  
`swim.is_first_gm()`  
This is especially useful for developers who want to relay some code to GMs to execute code that cannot be executed by player accounts (i.e. to alter actors the player does not own). The function effectively prevents execution of the code multiple times if more than one GM is logged in.  

## Feature Functions
The following functions present the core features of SWIM. They are probably less useful for macro and module devs but presented here anyway in case you want to utilise them.  
Note that all of them except the BR2 ones get the macro variables (see above) first, so they really only work on selected token(s). The BR2 ones need the BR2 variables passed to function.  