export function depthColor(depthKm: number): string {
  if (depthKm <= 33) return '#ef4444';
  if (depthKm <= 70) return '#f97316';
  if (depthKm <= 150) return '#eab308';
  if (depthKm <= 300) return '#22c55e';
  return '#3b82f6';
}

// Gradual size ramp so M1 reads as a tiny dot and M8 as a large circle,
// matching the reference legend's magnitude-range sizes.
export function magRadius(mag: number): number {
  return Math.max(3, Math.round(Math.max(mag, 0) * 2));
}
