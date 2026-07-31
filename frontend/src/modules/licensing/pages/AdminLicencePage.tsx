import React, { useState, useEffect } from 'react';
import { Plus, Search, Shield, Ban, CheckCircle, AlertOctagon, Copy, X } from 'lucide-react';
import { licenceApi } from '../services/licenceApi';
import { AdminLicenceItem } from '../types/licence.types';

export const AdminLicencePage: React.FC = () => {
  const [licences, setLicences] = useState<AdminLicenceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newLicenceKey, setNewLicenceKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    companyName: '',
    productCode: 'EMS',
    licenceType: 'ANNUAL',
    maxActivations: 3,
    machineManagement: true,
    preventiveMaintenance: true,
    energyMonitoring: false,
    maxUsers: 20,
    maxMachines: 50
  });

  const loadLicences = async () => {
    setLoading(true);
    try {
      const data = await licenceApi.getAdminLicences();
      setLicences(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicences();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      companyName: formData.companyName,
      productCode: formData.productCode,
      licenceType: formData.licenceType,
      maxActivations: formData.maxActivations,
      features: {
        machineManagement: formData.machineManagement,
        preventiveMaintenance: formData.preventiveMaintenance,
        energyMonitoring: formData.energyMonitoring,
        maxUsers: formData.maxUsers,
        maxMachines: formData.maxMachines
      }
    };

    const res = await licenceApi.createAdminLicence(payload);
    if (res.success && res.licence?.plainLicenceKey) {
      setNewLicenceKey(res.licence.plainLicenceKey as string);
      loadLicences();
    } else {
      alert(res.message);
    }
  };

  const handleAction = async (id: number, action: 'activate' | 'suspend' | 'revoke') => {
    if (action === 'revoke' && !window.confirm('Are you sure you want to REVOKE this licence permanently?')) {
      return;
    }
    const success = await licenceApi.updateAdminLicenceStatus(id, action);
    if (success) {
      loadLicences();
    }
  };

  const filteredLicences = licences.filter(item => {
    const matchesSearch = item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.licence_reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === '' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Licence Server Administration</h1>
          <p className="page-subtitle">Issue, suspend, revoke, and inspect central software activation licences.</p>
        </div>

        <button
          onClick={() => { setNewLicenceKey(null); setShowCreateModal(true); }}
          className="btn btn-primary"
        >
          <Plus size={18} /> Issue New Licence
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} color="var(--text-subtle)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by customer, company, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ width: '100%', paddingLeft: '2.75rem' }}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="form-input"
          style={{ width: '180px' }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="EXPIRED">EXPIRED</option>
          <option value="REVOKED">REVOKED</option>
        </select>
      </div>

      {/* Licences Table */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>Reference</th>
              <th style={{ padding: '1rem' }}>Organization & Customer</th>
              <th style={{ padding: '1rem' }}>Type</th>
              <th style={{ padding: '1rem' }}>Activations</th>
              <th style={{ padding: '1rem' }}>Expiry Date</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading central licence records...
                </td>
              </tr>
            ) : filteredLicences.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No licence records found matching criteria.
                </td>
              </tr>
            ) : (
              filteredLicences.map((licence) => (
                <tr key={licence.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }} className="mono">{licence.licence_reference}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{licence.company_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{licence.customer_name} ({licence.customer_email})</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge badge-active">{licence.licence_type}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <strong>{licence.max_activations}</strong> MAX
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {licence.expires_at ? new Date(licence.expires_at).toLocaleDateString() : 'LIFETIME'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge badge-${licence.status.toLowerCase()}`}>
                      {licence.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      {licence.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleAction(licence.id, 'suspend')}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          title="Suspend Licence"
                        >
                          <Ban size={14} color="var(--accent-amber)" /> Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(licence.id, 'activate')}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          title="Reactivate Licence"
                        >
                          <CheckCircle size={14} color="var(--accent-emerald)" /> Activate
                        </button>
                      )}

                      {licence.status !== 'REVOKED' && (
                        <button
                          onClick={() => handleAction(licence.id, 'revoke')}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--accent-rose)' }}
                          title="Revoke Permanently"
                        >
                          <AlertOctagon size={14} /> Revoke
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

      {/* Create Licence Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }}>
          <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '2rem', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Issue Software Licence</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ padding: '0.4rem' }}>
                <X size={20} />
              </button>
            </div>

            {newLicenceKey ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <Shield size={48} color="var(--accent-emerald)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Licence Issued Successfully</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Below is the generated plain licence key. <strong>It will be displayed only ONCE.</strong> Save it securely now!
                </p>

                <div style={{
                  background: 'var(--bg-input)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--accent-emerald)',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '0.1em', color: '#ffffff' }}>
                    {newLicenceKey}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(newLicenceKey)}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    <Copy size={16} /> Copy
                  </button>
                </div>

                <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ width: '100%' }}>
                  Done & Close Modal
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Customer Name</label>
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Customer Email</label>
                    <input
                      type="email"
                      required
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Licence Type</label>
                    <select
                      value={formData.licenceType}
                      onChange={(e) => setFormData({ ...formData, licenceType: e.target.value })}
                      className="form-input"
                    >
                      <option value="TRIAL">TRIAL (30 Days)</option>
                      <option value="ANNUAL">ANNUAL (1 Year)</option>
                      <option value="LIFETIME">LIFETIME (Perpetual)</option>
                      <option value="ENTERPRISE">ENTERPRISE (Custom)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Activations</label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={formData.maxActivations}
                      onChange={(e) => setFormData({ ...formData, maxActivations: parseInt(e.target.value, 10) })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Feature Toggles</label>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.machineManagement}
                        onChange={(e) => setFormData({ ...formData, machineManagement: e.target.checked })}
                      />
                      Machine Management
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.preventiveMaintenance}
                        onChange={(e) => setFormData({ ...formData, preventiveMaintenance: e.target.checked })}
                      />
                      Preventive Maintenance
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.energyMonitoring}
                        onChange={(e) => setFormData({ ...formData, energyMonitoring: e.target.checked })}
                      />
                      Energy Monitoring
                    </label>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                  Generate & Save Licence Key
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
