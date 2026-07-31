import React from 'react';
import { ShieldCheck, RefreshCw, Server, Calendar } from 'lucide-react';
import { useLicence } from '../hooks/useLicence';

export const LicenceStatusCard: React.FC = () => {
  const { valid, status, licence, validateNow, validating } = useLicence();

  if (!licence) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={26} color={valid ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>{licence.companyName}</h3>
              <span className={`badge badge-${status?.toLowerCase().replace('licence_', '')}`}>
                {licence.licenceType} — {status}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Ref: <span className="mono">{licence.licenceReference}</span> | Product: <strong>{licence.productCode}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => validateNow()}
          disabled={validating}
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={validating ? 'animate-spin' : ''} />
          {validating ? 'Validating...' : 'Validate Online'}
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginTop: '1.5rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={16} color="var(--text-subtle)" />
          <span>Expires: <strong>{licence.expiresAt ? new Date(licence.expiresAt).toLocaleDateString() : 'Lifetime Perpetuity'}</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={16} color="var(--text-subtle)" />
          <span>Installation: <span className="mono">{licence.installationId}</span></span>
        </div>
      </div>
    </div>
  );
};
