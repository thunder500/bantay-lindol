import { describe, it, expect } from 'vitest';
import { TtlCache } from './cache';

describe('TtlCache', () => {
  it('returns the cached value within ttl', () => {
    const c = new TtlCache<number>(1000);
    c.set(42, 0);
    expect(c.get(500)).toBe(42);
  });

  it('returns null when expired', () => {
    const c = new TtlCache<number>(1000);
    c.set(42, 0);
    expect(c.get(1500)).toBeNull();
  });

  it('peek returns stale value even after expiry', () => {
    const c = new TtlCache<number>(1000);
    c.set(42, 0);
    expect(c.peek()).toBe(42);
  });
});
