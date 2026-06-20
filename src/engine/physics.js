import RAPIER from '@dimforge/rapier3d-compat';

// ── Init ─────────────────────────────────────────────────────────────────────

/**
 * Initialise Rapier WASM and create a physics world with earth gravity.
 * @returns {Promise<{ world: RAPIER.World, RAPIER: typeof import('@dimforge/rapier3d-compat') }>}
 */
export async function initPhysics() {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  return { world, RAPIER };
}

// ── Step ─────────────────────────────────────────────────────────────────────

/**
 * Advance the physics simulation by one fixed step (1/60 s).
 * @param {RAPIER.World} world
 */
export function stepPhysics(world) {
  world.step();
}

// ── Ground ───────────────────────────────────────────────────────────────────

/**
 * Create an infinite static ground plane at y = 0.
 * @param {RAPIER.World} world
 * @param {typeof RAPIER} R
 * @returns {RAPIER.RigidBody}
 */
export function createGround(world, R) {
  const bodyDesc = R.RigidBodyDesc.fixed();
  const body = world.createRigidBody(bodyDesc);

  // half-space collider: normal pointing up (y+)
  const colliderDesc = R.ColliderDesc.halfSpace(new R.Vector3(0, 1, 0))
    .setFriction(0.8)
    .setRestitution(0.1);
  world.createCollider(colliderDesc, body);

  return body;
}

// ── Box ──────────────────────────────────────────────────────────────────────

/**
 * Create a box rigid body (dynamic if mass > 0, fixed otherwise).
 * @param {RAPIER.World} world
 * @param {typeof RAPIER} R
 * @param {{ pos: {x,y,z}, size: {x,y,z}, mass?: number, restitution?: number, friction?: number, isSensor?: boolean }} opts
 * @returns {RAPIER.RigidBody}
 */
export function createBox(world, R, {
  pos        = { x: 0, y: 0, z: 0 },
  size       = { x: 1, y: 1, z: 1 },
  mass       = 1,
  restitution = 0.2,
  friction   = 0.6,
  isSensor   = false,
} = {}) {
  const isDynamic = mass > 0;
  const bodyDesc = isDynamic
    ? R.RigidBodyDesc.dynamic()
        .setTranslation(pos.x, pos.y, pos.z)
        .setAdditionalMass(mass)
    : R.RigidBodyDesc.fixed()
        .setTranslation(pos.x, pos.y, pos.z);

  const body = world.createRigidBody(bodyDesc);

  const colliderDesc = R.ColliderDesc
    .cuboid(size.x / 2, size.y / 2, size.z / 2)
    .setFriction(friction)
    .setRestitution(restitution)
    .setSensor(isSensor);

  world.createCollider(colliderDesc, body);
  return body;
}

// ── Sphere ───────────────────────────────────────────────────────────────────

/**
 * Create a sphere rigid body (dynamic if mass > 0, fixed otherwise).
 * @param {RAPIER.World} world
 * @param {typeof RAPIER} R
 * @param {{ pos: {x,y,z}, r?: number, mass?: number, restitution?: number, friction?: number }} opts
 * @returns {RAPIER.RigidBody}
 */
export function createSphere(world, R, {
  pos        = { x: 0, y: 0, z: 0 },
  r          = 0.5,
  mass       = 1,
  restitution = 0.3,
  friction   = 0.5,
} = {}) {
  const isDynamic = mass > 0;
  const bodyDesc = isDynamic
    ? R.RigidBodyDesc.dynamic()
        .setTranslation(pos.x, pos.y, pos.z)
        .setAdditionalMass(mass)
    : R.RigidBodyDesc.fixed()
        .setTranslation(pos.x, pos.y, pos.z);

  const body = world.createRigidBody(bodyDesc);

  const colliderDesc = R.ColliderDesc
    .ball(r)
    .setFriction(friction)
    .setRestitution(restitution);

  world.createCollider(colliderDesc, body);
  return body;
}
