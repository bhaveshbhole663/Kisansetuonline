import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sprout, 
  Building2, 
  MessageSquare, 
  PhoneCall, 
  Network, 
  Globe, 
  CheckCircle2 
} from 'lucide-react';

export default function Header() {
  const { language, setLanguage, t, activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'farmer', label: t('nav_farmer'), icon: Sprout, color: 'text-emerald-600' },
    { id: 'admin', label: t('nav_admin'), icon: Building2, color: 'text-amber-600' },
    { id: 'sms', label: t('nav_sms'), icon: MessageSquare, color: 'text-blue-600' },
    { id: 'ivr', label: t('nav_ivr'), icon: PhoneCall, color: 'text-purple-600' },
    { id: 'arch', label: t('nav_arch'), icon: Network, color: 'text-indigo-600' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">KisanSetu</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Single Source of Truth
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {t('tagline')}
            </p>
          </div>
        </div>

        {/* System & Language Controls */}
        <div className="flex items-center gap-3">
          {/* Architecture Badge */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>FastAPI + PostgreSQL/SQLite Engine</span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Globe className="w-4 h-4 text-slate-500 ml-2 mr-1" />
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                language === 'hi' 
                  ? 'bg-white text-emerald-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('mr')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                language === 'mr' 
                  ? 'bg-white text-emerald-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              मराठी
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                language === 'en' 
                  ? 'bg-white text-emerald-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Persona & Channel Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto py-1 border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 py-2.5 px-3.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.id === 'sms' && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full font-bold">Keypad</span>
                )}
                {item.id === 'ivr' && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full font-bold">Voice DTMF</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
