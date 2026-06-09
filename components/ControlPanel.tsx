import { FilterState } from '@/lib/filters';

interface Props { filters: FilterState; onChange: (f: FilterState) => void; }

export default function ControlPanel({ filters, onChange }: Props) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-white/70">
        How deep: up to {filters.maxDepth} km
      </label>
      <input type="range" min={10} max={700} step={10} value={filters.maxDepth} className="w-full"
        onChange={(e) => onChange({ ...filters, maxDepth: Number(e.target.value) })} />
      <p className="text-[11px] text-white/45">Hide quakes deeper than this.</p>
    </div>
  );
}
