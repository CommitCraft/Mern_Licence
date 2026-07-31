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
    { title: 'Total Licences', value: metrics.totalLicences ?? '—', icon: FileCheck, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { title: 'Active Licences', value: metrics.activeLicences ?? '—', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Active Installations', value: metrics.activeInstallations ?? '—', icon: Laptop, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { title: 'Expiring in 30 Days', value: metrics.expiringIn30Days ?? '—', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Suspended Licences', value: metrics.suspendedLicences ?? '—', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { title: 'Revoked Licences', value: metrics.revokedLicences ?? '—', icon: Ban, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { title: 'Total Users', value: metrics.totalUsers ?? '—', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Total Customers', value: metrics.totalCustomers ?? '—', icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">System Dashboard</h1>
        <p className="text-xs text-slate-400 mt-1">Real-time overview of software licences, active installations, and administrative activity.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold text-white tracking-tight">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {sections.recentLicences && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-400" />
                Recent Licences
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 pb-2">
                    <th className="pb-2 font-semibold">Reference</th>
                    <th className="pb-2 font-semibold">Customer</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {sections.recentLicences.map((lic: any) => (
                    <tr key={lic.id} className="hover:bg-slate-800/30">
                      <td className="py-3 font-mono text-indigo-400 font-medium">{lic.licence_reference}</td>
                      <td className="py-3 text-slate-300">{lic.Customer?.company_name || '—'}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            lic.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : lic.status === 'SUSPENDED'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Expiring Licences (Next 30 Days)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 pb-2">
                    <th className="pb-2 font-semibold">Reference</th>
                    <th className="pb-2 font-semibold">Customer</th>
                    <th className="pb-2 font-semibold">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {sections.expiringLicences.map((lic: any) => (
                    <tr key={lic.id} className="hover:bg-slate-800/30">
                      <td className="py-3 font-mono text-amber-400 font-medium">{lic.licence_reference}</td>
                      <td className="py-3 text-slate-300">{lic.Customer?.company_name || '—'}</td>
                      <td className="py-3 text-slate-400">
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
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Recent Administrative Activity Logs
              </h2>
            </div>
            <div className="space-y-3">
              {sections.recentActivities.map((act: any) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-300">
                      {act.User?.username ? act.User.username.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">{act.description}</p>
                      <p className="text-[10px] text-slate-500">
                        Module: {act.module} • Action: {act.action}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">
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
