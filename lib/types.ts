export type QuakeSource = 'phivolcs' | 'usgs';

export interface Quake {
  id: string;          // stable: `${source}:${time}:${lat}:${lon}` rounded
  time: number;        // epoch ms (UTC)
  lat: number;
  lon: number;
  depthKm: number;
  magnitude: number;
  location: string;
  source: QuakeSource;
  url?: string;
}

export interface EarthquakeApiResponse {
  quakes: Quake[];
  sourcesUsed: QuakeSource[];
  stale: boolean;      // true if served from a stale cache after a fetch failure
  fetchedAt: number;   // epoch ms
}
