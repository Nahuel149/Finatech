import React, { useEffect, useMemo, useState } from 'react';
import { useConfig, useGeolocation } from '../../hooks';
import { LocationSearchResult, SelectedLocation } from '../../types';
import { LocationMap } from './LocationMap';
import { Alert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const DEFAULT_LOCATION: SelectedLocation = {
  name: 'Buenos Aires, Argentina',
  lat: -34.603722,
  lon: -58.381592,
};

interface Props {
  onSelect?: (location: SelectedLocation) => void;
  defaultLocation?: SelectedLocation;
  countryCodes?: string;
}

export const LocationSearchPanel: React.FC<Props> = ({
  onSelect,
  defaultLocation = DEFAULT_LOCATION,
  countryCodes,
}) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<SelectedLocation>(defaultLocation);
  const { results, loading, error, searchAddress, clear } = useGeolocation();
  const { config } = useConfig();

  const tilesKey = config?.locationIqTilesKey || null;
  const tilesUrl = config?.locationIqBaseTilesUrl || null;
  const resolvedCountries = countryCodes || config?.locationIqCountryCodes || 'ar';

  useEffect(() => {
    const handler = setTimeout(() => {
      searchAddress(query, { countrycodes: resolvedCountries });
    }, 600);

    return () => clearTimeout(handler);
  }, [query, resolvedCountries, searchAddress]);

  const handleSelect = (result: LocationSearchResult) => {
    const location = {
      name: result.displayName,
      lat: Number(result.lat),
      lon: Number(result.lon),
    };

    setSelected(location);
    setQuery('');
    clear();
    onSelect?.(location);
  };

  const visibleResults = useMemo(
    () => (query ? results : []),
    [query, results],
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-text-primary">Buscar dirección</h3>
          {resolvedCountries && (
            <span className="text-xs text-gray-500">Países: {resolvedCountries.toUpperCase()}</span>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          />
          {loading && (
            <div className="absolute right-3 top-3">
              <LoadingSpinner size="sm" />
            </div>
          )}

          {visibleResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {visibleResults.map((result) => (
                <button
                  key={`${result.lat}-${result.lon}-${result.displayName}`}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="text-sm text-text-primary font-medium">{result.displayName}</div>
                  <div className="text-xs text-gray-500">
                    Lat: {Number(result.lat).toFixed(4)}, Lon: {Number(result.lon).toFixed(4)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {error && (
          <div className="mt-3">
            <Alert type="error" message={error.message} />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-text-primary">Vista previa en mapa</h4>
          <span className="text-xs text-gray-500">Click en un resultado para actualizar</span>
        </div>
        <LocationMap location={selected} tileKey={tilesKey} tileUrl={tilesUrl} />
      </div>
    </div>
  );
};
