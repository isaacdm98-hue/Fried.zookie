// PLAIN-LANGUAGE HARNESS — the everyday-reader floor.
//
// The reading has to be exact AND readable by someone who has never opened an astrology book.
// Those two are not in tension: the tradition's terms are shorthand for plain ideas, so the rule
// is simply that the composed reading never uses the shorthand without saying the plain idea.
//
// Two lists:
//   BANNED   — jargon that must never reach composed prose at all. It belongs in the receipt line
//              (the objective register), in Learn, or in the glossary; not in the reading.
//   GLOSSED  — terms of art the tradition genuinely needs. Allowed, but only if the same passage
//              also carries its plain-English gloss (each entry lists the phrases that count).
//
// Receipts and `src` lines are exempt by design: that is the technical register, and a reader who
// wants the working should get the real vocabulary there.
//
// Run:  node tests/plain-language.cjs   (from astrology/)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = 8957;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

// jargon with no place in the composed reading — every one of these has a plain equivalent
const BANNED = [
  'hairesis', 'almuten', 'peregrine', 'hyleg', 'alcocoden', 'antiscia', 'melothesia',
  'dodecatemoria', 'synodic', 'oriental', 'occidental', 'cadent', 'succedent',
  'distributor', 'profection', 'bound-span', 'term-lord', 'anaretic',
  'dexter', 'sinister', 'zoidion', 'decennial', 'chronocrator',
];

// terms of art the doctrine needs; each must be glossed in the SAME passage
const GLOSSED = {
  'sect': ['day chart', 'night chart', 'born by day', 'born by night', 'above the horizon', 'below the horizon'],
  'combust': ['from the Sun', 'close to the Sun', 'burnt'],
  'cazimi': ['heart of the Sun'],
  'karaka': ['the planet the tradition gives', 'natural significator'],
  'lot of fortune': ['fortune falls', 'the good of it', 'body and livelihood', 'ruled by'],
  'zodiacal releasing': ['chapter', 'stretch of your life', 'period'],
  'firdaria': ['period', 'ages', 'stretch'],
  'lord of the year': ['each birthday', 'every birthday', 'steps forward', 'steps one house', 'handed to', 'the whole year runs on'],
  'time-lord': ['governs', 'runs on', 'handed to', 'period', 'ages'],
  'triplicity': ['dignity', 'supported', 'among his family'],
  'decan': ['face', 'ten degrees', 'third of the sign'],
  'antiscion': ['mirror', 'solstice'],
  'direction': ['degree for a year', 'a year for a degree', 'moved forward', 'advanced', 'directed'],
};

const BIRTHS = [
  { id: 'A', name: 'A', y: 1990, mo: 3, d: 21, hour: 6, min: 12, tz: 0, iana: 'Europe/London', lat: 51.5, lon: -0.13, place: 'London', timeKnown: true },
  { id: 'B', name: 'B', y: 1978, mo: 11, d: 2, hour: 23, min: 40, tz: -5, iana: 'America/New_York', lat: 40.71, lon: -74.0, place: 'New York', timeKnown: true },
  { id: 'C', name: 'C', y: 2001, mo: 7, d: 14, hour: 13, min: 5, tz: 11, iana: 'Australia/Sydney', lat: -33.87, lon: 151.21, place: 'Sydney', timeKnown: true },
  { id: 'D', name: 'D', y: 1964, mo: 1, d: 8, hour: 17, min: 55, tz: 1, iana: 'Europe/Paris', lat: 48.86, lon: 2.35, place: 'Paris', timeKnown: true },
  { id: 'E', name: 'E', y: 1995, mo: 9, d: 30, hour: 3, min: 20, tz: 8, iana: 'Asia/Singapore', lat: 1.35, lon: 103.82, place: 'Singapore', timeKnown: true },
];

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
    const push = (chart, name, v) => {
      if (!v) return;
      const t = typeof v === 'string' ? v : (v.text || v.line || '');
      if (t && t.trim()) out.push({ chart, name, text: t });
    };
    for (const bb of births) {
      APP.STATE.birth = bb;
      let c; try { c = APP.compute(bb, APP.STATE.settings); APP.STATE.chart = c; } catch (e) { continue; }
      const T = (n, f) => { try { push(bb.id, n, f()); } catch (e) { out.push({ chart: bb.id, name: n, text: '', err: String(e).slice(0, 120) }); } };
      T('temperament', () => APP.temperamentProse(APP.temperament(c, bb)));
      T('glance', () => APP.lifeAtAGlance(c, bb));
      T('money', () => APP.judgeMoney(c, bb));
      T('love', () => APP.judgeLove(c, bb));
      T('career', () => APP.judgeCareer(c, bb));
      T('family', () => APP.judgeFamily(c, bb));
      T('health', () => APP.judgeHealth(c, bb));
      T('year', () => APP.yearAhead(c, bb));
      T('captain', () => APP.rulingVoice && APP.rulingVoice(c, bb));
      T('sect', () => APP.sectProfile && APP.sectProfile(c, bb));
      T('bounds', () => { const w = APP.boundsWalk(c, bb); return w && w.current; });
      T('profyear', () => APP.profectionYear && APP.profectionYear(c, bb));
      T('triggers', () => { const t = APP.triggerReading(c, bb); return t && t.doctrine; });
      ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].forEach(k => {
        T('placement:' + k, () => APP.placementProse && APP.placementProse(c, bb, k));
      });
      for (let h = 1; h <= 12; h++) T('house' + h, () => APP.judgeHouse(c, bb, h));
      T('aspect', () => { const a = APP.judgeAspects(c, bb); return a && a[0]; });
      // the Read screen's own chapters — these were missing, which is how "peregrine — neither
      // helped nor harmed by its sign" survived in the very first paragraph of the reading
      T('traditionalRead', () => APP.traditionalRead && APP.traditionalRead(c, bb));
      T('captainChain', () => APP.judgeCaptain && APP.judgeCaptain(c, bb));
      T('ascendant', () => APP.judgeAscendant && APP.judgeAscendant(c, bb));
      T('synthesis', () => { const n = APP.natalSynthesis(c, bb); return n && n.movements ? { text: n.movements.map(m => m.text).join(' ') } : null; });
      T('receptions', () => { const r = APP.receptionsInChart && APP.receptionsInChart(c, bb); return r && r.length ? { text: r.map(x => x.line || x.text || '').join(' ') } : null; });
      T('dispositors', () => { const d = APP.finalDispositors && APP.finalDispositors(c, bb); return d && (d.line || d.text) ? d : null; });
      T('glanceJudged', () => APP.glanceJudged && APP.glanceJudged(c, bb));
      T('boundsNote', () => { const w = APP.boundsWalk(c, bb); return w && (w.note ? { text: w.note } : null); });
    }
    return out;
  }, BIRTHS);

  const fails = [];
  const seen = {};
  for (const p of passages) {
    const low = p.text.toLowerCase();
    for (const w of BANNED) {
      if (low.indexOf(w) >= 0) fails.push({ kind: 'banned', chart: p.chart, name: p.name, term: w, ctx: ctx(p.text, w) });
    }
    for (const term of Object.keys(GLOSSED)) {
      if (low.indexOf(term) < 0) continue;
      const ok = GLOSSED[term].some(g => low.indexOf(g.toLowerCase()) >= 0);
      if (!ok) fails.push({ kind: 'unglossed', chart: p.chart, name: p.name, term, ctx: ctx(p.text, term) });
      else seen[term] = (seen[term] || 0) + 1;
    }
  }
  function ctx(text, term) {
    const i = text.toLowerCase().indexOf(term.toLowerCase());
    return (i < 0 ? text : text.slice(Math.max(0, i - 55), i + term.length + 55)).replace(/\s+/g, ' ');
  }

  await b.close(); srv.kill();

  console.log(`read ${passages.length} composed passages across ${BIRTHS.length} charts`);
  console.log('pageerrors:', perr.length ? perr : 'NONE');
  console.log('terms of art used, and glossed in place:', JSON.stringify(seen));
  const banned = fails.filter(f => f.kind === 'banned'), ung = fails.filter(f => f.kind === 'unglossed');
  console.log('banned jargon in prose:', banned.length);
  banned.slice(0, 25).forEach(f => console.log(`  ✗ [${f.chart}/${f.name}] "${f.term}" — …${f.ctx}…`));
  console.log('terms of art used without their gloss:', ung.length);
  ung.slice(0, 25).forEach(f => console.log(`  ✗ [${f.chart}/${f.name}] "${f.term}" — …${f.ctx}…`));

  const bad = perr.length || fails.length;
  console.log(bad ? '\nPLAIN LANGUAGE: FAIL' : '\nPLAIN LANGUAGE: PASS — every term of art arrives with its plain meaning attached.');
  process.exit(bad ? 1 : 0);
})();
