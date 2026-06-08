import { describe, it, expect } from 'vitest';
import { mergeQuakes } from './merge';
import { Quake } from './types';

function q(part: Partial<Quake>): Quake {
  return {
    id: 'x', time: 1749398160000, lat: 5.77, lon: 125.37, depthKm: 13,
    magnitude: 2.4, location: 'p', source: 'phivolcs', ...part,
  };
}

describe('mergeQuakes', () => {
  it('keeps PHIVOLCS when the same event exists in both', () => {
    const primary = [q({ source: 'phivolcs' })];
    const secondary = [q({ source: 'usgs', magnitude: 2.5 })];
    const merged = mergeQuakes(primary, secondary);
    expect(merged).toHaveLength(1);
    expect(merged[0].source).toBe('phivolcs');
  });

  it('adds USGS events not present in PHIVOLCS', () => {
    const primary = [q({ source: 'phivolcs', lat: 5.77, lon: 125.37 })];
    const secondary = [q({ source: 'usgs', time: 1749000000000, lat: 18, lon: 120 })];
    expect(mergeQuakes(primary, secondary)).toHaveLength(2);
  });

  it('sorts newest first', () => {
    const merged = mergeQuakes(
      [q({ time: 1000, lat: 1, lon: 1 })],
      [q({ source: 'usgs', time: 2000, lat: 9, lon: 9 })],
    );
    expect(merged[0].time).toBe(2000);
  });
});
