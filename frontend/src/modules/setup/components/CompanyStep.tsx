import React from 'react';
import { useSetup } from '../hooks/useSetup';
import { Building, ArrowRight } from 'lucide-react';

export const CompanyStep: React.FC = () => {
  const { company, setCompany, setStep } = useSetup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('licence');
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
        }}>
          <Building size={28} color="#ffffff" />
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Company Profile</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Configure your primary organization and contact details.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Organization Name</label>
          <input
            type="text"
            required
            value={company.name}
            onChange={(e) => setCompany({ name: e.target.value })}
            className="form-input"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Company Code</label>
            <input
              type="text"
              required
              value={company.code}
              onChange={(e) => setCompany({ code: e.target.value.toUpperCase() })}
              className="form-input"
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Primary Contact Email</label>
            <input
              type="email"
              required
              value={company.email}
              onChange={(e) => setCompany({ email: e.target.value })}
              className="form-input"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '1.5rem' }}
        >
          Continue to Licence Configuration <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
};
