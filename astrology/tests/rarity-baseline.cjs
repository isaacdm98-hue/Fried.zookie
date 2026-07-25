// RARITY BASELINE — measures how often each chart feature actually occurs, so the reading can call
// something "uncommon" and mean it. Writes corpus-rarity.json, which the engine reads.
//
// Without this, "rare" is an assertion. With it, every rarity claim in the reading has a receipt:
// a frequency measured over a wide spread of real computed charts.
//
// Run:  node tests/rarity-baseline.cjs [n]     (default 400 charts)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = 8975;
const N = parseInt(process.argv[2], 10) || 400;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

// A deterministic spread rather than random sampling: every month, many hours (so every Ascendant
// gets its turn), a range of latitudes north and south, and four decades. Deterministic because a
// pinned baseline that shifts between runs is not a baseline.
function buildCharts(n) {
  const places = [
    { lat: 51.5, lon: -0.13, tz: 0, iana: 'Europe/London' },
    { lat: -33.87, lon: 151.21, tz: 11, iana: 'Australia/Sydney' },
    { lat: 40.71, lon: -74.0, tz: -5, iana: 'America/New_York' },
    { lat: 64.15, lon: -21.94, tz: 0, iana: 'Atlantic/Reykjavik' },
    { lat: 1.35, lon: 103.82, tz: 8, iana: 'Asia/Singapore' },
    { lat: -23.55, lon: -46.63, tz: -3, iana: 'America/Sao_Paulo' },
    { lat: 35.68, lon: 139.69, tz: 9, iana: 'Asia/Tokyo' },
    { lat: 30.04, lon: 31.24, tz: 2, iana: 'Africa/Cairo' },
  ];
  const out = [];
  let i = 0;
  while (out.length < n) {
    const mo = (i % 12) + 1;
    const hour = (i * 7) % 24;                 // 7 and 24 are coprime: every hour gets used
    const day = ((i * 11) % 27) + 1;           // spread across the month, never invalid
    const year = 1955 + ((i * 13) % 60);
    const pl = places[i % places.length];
    out.push(Object.assign({ name: 'R', y: year, mo, d: day, hour, min: (i * 17) % 60, manualTz: false, timeKnown: true }, pl));
    i++;
  }
  return out;
}

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ executablePath: CHROME });
  const pg = await b.newPage();
  const perr = []; pg.on('pageerror', e => perr.push(e.message.slice(0, 200)));
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3200);

  const counts = await pg.evaluate((charts) => {
    const CL = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    const tally = {}, bump = k => { tally[k] = (tally[k] || 0) + 1; };
    let ok = 0;
    for (const bb of charts) {
      let c; try { c = APP.compute(bb, APP.STATE.settings); } catch (e) { continue; }
      APP.STATE.birth = bb; APP.STATE.chart = c;
      ok++;
      const dets = {};
      for (const k of CL) { try { dets[k] = APP.determination(c, bb, k); } catch (e) {} }

      // --- essential state ---
      let dom = 0, exalt = 0, deb = 0, per = 0;
      for (const k of CL) {
        const d = dets[k]; if (!d || !d.essential) continue;
        const L = d.essential.layers || {};
        if (L.domicile) dom++;
        if (L.exaltation) exalt++;
        if (L.detriment || L.fall) deb++;
        if (d.essential.peregrine) per++;
      }
      if (dom) bump('anyDomicile');
      if (dom >= 2) bump('twoDomicile');
      if (exalt) bump('anyExaltation');
      if (deb >= 2) bump('twoDebility');
      if (per >= 4) bump('fourPeregrine');

      // --- aspects ---
      let exact = 0, unasp = 0;
      const aspCount = {};
      for (const A of c.aspects) {
        if (!CL.includes(A.a) || !CL.includes(A.b)) continue;
        aspCount[A.a] = (aspCount[A.a] || 0) + 1; aspCount[A.b] = (aspCount[A.b] || 0) + 1;
        if (A.orb < 1) exact++;
      }
      for (const k of CL) if (!aspCount[k]) unasp++;
      if (exact) bump('anyExactAspect');
      if (exact >= 2) bump('twoExactAspects');
      if (unasp) bump('anyUnaspected');

      // --- reception ---
      let mutual = 0;
      for (let i = 0; i < CL.length; i++) for (let j = i + 1; j < CL.length; j++) {
        try { const r = APP.receptionOf(c, CL[i], CL[j]); if (r && r.kind === 'mutual') mutual++; } catch (e) {}
      }
      if (mutual) bump('anyMutualReception');

      // --- concentration ---
      const bySign = {}, byHouse = {}, byEl = {};
      let angular = 0;
      for (const k of CL) {
        const p = c.planets[k]; if (!p) continue;
        bySign[p.sign] = (bySign[p.sign] || 0) + 1;
        if (p.house) { byHouse[p.house] = (byHouse[p.house] || 0) + 1; if ([1, 4, 7, 10].includes(p.house)) angular++; }
        const el = APP._data().SIGNS[p.sign].element; byEl[el] = (byEl[el] || 0) + 1;
      }
      if (Object.values(bySign).some(v => v >= 3)) bump('stelliumBySign');
      if (Object.values(byHouse).some(v => v >= 3)) bump('stelliumByHouse');
      if (angular >= 4) bump('fourAngular');
      if (angular === 0) bump('noneAngular');
      if (['fire', 'earth', 'air', 'water'].some(e => !byEl[e])) bump('anyEmptyElement');
      if (Object.values(byEl).some(v => v >= 4)) bump('elementDominant');

      // --- rare conditions ---
      try {
        const cd = APP.chartConditions(c, bb) || [];
        if (cd.some(x => x.t === 'cazimi')) bump('cazimi');
        if (cd.some(x => x.t === 'oob')) bump('outOfBounds');
        if (cd.some(x => x.t === 'stationary')) bump('stationary');
      } catch (e) {}
      let combust = 0, retro = 0, atEdge = 0;
      for (const k of CL) {
        const p = c.planets[k]; if (!p) continue;
        if (p.retro) retro++;
        const dg = Math.floor(p.lon % 30); if (dg === 0 || dg === 29) atEdge++;
        if (k !== 'sun' && c.planets.sun) {
          const sep = Math.abs(((p.lon - c.planets.sun.lon + 540) % 360) - 180);
          if (180 - sep <= 7.5 && 180 - sep > 0.283) combust++;
        }
      }
      if (combust) bump('anyCombust');
      if (retro >= 3) bump('threeRetrograde');
      if (atEdge) bump('anyEdgeDegree');

      // --- the Lot of Fortune on an angle ---
      try {
        const lots = APP.lots(c, bb);
        const f = lots && (lots.fortune || (lots.list && lots.list.fortune));
        const flon = (f && (f.lon != null ? f.lon : f)) || null;
        if (flon != null && c.ascBody) {
          const near = a => { const d = Math.abs(((flon - a + 540) % 360) - 180); return 180 - d <= 3; };
          if (near(c.ascBody.lon) || (c.mc != null && near(c.mc))) bump('fortuneOnAngle');
        }
      } catch (e) {}

      // --- the captain in the 1st ---
      if (c.ascBody) {
        const TRAD = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'];
        const cap = TRAD[c.ascBody.sign], cp = c.planets[cap];
        if (cp && cp.house === 1) bump('captainInFirst');
      }
    }
    return { n: ok, tally };
  }, buildCharts(N));

  await b.close(); srv.kill();
  if (perr.length) { console.error('PAGE ERRORS:', perr.slice(0, 3)); process.exit(1); }

  const freq = {};
  for (const k of Object.keys(counts.tally).sort()) freq[k] = +(counts.tally[k] / counts.n).toFixed(4);
  const out = { measuredOver: counts.n, generatedBy: 'tests/rarity-baseline.cjs', freq };
  fs.writeFileSync(path.join(ROOT, 'corpus-rarity.json'), JSON.stringify(out, null, 2) + '\n');

  console.log(`RARITY BASELINE over ${counts.n} charts\n`);
  Object.keys(freq).sort((a, z) => freq[a] - freq[z]).forEach(k =>
    console.log(`  ${(100 * freq[k]).toFixed(1).padStart(6)}%  ${k}`));
  console.log('\nwrote corpus-rarity.json');
})();
