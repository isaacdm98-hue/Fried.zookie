/**
 * engine-constants.js — the exact BAMZOOKi (Bonsai Engine / Karma physics)
 * constants, lifted verbatim from the decompiled Scripts/PhysicsConstants.ssx so
 * the rebuilt articulated engine simulates with the original's numbers.
 *
 * Source: reference/decompiled/PhysicsConstants.ssx
 */
export const ENGINE = {
  CARDAN_STIFFNESS: 1000,     // Cardan_Stiffness — joint angular spring toward target
  CARDAN_DAMPING: 100000,     // Cardan_Damping   — joint angular damping
  ANGULAR_APPROACH_SPEED: 4,  // AngularApproachSpeed — how fast a joint chases its target angle
  CONTEST_UNIT_SCALE: 40,     // contest_unit_scale — cm/world-unit factor in trial scoring
  MAX_TICK_SIZE: 0.02,        // max_tick_size — fixed physics timestep (50 Hz)
  // Karma defaults used by Evo when building the body (segments + rod/cardan joints).
  WORLD_SCALE: 0.04,          // worldscale (StudioSettings) — Target/Evo spec → world units
};
