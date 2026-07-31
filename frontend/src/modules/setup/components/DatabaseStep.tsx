import React from 'react';
import { useSetup } from '../hooks/useSetup';
import { Database, ArrowRight, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

export const DatabaseStep: React.FC = () => {
  const { database, setDatabase, testDatabase, dbTested, loading, error, setStep, clearError } = useSetup();

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    await testDatabase();
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
        }}>
          <Database size={28} color="#ffffff" />
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Database Configuration</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Configure your MySQL / InnoDB database connection parameters.
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)',
          color: 'var(--accent-rose)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {dbTested && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--accent-emerald)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
          <span>Database connection successfully established and verified!</span>
        </div>
      )}

      <form onSubmit={handleTest}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Database Host</label>
            <input
              type="text"
              required
              value={database.host}
              onChange={(e) => { clearError(); setDatabase({ host: e.target.value }); }}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Port</label>
            <input
              type="number"
              required
              value={database.port}
              onChange={(e) => { clearError(); setDatabase({ port: parseInt(e.target.value, 10) || 3306 }); }}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Database Name</label>
          <input
            type="text"
            required
            value={database.database}
            onChange={(e) => { clearError(); setDatabase({ database: e.target.value }); }}
            className="form-input"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Database User</label>
            <input
              type="text"
              required
              value={database.username}
              onChange={(e) => { clearError(); setDatabase({ username: e.target.value }); }}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={database.password}
              onChange={(e) => { clearError(); setDatabase({ password: e.target.value }); }}
              className="form-input"
              autoComplete="off"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Testing...' : 'Test Connection'}
          </button>

          <button
            type="button"
            onClick={() => setStep('application')}
            disabled={!dbTested || loading}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            Continue <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};
