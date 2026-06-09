import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-polylinedecorator';
import type { FeatureCollection, Position } from 'geojson';

// Right-pointing triangle; polylineDecorator rotates it to the line bearing so
// it ends up perpendicular to the trench, reading as a subduction barb.
const toothIcon = L.divIcon({
  className: 'eq-tooth-icon',
  html: '<span class="eq-tooth"></span>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function TrenchTeeth({ data }: { data: FeatureCollection | null }) {
  const map = useMap();
  useEffect(() => {
    if (!data) return;
    const layers: L.Layer[] = [];
    for (const f of data.features) {
      const g = f.geometry;
      if (!g) continue;
      const lines: Position[][] =
        g.type === 'LineString' ? [g.coordinates]
        : g.type === 'MultiLineString' ? g.coordinates
        : [];
      for (const line of lines) {
        const latlngs = line.map(([lon, lat]) => L.latLng(lat, lon));
        const dec = (L as any).polylineDecorator(latlngs, {
          patterns: [{
            offset: 14,
            repeat: 26,
            symbol: (L as any).Symbol.marker({
              rotate: true,
              markerOptions: { icon: toothIcon, interactive: false, keyboard: false },
            }),
          }],
        });
        dec.addTo(map);
        layers.push(dec);
      }
    }
    return () => { layers.forEach((l) => map.removeLayer(l)); };
  }, [data, map]);
  return null;
}
