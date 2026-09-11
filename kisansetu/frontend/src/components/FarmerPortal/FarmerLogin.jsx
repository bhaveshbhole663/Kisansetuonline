import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  Sprout, 
  Smartphone, 
  KeyRound, 
  UserPlus, 
  LogIn, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  Phone,
  Building,
  MapPin,
  HelpCircle
} from 'lucide-react';

export default function FarmerLogin() {
  const { t, language, setLanguage, loginFarmer, triggerRefresh } = useApp();
  const [activeMode, setActiveMode] = useState('login'); // 'login' or 'register'
  
  // Login form state
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regVillage, setRegVillage] = useState('Hadapsar');
  const [regDistrict, setRegDistrict] = useState('Pune');
  const [regLang, setRegLang] = useState(language || 'hi');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const demoFarmers = [
    { name: 'Ramesh Jadhav', phone: '9876543210', village: 'Hadapsar', district: 'Pune', crop: 'Wheat', badge: 'KID-4091-MH' },
    { name: 'Suresh Patil', phone: '9823456789', village: 'Baramati Rural', district: 'Pune', crop: 'Soybean', badge: 'KID-5102-MH' },
    { name: 'Mahesh Shinde', phone: '9812345678', village: 'Daund Gaon', district: 'Pune', crop: 'Gram', badge: 'KID-6203-MH' }
  ];

  const handleSendOtp = (e) => {
    e?.preventDefault();
    setLoginError('');
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setLoginError(t('enter_mobile'));
      return;
    }
    setOtpSent(true);
    setOtp('1234'); // Pre-fill demo OTP for delightful UX
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setLoginError('');
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setLoginError(t('enter_mobile'));
      return;
    }
    if (!otp) {
      setLoginError(t('enter_otp'));
      return;
    }

    try {
      setLoginLoading(true);
      const res = await api.login(cleanPhone, 'FARMER');
      if (res.success && res.farmer) {
        loginFarmer(res.farmer);
        triggerRefresh('WEB', `Farmer ${res.farmer.name} logged into Web Portal`);
      } else {
        setLoginError('Login failed. Please check mobile number.');
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demo) => {
    setLoginLoading(true);
    setPhone(demo.phone);
    setLoginError('');
    try {
      const res = await api.login(demo.phone, 'FARMER');
      if (res.success && res.farmer) {
        loginFarmer(res.farmer);
        triggerRefresh('WEB', `Demo Farmer ${demo.name} logged in`);
      }
    } catch (err) {
      setLoginError(err.message || 'Demo login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    const cleanMobile = regMobile.replace(/\D/g, '');
    if (!regName.trim()) {
      setRegError('Please enter your full name');
      return;
    }
    if (cleanMobile.length < 10) {
      setRegError('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setRegLoading(true);
      const res = await api.registerFarmer({
        name: regName.trim(),
        mobile: cleanMobile,
        village: regVillage.trim(),
        district: regDistrict.trim(),
        preferred_language: regLang
      });

      if (res.success && res.farmer) {
        loginFarmer(res.farmer);
        triggerRefresh('WEB', `New Farmer registered: ${res.farmer.name} (${res.farmer.identity_reference})`);
      } else {
        setRegError('Registration could not be completed');
      }
    } catch (err) {
      setRegError(err.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Welcome Card */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
          <Sprout className="w-4 h-4 text-emerald-600" />
          <span>{t('auth_farmer_title')}</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('appName')} — {t('nav_farmer')}
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          {t('auth_farmer_subtitle')}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl max-w-md mx-auto mb-6">
        <button
          onClick={() => { setActiveMode('login'); setLoginError(''); }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeMode === 'login'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>{t('existing_farmer_login')}</span>
        </button>
        <button
          onClick={() => { setActiveMode('register'); setRegError(''); }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeMode === 'register'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('register_new_farmer')}</span>
        </button>
      </div>

      {/* Main Form Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left / Primary Login Box */}
        <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {activeMode === 'login' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <span>{t('existing_farmer_login')}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered mobile number to receive or verify your OTP
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{loginError}</span>
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      {t('mobile_number')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm font-bold">
                        +91
                      </div>
                      <input
                        type="tel"
                        maxLength="10"
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>{t('send_otp')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {/* OTP Sent Alert */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>OTP sent to <strong>+91 {phone}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-emerald-700 font-bold underline hover:text-emerald-900"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {t('enter_otp')}
                      </label>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {t('simulated_otp_hint')}
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        maxLength="6"
                        placeholder="1234"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-xl tracking-widest font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {loginLoading ? (
                      <span className="animate-pulse">Verifying...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        <span>{t('verify_otp')}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtp('1234')}
                    className="w-full py-1 text-center text-xs text-slate-500 hover:text-emerald-700 font-medium"
                  >
                    ⚡ Auto-fill Demo OTP (1234)
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Registration Mode */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  <span>{t('register_new_farmer')}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Create your unified KisanSetu identity for Web, SMS and IVR
                </p>
              </div>

              {regError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{regError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t('full_name')} *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vikram More"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t('mobile_number')} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs font-bold">
                    +91
                  </div>
                  <input
                    type="tel"
                    maxLength="10"
                    placeholder="98XXXXXXXX"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('village')}
                  </label>
                  <input
                    type="text"
                    value={regVillage}
                    onChange={(e) => setRegVillage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('district')}
                  </label>
                  <select
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value="Pune">Pune</option>
                    <option value="Nashik">Nashik</option>
                    <option value="Ahmednagar">Ahmednagar</option>
                    <option value="Satara">Satara</option>
                    <option value="Solapur">Solapur</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t('preferred_language')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'hi', label: 'हिन्दी' },
                    { code: 'mr', label: 'मराठी' },
                    { code: 'en', label: 'English' }
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setRegLang(item.code)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                        regLang === item.code
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {regLoading ? 'Registering...' : t('register_and_enter')}
              </button>
            </form>
          )}
        </div>

        {/* Right / Demo Profiles & Omnichannel Callout */}
        <div className="md:col-span-5 space-y-4">
          
          {/* Quick Demo Profile Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-md border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Hackathon Demo Mode
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                1-Click Sign-in
              </span>
            </div>

            <h4 className="text-base font-bold text-white mb-2">
              {t('demo_farmers')}
            </h4>
            <p className="text-xs text-slate-300 mb-4">
              Select any pre-configured farmer profile to explore active bookings, timeline tracking, and live MSP status:
            </p>

            <div className="space-y-2.5">
              {demoFarmers.map((demo) => (
                <button
                  key={demo.phone}
                  onClick={() => handleQuickDemoLogin(demo)}
                  disabled={loginLoading}
                  className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/40 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {demo.name}
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.2 rounded">
                        {demo.badge}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {demo.village}, {demo.district} • {demo.phone}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* Omnichannel Assurance Notice */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-5 text-emerald-900 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <Phone className="w-4 h-4 text-emerald-700" />
              <span>No Smartphone Required on Field</span>
            </div>
            <p className="text-emerald-800 leading-relaxed">
              Once registered, farmers can access their same account and book mandi slots via <strong>Keypad SMS (56161)</strong> or <strong>Toll-Free Voice IVR (1800-KISAN)</strong>.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
