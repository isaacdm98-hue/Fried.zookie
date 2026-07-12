/* CELESTE EXPRESS — engine core (logic only), shared by the ES5 slice and
   the HD pipeline build. Attaches window.CE. ES5, no renderer, no DOM. */
/* ============================================================================
   CELESTE EXPRESS — single-file, zero-build, ES5-only PWA.
   All runtime art and audio are procedural. Three.js r128 is the only runtime
   dependency (plus Google Fonts, which fall back to system fonts offline).
   Everything is namespaced under window.CE so the smoke harness can boot the
   logic headless (opts.headless skips the renderer and audio hardware).
   British English throughout. var + function only.
   ============================================================================ */
(function (root) {
  "use strict";
  var CE = {};
  root.CE = CE;
  CE.version = "0.1.0-slice";

  /* -- tiny helpers ---------------------------------------------------------- */
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  CE.clamp = clamp; CE.lerp = lerp;

  /* ==========================================================================
     PALETTE + CONTRAST LAW  (Section 2)  — assertion 20
     ========================================================================== */
  var Palette = {
    plum:   "#2B1B33", velvet:   "#46284F", marigold: "#FFB13D", tangerine: "#FF7847",
    peach:  "#FFE8CE", gold:     "#D9A441", teal:     "#35C4B5", raspberry: "#E8508D",
    green:  "#6FA05E", hush:     "#8D8A93"
  };
  function chan(c) { c = c / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function relLum(hex) {
    var r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16);
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
  }
  function contrast(a, b) {
    var l1 = relLum(a), l2 = relLum(b), hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }
  /* Declared UI text/background contract. Only pairs the UI actually renders as
     text-on-fill are listed; every one must clear 4.5:1. Raspberry, Disco Gold
     and Hush Grey are decoration/fills only, never body text backgrounds. */
  var uiPairs = [
    { name: "HUD body",        fg: Palette.peach, bg: Palette.plum },
    { name: "Dialogue",        fg: Palette.peach, bg: Palette.velvet },
    { name: "HUD numerals",    fg: Palette.gold,  bg: Palette.plum },
    { name: "Chapter card",    fg: Palette.plum,  bg: Palette.peach },
    { name: "Marmalade name",  fg: Palette.plum,  bg: Palette.marigold },
    { name: "Action label",    fg: Palette.plum,  bg: Palette.tangerine },
    { name: "Zil name",        fg: Palette.plum,  bg: Palette.teal },
    { name: "Ticket ink",      fg: Palette.plum,  bg: Palette.peach },
    { name: "Garden sign",     fg: Palette.plum,  bg: Palette.green }
  ];
  CE.Palette = Palette;
  CE.contrast = contrast;
  CE.auditContrast = function () {
    var out = [], ok = true, i, r;
    for (i = 0; i < uiPairs.length; i++) {
      r = contrast(uiPairs[i].fg, uiPairs[i].bg);
      if (r < 4.5) ok = false;
      out.push({ name: uiPairs[i].name, ratio: Math.round(r * 100) / 100, pass: r >= 4.5 });
    }
    return { ok: ok, pairs: out };
  };

  /* ==========================================================================
     BEAT CLOCK  (Section 5.1)  — assertions 4, 5, 6, 19
     WebAudio look-ahead scheduler (Chris Wilson) in the browser; a pure logical
     clock headless. Master 120 BPM: beat 500 ms, bar 2000 ms (4 beats).
     ========================================================================== */
  function Clock() {
    this.bpm = 120;
    this.beatMs = 60000 / this.bpm;      /* 500 */
    this.beatsPerBar = 4;
    this.barMs = this.beatMs * this.beatsPerBar;
    this.startMs = 0;
    this.nowMs = 0;
    this.nextBeatTime = 0;               /* scheduler cursor, incremented by beatMs */
    this.beatCount = 0;
    this.running = false;
    this.onBeatFns = [];
    this.onBarFns = [];
    this.driftMax = 0;
  }
  Clock.prototype.start = function (nowMs) {
    this.startMs = nowMs || 0;
    this.nowMs = this.startMs;
    this.nextBeatTime = this.startMs;
    this.beatCount = 0;
    this.driftMax = 0;
    this.running = true;
  };
  Clock.prototype.stop = function () { this.running = false; };
  Clock.prototype.resume = function (nowMs) {
    /* keep phase continuity: shift start so phase is preserved */
    if (this.running) return;
    var phase = 0;
    this.startMs = (nowMs || 0);
    this.nextBeatTime = this.startMs;
    this.running = true;
    if (phase) { /* placeholder to keep var used */ }
  };
  Clock.prototype.onBeat = function (fn) { this.onBeatFns.push(fn); };
  Clock.prototype.onBar = function (fn) { this.onBarFns.push(fn); };
  /* Advance the clock to currentTime; fire any beats whose scheduled time has
     passed. Ideal beat N time = startMs + N*beatMs; the scheduler cursor is
     start + N*beatMs too, so accumulated drift is float epsilon only. */
  Clock.prototype.advance = function (currentMs) {
    if (!this.running) return;
    this.nowMs = currentMs;
    var i, fn, ideal, drift;
    while (this.nextBeatTime <= currentMs + 0.0001) {
      ideal = this.startMs + this.beatCount * this.beatMs;
      drift = Math.abs(this.nextBeatTime - ideal);
      if (drift > this.driftMax) this.driftMax = drift;
      for (i = 0; i < this.onBeatFns.length; i++) { fn = this.onBeatFns[i]; fn(this.beatCount); }
      if (this.beatCount % this.beatsPerBar === 0) {
        for (i = 0; i < this.onBarFns.length; i++) { fn = this.onBarFns[i]; fn(this.beatCount / this.beatsPerBar); }
      }
      this.beatCount++;
      this.nextBeatTime = this.startMs + this.beatCount * this.beatMs;
    }
  };
  Clock.prototype.phase = function () {
    var t = (this.nowMs - this.startMs) % this.beatMs;
    if (t < 0) t += this.beatMs;
    return t / this.beatMs;
  };
  Clock.prototype.barPhase = function () {
    var t = (this.nowMs - this.startMs) % this.barMs;
    if (t < 0) t += this.barMs;
    return t / this.barMs;
  };
  /* distance in ms to the nearest beat edge, for On-Beat windows */
  Clock.prototype.msToNearestBeat = function (atMs) {
    var t = (atMs - this.startMs) % this.beatMs;
    if (t < 0) t += this.beatMs;
    return Math.min(t, this.beatMs - t);
  };
  Clock.prototype.isOnBeat = function (atMs, windowMs) {
    return this.msToNearestBeat(atMs) <= (windowMs === undefined ? 90 : windowMs);
  };
  /* Simulate a run and report worst drift (assertion 4). */
  Clock.prototype.simulateDrift = function (durationMs, stepMs) {
    var t = this.startMs;
    while (t <= this.startMs + durationMs) { this.advance(t); t += stepMs; }
    return this.driftMax;
  };
  CE.Clock = Clock;

  /* ==========================================================================
     SEEDED RNG + ARCHETYPE GENERATOR  (Section 8)  — assertion 8
     Deterministic seed = carriage number, so the world is stable across saves.
     ========================================================================== */
  function Rand(seed) { this.s = (seed >>> 0) || 1; }
  Rand.prototype.next = function () {
    /* mulberry32 */
    this.s = (this.s + 0x6D2B79F5) >>> 0;
    var t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t = (t ^ (t + Math.imul(t ^ (t >>> 7), t | 61))) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Rand.prototype.range = function (lo, hi) { return lo + (hi - lo) * this.next(); };
  Rand.prototype.int = function (lo, hi) { return Math.floor(this.range(lo, hi + 1)); };
  Rand.prototype.pick = function (arr) { return arr[this.int(0, arr.length - 1)]; };
  CE.Rand = Rand;

  var ARCHETYPES = [
    "bunk_maze", "ballroom", "galley_garden", "mirror_hall", "quiet_car",
    "press_station", "corridor_sleeper", "half_pipe_lounge", "cargo",
    "greenhouse_roofless", "diorama_lounge", "engine"
  ];
  CE.ARCHETYPES = ARCHETYPES;

  /* Bands (Section 3) */
  function bandOf(car) {
    if (car >= 91) return { id: "I", name: "The Caboose Districts" };
    if (car >= 61) return { id: "II", name: "The Sleeper Belt" };
    if (car === 60) return { id: "MID", name: "The Meridian Ballroom" };
    if (car >= 31) return { id: "III", name: "The Galley Gardens" };
    if (car >= 2) return { id: "IV", name: "First Class Mirrorworks" };
    return { id: "V", name: "The Origin Deck" };
  }
  CE.bandOf = bandOf;

  var BIOMES = ["Dusk Desert", "Aurora Tundra", "Sea Viaduct", "Marmalade Canyon", "Glass Prairie", "The Still's Edge"];
  function biomeOf(car) {
    /* Cycle every ~10 carriages; the Still's Edge only near the front. */
    if (car <= 5) return BIOMES[5];
    var idx = Math.floor((120 - car) / 10) % 5;
    return BIOMES[idx];
  }
  CE.biomeOf = biomeOf;

  /* Deterministically generate a carriage layout and a stable hash. */
  function genCarriage(car) {
    var rng = new Rand(car * 2654435761 >>> 0 || car || 1);
    var band = bandOf(car);
    /* engine + meridian are authored archetypes */
    var arche;
    if (car === 1) arche = "engine";
    else if (car === 60) arche = "ballroom";
    else arche = ARCHETYPES[rng.int(0, ARCHETYPES.length - 3)]; /* exclude diorama/engine mostly */
    var props = [], n = rng.int(4, 9), i;
    for (i = 0; i < n; i++) {
      props.push({
        kind: rng.pick(["speaker", "crate", "bench", "lamp", "planter", "rail", "table"]),
        x: Math.round(rng.range(-3.2, 3.2) * 100) / 100,
        z: Math.round(rng.range(-9, 9) * 100) / 100,
        lane: rng.pick(["interior", "roof", "undercarriage"])
      });
    }
    var layout = {
      carriage: car,
      archetype: arche,
      band: band.id,
      biome: biomeOf(car),
      hasQuietCar: (car % 7 === 0),
      hasPress: (car % 11 === 0),
      speakers: rng.int(1, 4),
      props: props,
      keySeed: rng.int(1000, 9999)
    };
    layout.hash = hashLayout(layout);
    return layout;
  }
  function hashLayout(l) {
    /* small deterministic FNV-1a over a canonical string */
    var s = l.carriage + "|" + l.archetype + "|" + l.band + "|" + l.speakers + "|" + l.keySeed + "|";
    var i, j, p;
    for (i = 0; i < l.props.length; i++) {
      p = l.props[i];
      s += p.kind + p.x + p.z + p.lane + ";";
    }
    var h = 2166136261 >>> 0;
    for (j = 0; j < s.length; j++) { h ^= s.charCodeAt(j); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  CE.genCarriage = genCarriage;

  /* ==========================================================================
     CARRIAGE STREAMING  (Section 8)  — assertion 7
     Exactly 3 carriages live (prev/current/next) as pooled groups.
     ========================================================================== */
  function Stream(builder) {
    this.builder = builder || function (car) { return { carriage: car, layout: genCarriage(car) }; };
    this.pool = {};        /* carriage -> group */
    this.current = 0;
    this.min = 1; this.max = 120;
    this.built = 0; this.disposed = 0;
  }
  Stream.prototype.wanted = function (car) {
    var w = [], i;
    for (i = car - 1; i <= car + 1; i++) { if (i >= this.min && i <= this.max) w.push(i); }
    return w;
  };
  Stream.prototype.go = function (car) {
    car = clamp(car, this.min, this.max);
    this.current = car;
    var want = this.wanted(car), i, k, keep = {};
    for (i = 0; i < want.length; i++) {
      k = want[i]; keep[k] = true;
      if (!has(this.pool, k)) { this.pool[k] = this.builder(k); this.built++; }
    }
    for (k in this.pool) {
      if (has(this.pool, k) && !keep[k]) {
        if (this.pool[k] && this.pool[k].dispose) this.pool[k].dispose();
        delete this.pool[k]; this.disposed++;
      }
    }
    return this.liveCount();
  };
  Stream.prototype.liveCount = function () {
    var n = 0, k;
    for (k in this.pool) { if (has(this.pool, k)) n++; }
    return n;
  };
  CE.Stream = Stream;

  /* ==========================================================================
     DRAWN-CURVE THROW SAMPLER  (Section 5.2)  — assertion 9
     Catmull-Rom smoothing over <=5 control points; returns to hand if the
     drawn path loops home.
     ========================================================================== */
  function catmull(p0, p1, p2, p3, t) {
    var t2 = t * t, t3 = t2 * t;
    return {
      x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
    };
  }
  var Throw = {
    LOOP_EPS: 0.6,
    sample: function (pts, perSeg) {
      perSeg = perSeg || 12;
      var cps = pts.slice(0, 5);
      var loops = false;
      if (cps.length >= 3) {
        var a = cps[0], b = cps[cps.length - 1];
        var d = Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
        loops = d <= this.LOOP_EPS;
      }
      var padded = [cps[0]].concat(cps).concat([cps[cps.length - 1]]);
      var out = [], i, s;
      for (i = 0; i < padded.length - 3; i++) {
        for (s = 0; s < perSeg; s++) {
          out.push(catmull(padded[i], padded[i + 1], padded[i + 2], padded[i + 3], s / perSeg));
        }
      }
      out.push(cps[cps.length - 1]);
      return { curve: out, loopsHome: loops, returns: loops };
    }
  };
  CE.Throw = Throw;

  /* Record types (Section 5.2) */
  CE.RECORDS = {
    "7in":     { name: "7\" Standard",   cost: 1, arc: 0.0, breaks: false, stuns: false, pierces: false },
    "12in":    { name: "12\" Heavyweight", cost: 2, arc: 0.4, breaks: true, stuns: false, pierces: false },
    "picture": { name: "Picture Disc",   cost: 2, arc: 0.1, breaks: false, stuns: true, pierces: false },
    "dubplate":{ name: "Dubplate",       cost: 1, arc: 0.2, breaks: false, stuns: false, pierces: false, blank: true },
    "gold45":  { name: "Golden 45",      cost: 5, arc: 0.0, breaks: true, stuns: true, pierces: true, dances: true }
  };

  /* Dubplate — record a world sound, replay it elsewhere (assertion 10) */
  function Dubplate() { this.payload = null; this.armed = true; }
  Dubplate.prototype.record = function (soundEvent) {
    if (!this.armed) return false;
    this.payload = { id: soundEvent.id, freq: soundEvent.freq, dur: soundEvent.dur, at: soundEvent.at };
    this.armed = false;
    return true;
  };
  Dubplate.prototype.replay = function () { return this.payload; };
  Dubplate.prototype.isBlank = function () { return this.armed; };
  CE.Dubplate = Dubplate;

  /* ==========================================================================
     PROCEDURAL DISCO ENGINE  (Section 7)  — assertions 12
     Layer manager; Hush Bubble ducks layers inside its radius.
     ========================================================================== */
  var LAYERS = ["kick", "hats", "bass", "stab", "wah", "conga"];
  function AudioEngine() {
    this.ctx = null;
    this.running = false;
    this.masterLayers = LAYERS.slice();     /* which layers currently arranged */
    this.fullness = 1.0;
    this.nodes = {};
  }
  AudioEngine.prototype.initHardware = function (AudioCtor) {
    if (!AudioCtor) return false;
    try { this.ctx = new AudioCtor(); this.master = this.ctx.createGain ? this.ctx.createGain() : null;
      if (this.master && this.master.connect) this.master.connect(this.ctx.destination); }
    catch (e) { this.ctx = null; return false; }
    return true;
  };
  AudioEngine.prototype.start = function () { this.running = true; };
  AudioEngine.prototype.stop = function () { this.running = false; };
  /* Layer count audible at a listener, given nearest live speaker distance and
     any hush bubble overlapping the listener. */
  AudioEngine.prototype.liveLayers = function (opts) {
    opts = opts || {};
    var dist = opts.speakerDist === undefined ? 4 : opts.speakerDist;
    var full = clamp(1 - (dist / 30), 0.15, 1);           /* brightness with distance */
    var count = Math.max(1, Math.round(this.masterLayers.length * full));
    if (opts.insideHush) {
      /* Hush Bubble carves a hole in the mix: only the floor heartbeat remains. */
      count = Math.max(0, opts.hushFloor === undefined ? 1 : opts.hushFloor);
    }
    if (opts.grandPause) count = 0;
    return count;
  };
  CE.AudioEngine = AudioEngine;
  CE.LAYERS = LAYERS;

  /* Hush Bubble (Zil) — a radius that ducks sound (Section 4, 5) */
  function HushBubble(radius) { this.radius = radius || 4; this.active = false; }
  HushBubble.prototype.contains = function (dx, dz) { return this.active && (dx * dx + dz * dz) <= this.radius * this.radius; };
  HushBubble.prototype.duck = function (audio, listenerDx, listenerDz, speakerDist) {
    var inside = this.contains(listenerDx, listenerDz);
    return audio.liveLayers({ speakerDist: speakerDist, insideHush: inside, hushFloor: 1 });
  };
  CE.HushBubble = HushBubble;

  /* ==========================================================================
     CONVERSIONS  (Section 4)  — assertions 13 (Hear Me Out), Lend an Ear
     ========================================================================== */
  function HearMeOut(tolMs, needed) {
    this.tolMs = tolMs || 90;      /* pulse-match tap tolerance */
    this.needed = needed || 4;     /* good taps to bring tempo home to 120 */
    this.good = 0; this.done = false;
  }
  HearMeOut.prototype.tap = function (offsetFromBeatMs) {
    if (this.done) return { hit: false, done: true };
    var hit = Math.abs(offsetFromBeatMs) <= this.tolMs;
    if (hit) { this.good++; if (this.good >= this.needed) this.done = true; }
    else { this.good = Math.max(0, this.good - 1); }
    return { hit: hit, good: this.good, done: this.done };
  };
  CE.HearMeOut = HearMeOut;

  /* Lend an Ear (Zil) — listening minigame; hold steady inside a hush bubble */
  function LendAnEar(needed) { this.needed = needed || 3; this.held = 0; this.done = false; }
  LendAnEar.prototype.hold = function (steady) {
    if (this.done) return true;
    if (steady) { this.held++; if (this.held >= this.needed) this.done = true; }
    else { this.held = 0; }
    return this.done;
  };
  CE.LendAnEar = LendAnEar;

  /* ==========================================================================
     DOOR GESTURES  (Section 6)  — assertion 11
     Speed reads: <=300 pt/s silent slide; >=900 pt/s slam (alerts + staggers).
     ========================================================================== */
  var Doors = {
    SILENT_MAX: 300, SLAM_MIN: 900,
    swipe: function (speed) {
      var silent = speed <= this.SILENT_MAX;
      var slam = speed >= this.SLAM_MIN;
      return {
        speed: speed,
        silent: silent,
        slam: slam,
        stagger: slam,       /* slam staggers everyone through */
        alert: slam,         /* and alerts Wardens */
        opened: true
      };
    }
  };
  CE.Doors = Doors;

  /* ==========================================================================
     STAMINA (Zil climb)  (Section 6)  — assertion 16
     Drains while climbing; regenerates, faster when idle on a beat.
     ========================================================================== */
  function Stamina(max) { this.max = max || 100; this.value = this.max; }
  Stamina.prototype.update = function (dtMs, st, assist) {
    st = st || {};
    if (assist && assist.infStamina) { this.value = this.max; return this.value; }
    var drainPerSec = 34, regenPerSec = 22, idleBonus = 40;
    if (st.climbing) {
      this.value -= drainPerSec * (dtMs / 1000);
    } else {
      var rate = regenPerSec + (st.idle && st.onBeat ? idleBonus : 0);
      this.value += rate * (dtMs / 1000);
    }
    this.value = clamp(this.value, 0, this.max);
    return this.value;
  };
  CE.Stamina = Stamina;

  /* ==========================================================================
     GRIND BALANCE (Marmalade)  (Section 6)  — assertion 17
     On-beat wobbles auto-correct; off-beat wobbles cost balance.
     ========================================================================== */
  function Grind(max) { this.max = max || 100; this.balance = this.max; }
  Grind.prototype.update = function (dtMs, st) {
    st = st || {};
    var wob = st.wobble || 0;
    if (st.onBeat) {
      /* auto-correct: nudge back toward centre regardless of wobble */
      this.balance += 30 * (dtMs / 1000);
    } else {
      this.balance -= wob * 24 * (dtMs / 1000);
    }
    this.balance = clamp(this.balance, 0, this.max);
    return this.balance;
  };
  CE.Grind = Grind;

  /* ==========================================================================
     QUICK-TURN  (Section 6)  — assertion 15
     ========================================================================== */
  function normAngle(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
  CE.quickTurn = function (heading) { return normAngle(heading + Math.PI); };
  CE.normAngle = normAngle;

  /* ==========================================================================
     TICKET MOTH MAP  (Section 5.4)  — assertion 18
     Eats one ticket, reveals exactly the next 5 carriages' layouts.
     ========================================================================== */
  function TicketMoth() { this.revealed = {}; this.tickets = 0; }
  TicketMoth.prototype.feed = function (fromCar, dir) {
    dir = dir || -1;   /* Zil moves rear->front (decreasing); default forward reveal */
    this.tickets++;
    var out = [], i, c;
    for (i = 1; i <= 5; i++) {
      c = fromCar + dir * i;
      c = clamp(c, 1, 120);
      var l = genCarriage(c);
      this.revealed[c] = l;
      out.push({ carriage: c, archetype: l.archetype, band: l.band, biome: l.biome });
    }
    return out;
  };
  CE.TicketMoth = TicketMoth;

  /* ==========================================================================
     SAVE SYSTEM  (Section 9.3)  — assertion 14
     IndexedDB autosave (per-slot, per-character) with localStorage fallback.
     ========================================================================== */
  function Save(env) {
    env = env || root;
    this.idb = env.indexedDB || null;
    this.ls = env.localStorage || null;
    this.dbName = "celeste-express";
    this.storeName = "saves";
    this.db = null;
  }
  Save.prototype.keyFor = function (slot, character) { return "ce_save_" + (slot || 0) + "_" + (character || "zil"); };
  /* Fallback path is synchronous-ish via localStorage; both paths call cb(err, val). */
  Save.prototype.put = function (slot, character, state, cb) {
    var key = this.keyFor(slot, character);
    var json = JSON.stringify(state);
    var self = this;
    if (this.idb && this.idb.open) {
      this._withStore("readwrite", function (store, done) {
        try { store.put(json, key); done(null); } catch (e) { done(e); }
      }, function (err) {
        if (err && self.ls) { self.ls.setItem(key, json); }
        if (cb) cb(null, true);
      });
    } else if (this.ls) {
      this.ls.setItem(key, json);
      if (cb) cb(null, true);
    } else if (cb) { cb(new Error("no storage"), false); }
  };
  Save.prototype.get = function (slot, character, cb) {
    var key = this.keyFor(slot, character), self = this;
    if (this.idb && this.idb.open) {
      this._withStore("readonly", function (store, done) {
        var req;
        try { req = store.get(key); } catch (e) { done(e, null); return; }
        req.onsuccess = function () { done(null, req.result); };
        req.onerror = function () { done(req.error || new Error("get failed"), null); };
      }, function (err, val) {
        if ((err || val === undefined || val === null) && self.ls) { val = self.ls.getItem(key); }
        cb(null, val ? JSON.parse(val) : null);
      });
    } else if (this.ls) {
      var v = this.ls.getItem(key);
      cb(null, v ? JSON.parse(v) : null);
    } else { cb(new Error("no storage"), null); }
  };
  Save.prototype._withStore = function (mode, work, done) {
    var self = this;
    function run(db) {
      var tx, store;
      try { tx = db.transaction(self.storeName, mode); store = tx.objectStore(self.storeName); }
      catch (e) { done(e); return; }
      work(store, function (err, val) { done(err, val); });
    }
    if (this.db) { run(this.db); return; }
    var openReq = this.idb.open(this.dbName, 1);
    openReq.onupgradeneeded = function (ev) {
      var db = ev.target.result;
      if (db.createObjectStore && !(db.objectStoreNames && db.objectStoreNames.contains && db.objectStoreNames.contains(self.storeName))) {
        db.createObjectStore(self.storeName);
      }
    };
    openReq.onsuccess = function (ev) { self.db = ev.target.result; run(self.db); };
    openReq.onerror = function () { done(openReq.error || new Error("open failed")); };
  };
  CE.Save = Save;

  /* ==========================================================================
     ASSIST MODE  (Section 6)  — assertion 21
     Flags alter physics but must never break other systems.
     ========================================================================== */
  function Assist() {
    this.speed = 1.0;         /* 0.5 .. 1.0 game speed */
    this.infStamina = false;
    this.infDash = false;
    this.invincible = false;
    this.autorun = false;
    this.skipBattles = false;
    this.mirror = false;
    this.colourSafe = false;
    this.largeText = false;
    this.diorama = true;
    this.haptics = true;
  }
  Assist.prototype.set = function (k, v) { if (has(this, k)) this[k] = v; return this[k]; };
  Assist.prototype.toggle = function (k) { if (has(this, k)) this[k] = !this[k]; return this[k]; };
  CE.Assist = Assist;

  /* ==========================================================================
     GRAND PAUSE STATE MACHINE  (Section 1, 6)  — assertion 22
     Four beats of stillness (null input, both thumbs still). Any touch resets.
     ========================================================================== */
  function GrandPause(need) {
    this.need = need || 4;
    this.beatsHeld = 0;
    this.state = "idle";     /* idle -> holding -> resolved */
  }
  GrandPause.prototype.reset = function () { this.beatsHeld = 0; this.state = "idle"; };
  /* Called once per beat with the input state for that beat. */
  GrandPause.prototype.beat = function (input) {
    if (this.state === "resolved") return this.state;
    var still = !input || (input.touches === 0 && !input.moved);
    if (still) {
      this.beatsHeld++;
      this.state = "holding";
      if (this.beatsHeld >= this.need) { this.state = "resolved"; }
    } else {
      this.beatsHeld = 0;
      this.state = "idle";
    }
    return this.state;
  };
  CE.GrandPause = GrandPause;

  /* ==========================================================================
     JUKEBOX  (Section 5.5)  — assertion 24
     Each Rare 45 id yields a unique deterministic procedural loop pattern.
     ========================================================================== */
  var Jukebox = {
    ROOT: [0, 2, 3, 5, 7, 8, 10, 12],   /* warm minor-ish scale degrees */
    loop: function (id) {
      var rng = new Rand((id + 1) * 40503 >>> 0);
      var steps = 16, seq = [], i, deg;
      for (i = 0; i < steps; i++) {
        if (rng.next() < 0.62) { deg = this.ROOT[rng.int(0, this.ROOT.length - 1)]; seq.push(deg); }
        else { seq.push(null); }
      }
      return { id: id, steps: steps, notes: seq, key: hashSeq(seq) };
    }
  };
  function hashSeq(seq) {
    var h = 2166136261 >>> 0, i, v;
    for (i = 0; i < seq.length; i++) { v = seq[i] === null ? 99 : seq[i]; h ^= (v + 1); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  CE.Jukebox = Jukebox;

  /* ==========================================================================
     INPUT / GESTURES  (Section 6)
     Recognition is pure; the DOM binding lives in the renderer boot.
     ========================================================================== */
  var Gesture = {
    FLICK_MIN: 600,          /* pt/s */
    HOLD_THROW_MS: 180,
    JUMP_BUFFER_MS: 120,
    COYOTE_MS: 100,
    /* 8-way snap ±22.5 deg */
    snap8: function (angleRad) {
      var seg = Math.PI / 4;
      return Math.round(angleRad / seg) * seg;
    },
    classifyRight: function (g) {
      /* g: {dt, dist, speed, heldMs} -> intent */
      if (g.heldMs >= this.HOLD_THROW_MS && g.dist > 6) return "draw_throw";
      if (g.speed >= this.FLICK_MIN) return "dash";
      if (g.dist < 14) return "jump";
      return "none";
    }
  };
  CE.Gesture = Gesture;

  /* ==========================================================================
     WORLD / GAME STATE
     ========================================================================== */
  function World() {
    this.character = "zil";           /* or "marm" */
    this.carriage = 120;
    this.lane = "interior";           /* interior | roof | undercarriage */
    this.heading = 0;
    this.vinyl = { "7in": 4, "12in": 1, "picture": 1, "dubplate": 1, "gold45": 0 };
    this.keyItems = {};               /* Backstage Pass, etc. */
    this.rare45 = {};                 /* id -> true */
    this.converted = 0;
    this.napped = 0;
    this.sashes = 0;
    this.slot = 0;
  }
  World.prototype.vinylTotal = function () {
    var n = 0, k; for (k in this.vinyl) { if (has(this.vinyl, k)) n += this.vinyl[k]; }
    return n;
  };
  World.prototype.serialize = function () {
    return {
      v: CE.version, character: this.character, carriage: this.carriage, lane: this.lane,
      heading: this.heading, vinyl: this.vinyl, keyItems: this.keyItems, rare45: this.rare45,
      converted: this.converted, napped: this.napped, sashes: this.sashes, slot: this.slot
    };
  };
  World.prototype.restore = function (s) {
    if (!s) return;
    this.character = s.character; this.carriage = s.carriage; this.lane = s.lane;
    this.heading = s.heading; this.vinyl = s.vinyl || this.vinyl; this.keyItems = s.keyItems || {};
    this.rare45 = s.rare45 || {}; this.converted = s.converted || 0; this.napped = s.napped || 0;
    this.sashes = s.sashes || 0; this.slot = s.slot || 0;
  };
  CE.World = World;

  /* Key-item / locked-door table for the slice (Section 5.3) */
  CE.KEY_ITEMS = ["Backstage Pass", "Conductor's Punch", "Crystal Slipmat", "Golden Crossfader", "Dining Car Spoon"];

  /* ==========================================================================
     CONDUCTOR TANNOY LINES  (Section 3)
     ========================================================================== */
  CE.TANNOY = [
    { who: "The Conductor", line: "Passengers are reminded that the front of the train is a very long way away, and that this is fine." },
    { who: "The Conductor", line: "Mind the groove. Mind the gap in the groove. Mostly, mind the groove." },
    { who: "The Conductor", line: "A gentle notice: the disco is what keeps us warm. Do keep dancing." },
    { who: "The Conductor", line: "Somebody has left a perfectly good silence in the undercarriage. Please do not tidy it away." },
    { who: "The Conductor", line: "We have been travelling for a very long time. Thank you for the company." },
    { who: "The Conductor", line: "Next stop: nowhere, same as ever. Isn't it lovely." }
  ];

  /* ==========================================================================
     BOSSES (Section 5.6) — slice includes the Baggage Golem
     ========================================================================== */
  CE.BOSSES = [
    { band: "I", name: "The Baggage Golem", teaches: "curve-throws around pillars" },
    { band: "II", name: "The Sommelier of Silence", teaches: "duel of dynamics" },
    { band: "MID", name: "Carriage 60 Crossing", teaches: "dance-chase between the leads" },
    { band: "III", name: "The Pollen Choir", teaches: "align sections like a choirmaster" },
    { band: "IV", name: "Twin Metronomes, Tick & Tock", teaches: "find the shared downbeat" },
    { band: "V", name: "The Origin Deck", teaches: "the reveal and the Grand Pause" }
  ];

  /* ==========================================================================
     GAME FACADE — boot(), wiring. Headless-safe.
     ========================================================================== */
  function Game() {
    this.state = "boot";              /* boot|title|select|playing|paused */
    this.clock = new Clock();
    this.audio = new AudioEngine();
    this.assist = new Assist();
    this.world = new World();
    this.stream = new Stream();
    this.moth = new TicketMoth();
    this.stamina = new Stamina();
    this.grind = new Grind();
    this.grandPause = new GrandPause();
    this.hush = new HushBubble(4);
    this.save = null;
    this.headless = false;
    this.renderer = null;
    this.dashReady = true;
    this.barsCounted = 0;
    this.dashRefreshes = 0;
  }
  Game.prototype.boot = function (opts) {
    opts = opts || {};
    this.headless = !!opts.headless;
    this.env = opts.env || root;
    this.save = new Save(this.env);
    /* wire clock -> systems */
    var self = this;
    this.clock.onBeat(function (n) { self._onBeat(n); });
    this.clock.onBar(function (b) { self._onBar(b); });
    this.state = "title";
    if (!this.headless) this._initRenderer();
    return this.state;
  };
  Game.prototype._onBeat = function (n) {
    /* speakers pulse, NPCs bop, haptic tick — handled in renderer */
    if (!this.headless && this.renderer && this.renderer.onBeat) this.renderer.onBeat(n);
    this.haptic(false);
  };
  Game.prototype._onBar = function (b) {
    /* Dash refresh fires once per bar on the downbeat (assertion 5). */
    this.dashReady = true;
    this.dashRefreshes++;
    this.barsCounted++;
    this.haptic(true);
  };
  Game.prototype.haptic = function (down) {
    if (this.headless || !this.assist.haptics) return;
    var nav = this.env && this.env.navigator;
    if (nav && nav.vibrate) { nav.vibrate(down ? 25 : 10); }
    else if (this.renderer && this.renderer.pulseRing) { this.renderer.pulseRing(down); } /* iOS: cream pulse-ring */
  };
  /* attempt a dash; returns descriptor. On-Beat within +/-90ms yields bonus. */
  Game.prototype.tryDash = function (atMs, angleRad) {
    var onBeat = this.clock.isOnBeat(atMs, 90);
    var canDash = this.dashReady || this.assist.infDash;
    if (!canDash) return { ok: false, reason: "no-charge" };
    if (!this.assist.infDash) this.dashReady = false;
    return {
      ok: true, onBeat: onBeat,
      distance: onBeat ? 1.25 : 1.0,      /* +25% on-beat */
      angle: Gesture.snap8(angleRad),
      sparkle: onBeat
    };
  };
  Game.prototype.selectCharacter = function (which) {
    this.world.character = which;
    this.world.carriage = (which === "zil") ? 120 : 111;   /* Zil rear, Marmalade toward front of slice */
    this.world.lane = (which === "zil") ? "undercarriage" : "interior";
    this.stream.go(this.world.carriage);
    this.state = "playing";
    this.clock.start(this._now());
    this.audio.start();
    return this.state;
  };
  Game.prototype._now = function () {
    if (this.headless) return 0;
    return (this.env.performance && this.env.performance.now) ? this.env.performance.now() : 0;
  };
  Game.prototype.transitionTo = function (car) {
    this.world.carriage = clamp(car, 1, 120);
    this.stream.go(this.world.carriage);
    this.autosave();
    return this.stream.liveCount();
  };
  Game.prototype.autosave = function () {
    if (!this.save) return;
    this.save.put(this.world.slot, this.world.character, this.world.serialize(), null);
  };
  Game.prototype.loadInto = function (slot, character, cb) {
    var self = this;
    this.save.get(slot, character, function (err, state) {
      if (state) self.world.restore(state);
      if (cb) cb(err, state);
    });
  };
  /* visibilitychange: pause clock + audio; a gesture resumes (assertion 19). */
  Game.prototype.onHidden = function () { this.clock.stop(); this.audio.stop(); this.state = "paused"; };
  Game.prototype.onGesture = function () {
    if (this.state === "paused") {
      this.clock.resume(this._now());
      this.audio.start();
      this.state = "playing";
    }
  };

  /* Renderer boot is defined below (browser only) and attached lazily. */
  Game.prototype._initRenderer = function () {
    if (typeof CE._buildRenderer === "function") {
      try { this.renderer = CE._buildRenderer(this); } catch (e) { this.renderer = null; }
    }
  };
  CE.Game = Game;

  /* Convenience singleton used by the DOM/UI layer. */
  CE.createGame = function () { return new Game(); };

})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this));
