/**
 * controls.js — tactile builder controls.
 *
 * Minimal, physical-feeling inputs for the workshop: rotary knobs you drag,
 * a flip switch, and a colour slider. Pure DOM + CSS (styled in theme.css),
 * no framework. Each returns its root element and reports via onChange.
 */

import { fb } from '../sys/feedback.js';

/**
 * Rotary knob. Drag up/down (or left/right) to turn it across ~270°.
 * @param {{
 *   label:string, min:number, max:number, value:number,
 *   step?:number, format?:(v:number)=>string, onChange:(v:number)=>void
 * }} o
 */
export function Knob(o) {
  const root = el('div', 'ctl knob');
  const dial = el('div', 'knob-dial');
  const ind  = el('div', 'knob-ind');
  dial.appendChild(ind);
  const name = el('div', 'ctl-label', o.label);
  const val  = el('div', 'ctl-val');
  root.append(dial, name, val);

  const ANGLE = 270;                 // sweep
  let value = o.value;
  const fmt = o.format || (v => String(o.step >= 1 ? Math.round(v) : v.toFixed(1)));

  function render() {
    const t = (value - o.min) / (o.max - o.min);
    dial.style.setProperty('--turn', `${-135 + t * ANGLE}deg`);
    val.textContent = fmt(value);
  }
  function set(v) {
    v = Math.max(o.min, Math.min(o.max, v));
    if (o.step) v = Math.round(v / o.step) * o.step;
    if (v !== value) { value = v; render(); fb.tick(); o.onChange(value); }
    else render();
  }

  // Drag to turn: vertical drag is primary, horizontal adds fine control.
  let startY = 0, startX = 0, startV = 0, dragging = false;
  const range = o.max - o.min;
  function down(e) {
    dragging = true; dial.setPointerCapture?.(e.pointerId);
    startY = e.clientY; startX = e.clientX; startV = value;
    dial.classList.add('grab'); e.preventDefault();
  }
  function move(e) {
    if (!dragging) return;
    const dy = startY - e.clientY;          // up = increase
    const dx = e.clientX - startX;
    set(startV + ((dy + dx) / 160) * range);
  }
  function up(e) { dragging = false; dial.classList.remove('grab'); dial.releasePointerCapture?.(e.pointerId); }
  dial.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  // Wheel for desktop fine-tuning.
  dial.addEventListener('wheel', e => { e.preventDefault(); set(value - Math.sign(e.deltaY) * (o.step || range / 30)); }, { passive: false });

  render();
  return { root, set, get value() { return value; } };
}

/**
 * Flip switch (on/off).
 * @param {{label:string, value?:boolean, onChange:(v:boolean)=>void}} o
 */
export function Switch(o) {
  const root = el('div', 'ctl switch');
  const track = el('div', 'sw-track');
  const knob  = el('div', 'sw-knob');
  track.appendChild(knob);
  const name = el('div', 'ctl-label', o.label);
  root.append(track, name);
  let on = !!o.value;
  function render() { root.classList.toggle('on', on); }
  track.addEventListener('click', () => { on = !on; render(); fb.toggle(on); o.onChange(on); });
  render();
  return { root, set: v => { on = v; render(); }, get value() { return on; } };
}

/**
 * Colour slider — horizontal track showing the hue spectrum.
 * @param {{label:string, value:number, onChange:(hue:number)=>void}} o
 */
export function HueSlider(o) {
  const root = el('div', 'ctl hue');
  const track = el('div', 'hue-track');
  const thumb = el('div', 'hue-thumb');
  track.appendChild(thumb);
  const name = el('div', 'ctl-label', o.label);
  root.append(track, name);
  let value = o.value;
  function render() {
    thumb.style.left = `${value * 100}%`;
    thumb.style.background = `hsl(${value * 360},72%,55%)`;
  }
  let dragging = false;
  function pick(clientX) {
    const r = track.getBoundingClientRect();
    value = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    render(); o.onChange(value);
  }
  track.addEventListener('pointerdown', e => { dragging = true; track.setPointerCapture?.(e.pointerId); pick(e.clientX); });
  window.addEventListener('pointermove', e => { if (dragging) pick(e.clientX); });
  window.addEventListener('pointerup', () => { dragging = false; });
  render();
  return { root, set: v => { value = v; render(); }, get value() { return value; } };
}

/**
 * Segmented selector — pick one option from a small set (e.g. leg style).
 * @param {{label:string, options:{v:string,t:string}[], value:string, onChange:(v:string)=>void}} o
 */
export function Selector(o) {
  const root = el('div', 'ctl seg');
  const name = el('div', 'ctl-label', o.label);
  const row  = el('div', 'seg-row');
  let value = o.value;
  o.options.forEach(opt => {
    const b = el('button', 'seg-btn', opt.t);
    b.dataset.v = opt.v;
    b.addEventListener('click', () => { value = opt.v; render(); fb.tick(); o.onChange(value); });
    row.appendChild(b);
  });
  function render() { row.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('on', b.dataset.v === value)); }
  root.append(name, row); render();
  return { root, get value() { return value; } };
}

// ── helper ─────────────────────────────────────────────────────────────────
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
