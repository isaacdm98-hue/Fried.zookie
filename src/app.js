/**
 * app.js — FriedZooki application controller.
 *
 * Owns the shared renderer/physics stage and switches between screens:
 * Title → Menu → Build / Contests / Versus / My Zooks. DOM-only screens float
 * over a slowly turning hero Zook; gameplay screens (workshop, test, contest)
 * take over the 3D stage. The animalese guide threads curation throughout.
 */

import * as THREE from 'three';
import { setCamera, prefersReducedMotion } from './engine/renderer.js';
import { Zook, defaultBlueprint, blankBlueprint, cloneBlueprint, makeDefaultLegs } from './zook/model.js';
import { Builder } from './zook/builder.js';
import { Arena } from './zook/arena.js';
import { ContestScene, CONTESTS } from './zook/contest.js';
import { EXAMPLES, loadRoster, randomExample, randomName } from './zook/library.js';
import { Knob, Switch } from './zook/controls.js';
import { ZookRun, requestTilt } from './zook/run.js';
import { guide, TIPS } from './sys/guide.js';
import { fb, unlockAudio, setMuted } from './sys/feedback.js';
import { music } from './sys/music.js';
import { Link } from './net/link.js';
import { makeQR, startScan } from './net/qr.js';

// Online is restricted to static-arena contests so streamed state stays in sync.
const ONLINE_IDS = ['sprint', 'hurdles', 'sumo', 'weakest', 'tag'];
// Cross-screen "tabletop" arenas (bird's-eye; action crosses the seam).
const TABLETOP_IDS = ['sumo', 'weakest', 'tag'];

export class App {
  constructor({ scene, world, RAPIER, camera, canvas, ui }) {
    Object.assign(this, { scene, world, RAPIER, camera, canvas, ui });
    this.active = { name: randomName(), bp: blankBlueprint() };
    try { this._muted = localStorage.getItem('fz-mute') === '1'; } catch (_) { this._muted = false; }
    setMuted(this._muted);
    try { this._diff = Math.max(0, Math.min(2, +localStorage.getItem('fz-diff') || 1)); } catch (_) { this._diff = 1; }
    this.mode = null;            // gameplay mode with onStep/update/exit
    this._hero = null; this._heroSpin = true; this._heroSpinT = 0;
    this._overlay = null;
    this._builder = new Builder({ scene, mount: ui, camera, canvas,
      onTest: (bp, name) => { this.active = { bp, name }; this.go('test'); },
      onBack: () => this.go('menu'),
    });
    this._countdownEl = null;
    if (typeof window !== 'undefined') { window.__app = this; window.__Link = Link;       // debug handle
      window.__model = { Zook, defaultBlueprint, blankBlueprint, cloneBlueprint, makeDefaultLegs }; }
  }

  // ── loop hooks ────────────────────────────────────────────────────────────
  onStep(dt) { if (this.mode && this.mode.onStep) this.mode.onStep(dt); }
  update(dt) {
    if (this._hero) {
      this._heroT = (this._heroT || 0) + dt;
      this._heroZook.step(dt, { walk: true }); this._heroZook.syncMeshes();
      const g = this._heroZook.group, t = this._heroT, rest = this._heroZook.dims.rest;
      if (this._heroSilly) {
        // A daft little routine on a loop: butt-in-the-air wiggle, bouncy hops,
        // a happy spin, then a shimmy. Pure silliness for the title screen.
        const seg = (t * 0.5) % 4;
        let rx = 0, ry = Math.PI, rz = 0, hop = 0;
        if (seg < 1)      { rx = 0.95; ry = Math.PI + Math.sin(t * 11) * 0.6; }            // 🍑 butt in the air, waggling
        else if (seg < 2) { hop = Math.abs(Math.sin(t * 9)) * 0.55; }                       // bouncy hops
        else if (seg < 3) { ry = Math.PI + (seg - 2) * Math.PI * 2; hop = 0.12; }           // happy spin
        else              { rz = Math.sin(t * 10) * 0.3; hop = Math.abs(Math.sin(t * 6)) * 0.15; } // shimmy
        g.rotation.set(rx, ry, rz);
        g.position.y = rest + hop;
        g.scale.set(1, 1 + Math.sin(t * 4) * 0.05, 1);
      } else {
        if (this._heroSpin !== false) { this._heroSpinT += dt * 0.5; this._hero.rotation.y = this._heroSpinT; }
        g.scale.set(1, 1 + Math.sin(t * 2.4) * 0.025, 1);
      }
    }
    // Motion Player: drive the remote contest from recorded frames.
    if (this._replay && this.mode && this.mode.applyState) {
      const R = this._replay;
      if (R.playing) { R.t += dt * R.rate; if (R.t >= R.dur) { if (R.loop) R.t = 0; else { R.t = R.dur; R.playing = false; } } }
      const idx = Math.max(0, Math.min(R.frames.length - 1, Math.floor(R.t / 0.05)));
      this.mode.applyState(R.frames[idx]);
      if (this._scrub && document.activeElement !== this._scrub) this._scrub.value = (R.t / R.dur) * 1000;
    }
    if (this._lab && this._lab.role === 'host') this._labTick(dt);
    if (this.mode && this.mode.update) this.mode.update(dt);
    // Host streams the live contest state to the joiner (~20 Hz).
    if (this._netRole === 'host' && this._link && this.mode && this.mode.serializeState) {
      this._netT = (this._netT || 0) + dt;
      if (this._netT >= 0.05) { this._netT = 0; this._link.send({ type: 'state', ...this.mode.serializeState() }); }
    }
    if (this._countdownEl) {
      const l = (this.mode && this.mode.countLabel != null) ? this.mode.countLabel : null;
      this._countdownEl.textContent = l || '';
      this._countdownEl.style.opacity = l ? '1' : '0';
      this._countdownEl.classList.toggle('go', l === 'GO!');
    }
    if (this._scoreEl) this._scoreEl.textContent = (this.mode && this.mode.scoreLabel) || '';
  }

  // ── screen switching ────────────────────────────────────────────────────────
  _clear() {
    if (this.mode && this.mode.exit) this.mode.exit();
    this.mode = null;
    // Remove EVERY overlay this screen created (a screen can stack several, e.g.
    // a contest's VS bar + its result card) so none leaks onto the next screen.
    if (this._overlays) for (const o of this._overlays) o.remove();
    this._overlays = []; this._overlay = null;
    this._countdownEl = null; this._scoreEl = null;
    this._replay = null; this._scrub = null; this._lab = null; this._labUI = null; this._runScene = null;
    this._clearTabletop();
  }

  // Bird's-eye ORTHO camera covering this phone's HALF of a cross-screen arena.
  // host = left half (seam on its right edge), join = right half (seam on left).
  _setupTabletop(role) {
    const cv = this.canvas, FIELD_W = 5;
    const o = this._ortho = new THREE.OrthographicCamera(-FIELD_W / 2, FIELD_W / 2, 1, -1, 0.1, 100);
    const cx = role === 'host' ? -FIELD_W / 2 : FIELD_W / 2;
    const resize = () => {
      const w = cv.clientWidth, h = cv.clientHeight, Hw = (h / w) * FIELD_W;
      o.top = Hw / 2; o.bottom = -Hw / 2; o.left = -FIELD_W / 2; o.right = FIELD_W / 2;
      o.position.set(cx, 30, 0); o.up.set(0, 0, -1); o.lookAt(cx, 0, 0); o.updateProjectionMatrix();
    };
    resize(); this._orthoResize = resize; window.addEventListener('resize', resize);
    this.scene.userData.cam = o;
  }
  _clearTabletop() {
    if (this.scene.userData.cam) delete this.scene.userData.cam;
    if (this._orthoResize) { window.removeEventListener('resize', this._orthoResize); this._orthoResize = null; }
    this._ortho = null;
  }
  _overlayEl(html) {
    const d = document.createElement('div'); d.className = 'overlay'; d.innerHTML = html;
    this.ui.appendChild(d); (this._overlays = this._overlays || []).push(d); this._overlay = d; return d;
  }
  /** Scale a rival by the chosen difficulty (Rookie / Pro / Champion). */
  _rivalBp(bp) {
    if (!bp) return bp;
    const m = [{ s: 0.72, k: 0.82 }, { s: 1, k: 1 }, { s: 1.18, k: 1.15 }][this._diff != null ? this._diff : 1];
    const b = cloneBlueprint(bp); b.speed = (b.speed || 2.4) * m.s; b.stiffness = (b.stiffness || 1) * m.k; return b;
  }
  /** A Zook you can actually compete with — an unbuilt (legless) one gets a
   *  default set of legs so contests are never a no-show. */
  _legged(bp) {
    if (bp && Array.isArray(bp.legs) && bp.legs.length === 0) { const b = cloneBlueprint(bp); b.legs = makeDefaultLegs(3); return b; }
    return bp;
  }
  /** Lifetime contests-won tally — a little progression to come back for. */
  _trophies() { try { return +localStorage.getItem('fz-trophies') || 0; } catch (_) { return 0; } }
  _addTrophy() { try { localStorage.setItem('fz-trophies', this._trophies() + 1); } catch (_) {} }

  /** A celebratory confetti burst over an overlay. */
  _confetti(mount, n = 90) {
    if (prefersReducedMotion()) return;            // honour the OS "reduce motion" setting
    const colors = ['#f0782d', '#2bb6a6', '#3f6fd8', '#e8466e', '#ffd479', '#37c46a'];
    const w = document.createElement('div'); w.className = 'confetti';
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.6).toFixed(2) + 's';
      p.style.animationDuration = (1.5 + Math.random() * 1.6).toFixed(2) + 's';
      w.appendChild(p);
    }
    mount.appendChild(w); setTimeout(() => w.remove(), 4200);
  }
  _showHero(bp) {
    this._hideHero();
    this._hero = new THREE.Group(); this.scene.add(this._hero);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.3, 48),
      new THREE.MeshStandardMaterial({ color: 0xd7d3c9, roughness: 0.7 }));
    plinth.position.y = -0.15; plinth.receiveShadow = true; this._hero.add(plinth);
    this._heroZook = new Zook(bp || this.active.bp, { preview: true, showArrow: false });
    this._hero.add(this._heroZook.group);
    this._heroSpin = true; this._heroSilly = false; this._heroSpinT = 0; this._hero.rotation.y = 0;
    setCamera({ x: 0, y: 2.0, z: 4.8 }, { x: 0, y: 0.4, z: 0 }, true);
  }
  _hideHero() {
    if (this._hero) { this._heroZook.dispose(); this.scene.remove(this._hero); this._hero = null; }
  }

  go(screen, opts = {}) {
    this._clear();
    // The hero Zook belongs to the title screen (which frames it). Every other
    // screen builds its own scene, so keep their backgrounds clean.
    this._hideHero();
    // Ambient soundtrack per mode (workshop noodly, run driving, etc.).
    const MOOD = { workshop: 'build', test: 'build', run: 'run', contestRun: 'contest' };
    music.play(MOOD[screen] || 'menu');
    ({
      title: () => this._title(),
      menu: () => this._menu(),
      workshop: () => this._workshop(opts),
      test: () => this._test(),
      contests: () => this._contests(),
      contestRun: () => this._contestRun(opts),
      versus: () => this._versus(),
      online: () => this._online(),
      run: () => this._run(),
      myzooks: () => this._myzooks(),
    }[screen] || (() => this._menu()))();
  }

  // ── Title ────────────────────────────────────────────────────────────────
  _title() {
    // Hero Zook facing the user; the hand-drawn (animated APNG) doodle is shown
    // as a DOM image so it actually animates.
    // Show a lively legged example so the silly routine has legs to fling about.
    if (!this._titleBp) this._titleBp = randomExample().bp;
    this._showHero(this._titleBp);
    this._heroSpin = false; this._heroSilly = true; this._hero.rotation.y = 0; this._heroZook.group.rotation.y = Math.PI;
    setCamera({ x: 0, y: 1.5, z: 5.2 }, { x: 0, y: 1.0, z: 0 }, true);

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
          <button class="m-btn" data-go="versus"><b>VERSUS</b><span>same phone</span></button>
          <button class="m-btn" data-go="online"><b>ONLINE</b><span>QR link-up</span></button>
          <button class="m-btn" data-go="run"><b>ZOOK RUN</b><span>tilt racer</span></button>
          <button class="m-btn" data-go="myzooks"><b>MY ZOOKS</b><span>your roster</span></button>
        </div>
        <div class="row">
          <button class="m-guide" data-guide><span>FRIED'S TIPS</span><b>${guide.enabled ? 'ON' : 'OFF'}</b></button>
          <button class="m-mute" data-mute><span>SOUND</span><b>${this._muted ? 'OFF' : 'ON'}</b></button>
        </div>
      </div>`);
    d.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { fb.press(); this.go(b.dataset.go); }));
    const gt = d.querySelector('[data-guide]');
    gt.addEventListener('click', () => { fb.tick(); guide.setEnabled(!guide.enabled); gt.querySelector('b').textContent = guide.enabled ? 'ON' : 'OFF'; gt.classList.toggle('off', !guide.enabled); });
    gt.classList.toggle('off', !guide.enabled);
    const mt = d.querySelector('[data-mute]');
    mt.classList.toggle('off', this._muted);
    mt.addEventListener('click', () => { this._muted = !this._muted; setMuted(this._muted); music.mute(this._muted); try { localStorage.setItem('fz-mute', this._muted ? '1' : '0'); } catch (_) {} if (!this._muted) fb.tick(); mt.querySelector('b').textContent = this._muted ? 'OFF' : 'ON'; mt.classList.toggle('off', this._muted); });
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
    // Real contest screenshots from the original game, lightly re-graded.
    const THUMBS = new Set(['dodge', 'merry', 'weakest', 'ball', 'china', 'marbles', 'smash', 'sumo', 'hurdles', 'tag',
      'sprint', 'blockpush', 'ramps', 'steps', 'zigzag', 'assault']);
    const cards = CONTESTS.map(c => `
      <button class="con-card${THUMBS.has(c.id) ? ' has-thumb' : ''}" data-id="${c.id}">
        ${THUMBS.has(c.id) ? `<img class="con-thumb" src="./assets/contests/${c.id}.png" alt="" loading="lazy"/>` : ''}
        <b>${c.name}</b><span>${c.desc}</span></button>`).join('');
    const trophies = this._trophies();
    const d = this._overlayEl(`<div class="sheet">
      <div class="bar"><button class="mini-btn" data-back>‹</button><h2>Contests</h2><span class="trophy-tally" title="contests won">${trophies ? '🏆 ' + trophies : ''}</span></div>
      <button class="con-card coop champ-card" data-champ><b>🏆 CHAMPIONSHIP</b><span>five contests, one champion — like a full episode</span></button>
      <button class="m-guide diff-pick" data-diff><span>RIVAL</span><b>${['ROOKIE', 'PRO', 'CHAMPION'][this._diff]}</b></button>
      <div class="con-grid">${cards}</div></div>`);
    d.querySelector('[data-back]').addEventListener('click', () => { fb.press(); this.go('menu'); });
    const df = d.querySelector('[data-diff]');
    df.addEventListener('click', () => { fb.tick(); this._diff = (this._diff + 1) % 3; try { localStorage.setItem('fz-diff', this._diff); } catch (_) {} df.querySelector('b').textContent = ['ROOKIE', 'PRO', 'CHAMPION'][this._diff]; });
    d.querySelector('[data-champ]').addEventListener('click', () => { fb.confirm(); this._championship(); });
    d.querySelectorAll('.con-card[data-id]').forEach(b => b.addEventListener('click', () => {
      fb.confirm();
      const contest = CONTESTS.find(c => c.id === b.dataset.id);
      this._pickFighters(contest);
    }));
    guide.now(TIPS.contest);
  }

  // The pool of Zooks you can field: your current build, your saved roster, and
  // the built-in examples — deduped by name.
  _fighterPool() {
    const pool = [], seen = new Set();
    const add = (name, bp, active) => { if (!bp || seen.has(name)) return; seen.add(name); pool.push({ name, bp, _active: !!active }); };
    if (this.active && this.active.bp && (this.active.bp.legs || []).length) add(this.active.name || 'My Zook', this.active.bp, true);
    loadRoster().forEach(z => add(z.name, z.bp));
    EXAMPLES.forEach(e => add(e.name, e.bp));
    return pool;
  }

  // Pick which two Zooks battle — the manual's flow: choose your fighters, then
  // the contest. You pick YOU and the RIVAL from the same pool.
  _pickFighters(contest) {
    const pool = this._fighterPool();
    let gi = Math.max(0, pool.findIndex(p => p._active)), ri = 0;
    ri = pool.length > 1 ? (gi + 1) % pool.length : 0;
    const chip = (p) => `hsl(${(p.bp.hue || 0) * 360},70%,55%)`;
    const d = this._overlayEl(`<div class="sheet">
      <div class="bar"><button class="mini-btn" data-back>‹</button><h2>${contest.name}</h2><span style="width:40px"></span></div>
      <p class="fp-tip">Choose your fighters</p>
      <div class="fp-wrap">
        <div class="fp-col" data-side="g"><div class="fp-head green">YOU</div><div class="fp-list"></div></div>
        <div class="fp-vs">VS</div>
        <div class="fp-col" data-side="r"><div class="fp-head red">RIVAL</div><div class="fp-list"></div></div>
      </div>
      <button class="m-btn fp-go" data-go><b>GO ▶</b></button></div>`);
    const render = () => {
      ['g', 'r'].forEach(side => {
        const list = d.querySelector(`.fp-col[data-side=${side}] .fp-list`); list.innerHTML = '';
        pool.forEach((p, i) => {
          const sel = side === 'g' ? i === gi : i === ri;
          const btn = document.createElement('button'); btn.className = 'fp-item' + (sel ? ' on' : '');
          btn.innerHTML = `<span class="fp-chip" style="background:${chip(p)}"></span><span class="fp-name">${p.name}</span>`;
          btn.addEventListener('click', () => { fb.tick();
            if (side === 'g') { gi = i; if (ri === gi) ri = (gi + 1) % pool.length; }
            else { ri = i; if (ri === gi) gi = (ri + 1) % pool.length; }
            render(); });
          list.appendChild(btn);
        });
      });
    };
    render();
    d.querySelector('[data-back]').addEventListener('click', () => { fb.press(); this._contests(); });
    d.querySelector('[data-go]').addEventListener('click', () => { fb.confirm();
      this.go('contestRun', { contest, green: { ...pool[gi] }, red: { ...pool[ri] } }); });
  }

  // ── Championship — a TV episode: 3 contests + a Grand Final relay ─────────
  // (Faithful to the show: two sides, three contests scored on points, then a
  //  decisive relay; episodes sit inside a knockout run of tougher rivals.)
  _championship(stage = 0) {
    const STAGES = ['HEAT', 'SEMI-FINAL', 'GRAND FINAL'];
    const opp = randomExample();
    // A balanced episode like the show: a racing event, a battle, and a skill
    // contest, then the Grand Final relay decider.
    const RACES = ['sprint', 'hurdles', 'ramps', 'steps', 'marbles', 'smash', 'blockpush', 'dodge', 'zigzag', 'assault'];
    const BATTLES = ['sumo', 'weakest', 'tag', 'merry'];
    const SKILL = ['china', 'ball'];
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const rounds = [pick(RACES), pick(BATTLES), pick(SKILL)]
      .map(id => ({ contest: CONTESTS.find(c => c.id === id) }))
      .filter(r => r.contest);
    rounds.push({ contest: { id: 'relay', name: 'Grand Final Relay', desc: 'the decider — first Zook home wins the episode', goal: 'race' }, relay: true });
    music.play('champ');
    this._champ = { opp, rounds, labels: ['CONTEST 1', 'CONTEST 2', 'CONTEST 3', 'RELAY DECIDER'], i: 0, wins: 0, losses: 0, stage, STAGES };
    guide.now(`${STAGES[stage]}! Your Zook versus ${opp.name} — three contests then the Grand Final relay. Best side wins the episode!`);
    this._champRound();
  }
  _champRound() {
    const ch = this._champ, R = ch.rounds[ch.i], contest = R.contest, opp = ch.opp;
    this._clear();
    const cs = new ContestScene({ scene: this.scene, world: this.world, RAPIER: this.RAPIER, camera: this.camera,
      onResult: ({ playerWon, line }) => { playerWon ? ch.wins++ : ch.losses++; this._champStandings(playerWon, line); } });
    cs.enter(contest, this._legged(this.active.bp), this._rivalBp(opp.bp)); this.mode = cs;
    this._contestOverlay(`${this.active.name || 'You'} (${ch.wins})`, `${opp.name} (${ch.losses})`, `${ch.STAGES[ch.stage]} · ${ch.labels[ch.i]}`);
  }
  _champStandings(won, line) {
    const ch = this._champ; ch.i++;
    const episodeOver = ch.i >= ch.rounds.length;
    if (!episodeOver) {
      const r = this._overlayEl(`<div class="result-modal"><h1 class="${won ? 'win' : 'lose'}">${won ? 'WON!' : 'LOST'}</h1>
        <p>${line}</p><p class="champ-standings">${ch.STAGES[ch.stage]} — you ${ch.wins} : ${ch.losses} ${ch.opp.name}</p>
        <div class="row"><button class="m-btn" data-act="next"><b>NEXT ▶</b></button></div></div>`);
      if (won) this._confetti(r);
      r.querySelector('[data-act=next]').onclick = () => { fb.press(); this._champRound(); };
      return;
    }
    // Episode result
    const wonEp = ch.wins > ch.losses;
    const isFinal = ch.stage >= ch.STAGES.length - 1;
    if (wonEp && !isFinal) {
      fb.win();
      const r = this._overlayEl(`<div class="result-modal"><h1 class="win">${ch.STAGES[ch.stage]} WON!</h1>
        <p>You beat ${ch.opp.name} ${ch.wins}–${ch.losses}. Through to the ${ch.STAGES[ch.stage + 1]}!</p>
        <div class="row"><button class="m-btn" data-act="next"><b>NEXT TIE ▶</b></button><button class="m-btn" data-act="menu"><b>MENU</b></button></div></div>`);
      this._confetti(r);
      r.querySelector('[data-act=next]').onclick = () => { fb.press(); this._championship(ch.stage + 1); };
      r.querySelector('[data-act=menu]').onclick = () => { fb.press(); this.go('contests'); };
      guide.now(`Through to the ${ch.STAGES[ch.stage + 1]}!`);
    } else {
      const champ = wonEp && isFinal; champ ? fb.win() : fb.lose();
      const r = this._overlayEl(`<div class="result-modal"><h1 class="${champ ? 'win' : 'lose'}">${champ ? '🏆 CHAMPIONS!' : 'KNOCKED OUT'}</h1>
        <p>${champ ? 'You won the Grand Final — BAMZOOKi champions!' : `${ch.opp.name} edged it ${ch.losses}–${ch.wins}. Tune up and try again!`}</p>
        <div class="row"><button class="m-btn" data-act="again"><b>NEW RUN</b></button><button class="m-btn" data-act="menu"><b>MENU</b></button></div></div>`);
      if (champ) this._confetti(r, 160);
      r.querySelector('[data-act=again]').onclick = () => { fb.press(); this._championship(0); };
      r.querySelector('[data-act=menu]').onclick = () => { fb.press(); this.go('contests'); };
      guide.now(champ ? 'BAMZOOKi CHAMPIONS! What a Zook!' : 'Knocked out — back to the workshop!');
    }
  }

  // ── Contest run ──────────────────────────────────────────────────────────
  _contestRun({ contest, green, red }) {
    const cs = new ContestScene({
      scene: this.scene, world: this.world, RAPIER: this.RAPIER, camera: this.camera,
      onResult: ({ playerWon, line }) => {
        guide.now(line);
        if (playerWon) this._addTrophy();
        this._lastRec = { contestId: contest.id, greenBp: green.bp, redBp: red.bp, frames: cs.getRecording().slice() };
        const r = this._overlayEl(`
          <div class="result-modal ${playerWon ? 'top' : ''}">
            <h1 class="${playerWon ? 'win' : 'lose'}">${playerWon ? `${(green.name || 'YOU').toUpperCase()} WINS!` : `${(red.name || 'RIVAL').toUpperCase()} WINS`}</h1>
            <p>${line}</p>
            <div class="row">
              <button class="m-btn" data-act="again"><b>REMATCH</b></button>
              <button class="m-btn" data-act="replay"><b>REPLAY</b></button>
              <button class="m-btn" data-act="menu"><b>CONTESTS</b></button>
            </div>
          </div>`);
        if (playerWon) this._confetti(r);
        r.querySelector('[data-act=again]').addEventListener('click', () => { fb.press(); this.go('contestRun', { contest, green, red }); });
        r.querySelector('[data-act=replay]').addEventListener('click', () => { fb.press(); this._motionPlayer(this._lastRec, { contest, green, red }); });
        r.querySelector('[data-act=menu]').addEventListener('click', () => { fb.press(); this.go('contests'); });
      },
    });
    cs.enter(contest, this._legged(green.bp), this._legged(this._rivalBp(red.bp)));
    this.mode = cs;
    this._contestOverlay(green.name || 'You', red.name, contest.name);
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
    d.querySelector('[data-new]').addEventListener('click', () => { fb.confirm(); this.active = { name: randomName(), bp: blankBlueprint() }; this.go('workshop'); });
    d.querySelectorAll('.mz-item').forEach(b => b.addEventListener('click', () => {
      fb.press();
      const z = (+b.dataset.saved ? roster : EXAMPLES)[+b.dataset.i];
      const bp = { ...defaultBlueprint(), ...z.bp };
      if (!z.bp.legs) delete bp.legs;   // let it rebuild legs from the example's own fields
      this.active = { name: z.name, bp };
      this.go('workshop');
    }));
  }

  // ── Motion Player (Ch17) — replay a recorded contest ──────────────────────
  _motionPlayer(rec, back) {
    if (!rec || !rec.frames.length) return;
    this._clear();
    const contest = CONTESTS.find(c => c.id === rec.contestId);
    const cs = new ContestScene({ scene: this.scene, world: this.world, RAPIER: this.RAPIER, camera: this.camera, onResult: () => {} });
    cs.enter(contest, rec.greenBp, rec.redBp, { remote: true });
    this.mode = cs;
    this._replay = { frames: rec.frames, t: 0, playing: true, rate: 1, loop: true, dur: rec.frames.length * 0.05 };
    const d = this._overlayEl(`
      <div class="con-hud"><span class="vs">⏵ MOTION PLAYER · ${contest.name}</span></div>
      <div class="mp-bar">
        <button class="mini-btn" data-mp="play">❚❚</button>
        <input class="mp-scrub" type="range" min="0" max="1000" value="0" />
        <button class="mini-btn ${'on'}" data-mp="loop">⟲</button>
        <button class="mini-btn" data-mp="eject">⏏</button>
      </div>`);
    this._scrub = d.querySelector('.mp-scrub');
    const playBtn = d.querySelector('[data-mp=play]'), loopBtn = d.querySelector('[data-mp=loop]');
    playBtn.onclick = () => { fb.tick(); this._replay.playing = !this._replay.playing; playBtn.textContent = this._replay.playing ? '❚❚' : '⏵'; };
    loopBtn.onclick = () => { fb.tick(); this._replay.loop = !this._replay.loop; loopBtn.classList.toggle('on', this._replay.loop); };
    d.querySelector('[data-mp=eject]').onclick = () => { fb.press(); this._replay = null; this._scrub = null; back ? this._contestRunResultBack(back) : this.go('menu'); };
    this._scrub.oninput = () => { this._replay.t = (this._scrub.value / 1000) * this._replay.dur; this._replay.playing = false; playBtn.textContent = '⏵'; };
    guide.now('Motion Player — watch the contest back. Scrub the timeline, loop, or eject.');
  }
  _contestRunResultBack(back) { this.go('contestRun', back); }

  // ── ZOOK RUN (tilt-timing racer) ──────────────────────────────────────────
  async _run() {
    await requestTilt();
    this._clear();
    const r = new ZookRun({ scene: this.scene, camera: this.camera, canvas: this.canvas, mount: this.ui,
      bp: this.active.bp, seed: (Date.now() & 0xffff) || 1, onExit: () => this.go('menu') });
    r.enter(); this.mode = r;
  }
  // Online race: same seed, each renders its own Zook; compare finish times.
  async _runRaceHost() {
    const seed = (Date.now() & 0xffff) || 1;
    this._link.onMessage = (m) => { if (m.type === 'run-done') { this._runOpp = m.time; if (this._runScene) this._runResolve(this._runScene); } };
    this._link.send({ type: 'run-start', seed });
    this._runStart(seed, 'host');
  }
  async _runStart(seed, role) {
    await requestTilt();
    this._clear();
    this._runMine = null; this._runOpp = null; this._runRole = role;
    const r = new ZookRun({ scene: this.scene, camera: this.camera, canvas: this.canvas, mount: this.ui,
      bp: this.active.bp, seed, vsName: this._peer ? this._peer.name : 'Rival',
      onExit: () => { this._netClose(); this.go('menu'); },
      onFinish: (time) => { this._runMine = time; this._link.send({ type: 'run-done', time }); this._runResolve(r); } });
    r.enter(); this.mode = r; this._runScene = r;
  }
  _runResolve(r) {
    if (this._runMine == null) return;
    if (this._runOpp == null) { r.result(`You finished ${this._runMine.toFixed(1)}s — waiting for rival…`); return; }
    const won = this._runMine <= this._runOpp;
    r.result(`${won ? 'YOU WIN!' : 'Rival wins'} — you ${this._runMine.toFixed(1)}s vs ${this._runOpp.toFixed(1)}s`);
  }

  // ── ZOOK LAB — Spaceteam-style co-op (shout the commands) ─────────────────
  _labLabels() {
    const POOL = ['FLUX', 'GIZMO', 'CRANK', 'VALVE', 'WARP', 'PRISM', 'TURBO', 'SPROCKET', 'VENT', 'CORE', 'BLASTER', 'NACELLE'];
    for (let i = POOL.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [POOL[i], POOL[j]] = [POOL[j], POOL[i]]; }
    return POOL;   // shuffled; host takes 0..4, joiner 5..9 (disjoint labels)
  }
  _labGenPanel(prefix, labels) {
    return labels.map((label, i) => i < 3
      ? { id: prefix + i, label, type: 'knob', value: Math.floor(Math.random() * 10), min: 0, max: 9 }
      : { id: prefix + i, label, type: 'switch', value: Math.random() < 0.5 });
  }
  _labCmd(panel, vals) {
    const c = panel[Math.floor(Math.random() * panel.length)];
    let want, text;
    if (c.type === 'knob') { do { want = Math.floor(Math.random() * 10); } while (want === vals[c.id]); text = `Set ${c.label} to ${want}`; }
    else { want = !vals[c.id]; text = `${want ? 'ENGAGE' : 'CUT'} the ${c.label}`; }
    return { targetId: c.id, want, text, t: c.type === 'knob' ? 9 : 7 };
  }
  _labRenderPanel(mount, panel, onChange) {
    const wrap = document.createElement('div'); wrap.className = 'lab-panel';
    panel.forEach(c => {
      if (c.type === 'knob') wrap.appendChild(Knob({ label: c.label, min: c.min, max: c.max, step: 1, value: c.value, format: v => String(Math.round(v)), onChange: v => onChange(c.id, Math.round(v)) }).root);
      else wrap.appendChild(Switch({ label: c.label, value: c.value, onChange: v => onChange(c.id, v) }).root);
    });
    mount.appendChild(wrap);
  }
  _labOverlay() {
    const d = this._overlayEl(`<div class="lab-screen">
      <div class="lab-top"><span class="lab-score">0</span><div class="lab-health"><i></i></div></div>
      <div class="lab-cmd">get ready…</div>
      <div class="lab-mount"></div>
      <button class="mini-btn lab-quit" data-x>QUIT</button></div>`);
    d.querySelector('[data-x]').onclick = () => { fb.press(); this._netClose(); this.go('menu'); };
    this._labUI = d; return d;
  }
  _labSetUI(cmd, health, score) {
    const d = this._labUI; if (!d) return;
    d.querySelector('.lab-cmd').textContent = cmd;
    d.querySelector('.lab-score').textContent = `★ ${score}`;
    const bar = d.querySelector('.lab-health i'); bar.style.width = Math.max(0, health) + '%';
    bar.style.background = health < 35 ? '#e8466e' : '#37c46a';
  }

  _labHost() {
    this._clear();
    const labels = this._labLabels();
    const panelA = this._labGenPanel('A', labels.slice(0, 5)), panelB = this._labGenPanel('B', labels.slice(5, 10));
    const vals = {}; [...panelA, ...panelB].forEach(c => vals[c.id] = c.value);
    const L = this._lab = { role: 'host', panelA, panelB, vals, health: 100, score: 0, over: false, netT: 0 };
    L.cmdA = this._labCmd(panelB, vals); L.cmdB = this._labCmd(panelA, vals);
    this._link.send({ type: 'lab-setup', panel: panelB });
    this._link.send({ type: 'lab', cmd: L.cmdB.text, health: 100, score: 0 });
    this._link.onMessage = (m) => this._labMsgHost(m);
    const d = this._labOverlay();
    this._labRenderPanel(d.querySelector('.lab-mount'), panelA, (id, v) => this._labHostLocal(id, v));
    this._labSetUI(L.cmdA.text, 100, 0); guide.now(L.cmdA.text + '!');
  }
  _labHostLocal(id, val) {
    const L = this._lab; if (!L || L.over) return; L.vals[id] = val;
    if (L.cmdB.targetId === id && val === L.cmdB.want) { L.score++; fb.confirm(); L.cmdB = this._labCmd(L.panelA, L.vals); this._link.send({ type: 'lab', cmd: L.cmdB.text, health: L.health, score: L.score }); this._labWin(); }
  }
  _labMsgHost(m) {
    const L = this._lab; if (!L || L.over) return;
    if (m.type === 'ctl') { L.vals[m.id] = m.val;
      if (L.cmdA.targetId === m.id && m.val === L.cmdA.want) { L.score++; fb.confirm(); L.cmdA = this._labCmd(L.panelB, L.vals); guide.now(L.cmdA.text + '!'); this._labSetUI(L.cmdA.text, L.health, L.score); this._labWin(); } }
  }
  _labTick(dt) {
    const L = this._lab; if (!L || L.role !== 'host' || L.over) return;
    L.cmdA.t -= dt; L.cmdB.t -= dt;
    if (L.cmdA.t <= 0) { L.health -= 12; fb.thud(); L.cmdA = this._labCmd(L.panelB, L.vals); guide.now(L.cmdA.text + '!'); }
    if (L.cmdB.t <= 0) { L.health -= 12; fb.thud(); L.cmdB = this._labCmd(L.panelA, L.vals); this._link.send({ type: 'lab', cmd: L.cmdB.text, health: L.health, score: L.score }); }
    L.netT += dt; if (L.netT >= 0.4) { L.netT = 0; this._link.send({ type: 'lab', cmd: L.cmdB.text, health: L.health, score: L.score }); }
    this._labSetUI(L.cmdA.text, L.health, L.score); this._labWin();
  }
  _labWin() {
    const L = this._lab; if (L.over) return;
    if (L.health <= 0) { L.over = true; this._link.send({ type: 'lab-end', win: false }); this._resultOverlay(false, 'The core blew! Work on your shouting.', () => this._online()); }
    else if (L.score >= 15) { L.over = true; this._link.send({ type: 'lab-end', win: true }); fb.win(); this._resultOverlay(true, 'Core stable — you saved the lab together!', () => this._online()); }
  }

  // ── Online (QR-linked WebRTC) ─────────────────────────────────────────────
  _netClose() { try { this._link?.close(); } catch (_) {} this._link = null; this._netRole = null; this._peer = null; }

  _online() {
    this._netClose();
    const d = this._overlayEl(`<div class="sheet">
      <div class="bar"><button class="mini-btn" data-back>‹</button><h2>Online Link</h2><span style="width:40px"></span></div>
      <div class="link-panel" id="onl"></div></div>`);
    d.querySelector('[data-back]').addEventListener('click', () => { fb.press(); this._netClose(); this.go('menu'); });
    const box = d.querySelector('#onl');
    box.innerHTML = `<div class="link-anim"><span class="link-dot"></span><span class="link-dot"></span><span class="link-dot"></span></div>
      <p class="link-status">Two phones, no server — pair with a QR.</p>
      <div class="row"><button class="m-btn" data-r="host"><b>HOST</b><span>show a code</span></button>
      <button class="m-btn" data-r="join"><b>JOIN</b><span>scan a code</span></button></div>`;
    box.querySelector('[data-r=host]').onclick = () => { fb.press(); this._hostFlow(box); };
    box.querySelector('[data-r=join]').onclick = () => { fb.press(); this._joinFlow(box); };
    guide.now('Online! One phone hosts and shows a QR, the other scans it. No server — just your two phones.');
  }

  async _hostFlow(box) {
    box.innerHTML = `<p class="link-status">Starting…</p>`;
    const l = this._link = new Link(); this._netRole = 'host';
    l.onOpen = () => { box.innerHTML = `<p class="link-status">Connected! Waiting for Player 2’s Zook…</p>`; };
    l.onMessage = (m) => { if (m.type === 'hello') { this._peer = { name: m.name, bp: m.bp }; this._hostPick(box); } };
    let code; try { code = await l.host(); } catch (e) { box.innerHTML = `<p class="link-status">Couldn’t start (${e.message}).</p>`; return; }
    const qr = await makeQR(code);
    box.innerHTML = `<p class="link-status">1 · Show this to Player 2</p>`;
    box.appendChild(qr);
    const row = document.createElement('div');
    row.innerHTML = `<button class="mini-btn wide" data-scan>2 · SCAN THEIR REPLY</button>
      <details class="net-fallback"><summary>or paste reply code</summary><textarea class="net-code" placeholder="paste reply"></textarea><button class="mini-btn" data-paste>USE CODE</button></details>`;
    box.appendChild(row);
    row.querySelector('[data-scan]').onclick = () => this._scan(async (t) => { try { await l.accept(t); } catch (_) {} });
    row.querySelector('[data-paste]').onclick = async () => { try { await l.accept(row.querySelector('.net-code').value); } catch (_) {} };
  }

  _hostPick(box) {
    const render = () => {
      const tt = this._tabletop;
      const ids = tt ? TABLETOP_IDS : ONLINE_IDS;
      const cs = CONTESTS.filter(c => ids.includes(c.id));
      box.innerHTML = `<p class="link-status">Connected to ${this._peer.name}!</p>
        <div class="mode-pick">
          <button class="seg-btn ${tt ? '' : 'on'}" data-m="same">SAME SCREEN</button>
          <button class="seg-btn ${tt ? 'on' : ''}" data-m="tab">TABLETOP · 2 PHONES</button>
        </div>
        <p class="link-status">${tt ? 'Lay both phones edge-to-edge — one arena across two screens.' : 'Pick a contest:'}</p>
        <div class="con-grid"></div>`;
      box.querySelector('[data-m=same]').onclick = () => { fb.tick(); this._tabletop = false; render(); };
      box.querySelector('[data-m=tab]').onclick = () => { fb.tick(); this._tabletop = true; render(); };
      const grid = box.querySelector('.con-grid');
      cs.forEach(c => { const b = document.createElement('button'); b.className = 'con-card'; b.innerHTML = `<b>${c.name}</b><span>${c.desc}</span>`;
        b.onclick = () => { fb.confirm(); this._runHostContest(c, this._tabletop); }; grid.appendChild(b); });
      const coop = document.createElement('button'); coop.className = 'con-card coop';
      coop.innerHTML = `<b>⚙ ZOOK LAB · CO-OP</b><span>shout the commands — keep the core alive!</span>`;
      coop.onclick = () => { fb.confirm(); this._labHost(); };
      grid.appendChild(coop);
      const race = document.createElement('button'); race.className = 'con-card coop';
      race.innerHTML = `<b>🏁 ZOOK RUN · RACE</b><span>tilt-timing race, same track — first home wins</span>`;
      race.onclick = () => { fb.confirm(); this._runRaceHost(); };
      grid.appendChild(race);
    };
    render();
  }

  _runHostContest(contest, tabletop) {
    const green = this.active, red = this._peer;
    this._link.send({ type: 'start', contest: contest.id, greenBp: green.bp, redBp: red.bp, tabletop });
    this._clear();
    if (tabletop) this._setupTabletop('host');
    const cs = new ContestScene({ scene: this.scene, world: this.world, RAPIER: this.RAPIER, camera: this.camera,
      onResult: ({ playerWon, line }) => {
        this._link.send({ type: 'result', winner: playerWon ? 'green' : 'red', line });
        this._resultOverlay(playerWon, line, () => this._online());
      } });
    cs.enter(contest, this._legged(green.bp), this._legged(red.bp), { tabletop });
    this.mode = cs;
    this._contestOverlay(green.name || 'You', red.name, contest.name, tabletop, 'host');
  }

  async _joinFlow(box) {
    this._netRole = 'join';
    box.innerHTML = `<p class="link-status">Scan the host’s QR code…</p>
      <details class="net-fallback" open><summary>or paste host code</summary><textarea class="net-code" placeholder="paste host code"></textarea><button class="mini-btn" data-paste>USE CODE</button></details>
      <button class="mini-btn wide" data-scan>OPEN SCANNER</button>`;
    const go = async (hostCode) => {
      const l = this._link = new Link();
      l.onOpen = () => { l.send({ type: 'hello', name: this.active.name, bp: this.active.bp }); };
      l.onMessage = (m) => this._joinMsg(m);
      let reply; try { reply = await l.join(hostCode); } catch (e) { box.innerHTML = `<p class="link-status">Bad code (${e.message}).</p>`; return; }
      const qr = await makeQR(reply);
      box.innerHTML = `<p class="link-status">Show this reply to the host</p>`; box.appendChild(qr);
      const f = document.createElement('details'); f.className = 'net-fallback'; f.innerHTML = `<summary>or copy reply code</summary><textarea class="net-code" readonly>${reply}</textarea>`;
      box.appendChild(f);
    };
    box.querySelector('[data-scan]').onclick = () => this._scan(go);
    box.querySelector('[data-paste]').onclick = () => go(box.querySelector('.net-code').value);
  }

  _joinMsg(m) {
    if (m.type === 'start') {
      const contest = CONTESTS.find(c => c.id === m.contest);
      this._clear();
      if (m.tabletop) this._setupTabletop('join');
      const cs = new ContestScene({ scene: this.scene, world: this.world, RAPIER: this.RAPIER, camera: this.camera, onResult: () => {} });
      cs.enter(contest, m.greenBp, m.redBp, { remote: true, tabletop: m.tabletop });
      this.mode = cs;
      this._contestOverlay('Host', this.active.name, contest.name, m.tabletop, 'join');
    } else if (m.type === 'state' && this.mode && this.mode.applyState) {
      this.mode.applyState(m);
    } else if (m.type === 'result') {
      this._resultOverlay(m.winner === 'red', m.line, () => this._online());
    } else if (m.type === 'lab-setup') {
      this._clear(); this._lab = { role: 'join' };
      const d = this._labOverlay();
      this._labRenderPanel(d.querySelector('.lab-mount'), m.panel, (id, v) => this._link.send({ type: 'ctl', id, val: v }));
      this._labSetUI('get ready…', 100, 0);
    } else if (m.type === 'lab') {
      this._labSetUI(m.cmd, m.health, m.score);
      if (m.cmd !== this._labLastCmd) { this._labLastCmd = m.cmd; guide.now(m.cmd + '!'); }
    } else if (m.type === 'lab-end') {
      this._resultOverlay(m.win, m.win ? 'Core stable — you saved the lab together!' : 'The core blew! Try again.', () => this._online());
    } else if (m.type === 'run-start') {
      this._runStart(m.seed, 'join');
    } else if (m.type === 'run-done') {
      this._runOpp = m.time; if (this._runScene) this._runResolve(this._runScene);
    }
  }

  async _scan(onCode) {
    const ov = this._overlayEl(`<div class="scan-wrap"><video class="scan-video" playsinline></video>
      <p class="link-status">point at the QR</p><button class="mini-btn" data-x>CANCEL</button></div>`);
    const video = ov.querySelector('video');
    let stop = () => {};
    ov.querySelector('[data-x]').onclick = () => { stop(); ov.remove(); };
    try {
      stop = await startScan(video, (code) => { stop(); ov.remove(); onCode(code); });
    } catch (e) {
      ov.querySelector('.link-status').textContent = 'Camera unavailable — paste the code instead.';
    }
  }

  _contestOverlay(greenName, redName, contestName, tabletop, role) {
    const seam = role === 'host' ? 'right' : 'left';
    const seamHtml = tabletop
      ? `<div class="seam seam-${seam}"><span>▸</span><span>▸</span><span>▸</span></div>
         <div class="tabletop-hint">lay phones edge-to-edge · line up the ▸ marks</div>` : '';
    const d = this._overlayEl(`
      <button class="game-back" data-back><img src="./assets/btn-back.png" alt="Menu"/></button>
      <div class="con-hud"><span class="tag green">${greenName}</span><span class="vs">${contestName}</span><span class="tag red">${redName}</span></div>
      <div class="con-score"></div>
      <div class="countdown"></div>
      <div class="vs-card"><div class="vs-row"><span class="tag green">${greenName}</span><b>VS</b><span class="tag red">${redName}</span></div><div class="vs-name">${contestName}</div></div>${seamHtml}`);
    d.querySelector('[data-back]').addEventListener('click', () => { fb.press(); this._exitGame(); });
    this._countdownEl = d.querySelector('.countdown');
    this._scoreEl = d.querySelector('.con-score');
    const vc = d.querySelector('.vs-card'); setTimeout(() => { if (vc) vc.remove(); }, 2200);
  }

  /** Leave any game (contest/champ/online/tabletop/run/lab) back to the menu. */
  _exitGame() { this._champ = null; this._netClose(); this.go('menu'); }

  _resultOverlay(playerWon, line, again) {
    const r = this._overlayEl(`<div class="result-modal">
      <h1 class="${playerWon ? 'win' : 'lose'}">${playerWon ? 'YOU WIN!' : 'YOU LOSE'}</h1>
      <p>${line || ''}</p>
      <div class="row"><button class="m-btn" data-act="again"><b>AGAIN</b></button><button class="m-btn" data-act="menu"><b>MENU</b></button></div></div>`);
    r.querySelector('[data-act=again]').onclick = () => { fb.press(); again(); };
    r.querySelector('[data-act=menu]').onclick = () => { fb.press(); this._netClose(); this.go('menu'); };
  }
}
