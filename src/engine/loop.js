/**
 * Game loop with fixed-timestep physics and variable-rate rendering.
 *
 * Physics ticks at exactly 1/60 s; rendering runs as fast as the browser
 * allows. `alpha` (0–1) passed to onFrame is the sub-step interpolation
 * fraction for smooth rendering between physics steps.
 */

const FIXED_DT = 1 / 60;

/**
 * Start the game loop.
 *
 * @param {{
 *   world:    import('@dimforge/rapier3d-compat').World,
 *   renderer: import('three').WebGLRenderer,
 *   scene:    import('three').Scene,
 *   camera:   import('three').Camera,
 *   clock:    import('three').Clock,
 *   onStep:   (alpha: number) => void,
 *   onFrame:  (dt: number, alpha: number) => void,
 * }} opts
 * @returns {() => void}  stopLoop function
 */
export function startLoop({ world, renderer, scene, camera, clock, onStep, onFrame }) {
  let rafId      = null;
  let accumulator = 0;
  let running    = true;

  clock.start();

  function tick() {
    if (!running) return;

    rafId = requestAnimationFrame(tick);

    const dt = Math.min(clock.getDelta(), 0.1); // clamp to avoid spiral of death
    accumulator += dt;

    // Fixed physics steps
    while (accumulator >= FIXED_DT) {
      world.step();
      if (typeof onStep === 'function') onStep(FIXED_DT);
      accumulator -= FIXED_DT;
    }

    // Sub-step interpolation fraction (0 = previous step, 1 = next step)
    const alpha = accumulator / FIXED_DT;

    // Per-frame logic (mesh sync, camera, etc.)
    if (typeof onFrame === 'function') onFrame(dt, alpha);

    renderer.render(scene, scene.userData.cam || camera);
  }

  tick();

  // Pause when the tab/app is backgrounded: stops burning battery on a screen
  // nobody's looking at, and avoids a giant catch-up delta on return.
  const onVisibility = () => {
    if (document.hidden) {
      running = false;
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    } else if (!running) {
      running = true; clock.getDelta();   // discard the long gap so we resume smoothly
      tick();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  return function stopLoop() {
    running = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    document.removeEventListener('visibilitychange', onVisibility);
    clock.stop();
  };
}

/**
 * No-op placeholder so callers can `import { stopLoop }` for clarity;
 * the real stop function is the return value of startLoop().
 */
export function stopLoop() {
  // Actual cancellation happens via the closure returned by startLoop().
  // This export exists so modules can keep a reference without closure tricks.
}
