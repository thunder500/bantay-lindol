import { QuakeSource } from './types';

// Stable id: source + time + rounded coords so the same event hashes equally.
export function makeId(source: QuakeSource, time: number, lat: number, lon: number): string {
  return `${source}:${time}:${lat.toFixed(2)}:${lon.toFixed(2)}`;
}
