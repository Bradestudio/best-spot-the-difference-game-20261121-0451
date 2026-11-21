// All sound comes from the Web Audio API — no audio files, no network. Short oscillator
// phrases: a bright two-note chime for a find, a low buzz for a wrong click, a little
// arpeggio for a round win, and a soft tick for a hint.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensureContext() {
    if (context === null) {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  function tone(frequency, startAt, duration, type, volume) {
    const audio = ensureContext();
    if (audio === null || muted) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, audio.currentTime + startAt);
    gain.gain.linearRampToValueAtTime(volume, audio.currentTime + startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + startAt + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(audio.currentTime + startAt);
    oscillator.stop(audio.currentTime + startAt + duration + 0.05);
  }

  return {
    isMuted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    /** Warm the context on a real user gesture so the first sound is not late. */
    unlock() {
      ensureContext();
    },
    playCorrect() {
      tone(660, 0, 0.16, 'sine', 0.22);
      tone(990, 0.09, 0.24, 'sine', 0.22);
    },
    playWrong() {
      tone(160, 0, 0.22, 'sawtooth', 0.12);
      tone(110, 0.08, 0.26, 'sawtooth', 0.1);
    },
    playHint() {
      tone(520, 0, 0.12, 'triangle', 0.14);
      tone(780, 0.1, 0.16, 'triangle', 0.14);
    },
    playClick() {
      tone(440, 0, 0.06, 'square', 0.06);
    },
    playWin() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((frequency, index) => tone(frequency, index * 0.11, 0.3, 'triangle', 0.2));
    },
    playLose() {
      const notes = [392, 330, 262];
      notes.forEach((frequency, index) => tone(frequency, index * 0.16, 0.3, 'triangle', 0.16));
    },
  };
}
