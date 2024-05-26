/*******************************************************
 * SWADE Immersive Macros (SWIM) constants file.
 * 
 * v. 1.0.0
 * By SalieriC
 ******************************************************/

// Update this whenever SWIM actor/item config changes:
export const CONFIG_VERSION = 2;

export const ALMOST_INVISIBLE = 0.1;
export const RAISE_SCALE_DEFAULT = 1.0;
export const RAISE_SCALE_MAX = 5.0;
export const RAISE_SCALE_MIN = 0.1;
export const CONFIG_WINDOW_WIDTH = 800;
export const CONFIG_WINDOW_HEIGHT = 600;
export const NUM_MORPHS_DEFAULT = 50
export const NUM_MORPHS_MIN = 0
export const NUM_MORPHS_MAX = 100

export const ITEM_CONFIG_WINDOW_WIDTH = 500;
export const ITEM_CONFIG_WINDOW_HEIGHT = 400;
export const TRAVEL_DEFAULTS_ARRAY = [
    {
        "id": "foot",
        "name": "SWIM.travelOption-foot",
        "speedPerHour": 3,
        "image": "modules/swim/assets/travel/foot.webp",
        "sfx": "modules/swim/assets/sfx/travel/footsteps-in-grass-slow-b-www.fesliyanstudios.com-edited.ogg"
    },
    {
        "id": "horse",
        "name": "SWIM.travelOption-horse",
        "speedPerHour": 3.75,
        "image": "modules/swim/assets/travel/horse.webp",
        "sfx": "modules/swim/assets/sfx/travel/horse-neighing-and-breathing-a-www.fesliyanstudios.com-edited.ogg"
    },
    {
        "id": "earlyCar",
        "name": "SWIM.travelOption-earlyCar",
        "speedPerHour": 25,
        "image": "modules/swim/assets/travel/earlyCar.webp",
        "sfx": "modules/swim/assets/sfx/travel/car-engine-starting-a1-www.fesliyanstudios.com-edited.ogg"
    },
    {
        "id": "modernCar",
        "name": "SWIM.travelOption-modernCar",
        "speedPerHour": 50,
        "image": "modules/swim/assets/travel/modernCar.webp",
        "sfx": "modules/swim/assets/sfx/travel/car-engine-starting-a1-www.fesliyanstudios.com-edited.ogg"
    },
    {
        "id": "sailingShip",
        "name": "SWIM.travelOption-sailingShip",
        "speedPerHour": 3.75,
        "image": "modules/swim/assets/travel/sailingShip.webp",
        "sfx": "modules/swim/assets/sfx/travel/ocean-waves-crashing-sound-effect-www.orangefreesounds.com-edited.ogg"
    },
    {
        "id": "steamShip",
        "name": "SWIM.travelOption-steamShip",
        "speedPerHour": 5,
        "image": "modules/swim/assets/travel/steamShip.webp",
        "sfx": "modules/swim/assets/sfx/travel/large-ship-air-horn-www.orangefreesounds.com-edited.ogg"
    },
    {
        "id": "modernShip",
        "name": "SWIM.travelOption-modernShip",
        "speedPerHour": 25,
        "image": "modules/swim/assets/travel/modernShip.webp",
        "sfx": "modules/swim/assets/sfx/travel/large-ship-air-horn-www.orangefreesounds.com-edited.ogg"
    },
    {
        "id": "highSpeedFerry",
        "name": "SWIM.travelOption-highSpeedFerry",
        "speedPerHour": 50,
        "image": "modules/swim/assets/travel/highSpeedFerry.webp",
        "sfx": "modules/swim/assets/sfx/travel/large-ship-air-horn-www.orangefreesounds.com-edited.ogg"
    },
    {
        "id": "steamTrain",
        "name": "SWIM.travelOption-steamTrain",
        "speedPerHour": 7.5,
        "image": "modules/swim/assets/travel/steamTrain.webp",
        "sfx": "modules/swim/assets/sfx/travel/steam-train-whistle-www.orangefreesounds.com-edited.ogg"
    },
    {
        "id": "modernPassengerTrain",
        "name": "SWIM.travelOption-modernPassengerTrain",
        "speedPerHour": 50,
        "image": "modules/swim/assets/travel/modernPassengerTrain.webp",
        "sfx": "modules/swim/assets/sfx/travel/subway-train-leaving-sound-effect-www.orangefreesounds.com-edited.ogg"
    },
    {
        "id": "propPlane",
        "name": "SWIM.travelOption-propPlane",
        "speedPerHour": 125,
        "image": "modules/swim/assets/travel/propPlane.webp",
        "sfx": "modules/swim/assets/sfx/travel/propeller-plane-flying-www.orangefreesounds.com-edited.ogg"
    },
    {
        "id": "commercialJet",
        "name": "SWIM.travelOption-commercialJet",
        "speedPerHour": 500,
        "image": "modules/swim/assets/travel/commercialJet.webp",
        "sfx": "modules/swim/assets/sfx/travel/airplane-sound-www.orangefreesounds.com-edited.ogg"
    }
]
export const DECK_OF_CARDS = [
    "Ace of Spades", "2 of Spades", "3 of Spades", "4 of Spades", "5 of Spades",
    "6 of Spades", "7 of Spades", "8 of Spades", "9 of Spades", "10 of Spades",
    "Jack of Spades", "Queen of Spades", "King of Spades",
    "Ace of Hearts", "2 of Hearts", "3 of Hearts", "4 of Hearts", "5 of Hearts",
    "6 of Hearts", "7 of Hearts", "8 of Hearts", "9 of Hearts", "10 of Hearts",
    "Jack of Hearts", "Queen of Hearts", "King of Hearts",
    "Ace of Diamonds", "2 of Diamonds", "3 of Diamonds", "4 of Diamonds", "5 of Diamonds",
    "6 of Diamonds", "7 of Diamonds", "8 of Diamonds", "9 of Diamonds", "10 of Diamonds",
    "Jack of Diamonds", "Queen of Diamonds", "King of Diamonds",
    "Ace of Clubs", "2 of Clubs", "3 of Clubs", "4 of Clubs", "5 of Clubs",
    "6 of Clubs", "7 of Clubs", "8 of Clubs", "9 of Clubs", "10 of Clubs",
    "Jack of Clubs", "Queen of Clubs", "King of Clubs", "Red Joker", "Black Joker"
  ];

export function get_compendiums_list(type) {
    const options = []

    // Get all packs:
    for (let pack of game.packs) {
        if (pack.documentName.toLowerCase() === type.toLowerCase() || type.toLowerCase() === 'any') {
            let option = {
                value: pack.collection,
                name: pack.title
            };
            options.push(option)
        }
    }

    // Sort packs by name:
    options.sort((a, b) => {
        const nameA = a.name.toUpperCase() // Convert to uppercase for case-insensitive sorting
        const nameB = b.name.toUpperCase()
        if (nameA < nameB) {
            return -1
        }
        if (nameA > nameB) {
            return 1
        }
        return 0 // Names are equal
    })

    // Add the "none" object at the first position:
    options.unshift({ value: 'none', name: game.i18n.localize('SWIM.none')})

    return options
}

export const SWID_POWER_LIST = {
    "arcane-protection": "arcaneProtection",
    "banish": "banish",
    "barrier": "barrier",
    "beast-friend": "beastFriend",
    "blast": "blast",
    "blind": "blind",
    "bolt": "bolt",
    "boostlower-trait": "boost",
    "burrow": "burrow",
    "burst": "burst",
    "confusion": "confusion",
    "damage-field": "damageField",
    "darksight": "darksight",
    "deflection": "deflection",
    "detectconceal-arcana": "detect",
    "disguise": "disguise",
    "dispel": "dispel",
    "divination": "divination",
    "drain-power-points": "drainPowerPoints",
    "elemental-manipulation": "elementalManipulation",
    "empathy": "empathy",
    "entangle": "entangle",
    "environmental-protection": "environmentalProtection",
    "farsight": "farsight",
    "fear": "fear",
    "fly": "fly",
    "growthshrink": "growth",
    "havoc": "havoc",
    "healing": "healing",
    "illusion": "illusion",
    "intangibility": "intangibility",
    "invisibility": "invisibility",
    "light-darkness": "light",
    "mind-link": "mindLink",
    "mind-reading": "mindReading",
    "mind-wipe": "mindWipe",
    "object-reading": "objectReading",
    "protection": "protection",
    "puppet": "puppet",
    "relief": "relief",
    "resurrection": "resurrection",
    "shape-change": "shapeChange",
    "slothspeed": "speed",
    "slumber": "slumber",
    "smite": "smite",
    "soundsilence": "sound",
    "speak-language": "speakLanguage",
    "stun": "stun",
    "summon-ally": "summonAlly",
    "telekinesis": "telekinesis",
    "teleport": "teleport",
    "wall-walker": "wallWalker",
    "warriors-gift": "warriorsGift",
    "zombie": "zombie"
}