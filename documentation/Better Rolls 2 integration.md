# Better Rolls 2 integration
SWIM is set up to be compatible and even enhance (Better Rolls 2 for Savage Worlds)[https://foundryvtt.com/packages/betterrolls-swade2] (BR2) from ground up. It is currently not possible to initiate rolls like the one from the Unshake macro but other than that, there are several things you can do to make BR2 und SWIM work together in harmony.  

## Introducing Effect Builder to BR2
As of SWIM version 0.18.0, there is a mighty power(ful) effect builder in SWIM. It can set up a lot of Active Effects (AEs) with their appropriate duration, including those which usually can't be automated, for example Deflection. These are then just empty AEs only there to track the duration of the power. With Better Rolls 2 however you can make the AEs a lot more powerful by setting up (World Global Actions)[https://github.com/javierriveracastro/betteroll-swade/blob/version_2/docs/global_actions.md].  
Below is a list of global actions provided to you.  

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
                },
                {
                    "selector_type": "target_has_effect",
                    "selector_value": "Maintaining Deflection"
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
        },
        {
            "not_selector": [
                {
                    "selector_type": "target_has_effect",
                    "selector_value": "Maintaining Deflection"
                }
            ]
        }
    ],
    "defaultChecked": "on",
    "group": "Target"
}
```
Those two will ensure that BR2 automatically subtracts the appropriate amount (-2 and -4 respectively) from attack rolls that are from weapon type items. As per the SWADE core rules this should be everything.

### Automating Arcane Protection
It works exactly like the (in my experience much more common) Deflection setup above. Just paste these two:  
```json
{
    "id": "ARCANE_PROTECTION",
    "name": "Arcane Protection",
    "button_name": "has Arcane Protection",
    "skillMod": "-2",
    "and_selector": [
        {
            "selector_type": "item_type",
            "selector_value": "power"
        },
        {
            "selector_type": "target_has_effect",
            "selector_value": "Arcane Protection"
        },
        {
            "not_selector": [
                {
                    "selector_type": "target_has_effect",
                    "selector_value": "Arcane Protection (raise)"
                },
                {
                    "selector_type": "target_has_effect",
                    "selector_value": "Maintaining Arcane Protection"
                }
            ]
        }
    ],
    "defaultChecked": "on",
    "group": "Target"
}
```
  
```json
{
    "id": "ARCANE_PROTECTION-RAISE",
    "name": "Arcane Protection (raise)",
    "button_name": "has Arcane Protection",
    "skillMod": "-4",
    "and_selector": [
        {
            "selector_type": "item_type",
            "selector_value": "power"
        },
        {
            "selector_type": "target_has_effect",
            "selector_value": "Arcane Protection (raise)"
        },
        {
            "not_selector": [
                {
                    "selector_type": "target_has_effect",
                    "selector_value": "Maintaining Arcane Protection"
                }
            ]
        }
    ],
    "defaultChecked": "on",
    "group": "Target"
}
```
**Please note** that this will also affect friendly powers! Sadly there currently is no way to exclude friendly powers from it. This may change in the future so make sure to check back here frequently.

### Automating Empathy
As above, just for the empathy power this time.  
```json
{
    "id": "EMPATHY",
    "name": "Empathy",
    "button_name": "has Empathy",
    "skillMod": "+1",
    "and_selector": [
        {
            "or_selector": [
                {
                    "selector_type": "skill",
                    "selector_value": "Intimidation"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Persuasion"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Performance"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Taunt"
                }
            ]
        },
        {
            "selector_type": "target_has_effect",
            "selector_value": "Empathy"
        },
        {
            "selector_type": "actor_has_effect",
            "selector_value": "Maintaining Empathy"
        },
        {
            "not_selector": [
                {
                    "selector_type": "target_has_effect",
                    "selector_value": "Empathy (raise)"
                }
            ]
        }
    ],
    "defaultChecked": "on",
    "group": "Target"
}
```

```json
{
    "id": "EMPATHY-RAISE",
    "name": "Empathy (raise)",
    "button_name": "has Empathy (raise)",
    "skillMod": "+2",
    "and_selector": [
        {
            "or_selector": [
                {
                    "selector_type": "skill",
                    "selector_value": "Intimidation"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Persuasion"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Performance"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Taunt"
                }
            ]
        },
        {
            "selector_type": "target_has_effect",
            "selector_value": "Empathy (raise)"
        },
        {
            "selector_type": "actor_has_effect",
            "selector_value": "Maintaining Empathy"
        }
    ],
    "defaultChecked": "on",
    "group": "Target"
}
```

### Automating Invisibility
As above, just for the empathy power this time. It will also take the Detect Arcana effect into consideration, negating some of the penalties from invisible. Do accomplish this, three global actions are needed:  
```json
{
    "id": "INVISIBLE",
    "name": "Invisible",
    "button_name": "is Invisible",
    "skillMod": "-4",
    "and_selector": [
        {
            "or_selector": [
                {
                    "selector_type": "skill",
                    "selector_value": "Shooting"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Fighting"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Athletics"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Healing"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Notice"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Repair"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Thievery"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Faith"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Spellcasting"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Weird Science"
                },
                {
                    "selector_type": "item_type",
                    "selector_value": "weapon"
                },
                {
                    "selector_type": "item_type",
                    "selector_value": "power"
                }
            ]
        },
        {
            "selector_type": "target_has_effect",
            "selector_value": "Invisible"
        },
        {
            "not_selector": [
                {
                    "selector_type": "actor_has_effect",
                    "selector_value": "Detect Arcana"
                }
            ]
        },
        {
            "not_selector": [
                {
                    "selector_type": "target_has_effect",
                    "selector_value": "Invisible (raise)"
                },
                {
                    "selector_type": "target_has_effect",
                    "selector_value": "Maintaining Invisible"
                }
            ]
        }
    ],
    "defaultChecked": "on",
    "group": "Target"
}
```

```json
{
    "id": "INVISIBLE-RAISE",
    "name": "Invisible (raise)",
    "button_name": "is Invisible",
    "skillMod": "-6",
    "and_selector": [
        {
            "or_selector": [
                {
                    "selector_type": "skill",
                    "selector_value": "Shooting"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Fighting"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Athletics"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Healing"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Notice"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Repair"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Thievery"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Faith"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Spellcasting"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Weird Science"
                },
                {
                    "selector_type": "item_type",
                    "selector_value": "weapon"
                },
                {
                    "selector_type": "item_type",
                    "selector_value": "power"
                }
            ]
        },
        {
            "not_selector": [
                {
                    "selector_type": "actor_has_effect",
                    "selector_value": "Detect Arcana"
                },
                {
                    "selector_type": "target_has_effect",
                    "selector_value": "Maintaining Invisible"
                }
            ]
        },
        {
            "selector_type": "target_has_effect",
            "selector_value": "Invisible (raise)"
        }
    ],
    "defaultChecked": "on",
    "group": "Target"
}
```

```json
{
    "id": "INVISIBLE-RAISE (DET)",
    "name": "Invisible (raise) (DET)",
    "button_name": "is Invisible",
    "skillMod": "-2",
    "and_selector": [
        {
            "or_selector": [
                {
                    "selector_type": "skill",
                    "selector_value": "Shooting"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Fighting"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Athletics"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Healing"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Notice"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Repair"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Thievery"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Faith"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Spellcasting"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Weird Science"
                },
                {
                    "selector_type": "item_type",
                    "selector_value": "weapon"
                },
                {
                    "selector_type": "item_type",
                    "selector_value": "power"
                },
                {
                    "selector_type": "item_type",
                    "selector_value": "weapon"
                },
                {
                    "selector_type": "item_type",
                    "selector_value": "power"
                }
            ]
        },
        {
            "not_selector": [
                {
                    "selector_type": "actor_has_effect",
                    "selector_value": "Detect Arcana (Raise)"
                },
                {
                    "selector_type": "target_has_effect",
                    "selector_value": "Maintaining Invisible"
                }
            ]
        },
        {
            "selector_type": "target_has_effect",
            "selector_value": "Invisible (raise)"
        },
        {
            "selector_type": "actor_has_effect",
            "selector_value": "Detect Arcana"
        }
    ],
    "defaultChecked": "on",
    "group": "Target"
}
```

Thanks @grendel111111 for helping with the World Global Actions.