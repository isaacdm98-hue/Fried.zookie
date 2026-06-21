/**
 * link.js — serverless WebRTC pairing over a QR/code handshake.
 *
 * No signalling server: the offer/answer SDP are compressed (lz-string) and
 * passed between phones as a QR code (or pasted code). One public STUN server
 * is used for NAT traversal. The host is authoritative for the contest; the
 * joiner streams its Zook over and renders state the host sends back.
 *
 *   Host:   const l = new Link(); const code = await l.host();   // → QR
 *           ... show code; scan joiner's reply ...
 *           await l.accept(replyCode);                            // connected
 *   Joiner: const l = new Link(); const reply = await l.join(code); // → QR
 *           ... show reply; host scans it ...
 */

import LZ from 'lz-string';

const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }] };

export class Link {
  constructor() {
    this.pc = null; this.dc = null; this.role = null;
    this.onOpen = () => {}; this.onMessage = () => {}; this.onClose = () => {};
  }

  _wire(dc) {
    this.dc = dc;
    dc.onopen = () => this.onOpen();
    dc.onclose = () => this.onClose();
    dc.onmessage = (e) => { try { this.onMessage(JSON.parse(e.data)); } catch (_) {} };
  }

  // Wait until ICE gathering finishes so a single SDP blob carries everything.
  _iceComplete() {
    return new Promise((res) => {
      if (this.pc.iceGatheringState === 'complete') return res();
      const check = () => { if (this.pc.iceGatheringState === 'complete') { this.pc.removeEventListener('icegatheringstatechange', check); res(); } };
      this.pc.addEventListener('icegatheringstatechange', check);
      setTimeout(res, 2500);   // fallback: proceed with whatever we have
    });
  }

  /** Host: returns a compact code for the offer (show as QR). */
  async host() {
    this.role = 'host';
    this.pc = new RTCPeerConnection(ICE);
    this._wire(this.pc.createDataChannel('zook', { ordered: true }));
    await this.pc.setLocalDescription(await this.pc.createOffer());
    await this._iceComplete();
    return encode(this.pc.localDescription);
  }

  /** Host: consume the joiner's reply code to finish connecting. */
  async accept(code) {
    await this.pc.setRemoteDescription(decode(code));
  }

  /** Joiner: consume host offer code, return a reply code (show as QR). */
  async join(code) {
    this.role = 'join';
    this.pc = new RTCPeerConnection(ICE);
    this.pc.ondatachannel = (e) => this._wire(e.channel);
    await this.pc.setRemoteDescription(decode(code));
    await this.pc.setLocalDescription(await this.pc.createAnswer());
    await this._iceComplete();
    return encode(this.pc.localDescription);
  }

  send(obj) { if (this.dc && this.dc.readyState === 'open') this.dc.send(JSON.stringify(obj)); }
  close() { try { this.dc?.close(); } catch (_) {} try { this.pc?.close(); } catch (_) {} }
}

// SDP is trimmed + compressed so the QR stays scannable.
function encode(desc) {
  const o = { t: desc.type === 'offer' ? 'o' : 'a', s: desc.sdp };
  return LZ.compressToEncodedURIComponent(JSON.stringify(o));
}
function decode(code) {
  const o = JSON.parse(LZ.decompressFromEncodedURIComponent(code.trim()));
  return { type: o.t === 'o' ? 'offer' : 'answer', sdp: o.s };
}
