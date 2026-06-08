import { FilterState } from '@/lib/filters';

interface Props { filters: FilterState; onChange: (f: FilterState) => void; }

export default function ControlPanel({ filters, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wide text-white/70">
          Min magnitude: {filters.minMag.toFixed(1)}
        </label>
        <input type="range" min={0} max={8} step={0.5} value={filters.minMag} className="w-full"
          onChange={(e) => onChange({ ...filters, minMag: Number(e.target.value) })} />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-white/70">
          Max depth: {filters.maxDepth} km
        </label>
        <input type="range" min={10} max={700} step={10} value={filters.maxDepth} className="w-full"
          onChange={(e) => onChange({ ...filters, maxDepth: Number(e.target.value) })} />
      </div>
    </div>
  );
}
