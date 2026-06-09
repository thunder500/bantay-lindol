import { useEffect, useState } from 'react';
import {
  MapContainer, TileLayer, CircleMarker, Popup, ZoomControl, Marker, GeoJSON, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Feature, FeatureCollection } from 'geojson';
import { Quake } from '@/lib/types';
import { depthColor, magRadius } from '@/lib/markerStyle';
import { VOLCANOES } from '@/lib/volcanoes';
import TrenchTeeth from '@/components/TrenchTeeth';

export type Basemap = 'dark' | 'satellite' | 'streets';

interface Props {
  quakes: Quake[];
  newest?: Quake;
  onSelect: (q: Quake) => void;
  showFaults: boolean;
  showTrenches: boolean;
  showVolcanoes: boolean;
  basemap: Basemap;
}

const DATA_CREDIT = 'Data: PHIVOLCS, USGS';
const BASEMAPS: Record<Basemap, { url: string; subdomains: string | string[]; attribution: string }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution: `&copy; OpenStreetMap &copy; CARTO | ${DATA_CREDIT}`,
  },
  satellite: {
    url: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: `Imagery &copy; Google | ${DATA_CREDIT}`,
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    attribution: `&copy; OpenStreetMap contributors | ${DATA_CREDIT}`,
  },
};

// Philippine archipelago framing. Map cannot zoom out far past this and cannot pan away.
const PH_BOUNDS = L.latLngBounds([3, 114], [22, 129]);
const PAN_BOUNDS = L.latLngBounds([-3, 106], [28, 138]);

const pulseIcon = L.divIcon({
  className: 'eq-sonar-icon',
  html:
    '<span class="eq-ring"></span><span class="eq-ring"></span>' +
    '<span class="eq-ring"></span><span class="eq-core"></span>',
  iconSize: [80, 80],
  iconAnchor: [40, 40],
});

const volcanoIcon = L.divIcon({
  className: 'eq-volcano-icon',
  html: '<span class="eq-volcano"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 12],
});

// Wider hit area so thin fault/trench lines are easy to click.
const lineRenderer = L.canvas({ tolerance: 8 });

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

function infoCard(title: string, rows: [string, string][]): string {
  const body = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
    .join('');
  return `<div class="eq-info"><div class="eq-info-title">${title}</div><table>${body}</table></div>`;
}

function bindFaultPopup(_feature: Feature, layer: L.Layer) {
  layer.bindPopup(
    infoCard('ACTIVE FAULT', [
      ['Type', 'Active fault trace'],
      ['Data Source', 'DOST-PHIVOLCS'],
    ]),
    { className: 'eq-info-popup' },
  );
}

function bindTrenchPopup(feature: Feature, layer: L.Layer) {
  const p = (feature.properties ?? {}) as { name?: string; desc?: string };
  layer.bindPopup(
    infoCard('TRENCH INFORMATION', [
      ['Trench Name', p.name || p.desc || 'Trench'],
      ['Classification', p.desc || 'Trench'],
      ['Data Source', 'DOST-PHIVOLCS'],
    ]),
    { className: 'eq-info-popup' },
  );
}

// Frame the Philippines on mount and lock the minimum zoom to that framing.
function FramePhilippines() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(PH_BOUNDS, { padding: [40, 24] });
    const z = map.getZoom();
    map.setMinZoom(z - 0.5);
    map.setMaxBounds(PAN_BOUNDS);
    if (process.env.NODE_ENV !== 'production') {
      (window as unknown as { __map?: L.Map }).__map = map;
    }
  }, [map]);
  return null;
}

function useGeoJson(url: string, enabled: boolean) {
  const [data, setData] = useState<FeatureCollection | null>(null);
  useEffect(() => {
    if (!enabled || data) return;
    let alive = true;
    fetch(url)
      .then((r) => r.json())
      .then((j) => { if (alive) setData(j); })
      .catch(() => {});
    return () => { alive = false; };
  }, [url, enabled, data]);
  return data;
}

export default function QuakeMap({
  quakes, newest, onSelect, showFaults, showTrenches, showVolcanoes, basemap,
}: Props) {
  const faults = useGeoJson('/geo/faults.geojson', showFaults);
  const trenches = useGeoJson('/geo/trenches.geojson', showTrenches);
  const bm = BASEMAPS[basemap] ?? BASEMAPS.dark;

  return (
    <MapContainer center={[12.5, 122]} zoom={6} className="h-full w-full"
                  zoomControl={false} preferCanvas renderer={lineRenderer}
                  zoomSnap={0.5} style={{ background: '#0b1220' }}>
      <FramePhilippines />
      <ZoomControl position="bottomleft" />
      <TileLayer key={basemap} url={bm.url} subdomains={bm.subdomains}
                 attribution={bm.attribution} maxZoom={20} />

      {showTrenches && trenches && (
        <GeoJSON key="trenches" data={trenches} onEachFeature={bindTrenchPopup}
                 style={{ color: '#a855f7', weight: 2.5, opacity: 0.9 }} />
      )}
      {showTrenches && <TrenchTeeth data={trenches} />}
      {showFaults && faults && (
        <GeoJSON key="faults" data={faults} onEachFeature={bindFaultPopup}
                 style={{ color: '#e11d2a', weight: 1, opacity: 0.85 }} />
      )}

      {showVolcanoes && VOLCANOES.map((v) => (
        <Marker key={v.name} position={[v.lat, v.lon]} icon={volcanoIcon}>
          <Popup>🌋 <strong>{v.name}</strong><br />Active volcano</Popup>
        </Marker>
      ))}

      {newest && (
        <Marker position={[newest.lat, newest.lon]} icon={pulseIcon}
                interactive={false} zIndexOffset={1000} />
      )}
      {quakes.map((q) => (
        <CircleMarker
          key={q.id}
          center={[q.lat, q.lon]}
          radius={magRadius(q.magnitude)}
          pathOptions={{
            color: q.id === newest?.id ? '#ffffff' : 'rgba(0,0,0,0.75)',
            weight: q.id === newest?.id ? 2 : 1.2,
            fillColor: depthColor(q.depthKm),
            fillOpacity: 0.9,
          }}
          eventHandlers={{ click: () => onSelect(q) }}
        >
          <Popup>
            <strong>M {q.magnitude.toFixed(1)}</strong> | {q.depthKm} km<br />
            {q.location}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
