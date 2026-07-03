/* Aqau Pluto voice pack — Kokoro-82M (Apache-2.0), the best small open voice there is.
   Nothing here touches the network until the user asks for it in Settings. The model
   (~90MB, quantised) is fetched once, cached on-device by transformers.js, and speaks
   locally from then on; no words ever leave the device.
   Playback uses WebAudio straight from the raw samples, so autoplay policies cannot
   mute it once the context is unlocked by the download tap itself.
   This file parses as ES5 everywhere: the modern loader hides inside Function(). */
(function () {
  var V = { state: 'idle', progress: 0, status: '', tts: null, playing: null, ctx: null };
  function setState(st, msg) { V.state = st; V.status = msg || ''; }
  function ensureCtx() {
    try {
      if (!V.ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (AC) V.ctx = new AC(); }
      if (V.ctx && V.ctx.state === 'suspended') V.ctx.resume();
    } catch (e) {}
    return V.ctx;
  }
  // two independent CDN builds; if the first bundler fails, the second usually does not
  var SOURCES = [
    'https://cdn.jsdelivr.net/npm/kokoro-js@1/+esm',
    'https://esm.sh/kokoro-js@1'
  ];
  V.load = function () {
    if (V.state === 'loading' || V.state === 'ready') return;
    ensureCtx(); // unlocked here, inside the user's tap
    setState('loading', 'Reaching for the voice'); V.progress = 0;
    var run;
    try {
      run = new Function('V', 'setState', 'srcs', [
        "function attempt(i) {",
        "  if (i >= srcs.length) return Promise.reject(new Error('all sources failed'));",
        "  return import(srcs[i]).then(function (mod) {",
        "    var K = mod.KokoroTTS || (mod.default && mod.default.KokoroTTS);",
        "    if (!K) throw new Error('no KokoroTTS export');",
        "    setState('loading', 'Downloading the voice (once)');",
        "    return K.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {",
        "      dtype: 'q8', device: 'wasm',",
        "      progress_callback: function (info) {",
        "        if (info && info.progress != null) { var pr = info.progress > 1 ? info.progress / 100 : info.progress; V.progress = Math.max(V.progress, pr); }",
        "      }",
        "    });",
        "  }).catch(function (err) {",
        "    if (i + 1 < srcs.length) { setState('loading', 'First mirror failed; trying another'); return attempt(i + 1); }",
        "    throw err;",
        "  });",
        "}",
        "return attempt(0).then(function (tts) { V.tts = tts; V.progress = 1; setState('ready', 'The voice lives on this device now.'); })"
      ].join('\n'));
    } catch (e) { setState('error', 'This browser cannot load the voice.'); return; }
    try {
      run(V, setState, SOURCES)['catch'](function (err) {
        setState('error', 'Could not fetch the voice (' + (err && err.message ? String(err.message).slice(0, 60) : 'network') + '). Try again with a connection.');
      });
    } catch (e2) { setState('error', 'This browser cannot load the voice.'); }
  };
  V.speak = function (text) {
    if (V.state !== 'ready' || !V.tts) return false;
    V.stop();
    var ctx = ensureCtx(); if (!ctx) return false;
    var parts = String(text).replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) || [String(text)];
    var idx = 0, cancelled = false, curSrc = null;
    V.playing = { cancel: function () { cancelled = true; try { if (curSrc) curSrc.stop(); } catch (e) {} } };
    function next() {
      if (cancelled || idx >= parts.length) { V.playing = null; return; }
      var sent = parts[idx++].replace(/^\s+|\s+$/g, ''); if (!sent) { next(); return; }
      var gen;
      try { gen = new Function('tts', 'sent', "return tts.generate(sent, { voice: 'af_heart' })"); }
      catch (e) { V.playing = null; return; }
      gen(V.tts, sent).then(function (audio) {
        if (cancelled) return;
        try {
          var samples = audio.audio || (audio.data && audio.data.audio), rate = audio.sampling_rate || 24000;
          if (!samples || !samples.length) { next(); return; }
          var buf = ctx.createBuffer(1, samples.length, rate);
          buf.getChannelData(0).set(samples);
          var src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination);
          curSrc = src; src.onended = function () { if (!cancelled) next(); };
          src.start();
        } catch (e) { next(); }
      })['catch'](function () { next(); });
    }
    next(); return true;
  };
  V.stop = function () { if (V.playing) V.playing.cancel(); V.playing = null; };
  window.AqauVoice = V;
})();
