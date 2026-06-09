import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { EarthquakeApiResponse, Quake } from '@/lib/types';
import { applyFilters, FilterState } from '@/lib/filters';
import { computeStats } from '@/lib/stats';
import { monthOptions, monthBounds } from '@/lib/months';
import type { Basemap } from '@/components/QuakeMap';
import ControlPanel from '@/components/ControlPanel';
import PeriodControls from '@/components/PeriodControls';
import Toggle from '@/components/Toggle';
import DetailCard from '@/components/DetailCard';
import StatsStrip from '@/components/StatsStrip';
import Legend from '@/components/Legend';
import EventLog from '@/components/EventLog';

const QuakeMap = dynamic(() => import('@/components/QuakeMap'), { ssr: false });

const ALERT_DEFAULT = 4.0;

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
  const [alertOn, setAlertOn] = useState(true);
  const [showFaults, setShowFaults] = useState(true);
  const [showTrenches, setShowTrenches] = useState(true);
  const [showVolcanoes, setShowVolcanoes] = useState(true);
  const [basemap, setBasemap] = useState<Basemap>('dark');
  const seenIds = useRef<Set<string>>(new Set());

  // Alert fires only for new quakes at or above the selected Magnitude Range
  // (or M4.0+ when the range is "All"). Kept in a ref so changing the filter
  // does not trigger a refetch.
  const alertMin = filters.minMag > 0 ? filters.minMag : ALERT_DEFAULT;
  const alertMinRef = useRef(alertMin);
  alertMinRef.current = alertMin;

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (start) qs.set('start', start);
      if (end) qs.set('end', end);
      const res = await fetch(`/api/earthquakes?${qs.toString()}`);
      const json: EarthquakeApiResponse = await res.json();
      if (seenIds.current.size > 0 && alertOn) {
        for (const q of json.quakes) {
          if (!seenIds.current.has(q.id) && q.magnitude >= alertMinRef.current) notify(q);
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

  // Alert is on by default; ask for notification permission on mount.
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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
      <QuakeMap
        quakes={mapQuakes} newest={mapNewest} onSelect={setSelected}
        showFaults={showFaults} showTrenches={showTrenches} showVolcanoes={showVolcanoes}
        basemap={basemap}
      />

      <div className="absolute top-4 left-4 z-[1000] space-y-3">
        <header>
          <h1 className="text-white font-bold text-lg drop-shadow">BantayLindol</h1>
          <p className="text-white/60 text-xs">Philippine Earthquake Monitor</p>
        </header>
        <EventLog quakes={visible} selectedId={selected?.id} onSelect={setSelected} />
      </div>

      <div className="absolute top-4 right-4 z-[1000] w-80 max-h-[calc(100vh-2rem)] overflow-y-auto space-y-3">
        {data && <StatsStrip stats={stats} sourcesUsed={data.sourcesUsed} />}

        <div className="rounded-xl bg-white/10 backdrop-blur-md p-4 border border-white/15 text-white space-y-4">
          <div className="text-sm font-semibold tracking-wide">Earthquake Events Monitoring</div>
          <Toggle label={`New EQ Event Alert (M${alertMin}+)`} checked={alertOn} onChange={toggleAlert} />
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
          <div className="border-t border-white/10 pt-3 space-y-2">
            <div className="text-xs uppercase tracking-wide text-white/50">Map Layers</div>
            <Toggle label="Active Faults" checked={showFaults} onChange={setShowFaults} />
            <Toggle label="Trenches" checked={showTrenches} onChange={setShowTrenches} />
            <Toggle label="Volcanoes" checked={showVolcanoes} onChange={setShowVolcanoes} />
          </div>
          <div className="border-t border-white/10 pt-3 space-y-2">
            <div className="text-xs uppercase tracking-wide text-white/50">Basemap</div>
            <div className="grid grid-cols-3 gap-1">
              {(['dark', 'satellite', 'streets'] as Basemap[]).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBasemap(b)}
                  className={`text-[11px] capitalize rounded py-1 transition-colors ${
                    basemap === b
                      ? 'bg-sky-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
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
