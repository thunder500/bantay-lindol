# BantayLindol — Alert audio, map-line accuracy, and compact no-scroll UI

Date: 2026-06-09
Status: Approved design (pending spec review)

## Problem

Three issues raised on the running app:

1. **Alarm audio does not play.** Clicking "Test the alert sound" produces no
   sound.
2. **Map lines look inaccurate.** The fault/trench lines appear to sit in the
   wrong positions relative to the coastline.
3. **The control panel is confusing and scrolls.** The magnitude control lives
   in a "Filters" card separate from the "Earthquake Alerts" card (the alert
   text even points the user to "Filters below"), and the right panel is taller
   than the viewport so it shows a scrollbar.

Guiding principle: this is a real-world tool that should *enhance* the original
HazardHunterPH, and be understandable by non-technical users.

## Goals / acceptance criteria

- Clicking **Test the alarm** reliably plays the HazardHunterPH alarm out loud.
  Real new-quake alerts also ring.
- Fault and trench lines visibly follow their true traces (Philippine Fault down
  the Leyte/Mindanao spine; Manila Trench offshore west of Luzon), confirmed by
  overlaying on the Satellite basemap.
- The right-hand control panel fits within the viewport height with **no
  scrollbar** at a typical 1366×768 and larger.
- There is exactly **one** magnitude control, in the Alerts card. No duplicate.

## Design

### 1. Alarm audio (bug fix)

Root cause: `playAlertRing()` sets `volume` but never forces `muted = false`,
and `testAlert()` calls `primeAudio()` (which sets `muted = true` to unlock)
immediately before playing, so the element can still be muted when it plays.

Fix in `lib/alertSound.ts`:

- `playAlertRing()` always sets `el.muted = false` and `el.volume = 1` before
  `play()`.
- Unlock audio once on the first real user gesture via a global `pointerdown`
  listener (already present); do **not** rely on `primeAudio()` running inline
  right before a play call.
- Keep the bundled official sounds `public/audio/danger.mp3` (M5+) and
  `danger_low.mp3` (below M5).

Verification: a Playwright run (with autoplay allowed) clicks Test and asserts
the audio element reports `muted === false`, `paused === false`, and that the
mp3 was fetched.

### 2. Map-line accuracy (verify + fix + cleaner render)

Hypotheses for "positions look off", in priority order:

1. The ArcGIS query returned **generalized** geometry (no precision specified),
   which can shift or simplify lines. Re-pull with full precision.
2. "approximate offshore projection" fault segments (dashed lines extending into
   the sea) read as wrong placement.
3. Positions are actually fine but the dark basemap hides the coastline, making
   lines look like they float.

Plan:

- Re-pull the official PHIVOLCS **Active Fault and Trenches** FeatureServer
  (`services5.arcgis.com/jWIEmDpiJeMDAn4G/.../Philippine_Active_Fault_and_Trenches/FeatureServer/0`)
  with `outSR=4326`, `f=geojson`, **no generalization** (`maxAllowableOffset`
  omitted / `geometryPrecision=6`), `resultRecordCount` paged if needed.
- Keep coordinates at 5–6 decimal places (≈1 m) instead of 4.
- Re-split into `public/geo/trenches.geojson` (DESC_ trench/trough/collision)
  and `public/geo/faults.geojson` (everything else), keeping `{name, desc}`.
- **Verify** by screenshotting the layers on the **Satellite** basemap zoomed to
  (a) Leyte (Philippine Fault should run down the island) and (b) west Luzon
  (Manila Trench offshore). If a real offset exists, diagnose coordinate order /
  SR; otherwise the data is correct and the perceived issue was the dark
  basemap.
- **Render** faults as clean **solid** lines (drop the dashed style), weight ~1.6,
  bright red; trenches solid violet, weight ~2.5. This makes them read as precise.

### 3. Compact, no-scroll panel with the filter in the Alerts card

Single right-hand panel, compacted so it fits with no scrollbar. Remove
`overflow-y-auto` from the panel container.

Top to bottom:

- **Stats strip** (compact): Events · Strongest · Shallow · Deep + source line.
- **Earthquake Alerts card**:
  - Title "🔔 Earthquake Alerts" + on/off toggle (default on).
  - **Ring me for: [ Magnitude 4+ ▾ ]** — this dropdown is the *only* magnitude
    control. It is **alarm-only**: it sets the alert threshold but does **not**
    filter the map. Replaces the old "New EQ Event Alert (M4+)" label + the
    "Earthquake strength" control that was in Filters.
  - **🔊 Test the alarm** button.
  - One short helper line: "Rings and shows a full-screen warning for new
    Magnitude 4+ quakes."
- **When**: Month & Year + Date Range (compact).
- **Depth**: keep the compact "How deep: up to N km" slider (display filter; the
  only remaining display filter). Faults/trenches/volcanoes layer toggles as
  small inline chips.
- **Count + Show on map**: "Earthquakes shown N" + a toggle to show/hide the
  quake markers.
- **Map style**: Dark / Satellite / Streets buttons.
- **Compact legend** (always visible, horizontal):
  ```
  DEPTH  ●●●●●  shallow → deep (0–300+ km)
  SIZE   · • ● ⬤   M1 → M8
  LINES  — fault   — trench   ▲ volcano
  ```

The magnitude *display* filter is removed entirely; the map and event log show
all quakes in the selected date range. Depth remains as a display filter.

Compaction tactics: reduce paddings (`p-4`→`p-3`, `space-y-4`→`space-y-2/3`),
inline label+control rows, smaller legend, layer toggles as chips. Target fit at
768 px tall. The left **Event Log** keeps its own internal scroll (it is a list);
the "no scroll" requirement applies to the right control panel.

## Out of scope

- Subduction "teeth" on trenches.
- Vercel deploy.
- Swapping Google satellite for Esri.

## Testing

- Vitest unit tests stay green (markerStyle, filters, etc.).
- Playwright checks: (a) Test button → audio unmuted + playing + mp3 fetched;
  (b) right panel has no vertical overflow (scrollHeight ≤ clientHeight) at
  1366×768; (c) exactly one magnitude `<select>` exists and it is inside the
  Alerts card; (d) screenshots of faults/trenches on Satellite for the two
  reference areas.
- `tsc --noEmit` clean; `npm run build` clean.
