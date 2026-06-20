/**
 * animator.js
 *
 * Drives a collection of Zook instances each frame:
 *   1. Advances their internal time clock.
 *   2. Calls step() with empty inputs (AI / preview walk cycle).
 *   3. Syncs Three.js meshes to Rapier physics transforms.
 *
 * For player-controlled zooks call zook.step(dt, inputs) and zook.syncMeshes()
 * directly — those zooks should NOT also be passed to tickCreatures(), or
 * they'll be stepped twice per frame.
 */

/**
 * Tick all provided Zook instances for one animation frame.
 *
 * @param {import('./builder.js').Zook[]} zooks  Array of Zook instances
 * @param {number}                        dt      Delta time in seconds
 */
export function tickCreatures(zooks, dt) {
  for (const zook of zooks) {
    // step() advances _t internally and applies physics forces
    zook.step(dt, {});

    // Copy Rapier transform → Three.js group
    zook.syncMeshes();
  }
}
