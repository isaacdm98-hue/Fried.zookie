# Deploying Aqau Pluto

The app is a fully static PWA — no server, no build step, no API keys.
Deploying is copying this folder to any static host with HTTPS.
(A service worker requires HTTPS, or localhost for testing.)

## Fastest: Netlify Drop (~60 seconds, free)

1. Open https://app.netlify.com/drop
2. Drag this folder (or the release zip, unzipped) onto the page.
3. You get a live HTTPS URL immediately. Done — the app is installable
   from that URL (iOS Safari: Share → Add to Home Screen; Android
   Chrome: Install app).

Free Netlify includes HTTPS and enough bandwidth for a personal app.
To keep one stable URL across updates, create a (free) account and
drag new versions onto the same site.

## GitHub Pages (free, versioned)

1. Merge this branch, then in the repository: **Settings → Pages →
   Deploy from a branch**, pick the branch and `/ (root)` or move this
   folder to `docs/` and pick `/docs`.
2. The app lives at `https://<user>.github.io/<repo>/astrology/`.
   All paths in the app are relative, so it works from a subfolder.

## Any other static host

Cloudflare Pages, Vercel, S3+CloudFront, nginx — copy the folder,
serve it over HTTPS. There is nothing else to configure.

## After deploying — 2-minute smoke test on your phone

1. Open the URL: the onboarding should appear; build a chart.
2. Add to Home Screen; launch from the icon (standalone, no browser bar).
3. Turn on aeroplane mode and relaunch: the app must boot, show your
   chart, and the tarot card art must still render (it is bundled).
4. `test.html` at the same URL runs the ephemeris regression suite in
   your browser — it should say **ALL 12 PASS**.

## Updating

Deploy the new folder over the old one. The service worker is
network-first for the shell, so open the app once online and the new
version takes over (it bumps its cache and reloads itself).

## What's in the folder

- `index.html` — the entire app (engine, reading loom, UI)
- `corpus.js` — the language banks
- `lib-astronomy.js`, `lib-p5.js` — vendored MIT libraries
- `sw.js`, `manifest.webmanifest`, icons — PWA install + offline
- `tarot/` — bundled public-domain Rider–Waite–Smith deck
- `fonts/` — bundled OpenDyslexic (brand fonts are inlined)
- `test.html` — public regression suite (ships on purpose: the app
  says it shows its working, so the working ships too)
