import { Quake } from './types';

export interface Stats {
  count: number;
  strongest: number;
  shallow: number; // depth <= 70km
  deep: number;    // depth > 70km
}

export function computeStats(quakes: Quake[]): Stats {
  let strongest = 0, shallow = 0, deep = 0;
  for (const q of quakes) {
    if (q.magnitude > strongest) strongest = q.magnitude;
    if (q.depthKm <= 70) shallow++; else deep++;
  }
  return { count: quakes.length, strongest, shallow, deep };
}
