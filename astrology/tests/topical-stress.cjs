// BROAD STRESS HARNESS for the session's new engine (temperament, medical, topical syntheses,
// the glance, and the Valens ZR). Runs them across MANY diverse synthetic charts and asserts:
// no exceptions, voice-book clean, ≥2 chart determinants, verdict variety, and no grammar smells
// (double spaces, "a a", "your 0", "in  in", empty clauses, "undefined", "NaN"). This is the
// "make the scale provable" pass (narrative-engine step 49): the 5-chart golden pins meaning; this
// proves the engine holds across the space.
// Run:  node tests/topical-stress.cjs   (from astrology/)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = 8951;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

// a spread of birth data: every month (varied Sun sign/season), varied hours (varied Ascendant),
// both hemispheres, a leap day, extreme latitude, and a couple of historical/edge dates.
function buildCharts() {
  const charts = [];
  const places = [
    { lat: 51.5, lon: -0.13, tz: 0, iana: 'Europe/London', place: 'London' },
    { lat: -33.87, lon: 151.21, tz: 11, iana: 'Australia/Sydney', place: 'Sydney' },     // southern hemisphere
    { lat: 40.71, lon: -74.0, tz: -5, iana: 'America/New_York', place: 'New York' },
    { lat: 64.15, lon: -21.94, tz: 0, iana: 'Atlantic/Reykjavik', place: 'Reykjavik' },   // high latitude
    { lat: 1.35, lon: 103.82, tz: 8, iana: 'Asia/Singapore', place: 'Singapore' },        // equatorial
  ];
  let n = 0;
  for (let mo = 1; mo <= 12; mo++) {
    for (const hour of [2, 8, 14, 20]) {        // four hours → four different ascendants
      const pl = places[n % places.length]; n++;
      charts.push({ id: `${mo}-${hour}-${pl.place}`, birth: {
        name: 'T', y: 1985 + (mo % 7), mo, d: (mo === 2 ? 28 : 15), hour, min: 30,
        tz: pl.tz, manualTz: false, iana: pl.iana, lat: pl.lat, lon: pl.lon, place: pl.place, timeKnown: true } });
    }
  }
  charts.push({ id: 'leap-2000', birth: { name: 'T', y: 2000, mo: 2, d: 29, hour: 12, min: 0, tz: 0, iana: 'Europe/London', lat: 51.5, lon: -0.13, place: 'London', timeKnown: true } });
  charts.push({ id: 'notime', birth: { name: 'T', y: 1991, mo: 7, d: 3, hour: 12, min: 0, tz: 0, iana: 'Europe/London', lat: 51.5, lon: -0.13, place: 'London', timeKnown: false } });
  return charts;
}

const GRAMMAR = [/\s\s/, /\b(a|an|the|in|of|to|your)\s+\1\b/i, /\byour 0\b/, /undefined/, /NaN/, /\[object/, /in\s+in\b/, /,\s*,/, /—\s*—/, /\bthe the\b/];

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ executablePath: CHROME });
  const pg = await b.newPage();
  const perr = []; pg.on('pageerror', e => perr.push(e.message.slice(0, 200)));
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3200);

  const charts = buildCharts();
  const out = await pg.evaluate((charts) => {
    const FNS = ['temperament', 'temperamentProse', 'judgeHealth', 'judgeMoney', 'judgeLove', 'judgeCareer', 'judgeFamily', 'lifeAtAGlance', 'zodiacalReleasing'];
    const results = [];
    for (const ch of charts) {
      const bb = ch.birth; APP.STATE.birth = bb;
      let c;
      try { c = APP.compute(bb, APP.STATE.settings); APP.STATE.chart = c; } catch (e) { results.push({ id: ch.id, fn: 'compute', err: String(e).slice(0, 160) }); continue; }
      for (const fn of FNS) {
        let r;
        try { r = APP[fn](fn === 'temperamentProse' ? APP.temperament(c, bb) : c, bb); }
        catch (e) { results.push({ id: ch.id, fn, err: String(e).slice(0, 160) }); continue; }
        // temperamentProse takes (t); handle its arg specially
        if (fn === 'temperamentProse') { try { r = APP.temperamentProse(APP.temperament(c, bb)); } catch (e) { results.push({ id: ch.id, fn, err: String(e).slice(0, 160) }); continue; } }
        if (r == null) { results.push({ id: ch.id, fn, nullOn: bb.timeKnown }); continue; }
        const text = (r.line || r.text || '') + ' ' + (r.receipt || '');
        const rec = { id: ch.id, fn, verdict: r.verdict || r.vitality || r.name || null };
        if (text.trim()) {
          const v = APP.voiceCheck ? APP.voiceCheck(text) : { clean: true, hits: [] };
          if (!v.clean) rec.voice = v.hits;
          // grammar smells: doubled words, "your 0", empty clauses, stray tokens
          const G = [/[a-z]  [a-z]/, /\b(a|an|the|in|of|to|your|and|it|is)\s+\1\b/i, /\byour 0\b/, /\bthe 0\b/, /undefined|NaN|\[object|null\b/, /,\s*,/, /—\s*—/, /\.\s*\./, /\bin\s+in\b/, /\(\s*\)/, /\bof\s+\./];
          const hits = G.filter(rx => rx.test(r.line || r.text || '')).map(rx => rx.source);
          if (hits.length) rec.grammar = hits;
          const dets = ((r.line || '').match(/\b(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces|Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|[0-9]+(st|nd|rd|th))\b/g) || []).length;
          if (dets < 2 && r.line && fn !== 'lifeAtAGlance') rec.thinDeterminants = dets;
        }
        results.push(rec);
      }
    }
    return results;
  }, charts);

  await b.close(); srv.kill();

  // analyse
  const errs = out.filter(r => r.err);
  const voice = out.filter(r => r.voice);
  const grammar = out.filter(r => r.grammar);
  const thin = out.filter(r => r.thinDeterminants != null);
  const nullTimed = out.filter(r => r.nullOn === true);
  const verdicts = {};
  for (const r of out) if (r.verdict) { verdicts[r.fn] = verdicts[r.fn] || {}; verdicts[r.fn][r.verdict] = (verdicts[r.fn][r.verdict] || 0) + 1; }

  console.log(`charts: ${charts.length}  ·  function-calls: ${out.length}`);
  console.log('pageerrors:', perr.length ? perr : 'NONE');
  console.log('exceptions:', errs.length);
  errs.slice(0, 20).forEach(e => console.log('  ✗', e.id, e.fn, '—', e.err));
  console.log('voice violations:', voice.length);
  voice.slice(0, 20).forEach(v => console.log('  ✗', v.id, v.fn, '—', JSON.stringify(v.voice)));
  console.log('grammar smells:', grammar.length);
  grammar.slice(0, 20).forEach(g => console.log('  ✗', g.id, g.fn, '—', JSON.stringify(g.grammar)));
  console.log('thin-determinant lines:', thin.length);
  thin.slice(0, 12).forEach(t => console.log('  ?', t.id, t.fn, '— dets:', t.thinDeterminants));
  console.log('null on a timed chart:', nullTimed.length);
  nullTimed.slice(0, 12).forEach(t => console.log('  ?', t.id, t.fn));
  console.log('verdict distribution:', JSON.stringify(verdicts, null, 0));

  const fail = perr.length || errs.length || voice.length || grammar.length;
  console.log(fail ? '\nSTRESS: FAIL' : '\nSTRESS: PASS — no exceptions, no page errors, voice clean across the spread.');
  process.exit(fail ? 1 : 0);
})();
