/**
 * webrtc.js — P2P WebRTC networking for FriedZooki online multiplayer.
 * Signalling is done out-of-band via base64 JSON offer/answer codes.
 */

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const CHANNEL_LABEL = 'friedzooki';

export class PeerNet {
  constructor() {
    this._pc = null;
    this._channel = null;
    this._handlers = { open: [], close: [], data: [] };
  }

  // --- Public API ---

  /**
   * HOST: Create offer. Returns base64 JSON string to share with the joiner.
   * @returns {Promise<string>} offerCode
   */
  async host() {
    this._pc = this._createPC();

    // Create data channel (host side)
    this._channel = this._pc.createDataChannel(CHANNEL_LABEL);
    this._wireChannel(this._channel);

    const offer = await this._pc.createOffer();
    await this._pc.setLocalDescription(offer);

    // Wait for ICE gathering to complete
    await this._waitForICE();

    return _encode(this._pc.localDescription);
  }

  /**
   * JOINER: Accept offer, return answer code.
   * @param {string} offerCode — base64 JSON from host()
   * @returns {Promise<string>} answerCode
   */
  async join(offerCode) {
    this._pc = this._createPC();

    // Listen for data channel opened by host
    this._pc.ondatachannel = (e) => {
      this._channel = e.channel;
      this._wireChannel(this._channel);
    };

    const offerDesc = _decode(offerCode);
    await this._pc.setRemoteDescription(new RTCSessionDescription(offerDesc));

    const answer = await this._pc.createAnswer();
    await this._pc.setLocalDescription(answer);

    await this._waitForICE();

    return _encode(this._pc.localDescription);
  }

  /**
   * HOST: Finalise the connection after receiving answer from joiner.
   * @param {string} answerCode — base64 JSON from join()
   * @returns {Promise<void>}
   */
  async connect(answerCode) {
    if (!this._pc) throw new Error('PeerNet: call host() first');
    const answerDesc = _decode(answerCode);
    await this._pc.setRemoteDescription(new RTCSessionDescription(answerDesc));
    // Connection will open once ICE completes — handled via channel onopen
  }

  /**
   * Register an event handler.
   * @param {'open'|'close'|'data'} event
   * @param {Function} fn
   */
  on(event, fn) {
    if (!this._handlers[event]) {
      throw new Error(`PeerNet: unknown event '${event}'`);
    }
    this._handlers[event].push(fn);
  }

  /**
   * Send an object over the data channel (JSON stringified).
   * @param {object} obj
   */
  send(obj) {
    if (!this._channel || this._channel.readyState !== 'open') {
      console.warn('[PeerNet] send() called but channel not open');
      return;
    }
    this._channel.send(JSON.stringify(obj));
  }

  /** Close the connection and clean up. */
  close() {
    if (this._channel) {
      try { this._channel.close(); } catch (_) {}
      this._channel = null;
    }
    if (this._pc) {
      try { this._pc.close(); } catch (_) {}
      this._pc = null;
    }
  }

  // --- Private helpers ---

  _createPC() {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        console.warn('[PeerNet] ICE failed');
      }
    };

    return pc;
  }

  _wireChannel(ch) {
    ch.onopen = () => {
      this._emit('open');
    };

    ch.onclose = () => {
      this._emit('close');
    };

    ch.onmessage = (e) => {
      let parsed;
      try {
        parsed = JSON.parse(e.data);
      } catch (_) {
        parsed = e.data;
      }
      this._emit('data', parsed);
    };

    ch.onerror = (err) => {
      console.error('[PeerNet] channel error', err);
    };
  }

  _emit(event, payload) {
    const fns = this._handlers[event] || [];
    for (const fn of fns) {
      try { fn(payload); } catch (err) {
        console.error(`[PeerNet] handler error for '${event}'`, err);
      }
    }
  }

  /**
   * Wait until ICE gathering is complete (all candidates collected).
   * @returns {Promise<void>}
   */
  _waitForICE() {
    return new Promise((resolve) => {
      if (this._pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }
      const check = () => {
        if (this._pc.iceGatheringState === 'complete') {
          this._pc.removeEventListener('icegatheringstatechange', check);
          resolve();
        }
      };
      this._pc.addEventListener('icegatheringstatechange', check);

      // Fallback timeout — resolve after 5 s even if still gathering
      setTimeout(() => {
        this._pc.removeEventListener('icegatheringstatechange', check);
        resolve();
      }, 5000);
    });
  }
}

// --- Encoding helpers ---

function _encode(desc) {
  return btoa(JSON.stringify({ type: desc.type, sdp: desc.sdp }));
}

function _decode(code) {
  return JSON.parse(atob(code));
}
