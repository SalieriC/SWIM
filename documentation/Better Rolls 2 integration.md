# Better Rolls 2 integration
SWIM is set up to be compatible and even enhance (Better Rolls 2 for Savage Worlds)[https://foundryvtt.com/packages/betterrolls-swade2] (BR2) from ground up. It is currently not possible to initiate rolls like the one from the Unshake macro but other than that, there are several things you can do to make BR2 und SWIM work together in harmony.  

## Introducing Effect Builder to BR2
As of SWIM version 0.18.0, there is a mighty power(ful) effect builder in SWIM. It can set up a lot of Active Effects (AEs) with their appropriate duration, including those which usually can't be automated, for example Deflection. These are then just empty AEs only there to track the duration of the power. With Better Rolls 2 however you can make the AEs a lot more powerful by setting up (World Global Actions)[https://github.com/javierriveracastro/betteroll-swade/blob/version_2/docs/global_actions.md].

### Automating Deflection
You'll need two World Global Actions for this, set them up like this:  
```json
{
    "id": "DEFLECTION",
    "name": "Deflection",
    "button_name": "has Deflection",
    "skillMod": "-2",
    "and_selector": [
        {
            "selector_type": "item_type",
            "selector_value": "weapon"
        },
        {
            "selector_type": "target_has_effect",
            "selector_value": "Deflection"
        },
        {
            "not_selector": [
                {
                    "selector_type": "target_has_effect",
                    "selector_value": "Deflection (raise)"
                }
            ]
        }
    ],
    "defaultChecked": "on",
    "group": "Target"
}
```

and this:  

```json
{
    "id": "DEFLECTION-RAISE",
    "name": "Deflection (raise)",
    "button_name": "has Deflection",
    "skillMod": "-4",
    "and_selector": [
        {
            "selector_type": "item_type",
            "selector_value": "weapon"
        },
        {
            "selector_type": "target_has_effect",
            "selector_value": "Deflection (raise)"
        }
    ],
    "defaultChecked": "on",
    "group": "Target"
}
```
Those two will ensure that BR2 automatically subtracts the appropriate amount (-2 and -4 respectively) from attack rolls that are from weapon type items. As per the SWADE core rules this should be everything. Certain powers *could* fall under that rule but that is left unclear in the rules. If you want to include the *bolt* power for example you can easily do this by adding the following *inside* the `and_selector`:  
```json
{"selector_type":"item_name",
"selector_value":"bolt"},
```
Place it just after the `,` below `weapon`. I would advice against it however. It introduces several problems:  
1. It won't catch custom power names (which are encouraged to do by the rules) and
2. the rules are very unclear about it and it likely would come down to the setting.  

Thanks @grendel111111 for helping with the World Global Actions.