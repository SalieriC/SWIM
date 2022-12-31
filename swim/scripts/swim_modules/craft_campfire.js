/*******************************************
 * Craft Campfire
 * // v.1.0.1
 * By SalieriC#8263
 ******************************************/
export async function craft_campfire_script() {
    //Get asset:
    const campfireTextureLit = game.settings.get('swim', 'campfireImgOn')
    //Collecting data from warpgate:
    const data = await warpgate.crosshairs.show({
        size: 1,
        icon: campfireTextureLit,
        label: "Campfire",
        drawOutline: false,
        drawIcon: true,
        //interval: 1, //toggles grid snapping off
        tileTexture: false,
        lockSize: true,
    })
    warpgate.event.notify("SWIM.craftCampfire", data)
    if (game.modules.get('monks-active-tiles')?.active) {
        ui.notifications.notify(game.i18n.localize("SWIM.notification.campfireCreated"))
    }
}

export async function craft_campfire_gm(data) {
    const scene = game.scenes.get(data.scene._id)
    const size = scene.grid.size
    const campfireTextureLit = game.settings.get('swim', 'campfireImgOn')

    //Create Light:
    const lightData = {
        "x": data.x,
        "y": data.y,
        "rotation": 0,
        "walls": true,
        "vision": false,
        "config": {
            "alpha": 0.4,
            "angle": 360,
            "bright": 4,
            "color": "#C98A76",
            "coloration": 1,
            "dim": 4.5,
            "attenuation": 0.5,
            "luminosity": 0.5,
            "saturation": 0,
            "contrast": 0,
            "shadows": 0,
            "animation": {
                "type": "torch",
                "speed": 5,
                "intensity": 6,
                "reverse": false
            },
            "darkness": {
                "min": 0,
                "max": 1
            }
        },
        "hidden": false,
    }
    const lights = await scene.createEmbeddedDocuments("AmbientLight", [lightData])
    const light = lights[0]

    //Create Light:
    const soundData = {
        "path": "modules/swim/assets/sfx/Campfire-sound-altered-Alexander-www.orangefreesounds.com.ogg.ogg",
        "x": data.x,
        "y": data.y,
        "radius": 4.5,
        "easing": true,
        "walls": true,
        "volume": 0.75,
        "darkness": {
            "min": 0,
            "max": 1
        },
        "repeat": false,
        "hidden": false
    }
    const sounds = await scene.createEmbeddedDocuments("AmbientSound", [soundData])
    const sound = sounds[0]

    //Create Tile:
    //Flags for Monks Active Tile Triggers:
    const mattFlags = {
        "active": true,
        "record": false,
        "restriction": "all",
        "controlled": "all",
        "trigger": [
            "",
            "dblclick"
        ],
        "allowpaused": false,
        "usealpha": true,
        "pointer": true,
        "pertoken": false,
        "minrequired": 0,
        "chance": 100,
        "fileindex": 0,
        "actions": [
            {
                "action": "playsound",
                "data": {
                    "audiofile": "modules/swim/assets/sfx/Fireball-Super-Quick-Whoosh-www.fesliyanstudios.com.ogg",
                    "audiofor": "all",
                    "volume": 1,
                    "loop": false,
                    "fade": 0,
                    "scenerestrict": true,
                    "prevent": false
                },
                "id": randomID(16)
            },
            {
                "action": "delete",
                "data": {
                    "entity": {
                        "id": "tile",
                        "name": "This Tile"
                    },
                    "collection": "tiles"
                },
                "id": randomID(16)
            },
            {
                "action": "delete",
                "data": {
                    "entity": {
                        "id": `Scene.${data.scene._id}.AmbientLight.${light._id}`,
                        "name": `AmbientLight: ${sound._id}`
                    },
                    "collection": "tiles"
                },
                "id": randomID(16)
            },
            {
                "action": "delete",
                "data": {
                    "entity": {
                        "id": `Scene.${data.scene._id}.AmbientSound.${sound._id}`,
                        "name": `AmbientSound: ${sound._id}`
                    },
                    "collection": "tiles"
                },
                "id": randomID(16)
            }
        ],
        "files": []
    }

    const tileData = {
        "texture": {
            "src": campfireTextureLit,
            "scaleX": 1,
            "scaleY": 1,
            "offsetX": 0,
            "offsetY": 0,
            "rotation": Math.floor(Math.random() * (360 - 0 + 1) + 0), //random rotation
            "tint": null
        },
        "x": data.x - (size / 2), //need to subtract half the grid size as the tile placement is measured from the top left instead of center.
        "y": data.y - (size / 2),
        "width": size,
        "height": size,
        "overhead": false,
        "z": 100,
        "rotation": Math.floor(Math.random() * (360 - 0 + 1) + 0), //random rotation,
        "alpha": 1,
        "hidden": false,
        "locked": true,
        "roof": false,
        "occlusion": {
            "mode": 1,
            "alpha": 0,
            "radius": null
        },
        "video": {
            "loop": true,
            "autoplay": true,
            "volume": 0
        },
        "flags": {
            "monks-active-tiles": mattFlags
        }
    }
    const tiles = await scene.createEmbeddedDocuments("Tile", [tileData])
    const tile = tiles[0]    
    if (tile) {
        const volume = game.settings.get('swim', 'defaultVolume')
        await swim.play_sfx("modules/swim/assets/sfx/Fireball-Super-Quick-Whoosh-www.fesliyanstudios.com.ogg", volume, true)
        if (!game.modules.get('monks-active-tiles')?.active) {
            ui.notifications.warn(game.i18n.localize("SWIM.notification.monksTileTriggersNotFound"))
            console.warn("The campfires module in SWIM works best when using Monks Active Tiles module. It allows you to simply double click the campfire to delete it and its associated light and ambient sound. This is no requirement but without it you'll have to manually delete the tile, light and sound.")
        }
    }
}