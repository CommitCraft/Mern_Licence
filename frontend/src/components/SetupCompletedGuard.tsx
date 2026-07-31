import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useRuntimeConfig } from '../config/RuntimeConfigContext';

export const SetupCompletedGuard: React.FC = () => {
  const { setupRequired, checkingSetup } = useRuntimeConfig();

  if (checkingSetup) {
    return null;
  }

  // If system setup is required, automatically redirect all application routes to /setup
  if (setupRequired) {
    return <Navigate to="/setup" replace />;
  }

  return <Outlet />;
};
