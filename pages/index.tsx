import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { EarthquakeApiResponse, Quake } from '@/lib/types';
import { applyFilters, FilterState } from '@/lib/filters';
import { computeStats } from '@/lib/stats';
import { monthOptions, monthBounds } from '@/lib/months';
import { playAlertRing, primeAudio } from '@/lib/alertSound';
import type { Basemap } from '@/components/QuakeMap';
import ControlPanel from '@/components/ControlPanel';
import PeriodControls from '@/components/PeriodControls';
import Toggle from '@/components/Toggle';
import DetailCard from '@/components/DetailCard';
import StatsStrip from '@/components/StatsStrip';
import Legend from '@/components/Legend';
import EventLog from '@/components/EventLog';
import AlertBanner from '@/components/AlertBanner';

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
  const [alertQuake, setAlertQuake] = useState<Quake | null>(null);
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
        const fresh = json.quakes.filter(
          (q) => !seenIds.current.has(q.id) && q.magnitude >= alertMinRef.current,
        );
        if (fresh.length > 0) {
          const strongest = fresh.reduce((a, b) => (b.magnitude > a.magnitude ? b : a));
          raiseAlert(strongest);
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

  // Alert is on by default; ask for notification permission and unlock audio
  // (browsers block sound until the first user gesture).
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const unlock = () => primeAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  // Auto-dismiss the on-screen alert banner.
  useEffect(() => {
    if (!alertQuake) return;
    const t = setTimeout(() => setAlertQuake(null), 12_000);
    return () => clearTimeout(t);
  }, [alertQuake]);

  // Ring, show the banner, and fire an OS notification for a new quake.
  function raiseAlert(q: Quake) {
    playAlertRing();
    setAlertQuake(q);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`Magnitude ${q.magnitude.toFixed(1)} earthquake`, { body: q.location });
    }
  }

  function testAlert() {
    primeAudio();
    const demo: Quake = newest ?? {
      id: 'demo', magnitude: alertMin, location: 'Sample earthquake (test alert)',
      depthKm: 10, time: Date.now(), lat: 0, lon: 0, source: 'usgs',
    };
    raiseAlert(demo);
  }

  function toggleAlert(v: boolean) {
    setAlertOn(v);
    primeAudio();
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

      <AlertBanner quake={alertQuake} onClose={() => setAlertQuake(null)} />

      <div className="absolute top-4 left-4 z-[1000] space-y-3">
        <header>
          <h1 className="text-white font-bold text-lg drop-shadow">BantayLindol</h1>
          <p className="text-white/60 text-xs">Philippine Earthquake Monitor</p>
        </header>
        <EventLog quakes={visible} selectedId={selected?.id} onSelect={setSelected} />
      </div>

      <div className="absolute top-4 right-4 z-[1000] w-80 max-h-[calc(100vh-2rem)] overflow-y-auto space-y-3">
        {data && <StatsStrip stats={stats} sourcesUsed={data.sourcesUsed} />}

        {/* Alerts — the loudest, clearest card. */}
        <div className="rounded-xl bg-white/10 backdrop-blur-md p-4 border border-white/15 text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden>🔔</span>
              <span className="text-sm font-semibold">Earthquake Alerts</span>
            </div>
            <button
              type="button" role="switch" aria-checked={alertOn} aria-label="Earthquake alerts"
              onClick={() => toggleAlert(!alertOn)}
              className={`relative w-10 h-5 rounded-full transition-colors ${alertOn ? 'bg-sky-500' : 'bg-white/20'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${alertOn ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            {alertOn
              ? <>It will <span className="text-white">ring and pop up</span> when a new earthquake of <span className="text-white">Magnitude {alertMin}+</span> is detected. Change the strength under Filters below.</>
              : 'Turn on to ring and pop up an alert when a new earthquake is detected.'}
          </p>
          <button
            type="button" onClick={testAlert}
            className="w-full text-xs rounded bg-white/10 hover:bg-white/20 py-2 transition-colors"
          >
            🔊 Test the alert sound
          </button>
        </div>

        {/* Controls — grouped, plain language. */}
        <div className="rounded-xl bg-white/10 backdrop-blur-md p-4 border border-white/15 text-white space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-white/50 mb-2">When</div>
            <PeriodControls
              month={month} monthList={monthList} start={start} end={end}
              onMonth={changeMonth} onStart={setStart} onEnd={setEnd}
            />
          </div>

          <div className="border-t border-white/10 pt-3">
            <div className="text-xs uppercase tracking-wide text-white/50 mb-2">Filters</div>
            <ControlPanel filters={filters} onChange={setFilters} />
          </div>

          <div className="border-t border-white/10 pt-3 flex items-center justify-between">
            <span className="text-sm text-white/70">Earthquakes shown</span>
            <span className="text-lg font-bold">{visible.length}<span className="text-xs text-white/50 font-normal"> / {total}</span></span>
          </div>
          <Toggle label="Show earthquakes on map" checked={displayResults} onChange={setDisplayResults} />

          <div className="border-t border-white/10 pt-3 space-y-2">
            <div className="text-xs uppercase tracking-wide text-white/50">Show on map</div>
            <Toggle label="Active Faults" checked={showFaults} onChange={setShowFaults} />
            <Toggle label="Trenches" checked={showTrenches} onChange={setShowTrenches} />
            <Toggle label="Volcanoes" checked={showVolcanoes} onChange={setShowVolcanoes} />
          </div>

          <div className="border-t border-white/10 pt-3 space-y-2">
            <div className="text-xs uppercase tracking-wide text-white/50">Map style</div>
            <div className="grid grid-cols-3 gap-1">
              {([['dark', 'Dark'], ['satellite', 'Satellite'], ['streets', 'Streets']] as [Basemap, string][]).map(([b, label]) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBasemap(b)}
                  className={`text-[11px] rounded py-1.5 transition-colors ${
                    basemap === b
                      ? 'bg-sky-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {data?.stale && (
            <div className="text-amber-300 text-xs bg-amber-900/40 rounded p-2">
              Live sources unavailable, showing last saved data.
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
