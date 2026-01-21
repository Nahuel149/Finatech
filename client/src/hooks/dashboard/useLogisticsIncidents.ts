import { useCallback, useEffect, useState } from 'react';
import { api, handleApiError } from '../../utils/api';
import { ApiError } from '../../types/auth';
import { LogisticsIncident } from '../../types/logistics';

export const useLogisticsIncidentDetail = (incidentId?: string) => {
  const [incident, setIncident] = useState<LogisticsIncident | null>(null);
  const [loading, setLoading] = useState(Boolean(incidentId));
  const [error, setError] = useState<ApiError | null>(null);

  const fetchIncident = useCallback(async () => {
    if (!incidentId) {
      setIncident(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = (await api.getLogisticsIncident(incidentId)) as LogisticsIncident;
      setIncident(response);
    } catch (err) {
      setError(handleApiError(err));
      setIncident(null);
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    fetchIncident();
  }, [fetchIncident]);

  return {
    incident,
    loading,
    error,
    refresh: fetchIncident,
  };
};

export const useLogisticsIncidents = (initialParams: Record<string, unknown> = {}) => {
  const [incidents, setIncidents] = useState<LogisticsIncident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [params, setParams] = useState<Record<string, unknown>>(initialParams);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = (await api.getLogisticsIncidents(params)) as { data: LogisticsIncident[] };
      setIncidents(response?.data ?? []);
    } catch (err) {
      setError(handleApiError(err));
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  return {
    incidents,
    loading,
    error,
    params,
    setParams,
    refresh: fetchIncidents,
  };
};
