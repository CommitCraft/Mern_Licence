import React, { useEffect, useState } from 'react';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Plus,
  X,
  Search,
  Check,
  Minus,
  Settings2,
  Trash2,
  Table as TableIcon,
  Grid,
} from 'lucide-react';

export const RolesPage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [roles, setRoles] = useState<any[]>([]);
  const [permissionsByModule, setPermissionsByModule] = useState<Record<string, any[]>>({});
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'roles' | 'matrix'>('roles');

  const [newRoleData, setNewRoleData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const fetchData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/admin/roles'),
        api.get('/admin/permissions'),
      ]);

      if (rolesRes.data.success) setRoles(rolesRes.data.roles);
      if (permsRes.data.success) {
        setPermissionsByModule(permsRes.data.byModule || {});
        setAllPermissions(permsRes.data.all || []);
      }
    } catch (err) {
      console.error('Failed to load role and permission data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAssignModal = (role: any) => {
    setEditingRole(role);
    const existingIds = role.Permissions?.map((p: any) => p.id) || [];
    setSelectedPermissions(existingIds);
    setModalOpen(true);
  };

  const handleTogglePermission = (id: number) => {
    if (selectedPermissions.includes(id)) {
      setSelectedPermissions(selectedPermissions.filter((pId) => pId !== id));
    } else {
      setSelectedPermissions([...selectedPermissions, id]);
    }
  };

  const handleSelectModulePermissions = (moduleName: string) => {
    const modulePermIds = permissionsByModule[moduleName]?.map((p) => p.id) || [];
    const newSet = new Set([...selectedPermissions, ...modulePermIds]);
    setSelectedPermissions(Array.from(newSet));
  };

  const handleClearModulePermissions = (moduleName: string) => {
    const modulePermIds = permissionsByModule[moduleName]?.map((p) => p.id) || [];
    setSelectedPermissions(selectedPermissions.filter((id) => !modulePermIds.includes(id)));
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;
    try {
      await api.put(`/admin/roles/${editingRole.id}/permissions`, {
        permissionIds: selectedPermissions,
      });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save permissions');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/roles', newRoleData);
      setCreateModalOpen(false);
      setNewRoleData({ name: '', code: '', description: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create role');
    }
  };

  const handleDeleteRole = async (role: any) => {
    if (role.is_system_role) {
      alert('System roles cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to delete custom role '${role.name}'?`)) return;
    try {
      await api.delete(`/admin/roles/${role.id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" />
            Roles & Permissions Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">Configure role-based access control (RBAC) and system permission matrices.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'roles'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Roles Table
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Permission Matrix
            </button>
          </div>

          {hasPermission('CREATE_ROLE') && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Custom Role
            </button>
          )}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by role name or code..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {activeTab === 'roles' ? (
        /* ROLES DATA TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Role Name & Code</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Permissions Count</th>
                  <th className="py-3.5 px-4">Granted Permissions</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No roles found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => {
                    const grantedCount = role.Permissions?.length || 0;
                    const totalCount = allPermissions.length || 1;
                    const percentage = Math.round((grantedCount / totalCount) * 100);

                    return (
                      <tr key={role.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                              <Shield className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-100">{role.name}</p>
                              <p className="text-[10px] font-mono text-indigo-400">{role.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {role.is_system_role ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              System Role
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              Custom Role
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                          {role.description || 'No description provided.'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-slate-200">
                                {grantedCount} / {allPermissions.length}
                              </span>
                              <span className="text-slate-400 text-[10px]">{percentage}%</span>
                            </div>
                            <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {role.Permissions?.slice(0, 3).map((p: any) => (
                              <span
                                key={p.id}
                                className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono border border-slate-700/60"
                              >
                                {p.code}
                              </span>
                            ))}
                            {role.Permissions?.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-indigo-400 font-bold">
                                +{role.Permissions.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasPermission('ASSIGN_PERMISSIONS') && (
                              <button
                                onClick={() => handleOpenAssignModal(role)}
                                title="Configure Permissions"
                                className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-colors"
                              >
                                <Settings2 className="w-4 h-4" />
                              </button>
                            )}
                            {!role.is_system_role && hasPermission('DELETE_ROLE') && (
                              <button
                                onClick={() => handleDeleteRole(role)}
                                title="Delete Role"
                                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* PERMISSION MATRIX TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-4 sticky left-0 bg-slate-950/90 border-r border-slate-800 z-10 w-72">
                    Module / Permission Code
                  </th>
                  {filteredRoles.map((role) => (
                    <th key={role.id} className="py-4 px-4 text-center border-r border-slate-800/60 min-w-[120px]">
                      <div className="font-bold text-slate-200">{role.name}</div>
                      <div className="text-[10px] font-mono text-indigo-400 normal-case">{role.code}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                  <React.Fragment key={moduleName}>
                    <tr className="bg-slate-950/40">
                      <td
                        colSpan={filteredRoles.length + 1}
                        className="py-2.5 px-4 font-bold text-indigo-400 text-[11px] uppercase tracking-wider border-y border-slate-800/80"
                      >
                        {moduleName} Module ({perms.length} Permissions)
                      </td>
                    </tr>
                    {perms.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 sticky left-0 bg-slate-900 border-r border-slate-800 z-10">
                          <p className="font-semibold text-slate-200">{p.name}</p>
                          <p className="text-[10px] font-mono text-indigo-400">{p.code}</p>
                        </td>
                        {filteredRoles.map((role) => {
                          const hasPerm = role.Permissions?.some((rp: any) => rp.id === p.id);
                          return (
                            <td key={role.id} className="py-3 px-4 text-center border-r border-slate-800/40">
                              {hasPerm ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800/50 text-slate-600">
                                  <Minus className="w-3 h-3" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIGURE PERMISSIONS MODAL */}
      {modalOpen && editingRole && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  Configure Permissions for {editingRole.name} ({editingRole.code})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select permissions by module to grant access to this role.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                <div key={moduleName} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <span className="font-bold text-xs text-indigo-400 uppercase tracking-wider">
                      {moduleName} Module
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleSelectModulePermissions(moduleName)}
                        className="text-indigo-400 hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-slate-600">•</span>
                      <button
                        type="button"
                        onClick={() => handleClearModulePermissions(moduleName)}
                        className="text-slate-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {perms.map((p) => {
                      const checked = selectedPermissions.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? 'bg-indigo-600/10 border-indigo-500/40 text-slate-200'
                              : 'bg-slate-900 border-slate-800/60 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleTogglePermission(p.id)}
                            className="mt-0.5 rounded border-slate-700 bg-slate-950 text-indigo-600 w-4 h-4"
                          />
                          <div>
                            <p className="font-semibold text-xs text-slate-200">{p.name}</p>
                            <p className="text-[10px] font-mono text-indigo-400/80">{p.code}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{p.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900">
              <span className="text-xs text-slate-400">
                {selectedPermissions.length} permission(s) selected
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Save Permission Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM ROLE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base">Add Custom Role</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Role Name *</label>
                <input
                  type="text"
                  value={newRoleData.name}
                  onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
                  placeholder="e.g. Regional Licence Manager"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Role Code *</label>
                <input
                  type="text"
                  value={newRoleData.code}
                  onChange={(e) => setNewRoleData({ ...newRoleData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. REGIONAL_ADMIN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  value={newRoleData.description}
                  onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-600/30"
              >
                Create Role
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
