import { Quake } from './types';

// Two records are the "same event" if within 60s and ~25km.
function sameEvent(a: Quake, b: Quake): boolean {
  if (Math.abs(a.time - b.time) > 60_000) return false;
  const dLat = Math.abs(a.lat - b.lat);
  const dLon = Math.abs(a.lon - b.lon);
  return dLat < 0.25 && dLon < 0.25;
}

// primary wins on conflicts (PHIVOLCS), secondary fills gaps (USGS).
export function mergeQuakes(primary: Quake[], secondary: Quake[]): Quake[] {
  const merged = [...primary];
  for (const s of secondary) {
    if (!merged.some((p) => sameEvent(p, s))) merged.push(s);
  }
  return merged.sort((a, b) => b.time - a.time);
}
