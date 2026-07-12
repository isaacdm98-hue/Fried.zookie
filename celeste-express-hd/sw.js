/* CELESTE EXPRESS HD — service worker. Precaches the whole app shell so the
   PWA installs and runs fully offline (Three.js, engine, GLB characters,
   icons). Cross-origin requests (Google Fonts, the Higgsfield scenery CDN)
   pass through to the network and are cached opportunistically when they
   succeed, so the game never breaks when they are unavailable. */
var CACHE = 'celeste-express-hd-v1';
var ASSETS = [
  './',
  'index.html',
  'engine.js',
  'main.js',
  'manifest.webmanifest',
  'vendor/three.module.js',
  'vendor/jsm/GLTFLoader.js',
  'assets/models/zil.glb',
  'assets/models/marmalade.glb',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url;
  try { url = new URL(e.request.url); } catch (err) { return; }
  /* let cross-origin (fonts, Higgsfield scenery) go straight to the network;
     cache a successful copy so a second offline launch can still use it */
  if (url.origin !== self.location.origin) {
    e.respondWith(
      fetch(e.request).then(function (resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') { var copy = resp.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
        return resp;
      }).catch(function () { return caches.match(e.request); })
    );
    return;
  }
  /* same-origin: cache-first, fall back to network, then to the app shell */
  e.respondWith(
    caches.match(e.request).then(function (r) {
      return r || fetch(e.request).then(function (resp) {
        if (resp && resp.status === 200) { var copy = resp.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
        return resp;
      }).catch(function () { return caches.match('index.html'); });
    })
  );
});
