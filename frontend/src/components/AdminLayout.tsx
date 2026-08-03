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
    <div className="min-h-screen bg-gray-50 text-gray-900 flex font-sans antialiased">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-56 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out shadow-sm ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-gray-900">
                SaralLicence
              </span>
              <span className="block text-[9px] text-indigo-600 font-semibold uppercase tracking-wider">
                Enterprise Admin
              </span>
            </div>
          </div>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-2 custom-scrollbar">
          {menuGroups.map((group, idx) => {
            const visibleItems = group.items.filter(
              (item) => !item.permission || hasPermission(item.permission)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-0.5">
                <div className="px-2.5 py-0.5 text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
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
                      className={`flex items-center gap-2.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                        active
                          ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80 shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:pl-56">
        <header className="h-14 bg-white border-b border-gray-200 sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-2 rounded-lg bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav className="hidden sm:flex items-center text-xs text-gray-500 font-medium space-x-2">
              <Link to="/dashboard" className="hover:text-gray-700">
                Portal
              </Link>
              {pathSnippets.map((snippet, idx) => (
                <React.Fragment key={idx}>
                  <span>/</span>
                  <span className="text-gray-800 capitalize">
                    {breadcrumbNameMap[snippet] || snippet}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
              />
            </div>

            <button className="relative p-2 rounded-lg bg-gray-100 text-gray-500 hover:text-gray-700 border border-gray-200">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors"
              >
                <span>{user?.username}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 text-xs"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-semibold text-gray-800">{user?.fullName}</p>
                    <p className="text-[10px] text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <User className="w-3.5 h-3.5" />
                    My Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
