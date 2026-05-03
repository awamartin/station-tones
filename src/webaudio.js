export function play(audioContext, melody, options = {}) {
  const {
    waveform = 'sine',
    gain = 0.2,
    attackMs = 8,
    releaseMs = 40,
    destination = audioContext.destination,
  } = options;

  const start = audioContext.currentTime;

  for (const note of melody.notes) {
    const noteStart = start + note.startMs / 1000;
    const noteDuration = note.durationMs / 1000;
    const noteEnd = noteStart + noteDuration;
    const attack = Math.min(attackMs / 1000, noteDuration / 4);
    const release = Math.min(releaseMs / 1000, noteDuration / 2);

    const osc = audioContext.createOscillator();
    osc.type = waveform;
    osc.frequency.setValueAtTime(note.frequency, noteStart);

    const env = audioContext.createGain();
    env.gain.setValueAtTime(0, noteStart);
    env.gain.linearRampToValueAtTime(gain, noteStart + attack);
    env.gain.setValueAtTime(gain, noteEnd - release);
    env.gain.linearRampToValueAtTime(0, noteEnd);

    osc.connect(env);
    env.connect(destination);
    osc.start(noteStart);
    osc.stop(noteEnd + 0.01);
  }

  const totalSeconds = melody.durationMs / 1000;
  return new Promise((resolve) => {
    setTimeout(resolve, totalSeconds * 1000);
  });
}
