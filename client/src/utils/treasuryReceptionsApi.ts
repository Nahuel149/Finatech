import { ConfirmTreasuryReceptionPayload, OmitTreasuryReceptionPayload, RevertTreasuryReceptionPayload, TreasuryReception, TreasuryReceptionsResponse } from '../types/treasuryReceptions';
import { apiRequest } from './api';

const buildQueryString = (params?: Record<string, unknown>) => {
  if (!params) {
    return '';
  }
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined && entry !== null && entry !== '') {
          query.append(key, String(entry));
        }
      });
    } else {
      query.append(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};

export const getPendingTreasuryReceptions = (params?: Record<string, unknown>) =>
  apiRequest<TreasuryReceptionsResponse>(
    `/api/treasury/receptions${buildQueryString(params)}`
  );

export const confirmTreasuryReception = (
  receptionId: string,
  payload: ConfirmTreasuryReceptionPayload = {}
) =>
  apiRequest<TreasuryReception>(
    `/api/treasury/receptions/${encodeURIComponent(receptionId)}/confirm`,
    {
      method: 'POST',
      body: payload,
    }
  );

export const omitTreasuryReception = (
  receptionId: string,
  payload: OmitTreasuryReceptionPayload
) =>
  apiRequest<TreasuryReception>(
    `/api/treasury/receptions/${encodeURIComponent(receptionId)}/omit`,
    {
      method: 'POST',
      body: payload,
    }
  );

export const revertTreasuryReception = (
  receptionId: string,
  payload: RevertTreasuryReceptionPayload = {}
) =>
  apiRequest<TreasuryReception>(
    `/api/treasury/receptions/${encodeURIComponent(receptionId)}/revert`,
    {
      method: 'POST',
      body: payload,
    }
  );
