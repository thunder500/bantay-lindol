export function depthColor(depthKm: number): string {
  if (depthKm <= 33) return '#ef4444';
  if (depthKm <= 70) return '#f97316';
  if (depthKm <= 150) return '#eab308';
  if (depthKm <= 300) return '#22c55e';
  return '#3b82f6';
}

// Size ramp with a wide dynamic range: small quakes read as tiny dots and
// large ones as big circles (M2 ~2px, M3 ~4px, M5 ~9px, M7 ~15px), matching
// the reference legend's magnitude-range sizes.
export function magRadius(mag: number): number {
  const over = Math.max(mag - 1, 0);
  return Math.max(2, 1.6 * Math.pow(over, 1.25));
}
