import { Quake } from '../types';

// EMSC / SeismicPortal real-time event service. Aggregates many agencies'
// automatic solutions (incl. PHIVOLCS), so it usually has a Philippine quake a
// few minutes after it happens — often before PHIVOLCS's manual bulletin.
const EMSC_BASE =
  'https://www.seismicportal.eu/fdsnws/event/1/query?format=json' +
  '&minlat=4&maxlat=22&minlon=116&maxlon=128&orderby=time';

export interface EmscRange { start?: string; end?: string; }

export function buildEmscUrl(range: EmscRange = {}): string {
  let url = EMSC_BASE;
  if (range.start) url += `&start=${encodeURIComponent(range.start)}`;
  if (range.end) url += `&end=${encodeURIComponent(range.end + 'T23:59:59')}`;
  url += '&limit=500';
  return url;
}

interface EmscFeature {
  id?: string;
  properties: {
    mag: number | null; flynn_region: string | null; time: string;
    depth: number | null; unid?: string;
  };
  geometry: { coordinates: [number, number, number] };
}
interface EmscGeoJson { features?: EmscFeature[] }

export function parseEmsc(data: EmscGeoJson): Quake[] {
  if (!data?.features) return [];
  const out: Quake[] = [];
  for (const f of data.features) {
    const p = f.properties;
    const mag = p?.mag;
    const coords = f.geometry?.coordinates;
    if (mag == null || !coords || coords.length < 2) continue;
    const [lon, lat] = coords;
    if (typeof lat !== 'number' || typeof lon !== 'number') continue;
    const time = Date.parse(p.time);
    if (!Number.isFinite(time)) continue;
    const depthKm = p.depth != null ? Math.abs(p.depth)
      : (coords[2] != null ? Math.abs(coords[2]) : 0);
    const unid = p.unid ?? f.id ?? String(time);
    out.push({
      id: `emsc:${unid}`,
      time, lat, lon, depthKm,
      magnitude: mag,
      location: p.flynn_region ?? 'Unknown',
      source: 'emsc',
      url: p.unid ? `https://www.seismicportal.eu/eventdetails.html?unid=${p.unid}` : undefined,
    });
  }
  return out;
}

export async function fetchEmsc(range: EmscRange = {}): Promise<Quake[]> {
  const res = await fetch(buildEmscUrl(range), { headers: { 'User-Agent': 'BantayLindol/1.0' } });
  if (!res.ok) throw new Error(`EMSC ${res.status}`);
  return parseEmsc(await res.json());
}
