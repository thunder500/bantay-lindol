import { Quake } from './types';

const PHT_OFFSET = '+08:00';

// Inclusive epoch-ms bounds for a Philippine-time day range.
export function phtDayBounds(start?: string, end?: string): { startMs?: number; endMs?: number } {
  const startMs = start ? Date.parse(`${start}T00:00:00${PHT_OFFSET}`) : undefined;
  const endMs = end ? Date.parse(`${end}T23:59:59${PHT_OFFSET}`) : undefined;
  return { startMs, endMs };
}

// Keep only quakes whose time falls within the PHT [start, end] day range.
export function filterByRange(quakes: Quake[], start?: string, end?: string): Quake[] {
  const { startMs, endMs } = phtDayBounds(start, end);
  return quakes.filter((q) => {
    if (startMs !== undefined && q.time < startMs) return false;
    if (endMs !== undefined && q.time > endMs) return false;
    return true;
  });
}
