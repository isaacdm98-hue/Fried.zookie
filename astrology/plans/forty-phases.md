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
- **Abraham Ibn Ezra**, *The Beginning of Wisdom* (12th c.) — the dignity
  characters (the man at home / the honored guest / among family / in his
  seat / in his fine clothes)

**Plus the school's own method** — Sonia's two preparatory course
documents, distilled in our own words in **`doctrine-notes.md`** (read it
before any phase below; its final section maps each note onto the phases
it changes). Its four load-bearing ideas: (a) **signs tell the STATE of a
domain, houses its CIRCUMSTANCES** — never blended; (b) **analogy is the
selection function** — the point in common between planet and house
(joys, Chaldean co-significators, karakas, rulership, aspect) decides
WHICH signification a line voices; (c) benefics favor and malefics
disturb *the domain touched*, never the person; (d) the reading is about
the concrete domains of a life, not a personality profile.

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
aspects; **analogy hooks** (in joy? in Chaldean co-signification? in a
house sharing its universal signification? counter-analogy?). Hard
modeling rule from the school: the object keeps **zodiacal state** (sign:
sound/collapsing/lasting) and **terrestrial state** (house: circumstances,
angular force) as SEPARATE axes — a planet in fall yet angular is
"fragile thing, prominent stage," never an average. One function
`determination(c, planet)` returns the complete "what this planet is IN
THIS CHART" object. Acceptance: for 5 reference charts, the object matches
a hand-worked Morin-style determination sheet.

**2. Natural significations bank.** For each of the 7 traditional planets
(+ outers, marked modern): persons, matters, qualities, body, vocations —
from Lilly CA Book 1 and al-Biruni, rewritten in house voice; each entry
also records its **universal significations (karakas)** and its **joy**
and **Chaldean co-signification** houses, because those are the analogy
hooks the composer selects by. Acceptance: each planet's entry is
source-tagged and reads as intelligent prose, not keyword lists.

**3. House significations bank.** The 12 houses in full traditional
signification (Lilly, Firmicus, Bonatti): matters, persons, body parts,
the derived-house logic (the 8th is the 2nd of the 7th…), and a
**planet-in-house analogy matrix** (which of the house's matters each of
the 7 planets voices FIRST when placed there — built fresh from Lilly and
al-Biruni, cross-checked against the school's table). Acceptance:
derived-house reasoning available to the composer ("your partner's
money"), and for any (planet, house) pair the composer can answer "which
signification speaks first, and why."

**4. The state machine.** Essential dignity in five layers (domicile +5,
exaltation +4, triplicity-by-sect +3, Egyptian terms +2, face +1;
detriment −5, fall −4) + **accidental** state (angularity —
angular/succedent/cadent amplify/mute the occupant, speed, direct/retro,
combustion at 7°30′, cazimi, under beams, besiegement, joy) → one
articulate condition verdict with its arithmetic shown. Each layer keeps
its **distinct narrative character** (doctrine-notes §3): domicile = at
home, the thing arrives and LASTS; exaltation = the honored guest, sudden
bursts, power without ownership, subject to tribulation; triplicity =
among family, breakthrough by others' help; term = in his seat, tempered,
never excessive; face = fine clothes at the door, fragile credit;
peregrine = the vagabond, benefits via strangers, nothing durable,
leaning wholly on the dispositor; detriment = enemy territory, agendas
that never meet; fall = the pretender who cannot deliver. Sect-concordance
(diurnal planet in diurnal sign) modifies every verdict. Feral
(unaspected) = unsupported, alone. Acceptance: Lilly's own point-scoring
reproduced on his example charts, and each dignity layer's language
distinguishable in a blind read.

**5. Nature and sect.** Benefic/malefic modified by sect (Fortuna/Infortuna
in and out of sect); the malefic contrary to sect named as the chart's
sharpest tooth; the benefic of sect as its readiest help. The school's
full nuance table (doctrine-notes §2) is law: the **Moon's light rule**
(benefic beyond 90° from the Sun / waxing; malefic dark, waning-dark
worst); **Mercury convertible** (takes the nature of what touches it;
alone, its next applying aspect decides); the **Sun malefic by
conjunction inside 7°30′**, benefic otherwise; **North Node amplifies /
South Node reduces** whatever they join, benefic or malefic. And the
frame sentence that governs all delineation: a planet is benefic or
malefic *for the domain it touches*, never for the person. Acceptance:
every chart names its helper and its tooth, with reasons; the Moon/
Mercury/Node verdicts flip correctly on synthetic test charts.

## MOVEMENT II — JUDGING THE NATAL CHART (phases 6–10)
*Sonia's order: Ascendant → its lord → the houses.*

**6. The Ascendant judged.** Rising sign + its lord's determination +
planets on/in aspect to the ASC → temperament and body, Lilly's method
(element → humor: fire/choleric, earth/melancholic, air/sanguine,
water/phlegmatic; mode → tempo). Not "your personality": the
constitution. Plus the **zodiacal matrix** (doctrine-notes §8): the
whole-sign overlay from the rising sign, each house's sign read through
its natural tenants (who is at home, exalted, exiled, fallen there) — the
fate-skeleton this rising shares, used as the CONFIRMATION layer: when a
planetary configuration agrees with the matrix, the reading says the
indicated thing is larger in this life.

**7. The Lord of the Ascendant, fully.** The captain's complete
determination delivered as the keystone paragraph: where he stands, what
he rules, his state, who receives him, what that promises and what it
costs. This paragraph is the heart of the natal reading.

**8. The rulership web.** The full directed graph: every planet → houses
ruled → dispositor chains → final dispositors. PLUS the **almuten of every
cusp** (doctrine-notes §5): score all five dignity layers at the cusp
degree; the victor can outrank the domicile lord ("Aries MC, but the Sun's
exaltation + day-triplicity beats Mars's domicile — the SUN judges your
career"), ties are content (several almutens of the 6th = several
illnesses/employers), and dispositors may be taken by almuten of the
degree, not only by sign. The engine reads BOTH lord and almuten — two
windows on each domain. Rendered reasoning: "your 10th answers to Mars,
Mars answers to Venus, so the career ultimately reports to the captain."
Sonia: "each planet is related with one or multiple houses, and the link
is the reading."

**9. House-by-house judgment.** For each of the 12, the school's 12-step
method (doctrine-notes §10) run in code: occupant judged by nature AND by
what it rules ("Jupiter in your 4th describes the father — but as lord of
the 8th he tends to undo what he touches"); occupant's zodiacal state;
the LORD's state = the domain's final promise; the lord's house = the
**cause-and-effect link** ("lord of the 2nd in the 9th: money comes
through teaching, abroad, matters of belief"); planets conjunct the lord;
the domain's universal significator checked last (a feral karaka = the
person it signifies stands unsupported). **Analogy selects which
signification speaks** at every step — joys, Chaldean co-signification,
karakas, rulership, aspect — and counter-analogy is judged by
nature-plus-state (the benefic in the 12th protects: the illness comes
and the native escapes it; Saturn in the 2nd withholds — unless
dignified, when he builds slowly). Output: a JUDGED paragraph (promised /
withheld / repaired / taxed) with the testimony that decided it. This
replaces the current descriptive house chains.

**10. Aspect doctrine rewrite.** Every aspect text becomes pair-specific
judgment: the two planets' determinations + aspect kind + both states +
reception. The governing image (doctrine-notes §9): **the aspect is the
pipe (bent or straight), the planet is the liquid in it (clean or foul)**
— sextile venusian, trine jupiterian, square martial, opposition
saturnian, conjunction a neutral cohabitation (collaboration between
friends, confrontation between enemies). The planet's nature outranks the
geometry: *better a square of Jupiter than a trine of Saturn.* Direction
encoded too — Jupiter's aspect TO Mars helps what Mars rules; Mars's
aspect TO Jupiter heats what Jupiter rules. The Mars–Saturn trine problem
solved at the root.

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
chart (by almuten weight), with receipts and citations. The register
model is the school's worked father-example (doctrine-notes §12): four
testimonies — occupant by nature and rulership, lord's state as promise,
aspects as circumstances, karaka as confirmation — braided into ONE
judgment, every clause carrying a chart-specific determinant.

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
equation); the loom's variety banks regenerated under it. Register
doctrine = the school's **three levels of reading** (doctrine-notes §11):
receipts speak at level 1 (the cold technical statement), the composed
reading at level 2 (the description brought to life, warmth AFTER
technique), and level 3 (expert counsel) is never faked — no life advice
beyond what the configuration itself warrants.

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
