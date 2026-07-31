import React, { useState } from 'react';
import { useSetup } from '../hooks/useSetup';
import { UserCheck, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const AdministratorStep: React.FC = () => {
  const { administrator, setAdministrator, setStep } = useSetup();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (administrator.password.length < 12) {
      setValidationError('Super Administrator password must be at least 12 characters long.');
      return;
    }

    if (administrator.password !== administrator.confirmPassword) {
      setValidationError('Password and confirmation password do not match.');
      return;
    }

    setStep('review');
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
        }}>
          <UserCheck size={28} color="#ffffff" />
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>First Super Administrator</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Create the primary master administrative account for system management.
        </p>
      </div>

      {validationError && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)',
          color: 'var(--accent-rose)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            required
            value={administrator.fullName}
            onChange={(e) => setAdministrator({ fullName: e.target.value })}
            className="form-input"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              required
              value={administrator.username}
              onChange={(e) => setAdministrator({ username: e.target.value.toLowerCase() })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              value={administrator.email}
              onChange={(e) => setAdministrator({ email: e.target.value.toLowerCase() })}
              className="form-input"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Master Password (Min 12 Chars)</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={12}
                value={administrator.password}
                onChange={(e) => setAdministrator({ password: e.target.value })}
                className="form-input"
                style={{ width: '100%', paddingRight: '2.5rem' }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={12}
              value={administrator.confirmPassword}
              onChange={(e) => setAdministrator({ confirmPassword: e.target.value })}
              className="form-input"
              autoComplete="new-password"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '1.5rem' }}
        >
          Review & Complete Installation <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
};
