export { generateMelody, parseIdentifier } from './melody.js';
export { toMidi } from './midi.js';
export { toWav } from './wav.js';
export { play } from './webaudio.js';
export {
  buildMajorScale,
  midiToFrequency,
  midiToNoteName,
  scaleDegreeOf,
  NOTE_NAMES,
  MAJOR_INTERVALS,
} from './scales.js';

/**
 * @typedef {Object} Note
 * @property {number} index         Position in the melody (0-based).
 * @property {number} midi          MIDI note number (e.g. 60 = C4).
 * @property {number} frequency     Frequency in Hz.
 * @property {string} noteName      Pitch + octave, e.g. "D4".
 * @property {number} scaleDegree   1..7 within the chosen major scale.
 * @property {number} startMs       Start offset in milliseconds.
 * @property {number} durationMs    Note duration in milliseconds.
 */

/**
 * @typedef {Object} Melody
 * @property {string} identifier
 * @property {string} station
 * @property {string} platform
 * @property {{ tonic: string, name: string, midiTonic: number }} scale
 * @property {number} bpm
 * @property {number} durationMs
 * @property {Note[]} notes
 */
