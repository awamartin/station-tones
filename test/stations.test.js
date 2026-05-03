import { describe, it, expect } from 'vitest';
import { generateMelody } from '../src/melody.js';

function midiArr(melody) {
  return melody.notes.map((n) => n.midi);
}

describe('station/platform sharing rules', () => {
  it('shares the first 6 notes between platforms of the same station', () => {
    const a = midiArr(generateMelody('Paddington-1'));
    const b = midiArr(generateMelody('Paddington-2'));
    expect(a.slice(0, 6)).toEqual(b.slice(0, 6));
  });

  it('uses the same scale for all platforms of one station', () => {
    const a = generateMelody('Paddington-1');
    const b = generateMelody('Paddington-2');
    const c = generateMelody('Paddington-Northbound');
    expect(a.scale.name).toBe(b.scale.name);
    expect(b.scale.name).toBe(c.scale.name);
  });

  it('produces a different last 2 notes for different platforms', () => {
    const a = midiArr(generateMelody('Paddington-1'));
    const b = midiArr(generateMelody('Paddington-2'));
    expect(a.slice(6)).not.toEqual(b.slice(6));
  });

  it('produces different first 6 notes across distinct stations', () => {
    const a = midiArr(generateMelody('Paddington-1'));
    const b = midiArr(generateMelody('Euston-1'));
    expect(a.slice(0, 6)).not.toEqual(b.slice(0, 6));
  });

  it('does not collide platform tails across distinct stations', () => {
    const a = midiArr(generateMelody('Alpha-1'));
    const b = midiArr(generateMelody('Beta-1'));
    expect(a.slice(6)).not.toEqual(b.slice(6));
  });
});
