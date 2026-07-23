// Quick sanity check for temperament(c,b) across the golden nativities.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const GOLDEN = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'golden.json'), 'utf8')).charts;
const PORT = 8931;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ executablePath: CHROME });
  const pg = await b.newPage();
  const perr = []; pg.on('pageerror', e => perr.push(e.message.slice(0, 300)));
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3200);
  const out = await pg.evaluate((GOLDEN) => {
    const res = {};
    for (const id of Object.keys(GOLDEN)) {
      const bb = GOLDEN[id].birth;
      APP.STATE.birth = bb;
      const c = APP.compute(bb, APP.STATE.settings);
      APP.STATE.chart = c;
      const t = APP.temperament(c, bb);
      res[id] = t ? { name: t.name, humour: t.humour, secondary: t.secondary, strength: t.strength, season: t.season, axis: t.axis, balanced: t.balanced, votes: t.votes.map(v => v.label + ' [' + v.quality + ' x' + v.weight + ']') } : null;
    }
    return res;
  }, GOLDEN);
  console.log('pageerrors:', perr.length ? perr : 'none');
  console.log(JSON.stringify(out, null, 2));
  await b.close(); srv.kill();
})();
