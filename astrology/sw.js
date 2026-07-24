/* Aqau Pluto service worker - ES5, offline-first single-file PWA */
var CACHE = 'aqau-pluto-v123';
var CORE = ['./', 'index.html', 'corpus.js', 'lib-astronomy.js', 'lib-p5.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
// the bundled public-domain Rider-Waite-Smith tarot deck (0.jpg .. 77.jpg), so the
// card art is there offline. Best-effort: a miss here never breaks the core precache.
var TAROT_ART = [];
for (var _ti = 0; _ti < 78; _ti++) TAROT_ART.push('tarot/' + _ti + '.jpg');
// the opt-in OpenDyslexic accessibility font, bundled so it works offline (the four
// brand fonts are inlined in index.html as data URIs, so they need no request at all).
var EXTRAS = ['fonts/OpenDyslexic-Regular.woff', 'fonts/OpenDyslexic-Bold.woff'];
// the Ancient Sky illustrations are optional bundled assets (see art/README.md); they get
// their own best-effort batch so a deployment without them never breaks the deck precache
var ART = ['art/ancient-egypt.webp', 'art/ancient-babylon.webp', 'art/ancient-persia.webp', 'art/ancient-vedic.webp', 'art/act-sun.webp', 'art/act-moon.webp', 'art/act-mars.webp', 'art/act-saturn.webp', 'art/act-venus.webp'];
self.addEventListener('install', function (e) {
  // precache the whole app at install, so offline works before every file has been visited
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(CORE)
        .then(function () { return c.addAll(TAROT_ART.concat(EXTRAS))['catch'](function () {}); })
        .then(function () { return c.addAll(ART)['catch'](function () {}); });
    })['catch'](function () {})
      .then(function () { return self.skipWaiting(); })
  );
});
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches['delete'](k); }));
    }).then(function () { return self.clients.claim(); }).then(function () {
      // a fresh version takes over: reload open pages once, so nobody is left on the stale shell
      return self.clients.matchAll({ type: 'window' }).then(function (cs) {
        cs.forEach(function (c) { try { if (c.navigate && c.url) c.navigate(c.url); } catch (e) {} });
      });
    })
  );
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  // This app is fully on-device: it only ever fetches its own files. Nothing you
  // enter leaves the phone, and the service worker never touches a cross-origin
  // request — anything not same-origin passes straight through, uncached.
  var sameOrigin;
  try { sameOrigin = new URL(e.request.url).origin === self.location.origin; } catch (err) { sameOrigin = false; }
  if (!sameOrigin) return;
  // the app shell is network-first: an updated deployment shows up on the very next open.
  // Heavy versioned assets (the vendored libraries, icons) stay cache-first for speed.
  var FRESH = e.request.mode === 'navigate';
  try { var up = new URL(e.request.url).pathname; if (/(?:^|\/)(index\.html|corpus\.js|manifest\.webmanifest)$/.test(up) || up === '/' ) FRESH = true; } catch (errF) {}
  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(e.request).then(function (cached) {
        var net = fetch(e.request).then(function (resp) {
          if (resp && resp.status === 200) cache.put(e.request, resp.clone());
          return resp;
        })['catch'](function () { return cached; });
        return FRESH ? net.then(function (r) { return r || cached; })['catch'](function () { return cached; }) : (cached || net);
      });
    })
  );
});

// opt-in daily background check (where supported): a gentle nudge to look at today's sky
self.addEventListener('periodicsync', function (e) {
  if (e.tag !== 'aqau-daily') return;
  e.waitUntil(
    self.registration.showNotification('Aqau Pluto', {
      body: 'The sky has moved - open to see what today touches in your chart.',
      icon: 'icon-192.png', tag: 'aqau-day'
    })['catch'](function () {})
  );
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
      for (var i = 0; i < cs.length; i++) if (cs[i].focus) return cs[i].focus();
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
