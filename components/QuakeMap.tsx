import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Quake } from '@/lib/types';
import { depthColor, magRadius } from '@/lib/markerStyle';

interface Props {
  quakes: Quake[];
  newest?: Quake;
  onSelect: (q: Quake) => void;
}

const pulseIcon = L.divIcon({
  className: 'eq-pulse-icon',
  html: '<span class="eq-pulse-ring"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function QuakeMap({ quakes, newest, onSelect }: Props) {
  return (
    <MapContainer center={[12.5, 122]} zoom={6} className="h-full w-full"
                  zoomControl={false} preferCanvas style={{ background: '#0b1220' }}>
      <ZoomControl position="bottomleft" />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO | Data: PHIVOLCS, USGS'
      />
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
            color: q.id === newest?.id ? '#ffffff' : depthColor(q.depthKm),
            weight: q.id === newest?.id ? 2 : 1,
            fillColor: depthColor(q.depthKm),
            fillOpacity: 0.85,
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
