# THE NARRATIVE ENGINE — 50 steps

A storytelling engine that reads a chart **the way Sonia reads it** — domains of a
life, not a personality profile; four testimonies to one judgment; analogy as the
selection key; three registers with no faked counsel — and turns it into
**countless chart-specific, time-based, ephemeris-driven narratives**.

Architecture: **Quality-Based Narrative (storylets)** — the *Fallen London* /
Kate-Compton-*Improv* pattern — married to traditional **determination**. The live
ephemeris is the world-state; delineations are storylets with chart-state
preconditions and prominence-salience; the sky's motion advances the storylines.

Each step is a full turn of work, shipped behind the harness floor (golden,
doctrine, 3-width UI audit, voice-book) and committed only when green.

---

## GOVERNING LAW — Sonia's method (from `doctrine-notes.md`, non-negotiable)

1. **Domains, not personality.** Houses are life-domains (career, marriage,
   children, parents, money, illness, death, travel). The reading is about the
   *domains of a life*. The modern reduction of astrology to "the self" is the
   school's core complaint — the engine must never make it.
2. **Planets are actors with natural + accidental effects.** Read a planet by what
   it RULES and OCCUPIES (its effect on domains), judged by state — not as "you".
3. **State ≠ circumstances.** Sign = zodiacal state (sound/strong/collapsing);
   house = terrestrial circumstances (what happens, where, with what force). Hold
   both; never blend.
4. **Benefics favour the domain they touch; malefics disturb it** — the domain,
   not the person.
5. **Four testimonies to one judgment** (§12): occupant (nature + what it rules) →
   lord's state (the promise) → aspects (circumstances) → karaka (confirmation),
   every clause carrying ≥2 chart-specific determinants.
6. **Analogy selects** which signification voices (joys → Chaldean → karaka →
   rulership → aspect → counter-analogy).
7. **Three registers**: objective (receipts), inspired (the composed synthesis,
   warmth after technique), expert (counsel) — and we **do NOT fake expert
   counsel**. No life-advice beyond what the configuration warrants.

---

## PHASE A — the narrative engine (the storylet/QBN core)

**1. The world-state model.** A single normalised `chartState` object: every
planet's house, sign, five dignity layers + score, sect concordance, angularity,
combustion/cazimi, retro/station, feral, every rulership (domicile + almuten),
dispositor, reception, each aspect (orb, applying, direction, both natures), the
almuten of every cusp, the zodiacal matrix per house. The queryable substrate.

**2. The storylet schema.** `{ when(state)→bool, salience(state)→number,
voice(state)→clause, receipt, src }`. Author storylets, never paragraphs. `when`
is a predicate over `chartState`; `salience` returns prominence; `voice` composes
the clause with its determinants; `receipt` traces to source.

**3. The salience/prominence scorer.** Extend the existing `prominence` engine into
the storylet ranker: angularity, dignity, sect, chart-rulership, almuten, aspect
tightness, joy, matrix-agreement, and (for timed storylets) directional/transit
activation. Salience decides what the reading LEADS with — never a flat list.

**4. The match-and-rank kernel.** Given `chartState`, evaluate all storylets'
`when`, rank the matches by `salience`, dedupe by determinant, and return the
ranked pool. The heart of QBN, and of "read what actually carries weight here".

**5. The Sonia-order composer.** Assemble the ranked storylets in her sequence
(Ascendant → captain → house-lords home → states → aspects → directions →
transits), not by salience alone — order is doctrine, salience is emphasis.

**6. The four-testimony synthesiser (§12).** For any domain, weave occupant → lord
state → aspects → karaka into ONE judgment with connectives (cause/concession/
contrast), enforcing ≥2 determinants per sentence. The model sentence-architecture
of the whole engine.

**7. The analogy selector (§6).** The function that answers "which signification
voices here": joys, Chaldean co-signification, karaka, rulership, aspect,
counter-analogy — in that priority. Already half-built (`ANALOGY_MATRIX`);
generalise it into the storylet `voice` chooser.

**8. The register gate (§11).** Objective clauses carry receipts; inspired clauses
add warmth only after the technique; the expert register is OFF by default and
never fabricates life-advice. A lint that fails the build on faked counsel.

## PHASE B — the determination content, as storylets (the libraries)

**9. Planet natural significations** (`SIG`) as storylets keyed by rulership +
occupation. **10. House significations** (`HOUSE_SIG`) as domain frames.
**11. Planet-in-house** (the 84 authored, extend to 120) as occupant storylets,
state-shaded. **12. Planet-in-sign** as state/manner storylets. **13. The five
dignity characters** (Ibn Ezra's images) as state storylets, sect-concordance
modified. **14. House-lord-in-house** — the cause-and-effect links (§7),
*generated* from `HOUSE_SIG × HOUSE_SIG` ("lord of II in IX: money comes through
the 9th's matters"), 144 cells free. **15. Aspect-by-matter** (§9, pipe/liquid):
every pair × aspect, judged by both natures × both states × what each rules,
direction-aware. **16. Reception & dispositor chains** as narrated links.
**17. Almuten adjudication** — the ruling voice that breaks contradictions (§5).
**18. The zodiacal matrix** (§8) as the confirmation layer, checked last, amplifying
agreements. **19. Degree storylets** — decan/face, Egyptian terms, anaretic/0°,
fixed stars, cazimi/combust — the fine shading. **20. Node amplify/reduce & sect
concordance** modifiers across all storylets.

## PHASE C — the domains (Sonia's 12-step method, one domain per step)

Each domain = house + occupants (nature + rulership) + lord's state (the promise) +
karaka + aspects + cause-effect links + matrix confirmation, synthesised, in the
three registers, no faked counsel.

**21. Temperament & body** (I, its lord, the season, the humoral balance — the
opener). **22. Money & resources** (II + XI lords, Fortune, VIII). **23. The near
mind & siblings** (III). **24. Home, father & roots** (IV). **25. Children,
creativity & pleasure** (V). **26. Work, health & the medical reading** (VI) — the full Cours-6 method:
life-forces (Asc, its lord, Sun, Moon) vs morbid forces (Mars, Saturn, lords of
VI/VIII/XII); which prevails; are the life-forces afflicted; then the afflicted
body-zones by the maximum of concordant testimonies (the sign/house/planet
tables), with the Raphael planet-in-sign disease matrix as storylets — fired only
where a life-force is actually afflicted, dated by directions/returns, and always
in the reassurance register: "the tradition watches this zone", never a diagnosis
(the expert register we never fake). **27. Marriage &
open partnership** (VII, its lord's house, Venus/Mars, receptions). **28. Death,
legacy & the deep** (VIII). **29. Belief, travel & higher learning** (IX).
**30. Career, reputation & the mother** (X, its almuten, karakas). **31. Friends,
allies & hopes** (XI). **32. The hidden life & self-undoing** (XII).

## PHASE D — the storytelling layer (cast, stages, arcs)

**33. Cast & stage model.** Planets as characters (with their natures and states),
houses as stages, the aspects as relationships between characters — the dramatic
skeleton the prose sits on. **34. Domain storylines with arcs.** Each domain read
as a small arc: the promise (lord's state), the setting (house), the complication
(malefic aspect / counter-analogy), the resolution (benefic testimony / reception).
**35. The throughline.** The chart's single insistent theme (the almuten of the
chart, the tightest configuration, the matrix's loudest agreement) — the spine the
whole narrative returns to. **36. Contradiction & convergence logic.** Where
testimonies disagree, the almuten adjudicates and the sentence says so; where they
converge, the matrix confirms and the thing is larger in the life. **37. Variety &
voice.** 2–4 authored surface forms per storylet, seeded per chart; the "inspired"
register warmth; anti-repetition across the whole reading.

## PHASE E — time: the ephemeris drives the story (the innovation)

**38. Directions as events + the DERIVED-HOUSES FAN-OUT (Cours 5).** Symbolic
directions (1°/yr; solar arc to refine) are the primary prediction engine: a mover
reaching a factor by conjunction/aspect is a dated plot event, read by what the
mover rules/occupies, decided by analogy, its duration set by the natal target's
state, its sign-changes their own events — and **only what the theme promises**
(the static domains of Phase C gate it). Then the multiplier: **derive the chart
from each person-house** (III sibling · IV father · V child · VII spouse · IX
teacher · X mother · XI friend · XII enemy) and re-read the SAME direction from
their vantage — one motion narrates the whole cast's year. This is the engine of
countless, time-based narratives.
**39. The profection lord as the year's protagonist.** The annual/monthly time-lord
foregrounds one domain's storyline; the reading re-weights salience toward it.
**40. Transits as triggers on live wires (last).** A transit only advances a
storyline where a direction/profection/captain already lit it — the trigger
doctrine, as story beats, dated. **41. The daily narrative.** Compose Today as the
day's beat on the active storylines (not a generic transit list): which character
steps forward on which stage, and only where it strikes a live wire. **42. The year
ahead as a chapter.** Profection + directions + returns woven into a dated
storyline of the year. **43. Returns & eclipses as scene-changes.** Solar return as
the year's stage-set; eclipses as act-breaks on the houses they fall in.

## PHASE F — the interface (every element explanatory, beautiful, useful)

**44. "Your life" — the domain reading, laid out.** Replace the planet-zoom-as-self
primary view with the domain reading (Phase C): a calm section per life-area, each
its own storyline, receipts one tap under. **45. The chart as a story.** The wheel
as the stage with its cast; tapping a house opens its storyline, tapping a planet
shows the character (its natures, states, and every storyline it acts in).
**46. The timeline.** A scrollable life-and-year timeline of directional events and
triggered transits — the ephemeris-driven narrative, navigable. **47. The magic
zoom & motion** (T19) reframed: zoom into a HOUSE (a domain/stage), its storyline
laying itself out; the planet-zoom becomes the character sheet. **48. Layout &
pacing pass** across every screen so the far larger body of language reads as
story, never a wall — the three registers visually distinct.

## PHASE G — make the scale provable & correct

**49. The narrative harness.** Coverage (every domain, storylet class, aspect pair,
degree resolves); no-generic; ≥2-determinant enforcement; variance (two nearby
charts, and two nearby DATES, diverge); the register lint (no faked counsel);
voice-book; and golden pinning the JUDGEMENT so language can grow without moving
the verdict. **50. The corpus + output-space counter and a final full audit** — the
authored-storylet count, the estimated distinct-narrative space (natal × time), and
a whole-app pass confirming every element reads in Sonia's method and voice.

---

### Sequencing
A (engine) → B (content as storylets) → C (the domains) → D (storytelling) →
E (time) → F (interface) → G (proof). Ship one step per turn; the storylet corpus
grows monotonically, the narrative space grows multiplicatively with the ephemeris,
and the judgement never moves off Sonia's method.

### The test
Hide the receipts. Sonia reads the output for a chart, on a given day, and says
"yes — that is the chart, and that is how I read it." Change the date; the story
advances truthfully. No personality-profile drift, no faked counsel, ever.
