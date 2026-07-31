import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../config/api';
import { KeyRound, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirm password do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long' });
      return;
    }

    setSubmitting(true);
    setPasswordMsg(null);

    try {
      const { data } = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (data.success) {
        setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update password' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to revoke all other active sessions?')) return;
    try {
      await api.post('/auth/revoke-all-sessions');
      alert('All other active sessions have been revoked.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to revoke sessions');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">My Profile & Security</h1>
        <p className="text-xs text-slate-400 mt-1">Manage your account details, change password, and control active sessions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xl mx-auto mb-3">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            <h2 className="text-base font-bold text-slate-100">{user?.fullName}</h2>
            <p className="text-xs text-slate-400">@{user?.username}</p>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block">Email Address</span>
              <span className="font-semibold text-slate-200">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Assigned Roles</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {user?.roles?.map((r) => (
                  <span key={r} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold text-[10px]">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            Change Password
          </h2>

          {passwordMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Current Password *</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-600/30"
              >
                {submitting ? 'Updating...' : 'Update Password'}
              </button>

              <button
                type="button"
                onClick={handleRevokeAllSessions}
                className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300"
              >
                <LogOut className="w-3.5 h-3.5" />
                Revoke All Other Sessions
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
