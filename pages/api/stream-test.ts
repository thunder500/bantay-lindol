import type { NextApiRequest, NextApiResponse } from 'next';
import { debugBroadcastNew } from '@/lib/liveFeed';
import { Quake } from '@/lib/types';

// Dev-only: simulate a newly-posted earthquake hitting the live channel so the
// push -> alarm path can be verified without waiting for a real event.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') { res.status(404).end(); return; }
  const mag = Number(req.query.mag ?? 5.5);
  const now = Date.now();
  const quake: Quake = {
    id: `test:${now}`,
    time: now,
    lat: 6.0,
    lon: 125.1,
    depthKm: 10,
    magnitude: Number.isFinite(mag) ? mag : 5.5,
    location: 'TEST EVENT — simulated live alert',
    source: 'usgs',
  };
  debugBroadcastNew(quake);
  res.status(200).json({ ok: true, pushed: quake });
}
