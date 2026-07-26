// KERNEL HARNESS — the astronomy the judgment stands on.
//
// Everything above this layer is doctrine, and doctrine applied to wrong numbers is wrong. Four of
// the defects it pins came from the same habit: sampling a day of motion and calling it an instant.
//
//   1. APPLYING / SEPARATING. The engine used to step a pair a full day of birth-speed motion and
//      ask whether the orb had shrunk. A Moon 5° before an exact conjunction closes at ~12°/day, so
//      one day later it sits 7° PAST exact, the orb has grown, and the app said "separating" — of
//      the single determinant the tradition consults most. Now differentiated in closed form.
//   2. SECT. Day or night came from the Sun's HOUSE NUMBER (7-12 = above the horizon). Exact for
//      quadrant systems; wrong for whole-sign, where the whole rising sign is house 1, so a Sun
//      already risen but earlier in that sign than the Ascendant's degree was judged nocturnal.
//      Sect decides the helper and the tooth, the triplicity lords, the temperament weighting and
//      the Lot of Fortune's formula — one house toggle inverted the chain.
//   3. THE NODES. The North Node honoured the reader's Mean/True setting; the South Node was always
//      mean + 180. On the default setting the two nodes the app drew were not opposite each other.
//   4. SPEED AND RETROGRADATION. Both came from a d → d+1 forward difference, i.e. the mean speed of
//      the day AFTER birth. Within half a day of a station that gets the direction of travel wrong.
//
// Run:  node tests/kernel.cjs   (from astrology/)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = 8941;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ executablePath: CHROME });
  const pg = await b.newPage();
  const perr = []; pg.on('pageerror', e => perr.push(e.message.slice(0, 300)));
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3200);

  const R = await pg.evaluate(() => {
    const out = { applying: [], sect: [], nodes: [], speed: [], retro: [] };
    const S = () => JSON.parse(JSON.stringify(APP.STATE.settings));
    const chart = (bb, over) => APP.compute(bb, Object.assign(S(), over || {}));

    // ---------- 1. APPLYING / SEPARATING ----------
    // Checked against an INDEPENDENT ground truth, not against the engine's own daily motion: for
    // every aspect in the chart, read the two bodies' raw longitudes 7 minutes either side of the
    // birth instant straight from the ephemeris, measure the orb at each, and see which way it is
    // moving. That is what applying means, computed without touching the code under test. The old
    // whole-day method is measured beside it so the size of the defect is on the record.
    const EPHM = APP._eph ? APP._eph() : null;
    const sdh = (a, z) => ((z - a + 540) % 360) - 180;      // same convention as the app: z - a
    for (let n = 0; n < 120; n++) {
      const bb = { name: 'K', y: 1960 + (n % 60), mo: 1 + (n % 12), d: 1 + ((n * 11) % 27),
        hour: (n * 7) % 24, min: (n * 13) % 60, tz: 0, iana: 'Europe/London', lat: 51.5, lon: -0.13, timeKnown: true };
      let c; try { c = chart(bb); } catch (e) { continue; }
      if (!EPHM) break;
      const E2 = 0.005;                                     // ±7 minutes
      const pB = EPHM.positions(c.d - E2), pF = EPHM.positions(c.d + E2), p0 = EPHM.positions(c.d), p1 = EPHM.positions(c.d + 1);
      const orbAt = (P, ka, kb, angle) => {
        if (!P[ka] || !P[kb]) return null;
        return Math.abs(Math.abs(sdh(P[ka].lon, P[kb].lon)) - angle);
      };
      for (const A of c.aspects) {
        if (A.minor || A.applying == null) continue;
        if (A.a === 'asc' || A.a === 'mc' || A.b === 'asc' || A.b === 'mc') continue;   // angles carry no speed
        const angle = A.asp.angle;
        const oB = orbAt(pB, A.a, A.b, angle), oF = orbAt(pF, A.a, A.b, angle), o0 = orbAt(p0, A.a, A.b, angle);
        const o1 = orbAt(p1, A.a, A.b, angle);
        if (oB == null || oF == null || o0 == null) continue;
        if (Math.abs(oF - oB) < 1e-7) continue;              // stationary in orb: direction undefined
        const truth = oF < oB;                               // orb shrinking = applying
        const oldWouldSay = (o1 != null) ? (o1 < o0 - 1e-6) : null;   // the whole-day step
        out.applying.push({ pair: A.a + '-' + A.b, asp: A.asp.key, orb: +A.orb.toFixed(2),
          got: !!A.applying, want: truth, ok: (!!A.applying) === truth,
          oldWasWrong: oldWouldSay != null && oldWouldSay !== truth,
          daysToExact: A.daysToExact == null ? null : +A.daysToExact.toFixed(2) });
      }
    }

    // ---------- 2. SECT ----------
    // The case the house-number test could not see: whole-sign houses, with the Sun already risen
    // but at a lower degree of the rising sign than the Ascendant. It sits in whole-sign house 1
    // (which the old test read as "below the horizon") while in fact standing above the horizon.
    for (const hs of ['whole', 'placidus', 'equal']) {
      for (let hour = 0; hour < 24; hour++) {
        const bb = { name: 'K', y: 1990, mo: 6, d: 15, hour, min: 30, tz: 0, iana: 'Europe/London',
          lat: 51.5, lon: -0.13, timeKnown: true };
        let c; try { c = chart(bb, { house: hs }); } catch (e) { continue; }
        // ground truth from the horizon arc: the forward arc Asc -> Desc is the half below it
        const truth = ((c.planets.sun.lon - c.ascBody.lon + 360) % 360) >= 180;
        const viaHouseNumber = c.planets.sun.house >= 7 && c.planets.sun.house <= 12;
        out.sect.push({ house: hs, hour, engine: c.isDay, truth, oldWouldSay: viaHouseNumber,
          ok: c.isDay === truth, wasWrong: viaHouseNumber !== truth,
          sunHouse: c.planets.sun.house, sunDeg: +c.planets.sun.lon.toFixed(2), asc: +c.ascBody.lon.toFixed(2) });
      }
    }

    // ---------- 3. THE NODES ----------
    for (const trueNode of [true, false]) {
      for (let k = 0; k < 8; k++) {
        const bb = { name: 'K', y: 1960 + k * 8, mo: 1 + k, d: 10, hour: 12, min: 0, tz: 0,
          iana: 'Europe/London', lat: 51.5, lon: -0.13, timeKnown: true };
        let c; try { c = chart(bb, { trueNode }); } catch (e) { continue; }
        const north = c.planets.node && c.planets.node.lon, south = c.points.southNode && c.points.southNode.lon;
        if (north == null || south == null) continue;
        // the smallest angle between two longitudes is 180 when they are exactly opposite, not 0
        const ang = Math.abs(((north - south + 540) % 360) - 180);
        const off = Math.abs(180 - ang);
        out.nodes.push({ trueNode, year: bb.y, offBy: +off.toFixed(4), ok: off < 1e-6 });
      }
    }

    // ---------- 4. SPEED AND RETROGRADATION, AGAINST A TIGHT REFERENCE ----------
    // A ±0.005-day centred difference (±7 minutes) is the reference. The engine now uses ±0.05 day;
    // a whole-day forward difference is included to show the size of the error that was there.
    const BODIES = ['moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    for (let k = 0; k < 10; k++) {
      const bb = { name: 'K', y: 2025, mo: 3, d: 10 + k, hour: 6, min: 0, tz: 0, iana: 'Europe/London',
        lat: 51.5, lon: -0.13, timeKnown: true };
      let c; try { c = chart(bb); } catch (e) { continue; }
      const d = c.d, E = APP._eph ? APP._eph() : null;
      if (!E) { out.speed.push({ err: 'no ephemeris seam' }); break; }
      const pB = E.positions(d - 0.005), pF = E.positions(d + 0.005), p1 = E.positions(d + 1), p0 = E.positions(d);
      const sd = (a, z) => ((a - z + 540) % 360) - 180;
      for (const k2 of BODIES) {
        if (!pB[k2] || !pF[k2]) continue;
        const ref = sd(pF[k2].lon, pB[k2].lon) / 0.01;
        const fwd = sd(p1[k2].lon, p0[k2].lon);
        out.speed.push({ date: `${bb.y}-${bb.mo}-${bb.d}`, body: k2, ref: +ref.toFixed(4),
          engine: +c.planets[k2].spd.toFixed(4), oldForwardDay: +fwd.toFixed(4),
          errEngine: +Math.abs(c.planets[k2].spd - ref).toFixed(6), errOld: +Math.abs(fwd - ref).toFixed(6) });
        out.retro.push({ date: `${bb.y}-${bb.mo}-${bb.d}`, body: k2, refRetro: ref < 0,
          engineRetro: !!c.planets[k2].retro, oldRetro: fwd < 0,
          ok: (!!c.planets[k2].retro) === (ref < 0), oldWasWrong: (fwd < 0) !== (ref < 0) });
      }
    }

    // ---------- 5. ONE FRAME OF DATE ----------
    // (a) Sun-declination closure: the Sun has essentially no ecliptic latitude, so its declination
    // must equal asin(sin ε · sin λ) with BOTH ε and λ of the birth date. If declOf still returned
    // the J2000 frame, this identity breaks by several arcminutes for births decades from 2000 —
    // it is exactly the test a missing rotation cannot pass.
    out.frame = [];
    if (EPHM && EPHM.oblOfDate) {
      for (const y of [1920, 1955, 1987, 2010, 2025]) {
        const bb = { name: 'K', y, mo: 5, d: 20, hour: 9, min: 0, tz: 0, iana: 'Europe/London', lat: 51.5, lon: -0.13, timeKnown: true };
        let c; try { c = chart(bb); } catch (e) { continue; }
        const dec = EPHM.declOf('Sun', c.d);
        if (dec == null) continue;
        const eps = EPHM.oblOfDate(c.d), lam = c.planets.sun.lon;
        const want = Math.asin(Math.sin(eps * Math.PI / 180) * Math.sin(lam * Math.PI / 180)) * 180 / Math.PI;
        out.frame.push({ y, errArcmin: +Math.abs((dec - want) * 60).toFixed(3) });
      }
    }
    // (b) the Placidus polar gate: 66.3° is inside the real circle (90 − ε ≈ 66.56) and must get
    // Placidus; 69° must fall back. The flat 66 gate failed the first.
    out.polar = [];
    for (const lat of [66.3, 69]) {
      const bb = { name: 'K', y: 1990, mo: 6, d: 15, hour: 12, min: 0, tz: 0, iana: 'Europe/Helsinki', lat, lon: 25.7, timeKnown: true };
      let c; try { c = chart(bb, { house: 'placidus' }); } catch (e) { continue; }
      out.polar.push({ lat, fallback: c.houseFallback || null, want: lat > 66.6 ? 'fallback' : 'placidus',
        ok: lat > 66.6 ? !!c.houseFallback : !c.houseFallback });
    }
    return out;
  });

  await b.close(); srv.kill();
  if (perr.length) { console.error('PAGE ERRORS:', perr.slice(0, 3)); process.exit(1); }

  const fails = [];
  const pct = (a, b) => b ? ((100 * a / b).toFixed(1) + '%') : 'n/a';

  // 1
  const ap = R.applying, apBad = ap.filter(x => !x.ok), apOld = ap.filter(x => x.oldWasWrong);
  console.log(`1. APPLYING / SEPARATING — ${ap.length} aspects, checked against a ±7-minute finite difference`);
  console.log(`   engine correct: ${ap.length - apBad.length}/${ap.length}`);
  console.log(`   the old whole-day step got WRONG: ${apOld.length} (${pct(apOld.length, ap.length)})`);
  const byPair = {};
  apOld.forEach(x => { byPair[x.pair] = (byPair[x.pair] || 0) + 1; });
  Object.keys(byPair).sort((a, z) => byPair[z] - byPair[a]).slice(0, 6)
    .forEach(k => console.log(`     · ${k}: ${byPair[k]} inverted`));
  apBad.slice(0, 8).forEach(x => console.log(`   ✗ ${x.pair} ${x.asp} orb ${x.orb}°: engine says ${x.got ? 'applying' : 'separating'}, the ephemeris says ${x.want ? 'applying' : 'separating'}`));
  const withEta = ap.filter(x => x.daysToExact != null);
  if (withEta.length) console.log(`   days-to-perfection reported on ${withEta.length} applying contacts`);
  if (ap.length < 200) fails.push(`only ${ap.length} aspects sampled — too few to stand on`);
  if (apBad.length) fails.push(`${apBad.length} aspect(s) carry the wrong applying/separating tag`);

  // 2
  const se = R.sect, seBad = se.filter(x => !x.ok), seFixed = se.filter(x => x.wasWrong);
  console.log(`\n2. SECT — ${se.length} charts across three house systems`);
  console.log(`   engine agrees with the horizon: ${se.length - seBad.length}/${se.length}`);
  console.log(`   charts the old house-number test got WRONG (now fixed): ${seFixed.length} (${pct(seFixed.length, se.length)})`);
  seFixed.slice(0, 4).forEach(x => console.log(`   · ${x.house} ${String(x.hour).padStart(2, '0')}:30 — Sun ${x.sunDeg}° in house ${x.sunHouse}, Asc ${x.asc}°: truly ${x.truth ? 'DAY' : 'NIGHT'}, old test said ${x.oldWouldSay ? 'day' : 'night'}`));
  seBad.slice(0, 6).forEach(x => console.log(`   ✗ ${x.house} h${x.hour}: engine=${x.engine} horizon=${x.truth}`));
  if (seBad.length) fails.push(`${seBad.length} chart(s) disagree with the horizon on sect`);

  // 3
  const nd = R.nodes, ndBad = nd.filter(x => !x.ok);
  console.log(`\n3. THE NODES — ${nd.length} charts, both toggle settings`);
  console.log(`   North and South exactly opposite: ${nd.length - ndBad.length}/${nd.length}`);
  ndBad.slice(0, 6).forEach(x => console.log(`   ✗ ${x.year} trueNode=${x.trueNode}: nodes ${x.offBy}° off opposite`));
  if (!nd.length) fails.push('no node samples');
  if (ndBad.length) fails.push(`${ndBad.length} chart(s) draw two nodes that are not opposite each other`);

  // 4
  const sp = R.speed.filter(x => !x.err);
  if (!sp.length) { console.log('\n4. SPEED — SKIPPED: no ephemeris test seam (APP._eph)'); }
  else {
    const worstNew = sp.reduce((m, x) => x.errEngine > m.errEngine ? x : m, sp[0]);
    const worstOld = sp.reduce((m, x) => x.errOld > m.errOld ? x : m, sp[0]);
    console.log(`\n4. DAILY MOTION — ${sp.length} body-days vs a ±7-minute centred reference`);
    console.log(`   engine worst error:  ${worstNew.errEngine}°/day  (${worstNew.body}, ${worstNew.date})`);
    console.log(`   old forward-day worst: ${worstOld.errOld}°/day  (${worstOld.body}, ${worstOld.date})`);
    if (worstNew.errEngine > 0.01) fails.push(`daily motion off by ${worstNew.errEngine}°/day — the centred difference should hold under 0.01`);
    const rt = R.retro, rtBad = rt.filter(x => !x.ok), rtOld = rt.filter(x => x.oldWasWrong);
    console.log(`   retrograde flag correct: ${rt.length - rtBad.length}/${rt.length}; the forward-day method got ${rtOld.length} wrong`);
    rtOld.slice(0, 4).forEach(x => console.log(`   · ${x.date} ${x.body}: truly ${x.refRetro ? 'retrograde' : 'direct'}, old method said ${x.oldRetro ? 'retrograde' : 'direct'}`));
    rtBad.slice(0, 4).forEach(x => console.log(`   ✗ ${x.date} ${x.body}: engine=${x.engineRetro} reference=${x.refRetro}`));
    if (rtBad.length) fails.push(`${rtBad.length} retrograde flag(s) disagree with the reference`);
  }

  // 5
  const fr = R.frame || [];
  if (fr.length) {
    const worstF = fr.reduce((m, x) => x.errArcmin > m.errArcmin ? x : m, fr[0]);
    console.log(`\n5. ONE FRAME OF DATE — Sun-declination closure across ${fr.length} decades`);
    fr.forEach(x => console.log(`   ${x.y}: ${x.errArcmin}′ from asin(sin ε · sin λ) of date`));
    if (worstF.errArcmin > 0.5) fails.push(`declination breaks the frame identity by ${worstF.errArcmin}′ (${worstF.y}) — the EQD rotation is not being applied`);
  } else fails.push('frame closure test did not run');
  const po = R.polar || [];
  po.forEach(x => console.log(`   Placidus at ${x.lat}°N: ${x.fallback ? 'fell back (' + x.fallback + ')' : 'computed'} — ${x.ok ? 'ok' : 'WRONG'}`));
  po.filter(x => !x.ok).forEach(x => fails.push(`Placidus polar gate wrong at ${x.lat}°N`));

  if (fails.length) { console.log('\nKERNEL: FAIL'); fails.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  console.log('\nKERNEL: PASS — the numbers the judgment stands on are the numbers at the moment of birth.');
  process.exit(0);
})().catch(e => { console.error('ERR', e.stack ? e.stack.slice(0, 600) : e.message); process.exit(1); });
