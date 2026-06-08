import { Quake } from '../types';
import { makeId } from '../id';

const USGS_BASE =
  'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson' +
  '&minlatitude=4&maxlatitude=21&minlongitude=116&maxlongitude=127' +
  '&orderby=time';

export interface UsgsRange { start?: string; end?: string; }

export function buildUsgsUrl(range: UsgsRange = {}): string {
  let url = USGS_BASE;
  if (range.start) url += `&starttime=${encodeURIComponent(range.start)}`;
  if (range.end) url += `&endtime=${encodeURIComponent(range.end + 'T23:59:59')}`;
  return url;
}

interface UsgsFeature {
  id?: string;
  properties: { mag: number | null; place: string | null; time: number; url?: string };
  geometry: { coordinates: [number, number, number] };
}
interface UsgsGeoJson { features: UsgsFeature[] }

export function parseUsgs(data: UsgsGeoJson): Quake[] {
  if (!data?.features) return [];
  const out: Quake[] = [];
  for (const f of data.features) {
    const mag = f.properties?.mag;
    const coords = f.geometry?.coordinates;
    if (mag == null || !coords || coords.length < 3) continue;
    const [lon, lat, depthKm] = coords;
    if (typeof lat !== 'number' || typeof lon !== 'number') continue;
    out.push({
      id: makeId('usgs', f.properties.time, lat, lon),
      time: f.properties.time,
      lat, lon, depthKm,
      magnitude: mag,
      location: f.properties.place ?? 'Unknown',
      source: 'usgs',
      url: f.properties.url,
    });
  }
  return out;
}

export async function fetchUsgs(range: UsgsRange = {}): Promise<Quake[]> {
  const res = await fetch(buildUsgsUrl(range), { headers: { 'User-Agent': 'BantayLindol/1.0' } });
  if (!res.ok) throw new Error(`USGS ${res.status}`);
  return parseUsgs(await res.json());
}
