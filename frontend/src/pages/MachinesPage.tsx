import React from 'react';
import { FeatureGuard } from '../modules/licensing/components/FeatureGuard';
import { Cpu, CheckCircle, AlertTriangle } from 'lucide-react';

export const MachinesPage: React.FC = () => {
  const sampleMachines = [
    { id: 'M-01', name: 'CNC Milling Center Alpha', status: 'RUNNING', efficiency: '98.5%', temperature: '42°C' },
    { id: 'M-02', name: 'Hydraulic Stamping Press 04', status: 'MAINTENANCE', efficiency: '85.0%', temperature: '58°C' },
    { id: 'M-03', name: 'Robotic Welding Arm B2', status: 'RUNNING', efficiency: '99.1%', temperature: '39°C' },
    { id: 'M-04', name: 'Laser Cutting System 09', status: 'RUNNING', efficiency: '96.4%', temperature: '45°C' }
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Machine Fleet Management</h1>
        <p className="page-subtitle">Monitor and control industrial assets bound by your active licence.</p>
      </div>

      <FeatureGuard feature="machineManagement" showFallbackMessage>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {sampleMachines.map((m) => (
            <div key={m.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Cpu size={24} color="var(--primary-500)" />
                  <div>
                    <h3 style={{ fontSize: '1.1rem' }}>{m.name}</h3>
                    <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>{m.id}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <span>Status:</span>
                {m.status === 'RUNNING' ? (
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle size={14} /> RUNNING
                  </span>
                ) : (
                  <span style={{ color: 'var(--accent-amber)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertTriangle size={14} /> MAINTENANCE
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </FeatureGuard>
    </div>
  );
};
