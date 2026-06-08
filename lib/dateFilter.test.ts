import { describe, it, expect } from 'vitest';
import { filterByRange, phtDayBounds } from './dateFilter';
import { Quake } from './types';

// 2026-06-09 12:00 PHT == 2026-06-09T04:00:00Z
const noonPht = Date.parse('2026-06-09T04:00:00Z');
const q = (time: number): Quake => ({
  id: String(time), time, lat: 1, lon: 1, depthKm: 10, magnitude: 3,
  location: 'p', source: 'phivolcs',
});

describe('phtDayBounds', () => {
  it('builds inclusive PHT day bounds', () => {
    const { startMs, endMs } = phtDayBounds('2026-06-09', '2026-06-09');
    // start = 2026-06-09T00:00:00+08:00 == 2026-06-08T16:00:00Z
    expect(new Date(startMs!).toISOString()).toBe('2026-06-08T16:00:00.000Z');
    // end = 2026-06-09T23:59:59+08:00 == 2026-06-09T15:59:59Z
    expect(new Date(endMs!).toISOString()).toBe('2026-06-09T15:59:59.000Z');
  });
  it('leaves missing bounds undefined', () => {
    expect(phtDayBounds(undefined, undefined)).toEqual({ startMs: undefined, endMs: undefined });
  });
});

describe('filterByRange', () => {
  it('keeps events inside the PHT day and drops those outside', () => {
    const inside = q(noonPht);
    const dayBefore = q(noonPht - 24 * 3600 * 1000);
    const dayAfter = q(noonPht + 24 * 3600 * 1000);
    const out = filterByRange([inside, dayBefore, dayAfter], '2026-06-09', '2026-06-09');
    expect(out).toEqual([inside]);
  });
  it('returns everything when no range is given', () => {
    const list = [q(noonPht), q(noonPht + 1)];
    expect(filterByRange(list, undefined, undefined)).toHaveLength(2);
  });
});
