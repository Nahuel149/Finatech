import { useState, useCallback } from 'react';
import { LoginFormData, RegisterFormData, TwoFactorFormData, PasswordRecoveryFormData, PasswordResetFormData, LoginResponse, RegisterResponse, TwoFactorResponse, GoogleAuthResponse, PasswordRecoveryResponse, PasswordResetResponse, LoadingState, ApiError, UserProfile } from '../types/auth';
import { api, handleApiError } from '../utils/api';
import { primeCurrentUser } from './useCurrentUser';

export const useAuth = () => {
  const [loading, setLoading] = useState<LoadingState>({
    login: false,
    register: false,
    twoFactor: false,
    googleAuth: false,
    resendVerification: false,
    resendTwoFactor: false,
    passwordRecovery: false,
    passwordReset: false,
  });
  
  const [error, setError] = useState<ApiError | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const setLoadingState = useCallback((key: keyof LoadingState, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

const clearError = useCallback(() => {
  setError(null);
}, []);

const extractProfile = (payload: any): UserProfile | null => {
  if (!payload) {
    return null;
  }

  const source = payload.profile || payload.user || payload;
  if (!source) {
    return null;
  }

  if (source.id) {
    return {
      id: source.id,
      fullName: source.fullName,
      email: source.email,
      providers: source.providers,
      isVerified: source.isVerified,
      createdAt: source.createdAt,
      permissions: source.permissions,
    };
  }

  if (source._id) {
    return {
      id: source._id,
      fullName: source.fullName,
      email: source.email,
      providers: source.providers,
      isVerified: source.isVerified,
      createdAt: source.createdAt,
      permissions: source.permissions,
    };
  }

  return null;
};

const updateCachedProfile = useCallback((payload: any) => {
  const profile = extractProfile(payload);
  if (profile) {
    primeCurrentUser(profile);
  }
}, []);

  const login = useCallback(async (formData: LoginFormData): Promise<LoginResponse> => {
    setLoadingState('login', true);
    setError(null);
    
    try {
      const response = await api.login(formData.email, formData.password, formData.rememberMe);
      updateCachedProfile(response);
      
      if (response.requiresTwoFactor && response.challengeId) {
        setChallengeId(response.challengeId);
      }
      
      return response;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      throw apiError;
    } finally {
      setLoadingState('login', false);
    }
  }, [setLoadingState, updateCachedProfile]);

  const register = useCallback(async (formData: RegisterFormData): Promise<RegisterResponse> => {
    setLoadingState('register', true);
    setError(null);
    
    try {
      const response = await api.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: formData.agreeToTerms,
      });
      updateCachedProfile(response);
      return response;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      throw apiError;
    } finally {
      setLoadingState('register', false);
    }
  }, [setLoadingState, updateCachedProfile]);

  const verifyTwoFactor = useCallback(async (formData: TwoFactorFormData): Promise<TwoFactorResponse> => {
    const resolvedChallengeId = formData.challengeId || challengeId;
    if (!resolvedChallengeId) {
      throw new Error('No challenge ID available');
    }
    
    setLoadingState('twoFactor', true);
    setError(null);
    
    try {
      const response = await api.twoFactorAuth(resolvedChallengeId, formData.code);
      updateCachedProfile(response);
      setChallengeId(null);
      return response;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      throw apiError;
    } finally {
      setLoadingState('twoFactor', false);
    }
  }, [challengeId, setLoadingState, updateCachedProfile]);

  const googleAuth = useCallback(async (credential: string, isLogin: boolean = true): Promise<GoogleAuthResponse> => {
    setLoadingState('googleAuth', true);
    setError(null);
    
    try {
      const response = await api.googleAuth(credential, isLogin);
      if (response.requiresTwoFactor && response.challengeId) {
        setChallengeId(response.challengeId);
      }
      updateCachedProfile(response);
      return response;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      throw apiError;
    } finally {
      setLoadingState('googleAuth', false);
    }
  }, [setLoadingState, updateCachedProfile]);

  const resendVerification = useCallback(async (email: string): Promise<void> => {
    setLoadingState('resendVerification', true);
    setError(null);
    
    try {
      await api.resendVerification(email);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      throw apiError;
    } finally {
      setLoadingState('resendVerification', false);
    }
  }, [setLoadingState]);

  const resendTwoFactor = useCallback(async (): Promise<void> => {
    if (!challengeId) {
      throw new Error('No challenge ID available');
    }
    
    setLoadingState('resendTwoFactor', true);
    setError(null);
    
    try {
      await api.resendTwoFactor(challengeId);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      throw apiError;
    } finally {
      setLoadingState('resendTwoFactor', false);
    }
  }, [challengeId, setLoadingState]);

  const requestPasswordReset = useCallback(async (data: PasswordRecoveryFormData): Promise<PasswordRecoveryResponse> => {
    setLoadingState('passwordRecovery', true);
    setError(null);
    
    try {
      const response = await api.requestPasswordReset(data.email);
      return response;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      throw apiError;
    } finally {
      setLoadingState('passwordRecovery', false);
    }
  }, [setLoadingState]);

  const resetPassword = useCallback(async (data: PasswordResetFormData): Promise<PasswordResetResponse> => {
    setLoadingState('passwordReset', true);
    setError(null);
    
    try {
      const response = await api.resetPassword(data.token, data.newPassword);
      return response;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      throw apiError;
    } finally {
      setLoadingState('passwordReset', false);
    }
  }, [setLoadingState]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.logout();
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
      primeCurrentUser(null);
      setChallengeId(null);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      throw apiError;
    }
  }, []);

  return {
    loading,
    error,
    challengeId,
    login,
    register,
    verifyTwoFactor,
    googleAuth,
    resendVerification,
    resendTwoFactor,
    requestPasswordReset,
    resetPassword,
    logout,
    clearError,
  };
};
