// Client-related types inferred from client.service.js and models

export interface ClientAddress {
  formatted: string;
  description?: string;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ClientSummary {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  shortName: string;
  contactType: 'client' | 'provider' | string;
  cuit?: string | null;
  email?: string | null;
  phone?: string | null;
  internalOwner?: string | null;
  lastMarginPercentage?: number | null;
  primaryAddress?: ClientAddress | null;
  secondaryAddress?: ClientAddress | null;
  createdAt?: string;
}

export interface ListClientsResponse {
  items: ClientSummary[];
}
