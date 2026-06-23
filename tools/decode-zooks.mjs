/**
 * decode-zooks.mjs — decode the original encrypted .zook genome files into the
 * app's blueprint format and (re)generate src/zook/zooks-data.js.
 *
 * The .zook archive format (Bonsai Engine):
 *   [ascii header line "...Version: 000000001. \n" + name/banner + 5 meta bytes]
 *   [ Blowfish-ECB ciphertext, key = "macaca mulatta" (GenomeConfiguration.ssx) ]
 *   → zlib-inflate → an XML <zook><genome><bodysolid …> part tree.
 *
 * Run with the OpenSSL legacy provider (Blowfish lives there on modern Node):
 *   node --openssl-legacy-provider tools/decode-zooks.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import crypto from 'crypto';
import zlib from 'zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = Buffer.from('macaca mulatta', 'latin1');
const D2R = Math.PI / 180;
const f = (v) => { const n = +v; return Number.isFinite(n) ? n : 0; };

/** Decrypt + inflate one .zook → its genome XML string. */
export function decodeZook(file) {
  const buf = readFileSync(file);
  for (let off = 0; off < 256 && off < buf.length - 8; off++) {
    let len = buf.length - off; len -= len % 8; if (len <= 0) continue;
    try {
      const probe = crypto.createDecipheriv('bf-ecb', KEY, null); probe.setAutoPadding(false);
      const first = probe.update(buf.slice(off, off + 8));
      if (first[0] === 0x78 && (first[1] === 0x9c || first[1] === 0x01 || first[1] === 0xda)) {
        const d = crypto.createDecipheriv('bf-ecb', KEY, null); d.setAutoPadding(false);
        const clear = Buffer.concat([d.update(buf.slice(off, off + len)), d.final()]);
        return zlib.inflateSync(clear).toString('latin1');
      }
    } catch (_) { /* keep scanning */ }
  }
  throw new Error('no zlib/Blowfish payload found in ' + file);
}

/** Walk the XML → flat list of bodysolid nodes with parent links + IK gait paths. */
function parseGenome(xml) {
  const body = xml.slice(xml.indexOf('<genome'));
  const re = /<\/?([A-Za-z_]+)([^>]*?)>/g; let m; const stack = []; const solids = [];
  const attrsOf = (s) => { const o = {}; const ar = /([A-Za-z_]+)\s*=\s*"([^"]*)"/g; let a; while ((a = ar.exec(s))) o[a[1]] = a[2]; return o; };
  while ((m = re.exec(body))) {
    if (body[m.index + 1] === '/') { stack.pop(); continue; }
    if (m[1] === 'bodysolid') {
      const pb = [...stack].reverse().find((s) => s.tag === 'bodysolid');
      solids.push({ attrs: attrsOf(m[2]), parentIdx: pb ? pb.idx : null, idx: solids.length, gait: [] });
      stack.push({ tag: 'bodysolid', idx: solids.length - 1 });
    } else if (m[1] === 'point') {            // an IK foot-path point — belongs to the enclosing leg
      const pb = [...stack].reverse().find((s) => s.tag === 'bodysolid');
      const a = attrsOf(m[2]);
      if (pb) solids[pb.idx].gait.push({ x: r3(f(a.x)), y: r3(f(a.y)), z: r3(f(a.z)) });
      stack.push({ tag: m[1], idx: null });
    } else stack.push({ tag: m[1], idx: null });
  }
  return solids;
}

const hex = (a) => ((Math.round(f(a.colour_red) * 255) << 16) | (Math.round(f(a.colour_green) * 255) << 8) | Math.round(f(a.colour_blue) * 255));
function rgb2hue(a) {
  const r = f(a.colour_red), g = f(a.colour_green), b = f(a.colour_blue), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0; if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6; if (h < 0) h += 1; }
  return h;
}
const r3 = (n) => +n.toFixed(3);

// Blob superquadric shape params (graphics), as authored in the genome.
const shapeOf = (a) => ({ bias: r3(f(a.bias)), flatness: r3(f(a.flatness)), asymmetry: r3(f(a.asymmetry)), cubosity: r3(f(a.cubosity)) });
// Dedupe an IK gait path (the genome stores the loop twice) → one clean loop.
function cleanGait(pts) {
  if (!pts.length) return undefined;
  const half = pts.slice(0, pts.length / 2);
  const same = half.length && half.every((p, i) => pts[i + half.length] && p.x === pts[i + half.length].x && p.y === pts[i + half.length].y && p.z === pts[i + half.length].z);
  return (same ? half : pts);
}

/** Convert a parsed genome into the app blueprint (root = body, children = clay tree).
 *  Captures the FULL genome: shape deformation (graphics), muscle stiffness/damping
 *  and the IK foot-path (physics), and theta/phi connection — everything the exact
 *  graphics + physics engine needs. */
function toBlueprint(name, solids) {
  const root = solids.find((s) => s.parentIdx === null) || solids[0]; const ra = root.attrs;
  // genome scalex = X (width), scaley = Y (height), scalez = Z (length)
  const bp = { width: r3(f(ra.scalex) || 1), height: r3(f(ra.scaley) || 1), len: r3(f(ra.scalez) || 1.6),
    hue: r3(rgb2hue(ra)), bodyRgb: hex(ra), bodyMesh: (ra.mesh || 'Blob').toLowerCase(), bodyShape: shapeOf(ra), blobs: [] };
  const blobOf = {};
  for (const s of solids) {
    if (s === root) continue;
    const a = s.attrs, lt = a.leg_type, moving = lt === '1' || lt === '2';
    const parent = s.parentIdx === root.idx ? null : (blobOf[s.parentIdx] ?? null);
    const b = { x: r3(f(a.posx)), y: r3(f(a.posy)), z: r3(f(a.posz)),
      sx: r3(f(a.scalex) || 0.4), sy: r3(f(a.scaley) || 0.4), sz: r3(f(a.scalez) || 0.4),
      mesh: (a.mesh || 'Blob').toLowerCase(), rgb: hex(a), parent,
      shape: shapeOf(a),
      // Connection on the parent surface (authentic theta/phi), kept in degrees.
      theta: r3(f(a.theta)), phi: r3(f(a.phi)), mirror: +f(a.mirror_group) || 0 };
    const p = r3(f(a.pitch) * D2R), y = r3(f(a.yaw) * D2R), t = r3(f(a.roll) * D2R);
    if (Math.abs(p) > 0.001) b.pitch = p; if (Math.abs(y) > 0.001) b.yaw = y; if (Math.abs(t) > 0.001) b.twist = t;
    if (moving) {
      // leg_type 2 = part+parent form a 2-bone IK leg; the parent is already its
      // own part, so the moving part is a single hanging segment here. We keep the
      // real leg_type, muscle params and foot-path for the articulated engine.
      b.move = 'single'; b.legType = +lt; b.cycle = r3(f(a.leg_phase));
      b.muscleStiffness = +f(a.muscle_stiffness) || 5000; b.muscleDamping = +f(a.muscle_damping) || 5000;
      b.muscle = +Math.max(0.4, Math.min(2.2, (b.muscleStiffness) / 5000)).toFixed(2);
      const sd = a.ik_side || 'Auto';
      b.moveType = sd === 'Left side' ? 'left' : sd === 'Right side' ? 'right' : sd === 'Always' ? 'always' : 'auto';
      const gait = cleanGait(s.gait);
      if (gait) b.gait = gait;
    }
    // Pre-seat onto the parent surface so the part TOUCHES with the engine's raw
    // placement (the engine no longer re-seats — builder and sim share one model).
    const pa = s.parentIdx === root.idx ? ra : solids[s.parentIdx].attrs;
    const ph = { x: (f(pa.scalex) || 1) / 2, y: (f(pa.scaley) || 1) / 2, z: (f(pa.scalez) || 1) / 2 };
    const ch = { x: b.sx / 2, y: b.sy / 2, z: b.sz / 2 };
    const len = Math.hypot(b.x, b.y, b.z);
    if (len > 1e-4) {
      const dx = b.x / len, dy = b.y / len, dz = b.z / len;
      const q = Math.sqrt((dx / ph.x) ** 2 + (dy / ph.y) ** 2 + (dz / ph.z) ** 2);
      const tt = q > 1e-6 ? 1 / q : Math.min(ph.x, ph.y, ph.z);
      const support = Math.abs(dx) * ch.x + Math.abs(dy) * ch.y + Math.abs(dz) * ch.z;
      // Seat the part's near face ~18% inside the parent's (box) surface, so it stays
      // visually joined even where the rendered Blob is pulled in by its shape params
      // (bias/flatness/asymmetry/cubosity) — there's no physics in the static preview.
      const dist = tt * 0.82 + support;
      b.x = r3(dx * dist); b.y = r3(dy * dist); b.z = r3(dz * dist);
    }
    blobOf[s.idx] = bp.blobs.length; bp.blobs.push(b);
  }
  return { name, bp };
}

function main() {
  const dir = path.join(ROOT, 'reference/zooks');
  const out = readdirSync(dir).filter((n) => n.endsWith('.zook')).sort().map((n) => {
    const name = n.replace(/\.zook$/, '');
    return toBlueprint(name, parseGenome(decodeZook(path.join(dir, n))));
  });
  const header = `/**\n * zooks-data.js — the REAL BAMZOOKi demo Zooks, decoded from the original\n * encrypted .zook genome files (Blowfish-ECB key "macaca mulatta" + zlib + XML)\n * shipped with the Series-1 Zook Kit. Each is the authentic part tree.\n * Generated by tools/decode-zooks.mjs — do not hand-edit.\n */\n`;
  writeFileSync(path.join(ROOT, 'src/zook/zooks-data.js'), header + 'export const REAL_ZOOKS = ' + JSON.stringify(out, null, 1) + ';\n');
  console.log('decoded', out.map((z) => `${z.name}(${z.bp.blobs.length})`).join(' '));
}
if (import.meta.url === `file://${process.argv[1]}`) main();
