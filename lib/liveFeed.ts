// Server-side live watcher. Polls the recent (today) feed tightly and pushes
// newly-posted events to all subscribers (the SSE endpoint), so the browser is
// notified the instant a new quake is detected instead of waiting for its own
// refresh. PHIVOLCS has no push/webhook, so we still poll them — but tightly,
// and fan out instantly on detection.
//
// State lives on globalThis so it is a single shared instance across all API
// route modules (Next.js bundles each route separately; a plain module-level
// singleton would NOT be shared between /api/stream and other routes).
import { fetchPhivolcs } from './sources/phivolcs';
import { fetchUsgs } from './sources/usgs';
import { fetchEmsc } from './sources/emsc';
import { resolveSources } from './resolveSources';
import { filterByRange } from './dateFilter';
import { eventKey } from './eventKey';
import { Quake } from './types';

export type LiveMsg = { type: 'snapshot' | 'new'; quakes: Quake[]; fetchedAt: number };
type Listener = (msg: LiveMsg) => void;

const POLL_MS = 10_000;

interface LiveState {
  listeners: Set<Listener>;
  seen: Set<string>;
  snapshot: Quake[];
  timer: ReturnType<typeof setInterval> | null;
  busy: boolean;
  primed: boolean;
}

const g = globalThis as unknown as { __bantayLive?: LiveState };
const state: LiveState = g.__bantayLive ?? (g.__bantayLive = {
  listeners: new Set(),
  seen: new Set(),
  snapshot: [],
  timer: null,
  busy: false,
  primed: false,
});

function todayYmd(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}
async function settle<T>(p: Promise<T>): Promise<T | null> {
  try { return await p; } catch { return null; }
}
function broadcast(msg: LiveMsg) {
  state.listeners.forEach((l) => { try { l(msg); } catch { /* ignore */ } });
}

async function poll(): Promise<void> {
  if (state.busy) return;
  state.busy = true;
  try {
    const today = todayYmd();
    const [ph, us, em] = await Promise.all([
      settle(fetchPhivolcs()),
      settle(fetchUsgs({ start: today, end: today })),
      settle(fetchEmsc({ start: today, end: today })),
    ]);
    const { quakes, failed } = resolveSources(ph, us, em);
    if (failed) return;
    const ranged = filterByRange(quakes, today, today);
    state.snapshot = ranged;
    // De-dup by source-independent event key so the same quake from EMSC then
    // PHIVOLCS does not fire twice.
    const fresh = ranged.filter((q) => !state.seen.has(eventKey(q)));
    ranged.forEach((q) => state.seen.add(eventKey(q)));
    const fetchedAt = Date.now();
    if (!state.primed) {
      state.primed = true;
      broadcast({ type: 'snapshot', quakes: ranged, fetchedAt });
      return;
    }
    if (fresh.length > 0) broadcast({ type: 'new', quakes: fresh, fetchedAt });
  } finally {
    state.busy = false;
  }
}

function ensureRunning(): void {
  if (state.timer) return;
  void poll();
  state.timer = setInterval(() => void poll(), POLL_MS);
}
function maybeStop(): void {
  if (state.listeners.size === 0 && state.timer) {
    clearInterval(state.timer);
    state.timer = null;
    state.primed = false;
  }
}

// Dev-only: push a synthetic "new" event to verify the live-push path.
export function debugBroadcastNew(quake: Quake): void {
  broadcast({ type: 'new', quakes: [quake], fetchedAt: Date.now() });
}

export function subscribe(listener: Listener): () => void {
  state.listeners.add(listener);
  ensureRunning();
  if (state.snapshot.length > 0) {
    listener({ type: 'snapshot', quakes: state.snapshot, fetchedAt: Date.now() });
  }
  return () => { state.listeners.delete(listener); maybeStop(); };
}
