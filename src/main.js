/**
 * main.js — FriedZooki (clean rebuild).
 *
 * Boots straight into the Workshop: build a block Zook with tactile controls,
 * then send it to the test table. Two modes share one renderer + physics loop.
 */

import { initRenderer, updateCamera } from './engine/renderer.js';
import { initPhysics }                from './engine/physics.js';
import { startLoop }                  from './engine/loop.js';
import { Builder }                    from './zook/builder.js';
import { Arena }                      from './zook/arena.js';

const boot = (msg) => { const e = document.getElementById('boot-step'); if (e) e.textContent = msg; };

async function main() {
  const canvas = document.getElementById('scene');
  const ui     = document.getElementById('ui');

  boot('starting renderer…');
  const { renderer, scene, camera, clock } = initRenderer(canvas);

  boot('warming up physics…');
  const { world, RAPIER } = await initPhysics();

  // ── Modes ──────────────────────────────────────────────────────────────────
  let active = null;          // current mode instance
  let blueprint = null;

  const builder = new Builder({
    scene, mount: ui,
    onTest: (bp) => { blueprint = bp; show('arena'); },
  });
  const arena = new Arena({ scene, world, RAPIER, camera, canvas });

  // Back button (arena only) — uses one of the supplied assets, sparingly.
  const back = document.createElement('button');
  back.className = 'back-btn';
  back.innerHTML = `<img src="./assets/btn-back.png" alt="Back" />`;
  back.style.display = 'none';
  back.addEventListener('click', () => show('builder'));
  ui.appendChild(back);

  function show(next) {
    if (active && active.exit) active.exit();
    if (next === 'builder') {
      active = builder; builder.enter(blueprint); back.style.display = 'none';
    } else {
      active = arena; arena.enter(blueprint, { obstacles: true }); back.style.display = '';
    }
  }

  show('builder');

  // ── Loop ─────────────────────────────────────────────────────────────────────
  startLoop({
    world, renderer, scene, camera, clock,
    onStep: (dt) => { if (active && active.onStep) active.onStep(dt); },
    onFrame: (dt) => { if (active && active.update) active.update(dt); updateCamera(dt); },
  });

  // Reveal
  document.getElementById('screen-loading')?.classList.remove('show');
}

main().catch(err => {
  console.error(err);
  boot('⚠ ' + (err?.message || err));
});
