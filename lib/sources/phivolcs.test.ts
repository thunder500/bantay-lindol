import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parsePhivolcs, parsePhtDate } from './phivolcs';

const html = readFileSync(
  path.join(__dirname, '__fixtures__/phivolcs.html'), 'utf8',
);

describe('parsePhtDate', () => {
  it('converts PHT wall-clock to UTC epoch ms (subtract 8h)', () => {
    // 08 June 2026 11:56 PM PHT == 2026-06-08T15:56:00Z
    expect(new Date(parsePhtDate('08 June 2026 - 11:56 PM')!).toISOString())
      .toBe('2026-06-08T15:56:00.000Z');
  });
  it('returns null for unparseable input', () => {
    expect(parsePhtDate('not a date')).toBeNull();
  });
});

describe('parsePhivolcs', () => {
  it('parses rows into Quakes', () => {
    const quakes = parsePhivolcs(html);
    expect(quakes.length).toBeGreaterThanOrEqual(1);
    const q = quakes[0];
    expect(typeof q.lat).toBe('number');
    expect(typeof q.lon).toBe('number');
    expect(Number.isNaN(q.depthKm)).toBe(false);
    expect(Number.isNaN(q.magnitude)).toBe(false);
    expect(q.location.length).toBeGreaterThan(0);
    expect(q.source).toBe('phivolcs');
    expect(q.time).toBeGreaterThan(0);
  });

  it('skips malformed rows without throwing', () => {
    const broken = '<table><tr><td>not a date</td><td>x</td></tr></table>';
    expect(parsePhivolcs(broken)).toEqual([]);
  });
});
