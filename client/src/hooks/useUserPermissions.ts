import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../types';
import { api, handleApiError } from '../utils';

interface UseUserPermissionsOptions {
  enabled?: boolean;
}

interface UseUserPermissionsResult {
  permissions: string[];
  loading: boolean;
  error: ApiError | null;
  refresh: () => Promise<string[]>;
}

let cachedPermissions: string[] | null = null;
let cachedError: ApiError | null = null;
let inFlightPromise: Promise<string[]> | null = null;

const extractPermissions = (payload: any): string[] => {
  if (!payload) return [];
  if (Array.isArray(payload.permissions)) {
    return payload.permissions;
  }
  if (Array.isArray(payload.user?.permissions)) {
    return payload.user.permissions;
  }
  if (Array.isArray(payload.profile?.permissions)) {
    return payload.profile.permissions;
  }
  return [];
};

const requestPermissions = async (): Promise<string[]> => {
  try {
    const response = await api.getProfile();
    const permissions = extractPermissions(response);
    cachedPermissions = permissions;
    cachedError = null;
    return permissions;
  } catch (error) {
    const apiError = handleApiError(error);
    cachedError = apiError;
    cachedPermissions = null;
    throw apiError;
  } finally {
    inFlightPromise = null;
  }
};

export const useUserPermissions = (
  options: UseUserPermissionsOptions = {}
): UseUserPermissionsResult => {
  const { enabled = true } = options;
  const [permissions, setPermissions] = useState<string[]>(() => cachedPermissions ?? []);
  const [loading, setLoading] = useState<boolean>(enabled && cachedPermissions === null);
  const [error, setError] = useState<ApiError | null>(cachedError);

  const loadPermissions = useCallback(async (): Promise<string[]> => {
    if (!enabled) {
      setPermissions([]);
      setLoading(false);
      setError(null);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const promise = inFlightPromise ?? requestPermissions();
      if (!inFlightPromise) {
        inFlightPromise = promise;
      }
      const result = await promise;
      setPermissions(result);
      return result;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      setPermissions([]);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setPermissions([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (cachedPermissions !== null) {
      setPermissions(cachedPermissions);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const promise = inFlightPromise ?? requestPermissions();
    if (!inFlightPromise) {
      inFlightPromise = promise;
    }

    promise
      .then((result) => {
        if (!cancelled) {
          setPermissions(result);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const apiError = handleApiError(err);
          setError(apiError);
          setPermissions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    permissions,
    loading,
    error,
    refresh: loadPermissions,
  };
};
