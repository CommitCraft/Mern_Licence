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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Audit & Activity Logs</h1>
        <p className="text-xs text-gray-500 mt-1">Immutable security event records, user activity trails, and licence lifecycle audits.</p>
      </div>

      <div className="flex border-b border-gray-200 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 transition-colors ${
            activeTab === 'activity' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Administrative Activity Logs
        </button>
        <button
          onClick={() => setActiveTab('licence')}
          className={`pb-3 transition-colors ${
            activeTab === 'licence' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Licence Lifecycle Audit Logs
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {activeTab === 'activity' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">User</th>
                  <th className="py-2.5 px-3.5">Module / Action</th>
                  <th className="py-2.5 px-3.5">Description</th>
                  <th className="py-2.5 px-3.5">IP Address</th>
                  <th className="py-2.5 px-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      Loading activity logs...
                    </td>
                  </tr>
                ) : activityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      No activity log entries found.
                    </td>
                  </tr>
                ) : (
                  activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3.5 font-semibold text-gray-800">{log.User?.username || 'System'}</td>
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] border border-indigo-100">
                          {log.module} • {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-gray-700">{log.description}</td>
                      <td className="py-2.5 px-3.5 text-gray-500 font-mono">{log.ip_address || '—'}</td>
                      <td className="py-2.5 px-3.5 text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Licence Reference</th>
                  <th className="py-2.5 px-3.5">Action</th>
                  <th className="py-2.5 px-3.5">Description</th>
                  <th className="py-2.5 px-3.5">IP Address</th>
                  <th className="py-2.5 px-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      Loading licence audit logs...
                    </td>
                  </tr>
                ) : licenceLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      No licence audit entries found.
                    </td>
                  </tr>
                ) : (
                  licenceLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3.5 font-mono font-bold text-indigo-600">
                        {log.Licence?.licence_reference || '—'}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[10px] border border-gray-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-gray-700">{log.description}</td>
                      <td className="py-2.5 px-3.5 text-gray-500 font-mono">{log.ip_address || '—'}</td>
                      <td className="py-2.5 px-3.5 text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
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
