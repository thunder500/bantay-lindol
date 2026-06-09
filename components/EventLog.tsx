import { Quake } from '@/lib/types';
import { depthColor } from '@/lib/markerStyle';

interface Props {
  quakes: Quake[];
  selectedId?: string;
  onSelect: (q: Quake) => void;
}

// Easy-to-read relative time: "just now", "5m ago", "2h ago", "3d ago",
// falling back to a short PHT date for anything older than a week.
function relTime(ms: number, now: number): string {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ms).toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila', month: 'short', day: 'numeric',
  });
}

// Full PHT timestamp for the hover tooltip.
function fullPht(ms: number): string {
  return new Date(ms).toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }) + ' PHT';
}

export default function EventLog({ quakes, selectedId, onSelect }: Props) {
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
        <div className="px-3 py-4 text-xs text-white/50">No events in this range.</div>
      ) : (
        <ul className="overflow-y-auto divide-y divide-white/5">
          {quakes.slice(0, 150).map((q) => (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onSelect(q)}
                className={`w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors
                            ${q.id === selectedId ? 'bg-white/15' : 'hover:bg-white/10'}`}
              >
                <span className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: depthColor(q.depthKm) }} />
                <span className="font-semibold tabular-nums w-10 shrink-0">
                  M{q.magnitude.toFixed(1)}
                </span>
                <span className="text-white/50 text-[11px] tabular-nums shrink-0 w-16"
                      title={fullPht(q.time)}>
                  {relTime(q.time, now)}
                </span>
                <span className="text-white/80 text-[11px] truncate flex-1">{q.location}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
