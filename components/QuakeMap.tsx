import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { Quake } from '@/lib/types';
import { depthColor, magRadius } from '@/lib/markerStyle';

interface Props {
  quakes: Quake[];
  newestId?: string;
  onSelect: (q: Quake) => void;
}

export default function QuakeMap({ quakes, newestId, onSelect }: Props) {
  return (
    <MapContainer center={[12.5, 122]} zoom={6} className="h-full w-full"
                  preferCanvas style={{ background: '#0b1220' }} zoomControl={false}>
      <ZoomControl position="bottomleft" />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO | Data: PHIVOLCS, USGS'
      />
      <MarkerClusterGroup chunkedLoading>
        {quakes.map((q) => (
          <CircleMarker
            key={q.id}
            center={[q.lat, q.lon]}
            radius={magRadius(q.magnitude)}
            pathOptions={{
              color: q.id === newestId ? '#ffffff' : depthColor(q.depthKm),
              weight: q.id === newestId ? 2 : 1,
              fillColor: depthColor(q.depthKm),
              fillOpacity: 0.8,
            }}
            eventHandlers={{ click: () => onSelect(q) }}
          >
            <Popup>
              <strong>M {q.magnitude.toFixed(1)}</strong> · {q.depthKm} km<br />
              {q.location}
            </Popup>
          </CircleMarker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
