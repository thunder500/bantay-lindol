import { Quake, QuakeSource } from './types';
import { mergeQuakes } from './merge';

export interface Resolution {
  quakes: Quake[];
  sourcesUsed: QuakeSource[];
  failed: boolean; // true only when every attempted source failed (null)
}

// null = the fetch failed (or was skipped); [] = it succeeded with zero events.
export function resolveSources(phivolcs: Quake[] | null, usgs: Quake[] | null): Resolution {
  if (phivolcs === null && usgs === null) {
    return { quakes: [], sourcesUsed: [], failed: true };
  }
  let quakes: Quake[];
  if (phivolcs !== null && usgs !== null) {
    quakes = mergeQuakes(phivolcs, usgs);
  } else {
    quakes = (phivolcs ?? usgs) as Quake[];
  }
  const sourcesUsed: QuakeSource[] = [];
  if (phivolcs !== null) sourcesUsed.push('phivolcs');
  if (usgs !== null) sourcesUsed.push('usgs');
  return { quakes, sourcesUsed, failed: false };
}
