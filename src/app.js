/**
 * app.js — FriedZooki application controller.
 *
 * Owns the shared renderer/physics stage and switches between screens:
 * Title → Menu → Build / Contests / Versus / My Zooks. DOM-only screens float
 * over a slowly turning hero Zook; gameplay screens (workshop, test, contest)
 * take over the 3D stage. The animalese guide threads curation throughout.
 */

import * as THREE from 'three';
import { setCamera } from './engine/renderer.js';
import { Zook, defaultBlueprint } from './zook/model.js';
import { Builder } from './zook/builder.js';
import { Arena } from './zook/arena.js';
import { ContestScene, CONTESTS } from './zook/contest.js';
import { EXAMPLES, loadRoster, randomExample } from './zook/library.js';
import { guide, TIPS } from './sys/guide.js';
import { fb, unlockAudio, setMuted } from './sys/feedback.js';

export class App {
  constructor({ scene, world, RAPIER, camera, canvas, ui }) {
    Object.assign(this, { scene, world, RAPIER, camera, canvas, ui });
    this.active = { name: 'My Zook', bp: defaultBlueprint() };
    this.mode = null;            // gameplay mode with onStep/update/exit
    this._hero = null; this._heroSpin = true; this._heroSpinT = 0;
    this._overlay = null;
    this._builder = new Builder({ scene, mount: ui,
      onTest: (bp, name) => { this.active = { bp, name }; this.go('test'); },
      onBack: () => this.go('menu'),
    });
    this._countdownEl = null;
  }

  // ── loop hooks ────────────────────────────────────────────────────────────
  onStep(dt) { if (this.mode && this.mode.onStep) this.mode.onStep(dt); }
  update(dt) {
    if (this._hero) {
      if (this._heroSpin !== false) { this._heroSpinT += dt * 0.5; this._hero.rotation.y = this._heroSpinT; }
      this._heroZook.step(dt, { walk: true }); this._heroZook.syncMeshes();
    }
    if (this.mode && this.mode.update) this.mode.update(dt);
    if (this._countdownEl && this.mode && this.mode.countLabel != null) {
      const l = this.mode.countLabel;
      this._countdownEl.textContent = l || '';
      this._countdownEl.style.opacity = l ? '1' : '0';
    }
  }

  // ── screen switching ────────────────────────────────────────────────────────
  _clear() {
    if (this.mode && this.mode.exit) this.mode.exit();
    this.mode = null;
    if (this._overlay) { this._overlay.remove(); this._overlay = null; }
    this._countdownEl = null;
  }
  _overlayEl(html) {
    const d = document.createElement('div'); d.className = 'overlay'; d.innerHTML = html;
    this.ui.appendChild(d); this._overlay = d; return d;
  }
  _showHero(bp) {
    this._hideHero();
    this._hero = new THREE.Group(); this.scene.add(this._hero);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.3, 48),
      new THREE.MeshStandardMaterial({ color: 0xd7d3c9, roughness: 0.7 }));
    plinth.position.y = -0.15; plinth.receiveShadow = true; this._hero.add(plinth);
    this._heroZook = new Zook(bp || this.active.bp, { preview: true, showArrow: true });
    this._hero.add(this._heroZook.group);
    this._heroSpin = true; this._heroSpinT = 0; this._hero.rotation.y = 0;
    setCamera({ x: 0, y: 2.0, z: 4.8 }, { x: 0, y: 0.4, z: 0 }, true);
  }
  _hideHero() {
    if (this._hero) { this._heroZook.dispose(); this.scene.remove(this._hero); this._hero = null; }
  }

  go(screen, opts = {}) {
    this._clear();
    // Hero Zook spins behind the DOM menus; title uses a hand-drawn doodle instead.
    if (['menu', 'contests', 'versus', 'myzooks'].includes(screen)) this._showHero(this.active.bp);
    else this._hideHero();
    ({
      title: () => this._title(),
      menu: () => this._menu(),
      workshop: () => this._workshop(opts),
      test: () => this._test(),
      contests: () => this._contests(),
      contestRun: () => this._contestRun(opts),
      versus: () => this._versus(),
      myzooks: () => this._myzooks(),
    }[screen] || (() => this._menu()))();
  }

  // ── Title ────────────────────────────────────────────────────────────────
  _title() {
    // Hero Zook standing over the hand-drawn yellow panel (a textured plane).
    this._showHero(this.active.bp);
    const tex = new THREE.TextureLoader().load('./assets/blob-idea-yellow.png');
    tex.colorSpace = THREE.SRGBColorSpace;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 3.8),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    panel.position.set(0, 1.15, -1.4);
    this._hero.add(panel);
    // Face the Zook toward the user (front is -Z; rotate just the creature so
    // it greets the camera while the yellow panel stays behind it).
    this._heroSpin = false; this._hero.rotation.y = 0; this._heroZook.group.rotation.y = Math.PI;
    setCamera({ x: 0, y: 1.5, z: 5.2 }, { x: 0, y: 1.05, z: 0 }, true);

    const d = this._overlayEl(`
      <div class="title-wrap">
        <div class="title-top">
          <img class="title-word" src="./assets/title-friedzooki.png" alt="FriedZooki" />
          <div class="t-sub">build · tune · compete</div>
        </div>
        <div class="title-bot">
          <button class="start-btn">TAP TO START</button>
          <div class="t-foot">after CBBC's BAMZOOKi · made from the Zook-Kit manual</div>
        </div>
      </div>`);
    const start = () => { unlockAudio(); fb.confirm(); guide.now(TIPS.menu); this.go('menu'); };
    d.querySelector('.start-btn').addEventListener('click', start);
    guide.now(TIPS.title);
  }

  // ── Menu ─────────────────────────────────────────────────────────────────
  _menu() {
    const d = this._overlayEl(`
      <div class="menu-wrap">
        <div class="m-logo"><span class="t-fried">Fried</span>Zooki</div>
        <div class="menu-grid">
          <button class="m-btn" data-go="workshop"><b>BUILD</b><span>make a Zook</span></button>
          <button class="m-btn" data-go="contests"><b>CONTESTS</b><span>vs a rival</span></button>
          <button class="m-btn" data-go="versus"><b>VERSUS</b><span>2-player link</span></button>
          <button class="m-btn" data-go="myzooks"><b>MY ZOOKS</b><span>your roster</span></button>
        </div>
      </div>`);
    d.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { fb.press(); this.go(b.dataset.go); }));
  }

  // ── Workshop ─────────────────────────────────────────────────────────────
  _workshop(opts) { this.mode = this._builder; this._builder.enter(opts.bp || this.active.bp, opts.name || this.active.name); }

  // ── Test table ───────────────────────────────────────────────────────────
  _test() {
    const arena = new Arena({
      scene: this.scene, world: this.world, RAPIER: this.RAPIER, camera: this.camera,
      canvas: this.canvas, mount: this.ui, onBack: () => this.go('workshop'),
    });
    arena.enter(this.active.bp);
    this.mode = arena;
  }

  // ── Contests (select) ────────────────────────────────────────────────────
  _contests() {
    const cards = CONTESTS.map(c => `
      <button class="con-card" data-id="${c.id}"><b>${c.name}</b><span>${c.desc}</span></button>`).join('');
    const d = this._overlayEl(`<div class="sheet">
      <div class="bar"><button class="mini-btn" data-back>‹</button><h2>Contests</h2><span style="width:40px"></span></div>
      <div class="con-grid">${cards}</div></div>`);
    d.querySelector('[data-back]').addEventListener('click', () => { fb.press(); this.go('menu'); });
    d.querySelectorAll('.con-card').forEach(b => b.addEventListener('click', () => {
      fb.confirm();
      const contest = CONTESTS.find(c => c.id === b.dataset.id);
      this.go('contestRun', { contest, green: this.active, red: randomExample() });
    }));
    guide.now(TIPS.contest);
  }

  // ── Contest run ──────────────────────────────────────────────────────────
  _contestRun({ contest, green, red }) {
    const cs = new ContestScene({
      scene: this.scene, world: this.world, RAPIER: this.RAPIER, camera: this.camera,
      onResult: ({ playerWon, line }) => {
        guide.now(line);
        const r = this._overlayEl(`
          <div class="result-modal">
            <h1 class="${playerWon ? 'win' : 'lose'}">${playerWon ? 'YOU WIN!' : 'YOU LOSE'}</h1>
            <p>${line}</p>
            <div class="row">
              <button class="m-btn" data-act="again"><b>REMATCH</b></button>
              <button class="m-btn" data-act="menu"><b>CONTESTS</b></button>
            </div>
          </div>`);
        r.querySelector('[data-act=again]').addEventListener('click', () => { fb.press(); this.go('contestRun', { contest, green, red }); });
        r.querySelector('[data-act=menu]').addEventListener('click', () => { fb.press(); this.go('contests'); });
      },
    });
    cs.enter(contest, green.bp, red.bp);
    this.mode = cs;
    const d = this._overlayEl(`
      <div class="con-hud"><span class="tag green">${green.name || 'You'}</span>
        <span class="vs">${contest.name}</span>
        <span class="tag red">${red.name}</span></div>
      <div class="countdown"></div>`);
    this._countdownEl = d.querySelector('.countdown');
    guide.now(`${green.name || 'Your Zook'} versus ${red.name}! ${contest.desc}`);
  }

  // ── Versus (DS-style local link) ─────────────────────────────────────────
  _versus() {
    const pool = [...loadRoster(), ...EXAMPLES];
    const opts = (sel) => pool.map((z, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${z.name}</option>`).join('');
    const d = this._overlayEl(`<div class="sheet">
      <div class="bar"><button class="mini-btn" data-back>‹</button><h2>Versus</h2><span style="width:40px"></span></div>
      <div class="link-panel">
        <div class="link-anim"><span class="link-dot"></span><span class="link-dot"></span><span class="link-dot"></span></div>
        <p class="link-status">local link — pass &amp; play</p>
        <label class="vs-pick green">P1 ▸ <select data-p1>${opts(0)}</select></label>
        <label class="vs-pick red">P2 ▸ <select data-p2>${opts(Math.min(1, pool.length - 1))}</select></label>
        <label class="vs-pick">CONTEST ▸ <select data-con>${CONTESTS.map((c, i) => `<option value="${i}">${c.name}</option>`).join('')}</select></label>
        <button class="start-btn" data-go>LINK UP ▶</button>
      </div></div>`);
    d.querySelector('[data-back]').addEventListener('click', () => { fb.press(); this.go('menu'); });
    d.querySelector('[data-go]').addEventListener('click', () => {
      fb.confirm();
      const p1 = pool[+d.querySelector('[data-p1]').value];
      const p2 = pool[+d.querySelector('[data-p2]').value];
      const contest = CONTESTS[+d.querySelector('[data-con]').value];
      this.go('contestRun', { contest, green: p1, red: p2 });
    });
    guide.now(TIPS.versus);
  }

  // ── My Zooks ─────────────────────────────────────────────────────────────
  _myzooks() {
    const roster = loadRoster();
    const list = (title, arr, saved) => `
      <h3 class="mz-h">${title}</h3>
      <div class="mz-list">${arr.length ? arr.map((z, i) =>
        `<button class="mz-item" data-saved="${saved}" data-i="${i}"><span>${z.name}</span><em>open ›</em></button>`).join('')
        : '<p class="muted small">none yet — go build one!</p>'}</div>`;
    const d = this._overlayEl(`<div class="sheet">
      <div class="bar"><button class="mini-btn" data-back>‹</button><h2>My Zooks</h2>
        <button class="mini-btn wide" data-new>NEW</button></div>
      ${list('Saved', roster, 1)}
      ${list('Examples', EXAMPLES, 0)}</div>`);
    d.querySelector('[data-back]').addEventListener('click', () => { fb.press(); this.go('menu'); });
    d.querySelector('[data-new]').addEventListener('click', () => { fb.confirm(); this.active = { name: 'My Zook', bp: defaultBlueprint() }; this.go('workshop'); });
    d.querySelectorAll('.mz-item').forEach(b => b.addEventListener('click', () => {
      fb.press();
      const z = (+b.dataset.saved ? roster : EXAMPLES)[+b.dataset.i];
      const bp = { ...defaultBlueprint(), ...z.bp };
      if (!z.bp.legs) delete bp.legs;   // let it rebuild legs from the example's own fields
      this.active = { name: z.name, bp };
      this.go('workshop');
    }));
  }
}
