// PROSE LINT — the check that was missing. golden/doctrine prove the astrology is right; stress
// proves nothing crashes; voiceCheck proves no banned words. NONE of them proved the sentences
// actually read as written English. This does: it measures the machine-text signature.
//
// Fails on:
//   · em-dash density above 0.5 per sentence (the single loudest "a machine wrote this" tell)
//   · a parenthetical em-dash pair that never closes ("the X — a, b, c, and then more prose")
//   · second-person counsel / personality profiling ("you came here to", "your job is", "your lesson")
//   · a repeated formula inside one passage (the same clause twice)
//   · sentence fragments (no finite verb) and doubled punctuation
//   · a bare luminary ("answers to Sun" instead of "to the Sun")
// Run:  node tests/prose-lint.cjs   (from astrology/)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const GOLDEN = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden.json'), 'utf8')).charts;
const PORT = 8971;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

const MAX_DASH_PER_SENTENCE = 0.5;
// second-person counsel and personality-profiling: the register the school rejects
const COUNSEL = [
  /\byou came here to\b/i, /\byour job is\b/i, /\byour lesson is\b/i, /\byour task is\b/i,
  /\bthe work of a lifetime\b/i, /\byou are wired to\b/i, /\bmake sure you\b/i,
  /\bthe skill to build\b/i, /\byou should\b/i, /\bwatch the habit\b/i, /\byou were not built\b/i,
];

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ executablePath: CHROME });
  const pg = await b.newPage();
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3200);

  const passages = await pg.evaluate((GOLDEN) => {
    const out = [];
    const CL = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    for (const id of Object.keys(GOLDEN)) {
      const bb = GOLDEN[id].birth; APP.STATE.birth = bb;
      const c = APP.compute(bb, APP.STATE.settings); APP.STATE.chart = c;
      const add = (name, t) => { if (t) out.push({ chart: id, name, text: String(t) }); };
      for (const k of CL) { try { const p = APP.placementProse(c, bb, k); if (p) add('placement:' + k, p.text); } catch (e) {} }
      if (bb.timeKnown) {
        for (let h = 1; h <= 12; h++) { try { const j = APP.judgeHouse(c, bb, h); if (j) add('house:' + h, j.line); } catch (e) {} }
        for (const [n, fn] of [['money', 'judgeMoney'], ['love', 'judgeLove'], ['career', 'judgeCareer'], ['family', 'judgeFamily'], ['health', 'judgeHealth'], ['year', 'yearAhead']]) {
          try { const r = APP[fn](c, bb); if (r) add(n, r.line); } catch (e) {}
        }
        try { const g = APP.lifeAtAGlance(c, bb); if (g) add('glance', g.line); } catch (e) {}
      }
      try { const t = APP.temperamentProse(APP.temperament(c, bb)); if (t) add('temperament', t.text); } catch (e) {}
    }
    return out;
  }, GOLDEN);

  await b.close(); srv.kill();

  const problems = [];
  for (const p of passages) {
    const t = p.text;
    const sents = t.split(/(?<=[.!?])\s+/).filter(s => s.trim());
    const dashes = (t.match(/—/g) || []).length;
    const density = sents.length ? dashes / sents.length : 0;
    const flag = (kind, detail) => problems.push({ ...p, kind, detail });

    if (density > MAX_DASH_PER_SENTENCE) flag('em-dash density', density.toFixed(2) + ' per sentence (' + dashes + '/' + sents.length + ')');
    for (const rx of COUNSEL) { const m = t.match(rx); if (m) flag('second-person counsel', '"' + m[0] + '"'); }
    // an unclosed parenthetical: a dash opens an aside, a comma closes it, then a verb appears that
    // can only belong to the subject BEFORE the dash — i.e. the phrase boundary was lost
    for (const s of sents) {
      if (/—[^—]*,\s*(has|is|are|was|were|answers|stands|scores|keeps|gives|holds)\b/.test(s)) flag('unclosed aside', s.slice(0, 90));
    }
    // repeated formula inside one passage
    const seen = {};
    for (const s of sents) { const sig = s.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 38); if (sig.length > 14) { if (seen[sig]) flag('repeated formula', s.slice(0, 80)); seen[sig] = 1; } }
    // fragments: a "sentence" with no finite verb at all
    for (const s of sents) {
      if (s.length > 24 && s.indexOf(':') < 0 && !/\b(is|are|was|were|has|have|had|does|do|did|keeps|stands|answers|gives|comes|runs|reads|holds|watches|brings|falls|sits|shows|takes|makes|turns|means|pays|leans|carries|can|will|may|would|tends|be|been|weighs|scores|rules|meets|opens|puts|works|speaks|arrives|occupies|seconds|presses|underwrites|withholds|counts|marks|earns|won|carried|met|drawn|read|reads|lie|lies|sit|stand|favours|disturbs|troubling|answer|strains|strain|pay|leans)\b/i.test(s)) flag('fragment', s.slice(0, 80));
    }
    if (/\s—\s*—|,\s*,|::|\.\./.test(t)) flag('doubled punctuation', (t.match(/\s—\s*—|,\s*,|::|\.\./) || [''])[0]);
    const bare = t.match(/\b(?:to|by|from|with)\s(Sun|Moon)\b/);
    if (bare) flag('bare luminary', bare[0]);
  }

  const byKind = {};
  problems.forEach(p => { byKind[p.kind] = (byKind[p.kind] || 0) + 1; });
  console.log(`linted ${passages.length} passages across ${Object.keys(GOLDEN).length} charts`);
  const worst = passages.map(p => { const s = p.text.split(/(?<=[.!?])\s+/).filter(x => x.trim()); return { n: p.name, d: s.length ? (p.text.match(/—/g) || []).length / s.length : 0 }; }).sort((a, z) => z.d - a.d)[0];
  console.log(`worst em-dash density: ${worst.n} at ${worst.d.toFixed(2)}/sentence (ceiling ${MAX_DASH_PER_SENTENCE})`);
  if (!problems.length) { console.log('PROSE LINT: PASS — reads as written prose.'); process.exit(0); }
  console.log('PROSE LINT: FAIL —', JSON.stringify(byKind));
  problems.slice(0, 25).forEach(p => console.log(`  ✗ [${p.chart}/${p.name}] ${p.kind}: ${p.detail}`));
  process.exit(1);
})();
