# station-tones

> Deterministic 4-second melodies for transit station / platform identifiers.

[![npm version](https://img.shields.io/npm/v/station-tones.svg)](https://www.npmjs.com/package/station-tones)
[![license](https://img.shields.io/npm/l/station-tones.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/station-tones.svg)](https://nodejs.org/)

`station-tones` turns an identifier like `Paddington-1` into a short, recognisable musical phrase. All platforms at the same station share the **first six notes** so the station has a consistent sonic identity, while the **last two notes** uniquely identify the platform. Same input always produces the same output — bit-for-bit.

- 8 quarter notes at 120 BPM, exactly **4 seconds** long
- Built from one of the 12 **Major scales**, picked deterministically per station
- Outputs **JSON**, **MIDI**, **WAV**, or plays via the **Web Audio API**
- Zero runtime dependencies, ships ESM, works in Node ≥ 18 and modern browsers

## Install

```bash
npm install station-tones
```

## Quick start

```js
import { generateMelody } from 'station-tones';

const melody = generateMelody('Paddington-1');
console.log(melody.scale.name);            // "G Major"
console.log(melody.notes.map(n => n.noteName));
// [ 'G4', 'G6', 'D5', 'G4', 'G4', 'B5', 'B4', 'G6' ]
```

## API

All exports are named. ESM only.

### `generateMelody(identifier, options?)` → `Melody`

Builds the deterministic melody for an identifier of the form `"{Station}-{Platform}"`. The split happens on the **last** `-`, so station names containing dashes (e.g. `Kings-Cross-2`) are handled correctly.

| Option       | Type     | Default | Description                            |
| ------------ | -------- | ------- | -------------------------------------- |
| `bpm`        | `number` | `120`   | Tempo in beats per minute              |
| `baseOctave` | `number` | `4`     | Starting octave for the scale's tonic  |

Throws `TypeError` on empty input and `Error` on identifiers without a valid `Station-Platform` shape.

The returned `Melody`:

```ts
{
  identifier: string;       // "Paddington-1"
  station: string;          // "Paddington"
  platform: string;         // "1"
  scale: {
    tonic: string;          // "G"
    name: string;           // "G Major"
    midiTonic: number;      // 67
  };
  bpm: number;              // 120
  durationMs: number;       // 4000
  notes: Array<{
    index: number;          // 0..7
    midi: number;           // MIDI note number
    frequency: number;      // Hz
    noteName: string;       // "G4"
    scaleDegree: number;    // 1..7
    startMs: number;        // offset from start
    durationMs: number;     // 500 at 120 BPM
  }>;
}
```

### `toMidi(melody, options?)` → `Buffer`

Renders a Type-0 Standard MIDI File (single track, 480 ticks/quarter, tempo meta event matching `melody.bpm`).

| Option     | Type     | Default | Description           |
| ---------- | -------- | ------- | --------------------- |
| `velocity` | `number` | `96`    | Note-on velocity 0–127 |
| `channel`  | `number` | `0`     | MIDI channel 0–15      |

### `toWav(melody, options?)` → `Buffer`

Synthesises 16-bit PCM mono audio with a short attack/release envelope so each note doesn't click.

| Option       | Type     | Default  | Description                                  |
| ------------ | -------- | -------- | -------------------------------------------- |
| `sampleRate` | `number` | `44100`  | Output sample rate in Hz                     |
| `waveform`   | `string` | `'sine'` | `sine` \| `square` \| `sawtooth` \| `triangle` |
| `amplitude`  | `number` | `0.6`    | Peak per-note amplitude (clamped to ±1)      |
| `attackMs`   | `number` | `8`      | Linear fade-in per note                       |
| `releaseMs`  | `number` | `40`     | Linear fade-out per note                      |

### `play(audioContext, melody, options?)` → `Promise<void>`

Schedules every note on a Web Audio `AudioContext` and resolves when the melody finishes.

| Option        | Type           | Default                     | Description                                |
| ------------- | -------------- | --------------------------- | ------------------------------------------ |
| `waveform`    | `OscillatorType` | `'sine'`                    | Any oscillator type the platform supports |
| `gain`        | `number`       | `0.2`                       | Peak gain at the envelope's plateau        |
| `attackMs`    | `number`       | `8`                         | Fade-in per note                           |
| `releaseMs`   | `number`       | `40`                        | Fade-out per note                          |
| `destination` | `AudioNode`    | `audioContext.destination`  | Where to route the output                  |

## CLI

The package installs a small `station-tones` binary.

```bash
# Print the melody as JSON
station-tones "Paddington-1"

# Save a WAV
station-tones "Paddington-1" --wav paddington-1.wav

# Save a MIDI file (and the JSON too)
station-tones "Paddington-1" --midi paddington-1.mid --json

# Pick a different waveform for WAV synthesis
station-tones "Paddington-1" --wav p1.wav --waveform triangle

# Slower tempo (still 8 notes; total duration scales with BPM)
station-tones "Paddington-1" --bpm 90 --wav p1.wav
```

`--help` prints the full usage.

## Examples

### Save a station's melody to a WAV file (Node)

```js
import { writeFileSync } from 'node:fs';
import { generateMelody, toWav } from 'station-tones';

const melody = generateMelody('Euston-3');
writeFileSync('euston-3.wav', toWav(melody, { waveform: 'triangle' }));
```

### Generate MIDI files for a whole line

```js
import { writeFileSync } from 'node:fs';
import { generateMelody, toMidi } from 'station-tones';

const stops = [
  'Paddington-1', 'Paddington-2',
  'Edgware Road-1',
  "Baker Street-1", "Baker Street-2", "Baker Street-3",
  'Great Portland Street-1',
];

for (const id of stops) {
  const melody = generateMelody(id);
  writeFileSync(`${id.replace(/[^\w-]+/g, '_')}.mid`, toMidi(melody));
}
```

### Play in the browser via Web Audio

```html
<button id="play">Play Paddington-1</button>
<script type="module">
  import { generateMelody, play } from 'https://esm.sh/station-tones';

  const ctx = new AudioContext();
  const melody = generateMelody('Paddington-1');

  document.getElementById('play').addEventListener('click', async () => {
    if (ctx.state === 'suspended') await ctx.resume();
    await play(ctx, melody, { waveform: 'triangle', gain: 0.25 });
  });
</script>
```

### Compare two platforms at the same station

```js
import { generateMelody } from 'station-tones';

const a = generateMelody('Paddington-1').notes.map(n => n.noteName);
const b = generateMelody('Paddington-2').notes.map(n => n.noteName);

console.log(a.slice(0, 6).join(' '));   // identical to b's first 6
console.log(b.slice(0, 6).join(' '));
console.log(a.slice(6).join(' '), '<>', b.slice(6).join(' '));  // different tails
```

## How it works

1. The identifier is split into `station` and `platform` on the last `-`.
2. Each piece is hashed with FNV-1a 32-bit:
   - `stationSeed = fnv1a(station)`
   - `platformSeed = fnv1a(station + "::" + platform)` — mixing in the station so that platform `"1"` at Paddington and platform `"1"` at Euston don't share a tail.
3. `stationSeed % 12` picks one of the 12 Major scales; that scale is shared by every platform at the station.
4. A two-octave scale pool (degrees 1–7 across two octaves plus the upper tonic) is assembled around the chosen tonic.
5. A seeded mulberry32 PRNG draws the **first 6 notes** from `stationSeed`, biasing the opening note toward the tonic for a stable start.
6. The PRNG is reseeded with `platformSeed` and draws the **last 2 notes**, biasing the final note toward the upper tonic for resolution.

## Determinism

Same `(identifier, options)` input always produces the same `Melody`, the same MIDI byte sequence, and (for a given `sampleRate` and `waveform`) the same WAV byte sequence. Safe to use as a cache key, fingerprint, or content-addressed asset.

## Compatibility

- **Node**: 18 +
- **Browsers**: any environment with `AudioContext` for `play()`. `generateMelody`, `toMidi`, and `toWav` are pure JS and run anywhere ESM does (the Buffer outputs use Node's `Buffer`; in browsers, import only `generateMelody` and feed the JSON to your own renderer, or use the `play()` helper).

## License

[MIT](./LICENSE)
