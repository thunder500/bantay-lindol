import { Quake } from '@/lib/types';
import { depthColor } from '@/lib/markerStyle';

interface Props {
  quakes: Quake[];
  selectedId?: string;
  onSelect: (q: Quake) => void;
}

function phtTime(ms: number): string {
  return new Date(ms).toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export default function EventLog({ quakes, selectedId, onSelect }: Props) {
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
                <span className="text-white/50 text-[11px] tabular-nums shrink-0 w-24">
                  {phtTime(q.time)}
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
