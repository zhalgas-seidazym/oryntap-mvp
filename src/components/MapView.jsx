import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { stats } from '../store';

function level(free, total) {
  const r = free / total;
  if (free === 0) return 'full';
  if (r < 0.15) return 'low';
  return 'ok';
}

function pinIcon(p, s, active) {
  return L.divIcon({
    className: '',
    iconSize: [44, 52],
    iconAnchor: [22, 50],
    html: `<div class="pin pin--${level(s.free, s.total)} ${active ? 'pin--active' : ''} ${p.type === 'public' ? 'pin--public' : ''}">
      <span class="pin-num">${s.free}</span><span class="pin-p">${p.type === 'partner' ? 'БРОНЬ' : 'P'}</span></div>`,
  });
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat - 0.006, target.lng], 14, { duration: 0.6 });
  }, [target, map]);
  return null;
}

function Resizer() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 50); }, [map]);
  return null;
}

export default function MapView({ parkings, spots, selectedId, onSelect }) {
  const selected = useMemo(() => parkings.find((p) => p.id === selectedId), [parkings, selectedId]);
  return (
    <MapContainer center={[43.238, 76.93]} zoom={12} zoomControl={false} className="map" attributionControl>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Resizer />
      <FlyTo target={selected} />
      {parkings.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={pinIcon(p, stats(spots[p.id]), p.id === selectedId)}
          eventHandlers={{ click: () => onSelect(p.id) }}
        />
      ))}
    </MapContainer>
  );
}
