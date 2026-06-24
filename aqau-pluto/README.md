# Aqau Pluto

A vibe-coding studio that runs entirely on-device in the browser, with a working
astrologer built in. Install to the home screen and it works offline.

Served (once Pages is deployed) at `…/aqau-pluto/`.

## What's in this build

### Gemma 4 is the main brain
Gemma 4 (`onnx-community/gemma-4-E2B-it-ONNX`, with a larger `E4B` option) runs
through **transformers.js v4** on **WebGPU** — the same setup as the
[`webml-community/gemma-4-webgpu-kernels`](https://huggingface.co/spaces/webml-community/gemma-4-webgpu-kernels)
space. It's the default, recommended model. The older Qwen / Gemma 2 models stay
available on `web-llm` as lighter fallbacks.

Both runtimes sit behind one interface (`engine.chat.completions.create`), so the
rest of the app doesn't care which is loaded.

**Text-only load (fixes the ~1.4 GB stall).** Gemma 4 is multimodal, and loading
the full `Gemma4ForConditionalGeneration` also pulls the vision + audio encoders —
which blows past iPhone's per-tab memory around the big decoder file. So the
loader now does what the [`webml-community/Gemma-4-WebGPU`](https://huggingface.co/spaces/webml-community/Gemma-4-WebGPU)
text-chat space does: load **`AutoModelForCausalLM` + `AutoTokenizer`** (text only)
**first**, then fall back to the multimodal class, then the pipeline. It also
retries **without the browser cache** (Safari chokes caching huge entries) and
requests persistent storage — so the download no longer times out at ~1.4 GB.

**The clever way (Web Worker).** Gemma loads and generates inside a dedicated
**Web Worker** — the pattern the webml-community spaces use and the recommended
way to run WebGPU inference. The main thread never freezes during the long
first-time shader compile (the thing that made it look hung, and what trips up
iPhone), and the worker raises the WebGPU device limits internally. If a worker
can't be used, it falls back to the same load on the main thread.

**Memory, like Claude.** Aqau Pluto keeps a persistent memory that's woven into
every prompt, so it remembers you across sessions: it quietly learns durable
facts as you chat (and from astrology conversations), and — once you add birth
data — Gemma writes a private **natal profile** into memory so it always knows
your chart. Manage it in Settings (view / clear) or with `/remember …`,
`/memory`, `/forget`. It's included in your JSON backup.

**Gemma is the brain everywhere.** Once loaded it powers every surface: building
& editing apps in chat, the slash commands, code-section explanations,
auto-naming cartridges, the astrology readings (today / natal / transits), the
notebook's improve/continue/summarise, the Atelier's "draw this" SVG, and the
startup knowledge prebuild.

Gemma 4 is **multimodal**, so it's loaded the same way the model card and the
webml-community space load it — the dedicated `Gemma4ForConditionalGeneration` +
`AutoProcessor` (not the generic text-generation pipeline, which is what made the
download stall) — with a pipeline fallback if those exports aren't present.
Loading is hardened for an installed PWA: runtime pinned to `@4.2.0`; WebGPU
required with a clear message if missing; `q4f16` falls back to `q4` on GPUs
without `shader-f16` (some iOS); **byte-accurate download progress** (MB / MB)
plus a stall watchdog so the first big multimodal download never *looks* frozen;
persistent storage requested; and the service worker passes model/CDN traffic
straight through so transformers.js keeps its own weight cache. It's a large
first download (multimodal weights), then instant from cache — install to the
home screen so it stays cached.

### Startup prebuild (many requests up front)
On first load, once the model is ready, Aqau Pluto fires a burst of requests to
already "know" itself and the sky before you ask:
- a short self-introduction (what Aqau Pluto is) — shown on the home screen and
  when you open a fresh cartridge,
- the essence of all twelve signs,
- today's transit reading — pre-seeded into the whiteboard.

Results are cached in `localStorage`, so the burst only runs once per model/day.

### Real astrology, hand-drawn live
- **Accurate ephemeris** via [astronomy-engine](https://github.com/cosinekitty/astronomy)
  (VSOP87, <1′ error) — true geocentric tropical longitudes and retrograde for
  Sun→Pluto, replacing the old mean-motion guess (kept only as an offline
  fallback until the engine caches).
- **A real chart** in the whiteboard: zodiac ring tinted by element, sign glyphs,
  5° ticks, planets at true longitude with degree/sign labels, and **aspect
  lines** (conjunction/sextile/square/trine/opposition with orbs). Toggle
  **natal ↔ today** with `◑` (natal needs birth data).
- **Real houses**: with a birth time and place, the birthplace is geocoded
  (OpenStreetMap Nominatim) and the **Ascendant + MC** are computed, drawing
  **equal-house cusps** on the wheel and feeding planet houses into the reading.
  Falls back to a sign-only wheel offline or without a location.
- **Hand-drawn, drawn live**: the chart is rendered with
  [rough.js](https://github.com/rough-stuff/rough) (the engine behind Excalidraw)
  and animates its strokes in as if sketched by hand. AI drawings in the Atelier
  fade/grow in the same way. Turn it off in Settings (and it respects
  `prefers-reduced-motion`).
- **Chart engine choice** (Settings): the hand-drawn Aqau renderer (default) or
  [Kibo/AstrologyChart2](https://github.com/Kibo/AstrologyChart2), fed the same
  `{points, cusps}` data; it falls back to the hand-drawn wheel if it can't load.

### Studio & production features
- **Markdown chat**: replies and readings render bold/italic/code/headings/lists/
  links, each with a copy button. **Stop** mid-generation and **Regenerate** the
  last reply.
- **Cartridge management** (`⋯`): rename, duplicate, export `.html`, delete.
- **Charts**: cycle **today → natal → transits** with `◑`; transits draw today's
  planets (gold) over your natal wheel.
- **Your data is yours**: export/import a full JSON backup, and clear the model
  cache, from Settings.
- **Installable PWA**: enriched manifest with app **shortcuts** (New build /
  Whiteboard / Atelier / Notebook), an **Install** button (Android/desktop) and
  the iOS Add-to-Home gate, plus a service worker that auto-updates.

### Internet features (optional, online-only)
Works fully offline. When you're connected and **Web research** is on (Settings),
Gemma can reach the web to ground its answers:
- paste a URL and it reads the page (via `r.jina.ai`),
- otherwise it pulls encyclopaedia context (Wikipedia REST, CORS-friendly).

Arm the ⌕ button in the chat bar to make the next message search. An online/offline
dot sits next to the title.

### Notebook (odysseus-inspired)
A quiet markdown notebook (`✑` on the home bar) where Gemma can **improve**,
**continue**, or **summarise** what you write — using the web for grounding when
available.

### Atelier — draw & design (`✎` on the home bar)
A vector drawing studio built on **paper.js**:
- brush, line, rectangle, ellipse and eraser tools, a colour palette and size,
- undo / clear, export to **PNG** or **SVG**, a saved-drawing gallery,
- **Gemma draws it** (`✦`): describe something and Gemma returns an SVG that's
  imported straight onto the canvas — grounded with the web when online.

**Apple Pencil & tools.** The canvas is driven by Pointer Events, so **Apple
Pencil on iPad** works first-class — pressure-sensitive stroke width, palm
rejection (touch is ignored while the pen is down) and pointer capture for smooth
lines. Plus a fill toggle, a native colour picker, and **PNG + SVG export**. The
whole UI also gives light **haptic** feedback on tap (mobile).

**Draw assets into your builds.** In a cartridge, tap `✎` (or accept the
"want to draw it yourself first?" prompt that appears when you mention a game,
character, sprite, logo, etc.). You're dropped into the Atelier; draw it, tap
**→ use**, and the drawing is handed back as an SVG asset. Gemma then reuses that
exact artwork in the build — so the character you drew becomes the character in
the game. Assets ride along in the cartridge for every later edit.

This is the part that adapts the drawing repos. paper.js is the engine; the
brush/shape/colour tooling takes after **Krita**'s painting workflow; the AI-SVG
and gallery flow takes after **Penzil**'s local-first sketching. (Krita is a
native C++ app and Penzil is a Vue + three.js *3D* tool — neither ports verbatim
to a single-file PWA, so a true 3D grease-pencil mode is a clear next step rather
than a half-working stub.)

### Runs Gemma 4 on iPhone (past the WebGPU limits)
Safari/ONNX Runtime otherwise spins up a WebGPU device with small *default* limits
(`maxStorageBufferBindingSize` ~128 MB) — the real wall big models hit on iPhone.
Before loading, the app requests the GPU device with the **adapter's maximum
limits** and hands it to the runtime, so Gemma's large weight buffers actually
fit. Combined with `q4f16`→`q4` fallback and persistent storage, Gemma 4 loads on
a capable iPhone (iOS 18+).

### A hand-drawn, animated UI everywhere — drawn live
Every part of the UI is sketched by hand: heading underlines, round buttons,
panels and cards all get a rough.js outline, and a **boiling-line filter**
continuously wobbles every stroke so the whole interface looks like it's being
re-drawn live. Honours the Hand-drawn motion switch and `prefers-reduced-motion`.

### A hand-drawn, animated UI everywhere (legacy note)
The whole interface has the sketched-live feel, not just the chart: screens fade
in, cards and chat messages settle into place with a staggered "drawn-in" motion,
home/notes/drawing cards get a [rough.js](https://github.com/rough-stuff/rough)
hand-drawn frame, and every tappable thing has a little tactile press. It all
honours `prefers-reduced-motion` and the **Hand-drawn motion** switch in Settings.

A classic-script safety net surfaces any fatal error (instead of a frozen splash),
the service worker auto-reloads when a new version ships, and the CDN-loaded
engines (Gemma, paper.js, rough.js, astronomy-engine, astrochart2) all fail soft
with a toast and a fallback rather than breaking the app.

### Design briefs + slash commands
- **Design briefs** (Settings) — pick a house style (editorial, brutalist, soft,
  terminal, playful) and Gemma honours it on every build. This is open-design's
  "design system shapes the artifact" idea, fitted to Aqau Pluto's cartridges.
- **Slash commands** in chat (claude-code style): `/improve`, `/smaller`,
  `/prettier`, `/accessible`, `/faster`, `/deck <topic>`, `/draw <thing>`,
  `/help`.

## Why some odysseus features aren't here
[odysseus](https://github.com/pewdiepie-archdaemon/odysseus) is a server-side
(Python/Docker) workspace. Its server-only pieces — IMAP/SMTP email, CalDAV
calendar sync, Docker deployment, the image gallery — don't map onto a fully
on-device PWA, so they're intentionally left out. Its model-management,
document-editing, and web-research ideas are the ones adapted above.
