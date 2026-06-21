/**
 * qr.js — QR code generation + camera scanning for the link handshake.
 */

import QRCode from 'qrcode';
import jsQR from 'jsqr';

/** Render `text` to a QR canvas (warm palette to match the device). */
export function makeQR(text) {
  const c = document.createElement('canvas');
  return new Promise((resolve) => {
    QRCode.toCanvas(c, text, { width: 260, margin: 1, errorCorrectionLevel: 'L', color: { dark: '#1c160c', light: '#f5ecd6' } },
      () => resolve(c));
  });
}

/**
 * Start the rear camera and scan for a QR. Calls onCode(text) once, then stops.
 * Returns a stop() function. Throws if camera access is denied/unavailable.
 */
export async function startScan(videoEl, onCode) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
  videoEl.srcObject = stream; videoEl.setAttribute('playsinline', ''); await videoEl.play();
  const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let stopped = false;
  const stop = () => { stopped = true; stream.getTracks().forEach(t => t.stop()); };
  const tick = () => {
    if (stopped) return;
    if (videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
      canvas.width = videoEl.videoWidth; canvas.height = videoEl.videoHeight;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (code && code.data) { onCode(code.data); stop(); return; }
    }
    requestAnimationFrame(tick);
  };
  tick();
  return stop;
}
