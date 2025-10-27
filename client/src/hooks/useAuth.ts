import { useState, useCallback } from 'react';
import { 
  LoginFormData, 
  RegisterFormData, 
  TwoFactorFormData,
  LoginResponse, 
  RegisterResponse, 
  TwoFactorResponse,
  GoogleAuthResponse,
  LoadingState,
  ApiError 
} from '../types';
import { api, handleApiError } from '../utils';

export const useAuth = () => {
  const [loading, setLoading] = useState<LoadingState>({
    login: false,
    register: false,
    twoFactor: false,
    googleAuth: false,
    resendVerification: false,
    resendTwoFactor: false,
  });
  
  const [error, setError] = useState<ApiError | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const setLoadingState = useCallback((key: keyof LoadingState, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (formData: LoginFormData): Promise<LoginResponse> => {
    setLoadingState('login', true);
    setError(null);
    
    try {
      const response = await api.login(formData.email, formData.password, formData.rememberMe);
      
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
  }, [setLoadingState]);

  const register = useCallback(async (formData: RegisterFormData): Promise<RegisterResponse> => {
    setLoadingState('register', true);
    setError(null);
    
    try {
      const response = await api.register(formData.fullName, formData.email, formData.password);
      return response;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      throw apiError;
    } finally {
      setLoadingState('register', false);
    }
  }, [setLoadingState]);

  const verifyTwoFactor = useCallback(async (formData: TwoFactorFormData): Promise<TwoFactorResponse> => {
    if (!challengeId) {
      throw new Error('No challenge ID available');
    }
    
    setLoadingState('twoFactor', true);
    setError(null);
    
    try {
      const response = await api.twoFactorAuth(challengeId, formData.code);
      setChallengeId(null);
      return response;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      throw apiError;
    } finally {
      setLoadingState('twoFactor', false);
    }
  }, [challengeId, setLoadingState]);

  const googleAuth = useCallback(async (credential: string, isLogin: boolean = true): Promise<GoogleAuthResponse> => {
    setLoadingState('googleAuth', true);
    setError(null);
    
    try {
      const response = await api.googleAuth(credential, isLogin);
      return response;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      throw apiError;
    } finally {
      setLoadingState('googleAuth', false);
    }
  }, [setLoadingState]);

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

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.logout();
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
    logout,
    clearError,
  };
};