import { describe, it, expect } from 'vitest';
import { parseUsgs } from './usgs';
import fixture from './__fixtures__/usgs.json';

describe('parseUsgs', () => {
  it('maps a feature to a Quake', () => {
    const quakes = parseUsgs(fixture as any);
    expect(quakes).toHaveLength(1);
    const q = quakes[0];
    expect(q.magnitude).toBe(5.3);
    expect(q.lat).toBe(5.77);
    expect(q.lon).toBe(125.37);
    expect(q.depthKm).toBe(13);
    expect(q.time).toBe(1749200000000);
    expect(q.location).toBe('19 km SSW of Lumatil, Philippines');
    expect(q.source).toBe('usgs');
    expect(q.id).toContain('usgs:');
  });

  it('skips features with missing magnitude or coordinates', () => {
    const bad = { type: 'FeatureCollection', features: [
      { id: 'x', properties: { mag: null, place: 'p', time: 1 }, geometry: { coordinates: [1, 2, 3] } },
    ] };
    expect(parseUsgs(bad as any)).toHaveLength(0);
  });
});
