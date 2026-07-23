# DOCTRINE NOTES — TEMPERAMENT · TIMING · MEDICAL (deep research, public-domain facts)

Implementation-ready method and **public-domain data** distilled from a deep research pass
(Ptolemy, Valens, Abu Ma'shar, al-Biruni, Bonatti, Lilly 1647, Culpeper 1655, Raphael,
Sepharial; modern transmitters Dykes, Brennan, Frawley, Greenbaum for method only, never
copied). Our own words throughout. Companion to `doctrine-notes.md` (Cours 1–4) and
`doctrine-notes-cours5-6.md`. **Verify-before-quote:** where a table is a faithful
reconstruction (not a verbatim source scan), we frame it as "the tradition (after X) watches…",
never as a verbatim quotation and never as a diagnosis.

---

## PART 1 — THE FOUR TEMPERAMENTS  ✅ IMPLEMENTED (`temperament`, `temperamentProse`)

The humoral constitution — the **body's complexion**, the opener of a reading (Cours 4). Not a
personality label. Two revival methods exist; we use **Greenbaum's weighted 7-factor** scheme
(matches our confirmed 2/2/2/1/1/1/1 weights). Frawley's 5-point is the simpler cousin; do NOT
merge the two (his factor 5 is the Lord of the Geniture; hers is the Moon's dispositor).

**The seven weighted testimonies** (each votes on TWO axes — thermal hot|cold, humid wet|dry):
| # | Testimony | Weight | Quality source |
|---|---|---|---|
| 1 | Ascendant **sign** | 2 | element |
| 2 | Ascendant **ruler** (domicile lord) | 1 | planet nature (Mercury orientality-sensitive) |
| 3 | **Almuten of the rising degree** (true, 5/4/3/2/1) | 1 | planet nature |
| 4 | **Sun by season** of birth | 2 | season quality (by tropical Sun-sign quadrant) |
| 5 | Moon **sign** | 2 | element |
| 6 | Moon **phase-quarter** | 1 | quarter quality |
| 7 | Moon's **dispositor**, by the element of ITS sign | 1 | element |

**Quality maps (confirmed across many sources):**
- Elements: Fire = hot+dry (choleric) · Air = hot+wet (sanguine) · Water = cold+wet (phlegmatic) · Earth = cold+dry (melancholic).
- Planets: Saturn cold+dry · Jupiter hot+wet · Mars hot+dry · Sun hot+dry · Venus cold+wet · Moon cold+wet · **Mercury by orientality** (oriental/morning-star hot+wet; occidental cold+dry).
- Season (N. hemisphere, by tropical Sun sign): spring (Ari–Gem) hot+wet · summer (Can–Vir) hot+dry · autumn (Lib–Sag) cold+dry · winter (Cap–Pis) cold+wet. Invert below the equator (config flag — we do this by `b.lat < 0`).
- Moon quarter (elongation Moon−Sun): 0–90° hot+wet · 90–180° hot+dry · 180–270° cold+dry · 270–360° cold+wet.

**Tally → verdict:** sum each factor's weight into hot/cold and wet/dry (10 pts per axis). Winner
of each axis names the humour: hot+dry choleric · hot+wet sanguine · cold+wet phlegmatic ·
cold+dry melancholic. Ties on one axis = a two-humour blend; both axes tied = balanced/well-
tempered (a fortunate constitution). Always expose the raw tally + per-factor receipts.

**Source line:** Ptolemy *Tetrabiblos* III.11–12; Lilly *CA* on the complexions; the weighted
method after Frawley/Greenbaum (method only).

---

## PART 2 — MEDICAL DOMAIN (Cours 6 / the health reading)  ⏳ tables ready, not yet wired

Framing rule (non-negotiable): the app **never diagnoses**. Every line reads "the tradition
watches this zone", descriptive of the tradition, in the reassurance register. Promises are
life-long potentials, never certainties or all-at-once. This is the expert register we do NOT fake.

### 2A. Life-forces (hyleg pool) — judge the vitality
Candidate hylegiacal points (score as a *pool*, not one killer point): **Ascendant + its lord,
Sun, Moon, Lot of Fortune** (+ prenatal syzygy fallback). Aphetic zones only (1/11/10/9/7).
Day birth: Sun→Moon→Fortune→Asc→syzygy; night: Moon→Sun→Fortune→Asc→syzygy.
Each point STRONG by: sign vigour (own dignity/exalt/angular), above horizon, essential dignity,
benefic aspect (Jup/Ven/waxing Moon), free of malefics, (Moon) waxing & swift. WEAK by:
detriment/fall, cadent or 6/8/12, peregrine, malefic conjunction/parallel/hard aspect, combust,
Moon waning/void. The weakest-supported life-force names the channel "the tradition watches."

### 2B. Morbid forces — the besiegers
Natural malefics **Saturn & Mars**; accidental = **lords of VI, VIII, XII** (some add IV); the
**Lot of Sickness** (Asc + Saturn − Mars by day, reverse by night); the VI cusp/occupants/lord.
Affliction: a **malefic** hurts by conjunction, parallel, square, opposition (and bad-reception
soft aspects); a **benefic** hurts ONLY by the hard aspects; the Sun chiefly by combustion.
Chronic/acute discriminator: **Saturn · Sun · fixed/cardinal → chronic, organic, hereditary,
cold, slow**; **Mars · Moon · mutable/cadent → acute, functional, acquired, hot, sudden.**

### 2C. TABLE A — sign → body zone (melothesia; Lilly/Sepharial/Cornell)
Aries head/face/brain · Taurus throat/neck/thyroid · Gemini arms/shoulders/lungs/nerves ·
Cancer breast/chest/stomach/womb · Leo heart/upper back/spine · Virgo bowels/intestines/spleen ·
Libra kidneys/loins/lumbar · Scorpio genitals/bladder/groin/rectum · Sagittarius hips/thighs/
sciatic · Capricorn knees/bones/skin/joints/teeth · Aquarius legs/ankles/calves/circulation ·
Pisces feet/lymph/fluids.

### 2D. TABLE B — planet → affliction quality (Lilly/Culpeper)
Saturn: cold-dry, melancholy — chronic/obstructive/wasting — bones, teeth, skin, joints, spleen —
rheumatism, gout, consumption, palsy, blockage, dropsy, hardening.
Mars: hot-dry, choler — acute/inflammatory/feverish — blood, muscle, gall — fevers, inflammations
(-itis), wounds, burns, surgery, haemorrhage, sharp pain, "hurts by iron & fire".
Sun: vital heat — constitutional/organic/hereditary — heart, aorta, spine, eyes — heart complaints,
low vitality, spinal & eye troubles.
Moon: cold-moist, phlegm — acute/functional/fluidic — stomach, breast, womb, lymph — dropsy,
catarrh, stomach & female complaints, periodic disorders.
Mercury: convertible — nervous/mental/mutable — brain, nerves, tongue, lungs — nervous disorders,
neuralgia, speech faults, insomnia, respiratory.
Venus: cold-moist temperate — excess/reproductive/glandular — kidneys, throat, generative organs,
skin — gravel, throat, venereal, skin, "diseases of surfeit".
Jupiter: hot-moist, blood — excess/plethora/congestion — liver, blood, flesh — liver disorders,
blood impurities, apoplexy, plethora, obesity, surfeits.

### 2E. TABLE C — Raphael planet-in-sign disease matrix (Saturn/Mars/Jupiter × 12; Sun/Ven/Mer/Moon summarised)
The reusable primitive is A×B (sign-zone × planet-quality); Raphael's named cells refine it. Fire a
cell ONLY where the planet actually afflicts a life-force. Selected confirmed cells:
Mars/Virgo = enteritis, peritonitis, dysentery, worms, hernia. Saturn/Pisces = gout, dropsy,
tender feet, colds through the feet. Saturn/Gemini = consumption, bronchitis, asthma, weak lungs.
Mars/Aries = brain fever, wounds to head/face, erysipelas. Jupiter/Cancer = dropsy, surfeits,
liver-indigestion. (Full 12-cell rows per Saturn/Mars/Jupiter captured in the research log; author
into corpus as `DISEASE_MATRIX` when wiring the health domain. **Paraphrase, not verbatim.**)

**Method order:** life-forces → morbid forces → who prevails → are the life-forces afflicted →
locate the afflicted zone by the **maximum of concordant testimonies** (sign + house + planet) →
name the watched complaint (A×B, refined by C) → date crises by directions/returns/transits.

---

## PART 3 — TIMING ENGINE refinements (mostly corroborates existing code)

### 3A. Directions — the three rates
- **Symbolic** 1°00′/yr · **Naibod** 0°59′08″/yr (0.98565°; ≈1.0146 yr/°) · **Solar arc** =
  Δ(progressed Sun − natal Sun) applied to every point. Symbolic vs Naibod diverge ~1 yr by age 68.
- Orb = **1°** = active (±1 yr window); year of exactitude is the peak. Conjunction > hard > soft.
- Moved: planets, Asc/MC, Lots. Contacted: natal planets, cusps/angles, sign ingresses, Lots.
- A directed body changing **sign** is itself an event (Cours 5 already has this).

### 3B. Transits — the trigger doctrine
`event = promise(natal) × schedule(active time-lord/direction) × trigger(transit)`. A transit only
dates an event **already promised and already scheduled** (Lord of Year, profected sign & lord,
firdaria/ZR lord, directed degrees, natal angles). Slow bodies (Saturn, Jupiter, then Mars) matter;
Sun/Moon fine-time. `schedule = 0` → background noise, emit no dated life-event. Returns are the
mid-layer. (Our `triggerReading`/`liveWires21` already encode this — good.)

### 3C. Firdaria — 75-yr cycle
Lengths: Sun 10 · Venus 8 · Mercury 13 · Moon 9 · Saturn 11 · Jupiter 12 · Mars 7 · N.Node 3 ·
S.Node 2. Ring Sun→Venus→Mercury→Moon→Saturn→Jupiter→Mars; **day enters at Sun, night at Moon**;
Nodes appended, take **no sub-periods**. Each planetary period ÷ 7 equal subs, first sub = the main
lord; sub-order = firdaria-continuation (default) or Chaldean (config).

### 3D. Zodiacal Releasing (from Spirit / Fortune)
Period-years **by sign**: Aries/Scorpio(Mars) 15 · Taurus/Libra(Venus) 8 · Gemini/Virgo(Mercury)
20 · Cancer(Moon) 25 · Leo(Sun) 19 · Sagittarius/Pisces(Jupiter) 12 · **Capricorn 27 · Aquarius
30**. Circuit = 211. Levels nest ÷12 (yr → month → 2.5 d → ~5 h): first child = parent's sign,
children in zodiacal order, length = sign's period-value in the current unit. **Loosing of the
Bond:** on completing a 12-sign circuit, jump to the sign OPPOSITE the start (a hard reset).
**Peaks = released sign angular to Fortune (1/4/7/10)**, esp. 10th; cadent-from-Fortune = valleys.

### 3E. Stations & eclipses (intensifiers on live wires)
Station within ≤1° of a natal/active point = maximal trigger (potency from duration). Triple-pass
when a point lies in the retrograde arc. Eclipse on a natal point/house is a timer + intensifier
**only** where already scheduled; solar = outer/longer, lunar = inner/shorter; near an angle acts
sooner/stronger; on the Lord of the Year = headline.

---

## What to build next (priority)
1. **Health domain** (Phase C / step 26): wire Tables A/B/C into `judgeHouse` for VI + the hyleg
   pool, in the reassurance register. Author `DISEASE_MATRIX` in corpus.js (paraphrase).
2. **Temperament surfacing:** open the body/health area (and the "Your life" domain reading) with
   `temperamentProse`. ✅ engine done — UI wiring pending.
3. Confirm firdaria/ZR constants in the existing `zodiacalReleasing`/firdaria code against §3C–D.
