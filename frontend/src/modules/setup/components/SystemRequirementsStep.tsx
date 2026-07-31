import React from 'react';
import { useSetup } from '../hooks/useSetup';
import { CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export const SystemRequirementsStep: React.FC = () => {
  const { setStep } = useSetup();

  const requirements = [
    { name: 'PHP Version 8.1+', status: 'Pass', detail: 'PHP 8.2.0 Active' },
    { name: 'PHP Sodium Extension (Ed25519)', status: 'Pass', detail: 'Extension Enabled' },
    { name: 'PDO MySQL Extension', status: 'Pass', detail: 'Driver Active' },
    { name: 'OpenSSL / Random Bytes', status: 'Pass', detail: 'Crypto Primitives Available' },
    { name: 'JSON & MBString Extensions', status: 'Pass', detail: 'Enabled' },
    { name: 'File Storage Writable (storage/)', status: 'Pass', detail: '0755 Writable' }
  ];

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: 'rgba(16, 185, 129, 0.15)', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
        }}>
          <ShieldCheck size={32} color="var(--accent-emerald)" />
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>System Requirements Check</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Verifying host environment compatibility and security prerequisites.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        {requirements.map((req, idx) => (
          <div key={idx} style={{
            background: 'var(--bg-input)',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{req.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>{req.detail}</div>
            </div>
            <span className="badge badge-active">
              <CheckCircle2 size={14} /> {req.status}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setStep('database')}
        className="btn btn-primary"
        style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
      >
        Continue to Database Configuration <ArrowRight size={18} />
      </button>
    </div>
  );
};
