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