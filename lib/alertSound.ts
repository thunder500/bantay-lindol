// Earthquake alert sound using the official HazardHunterPH alert audio
// (public/audio/danger.mp3 and danger_low.mp3). Browsers block audio until the
// first user gesture, so primeAudio() unlocks the elements on an early click.

const HIGH_SRC = '/audio/danger.mp3';      // strong-quake alarm
const LOW_SRC = '/audio/danger_low.mp3';   // lower-intensity alarm

let high: HTMLAudioElement | null = null;
let low: HTMLAudioElement | null = null;

function make(src: string): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null;
  const a = new Audio(src);
  a.preload = 'auto';
  return a;
}

function ensure(): void {
  if (!high) high = make(HIGH_SRC);
  if (!low) low = make(LOW_SRC);
}

// Unlock playback on a user gesture: briefly play muted, then reset.
export function primeAudio(): void {
  ensure();
  [high, low].forEach((a) => {
    if (!a) return;
    a.muted = true;
    a.play()
      .then(() => { a.pause(); a.currentTime = 0; a.muted = false; })
      .catch(() => { a.muted = false; });
  });
}

// Play the alarm. Strong quakes (M5+) get the full danger tone; weaker ones the
// low-intensity tone, matching how the source site distinguishes them.
export function playAlertRing(magnitude = 5): void {
  ensure();
  const a = magnitude >= 5 ? high : low;
  if (!a) return;
  try {
    a.pause();
    a.currentTime = 0;
    a.volume = 1;
    void a.play().catch(() => {});
  } catch { /* ignore playback errors */ }
}

// Stop any alarm that is currently playing (e.g. when the alert is dismissed).
export function stopAlertRing(): void {
  [high, low].forEach((a) => {
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  });
}
