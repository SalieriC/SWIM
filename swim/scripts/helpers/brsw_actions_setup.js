export async function brsw_actions_setup() {
    const brswAmmoMgm = game.settings.get('swim', 'br2ammoMgm')

    const SWIM_ACTIONS = [
        //Deflection:
        {
            "id": "TARGET-HAS-DEFLECTION-MELEE",
            "name": "Deflection (range)",
            "button_name": "has Deflection (ranged)",
            "skillMod": "-2",
            "and_selector": [
                {
                    "selector_type": "item_type",
                    "selector_value": "weapon"
                },
                {
                    "or_selector": [
                        {
                            "selector_type": "skill",
                            "selector_value": "Shooting"
                        },
                        {
                            "selector_type": "skill",
                            "selector_value": "Athletics"
                        }
                    ]
                },
                {
                    "or_selector": [
                        {
                            "selector_type": "target_has_effect",
                            "selector_value": "Deflection (range)"
                        },
                        {
                            "selector_type": "target_has_effect",
                            "selector_value": "Deflection (raise)"
                        }
                    ]
                }
            ],
            "defaultChecked": "on",
            "group": "Target"
        },
        {
            "id": "TARGET-HAS-DEFLECTION-RANGED",
            "name": "Deflection (melee)",
            "button_name": "has Deflection (melee)",
            "skillMod": "-2",
            "and_selector": [
                {
                    "selector_type": "item_type",
                    "selector_value": "weapon"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Fighting"
                },
                {
                    "or_selector": [
                        {
                            "selector_type": "target_has_effect",
                            "selector_value": "Deflection (melee)"
                        },
                        {
                            "selector_type": "target_has_effect",
                            "selector_value": "Deflection (raise)"
                        }
                    ]
                }
            ],
            "defaultChecked": "on",
            "group": "Target"
        },
        /*
        {
            "id": "DEFLECTION-RANGE",
            "name": "Deflection (range)",
            "button_name": "has Deflection",
            "skillMod": "-2",
            "and_selector": [
                {
                    "selector_type": "item_type",
                    "selector_value": "weapon"
                },
                {
                    "or_selector": [
                        {
                            "selector_type": "skill",
                            "selector_value": "Athletics"
                        },
                        {
                            "selector_type": "skill",
                            "selector_value": "Shooting"
                        }
                    ]
                },
                {
                    "selector_type": "target_has_effect",
                    "selector_value": "Deflection (range)"
                },
                {
                    "not_selector": [
                        {
                            "or_selector": [
                                {
                                    "selector_type": "target_has_effect",
                                    "selector_value": "Deflection (melee)"
                                },
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
                    ]
                }
            ],
            "defaultChecked": "on",
            "group": "Target"
        },
        {
            "id": "DEFLECTION-MELEE",
            "name": "Deflection (melee)",
            "button_name": "has Deflection",
            "skillMod": "-2",
            "and_selector": [
                {
                    "selector_type": "item_type",
                    "selector_value": "weapon"
                },
                {
                    "selector_type": "skill",
                    "selector_value": "Fighting"
                },
                {
                    "selector_type": "target_has_effect",
                    "selector_value": "Deflection (melee)"
                },
                {
                    "not_selector": [
                        {
                            "or_selector": [
                                {
                                    "selector_type": "target_has_effect",
                                    "selector_value": "Deflection (range)"
                                },
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
                    ]
                }
            ],
            "defaultChecked": "on",
            "group": "Target"
        },
        {
            "id": "DEFLECTION-RAISE",
            "name": "Deflection (raise)",
            "button_name": "has Deflection",
            "skillMod": "-2",
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
                            "or_selector": [
                                {
                                    "selector_type": "target_has_effect",
                                    "selector_value": "Deflection (range)"
                                },
                                {
                                    "selector_type": "target_has_effect",
                                    "selector_value": "Deflection (melee)"
                                },
                                {
                                    "selector_type": "target_has_effect",
                                    "selector_value": "Maintaining Deflection"
                                }
                            ]
                        }
                    ]
                }
            ],
            "defaultChecked": "on",
            "group": "Target"
        },
        */
        //Arcane Protection:
        {
            "id": "ARCANE_PROTECTION",
            "name": "Arcane Protection",
            "button_name": "has Arcane Protection",
            "skillMod": "-2",
            "dmgMod": "-2",
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
                        }
                    ]
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
        },
        {
            "id": "ARCANE_PROTECTION-RAISE",
            "name": "Arcane Protection (raise)",
            "button_name": "has Arcane Protection",
            "skillMod": "-4",
            "dmgMod": "-4",
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
        },
        //Empathy:
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
        },
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
        },
        //Invisibility:
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
                        }
                    ]
                },
                {
                    "not_selector": [
                        {
                            "selector_type": "target_has_effect",
                            "selector_value": "Maintaining Invisible"
                        }
                    ]
                }
            ],
            "defaultChecked": "on",
            "group": "Target"
        },
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
                        }
                    ]
                },
                {
                    "selector_type": "target_has_effect",
                    "selector_value": "Invisible (raise)"
                },
                {
                    "not_selector": [
                        {
                            "selector_type": "target_has_effect",
                            "selector_value": "Maintaining Invisible"
                        }
                    ]
                }
            ],
            "defaultChecked": "on",
            "group": "Target"
        },
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
                },
                {
                    "not_selector": [
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
    ]

    if (brswAmmoMgm === 'full' || brswAmmoMgm === 'sfx') {
        SWIM_ACTIONS.push(
            //Ammo Management:
            {
                "id": "SWIM-AMMO-MGM",
                "name": "SWIM: Ammo usage",
                "button_name": "SWIM: Ammo usage",
                "runSkillMacro": "SWIM: Ammo usage",
                "selector_type": "item_type",
                "selector_value": "weapon",
                "defaultChecked": "on",
                "group": "SWIM Macros"
            },
        )
    }

    game.brsw.add_actions(SWIM_ACTIONS)
}