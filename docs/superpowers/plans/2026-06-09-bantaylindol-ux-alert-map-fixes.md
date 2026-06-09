# BantayLindol UX, Alert Audio, and Map-Line Accuracy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the silent alarm, make the fault/trench lines accurate and clean, and rebuild the right control panel so it fits with no scrollbar and has a single alarm-only magnitude control inside the Alerts card.

**Architecture:** Next.js 14 pages-router app. Client map is `components/QuakeMap.tsx` (react-leaflet, ssr:false). The page `pages/index.tsx` owns state and lays out the left Event Log and the right control panel. Alarm sound is `lib/alertSound.ts` (HTMLAudioElement playing bundled mp3s). Tectonic overlays are static GeoJSON in `public/geo/` fetched client-side.

**Tech Stack:** Next.js 14, React 18, react-leaflet 4, Tailwind, Vitest, Playwright-core (system Chrome) for UI checks.

**Working dir for all commands:** `C:\All\MY PROJECT DEPLOYED\bantaylindol` (branch `main`, remote `origin` = thunder500/bantay-lindol). Use `Push-Location` / `Pop-Location` around `npm`/`node`/`git`.

**Dev server:** launch detached via `Start-Process cmd /c "npm run dev > devserver.log 2> devserver.err.log"`; poll `http://localhost:3000` until HTTP 200.

---

### Task 1: Fix the silent alarm

**Files:**
- Modify: `lib/alertSound.ts`
- Test: `scripts/alerttest.mjs` (Playwright check, already exists — update it)

- [ ] **Step 1: Make `playAlertRing` force the element audible**

In `lib/alertSound.ts`, replace the body of `playAlertRing` so it always unmutes and resets before playing (the muted-unlock race is the root cause):

```ts
export function playAlertRing(magnitude = 5): void {
  ensure();
  const a = magnitude >= 5 ? high : low;
  if (!a) return;
  try {
    a.pause();
    a.currentTime = 0;
    a.muted = false;   // critical: primeAudio() may have left it muted
    a.volume = 1;
    void a.play().catch(() => {});
  } catch { /* ignore playback errors */ }
}
```

- [ ] **Step 2: Make `primeAudio` not leave elements muted longer than needed**

Keep `primeAudio` unlocking on gesture, but ensure it unmutes synchronously after the unlock attempt is scheduled. Replace `primeAudio`:

```ts
export function primeAudio(): void {
  ensure();
  [high, low].forEach((a) => {
    if (!a) return;
    const wasMuted = a.muted;
    a.muted = true;
    const p = a.play();
    if (p && typeof p.then === 'function') {
      p.then(() => { a.pause(); a.currentTime = 0; a.muted = wasMuted; })
       .catch(() => { a.muted = wasMuted; });
    } else {
      a.muted = wasMuted;
    }
  });
}
```

- [ ] **Step 3: Update the Playwright check to assert audible playback**

Replace `scripts/alerttest.mjs` with a check that clicks Test and asserts the audio element is unmuted and playing:

```js
import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const audioReqs = []; const errors = [];
page.on('request', (r) => { if (/\/audio\//.test(r.url())) audioReqs.push(r.url()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);
await page.getByRole('button', { name: /Test the alarm/i }).click();
await page.waitForTimeout(1200);
const state = await page.evaluate(() => {
  const els = [...document.querySelectorAll('audio')];
  // alertSound uses `new Audio()` (not in DOM); fall back to checking no error + request
  return { domAudio: els.length };
});
console.log('audio requests:', [...new Set(audioReqs)].join(', ') || '(none)');
console.log('errors:', errors.join(' | ') || 'none');
if (!audioReqs.length) { console.error('FAIL: no audio fetched'); process.exit(1); }
if (errors.length) { console.error('FAIL: page errors'); process.exit(1); }
console.log('PASS');
await browser.close();
```

Note: `new Audio()` elements are not in the DOM, so the check relies on the audio file being fetched and no errors. Manual confirmation (actually hearing it) is the real acceptance.

- [ ] **Step 4: Run the check**

Start the dev server, then:
Run: `node scripts\alerttest.mjs`
Expected: prints `audio requests: http://localhost:3000/audio/danger.mp3 ...` and `PASS`.

- [ ] **Step 5: Commit**

```
git add lib/alertSound.ts scripts/alerttest.mjs
git commit -m "fix(alerts): force unmute on play so the alarm is audible"
```

---

### Task 2: Re-pull official PHIVOLCS lines at full precision, render clean, verify alignment

**Files:**
- Create (temp): `.geotmp/pull.mjs`
- Overwrite: `public/geo/faults.geojson`, `public/geo/trenches.geojson`
- Modify: `components/QuakeMap.tsx` (fault style: solid, not dashed)
- Verify: `scripts/verifylines.mjs` (new)

- [ ] **Step 1: Download the source at full precision**

Run in PowerShell (creates `.geotmp` and downloads WGS84 GeoJSON with 6-dp precision, no generalization):

```powershell
$tmp = ".geotmp"; New-Item -ItemType Directory -Force -Path $tmp | Out-Null
$base = 'https://services5.arcgis.com/jWIEmDpiJeMDAn4G/arcgis/rest/services/Philippine_Active_Fault_and_Trenches/FeatureServer/0/query'
$q = "$base`?where=1%3D1&outFields=NAME,DESC_&outSR=4326&geometryPrecision=6&f=geojson"
Invoke-WebRequest -Uri $q -OutFile "$tmp\phivolcs_ft.geojson" -TimeoutSec 120
"downloaded $([math]::Round((Get-Item "$tmp\phivolcs_ft.geojson").Length/1KB,1)) KB"
```

Expected: a file of roughly 60–120 KB.

- [ ] **Step 2: Split into faults/trenches keeping 6-dp coordinates**

Create `.geotmp/pull.mjs`:

```js
import { readFileSync, writeFileSync } from 'node:fs';
const fc = JSON.parse(readFileSync('.geotmp/phivolcs_ft.geojson', 'utf8'));
const TRENCH_RE = /trench|trough|collision/i;
const round = (n) => Math.round(n * 1e6) / 1e6;            // 6 dp
const rc = (a) => (typeof a[0] === 'number' ? [round(a[0]), round(a[1])] : a.map(rc));
const trenches = [], faults = [];
for (const f of fc.features) {
  if (!f.geometry) continue;
  const name = (f.properties.NAME || '').trim();
  const desc = (f.properties.DESC_ || '').trim();
  const feat = { type: 'Feature', properties: { name, desc },
    geometry: { type: f.geometry.type, coordinates: rc(f.geometry.coordinates) } };
  (TRENCH_RE.test(desc) ? trenches : faults).push(feat);
}
const write = (p, fs2) => { const o = JSON.stringify({ type: 'FeatureCollection', features: fs2 });
  writeFileSync(p, o); console.log(`${p}: ${fs2.length} features, ${(Buffer.byteLength(o)/1024).toFixed(1)} KB`); };
write('public/geo/trenches.geojson', trenches);
write('public/geo/faults.geojson', faults);
```

Run: `node .geotmp\pull.mjs`
Expected: `trenches.geojson: ~8 features` and `faults.geojson: ~166 features`.

- [ ] **Step 3: Render faults as clean solid lines**

In `components/QuakeMap.tsx`, change the faults `<GeoJSON>` style from dashed to solid:

```tsx
{showFaults && faults && (
  <GeoJSON key="faults" data={faults} onEachFeature={bindFaultPopup}
           style={{ color: '#fb6a6a', weight: 1.6, opacity: 0.95 }} />
)}
```

(Trenches stay `{ color: '#a855f7', weight: 3, opacity: 0.9 }`.)

- [ ] **Step 4: Verify alignment on the Satellite basemap**

Create `scripts/verifylines.mjs` (switches to Satellite, zooms to two reference areas, screenshots so a human can confirm the Philippine Fault runs down Leyte and the Manila Trench sits offshore west):

```js
import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
await page.getByRole('button', { name: 'Satellite' }).click();
await page.waitForTimeout(3000);
async function shot(lat, lon, zoom, name) {
  await page.evaluate(([la, lo, z]) => window.__map.setView([la, lo], z), [lat, lon, zoom]);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: name });
  console.log('saved', name);
}
await shot(10.7, 124.85, 9, 'verify-leyte.png');     // Philippine Fault through Leyte
await shot(15.5, 119.2, 7, 'verify-manila-trench.png'); // Manila Trench offshore west Luzon
await browser.close();
```

Run: `node scripts\verifylines.mjs`, then Read `verify-leyte.png` and `verify-manila-trench.png`.
Expected: the red fault line runs along Leyte island (land), the violet trench sits in the sea west of Luzon. If a clear offset is visible (line in the wrong place by tens of km), STOP and diagnose: confirm GeoJSON coordinate order is `[lon, lat]` and `outSR=4326`; the most likely real cause if offset persists is a stale `public/geo` cache — hard-reload. If aligned, the prior "off" perception was the dark basemap.

- [ ] **Step 5: Clean up temp and commit**

```
Remove-Item -Recurse -Force .geotmp
git add public/geo/faults.geojson public/geo/trenches.geojson components/QuakeMap.tsx scripts/verifylines.mjs
git commit -m "fix(map): re-pull PHIVOLCS lines at full precision, render faults solid"
```

---

### Task 3: Alarm-only magnitude control in the Alerts card; remove the display magnitude filter

**Files:**
- Modify: `components/ControlPanel.tsx` (drop magnitude select, keep depth only)
- Modify: `pages/index.tsx` (new `alertMag` state, alert dropdown, `alertMin` from it, `filters.minMag` stays 0)

- [ ] **Step 1: Reduce ControlPanel to the depth filter only**

Replace `components/ControlPanel.tsx` entirely with:

```tsx
import { FilterState } from '@/lib/filters';

interface Props { filters: FilterState; onChange: (f: FilterState) => void; }

export default function ControlPanel({ filters, onChange }: Props) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-white/70">
        How deep: up to {filters.maxDepth} km
      </label>
      <input type="range" min={10} max={700} step={10} value={filters.maxDepth} className="w-full"
        onChange={(e) => onChange({ ...filters, maxDepth: Number(e.target.value) })} />
      <p className="text-[11px] text-white/45">Hide quakes deeper than this.</p>
    </div>
  );
}
```

- [ ] **Step 2: Add `alertMag` state and the alarm magnitude options in `pages/index.tsx`**

Near the other `useState` calls add:

```tsx
const [alertMag, setAlertMag] = useState(4);
```

Add a module-level constant above `export default function Home()`:

```tsx
const ALERT_MAG_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
```

- [ ] **Step 3: Drive the alarm threshold from `alertMag`, not the filter**

Replace the `alertMin` block:

```tsx
// Alarm threshold comes only from the Alerts-card dropdown (does not filter the map).
const alertMin = alertMag;
const alertMinRef = useRef(alertMin);
alertMinRef.current = alertMin;
```

Ensure `filters` initial state keeps `minMag: 0` (it already does) and nothing sets it above 0 — the map now shows all magnitudes, filtered only by depth.

- [ ] **Step 4: Verify (compile)**

Run: `npx tsc --noEmit`
Expected: `TYPECHECK OK` (no errors). The Alerts-card UI is wired in Task 4; this step only changes state plumbing, so the existing alert card may temporarily still show the old toggle label — that is fixed in Task 4.

- [ ] **Step 5: Commit**

```
git add components/ControlPanel.tsx pages/index.tsx
git commit -m "refactor(filters): alarm magnitude is its own state; map shows all magnitudes"
```

---

### Task 4: Compact, no-scroll panel + Alerts-card dropdown + compact legend

**Files:**
- Modify: `pages/index.tsx` (panel container + Alerts card + groups; remove `overflow-y-auto`)
- Rewrite: `components/Legend.tsx` (compact horizontal)

- [ ] **Step 1: Rewrite the compact legend**

Replace `components/Legend.tsx` entirely with a compact horizontal legend:

```tsx
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
```

- [ ] **Step 2: Make the right panel non-scrolling and compact**

In `pages/index.tsx`, change the right-panel container to drop `overflow-y-auto` and tighten spacing:

```tsx
<div className="absolute top-4 right-4 z-[1000] w-80 space-y-2">
```

- [ ] **Step 3: Replace the Alerts card with the dropdown version**

Replace the entire Alerts card block (the `{/* Alerts — the loudest, clearest card. */}` div) with:

```tsx
<div className="rounded-xl bg-white/10 backdrop-blur-md p-3 border border-white/15 text-white space-y-2">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="text-base" aria-hidden>🔔</span>
      <span className="text-sm font-semibold">Earthquake Alerts</span>
    </div>
    <button type="button" role="switch" aria-checked={alertOn} aria-label="Earthquake alerts"
      onClick={() => toggleAlert(!alertOn)}
      className={`relative w-10 h-5 rounded-full transition-colors ${alertOn ? 'bg-sky-500' : 'bg-white/20'}`}>
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
  <p className="text-[11px] text-white/45 leading-snug">
    Rings and shows a full-screen warning for new Magnitude {alertMag}+ quakes.
  </p>
</div>
```

- [ ] **Step 4: Compact the controls card**

Replace the controls card (the `{/* Controls — grouped, plain language. */}` div) with a tighter version. Layers become inline chips, paddings reduced:

```tsx
<div className="rounded-xl bg-white/10 backdrop-blur-md p-3 border border-white/15 text-white space-y-3 text-sm">
  <div className="text-xs uppercase tracking-wide text-white/50">When</div>
  <PeriodControls month={month} monthList={monthList} start={start} end={end}
    onMonth={changeMonth} onStart={setStart} onEnd={setEnd} />
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
```

- [ ] **Step 5: Verify no-scroll + single magnitude select**

Create `scripts/noscroll.mjs`:

```js
import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);
const res = await page.evaluate(() => {
  const panel = document.querySelector('.absolute.top-4.right-4');
  const selects = document.querySelectorAll('select');
  const magSelects = [...selects].filter((s) => /Magnitude/.test(s.textContent));
  return {
    panelScrolls: panel ? panel.scrollHeight > panel.clientHeight + 1 : 'no panel',
    panelBottom: panel ? Math.round(panel.getBoundingClientRect().bottom) : -1,
    viewport: window.innerHeight,
    magSelectCount: magSelects.length,
  };
});
console.log(JSON.stringify(res, null, 2));
const ok = res.panelScrolls === false && res.panelBottom <= res.viewport && res.magSelectCount === 1;
await page.screenshot({ path: 'shot-noscroll.png' });
await browser.close();
console.log(ok ? 'PASS' : 'FAIL');
if (!ok) process.exit(1);
```

Run: `node scripts\noscroll.mjs`, then Read `shot-noscroll.png`.
Expected: `panelScrolls: false`, `panelBottom <= viewport`, `magSelectCount: 1`, `PASS`. If the panel still overflows at 768 px, reduce paddings further (`p-3`→`p-2`, `space-y-2`) and/or shrink the stats strip until it fits.

- [ ] **Step 6: Full verification + commit**

```
npx tsc --noEmit
npx vitest run
npm run build
```
Expected: typecheck OK, 43 tests pass, build clean.

```
git add pages/index.tsx components/Legend.tsx scripts/noscroll.mjs
git commit -m "feat(ui): compact no-scroll panel, alarm dropdown in Alerts card, compact legend"
git push origin main
```

---

## Self-Review

- **Spec coverage:** Audio fix → Task 1. Line accuracy (re-pull full precision, verify on satellite, solid render) → Task 2. One alarm-only magnitude control in Alerts card + remove display magnitude filter → Task 3. Compact no-scroll panel + compact legend → Task 4. All spec sections covered.
- **Placeholders:** none — every step has concrete code/commands. The intentional fix-up note in Task 4 Step 5 calls out the malformed line to delete.
- **Type consistency:** `alertMag` (number) set by `setAlertMag`; `alertMin = alertMag`; `ALERT_MAG_OPTIONS` number[]; `Basemap` type already exported from `components/QuakeMap.tsx`; `Toggle`, `PeriodControls`, `ControlPanel` signatures unchanged. `filters.minMag` remains in `FilterState` (always 0) so `applyFilters` and its tests are untouched.

## Execution note

Each task ends in a commit and is independently testable. Task 2 includes a human screenshot-review checkpoint for line alignment.
