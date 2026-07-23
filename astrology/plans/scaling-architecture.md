# SCALING THE DELINEATION DATABASE — the combinatorial architecture

The goal: a chart-specific reading database **bigger and more accurate than
Astro.com or any other** — with no AI, every line sourced and receipted. This
document is how we actually get there, and why the ceiling is effectively
unbounded.

---

## The core move: GENERATE, don't ENUMERATE

Astro.com, Astro Gold, every cookbook app **enumerate**: a fixed paragraph per
placement, written once, looked up. Their database is finite — a few thousand
paragraphs — and static. A bigger flat file is the wrong race; we'd only ever tie.

We **generate**. We author *atomic fragments* keyed to single factors, and the
engine **composes** the fragments that apply to a given chart, in Sonia's order,
through a clause grammar. The number of distinct outputs is the **product** of the
factor cardinalities — which explodes into billions from a few thousand authored
atoms, every one hand-written and correct.

**This is not a trick — it is literally Morin's method.** *Astrologia Gallica*
XXI–XXII is a system for *combining testimonies by determination*, not a cookbook.
The combinatorial engine is the **most faithful** implementation of the tradition,
not a shortcut around it. Sonia teaches the same: you don't memorise "Venus in the
8th"; you *combine* Venus's nature × its dignity × the 8th's matters × its
receptions × its aspects into a judgement. We encode exactly that.

### The scale, honestly

- **Authored atoms:** a few thousand hand-written, sourced fragments (achievable —
  it is structured writing across finite tables).
- **Distinct chart outputs:** effectively unbounded. One placement already draws on
  8–12 factors; a whole chart draws on 10 placements + 12 houses + ~20 aspects +
  the timing stack. The distinct-state space is astronomically larger than any
  enumerated database.
- **The multiplicative property:** add a 120-entry table and you don't *add* 120
  outputs — you *multiply* the whole output space by up to 120. Growth compounds.

Astro.com's raw paragraph count is larger *today*; but it is fixed, generic
(state-blind), and unsourced-to-you. Ours is generative, state-selected, and
receipted — and every atom table we add multiplies it past them.

---

## The atom tables (the authored corpus) — the full target

Each is a finite, hand-authored table, sourced to Lilly / Morin / al-Biruni /
Ptolemy / the Cours Préparatoires. ✅ = exists, ◑ = partial, ○ = to build.

| # | Table | Cardinality | Status |
|---|---|---|---|
| 1 | Planet significations (persons/matters/qualities/vocations/body) `SIG` | 10 × 5 fields | ✅ |
| 2 | House significations `HOUSE_SIG` | 12 | ✅ |
| 3 | **Planet-in-house** `PLANET_IN_HOUSE` | 84 (7×12) | ✅ (extend to 10×12 = 120) |
| 4 | **Planet-in-sign (manner)** | 120 (10×12) | ◑ (Sun/Moon/rising only; ~60 to write) |
| 5 | Dignity-character (well/poor per planet) | 10×2 | ✅ (in `SIG.qualities`) |
| 6 | Sect role | 7 | ✅ |
| 7 | **House-lord-in-house (derived)** | 144 (12×12) | ✅ **generated** from `HOUSE_SIG × HOUSE_SIG` (no hand table needed) |
| 8 | **Aspect pair × type** | ~225 (45×5) | ◑ (extend `aspectNature`/`pairAspectText` to full matrix) |
| 9 | Reception forms | ~12 | ◑ |
| 10 | Dispositor-chain narration | templates | ○ (T8) |
| 11 | Almuten adjudication phrases | ~12 | ◑ (`rulingVoice`/`contest`) |
| 12 | Degree — decans (faces) | 36 | ✅ |
| 13 | Degree — terms (bounds) | 60 (Egyptian) | ✅ (table) → ○ (delineate) |
| 14 | Degree — anaretic / 0° / critical | ~5 | ✅ |
| 15 | Fixed stars on planets/angles | 30 | ✅ |
| 16 | Lunar phase at birth | 8 | ✅ |
| 17 | Rare conditions (combust/cazimi/besieged/feral/OOB/retro/stationary) | ~10 | ✅ |
| 18 | **Topic synthesis templates** (money/work/love/family/health/mind) | 6 | ○ (T11–16) |
| 19 | **Derived-house topics (turning the chart)** | 12×12×12 | ✅ **generated** (`derivedHouseOf`) |
| 20 | Sign-pair / element blends | ~40 | ◑ |

Hand-authored target: **~2,500–3,500 fragments.** Generated combinations:
**effectively unbounded.**

---

## The composition engine (the "clever, chart-specific" part)

Atoms are inert; the engine is what makes it a reading. Six jobs:

1. **Select** — which atoms fire, *weighted by prominence in this chart* (the
   `prominence` scorer already ranks placements). We never dump all atoms; we
   surface what actually carries weight here.
2. **Order** — Sonia's method, always: Ascendant → captain → house-lords home →
   planet states → aspects by nature → directions → transits last.
3. **Synthesise** — reconcile testimonies. When two atoms disagree, the **almuten**
   and the **receptions** decide who wins, and the sentence *says so*. This is the
   single biggest gap vs cookbook apps, which print atoms independently.
4. **Enforce ≥2 determinants** — every composed sentence cites at least two
   chart-specific factors. A line sayable to anyone is a *test failure*.
5. **Grammar & variety** — the clause grammar (T7) assembles atoms with connective
   logic (contradiction → "yet", convergence → "and so"); 2–4 authored surface
   forms per atom, seeded per chart, kill repetition.
6. **Receipt** — every atom carries its source; the working is always one tap away.

---

## The scaling levers (how it keeps growing without ever "finishing")

- **Depth** — more degree-level tables (bounds delineated, monomoiria, decan
  images) multiply distinctness so two people with the same sign+house still
  diverge by degree.
- **Breadth by turning the chart** — read *any* topic from *any* house
  (a sibling's money = the 2nd from the 3rd; the partner's career = the 10th from
  the 7th). `derivedHouseOf` already generates this: 12×12×12 topic-cells, free.
- **Cross-testimony synthesis** — the real multiplier: compose 2–3 factors into
  ONE judged sentence (Venus in 8th + Venus □ Saturn + Venus peregrine → a single
  synthesised line on love, loss and what it costs). The output space is the space
  of *combinations of testimonies*, not of atoms.
- **Prediction** — directions × promittors × the profection lord × transits: the
  timing engine is itself combinatorial and already built (T triggers).
- **Optional flagged layers** — outer planets, asteroids, minor aspects, sidereal —
  each multiplies again, behind a setting.

---

## Coverage as a SPEC, enforced by the harness

"Bigger and more accurate than any other" only counts if there are **no gaps** and
**no generic fallbacks**. New tests:

- **Coverage matrix** — every (planet, sign), (planet, house), (aspect pair),
  (house-lord, house) resolves to an authored atom or a generated composition; CI
  fails on a hole.
- **No-generic** — no output may contain a placeholder / "this drive" / bare-sign
  fallback. Fail the build if one appears.
- **≥2-determinant** — sample thousands of composed sentences; each must cite two
  chart factors.
- **Variance** — two charts one degree apart must produce measurably different
  text (proves it's generative, not lookup).
- **Voice + golden + doctrine** — unchanged floor; golden pins judgement, so atoms
  can grow endlessly without moving the verdict.

---

## The expanded build (the even-bigger task list)

The 20-task plan stands; scaling splits its data tasks into ~40 shippable units,
each = *one atom table + its wiring + its coverage test*:

**Data (author + wire + test, each its own commit):**
S1 planet-in-house → extend 84 to 120 (add outer planets) ·
S2 planet-in-sign manner, Mercury ×12 · S3 Venus ×12 · S4 Mars ×12 ·
S5 Jupiter ×12 · S6 Saturn ×12 · S7 outer planets ×12 (flagged) ·
S8 aspect matrix: benefic pairs · S9 malefic pairs · S10 light-to-planet pairs ·
S11 mixed pairs · S12 reception forms · S13 terms/bounds delineated ·
S14 decan images delineated · S15 sign-pair/element blends ·
S16 derived-house topic phrasing · S17 dispositor-chain narration ·
S18 almuten adjudication phrases · S19 fixed-star meanings expanded ·
S20 mutual-reception & loop narration.

**Engine (the composition jobs):**
S21 select-by-prominence gate · S22 the clause grammar (T7) ·
S23 cross-testimony synthesis (the multiplier) · S24 ≥2-determinant enforcer ·
S25 variety banks (2–4 surface forms/atom) · S26 contradiction/convergence logic ·
S27 the topical composers (money/work/love/family/health/mind) ·
S28 the synthesis verdict · S29 receipts on every atom.

**Harness (make the scale provable):**
S30 coverage-matrix test · S31 no-generic test · S32 ≥2-determinant test ·
S33 variance test · S34 a corpus-size counter (atoms authored, output space est.).

**Interface:**
S35 magic zoom (T19) · S36 "Your life" topical section (T20) ·
S37 layout pass for the larger body of language · S38 final full audit.

Ship one unit per commit, harness-green each time. The corpus grows monotonically;
the output space grows multiplicatively; the judgement never moves.

## The claim we can then make, and defend

> Every sentence is composed from *your* chart's computed state, drawn from a
> hand-authored traditional corpus of thousands of fragments, combined the way
> Morin and Sonia teach — and each line shows its source. No cookbook, licensed or
> free, is state-selected or receipted; no LLM is sourced. On specificity,
> correctness, and provability at once, nothing else does this.
