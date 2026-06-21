/**
 * main.js — FriedZooki boot.
 *
 * Sets up the shared renderer + physics loop and hands control to App, which
 * runs the Title → Menu → Build / Contests / Versus screens.
 */

import { initRenderer, updateCamera } from './engine/renderer.js';
import { initPhysics }                from './engine/physics.js';
import { startLoop }                  from './engine/loop.js';
import { App }                        from './app.js';

const boot = (msg) => { const e = document.getElementById('boot-step'); if (e) e.textContent = msg; };

async function main() {
  const canvas = document.getElementById('scene');
  const ui     = document.getElementById('ui');

  boot('starting renderer…');
  const { renderer, scene, camera, clock } = initRenderer(canvas);

  boot('warming up physics…');
  const { world, RAPIER } = await initPhysics();

  const app = new App({ scene, world, RAPIER, camera, canvas, ui });
  app.go('title');

  startLoop({
    world, renderer, scene, camera, clock,
    onStep: (dt) => app.onStep(dt),
    onFrame: (dt) => { app.update(dt); updateCamera(dt); },
  });

  document.getElementById('screen-loading')?.classList.remove('show');
}

main().catch(err => { console.error(err); boot('⚠ ' + (err?.message || err)); });
