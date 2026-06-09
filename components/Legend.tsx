import { depthColor, magRadius } from '@/lib/markerStyle';

const DEPTHS = [
  { label: '0 - 33 km', km: 10 },
  { label: '34 - 70 km', km: 50 },
  { label: '71 - 150 km', km: 100 },
  { label: '151 - 300 km', km: 200 },
  { label: '> 300 km', km: 400 },
];

// Representative magnitude per band, sized with the same ramp the map uses.
const MAGS = [
  { label: '1.0 - 1.9', mag: 1.5 },
  { label: '2.0 - 2.9', mag: 2.5 },
  { label: '3.0 - 3.9', mag: 3.5 },
  { label: '4.0 - 4.9', mag: 4.5 },
  { label: '5.0 - 5.9', mag: 5.5 },
  { label: '6.0 - 6.9', mag: 6.5 },
  { label: '7.0 - 7.9', mag: 7.5 },
  { label: '8.0 - 8.9', mag: 8.5 },
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
      <div className="font-semibold mt-3 mb-2 tracking-wide">MAGNITUDE RANGE</div>
      <ul className="space-y-1">
        {MAGS.map((m) => {
          const d = Math.round(magRadius(m.mag) * 2);
          return (
            <li key={m.label} className="flex items-center gap-2">
              <span className="inline-flex justify-center items-center shrink-0" style={{ width: 40 }}>
                <span style={{
                  width: d, height: d, borderRadius: '9999px',
                  border: '1.5px solid rgba(255,255,255,0.75)',
                }} />
              </span>
              {m.label}
            </li>
          );
        })}
      </ul>
      <div className="font-semibold mt-3 mb-2 tracking-wide">TECTONICS</div>
      <ul className="space-y-1">
        <li className="flex items-center gap-2">
          <span className="inline-block w-4 border-t-2 border-dashed"
                style={{ borderColor: '#f87171' }} />
          Active fault
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block w-4 border-t-2" style={{ borderColor: '#a855f7' }} />
          Trench
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block w-0 h-0"
                style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '9px solid #f97316' }} />
          Active volcano
        </li>
      </ul>
    </div>
  );
}
