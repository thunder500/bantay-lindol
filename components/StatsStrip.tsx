import { Stats } from '@/lib/stats';

interface Props { stats: Stats; sourcesUsed: string[]; }

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center px-3">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-white/60">{label}</div>
    </div>
  );
}

export default function StatsStrip({ stats, sourcesUsed }: Props) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-md px-2 py-3 border border-white/15 flex items-center justify-around">
      <Stat label="Events" value={stats.count} />
      <Stat label="Strongest" value={stats.strongest ? `M${stats.strongest.toFixed(1)}` : '—'} />
      <Stat label="Shallow" value={stats.shallow} />
      <Stat label="Deep" value={stats.deep} />
      <Stat label="Source" value={sourcesUsed.join('+').toUpperCase() || '—'} />
    </div>
  );
}
