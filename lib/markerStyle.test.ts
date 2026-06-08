import { describe, it, expect } from 'vitest';
import { depthColor, magRadius } from './markerStyle';

describe('markerStyle', () => {
  it('colors by depth bucket', () => {
    expect(depthColor(10)).toBe('#ef4444');
    expect(depthColor(50)).toBe('#f97316');
    expect(depthColor(100)).toBe('#eab308');
    expect(depthColor(200)).toBe('#22c55e');
    expect(depthColor(400)).toBe('#3b82f6');
  });

  it('scales radius with magnitude monotonically', () => {
    expect(magRadius(5)).toBeGreaterThan(magRadius(2));
    expect(magRadius(1)).toBeGreaterThanOrEqual(3);
  });
});
