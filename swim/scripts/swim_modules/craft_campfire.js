/*******************************************
 * Craft Campfire
 * // v.0.0.1
 * By SalieriC#8263
 ******************************************/
export async function craft_campfire_script() {
    //Get asset:
    const campfireTextureLit = game.settings.get('swim', 'campfireImgOnName')
    //Collecting data from warpgate:
    const data = await warpgate.crosshairs.show({
        size: 1,
        icon: campfireTextureLit,
        label: "Campfire",
        drawOutline: false,
        drawIcon: true,
        interval: 0, //toggles grid snapping off
        tileTexture: false,
    })
}