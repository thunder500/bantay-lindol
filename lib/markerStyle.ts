export function depthColor(depthKm: number): string {
  if (depthKm <= 33) return '#3b82f6';
  if (depthKm <= 70) return '#22c55e';
  if (depthKm <= 150) return '#eab308';
  if (depthKm <= 300) return '#f97316';
  return '#ef4444';
}

// Gentle linear size ramp: small quakes are tiny dots, large ones grow
// steadily without ballooning (radius ~2px at M2, ~7px at M5, ~11px at M8).
export function magRadius(mag: number): number {
  return Math.max(2, (mag - 1) * 1.6);
}
