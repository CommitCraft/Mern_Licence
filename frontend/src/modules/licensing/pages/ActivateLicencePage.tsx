import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, KeyRound, ArrowRight, AlertCircle, HelpCircle } from 'lucide-react';
import { useLicence } from '../hooks/useLicence';
import { formatLicenceKey, isLicenceKeyComplete } from '../utils/licenceKeyFormatter';

export const ActivateLicencePage: React.FC = () => {
  const [rawInput, setRawInput] = useState<string>('');
  const { activate, activating, error, clearError } = useLicence();
  const navigate = useNavigate();

  const formattedKey = formatLicenceKey(rawInput);
  const isComplete = isLicenceKeyComplete(formattedKey);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setRawInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || activating) return;

    const res = await activate(formattedKey);
    if (res.success) {
      setRawInput(''); // Clear key from local state after activation
      navigate('/dashboard');
    }
  };

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
        maxWidth: '540px',
        width: '100%',
        padding: '3rem 2.5rem',
        borderRadius: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px var(--primary-glow)',
            marginBottom: '1rem'
          }}>
            <ShieldCheck size={36} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Software Activation</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Enterprise Management System (EMS-PRO)
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
            alignItems: 'flex-start',
            gap: '0.75rem',
            fontSize: '0.9rem'
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Activation Failed</strong>
              <div>{error}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="licenceKeyInput" className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Enter 20-Character Licence Key</span>
              <span className="mono" style={{ color: isComplete ? 'var(--accent-emerald)' : 'var(--text-subtle)' }}>
                {formattedKey.length}/27
              </span>
            </label>
            
            <div style={{ position: 'relative' }}>
              <input
                id="licenceKeyInput"
                type="text"
                value={formattedKey}
                onChange={handleChange}
                placeholder="EMS-PRO-XXXX-XXXX-XXXX-XXXX"
                className="form-input licence-key-input"
                maxLength={27}
                autoComplete="off"
                spellCheck={false}
                style={{
                  width: '100%',
                  paddingLeft: '3rem',
                  letterSpacing: '0.12em'
                }}
              />
              <KeyRound
                size={20}
                color="var(--text-subtle)"
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!isComplete || activating}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.9rem',
              fontSize: '1rem',
              marginTop: '1rem'
            }}
          >
            {activating ? (
              <>
                <div className="animate-spin" style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%'
                }} />
                Activating Licence...
              </>
            ) : (
              <>
                Activate Software <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '2.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <HelpCircle size={16} />
          <span>Purchased a licence? Find your key in your invoice email.</span>
        </div>
      </div>
    </div>
  );
};
