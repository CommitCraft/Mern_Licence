import React, { useEffect, useState } from 'react';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Search, Monitor } from 'lucide-react';

export const ActivationsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [activations, setActivations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');

  const fetchActivations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/activations');
      if (data.success) {
        setActivations(data.activations);
      }
    } catch (err) {
      console.error('Failed to fetch activations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivations();
  }, []);

  const handleDeactivate = async (id: number) => {
    if (!confirm('Are you sure you want to remote-deactivate this device installation?')) return;
    try {
      await api.post(`/admin/activations/${id}/deactivate`, {});
      fetchActivations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to deactivate installation');
    }
  };

  const filtered = activations.filter(
    (a) =>
      a.installation_id.toLowerCase().includes(search.toLowerCase()) ||
      a.hostname?.toLowerCase().includes(search.toLowerCase()) ||
      a.Licence?.licence_reference.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Activation Management</h1>
        <p className="text-xs text-gray-500 mt-1">Monitor active software device installations, machine fingerprints, and remote deactivations.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by installation ID, hostname, or licence reference..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Installation ID</th>
                <th className="py-2.5 px-3.5">Licence Reference</th>
                <th className="py-2.5 px-3.5">Hostname / OS</th>
                <th className="py-2.5 px-3.5">Activated At</th>
                <th className="py-2.5 px-3.5">Last Validation</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    Loading device activations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No active device installations found.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono font-bold text-gray-800">{a.installation_id}</td>
                    <td className="py-2.5 px-3.5 font-mono text-indigo-600">{a.Licence?.licence_reference || '—'}</td>
                    <td className="py-2.5 px-3.5 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {a.hostname || 'Unknown Machine'} ({a.operating_system || 'N/A'})
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-gray-500">{new Date(a.activated_at).toLocaleString()}</td>
                    <td className="py-2.5 px-3.5 text-gray-500">{new Date(a.last_validated_at).toLocaleString()}</td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          a.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      {hasPermission('DEACTIVATE_INSTALLATION') && a.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleDeactivate(a.id)}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
