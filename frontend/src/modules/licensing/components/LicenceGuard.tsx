import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useLicence } from '../hooks/useLicence';
import { LicenceError } from './LicenceError';

export const LicenceGuard: React.FC = () => {
  const { valid, loading, status, message } = useLicence();
  const location = useLocation();

  if (loading) {
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
          Verifying software licence certificate...
        </p>
      </div>
    );
  }

  if (valid) {
    return <Outlet />;
  }

  // If licence is unactivated / missing, redirect to activation page
  if (status === 'LICENCE_REQUIRED' || status === null) {
    if (location.pathname !== '/activate-licence') {
      return <Navigate to="/activate-licence" state={{ from: location }} replace />;
    }
  }

  // Display specific licence status error screen (Expired, Suspended, Revoked, Signature Invalid, etc.)
  return <LicenceError status={status} message={message} />;
};
