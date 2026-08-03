import React, { useEffect, useState } from 'react';
import { api } from '../config/api';
import {
  Users,
  FileCheck,
  Laptop,
  Building2,
  Clock,
  AlertTriangle,
  Ban,
  Activity,
  TrendingUp,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>({});
  const [sections, setSections] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data } = await api.get('/admin/dashboard');
        if (data.success) {
          setMetrics(data.metrics || {});
          setSections(data.sections || {});
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Licences', value: metrics.totalLicences ?? '—', icon: FileCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { title: 'Active Licences', value: metrics.activeLicences ?? '—', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { title: 'Active Installations', value: metrics.activeInstallations ?? '—', icon: Laptop, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
    { title: 'Expiring in 30 Days', value: metrics.expiringIn30Days ?? '—', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { title: 'Suspended Licences', value: metrics.suspendedLicences ?? '—', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { title: 'Revoked Licences', value: metrics.revokedLicences ?? '—', icon: Ban, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    { title: 'Total Users', value: metrics.totalUsers ?? '—', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { title: 'Total Customers', value: metrics.totalCustomers ?? '—', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">System Dashboard</h1>
        <p className="text-xs text-gray-500 mt-1">Real-time overview of software licences, active installations, and administrative activity.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.bg} ${card.color} border ${card.border}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold text-gray-900 tracking-tight">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {sections.recentLicences && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-500" />
                Recent Licences
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-semibold">Reference</th>
                    <th className="pb-2 font-semibold">Customer</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sections.recentLicences.map((lic: any) => (
                    <tr key={lic.id} className="hover:bg-gray-50">
                      <td className="py-3 font-mono text-indigo-600 font-medium">{lic.licence_reference}</td>
                      <td className="py-3 text-gray-700">{lic.Customer?.company_name || '—'}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            lic.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : lic.status === 'SUSPENDED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {lic.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {sections.expiringLicences && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Expiring Licences (Next 30 Days)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-semibold">Reference</th>
                    <th className="pb-2 font-semibold">Customer</th>
                    <th className="pb-2 font-semibold">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sections.expiringLicences.map((lic: any) => (
                    <tr key={lic.id} className="hover:bg-gray-50">
                      <td className="py-3 font-mono text-amber-600 font-medium">{lic.licence_reference}</td>
                      <td className="py-3 text-gray-700">{lic.Customer?.company_name || '—'}</td>
                      <td className="py-3 text-gray-500">
                        {lic.expires_at ? new Date(lic.expires_at).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {sections.recentActivities && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                Recent Administrative Activity Logs
              </h2>
            </div>
            <div className="space-y-3">
              {sections.recentActivities.map((act: any) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-[10px] text-indigo-700">
                      {act.User?.username ? act.User.username.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{act.description}</p>
                      <p className="text-[10px] text-gray-400">
                        Module: {act.module} • Action: {act.action}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(act.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
