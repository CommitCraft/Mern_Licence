import React, { useEffect, useState } from 'react';
import { api } from '../config/api';
import { Shield, Building2, Save, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    COMPANY_NAME: '',
    PRODUCT_NAME: '',
    PRODUCT_CODE: '',
    PASSWORD_MIN_LENGTH: '8',
    MAX_FAILED_LOGIN_ATTEMPTS: '5',
    ACCOUNT_LOCKOUT_MINUTES: '15',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data } = await api.get('/admin/settings');
        if (data.success && data.keyValue) {
          setSettings((prev) => ({ ...prev, ...data.keyValue }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await api.patch('/admin/settings', { settings });
      if (data.success) {
        setMessage('Application settings saved successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Application Settings</h1>
        <p className="text-xs text-slate-400 mt-1">Configure company branding, product defaults, and password security policies.</p>
      </div>

      {message && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building2 className="w-4 h-4 text-indigo-400" />
            Company & Product Identity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Company Name</label>
              <input
                type="text"
                value={settings.COMPANY_NAME || ''}
                onChange={(e) => setSettings({ ...settings, COMPANY_NAME: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Product Name</label>
              <input
                type="text"
                value={settings.PRODUCT_NAME || ''}
                onChange={(e) => setSettings({ ...settings, PRODUCT_NAME: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Default Product Code</label>
              <input
                type="text"
                value={settings.PRODUCT_CODE || ''}
                onChange={(e) => setSettings({ ...settings, PRODUCT_CODE: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-purple-400" />
            Security & Account Lockout Policy
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Min Password Length</label>
              <input
                type="number"
                min="6"
                value={settings.PASSWORD_MIN_LENGTH || '8'}
                onChange={(e) => setSettings({ ...settings, PASSWORD_MIN_LENGTH: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Max Failed Attempts</label>
              <input
                type="number"
                min="3"
                value={settings.MAX_FAILED_LOGIN_ATTEMPTS || '5'}
                onChange={(e) => setSettings({ ...settings, MAX_FAILED_LOGIN_ATTEMPTS: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Lockout Duration (Minutes)</label>
              <input
                type="number"
                min="5"
                value={settings.ACCOUNT_LOCKOUT_MINUTES || '15'}
                onChange={(e) => setSettings({ ...settings, ACCOUNT_LOCKOUT_MINUTES: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3 px-6 rounded-xl shadow-lg shadow-indigo-600/30"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Settings...' : 'Save Application Settings'}</span>
        </button>
      </form>
    </div>
  );
};
