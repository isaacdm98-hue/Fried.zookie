# THE VOICE BOOK
## The house style for every word the app speaks (phase 36)

The reading engine now judges rather than describes. The voice must match:
**intellectual, plain, unmystical, and specific.** A trained astrologer
talking to an intelligent adult — never a fortune cookie, never a wellness
brochure. This document is the standard; the banned list below is enforced
by `voiceCheck` on every release.

## The three registers (doctrine-notes §11)

1. **Objective** — the cold technical statement. This is what the *receipts*
   carry: "Venus · 18°51′ Taurus · 8th house · Domicile · lilly +11." Defensible,
   exact, no adjectives that aren't earned by the math.
2. **Inspired** — the composed reading. The technical fact brought to life:
   "she keeps her court in your 8th house… the promise is that the life's
   business concludes, and holds." Warmth added *after* the technique, never
   instead of it.
3. **Expert** — practical counsel. We do **not** fake this. The engine may
   say what a configuration *means*; it must not invent life-advice the chart
   cannot warrant. No "you should", no prescriptions beyond what the
   testimony supports.

## Positive rules

- **Every sentence earns its place with chart facts.** ≥2 chart-specific
  determinants per composed sentence (planet, sign, house, degree, score,
  aspect) — one rhetorical flourish per paragraph is allowed, no more.
- **Name the working.** A claim is followed by the testimony that decided
  it: "promised — Venus at +11 can pay; decided by Mercury in the house."
- **Judge, don't list.** "A benefic in a difficult house: the trouble comes
  in its mildest form" beats "Venus in the 8th: intense, transformative."
- **Honest silence over false content.** No birth time → say what is closed.
  Quiet sky → "not every day is an omen." A weak significator → say it pays
  late, not that all is well.
- **The tradition's own images, in plain English.** The bent pipe, the
  honoured guest, the vagabond, the captain, the live wire. Concrete,
  memorable, never precious.

## The banned list (enforced)

Words and moves that mark the fortune-cookie register we are leaving behind:

- **"energy"** — the single most overused non-word in modern astrology.
  Say what the planet *does*: presses, favours, restricts, burns, grows.
- **"the universe"**, **"cosmic"**, **"divine timing"**, **"the cosmos has
  a plan"** — no appeals to a benevolent sky. The chart is a map, not a
  message from management.
- **"vibe" / "vibes" / "high vibration"** — unquantifiable mood-words.
- **"manifest" / "manifestation"** — a wellness import with no traditional
  content.
- **"soulmate", "twin flame"** — romance-industrial vocabulary.
- **"your journey", "your truth", "abundance mindset", "living your best
  life"** — self-help filler.
- **The pop-equations Sonia named as red flags**: "the Sun is your
  personality", "the Moon is how you love", "Mercury is how you think."
  The Sun is the vital light and the father; the Moon is the felt life and
  the mother; a planet's meaning is its determination, never a one-word gloss.
- **Transit-first fortune-telling** — a transit read as a standalone verdict
  rather than a trigger on a live wire (enforced structurally by phase 21).

## Cadence

- Prefer the periodic sentence that lands its judgment last: setup, then the
  verdict. "A square is work — nothing flows straight — but a dignified
  benefic pays what she owes: a settlement, not a wound."
- Em-dashes for the aside that carries a determinant; colons before the
  payoff; semicolons to bind a fact to its consequence.
- British spelling throughout (colour, honour, favour), matching the
  source register of Lilly and Morin.
- Pronouns: Venus and the Moon are *she*; the others *he*; points are *it*.
  (A translation convention from the Latin/Greek sources, not a claim about
  people.)

## What this changes in the banks

The loom's variety banks (WV_MECH, the vpick lead-ins, GLANCE_DO/EASE) are
the last home of the older register. They are being regenerated under this
book: any bank phrase that reaches for "energy", a vibe, or a pop-equation is
rewritten to name the act. `voiceCheck` scans the live composers' output and
fails the build on any banned term — so the standard cannot silently rot.
