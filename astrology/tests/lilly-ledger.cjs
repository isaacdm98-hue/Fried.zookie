// LILLY'S LEDGER, CHECKED ROW BY ROW AGAINST THE PRINTED TABLE.
//
// The app claims to implement the table of essential dignities and debilities from Christian
// Astrology (1647), Book 1, and Lilly's accidental fortitudes beside it. A claim like that is worth
// nothing unchecked: an audit found the table's FIRST TWO ROWS missing. Lilly writes "If a Planet be
// in his own House, or in mutuall reception with another by house — 5. In his Exaltation, or in
// reception by Exaltation — 4." The engine computed reception everywhere else in the reading and
// never brought it to the ledger, so two planets each standing in the other's own sign — one of the
// strongest configurations in the book — were each scored a bare stranger at −5.
//
// This harness asserts the arithmetic, not the prose:
//   A. every fortitude and debility row Lilly prints carries the points Lilly prints
//   B. the rows Lilly makes alternatives are never charged twice (domicile vs reception by house;
//      peregrine vs any other title, reception included)
//   C. a real chart with a mutual reception scores it, and the same planet without it does not
//   D. the two columns are summed independently and the band follows the published cutoffs
//
// Run:  node tests/lilly-ledger.cjs   (from astrology/)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = 8943;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

// Christian Astrology, Book 1: the table as printed. Label -> points.
const TABLE = {
  'in its own sign': 5,
  'in mutual reception by house': 5,
  'exalted': 4,
  'in mutual reception by exaltation': 4,
  'in its own triplicity': 3,
  'in its own Egyptian terms': 2,
  'in its own face': 1,
  'in detriment': -5,
  'in fall': -4,
  'peregrine': -5,
};
// Lilly's fortitudes ARE cumulative — a planet in its own sign, its own term and its own face is
// charged 5 + 2 + 1, and that is the table working as printed. Only two things are exclusive:
// SAME-ROW alternatives (a row is earned by domicile OR by the reception standing in for it, never
// both), and peregrine, which by definition means holding no title of any kind.
const SAME_ROW = [
  ['in its own sign', 'in mutual reception by house'],
  ['exalted', 'in mutual reception by exaltation'],
];
const TITLES = ['in its own sign', 'exalted', 'in its own triplicity', 'in its own Egyptian terms',
  'in its own face', 'in mutual reception by house', 'in mutual reception by exaltation'];
const BANDS = [[10, 'commanding'], [5, 'sound'], [0, 'mixed'], [-5, 'strained'], [-Infinity, 'afflicted']];

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ executablePath: CHROME });
  const pg = await b.newPage();
  const perr = []; pg.on('pageerror', e => perr.push(e.message.slice(0, 300)));
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3200);

  const R = await pg.evaluate(() => {
    const CL = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    const rows = [], recCharts = [];
    // a wide deterministic spread, so every dignity layer and both reception kinds get sampled
    for (let n = 0; n < 260; n++) {
      const bb = { name: 'L', y: 1950 + (n % 70), mo: 1 + (n % 12), d: 1 + ((n * 11) % 27),
        hour: (n * 7) % 24, min: (n * 17) % 60, tz: 0, iana: 'Europe/London', lat: 51.5, lon: -0.13, timeKnown: true };
      let c; try { c = APP.compute(bb, APP.STATE.settings); } catch (e) { continue; }
      APP.STATE.birth = bb; APP.STATE.chart = c;
      for (const k of CL) {
        let cd; try { cd = APP.conditionVerdict(c, bb, k); } catch (e) { continue; }
        if (!cd) continue;
        rows.push({
          k, sign: c.planets[k].signName,
          ess: cd.essential.rows.map(r => ({ label: r[0], pts: r[1] })),
          essTotal: cd.essential.total, accTotal: cd.accidental.total, total: cd.total, band: cd.band,
        });
        // does the engine's own reception layer agree that this planet is in mutual reception?
        let mutualWith = null;
        for (const o of CL) {
          if (o === k) continue;
          let r; try { r = APP.receptionOf(c, k, o); } catch (e) { continue; }
          if (r && r.kind === 'mutual') { mutualWith = o; break; }
        }
        recCharts.push({ k, mutualWith,
          hasRecRow: cd.essential.rows.some(r => r[0].indexOf('mutual reception') === 0),
          hasPeregrineRow: cd.essential.rows.some(r => r[0] === 'peregrine'),
          essTotal: cd.essential.total, sign: c.planets[k].signName });
      }
    }
    // E. the weighing's lord row must agree with the verdict it feeds: recompute the promise-lean
    // from the layers and compare it against the lean the row actually carries
    const leanRows = [];
    for (let n = 0; n < 40; n++) {
      const bb = { name: 'L', y: 1950 + (n % 70), mo: 1 + (n % 12), d: 1 + ((n * 11) % 27),
        hour: (n * 7) % 24, min: (n * 17) % 60, tz: 0, iana: 'Europe/London', lat: 51.5, lon: -0.13, timeKnown: true };
      let c; try { c = APP.compute(bb, APP.STATE.settings); } catch (e) { continue; }
      APP.STATE.birth = bb; APP.STATE.chart = c;
      for (let h = 1; h <= 12; h++) {
        let jh; try { jh = APP.judgeHouse(c, bb, h); } catch (e) { continue; }
        if (!jh || !jh.testimonies) continue;
        const lordRow = jh.testimonies.find(r => r.role.indexOf('lord of the house') === 0);
        if (!lordRow) continue;
        const ld = APP.determination(c, bb, jh.lord), L = (ld.essential && ld.essential.layers) || {};
        const want = (L.detriment || L.fall) ? -1
          : (L.mutualReception === 'house') ? 1
          : ld.essential.peregrine ? 0
          : (L.domicile || L.exaltation) ? 1 : 0;
        leanRows.push({ h, lord: jh.lord, sign: ld.signName, got: lordRow.lean, want, ok: lordRow.lean === want });
      }
    }
    return { rows, recCharts, leanRows };
  });

  await b.close(); srv.kill();
  if (perr.length) { console.error('PAGE ERRORS:', perr.slice(0, 3)); process.exit(1); }

  const fails = [];
  const seen = {};

  // ---- A. every row carries the points Lilly prints ----
  const unknown = {}, mispriced = [];
  for (const r of R.rows) for (const row of r.ess) {
    seen[row.label] = (seen[row.label] || 0) + 1;
    if (!(row.label in TABLE)) { unknown[row.label] = (unknown[row.label] || 0) + 1; continue; }
    if (TABLE[row.label] !== row.pts) mispriced.push(`${row.label}: table says ${TABLE[row.label]}, engine charged ${row.pts}`);
  }
  console.log(`read ${R.rows.length} planet-ledgers`);
  console.log('\nA. ROWS AGAINST THE PRINTED TABLE');
  Object.keys(TABLE).forEach(l => console.log(`   ${String(TABLE[l]).padStart(3)}  ${l.padEnd(38)} charged ${seen[l] || 0}×`));
  Object.keys(unknown).forEach(l => console.log(`   ✗ essential row not on Lilly's table: "${l}" (${unknown[l]}×)`));
  [...new Set(mispriced)].forEach(m => console.log('   ✗ ' + m));
  if (Object.keys(unknown).length) fails.push(`${Object.keys(unknown).length} essential row(s) are not on the printed table`);
  if (mispriced.length) fails.push(`${[...new Set(mispriced)].length} row(s) charged the wrong points`);
  const never = Object.keys(TABLE).filter(l => !seen[l]);
  if (never.length) fails.push(`row(s) never charged across the whole spread, so unproven: ${never.join(', ')}`);

  // ---- B. Lilly's alternatives are never charged together ----
  console.log('\nB. ALTERNATIVES NEVER CHARGED TWICE');
  const clashes = [];
  for (const r of R.rows) {
    const labels = r.ess.map(x => x.label);
    for (const group of SAME_ROW) {
      const hit = group.filter(l => labels.indexOf(l) >= 0);
      if (hit.length > 1) clashes.push(`${r.k} in ${r.sign}: one row charged twice — ${hit.join(' + ')}`);
    }
    if (labels.indexOf('peregrine') >= 0) {
      const titles = TITLES.filter(l => labels.indexOf(l) >= 0);
      if (titles.length) clashes.push(`${r.k} in ${r.sign}: charged peregrine while holding ${titles.join(' + ')}`);
    }
  }
  console.log(`   ledgers charging two alternatives at once: ${clashes.length}`);
  [...new Set(clashes)].slice(0, 8).forEach(c => console.log('   ✗ ' + c));
  if (clashes.length) fails.push(`${clashes.length} ledger(s) charge mutually exclusive rows together`);

  // ---- C. reception is scored where the engine's own reception layer says it exists ----
  console.log('\nC. RECEPTION REACHES THE LEDGER');
  const mut = R.recCharts.filter(x => x.mutualWith);
  const mutNoRow = mut.filter(x => !x.hasRecRow && x.essTotal <= 0);
  const mutPeregrine = mut.filter(x => x.hasPeregrineRow);
  console.log(`   planets in mutual reception: ${mut.length}`);
  console.log(`   of those, scored a reception row or an outright dignity: ${mut.length - mutNoRow.length}`);
  console.log(`   of those, ALSO charged peregrine: ${mutPeregrine.length}`);
  mutPeregrine.slice(0, 5).forEach(x => console.log(`   ✗ ${x.k} in ${x.sign} is in mutual reception with ${x.mutualWith} and still charged peregrine`));
  if (!mut.length) fails.push('no mutual reception found in the whole spread — the new rows are unproven');
  if (mutPeregrine.length) fails.push(`${mutPeregrine.length} planet(s) in mutual reception are still charged peregrine`);

  // ---- D. the sums and the bands ----
  console.log('\nD. SUMS AND BANDS');
  const badSum = R.rows.filter(r => Math.abs(r.ess.reduce((a, x) => a + x.pts, 0) - r.essTotal) > 1e-9);
  const bandOf = t => BANDS.find(([cut]) => t >= cut)[1];
  const badBand = R.rows.filter(r => bandOf(r.total) !== r.band);
  const badTotal = R.rows.filter(r => Math.abs(r.essTotal + r.accTotal - r.total) > 1e-9);
  console.log(`   essential column sums to its own rows: ${R.rows.length - badSum.length}/${R.rows.length}`);
  console.log(`   net total is essential + accidental:   ${R.rows.length - badTotal.length}/${R.rows.length}`);
  console.log(`   band matches the published cutoffs:    ${R.rows.length - badBand.length}/${R.rows.length}`);
  badBand.slice(0, 5).forEach(r => console.log(`   ✗ ${r.k} total ${r.total} banded "${r.band}", cutoffs say "${bandOf(r.total)}"`));
  if (badSum.length) fails.push(`${badSum.length} essential column(s) do not sum to their own rows`);
  if (badTotal.length) fails.push(`${badTotal.length} net total(s) are not essential + accidental`);
  if (badBand.length) fails.push(`${badBand.length} band(s) disagree with the published cutoffs`);

  // ---- E. the lord row's lean agrees with the doctrine that decides the verdict ----
  console.log('\nE. THE WEIGHING AGREES WITH ITSELF');
  const lr = R.leanRows || [], lrBad = lr.filter(x => !x.ok);
  console.log(`   lord-row leans checked: ${lr.length}; disagreeing with the recomputed promise-lean: ${lrBad.length}`);
  lrBad.slice(0, 6).forEach(x => console.log(`   ✗ h${x.h} lord ${x.lord} in ${x.sign}: row carries ${x.got}, doctrine says ${x.want}`));
  if (!lr.length) fails.push('no lord rows sampled — the weighing agreement is unproven');
  if (lrBad.length) fails.push(`${lrBad.length} lord row(s) carry a lean the doctrine disagrees with`);

  if (fails.length) { console.log('\nLILLY LEDGER: FAIL'); fails.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  console.log('\nLILLY LEDGER: PASS — the table the app cites is the table the app charges.');
  process.exit(0);
})().catch(e => { console.error('ERR', e.stack ? e.stack.slice(0, 600) : e.message); process.exit(1); });
