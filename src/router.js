/**
 * router.js — Screen navigation for FriedZooki
 *
 * Each "screen" is either:
 *   - a Scene  (has enter/exit/update, owns the 3-D canvas)
 *   - a Mode   (has enter/exit, purely HTML overlay)
 *
 * HTML sections must carry an id that matches the screenId, e.g.
 *   <section id="screen-title">…</section>
 *   <section id="screen-build">…</section>
 *
 * The 3-D canvas is shown/hidden by toggling the #canvas-wrap element.
 */

import { S, setState } from './state.js';

// ── Internal registry ────────────────────────────────────────────────────────

const _registry = {
  scenes: {},   // screenId → SceneInstance
  modes:  {},   // screenId → ModeInstance
};

/** Screens that need the 3-D canvas alive */
const SCENE_SCREENS = new Set(['menu', 'build', 'race', 'freeroam']);

let _currentScreen = null;
let _engine        = null;   // { scene, world, RAPIER, renderer, camera, clock }

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Wire up all scene/mode instances and the engine context.
 *
 * @param {{
 *   scenes: Record<string, object>,
 *   modes:  Record<string, object>,
 *   engine: object,
 * }} opts
 */
export function initRouter({ scenes = {}, modes = {}, engine = {} }) {
  Object.assign(_registry.scenes, scenes);
  Object.assign(_registry.modes,  modes);
  _engine = engine;
}

/**
 * Navigate to a new screen.
 *
 * @param {string} screenId  e.g. 'title'|'build'|'roster'|'trials'|'race'|'champ'|'vs'|'online'|'freeroam'
 * @param {*}      [payload] passed straight to scene.enter() / mode.enter()
 */
export function navigate(screenId, payload) {
  window.dispatchEvent(new CustomEvent('fz:navigate', { detail: { screenId, payload } }));
}

export function _setCurrentScreen(id) { _currentScreen = id; }

// ── Helpers ──────────────────────────────────────────────────────────────────

function _sectionEl(screenId) {
  // Support both 'screen-foo' id and bare 'foo' id conventions
  return (
    document.getElementById(`screen-${screenId}`) ||
    document.getElementById(screenId)
  );
}
