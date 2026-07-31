import { useContext } from 'react';
import { SetupContext, SetupContextType } from '../context/SetupContext';

export const useSetup = (): SetupContextType => {
  const context = useContext(SetupContext);
  if (!context) {
    throw new Error('useSetup must be used within a SetupProvider');
  }
  return context;
};
