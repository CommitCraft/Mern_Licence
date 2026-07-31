import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LicenceDetails, LicenceFeatures, LicenceStatusCode, LicenceStatusResponse } from '../types/licence.types';
import { licenceApi } from '../services/licenceApi';

export interface LicenceContextType {
  status: LicenceStatusCode | null;
  valid: boolean;
  loading: boolean;
  activating: boolean;
  validating: boolean;
  error: string | null;
  features: LicenceFeatures;
  licence: LicenceDetails | null;
  message: string;
  refreshStatus: () => Promise<LicenceStatusResponse>;
  activate: (licenceKey: string) => Promise<{ success: boolean; message: string }>;
  validateNow: () => Promise<{ success: boolean; message: string }>;
  deactivate: () => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
}

export const LicenceContext = createContext<LicenceContextType | undefined>(undefined);

export const LicenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<LicenceStatusCode | null>(null);
  const [valid, setValid] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activating, setActivating] = useState<boolean>(false);
  const [validating, setValidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [features, setFeatures] = useState<LicenceFeatures>({});
  const [licence, setLicence] = useState<LicenceDetails | null>(null);

  const applyStatusResponse = (res: LicenceStatusResponse) => {
    setValid(res.valid);
    setStatus(res.code);
    setMessage(res.message || '');
    if (res.features) setFeatures(res.features);
    if (res.licence) setLicence(res.licence);
  };

  const refreshStatus = useCallback(async (): Promise<LicenceStatusResponse> => {
    setLoading(true);
    try {
      const res = await licenceApi.getLicenceStatus();
      applyStatusResponse(res);
      return res;
    } catch (err) {
      const fallback: LicenceStatusResponse = {
        valid: false,
        code: 'LICENCE_REQUIRED',
        message: 'Could not connect to licence server.'
      };
      applyStatusResponse(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const activate = async (licenceKey: string): Promise<{ success: boolean; message: string }> => {
    setActivating(true);
    setError(null);
    try {
      const res = await licenceApi.activateLicence(licenceKey);
      if (res.success) {
        await refreshStatus();
        return { success: true, message: res.message };
      } else {
        setError(res.message);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const msg = 'An unexpected error occurred during activation.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setActivating(false);
    }
  };

  const validateNow = async (): Promise<{ success: boolean; message: string }> => {
    setValidating(true);
    setError(null);
    try {
      const res = await licenceApi.validateLicence();
      await refreshStatus();
      if (!res.success) {
        setError(res.message);
      }
      return { success: res.success, message: res.message };
    } finally {
      setValidating(false);
    }
  };

  const deactivate = async (): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    try {
      const res = await licenceApi.deactivateLicence();
      await refreshStatus();
      return res;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <LicenceContext.Provider
      value={{
        status,
        valid,
        loading,
        activating,
        validating,
        error,
        features,
        licence,
        message,
        refreshStatus,
        activate,
        validateNow,
        deactivate,
        clearError
      }}
    >
      {children}
    </LicenceContext.Provider>
  );
};
