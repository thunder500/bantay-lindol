import { MonthOption } from '@/lib/months';

interface Props {
  month: string;
  monthList: MonthOption[];
  start: string;
  end: string;
  onMonth: (m: string) => void;
  onStart: (d: string) => void;
  onEnd: (d: string) => void;
}

export default function PeriodControls({ month, monthList, start, end, onMonth, onStart, onEnd }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs uppercase tracking-wide text-white/70 block mb-1">Month &amp; Year</label>
        <select value={month} onChange={(e) => onMonth(e.target.value)}
          className="w-full rounded bg-white/10 border border-white/20 text-white text-sm px-2 py-1">
          {monthList.map((m) => (
            <option key={m.value} value={m.value} className="text-black">{m.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-white/70 block mb-1">Date Range</label>
        <div className="flex items-center gap-1">
          <input type="date" value={start} max={end} onChange={(e) => onStart(e.target.value)}
            className="flex-1 min-w-0 rounded bg-white/10 border border-white/20 text-white text-xs px-1 py-1" />
          <span className="text-white/50 text-xs">to</span>
          <input type="date" value={end} min={start} onChange={(e) => onEnd(e.target.value)}
            className="flex-1 min-w-0 rounded bg-white/10 border border-white/20 text-white text-xs px-1 py-1" />
        </div>
      </div>
    </div>
  );
}
