import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PublicRuntimeConfig } from './runtimeConfig.types';
import { runtimeConfigApi } from './runtimeConfigApi';

interface RuntimeConfigContextType {
  config: PublicRuntimeConfig | null;
  setupRequired: boolean;
  checkingSetup: boolean;
  refreshSetupStatus: () => Promise<boolean>;
}

const RuntimeConfigContext = createContext<RuntimeConfigContextType | undefined>(undefined);

export const RuntimeConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<PublicRuntimeConfig | null>(null);
  const [setupRequired, setSetupRequired] = useState<boolean>(false);
  const [checkingSetup, setCheckingSetup] = useState<boolean>(true);

  const refreshSetupStatus = async (): Promise<boolean> => {
    setCheckingSetup(true);
    try {
      const status = await runtimeConfigApi.getSetupStatus();
      setSetupRequired(status.setupRequired);
      
      const pubConfig = await runtimeConfigApi.getPublicConfig();
      setConfig(pubConfig);
      
      return status.setupRequired;
    } finally {
      setCheckingSetup(false);
    }
  };

  useEffect(() => {
    refreshSetupStatus();
  }, []);

  return (
    <RuntimeConfigContext.Provider
      value={{
        config,
        setupRequired,
        checkingSetup,
        refreshSetupStatus
      }}
    >
      {children}
    </RuntimeConfigContext.Provider>
  );
};

export const useRuntimeConfig = (): RuntimeConfigContextType => {
  const context = useContext(RuntimeConfigContext);
  if (!context) {
    throw new Error('useRuntimeConfig must be used within a RuntimeConfigProvider');
  }
  return context;
};
