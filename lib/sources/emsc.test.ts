import { describe, it, expect } from 'vitest';
import { parseEmsc, buildEmscUrl } from './emsc';

describe('emsc source', () => {
  it('parses EMSC GeoJSON into Quakes', () => {
    const data = {
      features: [
        {
          id: '20260609_0000123',
          properties: {
            mag: 5.4, flynn_region: 'MINDANAO, PHILIPPINES',
            time: '2026-06-09T16:49:27.0Z', depth: 30, unid: '20260609_0000123',
          },
          geometry: { coordinates: [125.1, 6.0, -30] as [number, number, number] },
        },
      ],
    };
    const out = parseEmsc(data);
    expect(out).toHaveLength(1);
    expect(out[0].magnitude).toBe(5.4);
    expect(out[0].lat).toBe(6.0);
    expect(out[0].lon).toBe(125.1);
    expect(out[0].depthKm).toBe(30);
    expect(out[0].source).toBe('emsc');
    expect(out[0].id).toBe('emsc:20260609_0000123');
    expect(out[0].time).toBe(Date.parse('2026-06-09T16:49:27.0Z'));
  });

  it('skips features without magnitude or coordinates', () => {
    const data = {
      features: [
        { properties: { mag: null, flynn_region: 'x', time: '2026-06-09T00:00:00Z', depth: 10 }, geometry: { coordinates: [1, 2, 3] as [number, number, number] } },
      ],
    };
    expect(parseEmsc(data)).toHaveLength(0);
  });

  it('adds date params to the URL when given a range', () => {
    const url = buildEmscUrl({ start: '2026-06-01', end: '2026-06-09' });
    expect(url).toContain('start=2026-06-01');
    expect(url).toContain('end=2026-06-09T23%3A59%3A59');
  });
});
