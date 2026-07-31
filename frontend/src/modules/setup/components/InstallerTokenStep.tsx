import React, { useState } from 'react';
import { useSetup } from '../hooks/useSetup';
import { Key, ArrowRight, ShieldAlert } from 'lucide-react';

export const InstallerTokenStep: React.FC = () => {
  const [tokenInput, setTokenInput] = useState<string>('');
  const { verifyToken, loading, error, clearError } = useSetup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() || loading) return;
    await verifyToken(tokenInput.trim());
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          boxShadow: '0 8px 24px var(--primary-glow)'
        }}>
          <Key size={28} color="#ffffff" />
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Authorize Installation</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Enter the one-time installer token generated during server deployment.
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: 'var(--accent-rose)',
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.9rem'
        }}>
          <ShieldAlert size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="tokenField" className="form-label">One-Time Installer Token</label>
          <input
            id="tokenField"
            type="text"
            value={tokenInput}
            onChange={(e) => { clearError(); setTokenInput(e.target.value); }}
            placeholder="Paste 64-character hex installer token"
            className="form-input mono"
            autoComplete="off"
            spellCheck={false}
            required
            style={{ width: '100%', fontSize: '1rem', padding: '0.9rem' }}
          />
        </div>

        <button
          type="submit"
          disabled={!tokenInput.trim() || loading}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '1rem' }}
        >
          {loading ? 'Verifying Token...' : <>Verify & Begin Setup <ArrowRight size={18} /></>}
        </button>
      </form>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '2rem', textAlign: 'center' }}>
        Log into your server via CLI and run <code>php backend/scripts/generate-installer-token.php</code> to view token.
      </p>
    </div>
  );
};
