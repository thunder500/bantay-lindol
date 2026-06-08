import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchPhivolcs } from '@/lib/sources/phivolcs';
import { fetchUsgs } from '@/lib/sources/usgs';
import { resolveSources } from '@/lib/resolveSources';
import { TtlCache } from '@/lib/cache';
import { sanitizeRange, rangeIncludesToday, rangeKey } from '@/lib/dateRange';
import { filterByRange } from '@/lib/dateFilter';
import { EarthquakeApiResponse } from '@/lib/types';

// One cache per distinct range key.
const caches = new Map<string, TtlCache<EarthquakeApiResponse>>();
function cacheFor(key: string): TtlCache<EarthquakeApiResponse> {
  let c = caches.get(key);
  if (!c) { c = new TtlCache<EarthquakeApiResponse>(60_000); caches.set(key, c); }
  return c;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function todayYmd(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

async function settle<T>(p: Promise<T>): Promise<T | null> {
  try { return await p; } catch { return null; }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EarthquakeApiResponse>,
) {
  if (req.method !== 'GET') { res.status(405).end(); return; }

  const { start, end } = sanitizeRange(first(req.query.start), first(req.query.end));
  const key = rangeKey(start, end);
  const cache = cacheFor(key);

  const cached = cache.get();
  if (cached) { res.status(200).json(cached); return; }

  const includeRecent = rangeIncludesToday(end, todayYmd());

  const [phivolcs, usgs] = await Promise.all([
    includeRecent ? settle(fetchPhivolcs()) : Promise.resolve(null),
    settle(fetchUsgs({ start, end })),
  ]);

  const { quakes, sourcesUsed, failed } = resolveSources(phivolcs, usgs);

  if (failed) {
    const stale = cache.peek();
    if (stale) { res.status(200).json({ ...stale, stale: true }); return; }
    res.status(503).json({ quakes: [], sourcesUsed: [], stale: true, fetchedAt: Date.now() });
    return;
  }

  const ranged = filterByRange(quakes, start, end);

  const payload: EarthquakeApiResponse = {
    quakes: ranged, sourcesUsed, stale: false, fetchedAt: Date.now(),
  };
  cache.set(payload);
  res.status(200).json(payload);
}
