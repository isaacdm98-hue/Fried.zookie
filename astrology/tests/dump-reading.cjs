// Dumps the composed reading for one chart to stdout, so it can be read the way a user reads it.
// Not an assertion harness — a window. Run: node tests/dump-reading.cjs [> file.md]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = 8959;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const BIRTH = { name: 'A', y: 1990, mo: 3, d: 21, hour: 6, min: 12, tz: 0, iana: 'Europe/London', lat: 51.5, lon: -0.13, place: 'London', timeKnown: true };

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ executablePath: CHROME });
  const pg = await b.newPage();
  const perr = []; pg.on('pageerror', e => perr.push(e.message.slice(0, 200)));
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3200);
  const md = await pg.evaluate((bb) => {
    APP.STATE.birth = bb;
    const c = APP.compute(bb, APP.STATE.settings); APP.STATE.chart = c;
    const L = [];
    const sec = (t, v) => { if (!v) return; const s = typeof v === 'string' ? v : (v.text || v.line || ''); if (s && s.trim()) L.push('## ' + t + '\n' + s.trim() + (v && v.receipt ? '\n> ' + v.receipt : '')); };
    const T = (t, f) => { try { sec(t, f()); } catch (e) { L.push('## ' + t + '\nERROR: ' + e); } };
    T('TEMPERAMENT', () => APP.temperamentProse(APP.temperament(c, bb)));
    T('LIFE AT A GLANCE', () => APP.lifeAtAGlance(c, bb));
    T('MONEY', () => APP.judgeMoney(c, bb));
    T('LOVE', () => APP.judgeLove(c, bb));
    T('CAREER', () => APP.judgeCareer(c, bb));
    T('FAMILY', () => APP.judgeFamily(c, bb));
    T('HEALTH', () => APP.judgeHealth(c, bb));
    T('THE CAPTAIN', () => APP.rulingVoice && APP.rulingVoice(c, bb));
    T('DAY OR NIGHT', () => APP.sectProfile(c, bb));
    T('YEAR AHEAD', () => APP.yearAhead(c, bb));
    T('THIS STRETCH OF YEARS', () => { const w = APP.boundsWalk(c, bb); return w && w.current; });
    ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].forEach(k =>
      T('PLACEMENT · ' + k, () => APP.placementProse(c, bb, k)));
    T('HOUSE 7 JUDGED', () => APP.judgeHouse(c, bb, 7));
    T('TIGHTEST ASPECT', () => { const a = APP.judgeAspects(c, bb); return a && a[0]; });
    T('TRANSITS (doctrine)', () => { const t = APP.triggerReading(c, bb); return t && { text: t.doctrine + ' ' + (t.loud[0] ? t.loud[0].line : '') }; });
    return L.join('\n\n');
  }, BIRTH);
  await b.close(); srv.kill();
  if (perr.length) console.error('PAGE ERRORS:', perr);
  console.log(md);
})();
