export const PALETTE = [
  '#e8854a','#f0b429','#4ade80','#38bdf8','#a78bfa',
  '#f472b6','#fb7185','#34d399','#60a5fa','#c084fc',
];

export function defaultGenome(name = 'Newzook') {
  return {
    name,
    color: PALETTE[0],
    body: { w: 0.60, h: 0.55, l: 1.0, mass: 2.0 },
    legCount: 4,
    leg: { len: 0.95, radius: 0.14 },
    gait: { freq: 2.2, amplitude: 0.70, drive: 12, jump: 0, steer: 0 },
  };
}

export function randomGenome() {
  const names = ['Zipzook','Chomper','Bolt','Flumps','Dasher','Wobble','Bouncer','Quake','Zara','Blip'];
  return {
    name: names[Math.floor(Math.random() * names.length)],
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    body: {
      w: 0.40 + Math.random() * 0.50,
      h: 0.35 + Math.random() * 0.45,
      l: 0.70 + Math.random() * 0.70,
      mass: 1.0 + Math.random() * 3.0,
    },
    legCount: [2, 4, 6, 8][Math.floor(Math.random() * 4)],
    leg: {
      len: 0.70 + Math.random() * 0.60,
      radius: 0.10 + Math.random() * 0.10,
    },
    gait: {
      freq: 1.5 + Math.random() * 3.0,
      amplitude: 0.40 + Math.random() * 0.60,
      drive: 6 + Math.random() * 16,
      jump: 0,
      steer: (Math.random() - 0.5) * 0.4,
    },
  };
}

export function cloneGenome(g) {
  return JSON.parse(JSON.stringify(g));
}

export const AI_GENOMES = [
  { name: 'Rival',   color: '#fb7185', body:{w:0.60,h:0.55,l:1.0,mass:2.2}, legCount:4, leg:{len:0.95,radius:0.14}, gait:{freq:2.5,amplitude:0.75,drive:13,jump:0,steer:0} },
  { name: 'Chomper', color: '#f472b6', body:{w:0.70,h:0.60,l:1.1,mass:2.8}, legCount:6, leg:{len:0.80,radius:0.14}, gait:{freq:2.0,amplitude:0.65,drive:14,jump:0,steer:0} },
  { name: 'Bolt',    color: '#38bdf8', body:{w:0.45,h:0.40,l:0.85,mass:1.4}, legCount:4, leg:{len:1.05,radius:0.12}, gait:{freq:3.0,amplitude:0.80,drive:16,jump:0,steer:0} },
  { name: 'Dasher',  color: '#4ade80', body:{w:0.55,h:0.50,l:0.95,mass:1.8}, legCount:4, leg:{len:0.90,radius:0.13}, gait:{freq:2.8,amplitude:0.70,drive:15,jump:0,steer:0} },
];

export function loadRoster() {
  try { return JSON.parse(localStorage.getItem('fz-zooks') || '[]'); }
  catch { return []; }
}

export function saveRoster(list) {
  localStorage.setItem('fz-zooks', JSON.stringify(list));
}
