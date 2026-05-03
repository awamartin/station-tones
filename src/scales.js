export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

export function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToNoteName(midi) {
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

export function buildMajorScale(tonicMidi, octaves = 2) {
  const scale = [];
  for (let oct = 0; oct < octaves; oct++) {
    for (const interval of MAJOR_INTERVALS) {
      scale.push(tonicMidi + interval + oct * 12);
    }
  }
  scale.push(tonicMidi + octaves * 12);
  return scale;
}

export function scaleDegreeOf(midi, tonicMidi) {
  const semitone = ((midi - tonicMidi) % 12 + 12) % 12;
  const idx = MAJOR_INTERVALS.indexOf(semitone);
  return idx === -1 ? null : idx + 1;
}
