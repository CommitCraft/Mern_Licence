import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Cpu, Shield, Settings, LogOut, Zap, Wrench } from 'lucide-react';
import { useLicence } from '../modules/licensing/hooks/useLicence';

export const AppLayout: React.FC = () => {
  const { valid, features, licence } = useLicence();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Machine Fleet', path: '/machines', icon: <Cpu size={20} />, requiredLicenceFeature: 'machineManagement' },
    { label: 'Preventive Maint.', path: '/maintenance', icon: <Wrench size={20} />, requiredLicenceFeature: 'preventiveMaintenance' },
    { label: 'Energy Monitor', path: '/energy', icon: <Zap size={20} />, requiredLicenceFeature: 'energyMonitoring' },
    { label: 'Licence Settings', path: '/settings/licence', icon: <Shield size={20} /> },
    { label: 'Licence Admin', path: '/admin/licences', icon: <Settings size={20} /> }
  ];

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={22} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', lineHeight: 1.2 }}>EMS-PRO</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Licensed Platform</p>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => {
            // Filter menu items by required licence feature (Phase 20)
            if (item.requiredLicenceFeature && !features[item.requiredLicenceFeature]) {
              return null;
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  background: isActive ? 'var(--primary-glow)' : 'transparent',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.2s ease'
                })}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Licence & User Footer */}
        <div style={{
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {valid && licence && (
            <div style={{
              background: 'var(--bg-input)',
              padding: '0.75rem',
              borderRadius: '10px',
              fontSize: '0.8rem'
            }}>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>{licence.companyName}</div>
              <div style={{ color: 'var(--accent-emerald)', fontSize: '0.75rem' }}>✓ Licence Active</div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
