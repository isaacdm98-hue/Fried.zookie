// INDIVIDUATION HARNESS — makes "this reading is about MY chart" a number.
//
// Four measurements, all on the real composed output of many charts at once:
//
//   1. DETERMINANT FLOOR (per sentence, not per passage). A judged sentence must name at least two
//      things only this chart has — a sign, a planet, a house ordinal, a degree, a score, a year.
//      The stress harness already counts these per passage, which is far too coarse: a paragraph
//      can pass on its first sentence while the other six say nothing chart-specific at all.
//
//   2. VERBATIM OVERLAP. Sentences that come out character-for-character identical across charts
//      are pure template. Some are legitimately doctrine (the transit rule, the health disclaimer);
//      those are declared in DOCTRINE_LINES and exempt. Everything else is a finding.
//
//   3. FRAME ECHO. Mask every determinant and see which sentence FRAMES repeat. This catches the
//      subtler failure: "X answers to Y, in Z, and sits in your Nth" is different text on every
//      chart and yet the same sentence, and a reader feels that.
//
//   4. RECEIPT COMPLETENESS. Every judged beat's receipt must carry something checkable by hand
//      against an ephemeris — a degree or a score. A receipt that says only "WELL-PROMISED" proves
//      nothing.
//
// This harness REPORTS by default and only fails on the floors that are already meant to hold.
// Run:  node tests/individuation.cjs            (report + assert)
//       node tests/individuation.cjs --report    (report only, never fail)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = 8967;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const REPORT_ONLY = process.argv.indexOf('--report') >= 0;

// a spread wide enough that shared text is a real finding, not a coincidence of similar charts:
// every season, both hemispheres, day and night births, four decades, extreme latitudes
const BIRTHS = [
  { id: 'A', y: 1990, mo: 3, d: 21, hour: 6, min: 12, tz: 0, iana: 'Europe/London', lat: 51.5, lon: -0.13, place: 'London' },
  { id: 'B', y: 1978, mo: 11, d: 2, hour: 23, min: 40, tz: -5, iana: 'America/New_York', lat: 40.71, lon: -74.0, place: 'New York' },
  { id: 'C', y: 2001, mo: 7, d: 14, hour: 13, min: 5, tz: 11, iana: 'Australia/Sydney', lat: -33.87, lon: 151.21, place: 'Sydney' },
  { id: 'D', y: 1964, mo: 1, d: 8, hour: 17, min: 55, tz: 1, iana: 'Europe/Paris', lat: 48.86, lon: 2.35, place: 'Paris' },
  { id: 'E', y: 1995, mo: 9, d: 30, hour: 3, min: 20, tz: 8, iana: 'Asia/Singapore', lat: 1.35, lon: 103.82, place: 'Singapore' },
  { id: 'F', y: 1983, mo: 5, d: 6, hour: 9, min: 45, tz: 0, iana: 'Atlantic/Reykjavik', lat: 64.15, lon: -21.94, place: 'Reykjavik' },
  { id: 'G', y: 1972, mo: 8, d: 19, hour: 20, min: 10, tz: 9, iana: 'Asia/Tokyo', lat: 35.68, lon: 139.69, place: 'Tokyo' },
  { id: 'H', y: 2004, mo: 12, d: 28, hour: 4, min: 35, tz: -3, iana: 'America/Sao_Paulo', lat: -23.55, lon: -46.63, place: 'Sao Paulo' },
  { id: 'I', y: 1958, mo: 6, d: 11, hour: 15, min: 20, tz: 2, iana: 'Africa/Cairo', lat: 30.04, lon: 31.24, place: 'Cairo' },
  { id: 'J', y: 1998, mo: 2, d: 17, hour: 1, min: 5, tz: 5.5, iana: 'Asia/Kolkata', lat: 19.08, lon: 72.88, place: 'Mumbai' },
  { id: 'K', y: 1987, mo: 10, d: 3, hour: 11, min: 50, tz: -8, iana: 'America/Los_Angeles', lat: 34.05, lon: -118.24, place: 'Los Angeles' },
  { id: 'L', y: 1969, mo: 4, d: 25, hour: 18, min: 30, tz: 3, iana: 'Europe/Moscow', lat: 55.76, lon: 37.62, place: 'Moscow' },
].map(b => Object.assign({ name: 'T', manualTz: false, timeKnown: true }, b));

// Doctrine sentences are SUPPOSED to be identical on every chart: they state the method, not the
// nativity. They are exempt from the overlap findings, and listed here so the exemption is explicit
// and reviewable rather than a silent threshold.
const DOCTRINE_LINES = [
  'the tradition looks at transits last',
  'read this gently',
  'the tradition reads the body by its forces',
  'never a forecast and never a diagnosis',
  'every birthday the spotlight steps one house forward',
  'each birthday the ascendant steps forward one whole sign',
  'wealth is read across more than one house',
  'union is read across the house of the open partner',
  'a calling is read across the house of public standing',
  'family is read across the house of home and roots',
  'read the passing sky last',
  'no planet occupies',
];

const SIGNS = 'Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces';
const BODIES = 'Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Node|Ascendant|Midheaven';
// each of these names something only this chart has
const DET = [
  new RegExp('\\b(' + SIGNS + ')\\b', 'g'),
  new RegExp('\\b(' + BODIES + ')\\b', 'g'),
  /\b\d+(?:st|nd|rd|th)\b/g,          // house ordinals
  /\d+(?:\.\d+)?\s*°/g,               // degrees and orbs
  /[+−-]\d+\b/g,                 // Lilly scores
  /\b(?:19|20)\d\d\b/g,               // years
  /\bages?\s+\d+/gi,                  // ages
];

function sentences(text) {
  return String(text || '')
    .replace(/(\d)\.(\d)/g, '$1$2')
    .split(/(?:[.!?])\s+|[.!?]$/)
    .map(s => s.replace(//g, '.').trim())
    .filter(s => s.length > 12);
}
function detCount(s) {
  let n = 0;
  for (const rx of DET) { const m = s.match(rx); if (m) n += m.length; }
  return n;
}
function frameOf(s) {
  let f = ' ' + s + ' ';
  for (const rx of DET) f = f.replace(rx, '¤');
  return f.replace(/¤(\s*¤)+/g, '¤').replace(/\s+/g, ' ').trim().toLowerCase();
}
const isDoctrine = s => { const l = s.toLowerCase(); return DOCTRINE_LINES.some(d => l.indexOf(d) >= 0); };

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ executablePath: CHROME });
  const pg = await b.newPage();
  const perr = []; pg.on('pageerror', e => perr.push(e.message.slice(0, 200)));
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3200);

  const passages = await pg.evaluate((births) => {
    const out = [];
    for (const bb of births) {
      APP.STATE.birth = bb;
      let c; try { c = APP.compute(bb, APP.STATE.settings); APP.STATE.chart = c; } catch (e) { continue; }
      const T = (name, f) => {
        let v; try { v = f(); } catch (e) { return; }
        if (!v) return;
        const text = typeof v === 'string' ? v : (v.text || v.line || '');
        if (!text || !text.trim()) return;
        out.push({ chart: bb.id, name, text, receipt: (v && v.receipt) || '' });
      };
      T('temperament', () => APP.temperamentProse(APP.temperament(c, bb)));
      T('glance', () => APP.lifeAtAGlance(c, bb));
      T('money', () => APP.judgeMoney(c, bb));
      T('love', () => APP.judgeLove(c, bb));
      T('career', () => APP.judgeCareer(c, bb));
      T('family', () => APP.judgeFamily(c, bb));
      T('health', () => APP.judgeHealth(c, bb));
      T('year', () => APP.yearAhead(c, bb));
      T('captain', () => APP.rulingVoice(c, bb));
      T('sect', () => APP.sectProfile(c, bb));
      T('bounds', () => { const w = APP.boundsWalk(c, bb); return w && w.current; });
      T('profyear', () => APP.profectionYear(c, bb));
      T('aspect', () => { const a = APP.judgeAspects(c, bb); return a && a[0]; });
      T('ascendant', () => APP.judgeAscendant(c, bb));
      T('captainChain', () => APP.judgeCaptain(c, bb));
      ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].forEach(k =>
        T('placement:' + k, () => APP.placementProse(c, bb, k)));
      for (let h = 1; h <= 12; h++) T('house' + h, () => APP.judgeHouse(c, bb, h));
    }
    return out;
  }, BIRTHS);

  await b.close(); srv.kill();

  const charts = [...new Set(passages.map(p => p.chart))];
  const byName = {};
  for (const p of passages) (byName[p.name] = byName[p.name] || []).push(p);

  // ---- 1. determinant floor, per sentence ----
  const thin = [];
  for (const p of passages) {
    for (const s of sentences(p.text)) {
      if (isDoctrine(s)) continue;
      const n = detCount(s);
      if (n < 2) thin.push({ chart: p.chart, name: p.name, n, s: s.slice(0, 110) });
    }
  }

  // ---- 2/3. verbatim and frame overlap, per chapter ----
  const chapters = [];
  for (const name of Object.keys(byName)) {
    const rows = byName[name];
    const nCharts = new Set(rows.map(r => r.chart)).size;
    if (nCharts < 3) continue;
    const verbatim = {}, frames = {};
    for (const r of rows) {
      const seenV = new Set(), seenF = new Set();
      for (const s of sentences(r.text)) {
        if (isDoctrine(s)) continue;
        const key = s.toLowerCase();
        if (!seenV.has(key)) { seenV.add(key); (verbatim[key] = verbatim[key] || new Set()).add(r.chart); }
        const f = frameOf(s);
        if (f.length > 16 && !seenF.has(f)) { seenF.add(f); (frames[f] = frames[f] || new Set()).add(r.chart); }
      }
    }
    const shared = k => Object.keys(k).filter(s => k[s].size >= Math.max(3, Math.ceil(nCharts * 0.5)))
      .map(s => ({ s, n: k[s].size })).sort((a, z) => z.n - a.n);
    chapters.push({ name, nCharts, verbatim: shared(verbatim), frames: shared(frames) });
  }

  // ---- 4. receipt completeness ----
  const badReceipt = [];
  for (const p of passages) {
    if (!/^(money|love|career|family|health|placement:|house\d|aspect|captain|sect|bounds|profyear|temperament)/.test(p.name)) continue;
    if (!p.receipt) { badReceipt.push({ chart: p.chart, name: p.name, why: 'no receipt' }); continue; }
    if (!/°|[+−-]\d/.test(p.receipt)) badReceipt.push({ chart: p.chart, name: p.name, why: 'no degree or score', r: p.receipt.slice(0, 80) });
  }

  // ---------- report ----------
  const totalSent = passages.reduce((a, p) => a + sentences(p.text).filter(s => !isDoctrine(s)).length, 0);
  console.log(`INDIVIDUATION — ${charts.length} charts · ${passages.length} passages · ${totalSent} judged sentences`);
  if (perr.length) console.log('PAGE ERRORS:', perr);

  console.log(`\n1. DETERMINANT FLOOR (<2 chart-specific tokens): ${thin.length}/${totalSent} sentences (${(100 * thin.length / totalSent).toFixed(1)}%)`);
  const thinBy = {};
  for (const t of thin) thinBy[t.name] = (thinBy[t.name] || 0) + 1;
  Object.keys(thinBy).sort((a, z) => thinBy[z] - thinBy[a]).slice(0, 10)
    .forEach(k => console.log(`   ${String(thinBy[k]).padStart(4)}  ${k}`));
  thin.slice(0, 8).forEach(t => console.log(`   · [${t.chart}/${t.name}] "${t.s}"`));

  const vTot = chapters.reduce((a, c) => a + c.verbatim.length, 0);
  console.log(`\n2. VERBATIM SENTENCES SHARED BY >=HALF THE CHARTS: ${vTot}`);
  chapters.filter(c => c.verbatim.length).sort((a, z) => z.verbatim.length - a.verbatim.length).slice(0, 8)
    .forEach(c => {
      console.log(`   ${c.name} (${c.verbatim.length}):`);
      c.verbatim.slice(0, 3).forEach(v => console.log(`      ${v.n}/${c.nCharts}  "${v.s.slice(0, 96)}"`));
    });

  const fTot = chapters.reduce((a, c) => a + c.frames.length, 0);
  console.log(`\n3. SENTENCE FRAMES SHARED BY >=HALF THE CHARTS: ${fTot}`);
  chapters.filter(c => c.frames.length).sort((a, z) => z.frames.length - a.frames.length).slice(0, 8)
    .forEach(c => {
      console.log(`   ${c.name} (${c.frames.length}):`);
      c.frames.slice(0, 3).forEach(v => console.log(`      ${v.n}/${c.nCharts}  "${v.s.slice(0, 96)}"`));
    });

  console.log(`\n4. RECEIPTS MISSING A CHECKABLE VALUE: ${badReceipt.length}`);
  badReceipt.slice(0, 10).forEach(r => console.log(`   · [${r.chart}/${r.name}] ${r.why}${r.r ? ' — ' + r.r : ''}`));

  // Only the floors that are already meant to hold can fail the build. The overlap numbers are the
  // baseline this plan exists to move; they are printed, tracked, and tightened deliberately.
  // Floors locked at what the engine actually achieves, with a little headroom for chart variation.
  // The determinant floor started at 52.6% thin sentences and is now under 30; it is meant to keep
  // coming down as the individuation plan proceeds, and this ceiling should be tightened each time.
  const FLOORS = { thinPct: 32, badReceipt: 0 };
  const thinPct = 100 * thin.length / totalSent;
  const fails = [];
  if (thinPct > FLOORS.thinPct) fails.push(`determinant floor: ${thinPct.toFixed(1)}% thin sentences (ceiling ${FLOORS.thinPct}%)`);
  if (badReceipt.length > FLOORS.badReceipt) fails.push(`receipts missing a checkable value: ${badReceipt.length}`);
  if (perr.length) fails.push(`${perr.length} page errors`);

  if (REPORT_ONLY) { console.log('\nINDIVIDUATION: report only'); process.exit(0); }
  if (fails.length) { console.log('\nINDIVIDUATION: FAIL'); fails.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  console.log('\nINDIVIDUATION: PASS — the floors hold.');
  process.exit(0);
})();
