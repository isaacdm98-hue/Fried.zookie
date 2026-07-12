#!/usr/bin/env node
/*
 * Downloads the nine bundled illustrations (Ancient Sky headers + walkthrough act backdrops) into astrology/art/.
 * Run once, on your own machine, from the astrology/ folder:
 *
 *     node get-art.js
 *
 * The app works fine without them (the Ancient Sky beats just show text);
 * with them, each civilisation's beat gets its illustrated header, bundled
 * and served locally — the app itself never fetches art from the network.
 *
 * Provenance: commissioned AI-generated illustration (Higgsfield, Nano
 * Banana Pro, 2026) in the app's house style. Assets only — every word of
 * every reading remains deterministic. See art/README.md.
 */
var https = require('https');
var fs = require('fs');
var path = require('path');

var BASE = 'https://d8j0ntlcm91z4.cloudfront.net/user_3GOi38u71dNlmcLnlyx8X2gLWJE/';
var ART = {
  'ancient-egypt.webp': BASE + 'hf_20260712_102622_da416e46-04ed-4987-a33a-9b4f9b7663a2_min.webp',
  'ancient-babylon.webp': BASE + 'hf_20260712_102631_a0e5f765-1253-4cc3-b573-16f1dd9ba7a3_min.webp',
  'ancient-persia.webp': BASE + 'hf_20260712_102640_07e844d2-69ee-4cea-b1d7-af71661c8006_min.webp',
  'ancient-vedic.webp': BASE + 'hf_20260712_102650_b8d53223-a197-49be-a9bd-337c1f3c2c79_min.webp',
  'act-sun.webp': BASE + 'hf_20260712_102703_7e78596c-a5bb-448e-9331-afc88d939747_min.webp',
  'act-moon.webp': BASE + 'hf_20260712_102712_58d75913-618b-4e21-9b12-d640e455f9ac_min.webp',
  'act-mars.webp': BASE + 'hf_20260712_102725_93ce285d-4ae4-49cb-919c-18659b8bf717_min.webp',
  'act-saturn.webp': BASE + 'hf_20260712_102736_7d3bba3b-ee5a-45e6-a17c-afb0ca47ef14_min.webp',
  'act-venus.webp': BASE + 'hf_20260712_102750_1d459fdb-25eb-43b7-bc58-abb880c41812_min.webp'
};

var dir = path.join(__dirname, 'art');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

function get(url, dest, cb, hops) {
  https.get(url, function (res) {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && (hops || 0) < 4) {
      res.resume(); return get(res.headers.location, dest, cb, (hops || 0) + 1);
    }
    if (res.statusCode !== 200) { res.resume(); return cb(new Error('HTTP ' + res.statusCode)); }
    var out = fs.createWriteStream(dest);
    res.pipe(out);
    out.on('finish', function () { out.close(function () { cb(null, fs.statSync(dest).size); }); });
  }).on('error', cb);
}

var names = Object.keys(ART), done = 0, failed = 0;
names.forEach(function (name) {
  get(ART[name], path.join(dir, name), function (err, size) {
    if (err) { failed++; console.error('  FAIL ' + name + ': ' + err.message); }
    else console.log('  ok   ' + name + '  (' + Math.round(size / 1024) + ' KB)');
    if (++done === names.length) {
      console.log(failed ? '\n' + failed + ' failed — re-run, or regenerate via Higgsfield and update the URLs.'
        : '\nAll four in place. Redeploy the folder and the Ancient Sky is illustrated.');
      process.exit(failed ? 1 : 0);
    }
  });
});
