export const meta = {
  name: 'aqau-quality-wave',
  description: 'Ship quality items 106-135 plus the Pixar animation pass, in sequential verified batches',
  phases: [
    { title: 'Editorial', detail: 'items 106-110: the words' },
    { title: 'Daily', detail: 'items 111-116: daily-life fit' },
    { title: 'Trust', detail: 'items 117-121: correctness surface' },
    { title: 'Charm', detail: 'items 122-126 + Pixar animation pass' },
    { title: 'Memory', detail: 'items 127-129: people & memory' },
    { title: 'Reach', detail: 'items 130-135: reach & polish' },
    { title: 'Verify', detail: 'full suite, fix, push' },
  ],
}

const RESULT = {
  type: 'object',
  properties: {
    done: { type: 'array', items: { type: 'string' } },
    skipped: { type: 'array', items: { type: 'string' } },
    commit: { type: 'string' },
    notes: { type: 'string' },
  },
  required: ['done', 'skipped', 'commit', 'notes'],
}

const COMMON = `You are working on the Aqau Pluto astrology PWA in /home/user/Fried.zookie/astrology/ (branch claude/astrology-reading-engine-4qfnzh, already checked out; work directly in this tree).

FILES: index.html (~659KB: several inline <script> blocks = ephemeris wrapper EPH, application logic module APP, and the big p5 UI closure), corpus.js (the content/data layer: DATA archetype texts), lib-astronomy.js and lib-p5.js (vendored libraries: NEVER EDIT), sw.js (service worker, cache name aqau-pluto-v4), test.html (regression suite), README.md, CHANGELOG.md, manifest.webmanifest.

ARCHITECTURE: the entire UI is one p5 canvas. Inside the p5 closure in index.html: screens drawn by drawChart/drawRead/drawLearn/drawTarot/drawPeople/drawSettings/drawTodayPanel/drawOnboard; UI state object (UI.screen, UI.readTab with chapters 'story'/'wiring'/'timing'/'days', UI.today opens the Today sheet); hit-testing via pushHit(x,y,w,h,fn); text via paragraph(str,x,ly,w,sz,INK,SERIF,lead[,alpha]) which returns height, eyebrow(txt,x,ly[,ACC]) headers, chip(label,on,x,ly,fn), flatBtn(label,x,ly,w,h,fn,primary), toggleRow(label,opts,cur,ly,fn) in Settings; theme colours INK/ACC/ACCTX/GROUNDS[screen]; scroll via sY(ly); helpers cl01/eCubic/eBack/eElastic/nowT/reduced() (reduced-motion). The APP module exposes: APP.STATE.chart/.birth/.settings (persist with APP.save()), APP.composeDailyEssay(c), APP.composeForecast(c) (cached hourly in UI.forecast), APP.composeTransits(c), APP.upcomingTransits(c,months,cap), APP.personChart(p), APP.chartFP(c), APP.nameFor(k), APP.glyphFor(k). EPH.positions(dayNum) gives raw longitudes; EPH.dayNumber(y,mo,d,utHours). Journal entries live in localStorage 'aqau_journal' keyed YYYY-MM-DD. Settings persist in localStorage 'aqau_settings'.

STYLE RULES (strict): ES5 only, no let/const/arrow functions/template literals (old-Safari support is deliberate). Match the existing dense one-line style. Prose voice: precise, classy, a working astrologer's register, never pandering, never wishy-washy. CRITICAL: avoid em-dashes in any new prose (the user explicitly hates the AI dash habit); use colons, commas, or separate sentences. Use proper curly apostrophes in prose strings.

EDIT METHOD: the files are too large to read whole. Use Grep to find anchors, sed to view regions, and python3 heredoc scripts doing exact-string replacement with assert s.count(old)==1 before writing. Never use blind regex over the whole file.

VERIFY AFTER EVERY CHANGE SET:
1) parse: node -e "const fs=require('fs');const html=fs.readFileSync('astrology/index.html','utf8');for(const s of html.matchAll(/<script(?![^>]*src)[^>]*>([\\s\\S]*?)<\\/script>/g)){try{new Function(s[1])}catch(e){console.log('ERR',e.message);process.exit(1)}};console.log('parse ok')" (run from /home/user/Fried.zookie). Also node --check corpus.js if you edited it.
2) smoke: playwright with executablePath '/opt/pw-browsers/chromium', args ['--no-sandbox']; addInitScript setting localStorage 'aqau_birth' to {"name":"Test","y":1991,"mo":4,"d":16,"hour":14,"min":30,"tz":1,"iana":"Europe/Berlin","lat":52.52,"lon":13.4,"place":"Berlin","timeKnown":true} and 'aqau_settings' to {"zodiac":"tropical","house":"whole","toured":true,"walked":true}; goto file:// path of astrology/index.html; collect pageerror events; they must be empty. Take screenshots to verify visuals when relevant. A working playwright install exists at /tmp/claude-0/-home-user-Fried-zookie/6eac2f32-63a2-52b3-96fc-4b6a342a9a70/scratchpad/smoke (run node from that dir).
3) regression: cd astrology && python3 -m http.server PORT & then playwright goto http://localhost:PORT/test.html, wait 8s, read #sum text: must say ALL PASS. Kill the server after. NEVER change engine math or positions.

WHEN DONE: git add -A && git commit with a clear descriptive message ending with the two trailer lines exactly:
Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014XHTpumM3G9umF9ix9heiw
Do NOT git push. If an item is too risky to do cleanly, skip it and say so in your return rather than shipping something broken. Your final message is data for the orchestrator: list what you did, what you skipped and why, the commit hash, and anything the verifier should check.
`

phase('Editorial')
const a = await agent(COMMON + `
YOUR BATCH: items 106-110, the editorial pass on the writing. The corpus lives mostly in corpus.js (DATA.SUN_IN_SIGN, MOON_IN_SIGN, RISING_IN_SIGN, PLANET_SIGN_TEXT, SIGNS[].style, ELEMENTS, HOUSES, PAIRLIB aspect texts) and some in index.html (lesson texts LESSON/LESSON_MORE/LESSON_YOU, walkthrough walkPre/walkContent, composeCore lead banks).

106: Edit like a book editor. Read the 12 SUN_IN_SIGN, 12 MOON_IN_SIGN, 12 RISING_IN_SIGN texts and the mercury/venus/mars PLANET_SIGN_TEXT sets. In each, find and delete or rewrite the single weakest sentence (hedging, redundancy, cliche). Keep everything else intact. Tighter, not shorter for its own sake.
107: Filler blacklist sweep across corpus.js prose strings ONLY (not code): the phrases "this energy", "in your life", "on some level", "at the end of the day", "deep down", "it's important to". Rewrite each occurrence in place to something concrete (grep them, fix each by hand with exact-string replaces; do not blind-replace).
108: Write one unforgettable, quotable line per sign and append it as the FINAL sentence of each SUN_IN_SIGN text. These 12 lines are the app's reputation: aphoristic, precise, no cliches, no em-dashes. Register examples (do not copy): Aries: 'You were not built to wait your turn.' Virgo: 'Perfection is not the goal; it is the compass.'
109: Speak-aloud QA on the composed daily essay: run the smoke browser, call APP.composeDailyEssay(APP.STATE.chart) for three different test birthdates, read the outputs, and fix any sentence in the essay TEMPLATE BANKS (composeDailyEssay in index.html) that sounds wrong spoken (awkward clause order, double colons, robotic transitions).
110: Second-person consistency audit: in corpus.js, GLOSSARY-style reference entries stay impersonal; SUN/MOON/RISING/PLANET_SIGN_TEXT must be second person 'you'. Fix any drift to third person ('the native', 'this person', 'one').

Commit message theme: 'astrology: editorial pass, the corpus edited like a book (items 106-110)'.`, { label: 'editorial', phase: 'Editorial', schema: RESULT })

phase('Daily')
const b = await agent(COMMON + `
PRIOR WORK THIS RUN: an editorial agent just edited corpus prose. Code anchors unchanged; grep fresh anyway.

YOUR BATCH: items 111-116, daily-life fit.
111: Calmer default: when a returning user opens the app (APP.STATE.chart exists and settings.walked is true), the initial screen should be 'read' with UI.readTab='days' instead of 'chart'. Find where initial UI.screen is decided (grep boot logic). Add a Settings toggle 'Open on' (Days / Chart) persisted as settings.homeScreen, defaulting to 'days'. Deep links (?go=) and first-run onboarding must still win.
112: 30-second tier: at the top of each Read chapter (story/wiring/timing/days in drawRead), add an 'In thirty seconds' block: 2 sentences composed from existing data (story: first two sentences of the first arc block; wiring: the throughline signature; timing: profection + firdaria one-liner; days: the essay's first sentence). A sentence splitter exists (grep "function sentences2"). Style: eyebrow 'IN THIRTY SECONDS' + paragraph + hairline before the full content.
113: Yesterday's essay kept: when composeDailyEssay output is first computed each day, store it in localStorage 'aqau_essays' keyed YYYY-MM-DD (cap 30 entries, prune oldest). In the Days chapter under the today essay, if yesterday's entry exists, show a collapsed row 'Yesterday, as written' expanding on tap (UI.showYesterday) with the stored text.
114: Quiet hours: Settings toggle 'Quiet hours' (Off / 22-08) as settings.quietHours. When on and hour >= 22 or < 8: maybeNotifyToday and updateBadge return early (grep those functions).
115: Moon's next sign-change on the Today sheet: scan EPH.positions forward hourly up to 60h for the Moon's sign flip, binary-refine to ~5 minutes, cache (UI.moonNext, 10-min TTL). There is an existing rough line (grep "until the Moon leaves"): replace with 'Moon enters {sign} {today|tonight|tomorrow} at {HH:MM}' precision.
116: Weekly note: in the Days chapter below the daily essay, 'The week, written out': new APP.composeWeeklyEssay(c): one paragraph with an arc from APP.upcomingTransits(c, 0.35, 20) events in the next 7 days plus the Moon's sign itinerary: name the busiest day precisely with aspect and orb, the easiest day, one instruction. Same register as composeDailyEssay, seeded via chartFP, no em-dashes. Cache like the daily essay.

Commit message theme: 'astrology: daily-life fit (items 111-116)'.`, { label: 'daily', phase: 'Daily', schema: RESULT })

phase('Trust')
const c = await agent(COMMON + `
PRIOR WORK THIS RUN: editorial + daily-fit agents committed; drawRead and the Today panel have new blocks. Grep fresh.

YOUR BATCH: items 117-121, the trust surface.
117: Show the timezone math: on the chart screen near the birth-data eyebrow (grep "Birth chart"), add a small tappable MONO line toggling (UI.showMath) an expanded readout: local time, UTC offset used, UT time, Julian day (derive from EPH.dayNumber; determine its epoch empirically by computing a known date and comparing to its JD, then convert), coordinates, ayanamsa if sidereal. Auditable like an ephemeris page.
118: Methods notes: add a METHODS array (12 entries, one paragraph each) in index.html: positions (astronomy-engine, arcminute), houses (Whole/Equal/Porphyry/Placidus), profections, Zodiacal Releasing (Valens), Firdaria (Persian day/night), Egyptian bounds (Ptolemy), progressions (day-for-a-year), solar returns, eclipses (astronomy-engine search), dignities (Ptolemaic), fixed stars (Robson 1923), synastry scoring. Surface as a new Learn category chip 'Methods' in the 'Time & tradition' level (grep the LEVELS array in drawLearn), rendered via the existing learnList/learnDetail pattern (follow how the 'glossary' cat works; add cat key 'methods').
119: Disagreement honesty: within the METHODS entries for houses, nodes and Lilith, one sentence naming that traditions disagree and what this app chose. Also append one sentence to the Settings house-system explainer (grep "House system") noting the systems answer different questions; none is simply correct.
120: Cross-check screen: near the Settings share/book buttons (grep "Share my chart (image)"), add flatBtn 'Cross-check my positions' toggling UI.crossCheck, rendered in drawSettings: every body listed as glyph, name, longitude formatted sign degrees°minutes' (e.g. 26°01' Aries) exactly like Astro.com for side-by-side comparison, with the note that differences beyond an arcminute would be a bug.
121: Expand test.html: pin (a) the MC longitude, (b) Porphyry cusp 11 for the reference chart, (c) the next lunar eclipse date the engine finds after a FIXED date 2026-07-01 (matched to the day). First run the app headless to read what the engine currently returns, hard-code those as baseline, tolerance 0.02 degrees / same-day. Suite must then show ALL PASS.

Commit message theme: 'astrology: the trust surface (items 117-121)'.`, { label: 'trust', phase: 'Trust', schema: RESULT })

phase('Charm')
const d = await agent(COMMON + `
PRIOR WORK THIS RUN: three agents committed. Grep fresh anchors.

YOUR BATCH: items 122-126 plus the PIXAR PASS. You are the animation director. The standard is the Pixar lamp: motion that expresses intention and weight, never decoration. Principles: anticipation (a small counter-move before the main move), follow-through and settle (overshoot with eBack/eElastic then rest), slow-in slow-out (no linear ramps), staging (one focus), secondary action (a consequence of the main motion), timing contrast (fast entrance, slow settle). ALWAYS respect reduced() and skip motion when true.

122: Real Moon in the top bar: the emblem (grep drawMoonDisc, curMoonElong, drawTopbar) should render true phase AND flip terminator orientation for southern-hemisphere users (APP.STATE.birth.lat < 0).
123: Sunrise/sunset theme flip: autoNight currently uses fixed hours (grep autoNight and 'h >= 19'). When a chart exists, compute the Sun's altitude at the birth coordinates now via the global Astronomy object (Astronomy.MakeTime(new Date()), Astronomy.Equator + Astronomy.Horizon, or an equivalent simple path); altitude < -6 degrees means night. try/catch with fallback to the fixed hours.
124: Element-hued ripples: grep spawnRipple/drawRipples; tint every tap ripple with ELHUE of the user's dominant element (APP.domElement exported? grep; else compute from APP.STATE.chart.elements). Personalises every touch.
125: The first-cast moment: at onboarding completion where the first walkthrough is armed (grep 'first reveal'), add a 2.5s pre-roll (UI.castMoment with start time) drawn on the chart screen: ground wash, the existing sceneAssembly at centre driven by elapsed time, small MONO caption 'CASTING YOUR SKY', then auto-start the walkthrough. reduced() skips straight through.
126: Page-turn between Read chapters: when UI.readTab changes (grep RTABS in drawRead), record UI.tabT and UI.tabDir (+1/-1 by tab order); for 350ms wrap the chapter content in p.push/translate sliding in from 24px on the entering side with eCubic and fading 0.4 to 1 alpha. Subtle, classy, skipped under reduced().

PIXAR PASS on existing motion (each change small, each verified):
- Walkthrough acts (grep drawWalkthrough, actStage): anticipation: in the first ~80ms of each act, scale 0.97 and 4px dip before the entrance easing takes over; settle: 200ms eElastic micro-settle on scale after entrance completes. Mars keeps its eBack punch; give the Moon act a soft double bob.
- Assembly finale (grep sceneAssembly): when each planet lands, a one-shot ring ripple at the landing point expanding 1.0 to 1.6x over 250ms while fading (secondary action).
- Aspect duet (grep sceneAspectDuet): 80ms of deepened bow immediately before the chord snaps taut, so the snap reads as a release.
- Button/chip feedback: UI.lastHit stores {x,y,t} of the last hit (grep UI.lastHit); draw a quick 150ms expanding rounded-rect glow at that rect after each hit.
- Today sheet: the panel scales in from the moon emblem (grep 'grows out of the live moon emblem'); give the existing me easing a 1.02 overshoot then settle via eBack.
Verify each with mid-animation screenshots plus zero pageerrors.

Commit message theme: 'astrology: charm and the Pixar pass (items 122-126)'.`, { label: 'charm', phase: 'Charm', schema: RESULT })

phase('Memory')
const e = await agent(COMMON + `
PRIOR WORK THIS RUN: four agents committed. Grep fresh anchors.

YOUR BATCH: items 127-129, people and memory.
127: Birthday reminders: in the people list (grep drawPeopleList), compute days to each person's next birthday from person.d/person.mo; within 14 days show a small ACC MONO tag 'BIRTHDAY IN N DAYS' or 'BIRTHDAY TODAY' on the row. In the bond view (grep drawBond), within the window add a ready-to-send one-liner composed from APP.personChart(person)'s Sun sign in the app voice, with a Copy button (grep copyText).
128: On this day: in the Today sheet near the journal (grep 'Journal'), look up localStorage aqau_journal for this date one and two years ago; if found: 'A year ago, under that sky, you wrote:' plus the note in italic serif. Quiet and small.
129: Bond anniversary chart: in drawBond add an 'Anniversary' block. Store met-date on the person object (persisted via the existing people save path; grep STATE.people and save()). For date entry reuse the DOM-input pattern (grep ensureSearchInput) with placeholder 'DD.MM.YYYY', validated. When set: cast the meeting chart via APP.personChart({y,mo,d,hour:12,min:0,tz:0,timeKnown:false, lat/lon from APP.STATE.birth}) and render one composed paragraph: the bond's own Sun/Moon/Venus signs read in the app voice, plus the next anniversary date. If the input proves too fiddly on canvas, ship the reduced version and say so.

Commit message theme: 'astrology: people and memory (items 127-129)'.`, { label: 'memory', phase: 'Memory', schema: RESULT })

phase('Reach')
const f = await agent(COMMON + `
PRIOR WORK THIS RUN: five agents committed. Grep fresh anchors.

YOUR BATCH: items 130-135, reach and finish.
130: Print: improve the Book of You's print CSS (grep exportBook: margins, page-breaks after sections, print-safe sizes) and add a Print button inside the generated book HTML (onclick window.print()). That is the honest print surface for a canvas app; note the scope choice.
131: .ics export: new APP.exportICS(c): VCALENDAR from APP.upcomingTransits(c, 8, 20) plus next solar return and eclipses (composeForecast): each VEVENT all-day (DTSTART;VALUE=DATE:YYYYMMDD), SUMMARY like 'Jupiter trine your Sun (exact)', DESCRIPTION one precise sentence, unique UIDs, RFC 5545 escaping of commas/semicolons, CRLF line endings. Download 'aqau-sky.ics' (blob pattern: grep exportBackup). Button in the Read Days chapter near the transit-calendar button: 'Add these dates to your calendar (.ics)'.
132: Demo chart: on the fresh-start intro (grep drawIntro / drawOnboard), a quiet text button 'or explore a famous chart first' setting Albert Einstein (14 March 1879, 11:30, Ulm: y:1879, mo:3, d:14, hour:11, min:30, tz:0.667, manualTz:true, lat:48.4, lon:10.0, place:'Ulm, Germany', timeKnown:true, name:'Albert Einstein (demo)') through the same commit path onboarding uses (grep how onboarding sets APP.STATE.birth and recomputes). Show a small DEMO tag in the top bar while birth.name contains '(demo)'. Verify: Pisces Sun.
133: Onboarding speed audit: headless, from a truly fresh profile, count the taps/fields to reach a cast chart. Make at most two careful friction cuts (keep the design), e.g. keeping primary continue buttons above the fold at 420x860. Report tap count before and after.
134: Manifesto: in Settings near the ON-DEVICE ENGINE paragraph (grep 'ON-DEVICE ENGINE' or the About area), a 'What this is' block in the app voice: no AI, no server, no account, no tracking; an analytic ephemeris computed on your device to the arcminute; sources named (Ptolemy, Valens, Lilly 1647, Robson 1923); MIT licensed; your data never leaves this machine. Short sentences, no em-dashes.
135: Name the voice: close the manifesto with the line 'Written by the ephemeris. Edited like a book.' and set that line as the meta description in index.html <head> and the description in manifest.webmanifest.

Commit message theme: 'astrology: reach and finish (items 130-135)'.`, { label: 'reach', phase: 'Reach', schema: RESULT })

phase('Verify')
const v = await agent(COMMON + `
YOU ARE THE ADVERSARIAL VERIFIER. Six agents committed batches this run. Their claims:
EDITORIAL: ` + JSON.stringify(a) + `
DAILY: ` + JSON.stringify(b) + `
TRUST: ` + JSON.stringify(c) + `
CHARM: ` + JSON.stringify(d) + `
MEMORY: ` + JSON.stringify(e) + `
REACH: ` + JSON.stringify(f) + `
Trust nothing. Full pass:
1) Parse all inline scripts + node --check corpus.js.
2) Regression suite over HTTP: test.html must show ALL PASS (it may have more assertions than 12 now).
3) Full smoke, zero pageerrors tolerated: with the standard test birth, visit chart, read (all four chapter tabs), learn (open a lesson, open Watch), tarot, people, settings (scroll to bottom, toggle the new settings once and back); open the Today sheet and scroll it. Then a SECOND smoke from a truly fresh profile (no aqau_birth): the intro should offer the famous-chart demo; take it and verify a Pisces Sun renders.
4) Screenshot sanity on: chart screen, read Days chapter, Today sheet, Settings manifesto area, people list. Look for layout collisions (overlapping text/buttons) and fix any with minimal exact-string edits.
5) Spot-check three of the agents' specific claims (pick the riskiest: e.g. the Moon sign-change time on Today, the .ics file content validity, the demo chart tag). 
6) Fix anything broken; commit fixes with the standard trailers.
7) When green: git push -u origin claude/astrology-reading-engine-4qfnzh (retry up to 4 times with 2s/4s/8s/16s backoff on network failure).
Return: suite result, pageerrors found and fixed, what you spot-checked, push confirmation and final commit hash.`, { label: 'verify-and-push', phase: 'Verify', schema: RESULT })

return { editorial: a, daily: b, trust: c, charm: d, memory: e, reach: f, verify: v }
/* QUEUED — dramatic wave 136-165 (141 shipped as blocking-by-aspect; 137, 148 shipped; 142 vetoed; one unlisted feature shipped).
   Remaining to build: 136 overture, 138 eclipse rehearsal, 139 lunar chrome, 140 solar-return scene, 143 house backdrops,
   144 exit-pursued-by-orbit, 145 interval, 146 play-the-wheel, 147 aspect strings, 149 live sky mode, 150 pinch-to-sky,
   151 dedication page, 152 letterpress lines, 153 marginalia, 154 whisper register, 155 Valens/Ptolemy verified quotes,
   156 morning seal, 157 year-wheel ceremony, 158 journal ink, 159 anniversary echoes, 160 closing bow, 161 ephemeris page,
   162 proof gesture, 163 rectification corkboard, 164 watch intermission, 165 one-take demo film. */
