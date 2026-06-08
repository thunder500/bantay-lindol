import { Stats } from '@/lib/stats';

interface Props { stats: Stats; sourcesUsed: string[]; }

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center px-1 min-w-0">
      <div className="text-lg font-bold text-white leading-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-white/60">{label}</div>
    </div>
  );
}

export default function StatsStrip({ stats, sourcesUsed }: Props) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-md px-2 py-3 border border-white/15">
      <div className="flex items-center justify-between">
        <Stat label="Events" value={stats.count} />
        <Stat label="Strongest" value={stats.strongest ? `M${stats.strongest.toFixed(1)}` : '—'} />
        <Stat label="Shallow" value={stats.shallow} />
        <Stat label="Deep" value={stats.deep} />
      </div>
      <div className="mt-2 pt-2 border-t border-white/10 text-center text-[10px] uppercase tracking-wide text-white/50">
        Source: {sourcesUsed.join(' + ').toUpperCase() || '—'}
      </div>
    </div>
  );
}
