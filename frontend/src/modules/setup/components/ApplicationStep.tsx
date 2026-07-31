import React from 'react';
import { useSetup } from '../hooks/useSetup';
import { Globe, ArrowRight } from 'lucide-react';

export const ApplicationStep: React.FC = () => {
  const { application, setApplication, setStep } = useSetup();

  const timezones = [
    'Asia/Kolkata',
    'UTC',
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('company');
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
        }}>
          <Globe size={28} color="#ffffff" />
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Application Settings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Specify application branding, public URL, and server timezone.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Application Name</label>
          <input
            type="text"
            required
            value={application.name}
            onChange={(e) => setApplication({ name: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Application Public URL</label>
          <input
            type="url"
            required
            value={application.url}
            onChange={(e) => setApplication({ url: e.target.value })}
            className="form-input"
            placeholder="https://ems-pro.aploslogix.com"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Environment</label>
            <select
              value={application.environment}
              onChange={(e) => setApplication({ environment: e.target.value as 'production' | 'development' })}
              className="form-input"
            >
              <option value="production">Production (Recommended)</option>
              <option value="development">Development</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Default Timezone</label>
            <select
              value={application.timezone}
              onChange={(e) => setApplication({ timezone: e.target.value })}
              className="form-input"
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '1.5rem' }}
        >
          Continue to Company Details <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
};
