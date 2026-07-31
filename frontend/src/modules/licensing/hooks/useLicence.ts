import { useContext } from 'react';
import { LicenceContext, LicenceContextType } from '../context/LicenceContext';

export const useLicence = (): LicenceContextType => {
  const context = useContext(LicenceContext);
  if (!context) {
    throw new Error('useLicence hook must be used within a <LicenceProvider>');
  }
  return context;
};
