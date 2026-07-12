#!/usr/bin/env node
/*
 * Downloads the four Ancient Sky illustrations into astrology/art/.
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
  'ancient-egypt.webp': BASE + 'hf_20260712_095740_41322ef8-e25c-425b-b7e5-cc586503dae7_min.webp',
  'ancient-babylon.webp': BASE + 'hf_20260712_095802_7f7033f0-235d-4e1d-a214-42e3468179aa_min.webp',
  'ancient-persia.webp': BASE + 'hf_20260712_095815_871fcbdc-3303-4205-a6f1-9ace190c1b01_min.webp',
  'ancient-vedic.webp': BASE + 'hf_20260712_095827_abaaea03-fec2-46e3-842d-c92225243807_min.webp'
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
