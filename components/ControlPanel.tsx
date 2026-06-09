import { FilterState } from '@/lib/filters';

interface Props { filters: FilterState; onChange: (f: FilterState) => void; }

const MAG_OPTIONS = [
  { label: 'All magnitudes', value: 0 },
  { label: 'Magnitude 1+', value: 1 },
  { label: 'Magnitude 2+', value: 2 },
  { label: 'Magnitude 3+', value: 3 },
  { label: 'Magnitude 4+', value: 4 },
  { label: 'Magnitude 5+', value: 5 },
  { label: 'Magnitude 6+', value: 6 },
  { label: 'Magnitude 7+', value: 7 },
  { label: 'Magnitude 8+', value: 8 },
];

export default function ControlPanel({ filters, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wide text-white/70">Earthquake strength</label>
        <select
          value={filters.minMag}
          onChange={(e) => onChange({ ...filters, minMag: Number(e.target.value) })}
          className="mt-1 w-full bg-white/10 border border-white/15 rounded px-2 py-1.5 text-sm text-white"
        >
          {MAG_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="text-black">{o.label}</option>
          ))}
        </select>
        <p className="text-[11px] text-white/45 mt-1">Show quakes this strong or stronger.</p>
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-white/70">
          How deep: up to {filters.maxDepth} km
        </label>
        <input type="range" min={10} max={700} step={10} value={filters.maxDepth} className="w-full"
          onChange={(e) => onChange({ ...filters, maxDepth: Number(e.target.value) })} />
        <p className="text-[11px] text-white/45">Hide quakes deeper than this.</p>
      </div>
    </div>
  );
}
