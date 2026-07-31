import React from 'react';
import { SetupStepId } from '../types/setup.types';
import { Shield, Key, Database, Globe, Building, KeyRound, UserCheck, CheckCircle2 } from 'lucide-react';

interface SetupProgressProps {
  currentStep: SetupStepId;
}

export const SetupProgress: React.FC<SetupProgressProps> = ({ currentStep }) => {
  const steps: { id: SetupStepId; label: string; icon: React.ReactNode }[] = [
    { id: 'token', label: 'Token', icon: <Key size={16} /> },
    { id: 'requirements', label: 'Check', icon: <Shield size={16} /> },
    { id: 'database', label: 'Database', icon: <Database size={16} /> },
    { id: 'application', label: 'App', icon: <Globe size={16} /> },
    { id: 'company', label: 'Company', icon: <Building size={16} /> },
    { id: 'licence', label: 'Licence', icon: <KeyRound size={16} /> },
    { id: 'administrator', label: 'Admin', icon: <UserCheck size={16} /> },
    { id: 'review', label: 'Review', icon: <CheckCircle2 size={16} /> }
  ];

  const getStepIndex = (stepId: SetupStepId): number => {
    if (stepId === 'welcome') return 0;
    if (stepId === 'installing' || stepId === 'completed') return steps.length;
    const idx = steps.findIndex(s => s.id === stepId);
    return idx >= 0 ? idx : 0;
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDone
                  ? 'var(--accent-emerald)'
                  : isCurrent
                  ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))'
                  : 'var(--bg-input)',
                color: isDone || isCurrent ? '#ffffff' : 'var(--text-subtle)',
                border: isCurrent ? '2px solid #ffffff' : '1px solid var(--border-color)',
                boxShadow: isCurrent ? '0 0 12px var(--primary-glow)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {isDone ? <CheckCircle2 size={18} /> : step.icon}
              </div>
              <span style={{
                fontSize: '0.75rem',
                marginTop: '0.4rem',
                color: isCurrent ? '#ffffff' : isDone ? 'var(--text-muted)' : 'var(--text-subtle)',
                fontWeight: isCurrent ? 600 : 400
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
