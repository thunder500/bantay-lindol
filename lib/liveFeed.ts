// Server-side live watcher. Polls the recent (today) feed tightly and pushes
// newly-posted events to all subscribers (the SSE endpoint), so the browser is
// notified the instant a new quake is detected instead of waiting for its own
// refresh. PHIVOLCS has no push/webhook, so we still poll them — but tightly,
// and fan out instantly on detection.
import { fetchPhivolcs } from './sources/phivolcs';
import { fetchUsgs } from './sources/usgs';
import { resolveSources } from './resolveSources';
import { filterByRange } from './dateFilter';
import { Quake } from './types';

export type LiveMsg = { type: 'snapshot' | 'new'; quakes: Quake[]; fetchedAt: number };
type Listener = (msg: LiveMsg) => void;

const POLL_MS = 10_000;

const listeners = new Set<Listener>();
const seen = new Set<string>();
let snapshot: Quake[] = [];
let timer: ReturnType<typeof setInterval> | null = null;
let busy = false;
let primed = false;

function todayYmd(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}
async function settle<T>(p: Promise<T>): Promise<T | null> {
  try { return await p; } catch { return null; }
}
function broadcast(msg: LiveMsg) {
  listeners.forEach((l) => { try { l(msg); } catch { /* ignore */ } });
}

async function poll(): Promise<void> {
  if (busy) return;
  busy = true;
  try {
    const today = todayYmd();
    const [ph, us] = await Promise.all([
      settle(fetchPhivolcs()),
      settle(fetchUsgs({ start: today, end: today })),
    ]);
    const { quakes, failed } = resolveSources(ph, us);
    if (failed) return;
    const ranged = filterByRange(quakes, today, today);
    snapshot = ranged;
    const fresh = ranged.filter((q) => !seen.has(q.id));
    ranged.forEach((q) => seen.add(q.id));
    const fetchedAt = Date.now();
    if (!primed) {
      primed = true;
      broadcast({ type: 'snapshot', quakes: ranged, fetchedAt });
      return;
    }
    if (fresh.length > 0) broadcast({ type: 'new', quakes: fresh, fetchedAt });
  } finally {
    busy = false;
  }
}

function ensureRunning(): void {
  if (timer) return;
  void poll();
  timer = setInterval(() => void poll(), POLL_MS);
}
function maybeStop(): void {
  if (listeners.size === 0 && timer) {
    clearInterval(timer);
    timer = null;
    primed = false;
  }
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  ensureRunning();
  if (snapshot.length > 0) {
    listener({ type: 'snapshot', quakes: snapshot, fetchedAt: Date.now() });
  }
  return () => { listeners.delete(listener); maybeStop(); };
}
