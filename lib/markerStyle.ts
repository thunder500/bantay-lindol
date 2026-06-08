export function depthColor(depthKm: number): string {
  if (depthKm <= 33) return '#ef4444';
  if (depthKm <= 70) return '#f97316';
  if (depthKm <= 150) return '#eab308';
  if (depthKm <= 300) return '#22c55e';
  return '#3b82f6';
}

// Area grows with magnitude so big quakes read as big dots.
export function magRadius(mag: number): number {
  return Math.max(3, Math.round(2 + Math.pow(Math.max(mag, 0), 1.6)));
}
