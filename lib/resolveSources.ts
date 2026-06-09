import { Quake, QuakeSource } from './types';
import { mergeQuakes } from './merge';

export interface Resolution {
  quakes: Quake[];
  sourcesUsed: QuakeSource[];
  failed: boolean; // true only when every attempted source failed (null)
}

// null = the fetch failed (or was skipped); [] = it succeeded with zero events.
// Dedup priority for the kept version of a shared event: PHIVOLCS > EMSC > USGS
// (PHIVOLCS is authoritative; EMSC/USGS are the fast automatic sources).
export function resolveSources(
  phivolcs: Quake[] | null,
  usgs: Quake[] | null,
  emsc: Quake[] | null = null,
): Resolution {
  if (phivolcs === null && usgs === null && emsc === null) {
    return { quakes: [], sourcesUsed: [], failed: true };
  }
  let quakes: Quake[] = [];
  for (const src of [phivolcs, emsc, usgs]) {
    if (src !== null) quakes = mergeQuakes(quakes, src);
  }
  const sourcesUsed: QuakeSource[] = [];
  if (phivolcs !== null) sourcesUsed.push('phivolcs');
  if (usgs !== null) sourcesUsed.push('usgs');
  if (emsc !== null) sourcesUsed.push('emsc');
  return { quakes, sourcesUsed, failed: false };
}
