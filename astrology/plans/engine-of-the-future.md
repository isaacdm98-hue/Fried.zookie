# ENGINE OF THE FUTURE — implementation plan

Companion to `doctrine-notes.md` (read that first), `doctrine-notes-timing-medical.md`,
and `engine-rework.md`. Every file:line below was verified against the working tree on
2026-07-26 (`index.html` = 12,485 lines).

---

## 0. Where the engine actually stands

What it already does better than most shipping software: a genuine four-testimony
judgment procedure (`judgeHouse`, `judgeTopic`) with receipts on every sentence; Lilly's
five-fold essential ledger plus his accidental-fortitude table (`conditionVerdict`,
index.html:2751 ff.); sect, receptions, dispositor chains, cusp almutens, ZR, Firdaria,
profections, bound-distributors, Lots, temperament, a hyleg reading — most commercial
programs compute a fraction of this and none of them *argue* from it. The doctrine layer
is the app's real asset.

What would embarrass it in front of a trained astrologer, in order:

1. **Applying/separating is wrong on most close, fast aspects** (index.html:739-740).
   The single most-consulted traditional determinant — does the promise perfect or is it
   already spent — is decided by stepping the pair a full day, so a Moon within ~6.5° of
   exactness is routinely tagged "separating" while it is in fact applying. An astrologer
   checks this within the first minute of reading.
2. **The verdicts blend zodiacal state with terrestrial circumstance** (index.html:3115,
   3127, 3315, 3371, 3606-3607), which the school's own doctrine (doctrine-notes.md §1,
   §10 step 5) explicitly forbids: a peregrine lord that happens to be angular and free
   of the beams is announced "strong enough to pay." The prose keeps the split; the
   verdicts do not. This is a method error, visible to anyone from the school.
3. **The engine claims precision it does not have.** The header says "~1 arcsecond"
   (index.html:346-347) while astronomy-engine's documented design accuracy is ±1
   arcminute — and the app's own settings copy says "to about an arcminute"
   (index.html:11514). Meanwhile cazimi (a 17′ band, :1775), partile calls (:2773-2779),
   and sign/bound boundaries are hard comparisons with no error bar. A 40″ Moon error can
   silently flip a cazimi or an Egyptian bound, and every downstream score inherits it
   undisclosed — against the app's own receipts rule.

Everything else — mean-equinox angles, J2000 declinations, unprecessed stars, the missing
Regiomontanus — is real but second-order next to those three.

---

## 1. Correctness defects (severity: wrong / imprecise), ranked by how badly they mislead

| # | Defect | Where | Severity | Fix |
|---|--------|-------|----------|-----|
| 1 | **Applying/separating uses a full-day step.** Any fast pair that perfects and overshoots inside 24 h is tagged separating; a Moon 5° before exact conjunction (rel. speed ~12°/day) lands 7.2° past after one day → `applying=false`. Most close Moon testimonies carry the wrong tag, and the timing doctrine ("perfection vs a promise already spent") inverts. | index.html:739-740 (`pts[i].lon + pts[i].spd`, i.e. h=1 day) | wrong | Step a fraction of a day: `var h=0.05;` use `pts[i].spd*h` in the d2 comparison. Overshoot then requires relative motion > 40× the remaining orb — impossible inside any orb the app uses. |
| 2 | **Sect derived from the Sun's house number** (`house 7-12 = day`). Exact for quadrant systems; wrong by up to 30° in whole-sign mode: a risen Sun below the ASC degree in the rising sign sits in whole-sign house 1 and is judged nocturnal. Sect drives benefic/malefic of sect, Dorothean triplicities, temperament, almutens and the PoF day/night formula — one settings toggle can flip the whole chain. | index.html:1754 (`sect`), :2514-2515 (`isDayChart9`), :660-661 (PoF) | wrong | Test the horizon directly: `day = (rev(sunTropLon - hz.asc) >= 180)` (ASC→DSC forward arc is below the horizon; the Sun has no latitude, so exact). Use tropical asc/sun so the ayanamsa cancels. Apply at all three sites. |
| 3 | **Verdicts key on the blended essential+accidental total, violating the state/circumstance split** (doctrine-notes.md §1, §10 step 5: the lord's *zodiacal* state gives the promise; house gives circumstances only). `judgeTopic`'s karaka is already correctly gated on essential score (:3384-3400) — the other five sites are not. | index.html:3115 (`lscore = condition.total`) feeding :3127 (verdict); :3151/:3157 (judgeHouse karaka); :3315 (judgeTopic lord favor); :3371 (Lot); :3606-3607 (testimonyAuthority favor) | wrong | Derive the promise-lean from the essential score (with the existing peregrine branch), keep the accidental column for the circumstances clause — the exact pattern already implemented at :3384-3400. Apply to all five sites. |
| 4 | **Karaka double-count when it occupies a topic house.** Dedup covers lordship only (`lordSeen`), so a planet weighed as occupant is weighed again as karaka — two testimonies from one planet (Sun in the 10th in judgeCareer: occupant +0.5, then karaka again). | index.html:3378-3379 (`karDup9 = !!lordSeen[spec.karaka]`; occupants at :3317-3321 never enter `lordSeen`); same hole in judgeHouse :3149-3152 (gate is `kk === lordK` only, occupant tally at :3092-3094) | wrong | Extend dedup to occupancy: karaka found among the topic's house occupants → lean 0 + the existing "one testimony, not two" wording, skip the favor contribution. |
| 5 | **judgeHouse counts a benefic's square/opposition as pure help** ("seconds what this house promises", lean +1) — no aspect-kind gate — while judgeTopic correctly gates benefics to soft/conjunction (:3329). Doctrine §9: a benefic hard aspect is "tension plus increase," not a plain second; and the two engines answering the same question differently is a fault in itself. | index.html:3103 (benefics: `hard` computed at :3102 never consulted) vs :3329 (`counts = ben ? (!hard) : (hard \|\| conj)`) | wrong | Apply judgeTopic's gate in judgeHouse, or count benefic hard aspects at reduced weight with wording that names the bent pipe ("increase through friction"). The engines must agree. |
| 6 | **South Node is always mean +180 while North Node defaults to true** — the two displayed nodes are not opposite (mean vs true differ up to ~1.75°, so different degree, sometimes different sign/house). And the Lilly node-conjunction rows always read the TRUE node regardless of the Mean setting, so receipts can disagree with the wheel. | index.html:657 (`southNode = mkPoint(..., pos.node.lon + 180)` unconditionally mean) vs :636-637 (node honours `settings.trueNode`, default true at :541); :2792 (`nn9 = c.points.trueNode.lon` ignores the setting), scored at :2793-2795 | wrong | Resolve one selected node longitude once in `computeChart`; build southNode from it; read the same selected node (`c.planets.node.lon`) in the accidental table. |
| 7 | **Daily motion is the mean speed of the NEXT day**, not the birth-instant speed (24 h forward difference; measured Moon error up to 0.224°/day). Feeds applying/separating and Lilly swift/slow (±2), where the Moon's margin over its 13.18°/day mean is often smaller than the error — the swift-vs-slow testimony can flip. | index.html:645 (`spd = sdelta(rawLon, rawNext)`, rawNext at d+1 per :628); consumed at :2764 (`swift9 = Math.abs(p.spd) > MEAN_SPD9[k]`, table at :2712) | imprecise | Centered difference: `spd = sdelta(pos(d-0.05)[k].lon, pos(d+0.05)[k].lon)/0.1` — two extra `positions()` calls shared by all bodies; accurate to <0.01°/day. |
| 8 | **Retro flag from the same 24 h forward difference** — wrong for ~12 h either side of every station (measured against the 2025-03-15 Mercury station). Stationary detection is a sampled band, list stops at Saturn. | index.html:642 (retro), :1777 (`sp = ['mercury'...'saturn']`, band `\|spd\| < 0.018`) | imprecise | Same centered short difference for retro (error drops to minutes); extend the station list to uranus/neptune/pluto with per-planet bands (fraction of mean speed); optionally bisect the speed-zero and report the station hour as a receipt (see Movement 6). |
| 9 | **Declination is J2000-frame, OOB judged against a frozen constant.** `declOf` feeds GeoVector (EQJ) straight to EquatorFromVector without EQJ→EQD; measured errors up to 8.3′ (1955 Moon). OOB then compares vs 23.4366° always, though the true limit is ε of the birth date (23.4457 in 1950). ~10′ of combined slack on a pure threshold call; 1°-orb declination parallels near the limit are unreliable for anyone born decades from 2000. | index.html:468-469 (`declOf`), :1776 (`\|dec\| > 23.4366`), parallels at :1791-1798 | imprecise | Rotate: `AE.RotateVector(AE.Rotation_EQJ_EQD(t), v)` before `EquatorFromVector` (both exported by lib-astronomy.js); compare OOB vs obliquity-of-date (`AE.e_tilt(t).tobl`). |
| 10 | **Angles live in a mean-equinox frame while planets are true-of-date**: GMST truncated after the linear term, no equation of equinoxes, linear mean obliquity. Measured ASC error ~0.8′ for a 1750 chart (0.01-0.02′ for 1987). Small for modern births, real for historical ones — and a 29°58′/0°01′ rising-sign call inherits it. | index.html:372-376 (`obliquity`, `lstDeg`), consumed by `angles()` :377-384 and `placCusp()` :386; planets true-of-date via :463-478 | imprecise | Two lines in `angles()`: `ramc = rev(AE.SiderealTime(t)*15 + lonEast)`; `ecl = AE.e_tilt(t).tobl` — both already exported by the bundled lib. Puts angles/cusps in the planets' frame for any date. |
| 11 | **Main fixed-star table is epoch-frozen while LILLY_STARS9 precesses — the app disagrees with itself.** `starsOn` compares natal tropical longitudes raw against ~J2000 star longitudes (comment at :5606-5607 admits "precession ~50″/yr"); a 1950 birth is judged against stars ~0.6° wrong, comparable to the whole 1.4° orb. | index.html:5608-5631 (`FIXED_STARS`), :5633-5636 (`starsOn`, raw compare, orb 1.4°); contrast :2714 (`LILLY_STARS9 ... // J2000 lons, precessed at use`) | imprecise | One shared `precessLon(lon2000, d)` = lon + 50.29″/yr × years-from-J2000, applied at every comparison site in BOTH tables; add per-star proper motion for fast movers (Arcturus −2.3″/yr). |
| 12 | **Mean Black Moon Lilith presented as "Black Moon Lilith"** — mean vs osculating apogee differ by up to ~30°, enough to change sign and house, and it is woven into aspect lines. (The node, by contrast, honestly ships both with a labeled toggle at :10874.) | index.html:480 (linear mean apogee), display name at :1737, aspect lines :1736-1745 | imprecise | Minimum: label it "Mean Black Moon Lilith" everywhere. Better: true Lilith via osculating-element extraction (Movement 11). |

Cosmetic but worth carrying along: Placidus polar gate `|lat| < 66` vs the real circle
90°−ε ≈ 66.56° (index.html:419) — Rovaniemi births are silently demoted and told Placidus
is "mathematically undefined" (:10858), untrue for that half-degree band; the ayanamsa is
an unlabeled linear Lahiri-approximation (:595) so sidereal users cannot reconcile the app
against any named ayanamsa menu.

---

## 2. The build plan

Ordered by value-per-effort, not by topic. Each movement is a coherent block, shippable
alone. Tests live in a dev-only harness (a plain node script or a hidden page loading
`lib-astronomy.js` + extracted pure functions) — nothing test-related ships in the app
bundle.

### Movement 1 — Kernel truth pass (the one-day bugs)
**Work.** Defects 1, 2, 6, 7, 8 in one sweep, because they share a cause (24 h sampling)
and a code region: fractional-day applying step (:739-740); horizon-arc sect at :1754,
:2514-2515, :660-661; single resolved node feeding southNode (:657) and the Lilly node
rows (:2792); centered birth-instant `spd` and retro flag (:642-645); station list
extended past Saturn with per-planet bands (:1777).
**Doctrine.** Applying/separating IS the doctrine of perfection; sect reweights every
benefic/malefic judgment (doctrine-notes.md §2); the node amplifier/reducer rule (§2)
cannot be applied to two nodes that are not opposite each other.
**Test.** Fixture charts with hand-computed expectations: (a) Moon 5° before exact Sun
conjunction → applying=true; (b) whole-sign chart, Sun risen but below the ASC degree in
the rising sign → day chart in all three sect sites; (c) north+south node exactly 180°
apart under both toggle values, receipts matching the wheel; (d) retro/speed vs a 0.01-day
centered reference across the 2025-03-15 Mercury station — disagreement window < 10 min.
**Effort.** Small. Highest payoff-per-line in the whole plan.

### Movement 2 — Judgment integrity pass (make the engine obey its own doctrine)
**Work.** Defects 3, 4, 5, plus the two "missing" method gaps the auditors flagged:
(a) promise-lean from essential score at the five blended sites (:3127, :3151/:3157,
:3315, :3371, :3606-3607), copying the pattern already correct at :3384-3400;
(b) karaka-occupancy dedup in both engines; (c) benefic hard-aspect gate harmonized
between judgeHouse (:3103) and judgeTopic (:3329); (d) a low-weight branch for malefic
trine/sextile to the lord (currently silent in both engines — :3107-3108, :3329) with the
school's own wording: smooth delivery, foul liquid (§9: "better a square of Jupiter than
a trine of Saturn"); (e) Lilly's reception rows in `conditionVerdict` — his table's first
two rows credit mutual reception by house (5) and by exaltation (4); the app computes
`fullReception` (:3539) but the essential rows at :2754-2761 never consult it, so a
planet in strong mutual reception scores bare peregrine.
**Doctrine.** §1 state/circumstance split; §10 step 5; §9 pipe-and-liquid; §12 four
testimonies, one judgment; Lilly's own table for the ledger the app claims to implement.
**Test.** Adversarial fixtures: peregrine-but-angular lord must read "carried by
circumstance," never "strong enough to pay"; Sun-in-10th career chart counts the Sun
once; identical house judged by judgeHouse and judgeTopic yields the same sign of lean
for every shared testimony; mutual-reception-by-house planet scores +5 essential.
**Effort.** Small-moderate. Pure ES5 logic, no astronomy.

### Movement 3 — One frame of date (true equinox everywhere)
**Work.** Defects 9, 10, plus the cosmetic Placidus gate: `AE.SiderealTime` + `e_tilt`
into `angles()` (:372-384); EQJ→EQD rotation in `declOf` (:468-469); OOB vs
obliquity-of-date (:1776); Placidus gate `|lat| < 90−ε−0.01` (:419); and thread the
house-fallback *reason* (already computed as `pf.polar`, :445-449) into the visible birth
readout so a Tromsø native reads "Placidus undefined at 69°N — judged in Porphyry."
**Doctrine.** The receipts rule extends to the house frame itself: every statement carries
its determinants, including which system produced the cusps and why.
**Test.** 1750 Paris chart: ASC/MC vs Swiss Ephemeris reference values to <5″; declination
of the 1955 Moon vs JPL Horizons to <30″; OOB verdict for a 1955 Moon at 23.44° dec flips
to IN bounds; lat 66.3° chart still gets Placidus; lat 69° chart's readout names the
fallback and the reason.
**Effort.** Small. The bundled library already exports every needed function.

### Movement 4 — The precision budget (stop claiming 1″)
**Work.** Correct the header comment (:346-347) to ±1 arcminute. Add
`BUDGET` (~1/60° per body) and `nearThreshold(value, threshold)`; wherever
cazimi/combust/beams (:1775, :2773-2777), partile (:2779, :2793-2795), station, and
sign/bound boundaries (`Math.floor(lon/30)` at :709 and the dignity lookups ~:1291) are
decided, append a receipt note ("within instrument error of the cazimi boundary") and
adjudicate conservatively (take the lesser dignity; do not claim cazimi). Store ecliptic
latitude instead of `lat: 0` (:465, :478) and annotate the cazimi/combust receipt with it
("in longitude; lat +8.1°") — at inferior conjunction Venus can sit ~9° in latitude from
the Sun's body while "cazimi" by longitude (:1783). Add validity-window guards: minor
bodies outside 1985-2040 get an honest error bar or are skipped with a note (elements +
comment at :683-707, invoked at :668-670); births outside 1700-2200 get a chart-level
caveat. Label "Mean Black Moon Lilith" (:1737) and "Sidereal (Lahiri, linear approx.)"
(:595, :10853).
**Doctrine.** The receipts rule, applied to the instrument itself. A verdict that hinges
on less arc than the engine guarantees is not a verdict; it is a coin toss wearing one.
**Test.** Synthetic chart with a planet 30″ inside the cazimi band → hedged receipt, no
cazimi claim; same 30″ outside → plain "combust"; 1930 birth with minorBodies on →
Chiron carries the uncertainty note; 2100 birth → chart-level caveat present.
**Effort.** Small. This movement is the honesty layer everything later leans on.

### Movement 5 — Stars in the right sky
**Work.** Defect 11: shared `precessLon(lon2000, d)` (50.29″/yr + per-star proper motion
for Arcturus-class movers) applied in `starsOn` (:5633-5636), the herald-star scan
(:5680-5682), and kept consistent with `LILLY_STARS9`'s existing precession (:2714). Date
star sign-ingresses as receipts ("Regulus entered Virgo late 2011; your 2009 birth holds
it at 29°57′ Leo").
**Doctrine.** Lilly-tight star orbs (~1°) are only defensible if the star was where the
chart says on the birth day, not where it sat at J2000.
**Test.** 1950 chart: every star contact matches Astro-Seek's precessed positions within
2′; Regulus tropical longitude crosses 150° between 2011 and 2012.
**Effort.** Small.

### Movement 6 — Exact events by root-finding
**Work.** Bracket the zero of dλ/dt across the existing daily sweeps and refine by
bisection (the app's retro-seasons scan at ~:4799-4817 already walks day steps) to report
station times to the minute; band "stationary" the traditional way — within N days of
station, N per planet — instead of one instantaneous 0.018°/day cutoff that treats
Mercury and Saturn identically (:1777); same sweep+bisection for OOB ingress/egress
dates.
**Doctrine.** Station within ≤1° of a live point is the tradition's most emphatic trigger
(doctrine-notes-timing-medical.md); "Mercury stood still nine hours after your birth at
12°44′ Gemini, the degree of your MC" is a receipt no sampled band can write.
**Test.** 2025 Mercury stations vs published ephemeris tables to <2 min; per-planet bands
grade a station-Saturn strong (retro-station row of the fortitude table) without
flagging a merely slowish Mercury.
**Effort.** Small-moderate.

### Movement 7 — The tradition's own house systems
**Work.** Regiomontanus, Campanus, Alcabitius added to the `houses()` switch
(:421-451) — all closed-form trig on the ramc/ε/lat already in scope (Alcabitius needs
the Asc degree's declination and semi-arc, both available from `placCusp`'s internals).
Offer Regiomontanus as the recommended frame wherever Lilly's condition bands are quoted;
give high-latitude natives Regiomontanus/Campanus (defined to the pole) as a principled
choice instead of only the silent Porphyry fallback.
**Doctrine.** The dignity ledger is Lilly's, and Lilly's tables are Regiomontanus; the
Ibn Ezra lineage the school cites used Alcabitius. Judging with Lilly's bands against
Placidus cusps quotes one authority's rules against another's frame — a 5th-house Saturn
in Placidus is routinely a 4th-house Saturn in Regiomontanus, which changes occupant,
lord, almuten, and therefore the whole four-testimony verdict.
**Test.** Reference charts (incl. 60°N) vs Swiss Ephemeris/Morinus cusp values to <0.01°;
all three systems stay monotonic at 69°N.
**Effort.** Small per system (5-15 lines of ES5 trig each).

### Movement 8 — The time-scale ledger for historical births
**Work.** LMT and Local Apparent Time input modes (pre-standard-zone births were recorded
in one or the other): LMT = pure longitude offset; LAT adds the equation of time (±16.4
min, falls out of the Sun position already computed — apparent RA vs mean Sun, ~5 lines).
Print the full derivation (recorded time → time scale → UT → JD) in the birth-data
readout. Note ΔT itself is NOT a gap — lib-astronomy.js applies Espenak-Meeus inside
MakeTime (lib-astronomy.js:170-172) — but surface its value in the readout for honesty.
**Doctrine.** Historical figures are a core study genre for a traditional-practice app; a
recorded "3:20 in the afternoon" in 1780 read as zone time moves the Ascendant up to
~4° — a different bound, sometimes a different sign, reshuffling profections and
distributors. The printed derivation IS the receipt.
**Test.** A pre-1880 fixture birth entered as LAT vs LMT differs by exactly the EoT of
that date; derivation line reproduces the JD used by the engine.
**Effort.** Small.

### Movement 9 — Topocentric Moon (toggle, off by default)
**Work.** The Moon's horizontal parallax is 54-61′ — the largest single physical delta
left (bigger than every frame issue combined). Off-by-default toggle: observer via
`AE.Observer(b.lat, b.lon, 0)`, topocentric equatorial via the Observer machinery
lib-astronomy.js already exports (currently unused — all bodies go through `GeoVector`
:464 / `EclipticGeoMoon` :477), Moon receipt marked "topocentric" when on. Geocentric
stays the default because it is the astrological convention (Astro.com ships it off).
**Doctrine.** The Moon is the doctrine's most-used significator (light rule, VoC,
applying aspects, hyleg candidacy); a degree of parallax moves it across cusps, bounds,
and the combustion edge.
**Test.** Sample dates vs Swiss Ephemeris SEFLG_TOPOCTR to <10″.
**Effort.** Small-moderate (~20 lines + toggle).

### Movement 10 — Primary directions (the crown, and the largest block)
**Work.** Mundane primary directions by semi-arc (Placidian) with Regiomontanus arcs as a
second method: promissor/significator bookkeeping, direct and converse, zodiacal
(latitude-zero) and in-mundo variants, selectable keys (Ptolemy 1°/yr, Naibod
0°59′08″/yr, true solar arc). Then re-found the bound-distributor timeline on the
directed Ascendant moving in OBLIQUE ASCENSION through the bounds (the classical
circumambulation), replacing/flanking the current ecliptic-arc `boundsWalk`. All
ingredients (RA, declination, ascensional difference, semi-arcs) already exist inside
`placCusp`; the work is careful bookkeeping and root-finding each arc. ~300 lines ES5.
**Doctrine.** This is the principal event-timer of the very school the app encodes;
"transits are read LAST and only where a direction has lit the wire" — with
ecliptic-only symbolic arcs the lit wire can be years off, silently corrupting every
transit judgment gated on it. Ecliptic vs mundane arcs routinely differ by years for the
same pair. The key choice is itself content and rides the receipt.
**Test.** A real test set against Open Source Morinus output: 10+ directions on 3
reference charts, agreement to <0.1° of arc (<~1 month by Naibod); distributor
change-dates vs Delphic-Oracle-style circumambulation references.
**Effort.** Moderate-hard. Do it after Movements 1-4 so it inherits true-frame angles and
honest speeds; before it lands, the app must label symbolic directions and boundsWalk as
"symbolic (ecliptic) arcs," which they are.

### Movement 11 — True Lilith, better node narration
**Work.** Extend the true-node scheme (r-vector cross product, :481-486 — audited solid:
0.21′ vs a tight centered reference; no rework needed) to a unit r,v pair and extract the
osculating apsis line (standard two-body e-vector, ~15 lines ES5) → True Lilith behind
the same toggle style as the node (:10874). Keep "Mean" labels regardless (Movement 4).
**Doctrine.** A point that can sit 30° from where the wheel draws it must either be
computed honestly or named "mean" out loud; sign and house — the domain the
amplifier/reducer doctrine applies to — depend on it.
**Test.** Sample dates vs Swiss Ephemeris SE_OSCU_APOG to <0.5°.
**Effort.** Moderate.

### Movement 12 — Parans and honest phasis (stretch goal, shared machinery)
**Work.** Star-planet co-angularity at the birth latitude from RA/dec and semi-arc
algebra (shared with the Placidus internals): which stars rose/set/culminated with which
planets on the birth day; small RA/dec star catalog (J2000 + precession). Then replace
the flat 7-20° elongation "herald star" heuristic (:5680-5682) with a per-body
arcus-visionis test (Ptolemy's own numbers — fixed arcus per body, no atmospheric model)
for phasis: "Mercury made its morning appearance two days after birth" as a genuine
accidental-fortitude receipt.
**Doctrine.** Parans carry two-plus determinants by construction (star + planet + angle +
latitude) and open royal-star testimony for natives with no zodiacal star contact;
phasis-within-seven-days is a named Hellenistic eminence condition the current
elongation window cannot detect honestly (it ignores latitude, season, and magnitude).
**Test.** Paran hits vs Starlight/Delphic published examples for 2 reference charts;
Venus visible at 5° winter elongation, Saturn invisible at 12°, per the arcus table.
**Effort.** Moderate (~150 lines parans, ~120 phasis reusing the same transforms).

---

## 3. Not worth doing in a single-file offline ES5 app — and why

- **Swapping in Swiss Ephemeris (or a WASM port).** It would buy 0.001″ where the app
  needs honesty about 1′. The cost — megabytes of ephemeris files or a WASM toolchain,
  an async loading model, and the end of "one file, works offline forever" — buys
  nothing the precision budget (Movement 4) doesn't buy more cheaply. ±1′ with
  disclosed error bars is professionally defensible; a silent 1″ claim is not, and that
  is fixed by deleting one comment.
- **Full Schaefer atmospheric visibility modelling for heliacal work.** Temperature,
  pressure, humidity, extinction coefficients — false precision for a birth chart, and
  the tradition's own numbers (Ptolemy's arcus visionis) capture the doctrine.
- **A menu of 40 named ayanamsas.** The app's linear formula tracks Lahiri to ~16″ over
  the century that matters. Label it (Movement 4), optionally add Fagan/Bradley as a
  second anchor-date offset, and stop. The sidereal mode is explicitly a separate
  Jyotisha layer (:4573-4577), not the app's judgment engine.
- **Topocentric planets.** Planetary parallax is <35″ — under the instrument error.
  Moon only (Movement 9).
- **Koch houses.** Modern (20th c.), used by none of the school's authorities, fails at
  the same latitudes as Placidus. The three traditional systems in Movement 7 cover the
  doctrine's actual sources.
- **Fixing Chiron/asteroid accuracy outside 1985-2040.** There is no compact analytic
  theory for a Saturn-perturbed chaotic orbit that fits in a single file. Guard the
  window and say so (Movement 4) — the honest error bar IS the fix.
- **Nutation-wobble-exact ayanamsa, IAU2006/Vondrák long-span precession, ±200-millennia
  support.** The engine's own validated window is 1700-2200; outside it the right move
  is the chart-level caveat, not more polynomial terms the base ephemeris can't back.

## 4. The honesty rule (what the app says when it cannot know)

The engine's floor is astronomy-engine's ±1 arcminute (Moon and planets). Therefore,
permanently and regardless of future movements:

- Any verdict that hinges on less than the budget — cazimi (17′ band), partile-vs-platick
  at 1°00′ vs 0°59′, a planet 0.3′ from a sign or bound boundary, a station flag — either
  carries "within instrument error of the boundary" in its receipt or is adjudicated
  conservatively (the lesser dignity, no cazimi claim, the wider orb class).
- Longitude-only conjunction receipts state the latitude when it is large ("cazimi in
  longitude; 8° north in latitude").
- Minor bodies outside 1985-2040, and any birth outside 1700-2200, carry an explicit
  degradation note. The app never prints a position it cannot stand behind at the
  precision the sentence implies.
- Until Movement 10 lands, symbolic directions and boundsWalk are labeled as ecliptic
  shorthand, not as the classical mundane technique.

Precision claimed nowhere is credibility lost nowhere.
