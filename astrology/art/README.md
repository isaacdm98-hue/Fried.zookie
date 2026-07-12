# Ancient Sky illustrations

Four illustrated headers for the Ancient Sky reading beats, one per
civilisation the feature draws on:

- `ancient-egypt.webp` — the Giza pyramids under a rising Sirius
  (pyramid stars, herald star, precession, decans)
- `ancient-babylon.webp` — a ziggurat under a clay star-chart sky
  (base-sixty, the 360° circle)
- `ancient-persia.webp` — a watchtower under the Four Royal Stars
  (the Watchers of the four corners of heaven)
- `ancient-vedic.webp` — the Moon's arc through the 27 mansions
  (the nakshatras)

To fetch them, run `node get-art.js` from the `astrology/` folder.
The app is fully functional without them — beats fall back to text.
The files are local bundled assets: the app never fetches art from
the network at runtime, so the offline / zero-request promise holds.

## Provenance

Commissioned AI-generated illustration (Higgsfield, Nano Banana Pro,
July 2026), prompted in the app's house style: warm cream paper, ink
linework, single burnt-orange accent, no text. These are static
assets, like the bundled tarot deck. **Every word of every reading
remains deterministic** — the "no AI prose" promise is about the
language engine, and it is untouched.
