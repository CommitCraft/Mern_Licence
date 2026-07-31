import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FirstTimeSetupGuard } from './components/FirstTimeSetupGuard';
import { PublicRoute } from './components/PublicRoute';
import { AuthGuard } from './components/AuthGuard';
import { PermissionGuard } from './components/PermissionGuard';
import { AdminLayout } from './components/AdminLayout';

import { FirstTimeSetupPage } from './pages/FirstTimeSetupPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { CustomersPage } from './pages/CustomersPage';
import { LicencesPage } from './pages/LicencesPage';
import { ActivationsPage } from './pages/ActivationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProductsPage } from './pages/ProductsPage';


export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* First-Time Application Setup (Disabled once admin exists) */}
          <Route element={<FirstTimeSetupGuard />}>
            <Route path="/first-time-setup" element={<FirstTimeSetupPage />} />
          </Route>

          {/* Public Authentication Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Protected Administrator Routes */}
          <Route element={<AuthGuard />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              <Route
                path="/users"
                element={
                  <PermissionGuard permission="VIEW_USERS">
                    <UsersPage />
                  </PermissionGuard>
                }
              />

              <Route
                path="/roles"
                element={
                  <PermissionGuard permission="VIEW_ROLES">
                    <RolesPage />
                  </PermissionGuard>
                }
              />

              <Route
                path="/customers"
                element={
                  <PermissionGuard permission="VIEW_CUSTOMERS">
                    <CustomersPage />
                  </PermissionGuard>
                }
              />

              <Route
                path="/licences"
                element={
                  <PermissionGuard permission="VIEW_LICENCES">
                    <LicencesPage />
                  </PermissionGuard>
                }
              />

              <Route
                path="/activations"
                element={
                  <PermissionGuard permission="VIEW_ACTIVATIONS">
                    <ActivationsPage />
                  </PermissionGuard>
                }
              />

              <Route
                path="/audit-logs"
                element={
                  <PermissionGuard permission="VIEW_AUDIT_LOGS">
                    <AuditLogsPage />
                  </PermissionGuard>
                }
              />

              <Route
                path="/settings"
                element={
                  <PermissionGuard permission="MANAGE_SETTINGS">
                    <SettingsPage />
                  </PermissionGuard>
                }
              />

              <Route path="/products" element={<ProductsPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
