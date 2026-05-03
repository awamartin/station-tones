import { describe, it, expect } from 'vitest';
import { generateMelody } from '../src/melody.js';
import { toWav } from '../src/wav.js';

describe('toWav', () => {
  const melody = generateMelody('Paddington-1');

  it('writes a valid 16-bit PCM mono RIFF/WAVE container', () => {
    const buf = toWav(melody);
    expect(buf.slice(0, 4).toString('ascii')).toBe('RIFF');
    expect(buf.slice(8, 12).toString('ascii')).toBe('WAVE');
    expect(buf.slice(12, 16).toString('ascii')).toBe('fmt ');
    expect(buf.readUInt16LE(20)).toBe(1);
    expect(buf.readUInt16LE(22)).toBe(1);
    expect(buf.readUInt32LE(24)).toBe(44100);
    expect(buf.readUInt16LE(34)).toBe(16);
    expect(buf.slice(36, 40).toString('ascii')).toBe('data');

    const dataLen = buf.readUInt32LE(40);
    expect(dataLen).toBe(buf.length - 44);
    expect(dataLen / 2).toBe(Math.round((melody.durationMs / 1000) * 44100));
  });

  it('honours a custom sample rate', () => {
    const buf = toWav(melody, { sampleRate: 22050 });
    expect(buf.readUInt32LE(24)).toBe(22050);
    const dataLen = buf.readUInt32LE(40);
    expect(dataLen / 2).toBe(Math.round((melody.durationMs / 1000) * 22050));
  });

  it('produces non-silent audio', () => {
    const buf = toWav(melody);
    let peak = 0;
    for (let i = 44; i < buf.length; i += 2) {
      const s = Math.abs(buf.readInt16LE(i));
      if (s > peak) peak = s;
    }
    expect(peak).toBeGreaterThan(1000);
  });
});
