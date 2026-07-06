/* Aqau Pluto service worker - ES5, offline-first single-file PWA */
var CACHE = 'aqau-pluto-v40';
var THUMBS = 'aqau-thumbs-v1';
var CORE = ['./', 'index.html', 'corpus.js', 'lib-astronomy.js', 'lib-p5.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', function (e) {
  // precache the whole app at install, so offline works before every file has been visited
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(CORE); })['catch'](function () {})
      .then(function () { return self.skipWaiting(); })
  );
});
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE && k !== THUMBS) return caches['delete'](k); }));
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
  // Only ever cache our own files. The optional on-device LLM pulls hundreds of MB
  // of model shards from a CDN and manages its own Cache/IndexedDB storage — never
  // shadow-cache those (it would blow quota and double-store the weights). Let any
  // cross-origin request pass straight through to the network.
  var sameOrigin;
  try { sameOrigin = new URL(e.request.url).origin === self.location.origin; } catch (err) { sameOrigin = false; }
  if (!sameOrigin) {
    // narrow exception: the tiny Internet Archive thumbnails that back the Watch
    // channel guide are cached, so the guide still renders offline. Everything
    // else cross-origin (incl. any large media) passes straight through.
    var isIaThumb = false;
    try { var u = new URL(e.request.url); isIaThumb = (u.hostname === 'archive.org' && u.pathname.indexOf('/services/img/') === 0) || u.hostname === 'cdn.jsdelivr.net'; } catch (err2) {}
    if (!isIaThumb) return;
    e.respondWith(
      caches.open(THUMBS).then(function (cache) {
        return cache.match(e.request).then(function (cached) {
          var net = fetch(e.request).then(function (resp) {
            if (resp && (resp.status === 200 || resp.type === 'opaque')) cache.put(e.request, resp.clone());
            return resp;
          })['catch'](function () { return cached; });
          return cached || net;
        });
      })
    );
    return;
  }
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
