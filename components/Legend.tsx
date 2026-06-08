import { depthColor } from '@/lib/markerStyle';

const DEPTHS = [
  { label: '0 - 33 km', km: 10 },
  { label: '34 - 70 km', km: 50 },
  { label: '71 - 150 km', km: 100 },
  { label: '151 - 300 km', km: 200 },
  { label: '> 300 km', km: 400 },
];

export default function Legend() {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-md p-3 text-xs text-white/90 border border-white/15">
      <div className="font-semibold mb-2 tracking-wide">DEPTH (km)</div>
      <ul className="space-y-1">
        {DEPTHS.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full"
                  style={{ background: depthColor(d.km) }} />
            {d.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
