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