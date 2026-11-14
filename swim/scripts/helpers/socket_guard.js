/*******************************************
 * SWIM socket guard (Phase 4.3)
 * Every handler registered with socketlib runs on a GM client with GM permissions, and *any* connected client can call it
 * with arbitrary data. `guard()` wraps a handler so that the payload is validated against the invoking user first:
 *  - the sender is taken from socketlib (`this.socketdata.userId`), never from the payload,
 *  - a non-GM sender has to own the acting token/actor (GMs are always allowed to act),
 *  - ids must exist, enums/numbers/booleans must be of the expected kind, free-form update objects are whitelisted.
 * A rejected request is logged, the GM gets a warning and the call fails (fail closed: a bug in a validator rejects as well).
 * The wrapped handlers themselves are unchanged.
 ******************************************/

import { is_potion_of } from "./swid_lists.js"

function fail(message) {
    throw new Error(message)
}

/* ---------- small helpers ---------- */

const is_id = (value) => typeof value === "string" && value.length > 0 && value.length <= 64
const is_object = (value) => value !== null && typeof value === "object" && !Array.isArray(value)

function require_object(data, what = "payload") {
    if (!is_object(data)) fail(`${what} is not an object`)
    return data
}

function require_id(value, what) {
    if (!is_id(value)) fail(`${what} is missing or not an id`)
    return value
}

function require_enum(value, allowed, what) {
    if (!allowed.includes(value)) fail(`${what} '${value}' is not one of ${allowed.join("/")}`)
    return value
}

function require_boolean(value, what) {
    if (typeof value !== "boolean") fail(`${what} is not a boolean`)
    return value
}

function get_scene(sceneID) {
    const scene = sceneID === undefined ? canvas.scene : game.scenes.get(require_id(sceneID, "sceneID"))
    if (!scene) fail("scene not found")
    return scene
}

function get_token(scene, tokenID, what) {
    const token = scene.tokens.get(require_id(tokenID, what))
    if (!token) fail(`${what} ${tokenID} not found in scene ${scene.id}`)
    return token
}

/** Does the user have OWNER permission on the actor (GMs always do)? */
function owns_actor(user, actor) {
    return user.isGM || !!actor?.testUserPermission(user, "OWNER")
}

function require_owned_token(user, token, what) {
    if (!owns_actor(user, token.actor)) fail(`${user.name} does not own ${what} (${token.name})`)
}

/* ---------- the guard ---------- */

/**
 * @param {string} name       Registered handler name (for log/notification text).
 * @param {Function} handler  The original GM handler.
 * @param {Function} validate `(user, ...args) => void|Promise<void>`; throws to reject.
 * @returns {Function} A handler to pass to `socket.register(name, ...)`. Must stay a normal function: socketlib sets `this`.
 */
export function guard(name, handler, validate) {
    return async function (...args) {
        const senderId = this?.socketdata?.userId
        const user = game.users.get(senderId)
        try {
            if (!user) fail("unknown sender")
            await validate(user, ...args)
        } catch (error) {
            const reason = error?.message ?? String(error)
            console.warn(`SWIM | Rejected socket request '${name}' from ${user?.name ?? senderId}: ${reason}`, args)
            ui.notifications.warn(game.i18n.format("SWIM.notification.socketRequestRejected", {
                userName: user?.name ?? senderId, handler: name, reason
            }))
            throw new Error(`SWIM | Request '${name}' rejected: ${reason}`)
        }
        return handler.apply(this, args)
    }
}

/* ---------- validators (one per registered handler) ---------- */

export const socket_validators = {
    effectBuilder(user, data) {
        require_object(data)
        const scene = get_scene(require_id(data.sceneID, "sceneID"))
        require_owned_token(user, get_token(scene, data.casterID, "casterID"), "the caster")
        if (!Array.isArray(data.targetIDs) || data.targetIDs.length === 0 || data.targetIDs.length > 200) fail("targetIDs is not a non-empty array")
        for (const id of data.targetIDs) get_token(scene, id, "target")
        if (typeof data.type !== "string") fail("type is not a string")
        require_id(data.maintenanceID, "maintenanceID")
        if (data.powerID !== undefined && !is_id(data.powerID)) fail("powerID is not an id")
    },

    shapeChanger(user, data) {
        require_object(data)
        const scene = get_scene(require_id(data.sceneID, "sceneID"))
        const token = get_token(scene, data.tokenID, "tokenID")
        require_owned_token(user, token, "the token")
        if (data.userID !== user.id) fail("userID does not match the sender")
        require_enum(data.type, ["change", "revert"], "type")
        if (data.type === "change") {
            require_boolean(data.raise, "raise")
            require_id(data.scID, "scID")
            // Only actors from the preset folder may be used (the folder check is skipped if it doesn't exist, the handler reports that itself).
            if (game.folders.getName("Shape Change Presets")) {
                if (!swim.get_folder_content("Shape Change Presets").some(a => a.id === data.scID)) fail(`scID ${data.scID} is not a Shape Change preset`)
            }
        } else {
            // Take the truth from the token, not from the payload:
            const ownerActorID = token.actor?.getFlag("swim", "scOwner")
            if (!ownerActorID) fail("the token is not a shape-changed creature")
            if (data.ownerActorID !== ownerActorID) fail("ownerActorID does not match the token's original actor")
            if (data.actorID !== token.actor.id) fail("actorID does not match the token's actor")
            if (!owns_actor(user, game.actors.get(ownerActorID))) fail(`${user.name} does not own the original actor`)
        }
    },

    async summoner(user, data) {
        require_object(data)
        const scene = get_scene()
        const summoner = get_token(scene, data.summonerID, "summonerID")
        require_owned_token(user, summoner, "the summoner")
        require_id(data.scID, "scID")
        if (!game.actors.get(data.scID)) fail(`scID ${data.scID} is not an actor`)
        require_boolean(data.mirror, "mirror")
        if (data.mirror !== (data.scID === summoner.actor?.id)) fail("mirror does not match scID")
        require_boolean(data.raise, "raise")
        require_id(data.maintID, "maintID")
        if (typeof data.duration !== "number" || Number.isNaN(data.duration)) fail("duration is not a number")
        if (data.mainFolderID !== undefined) {
            const folder = game.folders.get(data.mainFolderID)
            if (!folder || folder.type !== "Actor" || folder.name !== "[SWIM] Summon Creature") fail("mainFolderID is not the summon folder")
        }
        const swimFlags = data.flags?.swim
        if (!is_object(swimFlags)) fail("flags.swim is missing")
        if (swimFlags.userId !== user.id) fail("flags.swim.userId does not match the sender")
        // The only actor updates SWIM ever sends: name and (raise) max wounds. Anything else is refused.
        if (data.actorUpdates !== undefined) {
            if (!is_object(data.actorUpdates)) fail("actorUpdates is not an object")
            for (const [key, value] of Object.entries(data.actorUpdates)) {
                if (key === "name" && typeof value === "string" && value.length <= 200) continue
                if (key === "system.wounds.max" && Number.isInteger(value) && value >= 0 && value <= 20) continue
                fail(`actorUpdates contains a disallowed entry '${key}'`)
            }
        }
        // The token was created by the sender's client (Portal); the handler waits for it to be drawn, so do the same here.
        let newToken = scene.tokens.get(data.tokenID)
        for (let waited = 0; !newToken && waited < 3000; waited += 50) {
            await new Promise(resolve => setTimeout(resolve, 50))
            newToken = scene.tokens.get(data.tokenID)
        }
        // If it never shows up the handler reports that itself (nothing is changed before that check).
        if (newToken) {
            if (newToken.actorLink) fail("the new token is a linked token")
            if (newToken.actorId !== data.scID) fail("the new token does not belong to scID")
            require_owned_token(user, newToken, "the summoned token")
        }
    },

    summonerDismiss(user, data) {
        require_object(data)
        const token = get_token(get_scene(require_id(data.sceneID, "sceneID")), data.tokenID, "tokenID")
        require_owned_token(user, token, "the summoned token")
        if (!token.actor?.effects.some(e => e.flags?.swim?.isSummonedCreature === true)) fail("the token is not a summoned creature")
    },

    healOther(user, data) {
        require_object(data)
        const scene = get_scene()
        require_owned_token(user, get_token(scene, data.tokenID, "tokenID"), "the healer")
        get_token(scene, data.targetID, "targetID")
        require_enum(data.rating, ["critFail", "success", "raise"], "rating")
        require_enum(data.method, ["heal", "relief"], "method")
        if (data.combatHealing !== undefined) require_boolean(data.combatHealing, "combatHealing")
    },

    healPotion(user, data) {
        require_object(data)
        const scene = get_scene()
        const healer = get_token(scene, data.tokenID, "tokenID")
        require_owned_token(user, healer, "the healer")
        const target = get_token(scene, data.targetID, "targetID")
        require_enum(data.track, ["wounds", "fatigue"], "track")
        require_enum(data.owner, ["healer", "target"], "owner")
        if (!Number.isInteger(data.amount) || data.amount < 1 || data.amount > 20) fail("amount is not an integer from 1 to 20")
        // The potion belongs to the healer (owned, see above) or to the target (the user has to be allowed to look into that inventory).
        const potionActor = data.owner === "healer" ? healer.actor : target.actor
        if (data.owner === "target" && !user.isGM && !potionActor.testUserPermission(user, "OBSERVER")) fail(`${user.name} may not use potions of ${target.name}`)
        const item = potionActor.items.get(require_id(data.itemID, "itemID"))
        if (!item) fail("potion item not found")
        if (!is_potion_of(item, data.track === "wounds" ? "health" : "fatigue")) fail(`'${item.name}' is not a configured potion`)
    },

    commonBond(user, data) {
        require_object(data)
        const scene = get_scene()
        require_owned_token(user, get_token(scene, data.tokenID, "tokenID"), "the token")
        get_token(scene, data.targetID, "targetID")
    },

    craftCampfire(user, data) {
        require_object(data)
        get_scene(require_id(data.scene?._id, "scene._id"))
        if (!is_object(data.position) || !Number.isFinite(data.position.x) || !Number.isFinite(data.position.y)) fail("position is not a pair of numbers")
    },

    tester(user, data) {
        require_object(data)
        const scene = get_scene(require_id(data.sceneId, "sceneId"))
        require_owned_token(user, get_token(scene, data.tokenId, "tokenId"), "the token")
        get_token(scene, data.targetId, "targetId")
        require_enum(data.action, ["support", "test"], "action")
        require_id(data.skillId, "skillId")
        if (data.supportedSkillId !== undefined && !is_id(data.supportedSkillId)) fail("supportedSkillId is not an id")
    },

    // Only actors SWIM itself creates (Shape Changer copies carry `scOwner`, Summoner mirror actors carry `maintenanceID`) may be deleted by non-GMs.
    deleteActor(user, actorID) {
        const actor = game.actors.get(require_id(actorID, "actorID"))
        if (!actor) fail(`actor ${actorID} not found`)
        if (user.isGM) return
        if (!owns_actor(user, actor)) fail(`${user.name} does not own the actor`)
        if (!actor.flags?.swim?.scOwner && !actor.flags?.swim?.maintenanceID) fail("the actor was not created by SWIM")
    },
}
