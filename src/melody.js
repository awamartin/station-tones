import { fnv1a, mulberry32 } from './hash.js';
import {
  NOTE_NAMES,
  buildMajorScale,
  midiToFrequency,
  midiToNoteName,
  scaleDegreeOf,
} from './scales.js';

const STATION_NOTE_COUNT = 6;
const PLATFORM_NOTE_COUNT = 2;
const TOTAL_NOTES = STATION_NOTE_COUNT + PLATFORM_NOTE_COUNT;

export function parseIdentifier(identifier) {
  if (typeof identifier !== 'string' || identifier.length === 0) {
    throw new TypeError('identifier must be a non-empty string');
  }
  const dash = identifier.lastIndexOf('-');
  if (dash <= 0 || dash === identifier.length - 1) {
    throw new Error(
      `identifier must be in the form "{Station}-{Platform}", got "${identifier}"`,
    );
  }
  return {
    station: identifier.slice(0, dash),
    platform: identifier.slice(dash + 1),
  };
}

function pickNote(rng, scale, biasIndex, biasStrength) {
  if (biasStrength > 0 && rng() < biasStrength) {
    return scale[biasIndex];
  }
  return scale[Math.floor(rng() * scale.length)];
}

export function generateMelody(identifier, options = {}) {
  const { bpm = 120, baseOctave = 4 } = options;
  const { station, platform } = parseIdentifier(identifier);

  const stationSeed = fnv1a(station);
  const platformSeed = fnv1a(`${station}::${platform}`);

  const tonicPitchClass = stationSeed % 12;
  const midiTonic = (baseOctave + 1) * 12 + tonicPitchClass;
  const scale = buildMajorScale(midiTonic, 2);
  const tonicIndex = 0;
  const topTonicIndex = scale.length - 1;

  const quarterMs = 60000 / bpm;
  const durationMs = quarterMs * TOTAL_NOTES;

  const stationRng = mulberry32(stationSeed);
  const platformRng = mulberry32(platformSeed);

  const midiNotes = [];
  for (let i = 0; i < STATION_NOTE_COUNT; i++) {
    const bias = i === 0 ? 0.6 : 0;
    midiNotes.push(pickNote(stationRng, scale, tonicIndex, bias));
  }
  for (let i = 0; i < PLATFORM_NOTE_COUNT; i++) {
    const isLast = i === PLATFORM_NOTE_COUNT - 1;
    const bias = isLast ? 0.65 : 0;
    const biasIdx = isLast ? topTonicIndex : tonicIndex;
    midiNotes.push(pickNote(platformRng, scale, biasIdx, bias));
  }

  const notes = midiNotes.map((midi, index) => ({
    index,
    midi,
    frequency: Number(midiToFrequency(midi).toFixed(4)),
    noteName: midiToNoteName(midi),
    scaleDegree: scaleDegreeOf(midi, midiTonic),
    startMs: Math.round(index * quarterMs),
    durationMs: Math.round(quarterMs),
  }));

  return {
    identifier,
    station,
    platform,
    scale: {
      tonic: NOTE_NAMES[tonicPitchClass],
      name: `${NOTE_NAMES[tonicPitchClass]} Major`,
      midiTonic,
    },
    bpm,
    durationMs: Math.round(durationMs),
    notes,
  };
}
