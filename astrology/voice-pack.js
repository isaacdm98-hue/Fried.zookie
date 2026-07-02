/* Aqau Pluto voice pack — Kokoro-82M (Apache-2.0), the best small open voice there is.
   Nothing here touches the network until the user asks for it in Settings. The model
   (~90MB, quantised) is fetched once from the Hugging Face CDN, cached on-device by
   transformers.js, and speaks locally from then on; no words ever leave the device.
   This file parses as ES5 everywhere: the modern loader hides inside Function(). */
(function () {
  var V = { state: 'idle', progress: 0, status: '', tts: null, playing: null, audioEl: null };
  function setState(st, msg) { V.state = st; V.status = msg || ''; }
  V.load = function () {
    if (V.state === 'loading' || V.state === 'ready') return;
    setState('loading', 'Reaching for the voice'); V.progress = 0;
    var run;
    try {
      run = new Function('V', 'setState', [
        "return import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.0/+esm').then(function (mod) {",
        "  setState('loading', 'Downloading the voice (once)');",
        "  return mod.KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {",
        "    dtype: 'q8', device: 'wasm',",
        "    progress_callback: function (info) { if (info && info.progress != null) { V.progress = Math.max(V.progress, info.progress / 100); } }",
        "  });",
        "}).then(function (tts) { V.tts = tts; V.progress = 1; setState('ready', 'The voice lives on this device now.'); })"
      ].join('\n'));
    } catch (e) { setState('error', 'This browser cannot load the voice.'); return; }
    try {
      run(V, setState)['catch'](function () {
        setState('error', 'Could not fetch the voice. Nothing broke; try again with a connection.');
      });
    } catch (e2) { setState('error', 'This browser cannot load the voice.'); }
  };
  V.speak = function (text) {
    if (V.state !== 'ready' || !V.tts) return false;
    V.stop();
    var parts = String(text).replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) || [String(text)];
    var idx = 0, cancelled = false;
    V.playing = { cancel: function () { cancelled = true; try { if (V.audioEl) V.audioEl.pause(); } catch (e) {} } };
    function next() {
      if (cancelled || idx >= parts.length) { V.playing = null; return; }
      var sent = parts[idx++].replace(/^\s+|\s+$/g, ''); if (!sent) { next(); return; }
      var gen;
      try { gen = new Function('tts', 'sent', "return tts.generate(sent, { voice: 'af_heart' })"); }
      catch (e) { V.playing = null; return; }
      gen(V.tts, sent).then(function (audio) {
        if (cancelled) return;
        var blob = null; try { blob = audio.toBlob ? audio.toBlob() : null; } catch (e) {}
        if (!blob) { next(); return; }
        var url = URL.createObjectURL(blob), el = new Audio(url);
        V.audioEl = el;
        el.onended = function () { try { URL.revokeObjectURL(url); } catch (e) {} next(); };
        el.onerror = function () { try { URL.revokeObjectURL(url); } catch (e) {} next(); };
        var pr = el.play(); if (pr && pr['catch']) pr['catch'](function () { next(); });
      })['catch'](function () { next(); });
    }
    next(); return true;
  };
  V.stop = function () { if (V.playing) V.playing.cancel(); V.playing = null; };
  window.AqauVoice = V;
})();
