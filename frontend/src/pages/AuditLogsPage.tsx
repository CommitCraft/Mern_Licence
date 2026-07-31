import React, { useEffect, useState } from 'react';
import { api } from '../config/api';

export const AuditLogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'activity' | 'licence'>('activity');
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [licenceLogs, setLicenceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const [actRes, licRes] = await Promise.all([
        api.get('/admin/activity-logs'),
        api.get('/admin/audit-logs'),
      ]);
      if (actRes.data.success) setActivityLogs(actRes.data.logs);
      if (licRes.data.success) setLicenceLogs(licRes.data.logs);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Audit & Activity Logs</h1>
        <p className="text-xs text-slate-400 mt-1">Immutable security event records, user activity trails, and licence lifecycle audits.</p>
      </div>

      <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 transition-colors ${
            activeTab === 'activity' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Administrative Activity Logs
        </button>
        <button
          onClick={() => setActiveTab('licence')}
          className={`pb-3 transition-colors ${
            activeTab === 'licence' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Licence Lifecycle Audit Logs
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {activeTab === 'activity' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Module / Action</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      Loading activity logs...
                    </td>
                  </tr>
                ) : activityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No activity log entries found.
                    </td>
                  </tr>
                ) : (
                  activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-semibold text-slate-200">{log.User?.username || 'System'}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-mono text-[10px]">
                          {log.module} • {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{log.description}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{log.ip_address || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Licence Reference</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      Loading licence audit logs...
                    </td>
                  </tr>
                ) : licenceLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No licence audit entries found.
                    </td>
                  </tr>
                ) : (
                  licenceLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                        {log.Licence?.licence_reference || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{log.description}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{log.ip_address || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
