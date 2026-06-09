import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-polylinedecorator';
import type { FeatureCollection, Position } from 'geojson';

// Right-pointing triangle; polylineDecorator rotates it to the line bearing so
// it ends up perpendicular to the trench, reading as a subduction barb.
// The triangle (border-right) has its base on the RIGHT edge (x=8, center y=4)
// and apex on the left. We anchor that base point onto the trench line and pivot
// rotation there, so the barb sits ON the line and the apex points inward.
const toothIcon = L.divIcon({
  className: 'eq-tooth-icon',
  html: '<span class="eq-tooth"></span>',
  iconSize: [8, 8],
  iconAnchor: [8, 4],
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
              markerOptions: {
                icon: toothIcon, interactive: false, keyboard: false,
                rotationOrigin: '8px 4px',
              },
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
