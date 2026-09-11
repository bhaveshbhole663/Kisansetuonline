import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  Building2, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  LogIn, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Landmark,
  Scale,
  Users
} from 'lucide-react';

export default function AdminLogin() {
  const { t, loginAdmin, triggerRefresh } = useApp();
  const [adminId, setAdminId] = useState('9999999999');
  const [pin, setPin] = useState('admin123');
  const [centre, setCentre] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e) => {
    e?.preventDefault();
    setError('');

    if (!adminId.trim()) {
      setError('Please enter Mandi Official ID or Phone');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login(adminId.trim(), 'ADMIN', pin.trim());
      if (res.success && res.user) {
        const adminProfile = {
          ...res.user,
          centre_id: parseInt(centre) || 1,
          centre_name: centre === '2' ? 'Baramati Krishi Kendra' : centre === '3' ? 'Daund Market Yard' : centre === '4' ? 'Nashik APMC Sub-Yard' : 'Pune Central Grain Mandi (Hadapsar)'
        };
        loginAdmin(adminProfile);
        triggerRefresh('ADMIN', `APMC Officer ${adminProfile.name} entered live console`);
      } else {
        setError('Authentication failed. Check credentials.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAccess = () => {
    setAdminId('9999999999');
    setPin('admin123');
    setCentre('1');
    handleAdminLogin();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Official Header */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold tracking-wide uppercase border border-amber-200 shadow-xs">
          <Landmark className="w-3.5 h-3.5 text-amber-700" />
          <span>APMC Central Mandi Administration</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('auth_admin_title')}
        </h2>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          {t('auth_admin_subtitle')}
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Top Official Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Official Authorization Portal
              </div>
              <div className="text-lg font-bold text-white">
                Mandi Gate, Quality Assayer & Weighbridge Access
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickDemoAccess}
            className="shrink-0 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>{t('demo_admin')}</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {t('admin_id')} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="9999999999 / admin"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {t('admin_pin')} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="admin123 / 1234"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Assigned Procurement Centre *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <select
                  value={centre}
                  onChange={(e) => setCentre(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                >
                  <option value="1">Pune Central Grain Mandi (Hadapsar APMC)</option>
                  <option value="2">Baramati Krishi Kendra (MIDC APMC)</option>
                  <option value="3">Daund Market Yard (Station Road APMC)</option>
                  <option value="4">Nashik APMC Sub-Yard (Panchavati)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-amber-400 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer border border-amber-500/30"
              >
                {loading ? (
                  <span className="animate-pulse">Authenticating Mandi Credentials...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-amber-400" />
                    <span>{t('admin_login_btn')}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">Pre-set Admin Credentials: </span>
                <span>ID: <code className="bg-white px-1.5 py-0.5 rounded border font-bold">9999999999</code> or <code className="bg-white px-1.5 py-0.5 rounded border font-bold">admin</code> | PIN: <code className="bg-white px-1.5 py-0.5 rounded border font-bold">admin123</code></span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoAccess}
              className="text-amber-700 font-bold hover:underline shrink-0"
            >
              Fill & Login
            </button>
          </div>

        </div>

        {/* Footer Security Badge */}
        <div className="bg-slate-100 px-6 sm:px-8 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-slate-400" />
            <span>APMC Act & Essential Commodities Compliance Protocol Active</span>
          </div>
          <div className="font-mono text-slate-400">
            TLS 1.3 • AES-256 Auth
          </div>
        </div>

      </div>

    </div>
  );
}
