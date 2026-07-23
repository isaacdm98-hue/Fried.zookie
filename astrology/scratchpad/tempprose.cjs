const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const GOLDEN = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'golden.json'), 'utf8')).charts;
const PORT = 8932;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ executablePath: CHROME });
  const pg = await b.newPage();
  const perr = []; pg.on('pageerror', e => perr.push(e.message.slice(0,300)));
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3200);
  const out = await pg.evaluate((GOLDEN) => {
    const res = {};
    for (const id of Object.keys(GOLDEN)) {
      const bb = GOLDEN[id].birth; APP.STATE.birth = bb;
      const c = APP.compute(bb, APP.STATE.settings); APP.STATE.chart = c;
      const t = APP.temperament(c, bb); const p = APP.temperamentProse(t);
      res[id] = p ? { title: p.title, text: p.text, receipt: p.receipt.slice(0,80)+'...' } : null;
    }
    return res;
  }, GOLDEN);
  console.log('pageerrors:', perr.length ? perr : 'none');
  for (const k of Object.keys(out)) { console.log('\n=== '+k+' ==='); console.log(out[k].text); }
  await b.close(); srv.kill();
})();
