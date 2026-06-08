import { FilterState } from '@/lib/filters';

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

const WINDOWS = [
  { label: '24h', ms: 86_400_000 },
  { label: '7d', ms: 604_800_000 },
  { label: '30d', ms: 2_592_000_000 },
  { label: 'All', ms: 0 },
];

export default function ControlPanel({ filters, onChange }: Props) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-md p-4 border border-white/15 text-white space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wide text-white/70">
          Min magnitude: {filters.minMag.toFixed(1)}
        </label>
        <input type="range" min={0} max={8} step={0.5} value={filters.minMag}
               className="w-full"
               onChange={(e) => onChange({ ...filters, minMag: Number(e.target.value) })} />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-white/70">
          Max depth: {filters.maxDepth} km
        </label>
        <input type="range" min={10} max={700} step={10} value={filters.maxDepth}
               className="w-full"
               onChange={(e) => onChange({ ...filters, maxDepth: Number(e.target.value) })} />
      </div>
      <div className="flex gap-2">
        {WINDOWS.map((w) => (
          <button key={w.label}
            onClick={() => onChange({ ...filters, sinceMs: w.ms })}
            className={`px-2 py-1 rounded text-xs border border-white/20 ${
              filters.sinceMs === w.ms ? 'bg-white/30' : 'bg-white/5'}`}>
            {w.label}
          </button>
        ))}
      </div>
    </div>
  );
}
