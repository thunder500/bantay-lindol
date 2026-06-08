import { describe, it, expect } from 'vitest';
import { computeStats } from './stats';
import { Quake } from './types';

const mk = (mag: number, depthKm: number): Quake => ({
  id: String(Math.random()), time: 0, lat: 0, lon: 0, depthKm,
  magnitude: mag, location: 'p', source: 'phivolcs',
});

describe('computeStats', () => {
  it('summarizes count, strongest, and depth split', () => {
    const s = computeStats([mk(2, 10), mk(4.5, 200), mk(3, 50)]);
    expect(s.count).toBe(3);
    expect(s.strongest).toBe(4.5);
    expect(s.shallow).toBe(2);
    expect(s.deep).toBe(1);
  });
  it('handles empty input', () => {
    const s = computeStats([]);
    expect(s.count).toBe(0);
    expect(s.strongest).toBe(0);
  });
});
