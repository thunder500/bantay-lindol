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

## Caching note

`pages/api/earthquakes.ts` uses a module-level in-memory `TtlCache` (~60s). On a
serverless host (e.g. Vercel) this cache is per-instance and resets on cold starts,
so it reduces but does not eliminate upstream fetches across many instances. If
stronger cross-instance caching is needed later, add `Cache-Control: s-maxage=60`
to the response or move to a shared store (e.g. Vercel KV).
