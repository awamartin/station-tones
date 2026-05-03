import { describe, it, expect } from 'vitest';
import { generateMelody } from '../src/melody.js';
import { toMidi } from '../src/midi.js';

describe('toMidi', () => {
  const melody = generateMelody('Paddington-1');
  const buf = toMidi(melody);

  it('starts with a valid MThd header', () => {
    expect(buf.slice(0, 4).toString('ascii')).toBe('MThd');
    expect(buf.readUInt32BE(4)).toBe(6);
    expect(buf.readUInt16BE(8)).toBe(0);
    expect(buf.readUInt16BE(10)).toBe(1);
    expect(buf.readUInt16BE(12)).toBe(480);
  });

  it('has an MTrk chunk with a declared length matching its body', () => {
    const mtrkOffset = 14;
    expect(buf.slice(mtrkOffset, mtrkOffset + 4).toString('ascii')).toBe('MTrk');
    const trackLen = buf.readUInt32BE(mtrkOffset + 4);
    expect(buf.length).toBe(mtrkOffset + 8 + trackLen);
  });

  it('ends with the end-of-track meta event', () => {
    const tail = buf.slice(buf.length - 3);
    expect(tail[0]).toBe(0xff);
    expect(tail[1]).toBe(0x2f);
    expect(tail[2]).toBe(0x00);
  });

  it('contains exactly 8 note-on events', () => {
    let count = 0;
    for (let i = 14; i < buf.length - 1; i++) {
      if (buf[i] === 0x90) count++;
    }
    expect(count).toBe(8);
  });
});
