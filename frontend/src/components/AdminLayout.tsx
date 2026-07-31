import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Shield,
  Building2,
  FileCheck,
  Clock,
  AlertTriangle,
  Ban,
  Laptop,
  FileText,
  Settings,
  User,
  Package,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search,
} from 'lucide-react';


interface MenuItem {
  title: string;
  path: string;
  icon: React.ElementType;
  permission?: string;
}

interface MenuGroup {
  groupName: string;
  items: MenuItem[];
}

export const AdminLayout: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuGroups: MenuGroup[] = [
    {
      groupName: 'Main',
      items: [
        { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'VIEW_DASHBOARD' },
      ],
    },
    {
      groupName: 'User Management',
      items: [
        { title: 'User Management', path: '/users', icon: Users, permission: 'VIEW_USERS' },
        { title: 'Roles & Permissions', path: '/roles', icon: Shield, permission: 'VIEW_ROLES' },
      ],
    },
    {
      groupName: 'Customer Management',
      items: [
        { title: 'Customer Directory', path: '/customers', icon: Building2, permission: 'VIEW_CUSTOMERS' },
      ],
    },
    {
      groupName: 'Product Management',
      items: [
        { title: 'Software Products', path: '/products', icon: Package },
      ],
    },
    {
      groupName: 'Licence Management',

      items: [
        { title: 'All Licences', path: '/licences', icon: FileCheck, permission: 'VIEW_LICENCES' },
        { title: 'Expiring Licences', path: '/licences?status=EXPIRING', icon: Clock, permission: 'VIEW_LICENCES' },
        { title: 'Suspended Licences', path: '/licences?status=SUSPENDED', icon: AlertTriangle, permission: 'VIEW_LICENCES' },
        { title: 'Revoked Licences', path: '/licences?status=REVOKED', icon: Ban, permission: 'VIEW_LICENCES' },
      ],
    },

    {
      groupName: 'Activation Management',
      items: [
        { title: 'Active Installations', path: '/activations', icon: Laptop, permission: 'VIEW_ACTIVATIONS' },
      ],
    },
    {
      groupName: 'Reports & Audits',
      items: [
        { title: 'Audit Logs', path: '/audit-logs', icon: FileText, permission: 'VIEW_AUDIT_LOGS' },
      ],
    },

  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentFullPath = location.pathname + location.search;

  const isMenuItemActive = (itemPath: string) => {
    if (itemPath.includes('?')) {
      return currentFullPath === itemPath;
    }
    return location.pathname === itemPath && location.search === '';
  };

  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const breadcrumbNameMap: Record<string, string> = {
    dashboard: 'Dashboard',
    users: 'User Management',
    roles: 'Roles & Permissions',
    customers: 'Customer Directory',
    products: 'Product Management',
    licences: 'Licence Management',

    activations: 'Activation Management',
    'audit-logs': 'Audit & Activity Logs',
    settings: 'Application Settings',
    profile: 'My Profile',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                SaralLicence
              </span>
              <span className="block text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                Enterprise Admin
              </span>
            </div>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar">
          {menuGroups.map((group, idx) => {
            const visibleItems = group.items.filter(
              (item) => !item.permission || hasPermission(item.permission)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <div className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {group.groupName}
                </div>
                {visibleItems.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const active = isMenuItemActive(item.path);

                  return (
                    <Link
                      key={itemIdx}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 border border-slate-800 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.roles?.[0] || 'Administrator'}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800/50"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav className="hidden sm:flex items-center text-xs text-slate-400 font-medium space-x-2">
              <Link to="/dashboard" className="hover:text-slate-200">
                Portal
              </Link>
              {pathSnippets.map((snippet, idx) => (
                <React.Fragment key={idx}>
                  <span>/</span>
                  <span className="text-slate-200 capitalize">
                    {breadcrumbNameMap[snippet] || snippet}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button className="relative p-2 rounded-lg bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-slate-800">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
              >
                <span>{user?.username}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50 text-xs"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="font-semibold text-slate-200">{user?.fullName}</p>
                    <p className="text-[10px] text-slate-400">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <User className="w-3.5 h-3.5" />
                    My Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-slate-800/80"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
