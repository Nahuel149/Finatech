import React, { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { SelectedLocation } from '../../types/location';

// Fix Leaflet default icon paths when bundled with CRA
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  location: SelectedLocation;
  tileKey?: string | null;
  tileUrl?: string | null;
}

const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const resolveTileUrl = (baseUrl?: string | null, apiKey?: string | null) => {
  if (!baseUrl) {
    return DEFAULT_TILE_URL;
  }

  if (apiKey && baseUrl.includes('{key}')) {
    return baseUrl.replace('{key}', apiKey);
  }

  if (apiKey && !baseUrl.includes('key=')) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}key=${apiKey}`;
  }

  return baseUrl;
};

export const LocationMap: React.FC<Props> = ({ location, tileKey, tileUrl }) => {
  const center: [number, number] = [location.lat, location.lon];

  const resolvedTileUrl = useMemo(
    () => resolveTileUrl(tileUrl, tileKey),
    [tileKey, tileUrl],
  );

  return (
    <div className="w-full h-96 rounded-xl overflow-hidden shadow-md border border-gray-200">
      <MapContainer center={center} zoom={14} scrollWheelZoom className="w-full h-full">
        <TileLayer
          url={resolvedTileUrl}
          attribution='&copy; <a href="https://osm.org/copyright">OSM</a> contributors | Tiles © LocationIQ'
          subdomains={['a', 'b', 'c']}
          maxZoom={19}
        />

        <Marker position={center}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold text-text-primary">{location.name}</div>
              <div className="text-gray-600">
                Lat: {location.lat.toFixed(5)}, Lon: {location.lon.toFixed(5)}
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
