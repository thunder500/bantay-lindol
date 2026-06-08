import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { EarthquakeApiResponse, Quake } from '@/lib/types';
import { applyFilters, FilterState } from '@/lib/filters';
import { computeStats } from '@/lib/stats';
import { monthOptions, monthBounds } from '@/lib/months';
import ControlPanel from '@/components/ControlPanel';
import PeriodControls from '@/components/PeriodControls';
import Toggle from '@/components/Toggle';
import DetailCard from '@/components/DetailCard';
import StatsStrip from '@/components/StatsStrip';
import Legend from '@/components/Legend';

const QuakeMap = dynamic(() => import('@/components/QuakeMap'), { ssr: false });

const ALERT_THRESHOLD = 4.0;

export default function Home() {
  const today = useMemo(
    () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }),
    [],
  );
  const monthList = useMemo(() => monthOptions(today, 24), [today]);

  const [month, setMonth] = useState(today.slice(0, 7));
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);

  const [data, setData] = useState<EarthquakeApiResponse | null>(null);
  const [filters, setFilters] = useState<FilterState>({ minMag: 0, maxDepth: 700, sinceMs: 0 });
  const [selected, setSelected] = useState<Quake | null>(null);
  const [displayResults, setDisplayResults] = useState(true);
  const [alertOn, setAlertOn] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (start) qs.set('start', start);
      if (end) qs.set('end', end);
      const res = await fetch(`/api/earthquakes?${qs.toString()}`);
      const json: EarthquakeApiResponse = await res.json();
      if (seenIds.current.size > 0 && alertOn) {
        for (const q of json.quakes) {
          if (!seenIds.current.has(q.id) && q.magnitude >= ALERT_THRESHOLD) notify(q);
        }
      }
      json.quakes.forEach((q) => seenIds.current.add(q.id));
      setData(json);
    } catch { /* keep last good data */ }
  }, [start, end, alertOn]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  function notify(q: Quake) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    new Notification(`M${q.magnitude.toFixed(1)} earthquake`, { body: q.location });
  }

  function toggleAlert(v: boolean) {
    setAlertOn(v);
    if (v && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function changeMonth(m: string) {
    setMonth(m);
    if (m === today.slice(0, 7)) {
      setStart(today);
      setEnd(today);
    } else {
      const b = monthBounds(m, today);
      setStart(b.start);
      setEnd(b.end);
    }
  }

  const now = data?.fetchedAt ?? Date.now();
  const visible = useMemo(
    () => (data ? applyFilters(data.quakes, filters, now) : []),
    [data, filters, now],
  );
  const stats = useMemo(() => computeStats(visible), [visible]);
  const total = data?.quakes.length ?? 0;
  const newest = data?.quakes[0];

  const mapQuakes = displayResults ? visible : [];
  const mapNewest = displayResults ? newest : undefined;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0b1220]">
      <QuakeMap quakes={mapQuakes} newest={mapNewest} onSelect={setSelected} />

      <header className="absolute top-4 left-4 z-[1000]">
        <h1 className="text-white font-bold text-lg drop-shadow">BantayLindol</h1>
        <p className="text-white/60 text-xs">Philippine Earthquake Monitor</p>
      </header>

      <div className="absolute top-4 right-4 z-[1000] w-80 max-h-[calc(100vh-2rem)] overflow-y-auto space-y-3">
        {data && <StatsStrip stats={stats} sourcesUsed={data.sourcesUsed} />}

        <div className="rounded-xl bg-white/10 backdrop-blur-md p-4 border border-white/15 text-white space-y-4">
          <div className="text-sm font-semibold tracking-wide">Earthquake Events Monitoring</div>
          <Toggle label="New EQ Event Alert" checked={alertOn} onChange={toggleAlert} />
          <PeriodControls
            month={month} monthList={monthList} start={start} end={end}
            onMonth={changeMonth} onStart={setStart} onEnd={setEnd}
          />
          <ControlPanel filters={filters} onChange={setFilters} />
          <div className="text-sm border-t border-white/10 pt-3">
            <span className="text-white/70">Total earthquake count: </span>
            <span className="font-bold">{total}</span>
          </div>
          <Toggle label="Display Results" checked={displayResults} onChange={setDisplayResults} />
          {data?.stale && (
            <div className="text-amber-300 text-xs bg-amber-900/40 rounded p-2">
              Live sources unavailable, showing last cached data.
            </div>
          )}
        </div>

        {selected
          ? <DetailCard quake={selected} onClose={() => setSelected(null)} />
          : <Legend />}
      </div>
    </div>
  );
}
