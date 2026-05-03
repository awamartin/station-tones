import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateMelody } from '../src/melody.js';

const cliPath = fileURLToPath(new URL('../src/cli.js', import.meta.url));

function runCli(args) {
  return spawnSync(process.execPath, [cliPath, ...args], { encoding: 'utf8' });
}

describe('cli', () => {
  it('prints JSON matching generateMelody for a valid identifier', () => {
    const result = runCli(['Paddington-1']);
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed).toEqual(generateMelody('Paddington-1'));
  });

  it('writes a WAV file to disk with --wav', () => {
    const dir = mkdtempSync(join(tmpdir(), 'station-tones-'));
    try {
      const out = join(dir, 'p1.wav');
      const result = runCli(['Paddington-1', '--wav', out]);
      expect(result.status).toBe(0);
      const buf = readFileSync(out);
      expect(buf.slice(0, 4).toString('ascii')).toBe('RIFF');
      expect(buf.slice(8, 12).toString('ascii')).toBe('WAVE');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('writes a MIDI file to disk with --midi', () => {
    const dir = mkdtempSync(join(tmpdir(), 'station-tones-'));
    try {
      const out = join(dir, 'p1.mid');
      const result = runCli(['Paddington-1', '--midi', out]);
      expect(result.status).toBe(0);
      const buf = readFileSync(out);
      expect(buf.slice(0, 4).toString('ascii')).toBe('MThd');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits non-zero on a malformed identifier', () => {
    const result = runCli(['NoDashHere']);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Station/);
  });

  it('shows help with --help', () => {
    const result = runCli(['--help']);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Usage:/);
  });
});
