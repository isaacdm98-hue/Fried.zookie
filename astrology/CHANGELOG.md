# Changelog

## 4.15.0 — 2026-07-26 — the astrologer's voice

A ten-step round built on one instruction: stop being vague or technical and
say what the chart means, the way a working astrologer would say it across a
table. Research went into the register that the best pre-written delineation
texts use — the Hand/Greene tradition: second person, no astrologese, recurring
life situations rather than qualities, costs and payments both named.

### Every placement now opens with its meaning

The old paragraph led with machinery ("The Moon keeps its court in your 10th
house, in the sign opposite its own…"). Now:

> Your Moon is your feelings and daily rhythms, what you need in order to feel
> safe — and yours lives in Capricorn, in your 10th house: the public hill,
> where career, reputation and name are made. For the Moon in your 10th, that
> tends to look like: the career is lived in front of people, and the name
> rises and falls with public mood; the mother stands behind the ambition, and
> there is no rest until the work is seen. Capricorn makes your Moon patient
> and ambitious there: it climbs slowly and endures what it climbs through.
> But Capricorn is hard ground for the Moon…

Three new banks carry it: what each planet IS in a life, what each house IS in
a life, and how each sign makes a planet behave — manner of operation, never a
personality profile. The whole 84-entry planet-in-house bank was rewritten from
clause-lists into lived-experience prose, keeping every classical claim.

### Home is now the most important screen

Under the element stick, the chart screen now says what the chart MEANS in two
composed lines — who runs it and from where, and which domain pays easily
against which asks work — tappable straight into the full reading. The house
judgments open with the life ("Your 7th house holds the other person, where
marriage, partners and open rivals meet you as equals") and the Read screen
opens with the Big Three, in the same voice, before the method takes over.

### Removed, fixed, offered

- The three animated journey modes (chart-as-film, card-by-card, the life reel)
  are gone; the reading is the product.
- The first-screen double flash is fixed: the service worker force-reloaded
  every page on activation, including the very first visit, moments after first
  paint. It now reloads only when an old version was actually replaced. The
  chromatic-aberration title flourish stays — it was never the bug.
- The online place search is offered on the birth-place step itself, stated
  plainly both ways, instead of hiding in Settings. Still a choice; the app
  never switches it on by itself.
- Aspects name life areas instead of house numbers ("the parts of your life
  Jupiter answers for — travel, faith and higher learning").

All eleven harnesses pass; every new sentence still carries at least two of the
chart's own determinants, and the individuation floor caught and forced the fix
where the first draft didn't.

## 4.14.1 — 2026-07-26 — the reading, read aloud

A prose pass made by dumping full readings and reading them the way a user
would — no new astrology, only the words. Every fix is to something that was
technically correct and humanly wrong.

- **The domain openers broke their own grammar.** "Your own wealth and income
  *answers* to Venus, a stranger in Aquarius, *and sits in your 11th*" — a
  compound subject on a singular verb, and a "sits" whose grammatical subject
  was the wealth, not the planet. Every opener is now planet-first: "Venus
  answers for your own wealth and income: a stranger in Aquarius, standing in
  your 11th — so money arrives through friends, allies and hopes."
- **The connective was keyed to the house, not the matter.** The love reading
  explained romance with "so *children and joy* come through career"; the family
  reading explained siblings with "the everyday mind and its errands." Each
  topical house now carries its own link — "romance finds you through…", "the
  near family and its daily traffic run through…"
- **The promise sentence now follows the same lean as its mark.** A Moon in
  detriment carried a − in the weighing while its sentence said "is mixed
  there" — the words keyed off Lilly's blended total, the mark off the zodiacal
  state. State now picks the sentence family (weak / strong / middling);
  circumstance picks the variant inside it.
- **The verdict no longer sounds caused by its own counter-evidence.**
  "…well carried; *decided by* Mars's conjunction to the lord" read as if the
  affliction produced the good verdict. It now says "Weighed against it: …"
- **One pronoun per planet.** "*She* owns nothing in Aquarius, so this matter is
  decided entirely by where *it* stands" — the follow-on subject is now
  uniformly "It", matching the promise clauses and the weighing rows.
- **The Sun is not "a kind planet."** As an occupant it now reads: "its light
  dignifies the ground it stands on, though whatever sits too close to it
  burns" — the one rule about the Sun a reader most needs.
- The year-ahead fan-out — "For your child, the motion brings a change in
  partners and rivals, reaching beliefs and far journeys" — now says whose year,
  where it lands, and what to expect, one clause each. The Captain paragraph no
  longer says "chart" three times in one sentence, and the temperament's "Where
  it is tested, it is when it overheats" is untangled.

## 4.14.0 — 2026-07-26 — one frame of date, and the honest boundary

Movements 3–5 of `plans/engine-of-the-future.md`, plus the rest of Movement 2.
Every change carries a harness assertion; one bug the rewrite itself introduced
was caught by the harness before it shipped.

### The angles now stand in the same sky as the planets

The planets come out of the ephemeris in the **true equinox of date** — nutation
and all — while the Ascendant and cusps were built from a linear mean obliquity
and a truncated mean sidereal time: a *mean*-equinox frame, missing the equation
of the equinoxes. Two frames in one chart means the Ascendant and the planets
disagree about where 0° Aries is. The angles now come from `AE.SiderealTime` and
`e_tilt().tobl`; declination is rotated EQJ→EQD before use (the Sun-declination
closure error falls from arcminutes to under 0.01′); out-of-bounds is judged
against the obliquity of the birth date rather than a frozen constant; and the
Placidus polar gate is the real circle 90°−ε, not a flat 66 — which had been
telling Rovaniemi it was mathematically impossible when it wasn't.

### Verdicts inside the error bar are decided the conservative way

The engine's floor is ~1 arcminute per body (~2′ on any two-body separation), and
cazimi is decided at 0.283°. A call within the error bar of that line is a coin
toss wearing a verdict. Written down and enforced: within the bar, take the
lesser dignity, and print the hedge on the ledger row itself —

```
combust — within instrument error of the cazimi line, judged the lesser  −5
```

Reference chart D turned out to be the textbook case: its Mercury stands 0.2766°
from the Sun, 0.4′ inside the cazimi line. Judged conservatively, its captain
loses ten points and the chart's ruling voice passes from Mercury to Mars — three
pinned values moved, recorded with the figure in `tests/golden.json`. Partile
rows within 2′ of the 1° line carry the same hedge. Mean Black Moon Lilith is now
*named* mean; the sidereal toggle names its ayanamsa; the symbolic directions and
the bound-distributor walk say plainly that they are ecliptic degree-for-a-year
shorthand, not the classical circumambulation — that labelling holds until real
primary directions land.

### One aspect rule in both engines — and the bug the harness caught

`judgeHouse` counted a benefic square as pure help and skipped a malefic trine
entirely; `judgeTopic` gated differently — two engines answering the same
question two ways. Both now apply the same four-arm pipe-and-liquid rule: a
benefic by hard aspect still brings increase, *through friction*, at half
weight; a malefic by soft aspect delivers smoothly — and what it delivers is
still its own substance ("better a square of Jupiter than a trine of Saturn"),
at half weight. The rewrite initially admitted the Sun and Moon into the malefic
arm — "the Moon's sextile, smooth delivery of a hard substance" — and the golden
harness caught it within minutes: only the four judged planets belong in that
loop. The middle verdict also lost a borrowed word: a middling lord can be
**carried** or **withheld**, never "taxed", whose text asserts a strength the
lord doesn't have.

### The stars moved

The fixed-star tables are epoch J2000 and precession carries every star ~50″ a
year — for a 1950 birth that is ~0.7°, half the app's 1.4° orb, so star contacts
were being judged against a sky decades out of date. One shared `precStar9()`
now precesses every comparison in `starsOn`, the royal-star watch and the herald
scan, consistent with the Lilly ledger's existing precession.

### What the adversarial verifiers caught

Four skeptic agents were pointed at this round's diff with instructions to
refute it. Their confirmed findings, all fixed before shipping:

- With the *Minor aspects* setting on, a quincunx to a house lord fell into the
  "smooth delivery" arm and was described as an easy angle — false of a 150°
  contact. Only the five Ptolemaic aspects now enter the weighing, in both
  engines.
- `judgeTopic` picked its aspect testimony by orb alone, so a tight benefic
  square could displace a wide malefic conjunction and the two engines answered
  the same question in opposite directions. A full-weight testimony now outranks
  a tighter half-weight one.
- The half arms ignored reception in `judgeHouse` while `judgeTopic` scaled by
  it; both now do, and the "smooth delivery" prose acknowledges the reception
  its own receipt discloses.
- The Lilly star rows used their own year-based precession beside the display
  tables' day-based one; both now go through the one shared helper.
- The combust hedge flag was write-only — computed and never read. It now
  reaches the spoken condition line.
- In **sidereal mode** the ledger's fixed-star row compared an ayanamsa-shifted
  planet against a tropical star — ~24° off, a ±5-point row landing on the wrong
  charts. It now converts back to the tropical frame first, as the star chapter
  always did.
- The pyramid-star scan was the one remaining unprecessed comparison; the Daily
  Sky bulletin and the colleague-export ledger ran cazimi at 0.283 flat and 0.3
  (with combust at 8.5); the Sun's own "what it burns" list disagreed with the
  ledger's band. Every cazimi/combust claim in the app now runs on the same
  conservative numbers.

### A contradiction only a screenshot could catch

The lord's weighing row was reading its lean from a variable declared *after*
the row was written — hoisted, so `undefined` — and a Moon in detriment printed
a neutral mark and "neither strong nor weak" directly above a tally reading
WITHHELD. The verdict itself was always right (it used the assigned value); only
the visible working lied. Found by looking at a screenshot, not by any harness —
so the ledger harness grew section E, which recomputes the promise-lean from the
dignity layers for 480 lord rows and asserts the row carries exactly that lean.

### Also

- A combust lord can no longer be judged **carried**: the carried verdict says
  circumstance can deliver a thin promise, and combustion is the circumstance the
  tradition names as destroying delivery outright. Chart C's 1st-lord Venus —
  2.11° from the Sun with accidental +9 from house and motion — was the case in
  point, and is now withheld.
- The karaka dedup now covers occupancy as well as lordship in `judgeTopic`.
- `tests/kernel.cjs` grew a frame-closure section: Sun declination against
  asin(sin ε · sin λ) of date across five decades, and the polar gate at 66.3°
  (Placidus holds) and 69° (falls back, and says why).

## 4.13.0 — 2026-07-26 — the numbers under the judgment

A research pass across professional ephemeris accuracy, real traditional-astrology
software, and the primary sources' own procedures, then an audit of this engine
against all three. Five defects landed; every one is checked by a new harness, and
each was verified in the code before being believed.

### Applying or separating was wrong on one aspect in eleven

The engine decided whether an aspect was still forming by stepping the pair a
**whole day** of birth-speed motion and asking whether the orb had shrunk. A Moon
five degrees before an exact conjunction closes at about 12°/day — so one day
later it sits seven degrees *past* exact, the orb has grown, and the app reported
"separating."

This is the determinant the tradition consults most often: a promise still
forming against one already spent. It is spoken aloud in the reading ("it was
still tightening at the minute you were born, so it grows louder with age") and
it gates the transit layer.

The orb's rate of change is available in closed form from the two speeds, so it is
now taken directly — no step, nothing to overshoot. `tests/kernel.cjs` checks
1,749 aspects against an independent seven-minute finite difference on raw
ephemeris positions: the engine gets all 1,749 right, and **the old method got 161
wrong (9.2%)**, almost all of them Moon contacts. Applying aspects now also carry
their rate of perfection and days-to-exact.

### Three more one-day bugs in the same region

- **Daily motion and retrogradation** came from the same `d → d+1` forward
  difference — the mean speed of the day *after* birth. Within half a day of a
  station that gets the direction of travel itself wrong. Now a centred difference
  about the birth instant: worst error 0.115°/day → 0.000026°/day.
- **Sect** was read from the Sun's *house number* (7–12 = above the horizon).
  Exact for quadrant systems, wrong for whole-sign, where the whole rising sign is
  house 1, so a Sun that has already risen could be judged nocturnal. Sect decides
  the chart's helper and its tooth, the triplicity lords, the temperament
  weighting and the Lot of Fortune's formula — one house-system toggle could
  invert the chain. Now measured against the horizon arc itself.
- **The two nodes were not opposite each other.** The North Node honoured the
  reader's Mean/True setting; the South Node was hardcoded to mean + 180. On the
  default setting they disagreed by up to ~1°45′ — a different degree, sometimes a
  different sign and house. Lilly's node rows also read the true node regardless of
  the setting, so the ledger could contradict the wheel.

### Lilly's table was missing its first two rows

*Christian Astrology* opens its table of essential dignities: "If a Planet be in
his own House, **or in mutuall reception with another by house** — 5. In his
Exaltation, **or in reception by Exaltation** — 4." The app computed reception
everywhere else in the reading and never brought it to the ledger, so two planets
each standing in ground the other rules — the configuration the tradition cites for
why a square between them resolves rather than festers — were each scored bare
strangers at −5.

Both rows are now charged, reception suppresses the peregrine charge on the same
principle that already stops a planet in its fall being charged twice, and a mixed
exchange (one leg by house, one by exaltation) is graded by the weaker leg.
`tests/lilly-ledger.cjs` checks all ten rows against the printed points, asserts
Lilly's same-row alternatives are never charged twice, and confirms the two columns
sum independently to the published bands.

### The engine was flattering two-thirds of its readers

`judgeMoney` called 33 of 49 sample charts "well-promised." The cause, measured
over 2,100 planet-ledgers: **Lilly's accidental column is not zero-centred.** Its
mean is +6.50 and its median +7 — nine of his twelve houses score positive and only
three negative, before direct motion, swiftness, increasing light and freedom from
the beams are added. The essential column, by contrast, has mean +0.32 and median 0.

Every testimony's plus-or-minus had been read off the *blended* total, which
returned "favours the matter" 60.7% of the time against 20.3% adverse — a
three-to-one thumb on the scale, per testimony, compounding across three or four
testimonies per domain.

The fix is the school's own first rule (Morin's *état céleste* against *état
terrestre*): the **sign** says what a significator can promise; the **house** says
only under what circumstances it must deliver. `promiseLean9` reads the zodiacal
state alone and returns 23.5% favour / 55.5% neutral / 21.0% against — symmetric,
as a zero-centred judgment should be. Lilly's blended total keeps both of its real
jobs: it is the figure printed in every receipt and the band spoken in the prose.
It no longer decides whether a testimony favours the matter.

Across the spread, `mixed` is now the plurality in every domain, as the tradition
expects: money 16 well-promised / 28 mixed / 5 hard-won.

### A fifth house-verdict, because four were three too few in the middle

With the lean now zodiacal, a lord holding only a term or a face — a thin claim,
neither owned nor undone — fell straight through to **withheld**, which asserts the
lord is too weak to pay at all. That is a real misreading when the same lord is
angular, direct and free of the beams. **Carried** is that case said honestly, and
it is what the state/circumstance split implies: a matter decided by where the
significator stands rather than by what it owns.

Six pinned verdicts moved, each recorded with its reasoning in
`tests/golden.json → doctrineChanges`.

### Also

- The header comment claimed positions accurate to "~1 arcsecond." The bundled
  library's documented design accuracy is ~1 **arcminute**, and the app's own
  Settings copy already said so — a sixtyfold overstatement, now corrected, with
  the honesty rule written down beside it.
- `plans/engine-of-the-future.md` — the full research output: twelve ranked
  correctness defects with file:line evidence, a twelve-movement build plan, and a
  section on what is *not* worth doing in a single-file offline app and why.
- Two new harnesses (`kernel`, `lilly-ledger`) bring the floor to ten.

## 4.12.0 — 2026-07-26 — the four testimonies, shown rather than described

The method this app is built on is explicit: four testimonies to one judgment.
The app was performing all four and then handing over only the conclusion, with
the working folded invisibly into a paragraph. Now every domain shows its
weighing.

### The weighing

`judgeTopic` and `judgeHouse` both return `testimonies` — one row per testimony,
in the method's own order (what occupies the house → the lord who carries the
promise → what reaches that lord → the Lot → the natural significator, checked
last) — plus a `tally` of how many lean each way. Each row carries three things:
the office it speaks from, what it says in plain English, and **the figure it was
read from**:

```
LORD OF THE HOUSE, WHO CARRIES THE PROMISE
Jupiter answers for this ground, exalted in Cancer, and works from your
4th — home, family and roots. It is well enough disposed to pay what it promises.
Jupiter 1°46' Cancer · 4th (angular) · essential +4 · accidental +9 · net +13 (commanding)
```

Position to the arc-minute, the house and its class, retrogradation, and Lilly's
ledger split into its two columns — because the essential column and the
accidental column answer different questions, and a net total that hides the
split can say "strong" about a planet with no title of its own propped up by an
angle. On the Read screen the tally is always visible (a verdict whose count you
cannot see is an assertion); the rows themselves open on a tap.

### Three defects the figures exposed immediately

Printing the arithmetic under each sentence made contradictions visible that
prose had been hiding.

**An invented threshold, cutting one of Lilly's bands in half.** The engine had
grown its own cutoff at `+3` alongside Lilly's published bands (commanding ≥10,
sound ≥5, mixed ≥0, strained ≥−5, afflicted below). So a lord at net +4 was
declared "well enough disposed to pay what it promises" directly above a ledger
reading `net +4 (mixed)`. `leanOf9()` now derives every lean, every favour
increment and every verdict from the bands themselves.

**A malefic sitting on a house lord counted for nothing.** `judgeHouse` weighed
malefic squares and oppositions to the lord and passed over the conjunction —
the heaviest affliction of the three. Mars conjunct the lord of the 7th
registered as no testimony at all. `judgeTopic` had always counted it; the two
functions disagreed with each other.

**One planet counted as two testimonies.** Where the natural significator of a
matter is also one of its house lords — Venus for marriage on a Taurus or Libra
7th, for instance — the engine weighed it twice and inflated the verdict on the
strength of a single planet. Both functions now recognise the doubling, say so in
the row ("the same hand holds both offices … one testimony, not two"), and leave
the tally alone. The same rule now covers an occupant that already rules another
of the domain's houses, decided in a pre-pass so the answer never depends on
which house the loop reaches first.

Effect on the pinned reference nativities, recorded in
`tests/golden.json → doctrineChanges`: B.h7 promised → taxed, B.h10 promised →
withheld, C.h1 promised → repaired.

### Also

- Aspect rows now say what the tradition reads and the app was dropping: orb
  strength in words (partile / close / wide) and whether the aspect is applying
  or separating — a thing still forming versus a thing already done.
- The role label wraps at its own size instead of running off the right edge, and
  the tally line drops the toggle to its own line when the two would overprint.
- A `window.__ui` test seam, so a screenshot harness can open a collapsed panel
  rather than hunting for it with a mouse. The sketch runs in instance mode and
  its handle was not kept anywhere.

## 4.11.0 — 2026-07-25 — a full audit, and the things an audit is for

Driven by one instruction: audit and upgrade every element. The findings that
mattered were not the ones I expected.

### The app told the reader the opposite of what it did

Settings says, and has always said, "Off (default): everything runs on-device."
The default was `geocodeOnline: true`, and a migration set it to `true` for
everybody — including users who had deliberately turned it off. The place you
were born is birth data, and it was going to OpenStreetMap. The default is now
off, the migration is deleted, and nothing may switch a privacy setting on
without being asked.

`tests/network.cjs` now proves the claim: it drives every screen with a chart
loaded and asserts **zero external requests** on default settings, then flips
the opt-in and asserts no host appears that Settings does not name.

### Dead code that would have broken that claim

An in-app Internet Archive video player, 4.7KB, could never open: `UI.video`
was only ever set by `openVideo()`, which nothing called. It fetched
archive.org. Dead code that contradicts the app's central promise the moment
someone wires it up is a landmine, not a feature. Removed.

### Pop astrology survived where it was most visible

`MICRO` — 5.7KB of second-person personality profiling keyed to sign ("you do
not know what you feel until you have said it out loud to someone, twice") —
was live, reached from the first-run tour. So the first astrology a new reader
met was pop, while the reading proper was traditional. Worse, the same slide
said "the lights are not your personality" and then appended a line from it.
The tour now carries the actual judgment of each light: its state, its sign,
its house, and the houses it answers for.

`SHAPE_MEAN` was the same thing in another coat — seven chart shapes each read
as a character type ("a natural mediator, sometimes torn"). The shape computes
fine; the readings were profiles. Removed with it.

### Features built and then disconnected

Sixteen engine functions were exported and called by nothing, several of them
things the README advertises. `patternsAsTestimony` — stellium, grand trine,
T-square and yod, weighted and entered into the same judgment as the
house-lords — computed correctly and reached no screen. It is wired in now.

Fixing it exposed a doctrinal error: patterns were formed from ten bodies, so a
reference chart's "stellium in Capricorn" turned out to be Uranus and Neptune
carrying the weight. With the seven classical planets — which is what this
method judges by — that chart has no pattern at all. A modern configuration was
being reported as a traditional testimony.

### The Tarot screen was three buttons and a void

Nearly half the screen was empty on a phone, while the one thing it should show
is the deck that ships with the app. It now shows real bundled faces from
`tarot/`, with a caption that shrink-to-fits rather than running off both edges.

### Housekeeping

- 15 dead functions, 13 dead tables, one orphaned by the removals: **-27KB**.
  A second scan added exported-but-uncalled detection, which the first missed.
- README corrected: it claimed 4.9.1, described the removed chart-shape feature,
  and its "verified headlessly" section predated six of the nine harnesses.

## 4.10.0 — 2026-07-24 — it reads like an astrologer wrote it, and only what she uses

A pass driven by one complaint: the text was full of AI tells and did not make
sense. It was both, and the two were the same job.

**Sentences that meant nothing, fixed.** The week reading said "the week times
investigation" — "times" as a verb with a bare noun. The aspect composer ran at
2.71 em-dashes per sentence with three in its opening line. Across every
composed surface: aspects 2.71 → under ceiling, week 1.20 → under, cycles 0.94 →
0.56, money 1.33 → 0.40, placement 0.42 → 0.10. A new `tidyProse` clause-grammar
pass enforces it, and `tests/prose-lint.cjs` fails the build on the machine-text
signature: em-dash density, unclosed asides, fragments, repeated formulas,
second-person counsel, bare luminaries.

**Cut, because the school does not use it.** Named aspect figures (T-square,
grand trine, yod) and Marc-Edmund-Jones chart shapes, which were presented as
"testimony weight"; the behavioural "tells" ("in a room, the giveaway: you
remember exactly who was kind to you in 2014"); the archetype lines; the
second-person sign text ("you came here to connect ideas and people"), which was
still reaching the sign screen, the walkthrough and the printed book even after
being cut from the main reading. 112KB of dead pop data deleted — corpus.js is
31.5% smaller.

**Added or repaired, because she does use it.** Reception now has its own
chapter, "Who holds whose keys" — the doctrine that explains why a square
resolves and an easy angle disappoints. The dispositor chain was walking MODERN
rulers (Pluto disposing Scorpio in a seven-planet tradition) and now walks the
seven; where every chain ends at one planet, the reading says so. The ruling
voice — the almuten adjudicating a divided chart — is stated plainly instead of
in a broken list. And the degree itself now speaks: the anaretic 29th, the raw
0th, and any fixed star within orb, so two planets in the same sign no longer
read alike.

## 4.9.1 — 2026-07-24 — production polish: audit fixes across the whole app
A multi-agent production audit (voice, doctrine, layout, dead-code) plus a
headless screen audit (7 screens × 3 widths, no runtime errors) drove a cohesion
pass over the entire app.

- **Removed a personality-profile block.** The Sun/Moon/rising "archetypes"
  sketch (after Greene/Rudhyar, with sign-keyed prescriptions like "hire an
  editor") read the SELF as a character profile — the exact modern register the
  school and the voice-book reject, and it contradicted the domain reading on the
  same screen. Gone; the domains-of-a-life reading carries the self, judged.
- **Swept the banned word "energy" from every astrology-reading surface** — the
  aspect-pair table, the "tells", the born-retrograde and Mars-return lines, the
  Today prediction, the arc lines, the Learn glossary, the sign screen, and the
  sign/ascendant/chart-ruler descriptions — each reworded to name what the planet
  DOES (drive, presses, the will), per the voice-book. Tarot keeps its own
  Rider-Waite-Smith vocabulary.
- **Closed the voice-guard's coverage gap.** voiceCheck now scans the new engine
  (temperament, medical, the topical domains, the glance, the year story) and
  composeSignatures, so the banned register can no longer ship unscanned. Clean
  across every reference chart.
- **Layout cohesion.** The subsumed domains no longer draw a double header (the
  domain eyebrow now leads the block alone); the "at a glance" verdict note is
  uppercased to match its all-caps row.
- **Hygiene.** Fixed a dead DATA.TRAD_SRC_LILLY reference. (Several inert,
  never-called helper functions remain documented for a later cleanup; they do
  not render and never execute.)

## 4.9.0 — 2026-07-23 — the year as one story: the ephemeris drives the narrative
The timing engine, now audited and corrected, woven into a single dated arc.

- **"Your year, as one story" (`yearAhead`).** The year-ahead reading now opens
  with one flowing, dated narrative instead of separate technique blocks: the
  **Zodiacal Releasing** chapter and its peak set the tone (a peak/high/quiet
  stretch, a loosing of the bond); the **profection lord of the year** is the
  protagonist, with any planet activated in the profected sign switched on beside
  it; the loudest **symbolic direction** now in force is the dated event; and the
  **derived-houses fan-out** turns that one motion into what it means for a person
  of your life ("and for your father, this reaches his career"). Transits are read
  last, on live wires only. The individual clocks then follow as the detail.

## 4.8.0 — 2026-07-23 — topical synthesis: a domain read across its several houses
The school reads a life-topic across **all** its houses at once, not one in isolation.

- **The topical-synthesis engine (`judgeTopic`) and the Money reading (`judgeMoney`).**
  Wealth is now read the way a traditional astrologer reads it — across the **2nd**
  (your own substance), the **11th** (gain, what work and allies return), the **8th**
  (others' money, debt, inheritance), the **Lot of Fortune** (where the good of it
  flows), and **Jupiter** (the natural significator) — each significator judged by its
  state and *followed to the house it sits in* (the source: "money arrives through
  work" = lord of the 2nd in the 6th), occupants weighed by nature, and one verdict
  struck (well-promised / mixed / hard-won). Surfaced under the Money domain, receipts
  a tap under.
- **The synthesis verdict — your life at a glance (`lifeAtAGlance`).** The domain
  chapter now opens with a scannable verdict row: the constitution, then each life-
  domain's one-word judgement (well-promised / mixed / hard-won), colour-coded, with a
  one-line synthesis naming the ground the chart pays easily and the ground it asks
  effort for — the overview before the detail.
- **Four more topical readings on the same engine — Love, Career, Family** (plus
  Money): each reads across its own cluster of houses, weighed by its karaka —
  **Love** across the 7th (the committed partner) and 5th (romance), by Venus;
  **Career** across the 10th (standing) and 6th (daily work), by the Sun; **Family**
  across the 4th (home, roots, parents) and 3rd (siblings), by the Moon. Each is
  surfaced under its life-domain in the reading, its verdict and receipts a tap under.

## 4.7.0 — 2026-07-23 — the constitution: the four temperaments, the way the school opens
The reading now opens where a traditional astrologer opens — on the **humoral
constitution** (Cours 4), the ground the domains stand on.

- **The four-temperaments engine (`temperament`).** A weighted seven-testimony
  reading of the body's complexion after Greenbaum's method (Ptolemy *Tetrabiblos*
  III.11): the Ascendant sign, its ruler and the true almuten of the rising degree,
  the Sun by the **season** of birth, the Moon by sign and by phase-quarter, and the
  Moon's dispositor — each voting on the two humoral axes (hot|cold, wet|dry). The
  winners name the humour: sanguine, choleric, phlegmatic or melancholic; a close
  balance is read as a well-tempered constitution. Mercury is judged by orientality;
  the seasons invert below the equator. Every vote carries its receipt.
- **Read as the body's complexion, never a personality label (`temperamentProse`).**
  The synthesis now **opens** with "Your constitution" — the humour, its physical
  tendencies (frame, metabolism, where it is tested), and its second note — in the
  tradition's own descriptive register, never a diagnosis or a character read.
- **The medical reading (Cours 6), in the reassurance register (`judgeHealth`).**
  Under *Work & health* the reading now judges the body the way the tradition does —
  never a diagnosis. It weighs the **life-forces** (the Ascendant and its lord, the
  Sun, the Moon) against the **morbid forces** (Saturn, Mars, and the lords of the
  6th, 8th and 12th), finds where a morbid force actually strikes a life-force, and —
  by the **maximum of concordant testimonies** — names the body zone the tradition
  *watches*, in Raphael's own descriptive terms. Fired only where a life-force is
  genuinely afflicted, and always closed with the reminder that these are lifelong
  tendencies the old physicians watched, never a forecast. New corpus tables: the
  sign→body-zone melothesia, the planet→affliction qualities, and the Saturn/Mars/
  Jupiter planet-in-sign disease matrix (paraphrase after Raphael, Medical Astrology).
- **Retrograde seasons now name your triple-passed points.** A retrograde season's
  arc crosses any natal planet inside it **three times** (in, back, forward again) —
  the most emphatic station-trigger. The retrograde-seasons reading now names exactly
  which of *your* natal points fall in each arc, and flags any that is a **live wire**
  the year already has under tension ("a station worth marking").
- **Timing engine, made faithful to the sources.** Two corrections found by checking
  the code against the deep research: (1) **Zodiacal Releasing** now subdivides L2 by
  Valens' true unit-shrink (each sub is its sign's period in *months*, sign by sign)
  instead of a proportional approximation — which makes the **loosing of the bond**
  (the jump to the opposite sign when the 12-sign circuit completes inside a long
  period) emerge correctly, and adds Valens' **times of eminence**: the release
  angular to the Lot of Fortune (the 10th especially) is flagged a *peak*, the cadent
  places a *valley*, surfaced in the year-ahead reading. (2) The **Firdaria** night
  sequence is corrected — the seven planets run first, then the Nodes *last* (as in
  the day order), fixing a mid-sequence node placement that misassigned the
  time-lord across the back half of a night-birth life.
- **Deep-research doctrine notes** (`plans/doctrine-notes-timing-medical.md`):
  the temperament method, the medical reading (hyleg life-forces, the morbid forces,
  the sign→zone / planet→affliction / Raphael planet-in-sign disease tables), and the
  timing engine (directions' three rates, the transit trigger doctrine, firdaria, and
  zodiacal releasing) — public-domain facts in our own words, for the domains ahead.

## 4.6.0 — 2026-07-23 — the reading reads like Sonia: domains, and the whole cast
Two structural moves toward the ateliers' actual method (grounded in the Cours
préparatoires the way Sonia teaches).

- **Domains, not personality.** The Read screen's house chapter now leads with the
  rich four-testimony judgment (`judgeHouse`) instead of the simpler ruler-chain —
  occupant judged by nature and what it rules, the lord's state as the promise, the
  cause-effect house-link ("the partner is met through work"), the karaka checked
  last, a verdict — organized **by life-domain in priority order** (Marriage,
  Career, Money, Health, Family), each under its own header. This is the
  domains-of-a-life reading the school teaches, now the primary house view.
- **The derived-houses fan-out (Cours 5) — one direction, the whole cast's year.**
  A new `castFromDirection` turns the chart to each person of your life as their
  own Ascendant (sibling, father, child, partner, teacher, mother, friend, rival)
  and re-reads the same symbolic direction from their vantage — where the touched
  significator falls in *their* houses and what it rules there, coloured by the
  mover's nature. One motion becomes a distinct dated event for each person, shown
  under your directions: the tradition's way of reading a whole family from a
  single arc, and the engine of countless time-based narratives.

Reverted an earlier modern-psychology experiment that read planets as "you" and
faked counsel (against doctrine-notes §1/§11). Golden pins the judgement, still
green; doctrine, UI audit and voice all pass.

## 4.5.0 — 2026-07-22 — the reading finally says what an astrologer would tell you
The interpretation engine begins: the reading crosses from describing the
mechanism to delivering the delineation — grounded in the tradition, selected by
the chart's own state.

- **`interpret(D)` — the state-selector (T1).** Turns a determination into the
  delineation choices its real condition earns: which half of a planet's
  character (well- vs poorly-placed) speaks, the band's confidence, whether it
  delivers through its dispositor. Everything downstream composes from it.
- **Character, delivered (T2).** Each placement now names its temperament and
  asserts the earned half of its nature, from the tradition's own words:
  "By nature hot and dry, the choleric fire at full. Held this strong, at its
  best — unafraid, decisive, prudent in danger — a hardness that protects what it
  loves." Strong planets show their gifts; weak or peregrine ones show their
  faults.
- **A new 84-entry PLANET-IN-HOUSE database (T5).** The single most-used lookup a
  traditional astrologer carries — each of the seven classical planets in each of
  the twelve houses, a concrete life-read after Lilly's house chapters, Morin and
  al-Biruni, in our own words. Wired into every placement and shaded by state:
  "In your 8th, concretely: gain by marriage, dowry and legacy, with desire drawn
  to the intense and the hidden — pleasure close to loss." A weak planet gets the
  harder edge, with the note that it arrives late, at cost, or through others.

Unlike Astro.com's licensed cookbook, every line is composed from THIS chart's
computed state and carries its receipt. The judgment is unchanged (golden still
pins it); the reading is far more specific. Doctrine, audit, voice all pass.

## 4.4.0 — 2026-07-22 — teach the words where you meet them
The last novice workstream: the tradition's vocabulary is now tappable in place,
wherever it appears in the reading — so a beginner learns the word at the moment
they meet it, without leaving the page.

- **Extended the glossary** to the whole traditional vocabulary the reading
  actually uses: captain, peregrine, triplicity, term/bound, face/decan, almuten,
  dispositor, reception, benefic & malefic, lord of the year, direction, live
  wire, promittor & significator — each a plain two-line definition in the app's
  own voice, with a tap through to the full Learn entry.
- **Wired tappable terms into the two surfaces that render their own text** — the
  placement zoom (the main thing a novice reads) and Today — via one shared
  underline helper. They already worked in the Read flow and Learn; now the whole
  reading teaches in context. Tapping a term (e.g. "its own face", "peregrine",
  "live wire") opens its definition right where you are.
- Reworded the "find your dominant element" how-to and removed the now-dead
  `elementBar` helper (its two callers went with the pop cleanup).

Version 4.4.0 (sw cache v101). Golden, doctrine, UI audit and voice all pass.

## 4.3.0 — 2026-07-22 — the prose, tightened; a first-reading that teaches the method
A pass over how the reading *reads*, plus an opt-in intro that teaches a beginner
to read their own chart.

**Prose — written better (meaning unchanged; golden passes on every change).**
- Fixed a doubled-word bug: luminaries read "Sun is **the the** light of sect".
- Unstacked the Lilly-fortitude sentence (was one run-on choked with dashes and
  a redundant double-label) into two clean sentences.
- Fixed a subject-verb clash in the house-lord lines ("the self and the body
  **runs** through …") and a genuinely garbled directed-event sentence
  ("…worth, **advancing comes to** …").
- The live-wire (trigger) read named its matter phrase twice; now once, and it
  leads the line so it survives Today's 340-char clip (the "so what" no longer
  gets cut, the natal recap does).
- Trimmed the layered dignity images in the deep synthesis so secondary
  dignities show their vivid first clause instead of nesting a third semicolon.

**A first-reading that teaches the method (opt-in).**
- The welcome walk now follows the traditional order on the user's OWN chart:
  the one sky → the captain (Ascendant + its lord) → the two lights → the
  loudest conversation (the tightest personal aspect, judged by nature) → "now
  you read it yourself: tap any planet, the app shows its working."
- It never auto-plays (that was the old freeze). A gentle "✦ See how your chart
  is read · 30s" offer sits on the chart screen for first-timers only, and
  disappears once they take it or tap their first planet.

## 4.2.0 — 2026-07-22 — "Charts like you" removed; elements folded into signs
More pop swept out, at your direction.

- **Removed "Charts like you" entirely.** It matched public figures to you by
  Sun/Moon/Venus *sign* — and the figures' charts are dateless (computed at
  noon, no birth time), so nothing deeper than a sign could ever be right. Rather
  than fake a "same captain / same sect" match on data that can't support it, the
  whole feature is gone: the Learn "Charts like yours" category, the walkthrough's
  "kindred charts" beat, the `famousMatches` engine, the `FAMOUS` gallery, and the
  Wikipedia-portrait fetch (`loadFace`/`drawFace`).
- **Folded the "elements" Learn category into "Signs."** The standalone
  element-first topic — with its percentage bars and a "Silverman would have you
  cultivate" line — is removed. The Signs chapter now opens with the four
  qualities taught the traditional way (fire = hot-and-dry, earth = cold-and-dry,
  air = hot-and-moist, water = cold-and-moist) and each sign already carries its
  own element and mode, with its element's light and shadow.
- **Removed the retro-TV / Internet-Archive "Watch" shelf** and its whole media
  island (`watchShelf`, `watchChannels`, the Bakelite-TV tiles and static, the
  live archive search) — off-brand external media, already unreachable, now gone.
- Swept the fallout: the dead `hideMediaFrame` call and orphaned cache resets.

Golden, doctrine, the 7-screen × 3-width UI audit and the voice-book check all
pass; the chart, Learn and People screens render with zero runtime errors.

## 4.1.0 — 2026-07-22 — the chart fits one frame; the last pop is gone
The novice rework begins with the two changes you asked for directly: the chart
screen no longer scrolls, and the remnants of the old pop-astrology system are
removed from the app.

- **Chart screen fits one frame.** The wheel is the hero, sized to whatever
  height is left after the anchor row, so nothing scrolls. Under it: your Sun,
  Moon and Rising as tappable anchors, one live line for today, and the tap hint.
  Depth is reached by tapping a planet — the placement zoom grows from it and
  tells you about it in and around the circle — not by scrolling down. Verified
  at 320/390/768 and on a short 320×568 viewport, with and without a birth time.
- **Removed the element bar** (element-first "how much fire/earth/air/water you
  are") and the **"word for the day"** theme map (Sun = Visibility, Venus =
  Sweetness…) from the chart screen. In their place, one honest line: the loudest
  real transit on your chart today, tappable into Today.
- **Deleted the dead pop engine.** `combinationRead`, `sunMoonCharacter`,
  `lifeQuirks`, `interests`, `emergingPull`, `spookyReads`, `chartSignature`,
  `cleverReads`, `crossSynthesis`, `detectGrandCross9` and `watchCards`
  (the YouTube-by-Sun-sign shelf) — all uncalled since the judged-engine rebuild —
  are gone, with their exports.
- The below-wheel inline planet reading is removed too: it duplicated the
  placement zoom, which is now the single way to read a placement.

Golden, doctrine, the 7-screen × 3-width UI audit and the voice-book check all
pass; tapping a planet opens the zoom with zero errors.

See `plans/novice-rework.md` for the full six-workstream plan this begins.

## 4.0.2 — 2026-07-22 — the real freeze: a crash in the first-run tour
The persistent "freeze while calculating the chart" was an uncaught crash, not a
slow computation. The first-run welcome-walk (the animated tour that teaches the
app) called `APP.ordinal(...)` on its Ascendant slide, but `ordinal` is not
exposed on `APP` — so it threw every single frame the tour was on screen, right
after you entered your birth data. That is what locked the app up.

- Fixed the crash (`APP.ordinal` -> the in-scope `ordinal`).
- Removed the auto-playing first-run tour entirely, as requested — it no longer
  starts on top of the freshly-computed chart. It can still be replayed from
  Settings.
- Swept every `APP.foo(...)` call against the actual export list to be sure no
  other unexposed-function crash is lurking; none is.

First-run now holds a steady 60fps (18-21ms frames) with zero console errors,
where before it crashed every frame. Golden, doctrine, UI audit and voice all pass.


## 4.0.1 — 2026-07-22 — the rebuild freeze, fixed at the root
Rebuilding a chart could hang for seconds. Profiling found the cause: the default
Read view eagerly computed `oddPredictions` — a ~900ms, fifteen-month ephemeris
scan — on every open, even though only the timing tab uses it. Fixes:

- Stop computing oddPredictions (and the other old pop caches) on the default
  reading; the timing tab still computes it lazily when opened. The default Read
  after a rebuild dropped from ~970ms to ~130ms.
- Memoise the heavy ephemeris aggregators on the chart object for five minutes —
  `composeTransits` (called by every triggerReading — the warm loader, the Read
  flow, Today, the guide), `upcomingTransits` (by argument set) and
  `oddPredictions` — so the many callers share one pass instead of each re-scanning
  the sky. A fresh chart (a rebuild) starts with an empty cache.
- Trimmed the transit scan (3-day sampling, 13-step bisection) so even the timing
  tab is markedly faster.

Golden, doctrine, three-width UI audit and voice-book all still pass.


## 4.0.0 — 2026-07-22 — the whole app speaks the traditional method
A ground-up alignment of every surface to Sonia's London-lineage method and the
two *Cours Préparatoires* ateliers. The 40-phase engine already judged; now the
whole app leads with that judgment, and every judged line is chart-specific and
carries its receipt.

- **Learn** is rebuilt as the traditional curriculum: two states → the twelve
  territories → benefic/malefic by nature → a sign read through its lord → the
  captain → the four dignities → triplicity/terms/decans → the almuten &
  reception → aspects by nature → sect → promise-first/transits-last → your own
  sky judged. Every chapter closes inside your actual chart, judged by the engine.
- **Read** now *is* the judgment: the Ascendant, the captain followed home, the
  house-lords followed home, the soundest and weakest planet by dignity, the
  sharpest aspect judged by nature, the lord of the year, and — last — the
  transits, only where they strike a live wire. The old element-first beats are
  gone; each beat shows its receipt.
- **Today** leads with the lord of the year and the trigger doctrine — transits
  read last, only on a live wire, each judged through its full determination —
  before any practical glance.
- **The walkthrough** (revived as a cinematic film) performs the method act by
  act: the door and its captain, the two lights and the wandering stars each in
  its state, the sharpest aspect by nature, the lord of the year, transits last.
- **The card-by-card guide** now draws its "does this ring true?" cards from the
  judgment — the door, the captain, each planet in its state, aspects by nature,
  the year's lord — each with its receipt.
- **Tarot**: all 78 cards given hand-written, Labyrinthos-aligned upright /
  reversed / love / career meanings (the beloved deck UI and ritual untouched).
- **Engine audit**: every doctrine table cross-checked against the ateliers —
  dignities, domicile rulers, exaltations, Dorothean triplicities by sect,
  Egyptian terms (five non-luminaries only), Chaldean faces, almuten scoring,
  joys, Chaldean co-significators, house significations (father=IV, mother=X),
  the nature model. The engine reproduces both worked almuten examples from
  Atelier 2 exactly. Combustion aligned to the school's 7°30′ throughout.
- New `tests/doctrine.cjs` pins the almuten worked examples and the term/face
  luminary rules. Golden, doctrine, three-width UI audit, voice-book (clean
  across charts) and edge-case robustness (no-time, polar, 1720–2099) all pass.

## 3.52.0 — 2026-07-22 — the chart forms instead of freezing; the glitch is gone
- **The chart no longer freezes on open.** The first view of a fresh chart has
  real one-time work to do — the day's transits, the synthesis, the condition
  scan (each several ephemeris solves) — enough to block the main thread for the
  better part of a second on a phone. Now that work is done behind a **breathing
  constellation** of your own planets ("reading your sky"), spread across a few
  frames, and the wheel expands out of it when it's ready. No frozen screen.
- **Fixed the first-screen glitch (black edge / half-painted open).** Two causes:
  the pixel density was set *after* the canvas was created (so the first ~300ms
  rendered into a mismatched buffer on high-DPI phones), and the black
  colour-block screen-wipe was firing during boot and getting caught mid-sweep.
  Density is now set before the canvas exists, and the wipe is suppressed during
  the opening — real screen-to-screen navigation still wipes.

## 3.51.0 — 2026-07-22 — tap a placement, the chart zooms into it
- **The placement zoom.** Tapping any planet on the chart now zooms the whole
  wheel down into that one circle: the body fills the centre, its sign rides the
  crown, and its judgment is arranged *in and around* the circle — captain,
  house, essential state, what it rules — with the full determination reading and
  receipt beneath. One tap anywhere closes it; drag the text to read on. **The old
  pop-up sheet is gone**, along with its code.
- **The opening is a title card.** No seasons, no runner — a night sky, the
  zodiac gathering into a ring, "Aqau Pluto · Astrology", one tap to begin.
- **Fixed the chart-screen freeze.** `chartConditions()` (out-of-bounds and
  station detection) ran ~8 full ephemeris solves and was called by
  `determination()` on every frame the reading preview drew — the on-device
  freeze. It is now cached on the chart and cleared only when the chart changes.

## 3.50.1 — 2026-07-22 — a four-second opening, and a smoother chart
- **The opening is now four seconds.** The run through the four seasons of sky
  is compressed to a fast time-lapse — one second a season — so the *Aqau Pluto*
  title lands at about four seconds instead of twenty-five. Snappy, then straight
  into the app.
- **The run reads like running.** Reworked the run-cycle: a longer reach and
  harder drive off the back foot, a higher knee through the recovery, a real
  float between strides, more forward pitch in the torso and a bigger arm swing.
- **Fixed the chart-card freeze.** Opening a placement's judged reading recomputed
  the whole determination (dignities, receptions, aspects, directions) *every
  frame* — heavy enough to stutter on a phone. It's now computed once per planet
  and cached, invalidated only when the chart itself changes. The card is
  identical; it just no longer re-derives itself sixty times a second.

## 3.50.0 — 2026-07-22 — immersion pass: the chart shows its own thinking
Four cinematic touches, each carrying a piece of the new engine rather than
decorating it:

- **Live-wire glow.** The chart wheel now breathes along its active directions —
  the significator→promittor lines the timing engine is judging *right now* pulse
  in their planets' own colours, so you can see which parts of the sky are lit
  this year before you read a word.
- **Sect ambient light.** The whole app takes a warm sun-side wash for a day
  chart and a cool moon-side wash for a night chart, so the light of sect — the
  first thing a traditional astrologer settles — is felt, not just stated.
- **Tap a placement, read its judgment.** Touching any planet on the wheel now
  springs a card carrying its full determination reading — captain flag, court,
  zodiacal state, rulerships, the Lilly verdict, its sect role — with the receipt
  and citation, in a taller sheet sized for the richer content.
- Regression floor held green throughout: golden-chart harness ALL PASS, the
  three-width UI sweep and text-integrity scan clean.

## 3.49.0 — 2026-07-22 — the traditional rework, all forty phases
The full engine rework from `plans/forty-phases.md`, distilled from Sonia's
London-lineage method and the pre-modern authors (Ptolemy, Dorotheus, Firmicus,
Mashallah, Abu Ma'shar, al-Biruni, Ibn Ezra, Bonatti, Morin, Lilly), is
complete. The reading now **judges** rather than describes, from the ground up.

- **The determination model (Morin, Book 21)** underlies everything: each
  planet judged by its house, the houses it rules, its zodiacal state (five
  dignity layers, each with its own character and Lilly point-score) held
  *separately* from its terrestrial state (house, angularity), its nature (the
  full benefic/malefic nuances — the Moon's light rule, Mercury convertible,
  the Sun's 7°30′ burn, the Nodes), its receptions and aspects, and **analogy**
  as the selection function (joys, Chaldean order, karakas) that decides which
  signification a line voices.
- **The natal reading** opens at the Ascendant and follows the house-lords
  home: the constitution, the captain (lord of the Ascendant) as the keystone,
  the rulership web with the almuten of every cusp, all twelve houses judged by
  the school's twelve-step method, aspects judged pipe-and-liquid, reception
  through all five dignities, Bonatti's judgment hierarchy (contradictions
  named, never averaged), and a synthesis braided into one argument with the
  final word.
- **Prediction as doctrine, directions first**: significator/promittor
  directions (Morin XXII) that reach a real interpretive register, read by
  significator (Ascendant, MC, Sun, Moon), through the Egyptian bounds
  (term-lord time-lords), and by profection (the lord of the year deciding
  which directions speak loudest). Returns judged the Persian way; eclipses as
  tight-orb timers. **Transits demoted to triggers** — they speak only where
  they strike a live wire, and a quiet day is admitted honestly.
- **The deeper tradition**: the Lots by sect, fixed stars in condition
  register, antiscia and declination as hidden partnerships, patterns as
  weighted testimony, and the Vedic honesty wall (the zodiac is a choice;
  Jyotisha is a separate system, never blended).
- **Every surface rewired** to the judged engine — Read, Patterns, Seasons,
  Today, and People (synastry by the overlay method, the two captains' reception
  as the bond's spine). The old "Sun = your personality" pop-equations are gone.
- **Proof**: a voice book enforced by `voiceCheck` (the ~42k chars of judged
  output pass clean), a machine-readable source registry (15 authorities), and
  a golden-chart harness (`tests/golden.cjs`) that pins the judged *meaning* of
  five reference nativities so interpretation can never drift silently. Engine
  ALL 12 PASS; all screens clean at three widths.
- Tarot untouched (beloved) beyond the five spreads added earlier.

## 3.48.0 — 2026-07-12
- **The engine turns traditional — phase 1 of the Sonia rework.** A trained astrologer starts a chart at the Ascendant, follows its ruler home, walks the twelve houses by their rulers, judges every planet's state, and predicts by symbolic direction — so now the app does. The reading opens with **where a reading starts** (the Ascendant — the body and the doorway, not "your personality") and **the captain of your chart** (the Ascendant's traditional ruler: its house, sign, dignity, and its closest aspect judged by the *nature* of the planets — a trine between the two malefics is named for what it is). Two new chapters: **The twelve houses** (every cusp's traditional ruler — modern co-rulers named second — followed to where it stands, with the house-to-house link spelled out) and **The state of your planets** (dignity three layers deep: sign, decan/face, and the **Egyptian terms**). Seasons now leads with **Your directions** — every point advanced 1°/year against the natal chart, exact ages and years, geometry verified — and the day-to-day sky is explicitly demoted below, checked last, the traditional way. The welcome walk sheds the "Sun is the engine of you" framing for the traditional door. And the tarot room grows: **five new spreads** (Relationship Mirror, The Crossroads, Mind Body Spirit, The Week Ahead, Shadow Work — 11 total). Phases 2–4 (full corpus language sweep, sect, receptions, UI overlap audit) are laid out in plans/engine-rework.md.


## 3.47.0 — 2026-07-12
- **The 17-slide "Your Chart" deck is gone, and the sky is clean.** Two things asked for plainly, now actually done. The slide deck that hijacked the first minutes after building a chart ("YOUR CHART · 1/17") no longer auto-plays and its Settings launcher is removed — the Read storytelling carries all of it, one calm beat at a time. And the Welcome Walk sky lost its diagram clutter: the orange highlight ring and the curved wire connecting bodies are replaced by a soft warm glow at the natal point (and no marker at all when it would just duplicate the planet already on stage). The five cinematic act backdrops now live where they belong — painted faint behind each **planet's story** (tap a planet on the wheel), a screen people actually visit.


## 3.46.0 — 2026-07-12
- **The cinematic pass.** Four things, all aimed at the storytelling. (1) **The Ancient Sky art was regenerated clean** — the diagram clutter (beams, connecting lines, rings around stars) is gone; just the pyramids, the ziggurat, the watchtower and the Moon under quiet ink skies. (2) **The walkthrough acts get cinematic backdrops**: the Sun's golden plain, the Moon's tide flat, Mars's ember dusk, Saturn's stone cliffs, Venus's dusk garden — painted full-bleed behind each act at low opacity, under the act's own light wash, so the staged performance plays in a world instead of on a blank stage (bundled assets, absent-safe). (3) **The actor is alive now**: visible two-layer breathing, real weight pooling hip to hip, idle arm sway, and a slow occasional head-glance — all additive micro-motion that never disturbs a scripted pose, all still under reduced-motion. (4) **Sign names finally fit the wheel**: a name that can't sit readably inside its 27° arc falls back to the classic three-letter form (SAG, not a crammed SAGITTARIUS). And the **raw data tables came off Home** (placements / aspects / balance / points) — the wheel, the chip reel and the planet stories carry the same facts, told properly.


## 3.45.0 — 2026-07-12
- **The Ancient Sky, illustrated.** Each civilisation in the app's signature feature now carries a commissioned illustrated header in the house style (warm cream paper, ink linework, one burnt-orange accent): Giza under a rising Sirius for the Egyptian beats, a ziggurat under a clay star-chart for Babylon, a watchtower under the Four Royal Stars for Persia, and the Moon's arc through the 27 mansions for the Vedic beat. The art is a bundled local asset like the tarot deck — fetched once at build time (`node get-art.js`), precached, never loaded from the network by the app — so the offline / zero-request promise holds. The images are AI-generated (Higgsfield, Nano Banana Pro) and are **assets only**: every word of every reading remains deterministic (see `art/README.md`). The reading flow centres each Ancient Sky beat around its illustration when present and falls back to pure text, pixel-identical to before, when absent.


## 3.44.0 — 2026-07-11
- **YOUR WEEK — the week ahead, woven hit by hit.** The CHANI slot in the big-three lineup, done the Aqau way. Seasons now carries a flowing paragraph for the next seven days: every clause hangs on a real exact contact — "Tuesday, Venus perfects its square to your natal Mercury — rubbing against it, the friction that forces change" — found by a dedicated forward scan (the in-orb transit list can't see a fast planet that is still five degrees away today but exact on Friday; the week now gets its own per-body sweep, every hit bisected to the minute). The paragraph closes with the week's honest tilt (more doors than walls, more walls than doors, or even), and a tap reveals the receipts: day, contact, exact time. Quiet weeks are told straight — "the sky handing you the pen" — never padded. Runs in ~30 ms and stays word-stable for the whole ISO week.


## 3.43.0 — 2026-07-10
- **YOUR CYCLES — the long transits as named chapters, The-Pattern-style but honest.** Seasons now opens with the chapters you are actually inside: every slow planet (Jupiter → Pluto) currently working a natal point gets a card with a **name** ("The Load-Bearing Test", "The Open Door", "The Excavation"…), its **date range**, a **progress bar** with today's marker and a tick at every exact pass (including the retrograde double-backs), and — on tap — the chapter woven by the loom: since-when, your natal planet at its exact arcminute, sign, house, your own tell, each exact date, until-when, and one piece of advice, plus the receipt. Cycle names and words are seeded **without** the calendar day, so a chapter keeps its identity for its whole run — only the marker moves. The scan itself is honest math: each slow planet's real path is sampled around now (single-body series, stepped to each planet's own speed), the ≤3° window found, and every exact hit refined by bisection to the day.


## 3.42.0 — 2026-07-10
- **THE WEAVE — the start of the app's own language engine, and a glanceable Today.** Two things, one idea: the day should read in three seconds *and* be provable in one tap. The Today sheet now opens with **At a glance** — one **DO**, one **EASY ON**, one **WATCH** — each line cut from the strongest real transit of the day (tailwind, grind, and the most time-boxed thing: eclipse > void Moon > personal retrograde > Moon contact > next exact pass). Tap any line and it shows its working: a paragraph built by **the weave**, a deterministic language loom (no AI) that assembles each sentence from banks × math — the mechanism of the transiting planet, your natal planet **at its exact arcminute**, its sign and house, whether it runs your whole chart, one of *your own* behavioural tells quoted back to you, the orb read as timing (closing/separating, peak/echo), and one concrete piece of advice — every choice seeded by your chart's fingerprint down to the arcminute plus the calendar day. Same chart, same day: the same words, always. A twin born four minutes later: a different degree printed in the line and a different sentence around it.


## 3.41.0 — 2026-07-10
- **A proper maskable app icon.** The install icon was reusing the full-bleed artwork for Android's *maskable* slot, so its outer chart-ring sat right at the edge and got clipped when the OS masks the icon to a circle or squircle. Added a dedicated `icon-maskable-512.png` with the moon-and-ring artwork inset into the maskable safe zone (inner ~78%) on the app's own background, so it reads cleanly under every icon shape. Precached with the shell.

## 3.40.0 — 2026-07-10
- **Polar births now get a correct chart.** Placidus (the default house system) is mathematically undefined above the polar circle — the semi-arc has no solution, so the house cusps silently collapse onto the angles. Anyone born in Tromsø, Reykjavík, Murmansk, Anchorage, Svalbard (or the far south) was getting a quietly broken wheel with houses stacked on top of each other. Now, when Placidus degenerates, the chart falls back to **Porphyry** (same real Ascendant and Midheaven, valid at any latitude); at truly extreme latitudes where even Porphyry folds, it drops to **Equal** houses. A note in Settings explains the switch. Verified across 78°N, 69°N and 82°S: every case now returns twelve clean houses that wrap the zodiac exactly once. Normal-latitude charts are byte-for-byte unchanged (engine regression still reads ALL 12 PASS).

## 3.39.0 — 2026-07-09
- **The type is now bundled — the app makes zero network requests on startup.** The brand fonts (Fraunces and Space Grotesk) were being fetched from a CDN (jsdelivr) on every load, which meant a request left the device, the first paint waited on the network, and offline the app quietly fell back to system fonts and looked wrong. They are now inlined directly in the page as data URIs, so the real type renders on the very first frame, fully offline, with no request at all. The opt-in **OpenDyslexic** accessibility font is bundled locally too (and precached), so dyslexia-friendly mode also works offline. Verified in a headless browser: a cold load now issues **no external requests whatsoever**. All three fonts are SIL Open Font License (see `fonts/CREDITS.txt`).

## 3.38.0 — 2026-07-09
- **Dead-code audit: ~60 KB of an old, unreachable UI removed.** The app had quietly carried a whole second user interface — the original DOM/HTML version (its own onboarding, chart, reading, tarot, today, settings and about screens, plus the generative-field background loader) — from before it was rebuilt on the p5 canvas. Its entry point (`boot()`) hadn't been called in a long time and nothing live reached any of it. A scope-aware reachability pass (comments and strings stripped, export aliases and the two `recompute`/`toggleRow` name-collisions resolved by scope) identified 67 provably-dead functions, which have been deleted along with their now-unused export entries. Nothing users touch changed: the engine regression still reads **ALL 12 PASS — positions locked to baseline**, and every screen (chart, read, today, learn, tarot, people, settings) renders with zero errors. Just a smaller, clearer single file.

## 3.37.0 — 2026-07-09
- **The tarot deck now ships inside the app — the art works offline.** The full public-domain **Rider–Waite–Smith** deck (Pamela Colman Smith, 1909) is bundled as 78 small images in `tarot/` and precached by the service worker, so every card's art appears instantly and with no network at all. The beloved multi-deck flicker stays exactly as it was: when you're online the card *also* gathers other public-domain versions from Wikimedia Commons and cycles through them — but now there's always the real card sitting there first, even on a plane. (Images recompressed to ~3.6 MB total for the whole deck.)

## 3.36.0 — 2026-07-09
- **The streamline: the dead Watch guide retired, everything you use kept.** A feature audit that trims only what nothing reaches. The old **Watch channel guide** — a retro-TV shelf that was already orphaned (no menu, no search, unreachable) — is fully retired, and with it the service worker's one cross-origin exception (it cached archive.org / jsdelivr thumbnails). The SW now only ever touches the app's own files. The chart, the reading, Learn, People and **Tarot** are all untouched — Tarot's card-art flicker stays, exactly as it was. Your birth data is still computed entirely on-device and never leaves your phone.

## 3.35.0 — 2026-07-08
- **The alignment audit: the app now says why it exists.** Measured against Co-Star, CHANI and The Pattern, the reading, timing, people and calm UX already match or beat them — the gap was that the one thing they can't say was going unsaid. So the More screen now states it plainly under "Why this one": free forever with no premium wall, everything computed on your device so nothing ever leaves your phone, and every line shows its working — the real transit, the exact degree, the source — not vibes behind a paywall. And the daily nudge (the notification the big three lead with) is no longer buried: a "Turn on a daily nudge" button surfaces it right there.

## 3.34.0 — 2026-07-08
- **The Four Royal Stars of Persia, and the nakshatra pada.** The Ancient Sky gains a fourth civilisation and sharper Vedic detail. Persia: three thousand years ago four bright stars — Aldebaran, Regulus, Antares, Fomalhaut — marked the solstices and equinoxes and were set as the "Watchers" of the four corners of heaven; if one falls on a planet or angle of yours, the reading names it ("your Sun falls on Regulus, the Watcher of the North"). And the Vedic Moon-mansion now gives its pada — which of the nakshatra's four quarters your Moon occupies — the finer grain a Jyotishi actually reads. Egypt, Babylon, Persia and India, all on the one chart.

## 3.33.0 — 2026-07-08
- **The Ancient Sky now spans three civilizations.** Extended back past Egypt to the other two roots of astrology, all computed on your exact chart. **Babylon:** your Sun written in base sixty the way a scribe would have set it on a clay tablet — "14° 9′ of Cancer" — with the note that their base-sixty counting is the reason a degree still holds sixty minutes and the whole chart runs on their math. **Vedic:** your Moon's nakshatra, one of the 27 lunar mansions India has read for three thousand years and the seed of the Vimshottari periods — the single most personal point in Jyotisha — surfaced right in the main reading instead of hidden in a sidereal setting. Egypt, Babylon and India, drawn together onto the one chart.

## 3.32.0 — 2026-07-08
- **The Ancient Sky — the pyramid-builders' astronomy, computed on your exact chart.** A genuinely new layer no consumer astrology app has. Egyptian astronomy is the taproot of ours, and this draws the links most readings never do: whether a planet or angle of yours sits on one of the three pyramid stars — **Thuban** (the pole star the Great Pyramid's shaft was aimed at in 2700 BCE), **Orion's Belt** (mirrored on the ground by the three at Giza), or **Sirius/Sopdet** (whose dawn rising opened the Egyptian year and flooded the Nile); your **herald star**, the bright star that rose in the dawn just ahead of your Sun the Egyptian way; **where your Sun truly stands** against the real constellations versus the seasonal zodiac (the ~24° of precession most readings quietly drop); and **your decan**, one of the 36 Egyptian star-clocks, the first clock humankind built. It appears in the reading flow and as its own chapter — and on a chart with the Sun at 14° Cancer it correctly reads "your Sun sits within 0.1° of Sirius."

## 3.31.0 — 2026-07-08
- **The whole reading is rebuilt to arrive one line at a time.** The complaint was right: there was way too much at the beginning. So the Read tab no longer opens as a page of stacked sections — it opens as a single, calm, spacious line, with room to breathe and "tap to continue" at the bottom. Each tap brings the next: the spooky-specific hook, then who you are, then what's live for you right now, then another oddly-specific thing, then the sharpest fact about you, then what you're drawn to. Progress dots track where you are. A quiet "≡ All" jumps to the full chapter menu whenever you want everything at once, and "back to the reading" returns. No wall, ever — just one thing at a time.

## 3.30.0 — 2026-07-08
- **The reading no longer narrates itself.** Cut the app-talk: the You tab opened with "Alright, let me read you properly, not your star sign, you" — the reading announcing the act of reading. Gone. It now drops straight in: the spooky hook, then who you are, then what's live for you now. The meta bridge and the "read me properly" button label went too (the button just says "Walk through your chart, one piece at a time"), and the Seasons/Today/Patterns intros lost their defensive framing ("not vague vibes", "what a real astrologer reads"). It just reads you now, instead of talking about reading you.

## 3.29.0 — 2026-07-08
- **The whole Read screen now speaks in one voice (rework pillar 2).** The other three tabs got the same treatment as the You tab, so moving between them feels like one reader, not four different apps. Patterns opens "The shapes in you — the structures a real astrologer reads before anything else"; Seasons opens "Your seasons — here's what the sky has actually been doing to your life lately, and what's coming; not vague vibes, real transits with real dates"; Today opens "Today, for you — here's the sky today and what it actually touches in your chart." Warm, punchy, bigger text, leading with the specific — consistent across all four tabs.

## 3.28.0 — 2026-07-08
- **The Read tab opens as a reading now, not a menu.** First pillar of a full quality pass: instead of landing on a headline and a list, the You tab now greets you like a real reader — "Alright, let me read you properly. Not your star sign. You." — then delivers, in big warm text, the spooky-specific hook (one chart-exact "how did it know" line, marked with an accent bar), who you are in a line, and what is genuinely live for you right now (a dated transit: "Saturn sitting on the ruler of your 7th, in passes on 23 Jun, 29 Aug, 7 Mar"). Then a warm bridge hands you the rest — how you love, what you're chasing, what the sky is doing this year — one chapter at a time, on tap. The wheel, the dashboard and all the depth are untouched; this makes the front door of the reading actually feel like a reading.

## 3.27.0 — 2026-07-08
- **Bigger text, and it leads with the spooky part.** Two fixes to how the reading actually reads. First, the body text is meaningfully larger everywhere — the readings were too small to sink into. Second, the You tab no longer opens with a sign-level generality: right under the one-line headline it now leads with a single chart-exact "how did it know that" line — "you have a specific spot on the sofa, a blanket you are territorial about, and a snack that fixes most bad moods" — the way a real reader hooks you with the specific before the general, with the rest one tap below. The combination read was also tightened: less throat-clearing, more to the point.

## 3.26.0 — 2026-07-08
- **The You tab, rebuilt so it stops overwhelming you.** It had become one fifteen-screen wall of seven near-identical sections, all bold bulleted paragraphs, all saying "who you are" in slightly different words — no hierarchy, no starting point, exhausting. Now the whole tab fits on one screen: a single clear headline of who you are, the guided-reading button, and then a calm, scannable menu of chapters — How you're wired · Oddly specific · What you're drawn to · Read closely · What's most specifically you · What carries the most weight · Your chart in four movements · The deep read — each collapsed, with a count, opening only when you tap it. Same depth underneath; you're now in control of how much of it you see at once, instead of being buried.

## 3.25.0 — 2026-07-08
- **Now it reads your exact chart, not your sign — and there's a wall of it.** The "oddly specific" section jumped from eight tells to twelve, and the new ones are keyed to your actual geometry, not just your sign. It now reads **where** your drive and your love live — the house, not the sign — so a Mars in the 12th is "your anger goes underground, you work best behind the scenes, and you do not always know what you are angry about," and a Venus in the 11th is "love often begins as friendship for you." And it reads the **two tightest hard aspects your chart actually holds** as concrete behaviour: Moon square Saturn becomes "you say 'I am fine' as a complete sentence, you downplay it when you are struggling, and you learned young not to be a burden"; Venus–Pluto becomes "you do not do casual, you have googled an ex at 2am, and love rearranges you or it is not love." Twenty-four aspect tells and twenty-four house tells, firing only on what you personally carry — this is the layer that makes it feel like it knows you had eggs for breakfast.

## 3.24.0 — 2026-07-08
- **More eggs-for-breakfast specificity.** The "oddly specific" tells — the section that reads your actual daily life, not your archetype — grew from five to eight, and now covers your Sun (how you move through a day: "you have pressed the crosswalk button more than once, you start the thing before you have finished planning it, and 'I will just do it myself' is basically your catchphrase"), your Jupiter (where you overdo it: "you go big on birthdays, you round the generosity up, and none of your gestures are ever small"), and your Saturn (the weight you carry: "you have felt responsible since you were small, you quietly equate rest with laziness, and some part of you is sure it is all on you"). Thirty-six new concrete tells, each keyed to your real placements — the closer-to-the-bone register, more of it.

## 3.23.0 — 2026-07-08
- **A warmer voice — wave one.** The readings are being rewritten to speak with more care: CHANI-style warmth, but keeping every specific placement and the honesty intact (never a horoscope-paper). This first wave warms the surfaces you meet first — the guided reading now walks with you "gently, at your own pace"; the life walkthrough speaks tenderly and closes each hard chapter with "however it arrived, you carried it, and you are still here"; the Saturn return is "the real beginning of a life that is actually yours… that weight was never a punishment; it was the making of you"; the timed predictions open softer ("Lately, you've…" / "Soon, you're likely…"); and the combination read leads with "At your core, you are… and underneath that, you need…". The exact astrology underneath every line is unchanged. More waves to follow across the whole app.

## 3.22.0 — 2026-07-08
- **The sky, stripped clean.** Still too busy, so this goes all the way to storybook calm. The drifting clouds are gone; the walk sky now carries no constellations at all (they remain only in the teaching sky, where they are the lesson); and the crowd of planets is reduced to just the two brightest wanderers, Venus and Jupiter, dimmed to soft distant lights that sit back in the deep. What is left is a clean gradient warming to a luminous horizon, a scatter of gentle stars, a few drifting motes of light, and the walker under a single soft beam. Quiet, and magic.

## 3.21.0 — 2026-07-08
- **The sky, pulled back to storybook simplicity.** The reworked sky was too busy; this is the Ghibli pass. Gone are the dense parallax starfield, the Milky Way band and the sharp diffraction spikes. What is left is quiet and magical: one deep, soft gradient warming to a luminous horizon, a scatter of large gentle stars, a few slow motes of light drifting through the air, and — above the walker — only the one constellation that matters right now, its figure glowing while every other sign settles to a single soft star. The planets are soft glowing orbs in their own hues, the brightest storybook few, held steady and dreamlike.

## 3.20.0 — 2026-07-08
- **The sky is reworked: realistic, ethereal, alive.** The whole scene the runner walks beneath — used in the daily walk, the life walk, the lessons and the news reels — was rebuilt. The sky is now an atmospheric gradient that deepens to a cool crown and warms to a luminous horizon, with a soft airglow where the ground meets the air, a faint Milky Way spilled across the high sky, and a layered, parallax starfield in real star-colours (warm-white, gold, faint blue) where only the stars twinkle.
- **The planets in the sky, completely reworked.** Each background planet is no longer a flat dot but a genuine luminous body: a soft atmospheric bloom in its own hue, a real lit limb falling to a terminator shadow, Saturn's fine hue-matched ring, the Moon's shaded edge, and an ethereal four-point diffraction glint on the brightest — the Sun, Venus and Jupiter. And, true to life, the planets hold steady and breathe while the stars twinkle.
- **The life walkthrough now reads at an astrologer's level.** Every chapter already carried your age, the year, and the transited point's real sign and house; it now adds the astrologer's clause: the concrete life-domain (your identity, your emotional life, your career, your body — and the specific part of life the house governs for you) and the kind of event that exact mover classically brings there. "Saturn conjunct your Sun in the 9th… the part of life around travel, study and meaning got heavier and more serious — a commitment got binding, or something you had outgrown finally ended." Weather, not fate — but named the way a reader across the table would name it.

## 3.19.0 — 2026-07-08
- **The guided reading: a co-authored walk through your real chart.** A new way in, at the top of the You tab. Instead of one long scroll, the app shows you genuine, ephemeris-derived observations one card at a time — who you are, how you land, how you love, what drives you, how your mind runs, the tightest wires in your chart, and what the moving sky is doing right now. You tap the ones that ring true; each affirmation unfurls the actual astrology underneath it (the aspect between your lights, the house your Venus falls in, the reception behind a square). It is cold-reading's fork structure turned honest: nothing is fished for, you are never asked to feed it anything, and the closing portrait reflects back only the threads you yourself recognised — "you recognised yourself in 6 of 9; the threads you trusted were who you are, how you love and what drives you." You steer; the astrology stays real.

## 3.18.0 — 2026-07-08
- **All 144 Sun–Moon pairings, written by hand.** The biggest single expansion of the reading. Every astrology book has a Sun-sign/Moon-sign chapter, and now so does this: one crafted character for each of the 144 combinations, your public self over your private need and the exact life that falls out of the mix. Not composed from parts, written: a Leo Sun with a Scorpio Moon is "a bright surface over a deep, intense core: magnetic and proud in public, private and all-or-nothing when the doors are closed"; an Aries Sun with a Cancer Moon is "a bold front over a tender, defensive heart: you come on strong but bruise easily, and you fight hardest for the people you quietly love." It leads the You tab under "Your Sun and Moon," above the computed combination read, so the classic pairing comes first and the full Sun/Moon/Mars/Venus/Mercury/rising synthesis follows.

## 3.17.0 — 2026-07-08
- **The Sun–Moon read is now aspect-accurate: all 144 pairings read differently.** The combination synthesiser used to blend your Sun and Moon by element alone, so two very different charts could sound alike. It now reads the actual angle between your two lights — the real technique — and says the specific thing: conjunct ("no daylight between who you are and what you feel"), square ("you are your own opposition, and that friction is your engine"), opposite ("a full see-saw self, drawn to people who carry your missing end"), trine, sextile, semisextile or inconjunct. That single change makes an Aries-Sun/Cancer-Moon (square) read nothing like an Aries-Sun/Leo-Moon (trine), the way a real astrologer would tell them apart.
- **The gifts you were born with: soft-aspect backstories.** The library already read your hard aspects as the hard-won lessons ("a father was hard on you," "comfort had to be earned"). It now also reads your trines and sextiles as the natural talents that came easy — thirty-five of them, one per planetary pair: Mercury–Venus, "you speak beautifully, so you smooth situations and make ideas sound as good as they are"; Mars–Saturn, "your drive has discipline behind it, so you outlast people with more raw talent." They fire only on the aspects your chart actually holds, so the praise is earned by the geometry, never generic.

## 3.16.0 — 2026-07-08
- **Your exact combination now reads how you love and how you think.** The combination synthesiser was the most specific thing in the app; it now also weaves in your Venus and your Mercury. It names your love-style in plain words ("you love all-or-nothing, wanting total merging, and fiercely private about what you keep") and reads it against what you actually need — when your Venus and Moon share an element, "your heart and your comfort rarely pull against each other"; when they do not, "you are sometimes drawn to people who do not, in the end, settle you." It does the same for your mind against your identity: a Mercury in the same sign as your Sun means "you think in the same voice you live in, with no translation layer," while a mismatch reads as "a person still deciding what they mean." Every Sun/Moon/Mars/Venus/Mercury/rising mix now gets its own live paragraph.
- **The timing funnel counts the sky as a fourth clock.** "Where the clocks agree" already flagged when independent time-lord systems point at one planet. It now treats a real transit striking that planet — the moving sky itself — as a fourth, fully independent spine, so the strongest years light up as genuine four-way agreement rather than three plus a footnote. The finer clocks (this month's profection, the Zodiacal Releasing sub-chapter, the Firdaria sub-period) now reinforce the citation when they land on the same planet too, honestly labelled as correlated rather than padded into the count. Independent methods agreeing is the strongest signal timing astrology has; the funnel now shows all of it.

## 3.15.0 — 2026-07-06
- **Your exact combination, synthesised.** The single biggest step in specificity: the reading now composes a bespoke paragraph on how your core placements interact, the thing an astrologer does when you say "a Gemini Moon with a Leo Mars and a Sagittarius Sun, what does that mean." It is not a lookup of 1,728 stored combos; it reasons live from element, modality and planetary role. It names each placement's essence, reads the chemistry between your core and your needs, works out whether your drive backs your Sun, serves your Moon or plays wildcard, and, cleverest of all, finds the one placement that breaks the pattern ("two of you run mutable, but your Leo Mars is fixed: the anchor that holds it, the one part of you that behaves differently, and often the most important to understand"). All-one-element and one-of-each-mode charts get their own read. It leads the You tab under "Your exact combination," and because it is computed, it works for every possible Sun, Moon, Mars and rising mix there is.

## 3.14.0 — 2026-07-06
- **The clever layer: whole-chart configurations.** The reading now does the thing that separates a real astrologer from a beginner. It reads the shapes made across your whole chart: a grand trine, and what its element makes effortless (and lets you coast on); a T-square, and the apex planet the pressure dumps onto (your hardest-working, most-tested, highest-achieving point); a yod's finger of fate; a grand cross by modality. It names your chart ruler in full, the traditional keystone, with its sign, house and dignity ("your chart ruler is the Sun… in Aries in your 9th house, exalted… the captain of your life steers toward meaning and the far world"). It finds the busiest planet in your chart (the switchboard everything routes through) and any unaspected one (the wild, unintegrated brilliance). And it weighs the hemispheres, whether your life is lived outward or inward, by your own initiative or through other people. The library and its computed layer now surface upward of thirty-five reads on a full chart.

## 3.13.0 — 2026-07-06
- **Seventy-five more, the library reaches 385.** The reading now also knows: the exact decan of your Sun (each sign split in three, so "the purest Aries" reads differently from "Aries with a Sagittarian reach"); the Moon phase you were born under (New-Moon self-starter through Balsamic old soul); whether your chart is dominant or starved in an element ("your chart is fire-dominant… you burn out if you never rest"; "you run low on water… the language of the heart is learned deliberately"); its ruling modality; and the single strongest placements of all, a planet sitting right on your Ascendant ("born with Saturn rising: serious, reserved, warmth is something people earn") or your Midheaven ("your Moon on the Midheaven: your career is public, and people feel they know you"). A full chart now reads around thirty-four of its own placement insights.

## 3.12.0 — 2026-07-06
- **The spookiest layer: aspect backstories.** The reading now says the thing an astrologer says that makes the room go quiet. Thirty-four hard-aspect backstories fire only when your chart actually holds that aspect: "a father or authority figure was hard, absent or heavy; you grew up fast and still carry a quiet fear of not being enough" (Sun-Saturn); "you learned early that comfort had to be earned; a parent was distant or overworked" (Moon-Saturn); "you doubted your own intelligence young; a teacher or a critic marked you" (Mercury-Saturn). Every hard contact between two planets carries its own story.
- **Retrograde life-patterns.** A planet retrograde at your birth now reads its inward signature: "Saturn was retrograde when you were born, so you had to become your own strict, fair father." Eight of them, one per planet.
- **The Sun-and-Moon blend, and your chart's captain.** The classic who-you-are-versus-what-you-need read ("a spark with ballast: you want to leap but you need solid ground") across all sixteen element pairings, plus the house your chart ruler sits in ("the ruler of your chart sits in your 9th: you are here to expand, and staying small suffocates you"). The library is now 310 lines; a full chart reads around thirty of its own.

## 3.11.0 — 2026-07-06
- **The placement library doubles: 240 lines, and every chart now reads twenty of its own.** Batch two adds the Sun by sign (life purpose), Mercury by house, Jupiter and Saturn by sign (how you grow, what you fear), both lunar Nodes by sign and house (where the soul is headed), and Pluto, Uranus and Neptune by house (where you transform, rebel and dream). A full chart now pulls around twenty of these read straight onto its exact placements, still rotating so the reading keeps opening new doors. Halfway to the five hundred, and the structure holds the rest.

## 3.10.0 — 2026-07-06
- **A placement library, read onto your chart.** A new corpus of 132 oddly-specific "a rising Gemini often means…" insights, covering the rising sign, the Moon, Venus, Mars and Mercury by sign, and the Moon, Venus, Mars, Sun, Saturn and Jupiter by house. Every chart pulls its own set (eleven for a full chart) under "Read closely, your placements say," and they rotate day to day so the reading keeps giving. This is installment one toward the full five hundred.
- **The oddly-specific lines now combine, so no two charts read alike.** Each life-detail is shaded by the driving planet's tightest aspect (or its retrograde): the same Venus in Gemini reads "you always over-order" on a chart where Venus meets Jupiter, and something else entirely where Venus meets Saturn or Pluto. Sign times aspect times five bodies makes the output effectively unique per chart, not a shared template.

## 3.9.0 — 2026-07-06
- **Oddly specific, about your actual life.** The You tab now opens on the "how did it know" layer instead of a definition. Concrete life-details drawn from your real placements: at the table ("you get menu envy and text someone about what to get"), at home ("a specific spot on the sofa, a blanket you are territorial about"), your pace and temper, how your mind runs, and how you land on first meeting. Sixty written variants, sign by sign per body.
- **What you are drawn to.** A new engine scores your placements for what you actually love doing and says it plainly: "you play an instrument, or you badly want to — music reaches you deeper than it reaches most"; "long walks are how you actually think"; "you have an eye — photography, film or drawing keeps pulling at you". Then it reads the live sky for the current pull: "lately, something has been pulling you toward making things beautiful — that is transiting Uranus waking up your Venus." The guitar-and-long-walks layer a real astrologer reaches for.
- **No more app-talk.** The reading stops narrating the software. The opening no longer says "this app computes it on your phone"; it names your real birth minute and place and turns straight to you. The daily masthead and the closing lesson line lose their self-reference too. The reading is about you, not about itself.

## 3.8.0 — 2026-07-06
- **The opening names your exact moment.** The welcome walk no longer begins on a flat "This is your sky." Page one now reads back the real minute and place you were born — "On 16 April 1991 over Berlin, every planet stood at one exact degree of a single great wheel, this precise shape, and it has never formed again" — so it feels like yours from the first line.
- **The sky above the runner clears.** The loose background stars thin out, dim down, and keep to the upper air, so the real constellations read as the figures they are instead of getting lost in a scatter of dots.
- **The run comes alive.** The running figure gains a genuine float at the top of each stride, a torso that breathes forward into the effort instead of a locked lean, and arms that drive higher and harder opposite the legs. It reads as a body running, not a puppet.

## 3.7.0 — 2026-07-06
- **The predictions now speak like a real astrologer.** The Seasons forecast stops describing weather and starts naming life events, in the voice a reader across the table would use. It looks back as well as forward: "You have recently been through a real test around work and your health — something got heavier, a limit showed up, or a chapter you had outgrown finally ended," and it calls what is coming: "You are likely to get a surge of energy around romance, children or a creative project: a strong window to start and to act." Each statement names the exact life-area (the house that natal planet rules), tells you the planet and date behind it, and reads in the right tense — past for what has landed, present for what is landing now. The scanner reaches four months back so the "you've recently…" reads are real, slow multi-pass transits fold into one chapter with all their dates, and no single fast planet is allowed to dominate the list.

## 3.6.0 — 2026-07-06
- **The wheel breathes.** The Home chart was doing too much at once. The live sky now rides a faint track set well outside the zodiac names and glyphs, so nothing collides: only the planets actually touching your chart today glow, pulse and thread inward, while the quiet rest of the sky becomes a small unobtrusive tick. The busy fifteen-ring interior drops to four calm rings.
- **The Sun, Moon and rising, made real.** The three little dials under the wheel stop being flat glyphs ringed by filler dots. The Sun now renders as its true glowing body and the Moon as its cratered orb (the same craft as the hero), the rising as a clean, gently-listing sign, and a single fine mark on each ring shows the exact degree the body sits at in its sign.
- **A stale label swept.** The More screen's Settings card no longer advertises "voice", which the app retired several versions ago; it reads "look, sound, your data".

## 3.5.0 — 2026-07-06
- **Every planet reading now opens on you, not on your sign.** A new weave engine leads each placement with a line that fuses three specific things: what the planet is, how its sign makes it operate, and the real house arena it lives in — then draws the consequence. "Your Sun, your core self, works fast and first, with little patience for permission (Aries), and it lives in the part of your life about travel, study and meaning (9th house). So when it comes to travel, study and meaning, you go first and figure it out on the move." The generic sign paragraph becomes elaboration underneath. Because the sign×house×planet trio is rarely identical between two people, no two charts open the same way. This runs through the wheel tap, the planet story pages, and the walkthrough.
- **The chart stops being a list.** A cross-synthesis reads the placement pairs that classically matter — head vs heart (Mercury/Moon), desire vs pursuit (Venus/Mars), pride vs fear (Sun/Saturn), thinking vs doing (Mercury/Mars) — naming both real signs, how their elements get on, and what the tension or agreement means in practice. Woven into the core reading.

## 3.4.0 — 2026-07-06
- **Your profection year, read in full.** The one-line "you're in a Cancer profection year" becomes a real reading: the house it lights, exactly what a year like this tends to have you doing ("you retreat and complete: rest and withdrawal, spiritual practice, something hidden coming to light, work behind the scenes, the quiet closing of a long chapter"), where your year-lord sits and what it rules (so the year's action gets pinned to real rooms of your life), whether the lord is strong or working uphill, and the exact hinge dates the moving sky strikes it. Fully computed: the profected house from your age, the year-lord from your rising sign, the dates from the live ephemeris.
- **Predictions at event level.** The dated forecasts stop describing moods and start naming likely events. Each one reads the natal planet's ruled house and gives the concrete thing that timing classically brings: "Around Sat 18 Jul, Jupiter lands on your Jupiter, which rules your 5th house of romance, children and play. This is the classic timing for a romance, a creative project going public, or news about children." Twelve houses, each with what it concretely governs and the event it tends to bring when the sky lights it up.

## 3.3.0 — 2026-07-06
- **What is coming, to the day.** A new prediction engine reads straight off where the real planets will be and leads the Seasons tab with dated, oddly-specific forecasts: "Around Tue 7 Jul, Mars flows kindly into your Saturn, which sits in your 7th house and rules the part of your life about work & health. Expect a stretch of heat and hurry there. Good for finally having the conversation you have been ducking; watch for saying it a size too sharp." Every date is the exact day that contact perfects on your chart; every forecast names the actual life-areas that natal planet sits in and rules, not a generic mood. Slow-planet passes are grouped so a three-pass transit reads as one long chapter with all its dates.
- **Specific, not "special".** The opening hook is reframed away from rarity. It no longer tells you how few charts share your signature; it tells you what that signature specifically does inside you ("The load-bearing join in your chart is Venus sextile Jupiter, exact to within 0.13 of a degree. Held that close, these two never operate apart in you... most of what you do routes through that single join"). The heading becomes "What is most specifically you."
- **Tighter forecast prose.** The dated predictions name each life-area once, cleanly, instead of twice.

## 3.2.0 — 2026-07-06
- **The rarest thing about your chart.** A new signature engine scores every candidate for how few charts share it, cazimi, an aspect exact to a fraction of a degree, a stellium, a lone planet in a whole element, a critical degree, and leads your reading with the single spooky-specific one ("The defining wire of your chart is almost impossibly exact: Venus sextile Jupiter, locked to within 0.13 of one degree"). It opens the You tab as an italic pull-quote, so the reading hooks before it explains.
- **Words in the sky.** The opening walk no longer prints its lines underneath the scene. The title blooms among the stars with a soft halo and the lines rise like a slow tide, tinted to the sky they sit in (ink under a bright dawn, cream under night). The skies are sparser: a teaching scene now holds one planet, not ten, and the constellations light up outward from the centre, brighter and cleaner.
- **The chart-tap reading, rebuilt.** Tapping a planet now cuts in its figure line ("The Sovereign, wearing the Builder's colours"), pulls the giveaway out as an accented quote, and lets the reading arrive line by line like a tide, at your chosen text size, under a hairline that draws itself in.
- **One voice, one type system.** The monospace is retired: the interface now speaks in a single sans (Space Grotesk) with Fraunces for reading, so nothing reads "techy" against the serif. Every label tracks the same family.
- **Sound keyed to you.** The ambient pad no longer plays one generic chord everywhere. It tunes to your dominant element, a fire chart is met by a different harmony than a water one, so the sound belongs to the chart it greets.
- **No more crushing.** The wheel's sign names are placed proportionally now, measured letter by letter and shrunk only if they would spill their arc, so SAGITTARIUS reads as cleanly as ARIES. The Home element bar labels centre under their own segments with a guaranteed gap. Body text gains air between lines everywhere.

## 3.1.0 — 2026-07-05
- **Thirty streamlines, one pass.** A production-polish sweep across every screen:
  - **Home.** The colourful element bar is back under the title: fire, earth, air and water as proportional coloured segments with their percentages, one tap from Patterns. The day-word names its actual transit ("Uranus sextile your Jupiter") so "Surprises" is never cryptic. A missing birth time shows one tappable line straight to the fix. The selected planet links to its full story; a second tap on any placement row dives in; every placement wears its element as a small coloured dot; aspect rows are tappable, exact aspects are called out ("● exact"), and a "+N more in Patterns" line replaces silent truncation. The tap-a-planet hint retires itself after your first story. Houses read as "7th house", not "H7". The Chiron footnote only shows when Chiron is actually off.
  - **Stories.** Flip planet to planet with ‹ › right on the page; a real back button at the foot; and closing a story returns you to the exact scroll you left, not the top.
  - **Read.** Remembers your last tab across sessions and your place within each tab. The nav shows a quiet dot on READ while today's paper is unread.
  - **People.** The bond page can be left from the bottom too.
  - **Learn.** Finished lessons wear their check mark in the index.
  - **Settings.** Turning sound on answers in sound (a two-second swell). Text size shows a live preview line. The house systems get one honest explaining line.
  - **The paper.** Tapping the left edge steps back a story; the rest advances.
  - **Under the hood.** One watcher invalidates every reading cache the moment the active chart changes (switching saved charts previously left stale readings behind), and three more streamlines turned out to already exist: the pad respects the sound toggle everywhere, adding a person opens their bond immediately, and the opening film only ever plays before onboarding.

## 3.0.0 — 2026-07-05
- **The curated edition.** The release that gathers it all: the archetype engine (Greene, Rudhyar and the myths, applied to boardroom, field and altar), the welcome walk, house overlays and cross-chart reception in synastry, the prenatal lunation, applying/separating and out-of-sign natal aspects with luminary orbs, cazimi days, the Moon's first application, and gravity in every figure.
- **A new lesson: Guests and hosts.** Reception taught in the pond format, with the deeper beat covering mutual reception and applying vs separating, a recall check, and the landing beat found in your own chart ("your Mercury stands in Sun's territory, so Sun hosts it").

## 2.9.0 — 2026-07-05
- **Synastry grows its missing floor: the house overlays.** The heart of relationship astrology, finally read: where their planets land in YOUR houses ("Their Sun lands in your 12th house: they reach the part of you that never quite makes it into words") with twelve authored rooms, and where your Sun, Moon and Venus land in theirs. The classic reason a person feels like home, or like weather.
- **Reception crosses charts.** Every synastry contact now checks who hosts whom across the two charts: mutual reception ("even the hard days here have somewhere to land") and one-way hosting ("you hold the door on this one") join the contact lines. Verified against the real ephemeris: a Mars-in-Cancer / Jupiter-in-Scorpio pair correctly reads as mixed mutual reception.
- **Bonds open with their figures.** "The Warrior meets the Sovereign." The archetypes walk into the People pages, and every card in the People list names its person's figure.
- **The prenatal lunation.** The classical seal before birth, computed by scanning back from the birth minute: New Moon (the seed: "life keeps planting fresh starts there") or Full Moon (the harvest), with its exact degree, sign and house, under Patterns.
- **Cazimi days, called by name.** When Mercury or Venus sits in the heart of the Sun today, the daily essay says so: "the old astrologers' lucky hour stretched across a day. Say the thing, sign the thing."
- **Glossary keeps pace.** Out-of-sign aspects and house overlays join the Learn glossary.

## 2.8.0 — 2026-07-04
- **The archetypes.** Every chart now names its figures, in the language the working literature actually uses (after Liz Greene's The Astrology of Fate, Dane Rudhyar, and the myths the signs are named for): your Sun's figure, your Moon's heart, the door your rising answers through, and the keystone planet's seat ("The Warrior with the Builder's heart, arriving through the Sovereign's door"). And every archetype is applied to the real modern world three ways at once: the boardroom, the open field, and the candlelit table, so the same chart speaks to a CEO, a wanderer and a witch. Woven into the core reading, a named block under Patterns, and every planet page ("The Timekeeper wearing the Builder's colours").
- **The welcome walk.** The old coachmark tour is gone. In its place: five cinematic pages in the app's own scene language, written for someone who has never read a chart: your sky, your Sun (with its tell), your Moon (with its tell), what a transit actually is ("a season with a name and an end date, never a verdict"), and where the four doors lead. Replayable from Settings.
- **Gravity and life in every figure.** The walker's body now drops sharply at each heel strike and recovers slowly instead of floating; each footfall kicks a low puff of dust that blooms and dies with the stride; every standing figure shifts its weight from hip to hip and lets its gaze wander the constellations; the walker glances up when the sky names itself; the shooting star falls on a bent, weighted path; and the camera floats a hair, hand-held, never locked off.
- **Dead voice remnants removed, one real crash fixed.** The unfinished "Download the human voice" block in Settings referenced a variable that no longer exists and would have crashed the screen the moment the Reading fold opened; it and the dead voice-gate screen are gone entirely.

## 2.7.0 — 2026-07-04
- **The fine print a working astrologer checks.** Five upgrades that professional readers would fault the app for missing, all computed from the real ephemeris:
  - **Applying and separating.** Every planet now carries its true daily motion at birth, and every natal aspect knows which way it was moving: an aspect still tightening at the minute of birth ("applying: this one grows louder with age") reads differently from one already easing apart. The planet pages show the astrologer's shorthand next to each orb; the prose says it in plain words.
  - **The luminary moiety.** The Sun and Moon now cast the classically wider net: aspects involving a luminary get 1.5° more orb, the way working astrologers actually weigh them.
  - **Out-of-sign aspects named.** When the degrees agree but the signs do not (a "dissociate" aspect), the line now carries the caveat: it fires in flashes rather than running as a steady hum.
  - **Reception.** When one planet in a contact stands in a sign the other rules or is exalted in, the line says who hosts whom, and hard aspects held in reception are read as softened ("even this friction has somewhere warm to stay"). Full mutual receptions get their own named block under Patterns.
  - **The Moon's first application.** A classical natal technique almost no software runs: the app scans hour by hour from the birth minute and names the Moon's first perfected aspect: the first deal the inner life ever closed ("about an hour after you arrived, the Moon's first move was an opposition to Pluto"). Born void-of-course gets its own honest paragraph.
- **A seam sanded.** Aspect lines no longer stumble over "…what you idealise., very tight" where the corpus period met the orb clause.
- **The planet story page's key aspect goes full depth.** The synthesis line under "How it connects" now uses the complete layered read (pair tell, reception, motion, sign geometry, house stage) instead of the bare corpus line.

## 2.6.0 — 2026-07-04
- **Six hundred more tells, all wired.** The corpus grows by ~580 chart-specific lines: every planet through every house, Sun/Jupiter/Saturn through every sign, all forty-five aspect pairs in three moods, one hundred season-tells for the slow transits, the nodes by sign and house, the eight birth phases, twenty-eight dignities, natal retrogrades, the razor degrees (0 and 29), stelliums by house, the sixteen Sun-Moon element blends, and the Midheaven callings. Nothing sits in a drawer: planet pages now stack every tell that placement carries; aspect lines carry their pair's tell and their house stage; transit sentences carry the season's tell; and the core reading gains its deepest strata: birth phase, node path, element blend, calling, and the crowded house.
- **Plain words.** The Read tabs become You, Patterns, Seasons, Today.
- **Sound that works, Eno-style.** The audio context now resumes on every touch (the silent-after-backgrounding bug on phones), and the pad breathes slower: seven-second swells, a longer lusher delay halo.

## 2.5.0 — 2026-07-04
- **The tells.** Sixty new lines of behaviour-level writing, one for every Moon, Mercury, Venus and Mars sign and every rising sign: not traits but giveaways ("you redraft the text message four times, then send something close to the first version"; "strangers apologise to you when they bump into someone else"). Your Moon's tell and your rising's tell are woven into the core reading, and every planet's page now ends on THE TELL: the small thing that gives the placement away in a room.
- **The walker enters.** Every scene now begins with the figure walking in from offscreen and settling into frame, leaning slightly into the arrival, instead of appearing mid-stage.

## 2.4.1 — 2026-07-04
- **The words gain three layers.** Every transit sentence now weighs, in order: the mover's own condition in the sky it is crossing (a Saturn at home in Aquarius speaks differently from a Saturn far from home in Cancer); the natal wire it lands on ("your natal Venus sextile Jupiter runs easy in you, and leaning on it softens this", or "your natal square has trained you for exactly this pressure, so trust the old skills"); and sect: Saturn and Mars behave differently in a day chart and a night one, and the sentence says so.
- **Natal aspects name their stage.** With a birth time, each aspect line now says which two houses it plays between: the arena, not just the wiring.
- **The lineage, named.** Settings now states where the words come from: dignities after Ptolemy and Lilly (quotes marked with sources), phases after Rudhyar, time-lords after Valens, and the plain-language synthesis written for this app. No line is generated; every sentence is composed from the computed chart.

## 2.4.0 — 2026-07-04
- **The camera moves.** Every scene now pushes slowly toward the walker over its life, stars drift in parallax against the stride, low mist slides past in the foreground, and the mover casts a pool of its own light on the ground. Letterbox and iris hold the frame.
- **Serendipity.** Every so often a star lets go and falls; every so often a small flight of birds crosses the sky on a breeze. Never on schedule, never demanded, the way a sky should be.
- **Ethereal music.** The pad grows a feedback-delay halo, a shadow voice a fifth below, chords that breathe between voicings every so often, and rare high shimmer notes that fall like single stars and take six seconds to fade. Still a whisper.
- **Spacing trued.** The Reel's giant AGE clears its header row, the month moved beside the title, and lesson titles sit below the pond instead of in it.

## 2.3.0 — 2026-07-04
- **The app gets its own face.** Fraunces, a warm and genuinely characterful old-style serif, carries every reading and title; Space Grotesk carries the interface. Both load once (about 100KB together), stay cached forever, and fall back gracefully to the old stacks offline, composing cleanly with the OpenDyslexic preference.
- **The last squash found.** The Reel's giant AGE digits sat on a fixed 44px grid whatever the font's real width; the grid now measures the actual digits.
- **Swipe between the doors.** A horizontal swipe slides Home, Read, People and More past each other, and the beloved colour-block wipe now follows your hand: swipe left and it sweeps left, tap a tab to the right and it sweeps right, its accent edge always leading.

## 2.2.2 — 2026-07-04
- **Real constellations in the sky.** Every story scene now carries the twelve zodiac constellations, each simplified from its true star pattern: the Hyades V and the Pleiades in Taurus, the Sickle of Leo, the Scorpion's hook around Antares, the Teapot of Sagittarius, the twin lines of Gemini crowned by Castor and Pollux, and the rest. Their lines draw themselves in star by star, and the constellation the mover stands in wakes brighter: a presence in the sky, not a label under it.
- **Planets with character.** The background planets stop being identical dots: each glows in its own colour and size, Saturn wears its ring, the Moon its crescent, alpha stars their halos.

## 2.2.1 — 2026-07-04
- **The Reel walks.** The scrubbing bi-wheel is gone. Dragging the bar now walks your figure through the sky of that very day: the years stream underfoot, the body is small in childhood and stoops a little past sixty, and when an exact transit lands the scene centres it, threads it to your natal point and names it. Let go, and you stand and look up.
- **No more over-explaining.** "Search anywhere online", the geocoding essay on the birth form, "drag the bar" instructions, "read the full page in Read" and their kin are gone. The app shows; it does not narrate its own interface.

## 2.2.0 — 2026-07-04
- **Cut-scenes, not diagrams.** The story scenes lose their sign labels, tick marks and planet glyphs. Planets are unlabelled bodies of light where they truly stand; the mover breathes and its name appears once, then lets go; high cloud drifts through; an iris of air and letterbox bars frame it like film.
- **The voice is retired.** It never earned its keep, so it is gone entirely: no downloads, no narration buttons, no settings row. The scenes and the words carry the app.
- **Sound is ambience only.** Every tap-chirp and chime is silenced. What remains is the soft pad under the intro, the life story, the Daily Sky and now the lessons, fading in and out with the scene.
- **The Daily Sky opens on the story.** No masthead card, and each story says its piece in two sentences.
- **Simpler beginnings.** The birth form is three questions: when, what time, where, and the place search reaches the whole world by default (switch it off in Settings for fully offline).

## 2.1.1 — 2026-07-04
- **Tarot is two doors.** Spreads and card meanings wait behind their own buttons; the screen opens on nothing but the ritual and those two choices.
- **Timing leads with the headline.** One sentence tells you where you are in your thirty-year cycle before any machinery appears.
- **The bond page opens on the meeting.** Stage and scoreboard first; the bi-wheel, the year together and every contact wait behind one door.

## 2.1.0 — 2026-07-04
- **Lessons happen at a pond.** Every journey diagram now stands over still water: the idea reflected below the waterline, shimmer drifting across it, and the water answering your touch with ripples. The words arrive one line at a time and rest gently on the surface; finishing a chapter sends a small star sailing down to its dot on the road.
- **Elbows, finally right.** Leftover mirrored elbow bends from the old front-view figure (the intro runner's pumping arms, the leap, the friends' greeting wave) are corrected: in profile, elbows bend backward along the direction of travel.
- **The walk breathes.** The torso now sways subtly with the stride instead of riding welded upright, timed to the same authored curve as the body's rise and fall.
- **Squashed type fixed.** Long sign names around the wheel (Sagittarius, Capricorn) filled their whole thirty-degree segment and collided with their neighbours; each name is now capped at twenty-four degrees of arc.

## 2.0.1 — 2026-07-04
- **Learn is the journey now.** The encyclopedia shell is gone: Learn opens on the guided journey through your own chart, the road you are walking, one door to charts like yours, and search. Every reference page (signs, houses, glossary, history, myths) still exists, but answers to search instead of shouting from a menu.
- **The transit chapter teaches with the real sky.** When the journey reaches "The sky keeps turning," the abstract diagram gives way to the app's one scene language: today's actual sky, the strongest transit threaded to your natal point, you walking beneath it.

## 2.0.0 — 2026-07-04
- **The compass is home.** The wheel is the app's front door, and it now tells today as well as forever: every live planet rides the rim at its true degree, quiet ones as small ink dots, the ones touching your chart glowing and threaded to the natal point they touch. One word for the day sits beneath. Tap any of it and Today opens.
- **One scene, everywhere.** Every story in the app: the life chapters and the Daily Sky, now plays in a single language: your silhouette walking (or running, for returns) beneath the REAL sky of that moment, every planet at its true ecliptic degree among the stars, the mover glowing, your natal point ringed, the aspect drawn as a thread of light. The old theatrical sets are gone; the sky itself is the set.
- **Four doors.** Navigation slims to Home, Read, People and More (Learn, Tarot and Settings live inside More). The tour walks the new doors.
- **Less, everywhere.** The fuller read waits behind "Go deeper"; the day's transit tables behind "The numbers"; Chapters, Reel and Calendar share one calm row; Learn opens on just the journey and its road, with the library behind one door; the Watch section is retired; the intro tightens to about half a minute.

## 1.9.5 — 2026-07-04
- **The wheel, named.** Every zodiac sign is now written out in full, curved along the inside of the ring (upright in the lower half), so the chart reads without knowing a single glyph. The glyphs stay outside as ornament.
- **A slimmer front page.** The coordinates/element HUD is gone from above the wheel, and the tap hint is four words. The chart screen is now: your rising, the wheel, the big three, the reading.

## 1.9.4 — 2026-07-03
- **The walk is animated, not computed.** The stride now comes from an authored pose sheet, eight hand-set keys per foot per cycle, the way an animator draws it: heel strikes toe-up, the sole rolls flat, the heel peels at push-off, the toe trails through the lift, and the shin snaps through to reach heel-first for the next step. The run gets the same treatment, with a real flight moment. In-betweens flow through a smooth periodic curve, so the motion settles into each step instead of gliding like a machine.
- **The head rides level.** Real heads barely bob; the body moves beneath them. Half the walk bob is now absorbed before it reaches the head.
- **The figure belongs to the paper.** Every cold blue-black silhouette is re-inked in the warm near-black of the app's type, and a faint paper veil now lies over the scene skies in the intro, the life story and the Daily Sky, so the animated world and the printed world read as one thing.

## 1.9.3 — 2026-07-03
- **The walk, finally forward.** The stride had feet swinging backward through the air, which read as moonwalking. Feet now drive forward while lifted and push back while planted, with the cycle direction-aware, so walkers heading left and right both read true.
- **The chart opens on the wheel.** Both Today teasers are gone from the front screen; the moon button up top is the one door to Today.
- **Tarot home decluttered.** The card-of-the-day panel is gone; the deck art lives on each card's own meaning page.
- **Lessons teach, no tests.** The quiz beats are removed from Learn; chapters flow teaching into what it means in your chart, then onward.
- **Quiet hands.** Taps no longer chirp; touches answer with a small haptic only, and sound is kept for music and scene moments.
- **A voice that always answers.** Every spoken line now falls back to the system voice whenever the downloaded one is not ready, and speech is unlocked on the first touch, so choosing a voice always means hearing one.
- **Bigger words, smoother hand.** Reading text steps up to the Large size by default (your explicit choice is respected), and the canvas runs at 60 frames so scrolling stops feeling clunky.

## 1.9.2 — 2026-07-03
- **The warm voice guides the whole way.** The first-run tour and the settings first-visit guide are now narrated card by card, in the downloaded voice or the system one, and go quiet the moment you dismiss them. The promise the voice gate made is kept.
- **The readings speak.** Read > Story opens with "Read it to me": your four-movement arc and the fuller read, spoken aloud, with a live stop button. The voice hushes if you leave the tab.
- **Music in the Daily Sky.** The bulletin brings in the same soft ambient pad the intro and life story carry, on your first tap of the day.
- **One seam mended.** The chart's at-a-glance line no longer stacks two colons; it reads "leans fire: ... It meets life by ..." as intended.

## 1.9.1 — 2026-07-03
- **The meeting, staged.** Opening a person in People now opens with the scene itself: your persona and theirs under one dusk, them arriving at their chart's pace, stopping at the distance the synastry sets, the bond thread drawn and the element mix written beneath.
- **Element worn everywhere.** People rows and family-tree cards carry a small swatch in each persona's light, so a glance tells you who runs fire, earth, air or water.
- **The Daily Sky, tunable.** It greets you by name, can be replayed from Read > Days, and can be turned off in Settings > Reading.
- **Watch the opening again.** Settings > Data replays the seasonal chase, now with your chart persona and your people arriving in the finale.
- **The Learn road.** The guided journey is drawn as a path your persona stands on, one milestone per chapter, a flag at the end.
- **Titles fixed for good.** Every big title (People, Settings, person names, the chart header and its rising/sun suffix) now draws straight onto the canvas, immune to the state bug that could shrink them.
- **Text and speed.** Sixteen escaped em-dashes in composed readings rewritten into the app's real voice; synastry summaries are computed once per chart instead of every frame.

## 1.9.0 — 2026-07-03
- **The Daily Sky.** Opening the app now opens today like a front page: an animated bulletin, once per day, that walks your persona through each transit touching your chart right now: the mover owns the sky, the weather means what the aspect means, and the words rise line by line. Ends with everyone you keep, under the same sky.
- **The persona is your chart.** The silhouette is no longer generic: your dominant element sets its pace, its carriage and the colour of light it walks in. Fire strides and looks up; earth settles and takes its time; air is lifted; water flows.
- **Friends walk in as their charts.** People you have saved arrive in the intro finale and the daily bulletin as their own personas. The synastry with your chart decides how they behave around you: warm bonds come close and raise a hand, sparky ones keep a respectful gap and glance away.
- **The bonds made visible.** A thread is drawn between you and each friend: an easy current arcs smooth and gold, friction crackles, a mixed bond stitches a dotted line. A caption cycles through each pairing: whose Sun meets whose, how the elements weather each other, and the flowing/challenging count from real synastry.
- **The figure, finally human.** True side-profile body with a simple head; both knees bend forward and both elbows back; limbs never open past straight; the far side stands a tone lighter on a recessed hip and shoulder; idle arms counter-swing the legs.
- **Feet that touch the ground.** The leg solves to the ankle, so a planted sole sits exactly on the ground line; a lifted foot points its toe on push-off and leads with the heel just before landing.

## 1.8.0 — 2026-07-03

The chase, the stale-shell fix, and scenes that mean something.

- **The new intro is a film opening**: one runner, side on, chasing the Moon
  through winter snow, the rising Sun through spring rain and blossom, a
  summer leap held a breath longer than physics, an autumn walk into
  streaming leaves, and a final night where the zodiac gathers into an arc,
  their star descends, and the name arrives. Mercury, Venus, Mars, Jupiter
  and Saturn appear by name: the cast, introduced. Eight-pose run cycle,
  stride-locked ground, film-subtitle captions. First tap starts the music;
  second tap skips.
- **Updates actually arrive**: the service worker is network-first for the
  app shell and force-reloads open pages once when a new version takes
  over. The old cache-first worker was why new features kept not appearing.
- **Sound, audible**: old installs saved under the silent default migrate
  once to sound-on; if the human voice cannot arrive, the system voice
  steps in so narration never silently fails. The voice downloads itself.
- **Domain-symbolic scenes**: a Sun contact is your own fire shielded from
  the wind; the Moon, a storm leaning on the house (or light carried home);
  the Midheaven, a flag held at the summit; the Ascendant, a stuck door
  shouldered open. The planet hangs small in the sky as the weather source.
- **The figure is flesh**: tapered filled limbs, real hands, heel-toe feet;
  chapter text arrives line by line; tarot meanings lead with that card's
  flickering real-deck art; the AUTO swatch labels itself legibly.

## 1.7.0 — 2026-07-03

The welcome, the workshop, and the furniture.

- **OpenDyslexic**: a reading-font choice in Settings. Loads once (~600KB),
  kept offline; every reading re-wraps itself because everything measures.
  Lines breathe a little wider in it.
- **The chart is never blocked**: the planet card is a peek sheet now, a
  third of the screen, with the wheel alive above it. No dimming.
- **Voice before birth details**: after the cold open, the app offers its
  voice: download the human one with live progress, take the system one, or
  go quietly. The moment it is ready it speaks a welcome and walks you into
  setup. Music: a soft generative pad, swells under the intro and the life
  story (sound is on by default for new installs; the first tap unlocks it).
- **The person, again**: contrapposto at rest (weight on one hip, shoulders
  countering), elbows and knees never locked, a gait with the body lowest at
  contact and highest at passing. Six and a half heads.
- **Watch went full furniture**: one large square CRT per row in a walnut
  cabinet: grain, bevel, feet, brand plate, two working-looking knobs, a
  speaker grille, glass glare, scanlines over thumbnails, and a new myth
  channel for your sign. Five channels now, honestly counted.
- **The Reel scrub is an instrument**: age labels, every life chapter as a
  coloured stitch on the bar, chapters naming themselves as the handle
  passes, and a film-reel handle with sprockets that spin while you scrub.
- **Learn**: the 3-2-1 projector countdown is gone; lessons start clean.
  Screen titles rise letter by letter: Read, Tarot, The sky explained.
- **Tarot**: the top of the screen is now the card of the day in flickering
  public-domain art, with a projector's shiver and grain, tap for meaning.
- **Settings greets first-timers**: three calm cards explain the three
  drawers, then get out of the way forever.

## 1.6.0 — 2026-07-03

A person, doing what the year did.

- **A real human silhouette**: seven heads tall, weight in the torso, tapered
  limbs, heel-and-toe feet, and a believable gait: swing foot lifting, arms
  counter-swinging, the body bobbing. The scarf is gone.
- **The chapters act out the reading**: a Jupiter return kneels and plants,
  and a sprout comes up where the hand touched. A Saturn return builds a
  wall stone by stone and stands back, hands on hips. A square shoves the
  planet up a slope, slips once, and crests it in the rain. An opposition is
  a tug-of-war held until the rope goes quiet. A trine walks to the orchard
  and the branch bends until the fruit chooses your hand. A conjunction
  kneels, takes it in, and stands up changed.
- **The intro is a cold open**: night falls, stars arrive one by one, a
  shooting star lights a constellation, the traveller walks in with a real
  gait, their star descends from the constellation to keep above them, and
  the name rises letter by letter.
- **Fixed**: animated titles were inheriting stale canvas state and
  rendering small; they now draw straight onto the canvas at full size.

## 1.5.2 — 2026-07-03

The voice, made to actually arrive.

- **Two mirrors, not one**: the Kokoro loader tries jsDelivr's bundle and
  falls back to esm.sh, on a major-version range instead of a pinned file.
- **Playback that cannot be muted by autoplay rules**: speech now plays
  through WebAudio straight from the raw samples; the audio context is
  unlocked by the download tap itself.
- **"Hear a line"**: a test button right in Settings the moment the voice is
  ready, so you never have to wonder.
- **The life story speaks**: with a voice chosen, every chapter of the Life
  Walk reads itself aloud: Human uses Kokoro; System works today with no
  download at all. Closing or skipping the walk silences it everywhere.

## 1.5.1 — 2026-07-03

- **The traveller, not the monk**: the mystic wears a knee-length tunic that
  sways as cloth, with slender legs fully drawn beneath it. Genderless,
  starlit, and no longer mistakable for anyone's space wizard.
- **Engine: perfection, timed**: applying transits are now bisected to their
  exact moment. The Moon's contacts name the day and the minute; slower
  movers name the date: "Still applying: exact 6 Jul; it builds until then."
- **Text audit, round two**: the opening/opening repetition in opportunity
  transits, list-tilts carrying second colons, and the bond headline's
  nested colon all fixed at their template sources.

## 1.5.0 — 2026-07-02

The mystic, the diagrams, and a cleaner tongue.

- **The walker became a mystic**: a genderless figure in a floor-length robe
  that moves like slow water, wide sleeves, a smooth featureless head, the
  accent scarf, and a small guiding star that keeps above them, twinkling.
- **Labelled diagrams, animated**: each life chapter chalks its own geometry
  into the sky's corner: your natal point, the mover sweeping to its exact
  angle with the degrees counting up, both labelled. A return sweeps the
  full 360.
- **Animated words**: chapter titles and the finale line rise letter by
  letter into place.
- **The mystic wanders the timeline too**: a tiny cameo walks beside the
  travelling light down your life's thread, stepping as you scroll.
- **Longer scenes**: choreography breathes at five seconds, the camera leans
  in over nine; captions wrap at the colon instead of ever clipping.
- **Engine**: live transits now know applying from separating (still
  building versus already easing), told in the reading.
- **Text audit**: nested colons unwound at their sources, "31th year"
  becomes a real ordinal, a lowercase seam after full stops capitalised,
  and a stray double space closed.

## 1.4.1 — 2026-07-02

- **The walker got friendly**: rebuilt on playful silhouette principles: a
  big round head (about 2.5 heads tall, the proportion that reads as young
  and warm), a soft bean body, stubby limbs, mitten hands, big soft feet, a
  cowlick that flicks in the wind, and a little profile nose when the head
  turns: the oldest silhouette charm there is. Circles read as warm;
  the shadow-man is gone.

## 1.4.0 — 2026-07-02

The dioramas: silhouettes, skies, and weather. (The living logo is untouched.)

- **The walker**: the life-journey actor is now a filled silhouette with
  weight: capsule limbs, a chest broader than the waist, small shoes, a tuft
  of hair the wind owns, and a trailing accent scarf: the one coloured thing
  the silhouette carries. Rim light where a moon or a dawn strikes it.
- **Scenes became landscapes**: each chapter is a layered diorama. A gradient
  sky owned by the mover (Jupiter's golden hour, Saturn's slate evening,
  Uranus electric, Neptune's deep teal, Pluto's ember dusk), three parallax
  hill bands, drifting clouds, god rays on the warm skies, foreground grass
  leaning to the same wind as the scarf.
- **Sets grew from the land**: the Midheaven's staircase became a summit path
  with a cairn and a small flag; the Ascendant's doorway became standing
  stones with light through the gate; the Moon's house became a cottage with
  one warm window and chimney smoke.
- **Weather with meaning**: rain falls through the struggle beat of a square;
  wind curls cross a trine; Pluto's embers rise; Neptune's fog drifts;
  returns happen under stars.
- **The cold open is a night hillside**: stars, a rising moon, the walker
  waiting in rim light. The finale is a dawn: the sun comes up and the walker
  bows to it, long shadow and all.
- **Captions became subtitles** on the dark foreground band, always legible;
  the chapter header reads light over the sky.
- **App-wide layer**: high thin clouds now cross the zodiac-sky background on
  every screen, patient as weather.

## 1.3.0 — 2026-07-02

The company arrives: a jointed actor, sets that mean something, and a human voice.

- **The actor**: the life-journey figure is now a gesture drawing come to life:
  head ball with a construction cross that turns to watch the planet, ribcage
  and pelvis masses, two-bone limbs solved by IK, small hands and feet, breath,
  and a faint red-pencil underdrawing behind the ink.
- **Sets from the story**: the chapter's meaning stages the scene. Transits to
  the Midheaven play on a staircase; to the Ascendant at an arched doorway of
  light; to the Moon over a small house with one warm window; to the Sun inside
  the spotlight itself, which narrows under a square and widens as you win.
- **Weather from the mover**: Neptune brings drifting fog, Pluto rising embers,
  Uranus trips the lamp, Saturn deepens the wings, Jupiter warms and widens
  the light.
- **The show has a shape**: a cold open (dark house, one light warming, the
  bill of the show), an entrance walk to the mark, per-aspect choreography
  including the new trine (caught like weather, one heel lifted), a camera
  that leans in slow as breath, a tremor when a square lands, chiaroscuro
  around the light, and a finale where the actor bows and the next chapter is
  announced with its real year.
- **Trines join the life chapters**: rare outer-planet trines to your personal
  points are now found and told, so ease gets chapters too, not only struggle.
- **The human voice, downloadable at last**: Kokoro-82M (Apache-2.0), the best
  small open voice there is. One ~90MB download from Settings, cached
  on-device, spoken locally; no words leave the phone. The walkthrough reads
  itself aloud when you choose Human.
- The chapter text now sits in a measured stack that always fits: captions
  split and shrink to width, the body adapts its size to the space.

## 1.2.1 — 2026-07-02

The six-dimension audit: edge charts, offline, people, data, layout, speed.

- **Unknown birth times can no longer break a chart**: a birth stored
  without an hour is cast for noon, the standard convention, instead of
  silently failing to compute.
- **The Rings tell the truth for newborns**: a retrograde re-cross of the
  natal degree days after birth no longer masquerades as "your first Saturn
  return, age 0". Laps are reconciled against age; a baby's ring now reads
  Saturn 2056, Uranus 2110, Pluto 2274.
- **Offline from the first visit**: the service worker precaches the whole
  app at install, instead of only remembering pages already seen.
- Audited clean with zero errors: polar-latitude Placidus (the planetary
  hour bows out gracefully in polar night), sidereal + Vimshottari, southern
  hemisphere, age 106, People (bonds, synastry, a no-time parent's colleague
  file), settings round-trips (sidereal degrees exact, returns
  zodiac-invariant), 320px layout, and a steady 60fps.

## 1.2.0 — 2026-07-02

Time as architecture: the three great cycle tools, computed, dated, drawn.

- **The Phase of Your Life** (Timing): the progressed lunation cycle after
  Dane Rudhyar, computed by true secondary progression (searched against the
  ephemeris, not a mean rate). A moon drawn at your exact progressed
  Sun–Moon angle with seeded maria, the eight-phase dial, which cycle you
  are in, when this phase began, when it gives way, and the date and age of
  your next progressed New Moon.
- **The Rings** (Timing): the returns almanac as tree rings. Every planet's
  lap of your chart: cycle fraction live from the ephemeris, completed laps
  counted, next return bisection-searched to the day. Saturn return with
  first-return receipts and the mid-lap opposition, Jupiter's twelve-year
  knock, the 18.6-year nodal compass, the Uranus opposition dated, and the
  unfinishable rings of Neptune and Pluto told honestly.
- **The Planetary Hour** (Today): the classical hour-lords cut from true
  sunrise and sunset (astronomy-engine rise/set search), Chaldean order,
  the day's twelve hours as a strip with the current hour lit, and what
  each hour is traditionally for.
- **Void of course, exact** (Today): no longer a yes/no. The Moon's last
  perfecting aspect is found and timed, the void window has a start and an
  end, and the ingress into the next sign is bisected to the minute.

## 1.1.0 — 2026-07-02

The production-hardening pass: thirty refinements to what was already there.

- **Physics**: scroll gains rubber-band resistance and spring-back; a quiet
  scroll ghost appears while the page moves; the chart wheel hangs with real
  weight, trailing the scroll by a breath; the zodiac sky parallaxes on
  three planes of depth.
- **Touch**: swipe down closes the planet sheet and the Today panel; every
  tap strikes three star-flecks that arc under gravity; the chosen toggle
  pill pops; the nav dot travels between tabs, stretching with speed;
  steppers repeat under a held finger; correct quiz answers get their own
  haptic signature.
- **Motion with a job**: aspect threads pluck like strings once drawn taut;
  the Reel's age is a true odometer with rolling digit drums plus decade
  ticks and a month-precise readout; the planet sheet's handle nods once to
  say it drags.
- **Keyboard**: Escape peels the topmost layer, arrows scroll, and
  left/right scrub the Reel a month at a time.
- **Integrity**: storage-full saves shed the disposable watch cache and
  retry (user data is never dropped); removing a person takes two taps;
  waking the app on a new day recomposes today's sky; the journal is capped
  at the input and pulses "kept, on this device only" as keystrokes land;
  Watch retune actually clears its cached vetting.
- **Text**: a final de-dash sweep of 122 em-dashes in user-visible prose;
  only quote attributions keep the dash, as typography intends.

## 1.0.0 — 2026-07-02

The "real astrologer" release. Everything below computes on-device with an
analytic ephemeris (astronomy-engine, MIT); no server, no account, no AI.

- **Engine**: profections, Zodiacal Releasing, Firdaria, secondary
  progressions with a dated timeline, full solar-return chart, true eclipse
  search mapped to natal houses, retrograde-station seasons, Egyptian bounds
  (terms), dispositor weave, condition ledger (dignity / angularity / cazimi /
  combust / sect / motion), Sun–Moon midpoint, antiscia, draconic layer,
  Jyotisha (nakshatra + Vimshottari) in sidereal mode, electional day-picker.
- **Uniqueness**: every reading is seeded by a full-chart fingerprint (all
  longitudes at 0.1°), so both facts and phrasing differ per chart.
- **Reading**: four chapters (Story / Wiring / Timing / Days), a composed
  daily essay, long-press copy/share on any paragraph, tappable glossary,
  The Book of You printable report.
- **Teaching**: multi-beat lessons with recall quizzes and persistent stars,
  levelled curriculum, live how-to tours, search over everything.
- **Stagecraft**: the walkthrough as staged acts with per-planet light,
  tempo, camera, choreography and optional spoken narration; CRT televisions
  with true static and tube warm-up in Watch's curated channels.
- **Product**: Today sheet with week strip and journal, synastry scoreboard
  with receipts, transit reminders, app shortcuts and icon badge, one-file
  backup/restore, Porphyry joins Whole/Equal/Placidus house systems.
