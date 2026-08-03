import React, { useEffect, useState } from 'react';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  Search,
  Shield,
  KeyRound,
  Ban,
  CheckCircle2,
  Trash2,
  X,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [users, setUsers] = useState<any[]>([]);

  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [resetPasswordOutput, setResetPasswordOutput] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    roleId: '',
    password: '',
    status: 'ACTIVE',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/users');
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data } = await api.get('/admin/roles');
      if (data.success) {
        setRoles(data.roles);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);


  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/users', formData);
      if (data.success) {
        setModalOpen(false);
        setFormData({
          fullName: '',
          username: '',
          email: '',
          phone: '',
          roleId: '',
          password: '',
          status: 'ACTIVE',
        });
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user account');
    }
  };

  const handleToggleStatus = async (user: any, newStatus: string) => {
    try {
      await api.patch(`/admin/users/${user.id}/status`, { status: newStatus });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (user: any) => {
    try {
      const { data } = await api.post(`/admin/users/${user.id}/reset-password`, {});
      if (data.success) {
        setSelectedUser(user);
        setResetPasswordOutput(data.temporaryPassword);
        setResetModalOpen(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Are you sure you want to soft delete administrator account '${user.username}'?`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-xs text-gray-500 mt-1">Manage system administrators, roles, active sessions, and security statuses.</p>
        </div>
        {hasPermission('CREATE_USER') && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-3 rounded-lg shadow-lg shadow-indigo-200 transition-all duration-200"
          >
            <UserPlus className="w-4 h-4" />
            Add Administrator
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username, or email..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/60 text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">User</th>
                <th className="py-2.5 px-3.5">Role</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5">Last Login</th>
                <th className="py-2.5 px-3.5">Created Date</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No administrator accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-100 transition-colors">
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-600 font-bold flex items-center justify-center text-xs">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{u.full_name}</p>
                          <p className="text-[10px] text-gray-500">@{u.username} • {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium border border-gray-300">
                        <Shield className="w-3 h-3 text-indigo-600" />
                        {u.Roles?.[0]?.name || 'No Role'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : u.status === 'SUSPENDED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-gray-500">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-2.5 px-3.5 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasPermission('MANAGE_USER_STATUS') && (
                          <button
                            onClick={() => handleToggleStatus(u, u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                            title={u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                            className={`p-1.5 rounded-lg border transition-all shadow-2xs ${
                              u.status === 'ACTIVE'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200/80'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200/80'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        {hasPermission('RESET_USER_PASSWORD') && (
                          <button
                            onClick={() => handleResetPassword(u)}
                            title="Reset Password"
                            className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200/80 transition-all shadow-2xs"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('DELETE_USER') && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Soft Delete User"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 transition-all shadow-2xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Add New Administrator</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-500 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 mb-1">Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Role *</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  required
                >
                  <option value="">Select a Role...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Defaults to TempPassword123!"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-200"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {resetModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-6 text-center space-y-4">
            <KeyRound className="w-10 h-10 text-indigo-600 mx-auto" />
            <h3 className="font-bold text-gray-900 text-base">Password Reset Completed</h3>
            <p className="text-xs text-gray-500">
              The password for user <strong>{selectedUser?.username}</strong> has been reset.
            </p>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-indigo-600 font-mono text-sm font-bold select-all">
              {resetPasswordOutput}
            </div>

            <button
              onClick={() => setResetModalOpen(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
