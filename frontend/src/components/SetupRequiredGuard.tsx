import React from 'react';
import { Outlet } from 'react-router-dom';
import { useRuntimeConfig } from '../config/RuntimeConfigContext';

export const SetupRequiredGuard: React.FC = () => {
  const { checkingSetup } = useRuntimeConfig();

  if (checkingSetup) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark)'
      }}>
        <div className="animate-spin" style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: 'var(--primary-500)',
          borderRadius: '50%',
          marginBottom: '1rem'
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Checking system setup status...
        </p>
      </div>
    );
  }

  // If setup is NOT required, render requested route (SetupPage handles redirection if setup is already complete)
  return <Outlet />;
};
