import { describe, it, expect } from 'vitest';
import { isValidYmd, sanitizeRange, rangeKey, rangeIncludesToday } from './dateRange';

describe('isValidYmd', () => {
  it('accepts a real date', () => { expect(isValidYmd('2026-06-09')).toBe(true); });
  it('rejects junk and impossible dates', () => {
    expect(isValidYmd('2026-6-9')).toBe(false);
    expect(isValidYmd('not-a-date')).toBe(false);
    expect(isValidYmd('2026-13-40')).toBe(false);
  });
});

describe('sanitizeRange', () => {
  it('passes through two valid dates', () => {
    expect(sanitizeRange('2026-05-01', '2026-05-31')).toEqual({ start: '2026-05-01', end: '2026-05-31' });
  });
  it('drops invalid values to undefined', () => {
    expect(sanitizeRange('bad', '2026-05-31')).toEqual({ start: undefined, end: '2026-05-31' });
  });
  it('swaps when start is after end', () => {
    expect(sanitizeRange('2026-05-31', '2026-05-01')).toEqual({ start: '2026-05-01', end: '2026-05-31' });
  });
});

describe('rangeIncludesToday', () => {
  it('true when end is today or later or missing', () => {
    expect(rangeIncludesToday(undefined, '2026-06-09')).toBe(true);   // end missing
    expect(rangeIncludesToday('2026-06-30', '2026-06-09')).toBe(true);
    expect(rangeIncludesToday('2026-06-09', '2026-06-09')).toBe(true);
  });
  it('false when end is before today', () => {
    expect(rangeIncludesToday('2026-05-31', '2026-06-09')).toBe(false);
  });
});

describe('rangeKey', () => {
  it('is stable for the same inputs', () => {
    expect(rangeKey('2026-05-01', '2026-05-31')).toBe(rangeKey('2026-05-01', '2026-05-31'));
    expect(rangeKey(undefined, undefined)).toBe('recent');
  });
});
