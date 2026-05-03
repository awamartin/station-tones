const TICKS_PER_QUARTER = 480;

function writeVarLen(value) {
  const bytes = [value & 0x7f];
  value >>>= 7;
  while (value > 0) {
    bytes.unshift((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  return Buffer.from(bytes);
}

function uint32BE(value) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(value >>> 0, 0);
  return buf;
}

function uint16BE(value) {
  const buf = Buffer.alloc(2);
  buf.writeUInt16BE(value & 0xffff, 0);
  return buf;
}

export function toMidi(melody, options = {}) {
  const { velocity = 96, channel = 0 } = options;
  const microsecondsPerQuarter = Math.round(60_000_000 / melody.bpm);

  const events = [];

  events.push(writeVarLen(0));
  events.push(Buffer.from([0xff, 0x51, 0x03]));
  const tempoBuf = Buffer.alloc(3);
  tempoBuf.writeUIntBE(microsecondsPerQuarter, 0, 3);
  events.push(tempoBuf);

  const noteOnStatus = 0x90 | (channel & 0x0f);
  const noteOffStatus = 0x80 | (channel & 0x0f);

  for (let i = 0; i < melody.notes.length; i++) {
    const note = melody.notes[i];
    events.push(writeVarLen(0));
    events.push(Buffer.from([noteOnStatus, note.midi & 0x7f, velocity & 0x7f]));
    events.push(writeVarLen(TICKS_PER_QUARTER));
    events.push(Buffer.from([noteOffStatus, note.midi & 0x7f, 0x40]));
  }

  events.push(writeVarLen(0));
  events.push(Buffer.from([0xff, 0x2f, 0x00]));

  const trackBody = Buffer.concat(events);
  const trackChunk = Buffer.concat([
    Buffer.from('MTrk', 'ascii'),
    uint32BE(trackBody.length),
    trackBody,
  ]);

  const headerChunk = Buffer.concat([
    Buffer.from('MThd', 'ascii'),
    uint32BE(6),
    uint16BE(0),
    uint16BE(1),
    uint16BE(TICKS_PER_QUARTER),
  ]);

  return Buffer.concat([headerChunk, trackChunk]);
}
