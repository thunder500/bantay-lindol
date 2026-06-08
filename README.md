# BantayLindol

Real-time Philippine earthquake monitor. Dark glassmorphism map of recent quakes,
sourced from PHIVOLCS (primary) with USGS fallback. No API keys required.

## Develop

    npm install
    npm run dev      # http://localhost:3000
    npm test         # unit tests

## Data

- PHIVOLCS: scraped server-side in lib/sources/phivolcs.ts (public domain).
- USGS: GeoJSON FDSN API in lib/sources/usgs.ts.

Merged + cached (~60s) in pages/api/earthquakes.ts.

## Deploy

Push to GitHub, import to Vercel. No environment variables needed.
