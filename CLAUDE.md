# BantayLindol — Project Context

Next.js (pages router) + TypeScript earthquake monitor.

Entry points:
- pages/index.tsx — map experience (client, polls /api/earthquakes every 60s)
- pages/api/earthquakes.ts — server feed (PHIVOLCS primary + USGS fallback, 60s cache)

Data layer: lib/sources/*, lib/merge.ts, lib/cache.ts. Pure logic in
lib/filters.ts, lib/stats.ts, lib/markerStyle.ts is unit-tested with Vitest.

Conventions: keep components small and focused; pure logic lives in lib/ and is
tested; the map is dynamically imported (ssr:false) because Leaflet needs window.

Commands: npm run dev, npm test, npm run build.
