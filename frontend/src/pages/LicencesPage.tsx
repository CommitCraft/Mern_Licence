import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  Clock,
  Ban,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  Key,
  Edit2,
} from 'lucide-react';

export const LicencesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');

  const [licences, setLicences] = useState<any[]>([]);

  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');


  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [keyOutputModalOpen, setKeyOutputModalOpen] = useState(false);

  const [selectedLicence, setSelectedLicence] = useState<any>(null);
  const [editingLicence, setEditingLicence] = useState<any>(null);
  const [createdKeyData, setCreatedKeyData] = useState<{ rawLicenceKey: string; warning: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedRowKey, setCopiedRowKey] = useState<string | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');

  const calculateExpiryDate = (type: string): string => {
    const date = new Date();
    if (type === 'TRIAL') {
      date.setDate(date.getDate() + 30);
      return date.toISOString().split('T')[0];
    }
    if (type === 'ANNUAL') {
      date.setFullYear(date.getFullYear() + 1);
      return date.toISOString().split('T')[0];
    }
    if (type === 'ENTERPRISE') {
      date.setFullYear(date.getFullYear() + 3);
      return date.toISOString().split('T')[0];
    }
    if (type === 'LIFETIME') {
      return '';
    }
    return '';
  };

  const [formData, setFormData] = useState({
    customerId: '',
    productCode: 'EMS',
    licenceType: 'ANNUAL',
    expiresAt: calculateExpiryDate('ANNUAL'),
    maxActivations: 1,
    offlineGraceDays: 7,
    maxUsers: 10,
    maxMachines: 5,
    notes: '',
  });

  const [editFormData, setEditFormData] = useState({
    productCode: 'EMS',
    licenceType: 'ANNUAL',
    expiresAt: '',
    maxActivations: 1,
    offlineGraceDays: 7,
    maxUsers: 10,
    maxMachines: 5,
    notes: '',
  });

  const handleLicenceTypeChange = (newType: string, isEdit = false) => {
    const autoExpiry = calculateExpiryDate(newType);
    if (isEdit) {
      setEditFormData((prev) => ({
        ...prev,
        licenceType: newType,
        expiresAt: autoExpiry,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        licenceType: newType,
        expiresAt: autoExpiry,
      }));
    }
  };

  const fetchLicences = async () => {
    try {
      setLoading(true);
      const url = statusParam ? `/admin/licences?status=${statusParam}` : '/admin/licences';
      const { data } = await api.get(url);
      if (data.success) {
        setLicences(data.licences);
      }
    } catch (err) {
      console.error('Failed to fetch licences:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/admin/customers');
      if (data.success) setCustomers(data.customers);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/admin/products');
      if (data.success) setProducts(data.products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  useEffect(() => {
    fetchLicences();
    fetchCustomers();
    fetchProducts();
  }, [statusParam]);



  const handleCreateLicence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/licences', formData);
      if (data.success) {
        setCreateModalOpen(false);
        setCreatedKeyData({
          rawLicenceKey: data.rawLicenceKey,
          warning: data.warning,
        });
        setKeyOutputModalOpen(true);
        fetchLicences();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate licence');
    }
  };

  const handleOpenEditModal = (licence: any) => {
    setEditingLicence(licence);
    const existingExpiry = licence.expires_at ? new Date(licence.expires_at).toISOString().split('T')[0] : '';
    setEditFormData({
      productCode: licence.product_code || 'EMS',
      licenceType: licence.licence_type || 'ANNUAL',
      expiresAt: existingExpiry,
      maxActivations: licence.max_activations || 1,
      offlineGraceDays: licence.offline_grace_days || 7,
      maxUsers: licence.max_users || 10,
      maxMachines: licence.max_machines || 5,
      notes: licence.notes || '',
    });
    setEditModalOpen(true);
  };

  const handleUpdateLicence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLicence) return;
    try {
      const { data } = await api.patch(`/admin/licences/${editingLicence.id}`, editFormData);
      if (data.success) {
        setEditModalOpen(false);
        fetchLicences();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update licence');
    }
  };

  const handleStatusChange = async (licenceId: number, status: string) => {
    if (!confirm(`Are you sure you want to change licence status to ${status}?`)) return;
    try {
      await api.patch(`/admin/licences/${licenceId}/status`, { status });
      fetchLicences();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update licence status');
    }
  };

  const handleExtendLicence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicence || !newExpiryDate) return;
    try {
      await api.post(`/admin/licences/${selectedLicence.id}/extend`, { newExpiresAt: newExpiryDate });
      setExtendModalOpen(false);
      fetchLicences();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to extend licence');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const copyRowKey = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRowKey(text);
    setTimeout(() => setCopiedRowKey(null), 2000);
  };

  const filtered = licences.filter(
    (l) =>
      l.licence_reference.toLowerCase().includes(search.toLowerCase()) ||
      l.Customer?.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Software Licence Administration</h1>
          <p className="text-xs text-gray-500 mt-1">Issue, edit, manage, suspend, revoke, and extend software licence keys.</p>
        </div>
        {hasPermission('CREATE_LICENCE') && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-3 rounded-lg shadow-lg shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Generate New Licence
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by reference or customer company..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/60 text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Licence Key / Reference</th>
                <th className="py-2.5 px-3.5">Customer</th>
                <th className="py-2.5 px-3.5">Product / Type</th>
                <th className="py-2.5 px-3.5">Activations</th>
                <th className="py-2.5 px-3.5">Created Date</th>
                <th className="py-2.5 px-3.5">Expires</th>
                <th className="py-2.5 px-3.5">Updated Date</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    Loading software licences...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    No software licences found.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-100 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono font-bold text-indigo-600">
                      <div className="flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{l.licence_reference}</span>
                        <button
                          onClick={() => copyRowKey(l.licence_reference)}
                          title="Copy Licence Reference"
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-800"
                        >
                          {copiedRowKey === l.licence_reference ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 font-medium text-gray-800">{l.Customer?.company_name || '—'}</td>
                    <td className="py-2.5 px-3.5 text-gray-700">
                      <span className="font-semibold text-gray-800">{l.product_code}</span> • {l.licence_type}
                    </td>
                    <td className="py-2.5 px-3.5 text-gray-700">
                      {l.LicenceActivations?.filter((a: any) => a.status === 'ACTIVE').length || 0} / {l.max_activations}
                    </td>
                    <td className="py-2.5 px-3.5 text-gray-700">
                      {new Date(l.issued_at || l.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5 text-gray-500">
                      {l.expires_at ? new Date(l.expires_at).toLocaleDateString() : 'Lifetime'}
                    </td>
                    <td className="py-2.5 px-3.5 text-gray-500">
                      {l.updated_at ? new Date(l.updated_at).toLocaleString() : '—'}
                    </td>

                    <td className="py-2.5 px-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : l.status === 'SUSPENDED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasPermission('UPDATE_LICENCE') && (
                          <button
                            onClick={() => handleOpenEditModal(l)}
                            title="Edit Licence Properties"
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/80 transition-all shadow-2xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('EXTEND_LICENCE') && (
                          <button
                            onClick={() => {
                              setSelectedLicence(l);
                              setExtendModalOpen(true);
                            }}
                            title="Extend Expiry Date"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/80 transition-all shadow-2xs"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('SUSPEND_LICENCE') && l.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleStatusChange(l.id, 'SUSPENDED')}
                            title="Suspend Licence"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200/80 transition-all shadow-2xs"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('SUSPEND_LICENCE') && l.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleStatusChange(l.id, 'ACTIVE')}
                            title="Reactivate Licence"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/80 transition-all shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('REVOKE_LICENCE') && l.status !== 'REVOKED' && (
                          <button
                            onClick={() => handleStatusChange(l.id, 'REVOKED')}
                            title="Revoke Licence (Permanent)"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 transition-all shadow-2xs"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE LICENCE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Generate Software Licence</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-500 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLicence} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-500 mb-1">Customer *</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  required
                >
                  <option value="">Select Customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.customer_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 mb-1">Product Code *</label>
                  <select
                    value={formData.productCode}
                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-mono"
                    required
                  >
                    {products.length === 0 ? (
                      <option value="EMS">EMS - Enterprise Suite</option>
                    ) : (
                      products.map((p) => (
                        <option key={p.id} value={p.product_code}>
                          {p.product_code} - {p.product_name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 mb-1">Licence Type *</label>
                  <select
                    value={formData.licenceType}
                    onChange={(e) => handleLicenceTypeChange(e.target.value, false)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-semibold"
                  >
                    <option value="ANNUAL">ANNUAL (+1 Year)</option>
                    <option value="TRIAL">TRIAL (+30 Days)</option>
                    <option value="ENTERPRISE">ENTERPRISE (+3 Years)</option>
                    <option value="LIFETIME">LIFETIME (No Expiration)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 mb-1">Max Activations</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxActivations}
                    onChange={(e) => setFormData({ ...formData, maxActivations: parseInt(e.target.value) || 1 })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Offline Grace Days</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.offlineGraceDays}
                    onChange={(e) => setFormData({ ...formData, offlineGraceDays: parseInt(e.target.value) || 7 })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Expiry Date (Auto-calculated from Licence Type)</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-200"
              >
                Generate Licence Key
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LICENCE MODAL */}
      {editModalOpen && editingLicence && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-600" />
                  Edit Software Licence
                </h3>
                <p className="text-xs text-indigo-600 font-mono mt-0.5">{editingLicence.licence_reference}</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-500 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLicence} className="space-y-4 text-xs">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700">
                Customer Company: <strong className="text-gray-900">{editingLicence.Customer?.company_name || 'N/A'}</strong>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 mb-1">Product Code *</label>
                  <select
                    value={editFormData.productCode}
                    onChange={(e) => setEditFormData({ ...editFormData, productCode: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-mono"
                    required
                  >
                    {products.length === 0 ? (
                      <option value="EMS">EMS - Enterprise Suite</option>
                    ) : (
                      products.map((p) => (
                        <option key={p.id} value={p.product_code}>
                          {p.product_code} - {p.product_name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 mb-1">Licence Type *</label>
                  <select
                    value={editFormData.licenceType}
                    onChange={(e) => handleLicenceTypeChange(e.target.value, true)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-semibold"
                  >
                    <option value="ANNUAL">ANNUAL (+1 Year)</option>
                    <option value="TRIAL">TRIAL (+30 Days)</option>
                    <option value="ENTERPRISE">ENTERPRISE (+3 Years)</option>
                    <option value="LIFETIME">LIFETIME (No Expiration)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 mb-1">Max Activations</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.maxActivations}
                    onChange={(e) => setEditFormData({ ...editFormData, maxActivations: parseInt(e.target.value) || 1 })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Offline Grace Days</label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.offlineGraceDays}
                    onChange={(e) => setEditFormData({ ...editFormData, offlineGraceDays: parseInt(e.target.value) || 7 })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={editFormData.expiresAt}
                  onChange={(e) => setEditFormData({ ...editFormData, expiresAt: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Notes / Internal Remarks</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-200"
              >
                Save Licence Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {keyOutputModalOpen && createdKeyData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-amber-500/50 rounded-xl max-w-lg w-full p-8 text-center space-y-6 shadow-lg">
            <div className="w-14 h-14 bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded-xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-lg">One-Time Licence Key Notice</h3>
              <p className="text-xs text-amber-600 mt-2 font-medium bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                {createdKeyData.warning}
              </p>
            </div>

            <div className="relative">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-indigo-600 font-mono text-lg font-extrabold tracking-wider select-all flex items-center justify-between">
                <span>{createdKeyData.rawLicenceKey}</span>
                <button
                  onClick={() => copyToClipboard(createdKeyData.rawLicenceKey)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 ml-2"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setKeyOutputModalOpen(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-xs"
            >
              I Have Saved This Licence Key Safely
            </button>
          </div>
        </div>
      )}

      {extendModalOpen && selectedLicence && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Extend Licence Expiration</h3>
              <button onClick={() => setExtendModalOpen(false)} className="text-gray-500 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExtendLicence} className="space-y-4 text-xs">
              <p className="text-gray-700">
                Licence Reference: <strong className="text-indigo-600 font-mono">{selectedLicence.licence_reference}</strong>
              </p>

              <div>
                <label className="block text-gray-500 mb-1">New Expiration Date *</label>
                <input
                  type="date"
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-200"
              >
                Update Expiration Date
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
