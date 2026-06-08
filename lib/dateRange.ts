export function isValidYmd(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export interface Range { start?: string; end?: string; }

// Keep only valid YYYY-MM-DD values; swap if start is after end.
export function sanitizeRange(start?: string, end?: string): Range {
  let s = start && isValidYmd(start) ? start : undefined;
  let e = end && isValidYmd(end) ? end : undefined;
  if (s && e && s > e) { const t = s; s = e; e = t; }
  return { start: s, end: e };
}

// PHIVOLCS only has recent events, so only merge it when the range reaches today.
export function rangeIncludesToday(end: string | undefined, today: string): boolean {
  if (!end) return true;
  return end >= today;
}

export function rangeKey(start?: string, end?: string): string {
  if (!start && !end) return 'recent';
  return `${start ?? ''}|${end ?? ''}`;
}
