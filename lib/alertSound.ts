// Audible earthquake alert using the Web Audio API (no asset file needed).
// Browsers block audio until the first user gesture, so call primeAudio() on
// an early interaction to unlock it.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

// Unlock the audio context on a user gesture (e.g. first click).
export function primeAudio(): void {
  getCtx();
}

// A short three-tone rising chime, repeated once, like an alert "ring".
export function playAlertRing(): void {
  const ac = getCtx();
  if (!ac) return;
  const start = ac.currentTime;
  const tones = [660, 880, 1175, 660, 880, 1175];
  tones.forEach((freq, i) => {
    const t = start + i * 0.16;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  });
}
