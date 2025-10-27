import { useEffect } from 'react';
import { useApi } from '../useApi';
import { DashboardNotificationsResponse } from '../../types';

export const useDashboardNotifications = () => {
  const api = useApi<DashboardNotificationsResponse>('/api/dashboard/notifications');

  useEffect(() => {
    api.execute().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    notifications: api.data?.notifications ?? [],
    loading: api.loading,
    error: api.error,
    refresh: api.execute,
  };
};