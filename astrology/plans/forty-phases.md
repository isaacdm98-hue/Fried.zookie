# THE FORTY PHASES
## Rebuilding the reading engine to judge, not describe

**The problem, stated by the owner:** "Directed Ascendant squares your Venus —
so what does that MEAN? You're not interpreting. You're telling us what it
does." Correct. The engine currently produces ephemeris facts wearing prose.
A real astrologer produces **judgments**: what this configuration means for
THIS person, derived by method, defensible from doctrine.

**The doctrinal spine** (the authors Sonia named, plus the tradition they
stand in — all pre-modern, out of copyright; we write our own words from
their method, and cite):

- **Ptolemy**, *Tetrabiblos* (2nd c.) — aspect doctrine, dignities frame
- **Dorotheus of Sidon**, *Carmen Astrologicum* (1st c.) — triplicities, timing
- **Firmicus Maternus**, *Mathesis* (4th c.) — house delineations
- **Mashallah ibn Athari** (8th c.) — *On Nativities*, *On Reception* — reception doctrine
- **Abu Ma'shar** (9th c.) — directions through the bounds (distributors)
- **Al-Biruni**, *Book of Instruction* (1029) — significations, terminology
- **Guido Bonatti**, *Liber Astronomiae* (13th c.) — judgment hierarchy
- **Jean-Baptiste Morin de Villefranche**, *Astrologia Gallica* (1661) —
  **Book 21 (determinations): the core of the whole rebuild**; Book 22 (directions)
- **William Lilly**, *Christian Astrology* (1647) — significations, house method

**The one idea that fixes everything (Morin, Book 21):** a planet has no
meaning in the abstract. Its meaning in a chart is its **determination**:
(1) the house it occupies, (2) the houses it RULES, (3) its state (essential
+ accidental dignity), (4) its nature (benefic/malefic, modified by sect),
(5) its receptions and aspects. Every delineation in the app — natal,
directed, transiting — must be composed FROM a planet's determination,
never from "Venus = love" keyword tables.

**The register to hit** — the promise, shown on the example that triggered
this plan (Libra rising, Venus in Taurus in the 8th, domicile):

> BEFORE (now): "Directed Ascendant reaches a square to your natal Venus
> around age 37.5 (2028) — a bent pipe between the two."
>
> AFTER (phase 17): "Around thirty-seven, the directed Ascendant — the
> moving edge of the life itself — squares Venus. In your chart Venus is
> not an ornament: she is Lady of the Ascendant, the captain, and she
> keeps her court in your 8th house — other people's money, inheritance,
> the depths — in her own sign, strong. So this is the year the life
> collides with its own captain's business: an identity renegotiated
> through entanglements of the shared purse and of loss. A square is
> work — the pipe is bent, nothing flows straight — but a dignified
> benefic pays what she owes: expect the friction to end in a settlement,
> not a wound. (Morin: the direction of the ASC to the lord of the ASC
> in the 8th judges by the 8th's matters and the lord's state.)"

That is the depth bar for every phase below. Nothing ships that reads
thinner than that.

---

## MOVEMENT I — THE DOCTRINE OF MEANING (phases 1–5)
*Build the formal model before a single sentence.*

**1. The determination model.** Data structure per planet: house occupied;
houses ruled (traditional rulerships; whole cusp-map); natural
significations; state vector; nature (with sect modification); receptions;
aspects. One function `determination(c, planet)` returns the complete
"what this planet is IN THIS CHART" object. Acceptance: for 5 reference
charts, the object matches a hand-worked Morin-style determination sheet.

**2. Natural significations bank.** For each of the 7 traditional planets
(+ outers, marked modern): persons, matters, qualities, body, vocations —
from Lilly CA Book 1 and al-Biruni, rewritten in house voice. Acceptance:
each planet's entry is source-tagged and reads as intelligent prose, not
keyword lists.

**3. House significations bank.** The 12 houses in full traditional
signification (Lilly, Firmicus, Bonatti): matters, persons, body parts,
the derived-house logic (the 8th is the 2nd of the 7th…). Acceptance:
derived-house reasoning available to the composer ("your partner's money").

**4. The state machine.** Essential dignity in five layers (domicile,
exaltation, triplicity-by-sect, Egyptian terms, face) + debilities +
**accidental** state (angularity, speed, direct/retro, combustion, cazimi,
under beams, besiegement, joy) → one articulate condition verdict with
its arithmetic shown. Acceptance: Lilly's own point-scoring reproduced on
his example charts.

**5. Nature and sect.** Benefic/malefic modified by sect (Fortuna/Infortuna
in and out of sect); the malefic contrary to sect named as the chart's
sharpest tooth; the benefic of sect as its readiest help. Acceptance: every
chart names its helper and its tooth, with reasons.

## MOVEMENT II — JUDGING THE NATAL CHART (phases 6–10)
*Sonia's order: Ascendant → its lord → the houses.*

**6. The Ascendant judged.** Rising sign + its lord's determination +
planets on/in aspect to the ASC → temperament and body, Lilly's method.
Not "your personality": the constitution.

**7. The Lord of the Ascendant, fully.** The captain's complete
determination delivered as the keystone paragraph: where he stands, what
he rules, his state, who receives him, what that promises and what it
costs. This paragraph is the heart of the natal reading.

**8. The rulership web.** The full directed graph: every planet → houses
ruled → dispositor chains → final dispositors. Rendered reasoning:
"your 10th answers to Mars, Mars answers to Venus, so the career
ultimately reports to the captain." Sonia: "each planet is related with
one or multiple houses, and the link is the reading."

**9. House-by-house judgment.** For each of the 12: ruler's state and
place + occupants + aspects to cusp and ruler → a JUDGED paragraph
(promised / withheld / repaired / taxed), with the testimony that decided
it. This replaces the current descriptive house chains.

**10. Aspect doctrine rewrite.** Every aspect text becomes pair-specific
judgment: the two planets' determinations + aspect kind + both states +
reception. The Mars–Saturn trine problem solved at the root.

## MOVEMENT III — SYNTHESIS (phases 11–15)
*A reading is one argument, not a list.*

**11. Reception doctrine.** Mashallah: reception by sign, exaltation,
term, triplicity; mutual reception; how reception repairs a hard aspect
and betrays an easy one. Bank + detection + language.

**12. The judgment hierarchy.** When testimonies conflict, who wins:
almuten weight, angularity, state, sect (Bonatti's ordering). The engine
must never average contradictions into mush.

**13. Contradiction as content.** Charts argue with themselves; the
reading says so plainly ("the 10th promises rank; its lord in fall taxes
every step of it") — the honest tension IS the insight.

**14. The natal synthesis composer.** The loom re-tooled to assemble
judged paragraphs (phases 6–13) into one flowing argument: keystone →
strengths in state → the tooth → the houses that matter most in THIS
chart (by almuten weight), with receipts and citations.

**15. The no-birth-time doctrine.** Without an ASC: judge what the
tradition actually allows (lights, states, aspects, no houses), say what
is closed, never fake a rising.

## MOVEMENT IV — PREDICTION AS DOCTRINE (phases 16–20)
*Directions first. A direction = significator meets promittor.*

**16. Significator/promittor doctrine (Morin Book 22).** The meaning of
"directed A to natal B" = A's domain (what it signifies as directed
point) meeting B's FULL determination, judged by B's state and their
reception. Encode as `judgeDirection(c, dir)`.

**17. Directed Ascendant delineations.** The life/body edge meeting each
planet-as-determined. The BEFORE/AFTER example above is this phase's
acceptance test — every directed-ASC line must reach that register.

**18. Directed MC, Sun, Moon.** Career/honour edge; vitality/father;
body/mother/the felt life — each significator's proper domain (Lilly),
composed against promittor determinations.

**19. Direction through the bounds.** The directed ASC walking the
Egyptian terms: each term-lord a time-lord chapter (Abu Ma'shar's
distributors) — years-long chapters with a ruler whose natal
determination colors the whole span.

**20. Profections × directions.** The lord of the year (annual profection)
as the activator that decides WHICH directions speak loudest this year;
solar return as the year's trigger chart, never standalone.

## MOVEMENT V — THE LIVING SKY, IN ITS PLACE (phases 21–25)
*Sonia: transits are the last thing you look at.*

**21. Transits as triggers only.** The Today engine rewritten: a transit
speaks only when it touches a natal promise or an active direction —
"this week, the sky presses the year's live wire" — never as standalone
fortune.

**22. Cycles re-judged.** Long transits delineated through both planets'
determinations in THIS chart (which houses Saturn rules for YOU is what
his transit means for YOU).

**23. Returns in doctrine.** Solar return judged against natal +
profection lord placement, per the Persian method.

**24. Lunations and eclipses** as timers on natal degrees — activation
language, tightly orbed.

**25. Week/day surfaces** rewritten under 21–24; the glance card keeps
its form, gains judgment.

## MOVEMENT VI — THE DEEPER TRADITION (phases 26–30)

**26. The Lots.** Fortune and Spirit (+ a small canon): computation,
house placement, ruler's determination — delineated, not decorative.

**27. Fixed stars re-delineated.** Robson kept as catalog; language
rewritten to condition/behaviour register; tight orbs only.

**28. Antiscia and declination** in doctrine language (hidden
partnerships between planets that "see" each other in shadow).

**29. Patterns as testimony.** Chart shapes and configurations rewritten
as weighted testimonies entering the judgment hierarchy, not trivia.

**30. The Vedic honesty wall.** The sidereal toggle relabeled as what it
is (a zodiac choice); the nakshatra layer clearly framed as a separate
system, never blended into a Western judgment. Sonia: "Vedic is
different. It's not that simple."

## MOVEMENT VII — EVERY SURFACE REWRITTEN (phases 31–35)

**31. Read → You flow**: every beat re-sourced from Movements II–III.
**32. Patterns tab**: the wiring re-judged (10, 29).
**33. Seasons tab**: directions-first narrative (16–20) end to end.
**34. Today tab + glance**: trigger doctrine (21–25) end to end.
**35. People/synastry**: overlay method — each person's planets judged in
the other's houses; the two captains' reception as the bond's spine.

## MOVEMENT VIII — VOICE, PROOF, POLISH (phases 36–40)

**36. The voice book.** A house style written down: intellectual, plain,
unmystical; banned list ("energy", "the universe", "vibes", every pop
equation); the loom's variety banks regenerated under it.

**37. The source registry.** Every doctrinal element tagged
(author/work/book-chapter); receipts can show their citation. The
transparency wedge, completed: not just the math shown, but the doctrine.

**38. The golden-chart harness.** Five reference nativities with
hand-worked expected judgments (checkable by a trained astrologer);
regression tests on MEANING, not just longitudes. Sonia is the reviewer.

**39. The UI audit.** Screen-by-screen sweep at three widths for overlap,
truncation, inconsistent capitalisation/terminology; the wheel, the
cards, the chips — every text fits or falls back gracefully.

**40. The final read-through.** The whole app read aloud top to bottom
against the voice book and the banned list; Sonia's acceptance pass; only
then is the "final PWA" cut.

---

## Working rules for every phase
1. **One phase per session-chunk**, reviewed before the next: the owner
   sees each part written to perfection, not a delivered blob.
2. **Doctrine before prose, prose before code.** Each phase starts with
   the doctrine note (what the tradition says, from whom), then the
   language spec, then implementation.
3. **User-specific always**: no sentence may be composable without at
   least two chart-specific determinants in it.
4. **Receipts + citations** on everything new.
5. **The regression floor**: engine ALL 12 PASS, all screens clean, and
   (from phase 38) golden-chart judgments stable, before any phase ships.
6. **Tarot is load-bearing joy**: untouched except additions.
