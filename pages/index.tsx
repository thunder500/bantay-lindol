import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { EarthquakeApiResponse, Quake } from '@/lib/types';
import { applyFilters, FilterState } from '@/lib/filters';
import { computeStats } from '@/lib/stats';
import ControlPanel from '@/components/ControlPanel';
import DetailCard from '@/components/DetailCard';
import StatsStrip from '@/components/StatsStrip';
import Legend from '@/components/Legend';

const QuakeMap = dynamic(() => import('@/components/QuakeMap'), { ssr: false });

const ALERT_THRESHOLD = 4.0;

export default function Home() {
  const [data, setData] = useState<EarthquakeApiResponse | null>(null);
  const [filters, setFilters] = useState<FilterState>({ minMag: 0, maxDepth: 700, sinceMs: 0 });
  const [selected, setSelected] = useState<Quake | null>(null);
  const seenIds = useRef<Set<string>>(new Set());

  async function load() {
    try {
      const res = await fetch('/api/earthquakes');
      const json: EarthquakeApiResponse = await res.json();
      if (seenIds.current.size > 0) {
        for (const q of json.quakes) {
          if (!seenIds.current.has(q.id) && q.magnitude >= ALERT_THRESHOLD) {
            notify(q);
          }
        }
      }
      json.quakes.forEach((q) => seenIds.current.add(q.id));
      setData(json);
    } catch { /* keep last good data */ }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  function notify(q: Quake) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    new Notification(`M${q.magnitude.toFixed(1)} earthquake`, { body: q.location });
  }

  const now = data?.fetchedAt ?? Date.now();
  const visible = useMemo(
    () => (data ? applyFilters(data.quakes, filters, now) : []),
    [data, filters, now],
  );
  const stats = useMemo(() => computeStats(visible), [visible]);
  const newestId = data?.quakes[0]?.id;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0b1220]">
      <QuakeMap quakes={visible} newestId={newestId} onSelect={setSelected} />

      <header className="absolute top-4 left-4 z-[1000]">
        <h1 className="text-white font-bold text-lg drop-shadow">BantayLindol</h1>
        <p className="text-white/60 text-xs">Philippine Earthquake Monitor</p>
      </header>

      <div className="absolute top-4 right-4 z-[1000] w-72 space-y-3">
        {data && <StatsStrip stats={stats} sourcesUsed={data.sourcesUsed} />}
        <ControlPanel filters={filters} onChange={setFilters} />
        {selected
          ? <DetailCard quake={selected} onClose={() => setSelected(null)} />
          : <Legend />}
        {data?.stale && (
          <div className="text-amber-300 text-xs bg-amber-900/40 rounded p-2">
            Live sources unavailable, showing last cached data.
          </div>
        )}
        <button
          onClick={() => typeof Notification !== 'undefined' && Notification.requestPermission()}
          className="text-xs text-white/70 hover:text-white underline">
          Enable new-quake alerts (M{ALERT_THRESHOLD}+)
        </button>
      </div>
    </div>
  );
}
