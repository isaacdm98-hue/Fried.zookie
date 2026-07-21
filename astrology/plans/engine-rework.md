# The Sonia Rework — traditional method, phased

The brief (from a London School of Astrology–trained astrologer):
a reading starts at the ASCENDANT, then the RULER of the Ascendant,
then each house's ruler followed to where it stands, judged by its
STATE (dignities — sign, then decan/face, then EGYPTIAN terms).
Aspects are judged WITH the nature of the planets (a trine between
the two malefics is an easy road between hard planets, not a
blessing). Prediction is by SYMBOLIC DIRECTION (1°/year), and
transits are the LAST thing checked, never the first.
Red flags: "the Sun is your personality"-style pop equations;
transit-first predictions.

## Phase 1 — the spine (DONE, v3.48.0)
- traditionalRead(): Ascendant beat → chart-ruler beat → 12
  house-ruler chains (traditional rulers, modern co-rulers named
  second) → planet states three layers deep (sign + face + Egyptian
  terms), all with receipts
- aspectNature(): benefic/malefic-aware aspect judgement
- symbolicDirections(): 1°/yr, all points, exact ages + years,
  geometry verified; leads Seasons, transits demoted below
- Reading flow opens Ascendant-first; "Who you are" → "The two
  lights"; welcome walk rewritten off the Sun-equation
- Two new chapters: The twelve houses, The state of your planets
- +5 tarot spreads (11 total)

## Phase 2 — the language sweep (NEXT)
- Rewrite corpus banks that carry pop equations (sun=self, moon=
  feelings shorthand) into house/ruler-first language
- combinationRead / sunMoonCharacter reframed as "the two lights",
  weighed with sect
- weaveTransit/weaveCycle judged with aspectNature (planet natures)
  instead of geometry-only quality labels

## Phase 3 — deeper method
- Almuten + dispositor chains surfaced in the captain beat
- Directions ↔ natal receptions; direction of the ASC through terms
  (time-lord of the body)
- House rulers when cusp sign ≠ whole-sign house (interception note)
- Sect-aware benefic/malefic weighting (day/night charts)

## Phase 4 — UI audit
- Sweep for text overlap/inconsistency screen by screen at 3 widths
- Keep tarot exactly as loved; spreads renderer check with 7-card
  layouts

## Notes
- "Olympia" (Sonia's software) is commercial, no open-source engine
  to embed; its function here is covered natively: arcminute
  positions (validated against Astro.com), full Ptolemaic dignity
  tables incl. Egyptian bounds, directions.
- Swiss Ephemeris is AGPL/paid; astronomy-engine (MIT) is the
  deliberate choice — README documents the licensing reasoning.
