import { Quake } from './types';

export interface FilterState {
  minMag: number;
  maxDepth: number;
  sinceMs: number; // age window in ms; 0 means no limit
}

export function applyFilters(quakes: Quake[], f: FilterState, now: number): Quake[] {
  return quakes.filter((q) => {
    if (q.magnitude < f.minMag) return false;
    if (q.depthKm > f.maxDepth) return false;
    if (f.sinceMs > 0 && now - q.time > f.sinceMs) return false;
    return true;
  });
}
