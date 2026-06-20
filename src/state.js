import { defaultGenome, loadRoster } from './creature/genome.js';

export const S = {
  screen: 'loading',
  activeGenome: defaultGenome(),
  roster: loadRoster(),
  mute: localStorage.getItem('fz-mute') === '1',
  narrate: localStorage.getItem('fz-voice') !== '0',

  raceMode: null,
  raceConfig: null,
  champState: null,

  vsA: null,
  vsB: null,

  netRole: null,
  netPeer: null,
  netGenome: null,
};

const listeners = new Set();
export function onState(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function setState(patch) {
  Object.assign(S, patch);
  for (const fn of listeners) fn(S);
}
