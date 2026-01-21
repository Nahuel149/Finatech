import { useCallback, useEffect, useState } from 'react';
import { api, handleApiError } from '../utils/api';
import { ApiError, ProfileResponse, UserProfile } from '../types/auth';

let cachedUser: UserProfile | null = null;
let cachedError: ApiError | null = null;
let inFlight: Promise<UserProfile | null> | null = null;

type Subscriber = (profile: UserProfile | null, error: ApiError | null) => void;
const subscribers = new Set<Subscriber>();

const notifySubscribers = (profile: UserProfile | null, error: ApiError | null) => {
  subscribers.forEach((listener) => listener(profile, error));
};

const fetchUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const response = await api.getProfile();
    const profile = (response as ProfileResponse)?.profile ?? null;
    cachedUser = profile;
    cachedError = null;
    notifySubscribers(profile, null);
    return profile;
  } catch (error) {
    const apiError = handleApiError(error);
    cachedUser = null;
    cachedError = apiError;
    notifySubscribers(null, apiError);
    throw apiError;
  } finally {
    inFlight = null;
  }
};

export const useCurrentUser = () => {
  const [user, setUser] = useState<UserProfile | null>(cachedUser);
  const [loading, setLoading] = useState<boolean>(cachedUser === null && cachedError === null);
  const [error, setError] = useState<ApiError | null>(cachedError);

  const loadProfile = useCallback(async (): Promise<UserProfile | null> => {
    setLoading(true);
    setError(null);
    try {
      const promise = inFlight ?? fetchUserProfile();
      if (!inFlight) {
        inFlight = promise;
      }
      const profile = await promise;
      setUser(profile);
      setError(null);
      notifySubscribers(profile, null);
      return profile;
    } catch (err) {
      const apiError = handleApiError(err);
      setUser(null);
      setError(apiError);
      notifySubscribers(null, apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cachedUser !== null || cachedError !== null) {
      setUser(cachedUser);
      setError(cachedError);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const promise = inFlight ?? fetchUserProfile();
    if (!inFlight) {
      inFlight = promise;
    }

    promise
      .then((profile) => {
        if (!cancelled) {
          setUser(profile);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const apiError = handleApiError(err);
          setUser(null);
          setError(apiError);
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
  }, []);

  useEffect(() => {
    const listener: Subscriber = (profile, nextError) => {
      setUser(profile);
      setError(nextError);
      setLoading(false);
    };

    subscribers.add(listener);
    return () => {
      subscribers.delete(listener);
    };
  }, []);

  return {
    user,
    loading,
    error,
    refresh: loadProfile,
  };
};

export default useCurrentUser;

export const primeCurrentUser = (profile: UserProfile | null) => {
  cachedUser = profile;
  cachedError = null;
  inFlight = null;
  notifySubscribers(profile, null);
};
