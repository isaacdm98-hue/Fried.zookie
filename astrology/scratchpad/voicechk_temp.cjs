const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const GOLDEN = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'golden.json'), 'utf8')).charts;
const PORT = 8933;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ executablePath: CHROME });
  const pg = await b.newPage();
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3000);
  const out = await pg.evaluate((GOLDEN) => {
    const res = [];
    for (const id of Object.keys(GOLDEN)) {
      const bb = GOLDEN[id].birth; APP.STATE.birth = bb;
      const c = APP.compute(bb, APP.STATE.settings); APP.STATE.chart = c;
      const p = APP.temperamentProse(APP.temperament(c, bb));
      if (!p) { res.push(id+': (no time)'); continue; }
      const v = APP.voiceCheck ? APP.voiceCheck(p.text + ' ' + p.receipt) : null;
      res.push(id + ': ' + (v ? JSON.stringify(v) : 'no voiceCheck'));
    }
    return res;
  }, GOLDEN);
  console.log(out.join('\n'));
  await b.close(); srv.kill();
})();
