import React from 'react';
import { useSetup } from '../hooks/useSetup';
import { KeyRound, ArrowRight } from 'lucide-react';

export const LicenceStep: React.FC = () => {
  const { licence, setLicence, setStep } = useSetup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('administrator');
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
        }}>
          <KeyRound size={28} color="#ffffff" />
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Software Licence Configuration</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Configure central licence server communication and validation intervals.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Licence Server Endpoint</label>
          <input
            type="text"
            required
            value={licence.serverUrl}
            onChange={(e) => setLicence({ serverUrl: e.target.value })}
            className="form-input"
            placeholder="local or https://licence.example.com/api"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Product Code</label>
          <input
            type="text"
            required
            value={licence.productCode}
            onChange={(e) => setLicence({ productCode: e.target.value.toUpperCase() })}
            className="form-input"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Online Check Interval (Hours)</label>
            <input
              type="number"
              min={1}
              max={168}
              value={licence.validationIntervalHours}
              onChange={(e) => setLicence({ validationIntervalHours: parseInt(e.target.value, 10) || 24 })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Offline Grace Period (Days)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={licence.offlineGraceDays}
              onChange={(e) => setLicence({ offlineGraceDays: parseInt(e.target.value, 10) || 7 })}
              className="form-input"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '1.5rem' }}
        >
          Continue to Super Administrator Setup <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
};
