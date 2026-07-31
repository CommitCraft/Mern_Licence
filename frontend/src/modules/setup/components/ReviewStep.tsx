import React from 'react';
import { useSetup } from '../hooks/useSetup';
import { CheckCircle2, ArrowRight, Database, Globe, Building, UserCheck, ShieldAlert } from 'lucide-react';

export const ReviewStep: React.FC = () => {
  const { database, application, company, administrator, runInstallation, loading, error, setStep } = useSetup();

  const handleRun = async () => {
    await runInstallation();
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
        }}>
          <CheckCircle2 size={28} color="#ffffff" />
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Review Setup Configuration</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Please review your configuration summary before initializing the backend environment.
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)',
          color: 'var(--accent-rose)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem'
        }}>
          <ShieldAlert size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={16} color="var(--primary-500)" /> Database Connection
            </span>
            <button onClick={() => setStep('database')} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Edit</button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Host: <strong className="mono">{database.host}:{database.port}</strong> | Name: <strong className="mono">{database.database}</strong> | User: <strong className="mono">{database.username}</strong>
          </p>
        </div>

        <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={16} color="var(--accent-cyan)" /> Application & Branding
            </span>
            <button onClick={() => setStep('application')} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Edit</button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Name: <strong>{application.name}</strong> | URL: <strong>{application.url}</strong> | Timezone: <strong>{application.timezone}</strong>
          </p>
        </div>

        <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={16} color="var(--accent-emerald)" /> Company Profile
            </span>
            <button onClick={() => setStep('company')} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Edit</button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Company: <strong>{company.name} ({company.code})</strong> | Email: <strong>{company.email}</strong>
          </p>
        </div>

        <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={16} color="var(--accent-amber)" /> Super Administrator
            </span>
            <button onClick={() => setStep('administrator')} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Edit</button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Admin: <strong>{administrator.fullName}</strong> (<span className="mono">{administrator.username}</span>) | Email: <strong>{administrator.email}</strong>
          </p>
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}
      >
        {loading ? (
          <>
            <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
            Initializing System & Writing Configuration...
          </>
        ) : (
          <>
            Execute Complete System Installation <ArrowRight size={18} />
          </>
        )}
      </button>
    </div>
  );
};
