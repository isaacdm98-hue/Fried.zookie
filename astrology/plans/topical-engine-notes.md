# THE TOPICAL ENGINE — session build notes

What the reading now does, and where it lives, so the next pass can extend it without re-deriving.

## The domain reading (index.html, read screen, "Your life, domain by domain")
Order of the chapter:
1. **Your life at a glance** (`lifeAtAGlance`) — the synthesis verdict: constitution + each
   domain's one-word judgement, colour-coded, then a one-line best/worst synthesis.
2. Per life-area, in prominence order (`housesThatMatter`):
   - the four-testimony **house reading** (`judgeHouse`) — UNLESS a topical synthesis subsumes
     that house (money/love/career/family lead houses), in which case the topical replaces it.
   - the **topical synthesis** where one exists (keyed to the lead house in `UI.topicCache`).
   - health is **additive**: `judgeHealth` shows beneath the 6th-house reading, not in place of it.

## The engines (all in index.html, all exported on APP)
- `temperament(c,b)` / `temperamentProse(t)` — Greenbaum's weighted 7-testimony humoral
  constitution; opens `natalSynthesis`. Helpers `planetHumor` (Mercury orientality),
  `almutenOfDegree`. Tables: HUMOR_ELEM/HUMOR_PLANET/HUMOR_NAME/HUMOR_BODY.
- `judgeHealth(c,b)` — Cours-6 medical: life-forces vs morbid forces → watched zones, reassurance
  register. Corpus: `DATA.SIGN_ZONE`, `DATA.PLANET_AFFLICT`, `DATA.DISEASE_MATRIX` (Sat/Mars/Jup
  × 12; others fall back to zone×quality). Never a diagnosis.
- `judgeTopic(c,b,spec)` — the reusable domain synthesiser: houses[] (each significator judged by
  Lilly condition and followed to its house = the source), + lot + karaka → one verdict
  (well-promised / mixed / hard-won). Specs: `judgeMoney` (2/11/8 + Fortune + Jupiter), `judgeLove`
  (7/5 + Venus), `judgeCareer` (10/6 + Sun), `judgeFamily` (4/3 + Moon).
- `lifeAtAGlance(c,b)` — gathers the constitution + all five topical verdicts + best/worst.

## Timing engine (audited & corrected this session)
- `zodiacalReleasing` — Valens true L2 (months, sign-by-sign), loosing-of-the-bond, peaks from
  Fortune. `firdaria` — night order fixed (seven planets, then nodes last). `lordOfYear` — whole-sign
  profection + the planet activated in the profected sign. `retroSeasons` — triple-pass points + live
  wires. Constants confirmed against the tradition in `doctrine-notes-timing-medical.md`.

## Proof
- `tests/golden.cjs` pins the JUDGED MEANING of 5 nativities. `tests/doctrine.cjs` pins the dignity
  ledgers. `tests/topical-stress.cjs` runs the whole new engine across 50 diverse charts (every
  month, four ascendants, both hemispheres, high latitude, equator, leap day, no-time) asserting no
  exceptions / no page errors / voice-clean / no grammar smells / verdict variety — 450 calls clean.

## Open extensions (cheap, on the existing engine)
- The DISEASE_MATRIX rows for Sun/Venus/Mercury/Moon (currently zone×quality fallback).
- A children/legacy topical (5th children + Jupiter; 8th legacy) if wanted — but avoid a
  "character/personality" topical: it violates Sonia's domains-not-personality rule.
- The time-driven narrative (Phase E): weave the corrected ZR peaks + directions + the
  derived-houses fan-out (`castFromDirection`) into one dated year-story.
- Interface/layout pacing on device (the one thing the headless harness cannot judge).
