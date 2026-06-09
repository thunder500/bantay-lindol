import { Quake } from '@/lib/types';

interface Props {
  quake: Quake | null;
  onClose: () => void;
}

function phtTime(ms: number): string {
  return new Date(ms).toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// Severity escalates the wording and color with magnitude.
function severity(mag: number) {
  if (mag >= 6) {
    return { title: 'MAJOR EARTHQUAKE', bar: 'bg-red-700', edge: 'rgba(220,38,38,0.55)',
      safety: 'DROP, COVER, and HOLD ON. Stay away from windows and stay calm.' };
  }
  if (mag >= 5) {
    return { title: 'STRONG EARTHQUAKE', bar: 'bg-red-600', edge: 'rgba(220,38,38,0.45)',
      safety: 'Drop, Cover, and Hold On. Be ready for aftershocks.' };
  }
  if (mag >= 4) {
    return { title: 'EARTHQUAKE ALERT', bar: 'bg-orange-600', edge: 'rgba(234,88,12,0.4)',
      safety: 'Felt shaking is possible. Stay alert for aftershocks.' };
  }
  return { title: 'EARTHQUAKE DETECTED', bar: 'bg-amber-600', edge: 'rgba(217,119,6,0.35)',
    safety: 'Minor shaking possible near the epicenter.' };
}

export default function AlertBanner({ quake, onClose }: Props) {
  if (!quake) return null;
  const sev = severity(quake.magnitude);
  return (
    <>
      {/* Pulsing red screen edge for a disaster-grade alert. */}
      <div className="pointer-events-none fixed inset-0 z-[1090] eq-emergency-edge"
           style={{ boxShadow: `inset 0 0 140px 24px ${sev.edge}` }} />

      {/* Full-width emergency warning bar. */}
      <div className="absolute top-0 left-0 right-0 z-[1100] eq-emergency-bar">
        <div className={`${sev.bar} text-white shadow-2xl border-b-4 border-white/40`}>
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
            <span className="text-3xl sm:text-4xl eq-emergency-icon" aria-hidden>⚠️</span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className="font-extrabold tracking-wide uppercase text-base sm:text-lg">
                  {sev.title}
                </span>
                <span className="font-black text-xl sm:text-2xl tabular-nums">
                  M{quake.magnitude.toFixed(1)}
                </span>
              </div>
              <div className="text-sm text-white/95 truncate">
                {quake.location}
              </div>
              <div className="text-xs text-white/80">
                Depth {quake.depthKm} km · {phtTime(quake.time)} PHT
              </div>
              <div className="text-sm font-semibold mt-1">{sev.safety}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss alert"
              className="shrink-0 self-start rounded-md px-2 py-1 text-white/90 hover:bg-white/20 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
