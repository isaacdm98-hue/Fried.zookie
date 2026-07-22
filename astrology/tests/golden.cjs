// PHASE 38 — THE GOLDEN-CHART HARNESS.
// The accumulated meaning-tests distilled into one durable regression on INTERPRETATION,
// not just longitudes. It drives the live app headlessly, recomputes the judged meaning of
// five reference nativities, and diffs against the pinned baseline in golden.json. A drift
// in any pinned value means the engine now judges a chart differently than it did — which
// must be a deliberate, recorded doctrine change, never an accident.
//
// Run:  node tests/golden.cjs        (from the astrology/ directory; .cjs because the repo is ESM)
// Requires: playwright + a headless_shell (set PW_CHROME or NODE_PATH as needed);
// a local static server is spawned automatically.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GOLDEN = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden.json'), 'utf8')).charts;
const PORT = 8920;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ executablePath: CHROME });
  const pg = await b.newPage();
  const perr = []; pg.on('pageerror', e => perr.push(e.message.slice(0, 200)));
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3500);

  const actual = await pg.evaluate((GOLDEN) => {
    const DOM = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'];
    const out = {};
    for (const id of Object.keys(GOLDEN)) {
      const bb = GOLDEN[id].birth;
      APP.STATE.birth = bb;
      const c = APP.compute(bb, APP.STATE.settings);
      APP.STATE.chart = c;
      const f = {};
      if (bb.timeKnown) {
        const cap = DOM[c.ascBody.sign], cd = APP.determination(c, bb, cap);
        f.asc = c.ascBody.signName; f.captain = cap; f.captainState = cd.essential.label;
        f.captainLilly = cd.condition ? cd.condition.total : null; f.captainHouse = cd.house;
        const sp = APP.sectProfile(c, bb); f.day = sp.day; f.helper = sp.helper.key; f.tooth = sp.tooth.key;
        const rv = APP.rulingVoice(c, bb); f.ruling = rv ? rv.key : null;
        const jh = APP.judgeHouses(c, bb).houses; f.h1 = jh[0].verdict; f.h7 = jh[6].verdict; f.h10 = jh[9].verdict;
      } else {
        const nb = APP.noBirthTimeReading(c, bb); f.noTime = nb.applies;
        f.sunState = APP.determination(c, bb, 'sun').essential.label;
      }
      out[id] = f;
    }
    return out;
  }, GOLDEN);

  const KEYS_TIMED = ['asc', 'captain', 'captainState', 'captainLilly', 'captainHouse', 'day', 'helper', 'tooth', 'ruling', 'h1', 'h7', 'h10'];
  const KEYS_NOTIME = ['noTime', 'sunState'];
  const diffs = [];
  for (const id of Object.keys(GOLDEN)) {
    const want = GOLDEN[id], got = actual[id] || {};
    const keys = want.timeKnown === false || want.noTime ? KEYS_NOTIME : KEYS_TIMED;
    for (const k of keys) {
      if (JSON.stringify(want[k]) !== JSON.stringify(got[k])) diffs.push(`${id}.${k}: golden=${JSON.stringify(want[k])} got=${JSON.stringify(got[k])}`);
    }
  }

  await b.close(); srv.kill();
  if (perr.length) { console.log('PAGE ERRORS:', perr); }
  if (diffs.length) {
    console.log('GOLDEN DRIFT (' + diffs.length + ') — the engine now judges these charts differently:');
    diffs.forEach(d => console.log('  ' + d));
    console.log('\nIf this change is intentional, regenerate golden.json and record why. Otherwise it is a regression.');
    process.exit(1);
  }
  console.log('GOLDEN-CHART HARNESS: ALL PASS — the judged meaning of all five reference nativities matches the pinned baseline.');
  process.exit(0);
})().catch(e => { console.error('ERR', e.stack ? e.stack.slice(0, 500) : e.message); process.exit(1); });
