import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { EarthquakeApiResponse, Quake } from '@/lib/types';
import { applyFilters, FilterState } from '@/lib/filters';
import { computeStats } from '@/lib/stats';
import { monthOptions, monthBounds } from '@/lib/months';
import { playAlertRing, primeAudio, stopAlertRing } from '@/lib/alertSound';
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

const ALERT_MAG_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

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
  const [alertMag, setAlertMag] = useState(4);
  const [alertQuake, setAlertQuake] = useState<Quake | null>(null);
  const seenIds = useRef<Set<string>>(new Set());

  // Alarm threshold comes only from the Alerts-card dropdown; it does NOT filter
  // the map. Kept in a ref so changing it does not trigger a refetch.
  const alertMin = alertMag;
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
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, [load]);

  // 1s ticker so the "updated Xs ago" live indicator counts up.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

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
    const t = setTimeout(() => { setAlertQuake(null); stopAlertRing(); }, 20_000);
    return () => clearTimeout(t);
  }, [alertQuake]);

  function dismissAlert() {
    setAlertQuake(null);
    stopAlertRing();
  }

  // Ring, show the banner, and fire an OS notification for a new quake.
  function raiseAlert(q: Quake) {
    playAlertRing(q.magnitude);
    setAlertQuake(q);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`⚠️ Magnitude ${q.magnitude.toFixed(1)} earthquake`, {
        body: `${q.location}\nDepth ${q.depthKm} km`,
        requireInteraction: true,
        tag: 'eq-alert',
      });
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

      <AlertBanner quake={alertQuake} onClose={dismissAlert} />

      <div className="absolute top-4 left-4 z-[1000] space-y-3">
        <header>
          <h1 className="text-white font-bold text-lg drop-shadow">BantayLindol</h1>
          <p className="text-white/60 text-xs">Philippine Earthquake Monitor</p>
          <div className="flex items-center gap-2 mt-1 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
            {data && (
              <span className="text-white/45">
                updated {Math.max(0, Math.round((Date.now() - data.fetchedAt) / 1000))}s ago
              </span>
            )}
            <button type="button" onClick={load} title="Refresh now"
                    className="text-white/60 hover:text-white">↻</button>
          </div>
        </header>
        <EventLog quakes={visible} selectedId={selected?.id} onSelect={setSelected} />
      </div>

      <div className="absolute top-4 right-4 z-[1000] w-80 space-y-2">
        {data && <StatsStrip stats={stats} sourcesUsed={data.sourcesUsed} />}

        {/* Alerts — the loudest, clearest card. */}
        <div className="rounded-xl bg-white/10 backdrop-blur-md p-3 border border-white/15 text-white space-y-2">
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
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/70 whitespace-nowrap">Ring me for</label>
            <select value={alertMag} onChange={(e) => setAlertMag(Number(e.target.value))}
              className="flex-1 bg-white/10 border border-white/15 rounded px-2 py-1 text-sm text-white">
              {ALERT_MAG_OPTIONS.map((m) => (
                <option key={m} value={m} className="text-black">Magnitude {m}+</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={testAlert}
            className="w-full text-xs rounded bg-white/10 hover:bg-white/20 py-1.5 transition-colors">
            🔊 Test the alarm
          </button>
        </div>

        {/* Controls — grouped, plain language, compact. */}
        <div className="rounded-xl bg-white/10 backdrop-blur-md p-3 border border-white/15 text-white space-y-2 text-sm">
          <div className="text-xs uppercase tracking-wide text-white/50">When</div>
          <PeriodControls
            month={month} monthList={monthList} start={start} end={end}
            onMonth={changeMonth} onStart={setStart} onEnd={setEnd}
          />
          <div className="border-t border-white/10 pt-2">
            <ControlPanel filters={filters} onChange={setFilters} />
          </div>
          <div className="border-t border-white/10 pt-2 flex items-center justify-between">
            <span className="text-white/70 text-xs">Earthquakes shown</span>
            <span className="font-bold">{visible.length}<span className="text-xs text-white/50 font-normal"> / {total}</span></span>
          </div>
          <Toggle label="Show earthquakes on map" checked={displayResults} onChange={setDisplayResults} />
          <div className="border-t border-white/10 pt-2 flex flex-wrap gap-1">
            {([['Faults', showFaults, setShowFaults], ['Trenches', showTrenches, setShowTrenches], ['Volcanoes', showVolcanoes, setShowVolcanoes]] as [string, boolean, (v: boolean) => void][]).map(([label, on, set]) => (
              <button key={label} type="button" onClick={() => set(!on)}
                className={`text-[11px] rounded-full px-2.5 py-1 transition-colors ${on ? 'bg-sky-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="border-t border-white/10 pt-2 grid grid-cols-3 gap-1">
            {([['dark', 'Dark'], ['satellite', 'Satellite'], ['streets', 'Streets']] as [Basemap, string][]).map(([b, label]) => (
              <button key={b} type="button" onClick={() => setBasemap(b)}
                className={`text-[11px] rounded py-1.5 transition-colors ${basemap === b ? 'bg-sky-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                {label}
              </button>
            ))}
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
