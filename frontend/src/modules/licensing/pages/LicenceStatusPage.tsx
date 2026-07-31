import React, { useState } from 'react';
import { useLicence } from '../hooks/useLicence';
import { Shield, RefreshCw, LogOut, CheckCircle2, AlertTriangle, Building, User, Calendar, Cpu, Layers } from 'lucide-react';

export const LicenceStatusPage: React.FC = () => {
  const { licence, status, valid, features, validateNow, validating, deactivate } = useLicence();
  const [confirmDeactivate, setConfirmDeactivate] = useState<boolean>(false);

  if (!licence) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No software licence information is currently available.</p>
      </div>
    );
  }

  const handleDeactivate = async () => {
    if (!confirmDeactivate) {
      setConfirmDeactivate(true);
      return;
    }
    await deactivate();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Licence & System Information</h1>
        <p className="page-subtitle">Manage your active installation, check features, or trigger online validation.</p>
      </div>

      {/* Main Licence Status Panel */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={32} color={valid ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.5rem' }}>{licence.companyName}</h2>
                <span className={`badge badge-${status?.toLowerCase().replace('licence_', '')}`}>
                  {licence.licenceType} — {status}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Ref ID: <strong className="mono">{licence.licenceReference}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => validateNow()}
              disabled={validating}
              className="btn btn-secondary"
            >
              <RefreshCw size={16} className={validating ? 'animate-spin' : ''} />
              {validating ? 'Validating...' : 'Validate Online'}
            </button>

            <button
              onClick={handleDeactivate}
              className="btn btn-danger"
            >
              <LogOut size={16} />
              {confirmDeactivate ? 'Confirm Deactivation?' : 'Deactivate Server'}
            </button>
          </div>
        </div>

        {/* Detail Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
              <User size={16} /> Registered Customer
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>{licence.customerName}</p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
              <Building size={16} /> Licensed Organization
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>{licence.companyName}</p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
              <Layers size={16} /> Product Edition
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>{licence.productCode} ({licence.licenceType})</p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
              <Calendar size={16} /> Expiration Date
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>
              {licence.expiresAt ? new Date(licence.expiresAt).toLocaleDateString() : 'Perpetual Lifetime'}
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
              <RefreshCw size={16} /> Next Online Check
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>
              {new Date(licence.nextValidationAt).toLocaleString()}
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
              <AlertTriangle size={16} /> Offline Grace Ends
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--accent-amber)' }}>
              {new Date(licence.graceEndsAt).toLocaleDateString()}
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
              <Cpu size={16} /> Masked Installation ID
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 500 }} className="mono">
              {licence.installationId}
            </p>
          </div>
        </div>
      </div>

      {/* Licensed Features Breakdown */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Active Feature Entitlements</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}>
          {Object.entries(features).map(([key, val]) => (
            <div key={key} style={{
              background: 'var(--bg-input)',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', textTransform: 'capitalize' }}>
                {key.replace(/([A-Z])/g, ' $1')}
              </span>
              {typeof val === 'boolean' ? (
                val ? (
                  <CheckCircle2 size={18} color="var(--accent-emerald)" />
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Disabled</span>
                )
              ) : (
                <span className="badge badge-active" style={{ fontSize: '0.8rem' }}>
                  {val} MAX
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
