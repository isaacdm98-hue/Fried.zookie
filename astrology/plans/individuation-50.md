# The individuation plan — 50 improvements

**Goal.** The engine already judges correctly. What it does not yet do is make the reader feel
that no other chart could have produced these words. Every task below is aimed at one thing:
*this* nativity, named, with its own numbers, its own tensions and its own silences.

**Doctrine anchor (non-negotiable).** Domains of a life, never a personality profile. State (sign)
and circumstance (house) held apart. Four testimonies to one judgment. Benefics favour the domain
they touch; malefics disturb it. Transits last, and only on a live wire. Expert counsel is never
faked. ≥2 chart-specific determinants per sentence, and every line carries a receipt.

**Rule for the whole plan.** No task may add a lookup table of pre-written character text. Every
new sentence must be *composed* from computed values. If a task cannot be done without a bank of
prose about people, it is the wrong task.

---

## Measured baseline (tests/individuation.cjs)

The harness reads 408 composed passages across 12 charts spanning every season, both hemispheres,
day and night births, four decades and extreme latitudes.

| measure | at first run | after tasks 1, 45, 46, 47 |
|---|---|---|
| sentences naming fewer than two chart-specific things | **52.6%** (1510/2870) | **28.7%** (792/2762) |
| verbatim sentences shared by half the charts or more | 53 | 34 |
| sentence frames shared by half the charts or more | 78 | 60 |
| receipts with no hand-checkable value | 46 | **0** |

Movement B added the rarity engine on measured frequencies (tasks 11–14 done); tasks 15–18 remain.

The first run is the important number: more than half the reading could have been about anyone.
The largest single cause was not a shortage of variety but a **category error** — see task 1's
note below. The ceiling in the harness is set at 32% and is meant to be tightened with each
movement completed.

---

## Movement A — the sentence can only be about this chart (1–10)

1. **Determinant floor per sentence, enforced.** ✅ *Done.* The stress harness counted determinants
   per *passage*, which is far too coarse — a paragraph passes on its first sentence while the
   other six say nothing chart-specific. Counted per sentence, 52.6% of the reading failed.

   **What it found, and why it matters more than the number.** The most-repeated sentences were
   *"By nature it is hot and dry, the choleric fire at full"* (identical on all 12 charts) and a
   list of virtues or faults keyed only to strong/weak (8 of 12). Both are statements about the
   **planet** — true of Mars in every chart ever cast. By the method's own standard a sentence that
   cannot vary is a definition, not a judgment; and the virtue list is the personality register the
   method forbids outright. So this was never a variety problem. The universal layer had been given
   equal billing with the particular one. The nature is now a subordinate clause on a sentence whose
   subject is the houses **this** planet answers for, and the virtue list is gone.

   Three further gaps the same measurement exposed:
   - The peregrine image ends *"…and its dispositor decides what it can finally deliver"* and then
     never said which planet that was — a gap in the reading and the most individuating fact in the
     sentence.
   - The debility clause emitted a raw layer name and three em-dashes: *"though face — in its fine
     clothes at the door — dignified in appearance, fragile in substance — tempers the worst of it."*
   - Topical verdicts closed on a line that could be pasted onto any chart. They now name how many
     significators were weighed and which one led them (task 24, brought forward).
2. **Exact degrees in the lead, not the tail.** `placementProse` opens with house and sign, and
   only later reaches the degree. Lead with the degree when it is doing work (0°, 29°, a bound
   boundary, a fixed star inside 1°) — those are the cases where the degree *is* the story.
3. **Orb as meaning, not decoration.** Aspect sentences state the orb; they should let it change
   the verb. Under 1° is "welded"; 1–3° "closely"; 3–6° "loosely, and it needs a trigger". Compose
   from `A.orb / A.asp.orb`, which the engine already has.
4. **Applying vs separating, read as biography.** The engine knows `A.applying`. An applying
   natal aspect grows louder with age; a separating one was loudest early. Say which, once, in the
   tightest-aspect chapter — it is one of the few genuinely biographical facts a chart yields.
5. **The lord's own journey.** When a house-lord sits in another house, name the *pair* as a route
   ("the 7th's business is transacted on the 11th's ground"), then say what that route costs or
   saves, from the lord's condition. The route is unique to the chart; the phrasing currently is not.
6. **Reception named, always, where it exists.** `receptionOf` is computed but surfaced unevenly.
   Any judged sentence whose two planets are in reception should say so — but **not** as a rarity:
   task 14 measured mutual reception somewhere in the chart at 67%, so the claim this task
   originally made ("the single most individuating relation") is false at chart level. It is worth
   naming because it changes the *judgment*, not because it is unusual.
7. **Antiscia on the angles only.** The engine computes antiscia; most of it is noise. Surface it
   only where a mirror degree falls within 1° of the Ascendant, Midheaven, Sun or Moon, and say
   plainly what a mirror degree is. Rare, so it individuates when present.
8. **Bounds (terms) as a sentence, not a score.** A planet in its own bound is "secure but
   restricted" (the tradition's man-in-his-own-seat). Only about a sixth of placements are; say it
   when true rather than folding it silently into the ledger.
9. **The dispositor chain read to its end, in words.** `finalDispositors` computes where each
   planet's chain terminates. Read the chain for the chart's *captain* as a sentence: "your life
   reports to Venus, Venus answers to Saturn, and Saturn answers to no one — Saturn is the last word."
   Chain shapes differ chart to chart; some loop, some end in one planet, some in mutual reception.
10. **Retrograde read as timing, not character.** Retrogradation currently appears as a ledger
    debit. Say what the tradition says: what it signifies arrives late, returns, or must be done
    twice. Attach it to the *domain* the planet rules, never to the person.

## Movement B — the configurations this chart actually has (11–18)

> **Corrected after review.** This movement was originally written as "what is rare in this chart",
> and built that way. It was wrong. Telling somebody that 38 charts in a hundred share their stellium
> is demographic trivia: it compares them to a population instead of reading their life, and it breaks
> the register by having the app talk about its own sample. The method reads the domains of *a life*;
> it does not rank nativities.
>
> The detection survives; the framing is gone. Each configuration is now read as what it does to the
> houses **this** chart's planets answer for, titled by what it says ("Where this chart concentrates",
> "The planet that answers to nothing"). The measured frequencies are kept for exactly one purpose —
> deciding which of a chart's configurations leads — and are never spoken, never printed, and never
> reach a receipt. Receipts name the chart's own facts: planets, degrees, houses, the lord in play.

11. **A configuration engine.** ✅ *Done.* `chartFeatures(c, b)` detects ten named configurations and
    reads each as what it does to the houses this chart's planets answer for — naming the planets,
    their degrees, the house they crowd, and the lord they have to work through. Detection mirrors
    the baseline script, so the ordering signal and the detector cannot drift apart.
12. **Lead on the chart's own configuration.** ✅ *Done, reframed.* The Read screen opens on this
    chart's most distinctive configuration, titled by what it says rather than by how rare it is.
    Frequency picks the order and is never shown.
13. **~~Say when something is common.~~** *Dropped as a category error.* This task existed to keep the
    rarity claims honest — and the fix is not a better disclaimer but not making the claim. A chart
    with no named configuration now simply proceeds to its lords, which is what the method does anyway.
    (Its one useful by-product: the first version asserted *"no planet stands unaspected"* on a chart
    that had one, which is why every generated negative is now checked against the detector.)
14. **Distribution baselines, computed not asserted.** ✅ *Done, and it corrected the plan itself.*
    `tests/rarity-baseline.cjs` measures each feature over 400 deterministic charts — every month,
    every hour of the clock, both hemispheres, six decades — and writes `corpus-rarity.json`.

    **Two of this plan's own assumptions were wrong, and only measuring found it.** Task 6 below
    called mutual reception "the single most individuating relation in the chart — most pairs do not
    have it". Per *pair* that is true; as a chart feature it occurs in **67%** of charts, so leading
    with it as a rarity would be flattery. And out-of-bounds, which this app files under "rare
    conditions", occurs in **46%**. Measured frequencies, rarest first: cazimi 1.5%, Lot of Fortune
    on an angle 3.8%, Ascendant lord in the 1st 5.0%, no planet angular 9.0%, three or more
    retrograde 15.3%, four or more angular 20.3%, two or more in domicile 21.3%.
15. **The chart's shape as circumstance, not archetype.** Bowl/bucket/locomotive were removed as
    pop. Reinstate only the *computable* fact with a domain reading: "every planet you have falls
    in five signs, so the life concentrates" — no personality claim.
16. **Angular concentration.** Count planets in the 1st/4th/7th/10th. A chart with four angular
    planets is genuinely different from one with none, and the tradition says so directly:
    angular matters happen in the open.
17. **Hemisphere as circumstance.** Above/below the horizon, east/west of the meridian. Read as
    where the life's business is transacted (in public vs in private; through the self vs through
    others), which is the traditional reading, not the modern psychological one.
18. **Sect strength.** Whether the chart's own light (Sun by day, Moon by night) is itself strong
    or weak reframes everything downstream. Say it once, early, and let the topical chapters
    reference it.

## Movement C — the recurring hand (19–25)

19. **Cross-domain recurrence.** If Saturn answers for money, career and family in one chart, the
    reading should say so on the third appearance: "this is the third domain Saturn has answered
    for — one hand is running much of this life." Compute from the rulership map.
20. **A recurrence budget.** Conversely, cap how often one planet's delineation is restated. Once
    named as the recurring hand, later chapters reference it instead of re-deriving it.
21. **The chart's busiest degree.** Where several bodies, cusps and Lots crowd within a couple of
    degrees, name that degree as the chart's pressure point and list what meets there.
22. **Contradiction surfaced as tension.** `contradictions` exists. Give it a chapter: where two
    testimonies genuinely disagree, say so, name both, and say which is likelier to be triggered
    and when — never average them.
23. **The chart's agreement.** The inverse: where three or more testimonies concur, that is the
    most reliable statement the chart can make. Say it, and say it *is* the most reliable.
24. **Weight the verdict by testimony count.** A domain judged on four testimonies deserves a
    firmer verb than one judged on two. Surface the count in the receipt and soften the prose when
    the evidence is thin.
25. **A per-chart confidence line.** One sentence, once: how much this chart can be said about with
    confidence, given birth-time certainty, testimony agreement, and how many domains rest on the
    same planet.

## Movement D — absences and silences (26–31)

26. **The unaspected planet as a first-class beat.** A planet aspecting nothing classical acts
    alone and unmoderated. Rare, highly individuating, and the tradition has a clear reading.
27. **Empty elements and modalities, as circumstance.** No water; no fixed signs. Read as what the
    chart has no native supply of, in domain terms, with the compensating testimony named.
28. **Empty houses that still matter.** A house with no occupant is read entirely from its lord.
    Say that explicitly the first time it happens, because it teaches the method and it is true of
    most houses in most charts.
29. **The house nobody rules twice.** Where one planet rules two of a topic's houses, the topic
    stands or falls together — already handled. Extend it: name the domains that share a fate.
30. **What the chart cannot say.** With no birth time, say precisely which chapters are closed and
    why, per chapter, at the point of use — not once in a preamble.
31. **Missing-benefic and missing-malefic cases.** No benefic angular; no malefic aspecting the
    Ascendant. Absence of a disturbing force is a real testimony and should be spoken as one.

## Movement E — this chart in time (32–38)

32. **The next dated event, in months not years.** Directions are computed to a fractional age;
    convert to an actual month and year. "Around 2027" is vague to someone reading in 2026.
33. **The current time-lord stack in one sentence.** Profection lord, Zodiacal Releasing chapter,
    Firdaria period and bound-distributor agree or disagree. Say which, because agreement across
    clocks is the tradition's own confidence signal.
34. **Peak and valley, named by date.** Zodiacal Releasing peaks (angular to the Lot of Fortune)
    and loosings of the bond are datable. Give the reader the actual years.
35. **The solar return read against the natal, not alone.** The doctrine already says never read
    the return alone. Enforce it in composition: every return statement must name the natal promise
    it is triggering.
36. **Age-anchored biography.** For each bound-distributor span, state the ages and the years, and
    name the domain that span governs. This is the most personal timeline a chart can produce.
37. **Transit relevance, quantified.** A transit's weight is orb × whether it strikes a live wire ×
    the natal planet's condition. Compute a single relevance figure and sort by it, so the reader's
    "today" is genuinely their loudest contact.
38. **The quiet day, said well.** When nothing strikes a live wire, say so without inventing
    weather. This is already right in the doctrine line; make sure every daily surface honours it.

## Movement F — the reader's own life (39–44)

39. **Their name, used sparingly and well.** The birth record has a name field. Use it at the
    opening of the reading and nowhere else, so it lands.
40. **Their birthplace in the reading.** Latitude changes the houses; a polar or equatorial birth
    genuinely changes the chart's shape. Say so where it matters.
41. **Their people, properly framed.** The derived-house fan-out is computed. Introduce the move
    once, in plain words, before using it, and never emit a bare label like "your pet".
42. **Their saved people, cross-referenced.** Where a person has been added, name the real contacts
    between the two charts in the domain chapters, not only in a separate synastry screen.
43. **Their year, on their birthday.** The profection year turns on the birthday. Say how many days
    until it turns and what the next lord will be — a concrete, personal, datable fact.
44. **Their questions.** A short set of chart-specific questions the reading can actually answer
    ("why does money come through other people in my chart?"), generated from the chart's own
    structure and linked to the chapter that answers them.

## Movement G — proving it is personal (45–50)

45. **The uniqueness harness.** ✅ *Done.* Measures verbatim inter-chart sentence overlap per
    chapter. Doctrine lines — the ones that state the method rather than the nativity — are declared
    in an explicit exempt list rather than hidden behind a threshold, so the exemption is reviewable.
46. **Template-echo lint.** ✅ *Done.* Masks every determinant and reports which sentence *frames*
    repeat. This catches the subtler failure: text that differs on every chart and is still the
    same sentence.
47. **Receipt completeness.** ✅ *Done, 46 → 0.* Temperament now names the rising degree its
    testimonies were read from; health names the rising degree and the Ascendant lord's score; the
    ruling voice and the sect profile name their planets' Lilly totals. Every judged beat can now
    be checked by hand against an ephemeris.
48. **Determinant provenance.** Assert in tests that each topical verdict's receipt names the
    testimonies that actually produced it, so the working can never drift from the words.
49. **A golden individuation baseline.** Extend `golden.json` from verdicts to a hash of the
    *chapter structure* chosen per chart (which beats, in which order), so a change in what the
    engine chooses to lead with is a recorded decision rather than an accident.
50. **The read-aloud pass.** A harness that dumps a full reading per reference chart and checks it
    against the plain-language, prose-lint and determinant floors together — one command that
    answers "would a person recognise themselves in this?" as far as a machine can.

---

## Sequencing

- **First**, tasks 1, 45, 46 and 47. They are the instruments; without them the rest is taste.
- **Then** Movement B (rarity), because leading with what is rare is the largest single gain in
  feeling personal, and it is mostly computation the engine already performs.
- **Then** Movements C and D (recurrence, absence) — the two things a reader recognises fastest.
- **Then** Movement E (time), which is where the reading becomes usable rather than descriptive.
- **Movement F last**, because it depends on the others being solid, and because it touches the
  surfaces most likely to need judgement on a real device.

## What this plan deliberately does not do

- No new prose banks about people. Every sentence stays composed from computed values.
- No modern psychological layer returns under a new name.
- No claim of rarity without a measured baseline behind it.
- No expert counsel invented in any register.
