# THE INTERPRETATION ENGINE — 20 tasks

Build a large, correct, chart-specific interpretation system: an engine of
sentences that says what THIS exact chart means, the way a trained astrologer
would — grounded in the tradition's own delineations (already half-written in
`DATA.SIG` / `DATA.HOUSE_SIG` / `ANALOGY_MATRIX`, and in the Cours Préparatoires
lessons), never vague, never pop. Plus the UI the reading deserves.

Every task ships behind the harness floor (golden, doctrine, 3-width UI audit,
voice-book) and is committed only when green. Golden pins the JUDGED MEANING, so
the words get far more specific while the underlying judgment stays fixed.

## Governing law — Sonia's methodology and the books (non-negotiable)

Every sentence this engine composes follows **Sonia's method and the Cours
Préparatoires** (Jordan Marion's ateliers), not modern cookbook astrology:
- **Read in her order:** the Ascendant first → its lord, the *captain* → the
  house-lords followed home → each planet in its true state (the five dignities) →
  aspects judged by the *nature* of the planets, not the angle → prediction by
  symbolic **directions first**, transits **last** as triggers on live wires.
- **Determinants, not decoration:** ≥2 chart-specific determinants per composed
  sentence; a line that could be said to anyone is a defect.
- **Sources, always:** every delineation traces to the tradition (Lilly, Morin,
  al-Biruni, Ptolemy) and the ateliers, in our own public-domain-safe words, with
  a receipt. The banks (SIG, HOUSE_SIG, ANALOGY_MATRIX, dignities, almuten) were
  already built to this doctrine and verified against the two PDFs.
- **Voice book:** concrete but not fatalist; no energy/universe/cosmic/vibes/
  manifest/soulmate/"your journey"/pop-equations. Inclination, not decree.

Where a task below says "delineate", it means *delineate the way she teaches it* —
from the state, in that order, with the receipt.

---

## Part I — the language & interpretation engine (the core)

**T1 · The state-interpreter (`interpret(det)`).** The foundational selector.
Turn a `determination` into a structured bundle of delineation choices driven by
the real state: which `SIG.qualities` clause (well- vs poorly-placed) fires; how
sect inflects (benefic clean vs over-promising, malefic biting vs testing);
whether reception/dispositor routes delivery "through" another planet;
combustion/cazimi/retrograde/angularity/void as concrete modifiers; the band
(commanding→afflicted) as the confidence of delivery. Output is data, not prose —
every later task composes from it. This is what makes the same placement read
generously when strong and cautiously when weak.

**T2 · Planet character, delivered.** Wire `SIG.qualities` into the placement
delineation: the well-placed clause for dignified/strong planets, the
poorly-placed clause for debilitated/peregrine ones, blended with the specific
degree of strength (a +2 "mixed" planet gets "the gift is real but comes and
goes," not a flat verdict). This is the "who you are through this planet" line.

**T3 · The house, in its real matters.** Replace the single `AREA9` phrase with
`HOUSE_SIG[house].matters` narrowed by the planet's `karakas` and led by
`ANALOGY_MATRIX` — the concrete life-matters of the placement ("gain through the
partner, legacies and the goods of the dead; a pull toward the hidden and the
intense"), not one abstract noun.

**T4 · Planet-in-sign manner.** Build a delineation for how the SIGN shapes the
planet — the manner, temper and style it acts in (Mars in Cancer defends and
sulks; Mars in Aries charges) — as its own clause, drawn from element × modality
× the sign's classical character, selected into the placement read.

**T5 · The planet×house delineation matrix (7×12, concrete Lilly).** A large,
authored matrix of concrete life-reads for each classical planet in each house
(Lilly CA I, the house chapters; Morin) — "Venus in the 6th: pleasure taken in
service and in small animals; love among colleagues; health touched through the
kidneys and the sweet tooth." Selected and shaded by state. The backbone of
specificity.

**T6 · Aspect delineation by matter.** An aspect isn't "square, tension" — it's a
conversation between two MATTERS judged by two natures. Compose what a specific
aspect means for the two significations it joins (Moon square Saturn = "the need
for closeness meets the fear of it; comfort has to be earned, and often feels
rationed"), inflected by orb, applying/separating, and reception.

**T7 · The sentence-composition engine.** A clause grammar that assembles the
pieces (subject · character · sign-manner · house-matter · aspect · counsel ·
receipt) into varied, natural paragraphs — seeded per chart so no two nativities
read alike, with connective logic (contrast, cause, concession) rather than
bolted phrases. The thing that makes it read like writing, not a template. Anti-
repetition across the whole reading.

**T8 · Reception & dispositor chains as story.** Follow the dispositor chains and
receptions and narrate them: "your Venus answers to Mars, so what you love is
handed to how you fight — you want what you have to work for." Final dispositors,
mutual receptions, and the chain to a dignified planet become real sentences.

**T9 · Almuten & the ruling voice.** Surface the almuten of the chart and the
almuten of each house as "the planet with the final say here," and let it
adjudicate contradictions in the reading (when two testimonies disagree, name who
wins and why). The chart's single ruling voice, delivered.

**T10 · Degree-level specificity.** Fold decan/face, term/bound, the anaretic and
0° degrees, fixed-star conjunctions, and cazimi/combustion into the delineation as
concrete shading, not footnotes — so two people with Venus in Taurus in the 8th
still read differently by degree.

## Part II — the topical reads (what a client asks for)

**T11 · Money & resources.** 2nd house + its lord's condition + occupants + the
Part of Fortune + the 8th (other people's money): where wealth gathers, where it
leaks, by what means, with the practical counsel.

**T12 · Work, calling & reputation.** 10th + its lord + the almuten of the MC +
`SIG.vocations` of Mars/Mercury/Venus/Saturn + the 6th (daily work): what you're
built to do and how the world receives it.

**T13 · Love, marriage & desire.** 7th + its lord + Venus and Mars by condition +
receptions into the 7th + the 5th (romance): how you bond, what draws you, the
cast of the partner, the pattern to watch.

**T14 · Family, home & children.** 4th (father, roots, the end of matters) + 10th
(mother) + 5th (children) + the Moon and Saturn: the home you came from, the one
you make, the line.

**T15 · Body, health & temperament.** 1st + its lord + the 6th + `SIG.body` of the
afflicted planets + the elemental/humoral balance: the constitution, its weak
points, the practical care.

**T16 · Mind, character & the first impression.** Mercury + the Moon + the
Ascendant-lord + the rising sign and its season: how you think, how you come
across, the manner people meet first. The temperament read a reader opens with.

**T17 · The synthesis verdict.** The reader's closing: the throughline the chart
keeps insisting on, your two or three real strengths (dignified significators in
good houses), your two or three real trials (afflicted significators, malefics in
bad houses, the out-of-sect malefic), and what to lean on and budget for — one
honest, chart-specific paragraph.

## Part III — the interface it deserves

**T18 · Bring back the element stick; lay the chart screen out well.** Restore the
fire/earth/air/water element bar (the living "stick") on the chart screen, sized
and placed so it reads at a glance without breaking the one-frame fit; retune the
whole chart layout (header, stick, wheel, anchors, today line) into a clean,
balanced column. Give the Ascendant a proper symbol in its anchor box (not a "?").

**T19 · Names in the wheel + the magic zoom.** Make the sign names on the wheel
fit and stay legible at every width (rework `arcWord9`). Make the tap-to-zoom into
a planet more magical: a richer bloom-and-travel, the chart dissolving into the
one circle, the delineation laying itself out in and around the circle in a paced,
beautiful reveal — with the receipts tucked under a "show the working" toggle.

**T20 · Surface "Your life" and lay it all out.** Give the topical reads (T11–17)
a real home in Read — a "Your life" section, each department a calm card with its
counsel — and do a layout pass across every screen so the new, much larger body of
language is well-paced, scannable, and never a wall. Extend the golden/voice
harness to cover the new engine, and a final full audit.

---

### Sequencing
T1 → T2–T4 (placement clauses) → T5–T6 (matrices) → T7 (the grammar) →
T8–T10 (chains, ruling voice, degrees) → T11–T17 (topical reads, in the order a
reader gives them) → T18–T20 (the interface), with T18's quick UI wins (element
stick, Asc symbol) pulled early as visible progress. Voice + golden every step.

### The test
Hide the receipts. A working astrologer reads the output and says "yes — that's
what I'd tell this person." A beginner finishes knowing concrete things about
their life, not facts about their chart.

---

## What Astro Gold and Astro.com actually use — and how we beat cookbook apps without AI

**They are not generative engines.** Both split into two parts:
- **Calculation:** the **Swiss Ephemeris** (open source, AGPL/commercial —
  authored by Astrodienst themselves; `github.com/aloistr/swisseph`). Astro Gold
  and effectively every serious app calls it. It computes positions; it does NOT
  interpret.
- **Interpretation:** large **human-authored cookbook text**, licensed and
  proprietary — Liz Greene / Robert Hand paragraphs on Astro.com; the Solar Fire
  interpretation files behind Astro Gold. Specificity there = *looking up and
  concatenating* many pre-written paragraphs, one per placement. It is a database,
  not an engine, and it is copyrighted — never on GitHub.

We deliberately differ on both: **astronomy-engine (MIT)**, not Swiss Ephemeris
(so no copyleft), and a **composed, source-traceable engine**, not licensed
cookbook prose. That's the opening to do something they can't: a reading where
every sentence is *synthesised from this exact chart* and *carries its receipt*.

### How a deterministic engine reaches "verging on language-model" specificity — no AI

An LLM feels specific because it fuses many factors into one sentence and never
repeats itself. We reproduce that mechanically, and gain traceability they lack:

1. **Combinatorial depth, not lookup.** Compose each sentence from the
   *intersection* of many factors — planet × sign × house × five dignity layers ×
   sect × aspects (orb, applying, reception) × dispositor chain × degree
   (decan/term/face, anaretic/0°) × almuten × fixed stars × lunar phase. The
   distinct-state count is astronomical, so the output is effectively unique per
   chart. Cookbook apps combine ~3 factors per paragraph; we combine ten-plus.
2. **The ≥2-determinant rule (Sonia's).** Every composed sentence must cite at
   least two *chart-specific* determinants. Enforced by the composer — this is the
   single rule that kills vagueness. A sentence that could be said to anyone is a
   bug.
3. **Synthesis, not a list.** Cookbook apps print placements independently, so
   they read generic. We *reconcile* — when two testimonies disagree, the almuten
   and the receptions decide who wins, and the sentence says so. Judgement is the
   specificity.
4. **A clause grammar, not templates.** Sentence *structure* follows chart
   structure: a contradiction in the chart yields a "yet/but" sentence, a
   convergence an "and so." Connective logic (cause, concession, contrast) plus
   seeded variety banks give LLM-like non-repetition.
5. **The tradition IS the training set.** An LLM learned astrology from Lilly,
   Morin, al-Biruni, Ptolemy and the modern teachers. We encode the *same* corpus
   as structured delineation banks (SIG, HOUSE_SIG, ANALOGY_MATRIX, the T5 7×12
   matrix, planet-in-sign, aspect-by-matter) — the same knowledge, indexed
   deterministically, in our own public-domain-safe words and the Cours
   Préparatoires method.
6. **Total coverage as a spec.** "Fully comprehensive" = every placement, every
   house, every aspect, every dignity state has an authored delineation and a
   synthesis path — no silent gaps, no "planet in sign" fallbacks. The harness
   asserts coverage (no chart produces a generic line).

The honest ceiling: a deterministic engine won't *invent* fresh metaphor the way
an LLM can. But on the things that matter here — **specificity, correctness, and
a receipt on every claim** — it can match or beat both the cookbook apps and a
raw LLM, because it combines more factors, judges instead of lists, and can prove
every sentence.
