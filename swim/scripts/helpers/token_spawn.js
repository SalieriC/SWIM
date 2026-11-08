/*******************************************
 * SWIM token spawn helpers
 * Core-only replacement for the parts of Warp Gate (`spawnAt`, `dismiss`)
 * that SWIM used. No external module needed.
 *
 * IMPORTANT: These create/delete embedded documents on a scene, so they must
 * run on a client that is allowed to do so (SWIM calls them from GM-side
 * socket handlers).
 ******************************************/

/**
 * Create a token for an actor, centred on a point (same placement as Warp Gate's `spawnAt`).
 * @param {Actor} actor                 The actor document (NOT a name, so duplicate names can't pick the wrong actor).
 * @param {{x:number,y:number}} center  Canvas coordinates of the desired token centre (e.g. `token.center`).
 * @param {object} [options]
 * @param {Scene} [options.scene]       Scene to create the token on. Defaults to `canvas.scene`.
 * @param {object} [options.updates]    Token data overrides, passed to `actor.getTokenDocument()` (e.g. `{elevation: 5}`).
 * @returns {Promise<TokenDocument|null>} The created token document, or null on failure.
 */
export async function spawn_token(actor, center, { scene = canvas.scene, updates = {} } = {}) {
    if (!actor || !scene) {
        console.error("SWIM | spawn_token: missing actor or scene.", { actor, scene })
        return null
    }
    const tokenDoc = await actor.getTokenDocument(updates)
    if (!tokenDoc) {
        console.error(`SWIM | spawn_token: could not get token data for actor ${actor.name}.`)
        return null
    }
    // Make sure the texture is loaded so the token doesn't pop in blank.
    try { await loadTexture(tokenDoc.texture.src) } catch (e) { console.warn("SWIM | spawn_token: could not preload texture.", e) }

    // Warp Gate positioned by centre: offset by half the token size (in grid units).
    const gridSize = scene.grid.size
    const data = tokenDoc.toObject()
    data.x = center.x - gridSize * (tokenDoc.width / 2)
    data.y = center.y - gridSize * (tokenDoc.height / 2)

    const [created] = await scene.createEmbeddedDocuments("Token", [data])
    return created ?? null
}

/**
 * Wait until the canvas placeable (Token object) for a token document exists.
 * Right after creating a document the placeable is drawn asynchronously.
 * @param {TokenDocument} tokenDoc
 * @param {number} [maxWaitMs]
 * @returns {Promise<Token|null>}
 */
export async function wait_for_placeable(tokenDoc, maxWaitMs = 3000) {
    const step = 50
    for (let waited = 0; waited <= maxWaitMs; waited += step) {
        const placeable = tokenDoc.object ?? canvas.tokens.get(tokenDoc.id)
        if (placeable) return placeable
        await new Promise(resolve => setTimeout(resolve, step))
    }
    return null
}

/**
 * Remove a token from its scene (replacement for `warpgate.dismiss`).
 * @param {TokenDocument|Token} token
 */
export async function dismiss_token(token) {
    const tokenDoc = token?.document ?? token
    if (!tokenDoc?.parent) {
        console.debug("SWIM | dismiss_token: token no longer exists.", token)
        return
    }
    await tokenDoc.delete()
}
