import { Quake } from './types';

// Source-independent identity for an event: rounded to the minute and ~0.1°, so
// the same physical quake reported by EMSC, USGS, and PHIVOLCS collapses to one
// key. Used for alert de-duplication (the per-source `id` differs by source).
export function eventKey(q: Quake): string {
  return `${Math.round(q.time / 60_000)}:${q.lat.toFixed(1)}:${q.lon.toFixed(1)}`;
}
