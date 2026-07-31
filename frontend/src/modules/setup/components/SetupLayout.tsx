import React, { ReactNode } from 'react';
import { Shield } from 'lucide-react';
import { SetupProgress } from './SetupProgress';
import { useSetup } from '../hooks/useSetup';

export const SetupLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentStep } = useSetup();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'var(--bg-dark)'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '640px',
        width: '100%',
        padding: '2.5rem',
        borderRadius: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={22} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-family-heading)' }}>
            EMS-PRO Installation Wizard
          </span>
        </div>

        {currentStep !== 'completed' && currentStep !== 'installing' && (
          <SetupProgress currentStep={currentStep} />
        )}

        {children}
      </div>
    </div>
  );
};
