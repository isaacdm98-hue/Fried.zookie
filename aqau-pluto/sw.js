/* Aqau Pluto service worker - ES5, offline-first single-file PWA */
var CACHE = 'aqau-pluto-v6';
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches['delete'](k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  // Only ever cache our own files. The optional on-device LLM pulls hundreds of MB
  // of model shards from a CDN and manages its own Cache/IndexedDB storage — never
  // shadow-cache those (it would blow quota and double-store the weights). Let any
  // cross-origin request pass straight through to the network.
  var sameOrigin;
  try { sameOrigin = new URL(e.request.url).origin === self.location.origin; } catch (err) { sameOrigin = false; }
  if (!sameOrigin) return;
  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(e.request).then(function (cached) {
        var net = fetch(e.request).then(function (resp) {
          if (resp && resp.status === 200) cache.put(e.request, resp.clone());
          return resp;
        })['catch'](function () { return cached; });
        return cached || net;
      });
    })
  );
});
