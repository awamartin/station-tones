import { describe, it, expect } from 'vitest';
import { generateMelody, parseIdentifier } from '../src/melody.js';
import { buildMajorScale } from '../src/scales.js';

describe('parseIdentifier', () => {
  it('splits on the last dash', () => {
    expect(parseIdentifier('Paddington-1')).toEqual({ station: 'Paddington', platform: '1' });
    expect(parseIdentifier('Kings-Cross-2')).toEqual({ station: 'Kings-Cross', platform: '2' });
  });

  it('rejects empty / malformed identifiers', () => {
    expect(() => parseIdentifier('')).toThrow();
    expect(() => parseIdentifier('Paddington')).toThrow();
    expect(() => parseIdentifier('-1')).toThrow();
    expect(() => parseIdentifier('Paddington-')).toThrow();
  });
});

describe('generateMelody', () => {
  it('produces 8 notes totalling 4 seconds at 120 BPM', () => {
    const melody = generateMelody('Paddington-1');
    expect(melody.notes).toHaveLength(8);
    expect(melody.bpm).toBe(120);
    expect(melody.durationMs).toBe(4000);
    for (const note of melody.notes) {
      expect(note.durationMs).toBe(500);
    }
    expect(melody.notes.map((n) => n.startMs)).toEqual([0, 500, 1000, 1500, 2000, 2500, 3000, 3500]);
  });

  it('is deterministic', () => {
    const a = generateMelody('Paddington-1');
    const b = generateMelody('Paddington-1');
    expect(a).toEqual(b);
  });

  it('keeps every note inside the chosen major scale', () => {
    const melody = generateMelody('Paddington-1');
    const scale = new Set(buildMajorScale(melody.scale.midiTonic, 2));
    for (const note of melody.notes) {
      expect(scale.has(note.midi)).toBe(true);
      expect(note.scaleDegree).toBeGreaterThanOrEqual(1);
      expect(note.scaleDegree).toBeLessThanOrEqual(7);
    }
  });

  it('throws on bad input', () => {
    expect(() => generateMelody('')).toThrow();
    expect(() => generateMelody('NoDash')).toThrow();
  });

  it('honours a custom bpm', () => {
    const melody = generateMelody('Paddington-1', { bpm: 60 });
    expect(melody.bpm).toBe(60);
    expect(melody.durationMs).toBe(8000);
    expect(melody.notes[0].durationMs).toBe(1000);
  });
});
