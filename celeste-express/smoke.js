/* ============================================================================
   CELESTE EXPRESS — smoke harness (Section 11). NOT shipped to players.
   Node-run, stubbed browser (no real DOM/WebGL). Extracts the inline game
   script from index.html, boots it headless, and asserts 24 invariants.
   ES5 only, to match the game's engineering law.
   Run:  node smoke.js
   ============================================================================ */
"use strict";
var fs = require("fs");
var vm = require("vm");
var os = require("os");
var path = require("path");
var cp = require("child_process");

var HTML_PATH = path.join(__dirname, "index.html");
var html = fs.readFileSync(HTML_PATH, "utf8");

/* -- extract every inline <script> (skip <script src="...">) ----------------- */
function extractInlineScript(src) {
  var re = /<script>([\s\S]*?)<\/script>/g, m, parts = [];
  while ((m = re.exec(src)) !== null) { parts.push(m[1]); }
  return parts.join("\n;\n");
}
var script = extractInlineScript(html);

/* -- results table ----------------------------------------------------------- */
var results = [];
function check(n, label, fn) {
  var ok = false, note = "";
  try { var r = fn(); ok = (r === true || r === undefined); if (r && r.note) note = r.note; if (r === false) ok = false; }
  catch (e) { ok = false; note = String(e && e.message ? e.message : e); }
  results.push({ n: n, label: label, ok: ok, note: note });
}

/* ============================================================================
   1. node --check on the extracted script
   ============================================================================ */
var tmpScript = path.join(os.tmpdir(), "celeste-extracted-" + process.pid + ".js");
fs.writeFileSync(tmpScript, script, "utf8");
check(1, "node --check passes on extracted script", function () {
  cp.execSync("node --check " + JSON.stringify(tmpScript), { stdio: "pipe" });
  return true;
});

/* ============================================================================
   2. ES6-token scan finds zero matches
   ============================================================================ */
check(2, "ES6-token scan finds zero matches (=> ` let const class)", function () {
  var re = /=>|`|\blet\b|\bconst\b|\bclass\b/g;
  var hits = script.match(re);
  if (hits && hits.length) return { note: "found: " + hits.slice(0, 6).join(" ") + " (x" + hits.length + ")" };
  return true;
});

/* ============================================================================
   Build a stubbed browser environment and boot the game headless.
   We deliberately do NOT define `window`, so the renderer IIFE self-skips at
   its first line; the core module attaches CE to `global`.
   ============================================================================ */
function makeLocalStorage() {
  var store = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    _store: store
  };
}
function AudioContextStub() {
  this.currentTime = 0;
  this.destination = {};
  this.createGain = function () { return { gain: { value: 1 }, connect: function () {} }; };
}
var navigatorStub = {
  userAgent: "node-smoke",
  vibrate: function () { return true; },
  serviceWorker: undefined
};
var indexedDBStub = null; /* force the localStorage fallback path in Save */

var sandbox = {};
sandbox.global = sandbox;
sandbox.console = console;
sandbox.Math = Math;
sandbox.Date = Date;
sandbox.JSON = JSON;
sandbox.parseInt = parseInt;
sandbox.parseFloat = parseFloat;
sandbox.isNaN = isNaN;
sandbox.Object = Object;
sandbox.Array = Array;
sandbox.String = String;
sandbox.Number = Number;
sandbox.Boolean = Boolean;
sandbox.Error = Error;
sandbox.setTimeout = function () { return 0; };
sandbox.clearTimeout = function () {};
sandbox.setInterval = function () { return 0; };
/* stubs the harness passes into the game as its env */
sandbox.__env = {
  navigator: navigatorStub,
  indexedDB: indexedDBStub,
  localStorage: makeLocalStorage(),
  performance: { now: function () { return 0; } },
  AudioContext: AudioContextStub
};

var ctx = vm.createContext(sandbox);
check(3, "Game boots to title state without throwing", function () {
  vm.runInContext(script, ctx, { filename: "celeste-express-inline.js" });
  if (!sandbox.CE) return { note: "CE namespace not attached" };
  var g = sandbox.CE.createGame();
  var st = g.boot({ headless: true, env: sandbox.__env });
  if (st !== "title") return { note: "state was " + st };
  sandbox.__game = g;
  return true;
});
var CE = sandbox.CE;

/* ============================================================================
   4. Beat Clock: simulated 60 s drift < 5 ms
   ============================================================================ */
check(4, "Beat Clock: simulated 60 s drift < 5 ms", function () {
  var c = new CE.Clock();
  c.start(0);
  var drift = c.simulateDrift(60000, 16);
  return drift < 5 ? true : { note: "drift " + drift.toFixed(4) + " ms" };
});

/* ============================================================================
   5. Downbeat dash-refresh fires exactly once per bar
   ============================================================================ */
check(5, "Downbeat dash-refresh fires exactly once per bar (20 bars)", function () {
  var g = CE.createGame();
  g.boot({ headless: true, env: sandbox.__env });
  g.clock.start(0);
  /* advance to just before the 20th bar's end: 20 bars = 40000 ms; stop at 39999 */
  g.clock.advance(39999);
  return g.dashRefreshes === 20 ? true : { note: "refreshes=" + g.dashRefreshes };
});

/* ============================================================================
   6. On-Beat Dash window accepts ±90 ms, rejects outside
   ============================================================================ */
check(6, "On-Beat Dash window accepts +/-90 ms, rejects outside", function () {
  var c = new CE.Clock(); c.start(0);
  var inA = c.isOnBeat(0, 90);      /* on the beat */
  var inB = c.isOnBeat(90, 90);     /* edge, accept */
  var inC = c.isOnBeat(410, 90);    /* 90 before next beat, accept */
  var outA = c.isOnBeat(91, 90);    /* just outside */
  var outB = c.isOnBeat(250, 90);   /* mid-beat, reject */
  if (inA && inB && inC && !outA && !outB) return true;
  return { note: "in=" + [inA, inB, inC] + " out=" + [outA, outB] };
});

/* ============================================================================
   7. Carriage streaming holds exactly 3 live groups across 20 transitions
   ============================================================================ */
check(7, "Streaming holds exactly 3 live groups across 20 transitions", function () {
  var s = new CE.Stream();
  var seq = [112, 113, 114, 115, 116, 117, 118, 119, 118, 117, 116, 115, 114, 113, 112, 113, 114, 115, 116, 117];
  var i, live, bad = -1;
  for (i = 0; i < seq.length; i++) { live = s.go(seq[i]); if (live !== 3) { bad = seq[i]; break; } }
  return bad === -1 ? true : { note: "car " + bad + " had " + live + " live" };
});

/* ============================================================================
   8. Seeded archetype generator is deterministic
   ============================================================================ */
check(8, "Seeded archetype generator is deterministic (same seed -> same hash)", function () {
  var a = CE.genCarriage(50), b = CE.genCarriage(50), c = CE.genCarriage(51);
  if (a.hash !== b.hash) return { note: "same-seed hashes differ" };
  if (JSON.stringify(a) !== JSON.stringify(b)) return { note: "same-seed layouts differ" };
  if (a.hash === c.hash) return { note: "different seeds collided" };
  return true;
});

/* ============================================================================
   9. Throw-path sampler smooths a 5-point drag and loops home when closed
   ============================================================================ */
check(9, "Throw sampler returns smoothed curve; loops home when path closes", function () {
  var open = CE.Throw.sample([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0.5 }, { x: 3, y: 2 }, { x: 4, y: 0 }], 12);
  var closed = CE.Throw.sample([{ x: 0, y: 0 }, { x: 1.5, y: 1.5 }, { x: 2, y: 0 }, { x: 1, y: -1.2 }, { x: 0.1, y: 0.1 }], 12);
  if (open.curve.length <= 5) return { note: "curve not smoothed: " + open.curve.length + " pts" };
  if (open.loopsHome) return { note: "open path wrongly flagged looping" };
  if (!closed.loopsHome || !closed.returns) return { note: "closed path not detected" };
  return true;
});

/* ============================================================================
   10. Dubplate records then replays a stubbed sound event
   ============================================================================ */
check(10, "Dubplate records then replays a stubbed sound event", function () {
  var d = new CE.Dubplate();
  var wrote = d.record({ id: "kick", freq: 60, dur: 0.2, at: 1.5 });
  var again = d.record({ id: "hat", freq: 800, dur: 0.05, at: 2 });
  var back = d.replay();
  if (!wrote) return { note: "first record failed" };
  if (again) return { note: "blank re-recorded (should be one-shot)" };
  if (!back || back.id !== "kick") return { note: "replay wrong: " + JSON.stringify(back) };
  return true;
});

/* ============================================================================
   11. Door gesture: slow swipe -> silent; fast swipe -> slam + stagger
   ============================================================================ */
check(11, "Door gesture: slow -> silent flag; fast -> slam + stagger flags", function () {
  var slow = CE.Doors.swipe(200);
  var fast = CE.Doors.swipe(1000);
  var mid = CE.Doors.swipe(500);
  if (!slow.silent || slow.slam) return { note: "slow misread" };
  if (!fast.slam || !fast.stagger || !fast.alert) return { note: "fast misread" };
  if (mid.silent || mid.slam) return { note: "mid should be neither" };
  return true;
});

/* ============================================================================
   12. Hush Bubble ducks layer count inside radius, restores outside
   ============================================================================ */
check(12, "Hush Bubble ducks layers inside radius, restores outside", function () {
  var a = new CE.AudioEngine();
  var b = new CE.HushBubble(4); b.active = true;
  var inside = b.duck(a, 0, 0, 4);
  var outside = b.duck(a, 10, 10, 4);
  b.active = false;
  var noBubble = b.duck(a, 0, 0, 4);
  if (!(inside < outside)) return { note: "inside " + inside + " !< outside " + outside };
  if (noBubble !== outside) return { note: "inactive bubble still ducked" };
  return true;
});

/* ============================================================================
   13. Hear Me Out pulse-match converts at correct tap tolerance
   ============================================================================ */
check(13, "Hear Me Out pulse-match converts at correct tap tolerance", function () {
  var h = new CE.HearMeOut(90, 4);
  var miss = h.tap(200);
  if (miss.hit) return { note: "200 ms tap wrongly accepted" };
  var r1 = h.tap(0), r2 = h.tap(60), r3 = h.tap(-89), r4 = h.tap(89);
  if (!(r1.hit && r2.hit && r3.hit && r4.hit)) return { note: "in-tolerance taps missed" };
  if (!r4.done) return { note: "did not convert after 4 good taps" };
  return true;
});

/* ============================================================================
   14. Save -> load round-trip preserves carriage, lane, inventory, character
   ============================================================================ */
check(14, "Save/load round-trip preserves carriage, lane, inventory, character", function () {
  var save = new CE.Save(sandbox.__env);
  var w = new CE.World();
  w.character = "marm"; w.carriage = 74; w.lane = "roof";
  w.vinyl = { "7in": 2, "12in": 0, "picture": 3, "dubplate": 1, "gold45": 1 };
  w.keyItems = { "Backstage Pass": true }; w.rare45 = { "88": true };
  var done = { put: false, got: null };
  save.put(w.slot, w.character, w.serialize(), function () { done.put = true; });
  save.get(w.slot, "marm", function (err, state) { done.got = state; });
  if (!done.put) return { note: "put callback not fired (async?)" };
  var s = done.got;
  if (!s) return { note: "no state read back" };
  if (s.character !== "marm" || s.carriage !== 74 || s.lane !== "roof") return { note: "core fields lost" };
  if (s.vinyl.picture !== 3 || !s.keyItems["Backstage Pass"] || !s.rare45["88"]) return { note: "inventory lost" };
  return true;
});

/* ============================================================================
   15. Quick-turn rotates heading 180 deg +/-1
   ============================================================================ */
check(15, "Quick-turn rotates heading 180 deg +/-1", function () {
  var deg = 180 / Math.PI;
  var d0 = Math.abs(CE.normAngle(CE.quickTurn(0) - 0)) * deg;
  var d1 = Math.abs(CE.normAngle(CE.quickTurn(1.0) - 1.0)) * deg;
  var roundtrip = Math.abs(CE.normAngle(CE.quickTurn(CE.quickTurn(0.7)) - 0.7)) * deg;
  if (Math.abs(d0 - 180) > 1 || Math.abs(d1 - 180) > 1) return { note: "turn not 180: " + d0.toFixed(2) };
  if (roundtrip > 1) return { note: "double-turn not identity: " + roundtrip.toFixed(3) };
  return true;
});

/* ============================================================================
   16. Stamina drains on climb, regenerates faster idle on-beat
   ============================================================================ */
check(16, "Stamina drains on climb, regenerates faster when idle on-beat", function () {
  var s = new CE.Stamina(100);
  s.value = 60; s.update(1000, { climbing: true });
  var afterClimb = s.value;
  if (!(afterClimb < 60)) return { note: "climb did not drain" };
  s.value = 20; s.update(1000, { idle: true, onBeat: true });
  var onBeatRegen = s.value - 20;
  s.value = 20; s.update(1000, { idle: true, onBeat: false });
  var plainRegen = s.value - 20;
  if (!(onBeatRegen > plainRegen)) return { note: "on-beat regen not faster" };
  return true;
});

/* ============================================================================
   17. Grind balance auto-corrects when wobble is on-beat
   ============================================================================ */
check(17, "Grind balance auto-corrects when wobble is on-beat", function () {
  var g = new CE.Grind(100);
  g.balance = 40; g.update(1000, { wobble: 1, onBeat: true });
  var onBeat = g.balance;
  g.balance = 40; g.update(1000, { wobble: 1, onBeat: false });
  var offBeat = g.balance;
  if (!(onBeat > 40)) return { note: "on-beat did not auto-correct" };
  if (!(offBeat < 40)) return { note: "off-beat wobble did not cost balance" };
  return true;
});

/* ============================================================================
   18. Ticket Moth reveals exactly 5 carriages per ticket
   ============================================================================ */
check(18, "Ticket Moth reveals exactly 5 carriages per ticket", function () {
  var m = new CE.TicketMoth();
  var five = m.feed(120, -1);
  if (five.length !== 5) return { note: "revealed " + five.length };
  if (five[0].carriage !== 119 || five[4].carriage !== 115) return { note: "wrong span: " + five[0].carriage + ".." + five[4].carriage };
  return true;
});

/* ============================================================================
   19. visibilitychange pauses clock + audio; gesture resumes
   ============================================================================ */
check(19, "visibilitychange pauses clock + audio; gesture resumes", function () {
  var g = CE.createGame();
  g.boot({ headless: true, env: sandbox.__env });
  g.selectCharacter("zil");
  if (!g.clock.running || !g.audio.running) return { note: "not running after select" };
  g.onHidden();
  if (g.clock.running || g.audio.running) return { note: "still running after hide" };
  g.onGesture();
  if (!g.clock.running || !g.audio.running) return { note: "did not resume after gesture" };
  return true;
});

/* ============================================================================
   20. Contrast audit: every declared UI text/background pair >= 4.5:1
   ============================================================================ */
check(20, "Contrast audit: every declared UI pair >= 4.5:1", function () {
  var a = CE.auditContrast();
  if (a.ok) return true;
  var bad = [], i;
  for (i = 0; i < a.pairs.length; i++) { if (!a.pairs[i].pass) bad.push(a.pairs[i].name + " " + a.pairs[i].ratio); }
  return { note: "failing: " + bad.join(", ") };
});

/* ============================================================================
   21. Assist Mode flags alter physics without breaking other assertions
   ============================================================================ */
check(21, "Assist Mode flags alter physics without breaking others", function () {
  var assist = new CE.Assist();
  assist.infStamina = true;
  var s = new CE.Stamina(100); s.value = 30;
  s.update(2000, { climbing: true }, assist);
  if (s.value !== 100) return { note: "infStamina did not hold: " + s.value };
  /* other systems still intact after using assist */
  if (!CE.auditContrast().ok) return { note: "contrast broke" };
  var t = CE.Throw.sample([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }, { x: 3, y: 1 }, { x: 4, y: 0 }], 8);
  if (t.curve.length <= 5) return { note: "throw broke" };
  /* a non-assist stamina still drains normally */
  var s2 = new CE.Stamina(100); s2.value = 60; s2.update(1000, { climbing: true });
  if (!(s2.value < 60)) return { note: "non-assist physics altered" };
  return true;
});

/* ============================================================================
   22. Grand Pause state machine: 4 beats of null input -> resolves; touch resets
   ============================================================================ */
check(22, "Grand Pause: 4 still beats resolve; any touch resets", function () {
  var g = new CE.GrandPause(4);
  g.beat(null); g.beat({ touches: 0, moved: false }); g.beat(null);
  if (g.state === "resolved") return { note: "resolved too early" };
  g.beat(null);
  if (g.state !== "resolved") return { note: "did not resolve after 4 stills" };
  var g2 = new CE.GrandPause(4);
  g2.beat(null); g2.beat(null); g2.beat({ touches: 1, moved: true });
  if (g2.beatsHeld !== 0 || g2.state !== "idle") return { note: "touch did not reset" };
  g2.beat(null); g2.beat(null); g2.beat(null); g2.beat(null);
  if (g2.state !== "resolved") return { note: "did not resolve after reset" };
  return true;
});

/* ============================================================================
   23. Manifest data-URI parses as valid JSON
   ============================================================================ */
check(23, "Manifest data-URI parses as valid JSON", function () {
  var m = html.match(/href="data:application\/manifest\+json;base64,([^"]+)"/);
  if (!m) return { note: "no manifest data-URI found" };
  var json = Buffer.from(m[1], "base64").toString("utf8");
  var obj = JSON.parse(json);
  if (!obj.name || obj.orientation !== "landscape") return { note: "manifest missing fields" };
  return true;
});

/* ============================================================================
   24. Jukebox loop generator returns a unique pattern per Rare 45 id
   ============================================================================ */
check(24, "Jukebox loop generator returns a unique pattern per Rare 45 id", function () {
  var seen = {}, i, lp, key, dupes = 0;
  for (i = 0; i < 120; i++) {
    lp = CE.Jukebox.loop(i);
    key = JSON.stringify(lp.notes);
    if (seen[key]) dupes++; seen[key] = true;
  }
  var det = JSON.stringify(CE.Jukebox.loop(37).notes) === JSON.stringify(CE.Jukebox.loop(37).notes);
  if (!det) return { note: "not deterministic" };
  if (dupes > 0) return { note: dupes + " duplicate patterns across 120 ids" };
  return true;
});

/* ============================================================================
   Print PASS/FAIL table
   ============================================================================ */
function pad(s, n) { s = String(s); while (s.length < n) s += " "; return s; }
var passCount = 0, i;
var line = "+------+--------+--------------------------------------------------------------+";
console.log("\n  CELESTE EXPRESS — smoke harness\n");
console.log(line);
console.log("| " + pad("#", 4) + " | " + pad("RESULT", 6) + " | " + pad("ASSERTION", 60) + " |");
console.log(line);
for (i = 0; i < results.length; i++) {
  var r = results[i];
  if (r.ok) passCount++;
  var lbl = r.label;
  if (!r.ok && r.note) lbl = lbl + "  [" + r.note + "]";
  if (lbl.length > 60) lbl = lbl.substr(0, 57) + "...";
  console.log("| " + pad(r.n, 4) + " | " + pad(r.ok ? "PASS" : "FAIL", 6) + " | " + pad(lbl, 60) + " |");
}
console.log(line);
console.log("\n  " + passCount + " / " + results.length + " assertions passed.\n");

try { fs.unlinkSync(tmpScript); } catch (e) {}
process.exit(passCount === results.length ? 0 : 1);
