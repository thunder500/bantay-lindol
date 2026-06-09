import { depthColor, magRadius } from '@/lib/markerStyle';

const DEPTHS = [10, 50, 100, 200, 400];
const MAGS = [1.5, 3.5, 5.5, 7.5];

export default function Legend() {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-md p-3 text-[11px] text-white/90 border border-white/15 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="w-12 text-white/50 uppercase tracking-wide">Depth</span>
        <span className="flex gap-1">
          {DEPTHS.map((km) => (
            <span key={km} className="w-3 h-3 rounded-full" style={{ background: depthColor(km) }} />
          ))}
        </span>
        <span className="text-white/50">shallow → deep</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-12 text-white/50 uppercase tracking-wide">Size</span>
        <span className="flex items-center gap-1.5">
          {MAGS.map((m) => {
            const d = Math.round(magRadius(m) * 2);
            return <span key={m} className="rounded-full border border-white/70"
                         style={{ width: d, height: d }} />;
          })}
        </span>
        <span className="text-white/50">M1 → M8</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-12 text-white/50 uppercase tracking-wide">Lines</span>
        <span className="flex items-center gap-1"><span className="w-4 border-t-2" style={{ borderColor: '#fb6a6a' }} />fault</span>
        <span className="flex items-center gap-1"><span className="w-4 border-t-2" style={{ borderColor: '#a855f7' }} />trench</span>
        <span className="flex items-center gap-1"><span className="w-0 h-0" style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '7px solid #f97316' }} />volcano</span>
      </div>
    </div>
  );
}
