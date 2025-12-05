export interface LocationSearchResult {
  displayName: string;
  lat: number;
  lon: number;
  type?: string;
  address?: Record<string, unknown> | null;
}

export interface LocationSearchPayload {
  results: LocationSearchResult[];
}

export interface SelectedLocation {
  name: string;
  lat: number;
  lon: number;
}
