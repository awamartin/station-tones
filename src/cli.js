#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import process from 'node:process';
import { generateMelody } from './melody.js';
import { toMidi } from './midi.js';
import { toWav } from './wav.js';

const USAGE = `Usage: station-tones "<Station>-<Platform>" [options]

Options:
  --json            Print the melody as JSON (default when no output file given)
  --midi <path>     Write a Standard MIDI File to <path>
  --wav  <path>     Write a 44.1 kHz 16-bit WAV file to <path>
  --bpm  <number>   Override BPM (default 120)
  --waveform <w>    sine | square | sawtooth | triangle (WAV only, default sine)
  -h, --help        Show this help

Examples:
  station-tones "Paddington-1"
  station-tones "Paddington-1" --wav paddington-1.wav
  station-tones "Paddington-1" --midi paddington-1.mid --json`;

function parseArgs(argv) {
  const opts = { positional: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      opts.flags.help = true;
    } else if (arg === '--json') {
      opts.flags.json = true;
    } else if (arg === '--midi') {
      opts.flags.midi = argv[++i];
    } else if (arg === '--wav') {
      opts.flags.wav = argv[++i];
    } else if (arg === '--bpm') {
      opts.flags.bpm = Number(argv[++i]);
    } else if (arg === '--waveform') {
      opts.flags.waveform = argv[++i];
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      opts.positional.push(arg);
    }
  }
  return opts;
}

function main(argv) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    process.stderr.write(`${err.message}\n\n${USAGE}\n`);
    process.exit(1);
  }

  if (opts.flags.help || opts.positional.length === 0) {
    process.stdout.write(`${USAGE}\n`);
    process.exit(opts.flags.help ? 0 : 1);
  }

  const [identifier] = opts.positional;
  let melody;
  try {
    melody = generateMelody(identifier, {
      bpm: opts.flags.bpm ?? 120,
    });
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }

  let wroteFile = false;
  if (opts.flags.midi) {
    writeFileSync(opts.flags.midi, toMidi(melody));
    process.stderr.write(`Wrote MIDI: ${opts.flags.midi}\n`);
    wroteFile = true;
  }
  if (opts.flags.wav) {
    writeFileSync(
      opts.flags.wav,
      toWav(melody, { waveform: opts.flags.waveform ?? 'sine' }),
    );
    process.stderr.write(`Wrote WAV:  ${opts.flags.wav}\n`);
    wroteFile = true;
  }

  if (opts.flags.json || !wroteFile) {
    process.stdout.write(`${JSON.stringify(melody, null, 2)}\n`);
  }
}

main(process.argv.slice(2));
