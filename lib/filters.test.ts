import { describe, it, expect } from 'vitest';
import { applyFilters, FilterState } from './filters';
import { Quake } from './types';

const base: Quake = {
  id: 'a', time: 0, lat: 0, lon: 0, depthKm: 10,
  magnitude: 3, location: 'p', source: 'phivolcs',
};
const full: FilterState = { minMag: 0, maxDepth: 1000, sinceMs: 0 };

describe('applyFilters', () => {
  it('passes everything with permissive filters', () => {
    expect(applyFilters([base], full, 100)).toHaveLength(1);
  });
  it('drops below minMag', () => {
    expect(applyFilters([base], { ...full, minMag: 4 }, 100)).toHaveLength(0);
  });
  it('drops deeper than maxDepth', () => {
    expect(applyFilters([{ ...base, depthKm: 500 }], { ...full, maxDepth: 100 }, 100)).toHaveLength(0);
  });
  it('drops older than sinceMs window', () => {
    expect(applyFilters([{ ...base, time: 0 }], { ...full, sinceMs: 50 }, 100)).toHaveLength(0);
  });
});
