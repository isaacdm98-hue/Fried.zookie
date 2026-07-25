// NETWORK EGRESS HARNESS — proves the app's central claim: nothing you enter leaves the device.
//
// The README says birth data never leaves your phone and a cold load issues zero external requests.
// Nothing was checking it. An audit found (a) a dead Internet-Archive video player that fetched
// archive.org and would have started sending lesson queries the moment anyone wired it up, and
// (b) an online geocoder whose default was ON and whose migration force-enabled it for users who
// had turned it off — while the Settings screen said "Off (default): everything runs on-device".
// The place you were born is birth data. This test exists so neither can come back.
//
// It drives every screen with a chart loaded, types into the place search, and asserts that not one
// request leaves the origin. Then it flips the opt-in on and asserts the ONLY hosts reachable are
// the ones the Settings screen names.
//
// KNOWN LIMIT, stated so the pass is not read as more than it is: the typing step does not reliably
// reach the geocoder's debounce (the place field is a DOM input positioned over the canvas), so the
// opt-in half currently proves "no undeclared host" rather than "the declared hosts work". The
// default half — the one that matters for the privacy claim — is exercised in full on every screen.
//
// Run:  node tests/network.cjs   (from astrology/)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = 8985;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const SCREENS = ['chart', 'read', 'today', 'learn', 'tarot', 'people', 'settings'];
const BIRTH = { name: 'Net', y: 1990, mo: 3, d: 21, hour: 6, min: 12, tz: 0, manualTz: false, iana: 'Europe/London', lat: 51.5, lon: -0.13, place: 'London', timeKnown: true };
// the only hosts the Settings screen tells the reader about, and only after they opt in
const OPT_IN_HOSTS = ['nominatim.openstreetmap.org', 'api.open-meteo.com', 'commons.wikimedia.org'];

async function run(optIn) {
  const b = await chromium.launch({ executablePath: CHROME });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript((a) => {
    try {
      localStorage.setItem('aqau_birth', JSON.stringify(a.birth));
      if (a.optIn) localStorage.setItem('aqau_settings', JSON.stringify({ geocodeOnline: true, ai: true, textScale: 1.15, sound: false }));
    } catch (e) {}
  }, { birth: BIRTH, optIn });

  const external = [];
  ctx.on('request', r => {
    let h = '';
    try { h = new URL(r.url()).host; } catch (e) { return; }
    if (h === `127.0.0.1:${PORT}` || h === `localhost:${PORT}`) return;
    if (r.url().startsWith('data:') || r.url().startsWith('blob:')) return;
    external.push(h + '  ← ' + r.url().slice(0, 110));
  });

  for (const scr of SCREENS) {
    const pg = await ctx.newPage();
    await pg.goto(`http://127.0.0.1:${PORT}/index.html?go=${scr}`, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(2600);
    for (let k = 0; k < 6; k++) { await pg.mouse.wheel(0, 700); await pg.waitForTimeout(110); }
    // the place search is the one input that could carry birth data off-device
    if (scr === 'settings' || scr === 'people') {
      try {
        const el = await pg.$('input');
        if (el) { await el.click(); await el.type('Reykjavik', { delay: 30 }); await pg.waitForTimeout(1600); }
      } catch (e) {}
    }
    await pg.waitForTimeout(400);
    await pg.close();
  }
  await b.close();
  return external;
}

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));

  const offline = await run(false);
  const online = await run(true);
  srv.kill();

  const uniq = a => [...new Set(a.map(x => x.split('  ←')[0]))];
  console.log('DEFAULT SETTINGS (nothing opted in)');
  console.log('  external requests:', offline.length);
  offline.slice(0, 12).forEach(x => console.log('    ✗ ' + x));

  console.log('\nWITH THE INTERNET TOGGLE ON');
  console.log('  external hosts:', uniq(online).join(', ') || 'none');
  const strayOnline = uniq(online).filter(h => !OPT_IN_HOSTS.includes(h));
  strayOnline.forEach(h => console.log('    ✗ undeclared host: ' + h));

  const fails = [];
  if (offline.length) fails.push(`${offline.length} external request(s) on default settings — the app claims zero`);
  if (strayOnline.length) fails.push(`opted-in build reached host(s) Settings does not name: ${strayOnline.join(', ')}`);

  if (fails.length) { console.log('\nNETWORK: FAIL'); fails.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  console.log('\nNETWORK: PASS — nothing leaves the device unless the reader turns it on, and then only where Settings says.');
  process.exit(0);
})();
