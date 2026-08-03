import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ permission, permissions, children }) => {
  const { hasPermission, hasAnyPermission } = useAuth();

  let isAllowed = true;
  if (permission) {
    isAllowed = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    isAllowed = hasAnyPermission(permissions);
  }

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-600 mb-2">403 - Access Denied</h1>
        <p className="text-gray-600 max-w-md mb-6">
          You do not have the required permissions to view this module. Please contact your system administrator if you require access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
