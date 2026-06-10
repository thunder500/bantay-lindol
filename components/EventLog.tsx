import { Quake } from '@/lib/types';
import { depthColor } from '@/lib/markerStyle';

interface Props {
  quakes: Quake[];
  selectedId?: string;
  onSelect: (q: Quake) => void;
  loading?: boolean;
}

// Exact PHT clock time, e.g. "Jun 9, 2:05 PM".
function exactTime(ms: number): string {
  return new Date(ms).toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

// Short relative time as a secondary hint: "5m ago", "2h ago", "3d ago".
function relTime(ms: number, now: number): string {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export default function EventLog({ quakes, selectedId, onSelect, loading }: Props) {
  const now = Date.now();
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white
                    w-72 max-h-[46vh] flex flex-col overflow-hidden shadow-lg">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide
                      border-b border-white/10 flex items-center justify-between">
        <span>Event Log</span>
        <span className="text-white/50">{quakes.length}</span>
      </div>
      {quakes.length === 0 ? (
        <div className="px-3 py-4 text-xs text-white/50">
          {loading ? 'Loading earthquakes…' : 'No events in this range.'}
        </div>
      ) : (
        <ul className="overflow-y-auto divide-y divide-white/5">
          {quakes.slice(0, 150).map((q) => (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onSelect(q)}
                className={`w-full text-left px-3 py-1.5 flex flex-col gap-0.5 transition-colors
                            ${q.id === selectedId ? 'bg-white/15' : 'hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: depthColor(q.depthKm) }} />
                  <span className="font-semibold tabular-nums w-10 shrink-0">
                    M{q.magnitude.toFixed(1)}
                  </span>
                  <span className="text-white/80 text-[11px] tabular-nums">
                    {exactTime(q.time)}
                  </span>
                  <span className="text-white/40 text-[10px] tabular-nums ml-auto shrink-0">
                    {relTime(q.time, now)}
                  </span>
                </div>
                <div className="text-white/70 text-[11px] truncate w-full pl-4">{q.location}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
