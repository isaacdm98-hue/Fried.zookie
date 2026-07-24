// Screenshot every screen at phone width, so the visuals can actually be looked at.
// Run: node tests/shots.cjs [outdir]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || '/tmp/shots';
const PORT = 8963;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const SCREENS = ['chart', 'read', 'today', 'learn', 'tarot', 'people', 'settings'];
const BIRTH = { name: 'Ash', y: 1990, mo: 3, d: 21, hour: 6, min: 12, tz: 0, manualTz: false, iana: 'Europe/London', lat: 51.5, lon: -0.13, place: 'London', timeKnown: true };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ executablePath: CHROME });
  // seed the birth data straight into localStorage before any script runs, so every page
  // boots with a chart already saved (the in-page save() races the splash otherwise)
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript((bb) => {
    try { localStorage.setItem('aqau_birth', JSON.stringify(bb)); localStorage.setItem('aqau_seen_splash', '1'); } catch (e) {}
  }, BIRTH);
  const seed = await ctx.newPage();
  await seed.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await seed.waitForTimeout(2600);
  await seed.evaluate((bb) => { APP.STATE.birth = bb; APP.STATE.chart = APP.compute(bb, APP.STATE.settings); if (APP.save) APP.save(); }, BIRTH);
  await seed.waitForTimeout(400); await seed.close();

  for (const scr of SCREENS) {
    const pg = await ctx.newPage();
    await pg.goto(`http://127.0.0.1:${PORT}/index.html?go=${scr}`, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(2600);
    // the splash waits for a tap before the app proper appears
    await pg.mouse.click(195, 420); await pg.waitForTimeout(1800);
    await pg.mouse.click(195, 420); await pg.waitForTimeout(1600);
    await pg.screenshot({ path: path.join(OUT, scr + '-0.png') });
    for (let s = 1; s <= 3; s++) {
      for (let k = 0; k < 4; k++) { await pg.mouse.wheel(0, 700); await pg.waitForTimeout(120); }
      await pg.waitForTimeout(500);
      await pg.screenshot({ path: path.join(OUT, scr + '-' + s + '.png') });
    }
    await pg.close();
  }
  await b.close(); srv.kill();
  console.log('wrote shots to', OUT);
})();
