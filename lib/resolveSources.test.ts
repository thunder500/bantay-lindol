import { describe, it, expect } from 'vitest';
import { resolveSources } from './resolveSources';
import { Quake } from './types';

const q = (over: Partial<Quake> = {}): Quake => ({
  id: 'a', time: 1, lat: 1, lon: 1, depthKm: 10, magnitude: 3,
  location: 'p', source: 'usgs', ...over,
});

describe('resolveSources', () => {
  it('flags failed only when BOTH sources are null', () => {
    expect(resolveSources(null, null).failed).toBe(true);
    expect(resolveSources([], null).failed).toBe(false);
    expect(resolveSources(null, []).failed).toBe(false);
  });
  it('empty-but-successful yields quakes:[] and lists the sources that responded', () => {
    const r = resolveSources([], []);
    expect(r.quakes).toEqual([]);
    expect(r.sourcesUsed.sort()).toEqual(['phivolcs', 'usgs']);
    expect(r.failed).toBe(false);
  });
  it('merges both when both have data (phivolcs primary)', () => {
    const r = resolveSources([q({ source: 'phivolcs', lat: 5, lon: 5 })], [q({ source: 'usgs', lat: 18, lon: 120 })]);
    expect(r.quakes).toHaveLength(2);
    expect(r.sourcesUsed.sort()).toEqual(['phivolcs', 'usgs']);
  });
  it('uses only the source that responded', () => {
    const r = resolveSources(null, [q({ source: 'usgs' })]);
    expect(r.quakes).toHaveLength(1);
    expect(r.sourcesUsed).toEqual(['usgs']);
  });
});
