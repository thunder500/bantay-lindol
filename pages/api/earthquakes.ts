import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchPhivolcs } from '@/lib/sources/phivolcs';
import { fetchUsgs } from '@/lib/sources/usgs';
import { mergeQuakes } from '@/lib/merge';
import { TtlCache } from '@/lib/cache';
import { EarthquakeApiResponse, Quake } from '@/lib/types';

const cache = new TtlCache<EarthquakeApiResponse>(60_000);

async function settle<T>(p: Promise<T>): Promise<T | null> {
  try { return await p; } catch { return null; }
}

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<EarthquakeApiResponse>,
) {
  if (_req.method !== 'GET') { res.status(405).end(); return; }
  const cached = cache.get();
  if (cached) { res.status(200).json(cached); return; }

  const [phivolcs, usgs] = await Promise.all([
    settle(fetchPhivolcs()),
    settle(fetchUsgs()),
  ]);

  const sourcesUsed: ('phivolcs' | 'usgs')[] = [];
  let quakes: Quake[] = [];
  if (phivolcs?.length) {
    sourcesUsed.push('phivolcs');
    quakes = mergeQuakes(phivolcs, usgs ?? []);
    if (usgs?.length) sourcesUsed.push('usgs');
  } else if (usgs?.length) {
    sourcesUsed.push('usgs');
    quakes = usgs;
  } else {
    const stale = cache.peek();
    if (stale) { res.status(200).json({ ...stale, stale: true }); return; }
    res.status(503).json({ quakes: [], sourcesUsed: [], stale: true, fetchedAt: Date.now() });
    return;
  }

  const payload: EarthquakeApiResponse = {
    quakes, sourcesUsed, stale: false, fetchedAt: Date.now(),
  };
  cache.set(payload);
  res.status(200).json(payload);
}
