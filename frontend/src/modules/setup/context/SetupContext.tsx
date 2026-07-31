import React, { createContext, useState, ReactNode } from 'react';
import {
  SetupStepId,
  DatabaseConfig,
  ApplicationConfig,
  CompanyConfig,
  LicenceSetupConfig,
  AdministratorConfig,
  CompleteSetupPayload
} from '../types/setup.types';
import { setupApi } from '../services/setupApi';

export interface SetupContextType {
  currentStep: SetupStepId;
  tokenVerified: boolean;
  dbTested: boolean;
  error: string | null;
  loading: boolean;
  database: DatabaseConfig;
  application: ApplicationConfig;
  company: CompanyConfig;
  licence: LicenceSetupConfig;
  administrator: AdministratorConfig;
  setStep: (step: SetupStepId) => void;
  verifyToken: (token: string) => Promise<boolean>;
  testDatabase: () => Promise<boolean>;
  setDatabase: (db: Partial<DatabaseConfig>) => void;
  setApplication: (app: Partial<ApplicationConfig>) => void;
  setCompany: (comp: Partial<CompanyConfig>) => void;
  setLicence: (lic: Partial<LicenceSetupConfig>) => void;
  setAdministrator: (admin: Partial<AdministratorConfig>) => void;
  runInstallation: () => Promise<boolean>;
  clearError: () => void;
}

export const SetupContext = createContext<SetupContextType | undefined>(undefined);

export const SetupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<SetupStepId>('welcome');
  const [tokenVerified, setTokenVerified] = useState<boolean>(false);
  const [dbTested, setDbTested] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [database, setDatabaseState] = useState<DatabaseConfig>({
    host: 'localhost',
    port: 3306,
    database: 'licence_system',
    username: 'root',
    password: ''
  });

  const [application, setApplicationState] = useState<ApplicationConfig>({
    name: 'EMS-PRO Enterprise Platform',
    url: 'https://ems-pro.aploslogix.com',
    environment: 'production',
    timezone: 'Asia/Kolkata'
  });

  const [company, setCompanyState] = useState<CompanyConfig>({
    name: 'ABC Manufacturing Pvt Ltd',
    code: 'ABC',
    email: 'info@aploslogix.com'
  });

  const [licence, setLicenceState] = useState<LicenceSetupConfig>({
    serverUrl: 'local',
    productCode: 'EMS',
    validationIntervalHours: 24,
    offlineGraceDays: 7
  });

  const [administrator, setAdministratorState] = useState<AdministratorConfig>({
    fullName: 'System Administrator',
    username: 'admin',
    email: 'admin@aploslogix.com',
    password: '',
    confirmPassword: ''
  });

  const setDatabase = (db: Partial<DatabaseConfig>) => {
    setDbTested(false);
    setDatabaseState(prev => ({ ...prev, ...db }));
  };

  const setApplication = (app: Partial<ApplicationConfig>) => {
    setApplicationState(prev => ({ ...prev, ...app }));
  };

  const setCompany = (comp: Partial<CompanyConfig>) => {
    setCompanyState(prev => ({ ...prev, ...comp }));
  };

  const setLicence = (lic: Partial<LicenceSetupConfig>) => {
    setLicenceState(prev => ({ ...prev, ...lic }));
  };

  const setAdministrator = (admin: Partial<AdministratorConfig>) => {
    setAdministratorState(prev => ({ ...prev, ...admin }));
  };

  const verifyToken = async (token: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await setupApi.verifyToken(token);
      if (res.success) {
        setTokenVerified(true);
        setCurrentStep('requirements');
        return true;
      } else {
        setError(res.message);
        return false;
      }
    } finally {
      setLoading(false);
    }
  };

  const testDatabase = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await setupApi.testDatabase(database);
      if (res.success) {
        setDbTested(true);
        return true;
      } else {
        setError(res.message);
        return false;
      }
    } finally {
      setLoading(false);
    }
  };

  const runInstallation = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setCurrentStep('installing');

    const payload: CompleteSetupPayload = {
      database,
      application,
      company,
      licence,
      administrator
    };

    try {
      const res = await setupApi.executeInstallation(payload);
      if (res.success) {
        // Clear sensitive state from memory after completion
        setDatabaseState({ host: '', port: 3306, database: '', username: '', password: '' });
        setAdministratorState({ fullName: '', username: '', email: '', password: '', confirmPassword: '' });
        setCurrentStep('completed');
        return true;
      } else {
        setError(res.message);
        setCurrentStep('review');
        return false;
      }
    } catch {
      setError('An unexpected error occurred during installation execution.');
      setCurrentStep('review');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <SetupContext.Provider
      value={{
        currentStep,
        tokenVerified,
        dbTested,
        error,
        loading,
        database,
        application,
        company,
        licence,
        administrator,
        setStep: setCurrentStep,
        verifyToken,
        testDatabase,
        setDatabase,
        setApplication,
        setCompany,
        setLicence,
        setAdministrator,
        runInstallation,
        clearError
      }}
    >
      {children}
    </SetupContext.Provider>
  );
};
