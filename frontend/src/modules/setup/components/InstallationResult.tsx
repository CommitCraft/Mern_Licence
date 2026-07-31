import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useRuntimeConfig } from '../../../config/RuntimeConfigContext';

export const InstallationResult: React.FC = () => {
  const navigate = useNavigate();
  const { refreshSetupStatus } = useRuntimeConfig();

  useEffect(() => {
    refreshSetupStatus();
  }, []);

  const handleFinish = async () => {
    await refreshSetupStatus();
    navigate('/login');
  };

  return (
    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '20px',
        background: 'rgba(16, 185, 129, 0.15)', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
      }}>
        <CheckCircle2 size={48} color="var(--accent-emerald)" />
      </div>

      <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Installation Completed Successfully</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2rem' }}>
        The backend <code>.env</code> configuration file, MySQL database tables, default roles, company profile, and Super Administrator account have been successfully created.
      </p>

      <div style={{
        background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '12px',
        border: '1px solid var(--border-color)', marginBottom: '2rem', textAlign: 'left', fontSize: '0.9rem'
      }}>
        <div style={{ fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} /> Permanent Setup Lock Active
        </div>
        <p style={{ color: 'var(--text-muted)' }}>
          The installation wizard APIs have been permanently disabled via <code>storage/setup/setup.lock</code>. You can now log into your application.
        </p>
      </div>

      <button
        onClick={handleFinish}
        className="btn btn-primary"
        style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
      >
        Go to Login Portal <ArrowRight size={18} />
      </button>
    </div>
  );
};
