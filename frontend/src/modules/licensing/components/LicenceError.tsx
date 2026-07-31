import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, Clock, RefreshCw, KeyRound } from 'lucide-react';
import { LicenceStatusCode } from '../types/licence.types';
import { useLicence } from '../hooks/useLicence';

interface LicenceErrorProps {
  status: LicenceStatusCode | null;
  message?: string;
}

export const LicenceError: React.FC<LicenceErrorProps> = ({ status, message }) => {
  const navigate = useNavigate();
  const { validateNow, validating } = useLicence();

  const getDetails = () => {
    switch (status) {
      case 'LICENCE_EXPIRED':
        return {
          icon: <Clock size={48} color="var(--accent-amber)" />,
          title: 'Licence Expired',
          desc: message || 'Your software activation subscription has expired. Please renew your licence to continue.',
          allowRenew: true
        };
      case 'LICENCE_SUSPENDED':
        return {
          icon: <AlertTriangle size={48} color="var(--accent-rose)" />,
          title: 'Licence Suspended',
          desc: message || 'Your software licence has been temporarily suspended by the administrator.',
          allowRenew: false
        };
      case 'LICENCE_REVOKED':
        return {
          icon: <ShieldAlert size={48} color="var(--accent-rose)" />,
          title: 'Licence Revoked',
          desc: message || 'This licence certificate has been permanently revoked.',
          allowRenew: false
        };
      case 'ONLINE_VALIDATION_REQUIRED':
        return {
          icon: <RefreshCw size={48} color="var(--accent-cyan)" />,
          title: 'Online Validation Required',
          desc: message || 'The offline grace period has ended. An online connection to the licence server is required.',
          allowValidate: true
        };
      case 'CLOCK_ROLLBACK_DETECTED':
        return {
          icon: <AlertTriangle size={48} color="var(--accent-rose)" />,
          title: 'Clock Rollback Detected',
          desc: message || 'System time modification was detected. Please restore accurate system time.',
          allowValidate: true
        };
      default:
        return {
          icon: <ShieldAlert size={48} color="var(--accent-rose)" />,
          title: 'Licence Verification Error',
          desc: message || 'Hardware fingerprint mismatch or invalid cryptographic signature detected.',
          allowReactivate: true
        };
    }
  };

  const details = getDetails();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--bg-dark)'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '2.5rem',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          {details.icon}
        </div>

        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{details.title}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          {details.desc}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {details.allowValidate && (
            <button
              onClick={() => validateNow()}
              disabled={validating}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              <RefreshCw size={18} className={validating ? 'animate-spin' : ''} />
              {validating ? 'Connecting to Server...' : 'Validate Licence Now'}
            </button>
          )}

          <button
            onClick={() => navigate('/activate-licence')}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            <KeyRound size={18} />
            Enter New Licence Key
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '2rem' }}>
          Need assistance? Contact support@enterprise.com with your system reference.
        </p>
      </div>
    </div>
  );
};
