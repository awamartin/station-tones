const TWO_PI = Math.PI * 2;

function sample(waveform, phase) {
  switch (waveform) {
    case 'square':
      return Math.sin(phase) >= 0 ? 1 : -1;
    case 'sawtooth': {
      const t = (phase / TWO_PI) % 1;
      return 2 * t - 1;
    }
    case 'triangle': {
      const t = (phase / TWO_PI) % 1;
      return 4 * Math.abs(t - 0.5) - 1;
    }
    case 'sine':
    default:
      return Math.sin(phase);
  }
}

export function toWav(melody, options = {}) {
  const {
    sampleRate = 44100,
    waveform = 'sine',
    amplitude = 0.6,
    attackMs = 8,
    releaseMs = 40,
  } = options;

  const totalSamples = Math.round((melody.durationMs / 1000) * sampleRate);
  const pcm = new Float32Array(totalSamples);

  for (const note of melody.notes) {
    const startSample = Math.round((note.startMs / 1000) * sampleRate);
    const noteSamples = Math.round((note.durationMs / 1000) * sampleRate);
    const attackSamples = Math.min(
      Math.round((attackMs / 1000) * sampleRate),
      Math.floor(noteSamples / 4),
    );
    const releaseSamples = Math.min(
      Math.round((releaseMs / 1000) * sampleRate),
      Math.floor(noteSamples / 2),
    );
    const phaseStep = (TWO_PI * note.frequency) / sampleRate;

    let phase = 0;
    for (let i = 0; i < noteSamples; i++) {
      let envelope = 1;
      if (i < attackSamples) {
        envelope = i / attackSamples;
      } else if (i > noteSamples - releaseSamples) {
        envelope = (noteSamples - i) / releaseSamples;
      }
      const dst = startSample + i;
      if (dst >= totalSamples) break;
      pcm[dst] += sample(waveform, phase) * envelope * amplitude;
      phase += phaseStep;
    }
  }

  const dataLength = totalSamples * 2;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataLength, 40);

  for (let i = 0; i < totalSamples; i++) {
    let s = pcm[i];
    if (s > 1) s = 1;
    else if (s < -1) s = -1;
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  return buffer;
}
