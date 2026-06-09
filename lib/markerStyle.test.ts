import { describe, it, expect } from 'vitest';
import { depthColor, magRadius } from './markerStyle';

describe('markerStyle', () => {
  it('colors by depth bucket', () => {
    expect(depthColor(10)).toBe('#3b82f6');
    expect(depthColor(50)).toBe('#22c55e');
    expect(depthColor(100)).toBe('#eab308');
    expect(depthColor(200)).toBe('#f97316');
    expect(depthColor(400)).toBe('#ef4444');
  });

  it('scales radius with magnitude, small quakes stay tiny', () => {
    expect(magRadius(7)).toBeGreaterThan(magRadius(5));
    expect(magRadius(5)).toBeGreaterThan(magRadius(3));
    expect(magRadius(3)).toBeGreaterThan(magRadius(2));
    // small magnitudes clamp to a tiny floor
    expect(magRadius(1)).toBe(2);
    expect(magRadius(0)).toBe(2);
    expect(magRadius(2)).toBeLessThanOrEqual(3);
  });
});
