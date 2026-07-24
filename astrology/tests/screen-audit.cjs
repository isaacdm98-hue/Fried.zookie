// PRODUCTION SCREEN AUDIT: drives every screen at three device widths via the app's own ?go=
// deep-link, scrolls each fully, and asserts NO runtime errors (pageerror / console.error) anywhere.
// The reading engine is proven by golden/doctrine/stress; this proves the whole APP renders clean.
// Run:  node tests/screen-audit.cjs   (from astrology/)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = 8961;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const SCREENS = ['chart', 'read', 'today', 'learn', 'tarot', 'people', 'settings'];
const WIDTHS = [{ w: 375, h: 812, n: 'iPhone' }, { w: 414, h: 896, n: 'phablet' }, { w: 768, h: 1024, n: 'tablet' }];
const BIRTH = { name: 'Audit', y: 1988, mo: 11, d: 7, hour: 14, min: 20, tz: 0, manualTz: false, iana: 'Europe/London', lat: 51.5, lon: -0.13, place: 'London', timeKnown: true };

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ executablePath: CHROME });
  const problems = [];

  // 1) seed a chart into localStorage so the deep-link has a chart to render
  const seed = await b.newPage();
  await seed.setViewportSize({ width: 390, height: 844 });
  await seed.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await seed.waitForTimeout(2500);
  await seed.evaluate((bb) => {
    APP.STATE.birth = bb;
    APP.STATE.chart = APP.compute(bb, APP.STATE.settings);
    if (APP.save) APP.save();
  }, BIRTH);
  await seed.waitForTimeout(400);
  await seed.close();

  // 2) each screen × width: load via ?go=, scroll it fully, collect errors
  for (const scr of SCREENS) {
    for (const vp of WIDTHS) {
      const pg = await b.newPage();
      await pg.setViewportSize({ width: vp.w, height: vp.h });
      const errs = [];
      pg.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 200)));
      pg.on('console', m => { if (m.type() === 'error') errs.push('console.error: ' + m.text().slice(0, 200)); });
      try {
        await pg.goto(`http://127.0.0.1:${PORT}/index.html?go=${scr}`, { waitUntil: 'domcontentloaded' });
        await pg.waitForTimeout(2600);
        // scroll the screen fully (many chapters on read/learn) by wheel over the canvas
        for (let s = 0; s < 14; s++) { await pg.mouse.wheel(0, 900); await pg.waitForTimeout(130); }
        await pg.waitForTimeout(300);
      } catch (e) { errs.push('nav: ' + String(e).slice(0, 160)); }
      if (errs.length) problems.push({ screen: scr, width: vp.n, errs: errs.slice(0, 4) });
      await pg.close();
    }
  }

  await b.close(); srv.kill();

  console.log(`audited ${SCREENS.length} screens × ${WIDTHS.length} widths = ${SCREENS.length * WIDTHS.length} renders`);
  if (!problems.length) { console.log('SCREEN AUDIT: PASS — every screen renders clean at every width, no runtime errors.'); process.exit(0); }
  console.log('SCREEN AUDIT: FAIL —');
  problems.forEach(p => { console.log(`  ✗ ${p.screen} @ ${p.width}`); p.errs.forEach(e => console.log('      ' + e)); });
  process.exit(1);
})();
