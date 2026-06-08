import { describe, it, expect } from 'vitest';
import { monthOptions, monthBounds } from './months';

describe('monthOptions', () => {
  it('lists months descending from today', () => {
    const o = monthOptions('2026-06-09', 3);
    expect(o[0]).toEqual({ value: '2026-06', label: 'June 2026' });
    expect(o[1].value).toBe('2026-05');
    expect(o[2].value).toBe('2026-04');
  });
  it('rolls over the year boundary', () => {
    const o = monthOptions('2026-01-15', 2);
    expect(o[1].value).toBe('2025-12');
  });
});

describe('monthBounds', () => {
  it('returns full bounds for a past month', () => {
    expect(monthBounds('2026-05', '2026-06-09')).toEqual({ start: '2026-05-01', end: '2026-05-31' });
  });
  it('caps the current month at today', () => {
    expect(monthBounds('2026-06', '2026-06-09')).toEqual({ start: '2026-06-01', end: '2026-06-09' });
  });
});
