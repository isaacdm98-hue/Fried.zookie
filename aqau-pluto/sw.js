// Aqau Pluto service worker
// Caches the app shell ONLY. WebLLM and transformers.js manage their own
// model-weight caches via the Cache API + IndexedDB; we must not interfere.
// Cross-origin requests (HF weights, esm.run, jsdelivr, fonts, web research)
// are passed straight through — see the fetch handler.

const VERSION = 'aqau-pluto-v21-nocache-retry';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './assets/Lilypad_hoverglow.png',
  './assets/Lilypad_questions.png',
  './assets/Flower_open.png',
  './assets/Ideablob_red.png',
  './assets/POSE_listening_SWIRL.png',
  './assets/Tab_icon_wakingboard_Active.png',
  './assets/Tab_icon_journeyACTIVE.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Hands off: WebLLM weights, Hugging Face, esm.run, fonts, anything cross-origin.
  if (url.origin !== self.location.origin) return;

  // Shell only: HTML, manifest, icons.
  event.respondWith(
    caches.match(req).then((hit) => {
      return hit || fetch(req).then((res) => {
        // Update the shell entry in the background.
        if (res && res.ok && SHELL.some((s) => req.url.endsWith(s.replace('./', '')))) {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
