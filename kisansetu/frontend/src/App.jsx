import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import FarmerDashboard from './components/FarmerPortal/FarmerDashboard';
import FarmerLogin from './components/FarmerPortal/FarmerLogin';
import AdminDashboard from './components/AdminPortal/AdminDashboard';
import AdminLogin from './components/AdminPortal/AdminLogin';
import SMSPhoneSimulator from './components/Simulators/SMSPhoneSimulator';
import IVRPhoneSimulator from './components/Simulators/IVRPhoneSimulator';
import SystemArchitectureViewer from './components/SystemArchitectureViewer';

function MainContent() {
  const { activeTab, setActiveTab, isFarmerAuthenticated, isAdminAuthenticated } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 pb-12">
        {activeTab === 'farmer' && (
          isFarmerAuthenticated ? <FarmerDashboard /> : <FarmerLogin />
        )}
        {activeTab === 'admin' && (
          isAdminAuthenticated ? <AdminDashboard /> : <AdminLogin />
        )}
        {activeTab === 'sms' && <SMSPhoneSimulator />}
        {activeTab === 'ivr' && <IVRPhoneSimulator />}
        {activeTab === 'arch' && <SystemArchitectureViewer />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">KisanSetu</span>
            <span>—</span>
            <span>Multi-Channel Farmer Procurement System</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
            <button onClick={() => setActiveTab('farmer')} className="hover:text-emerald-700">Farmer Web</button>
            <button onClick={() => setActiveTab('admin')} className="hover:text-amber-700">Admin Console</button>
            <button onClick={() => setActiveTab('sms')} className="hover:text-blue-700">SMS Channel</button>
            <button onClick={() => setActiveTab('ivr')} className="hover:text-purple-700">IVR Voice</button>
            <button onClick={() => setActiveTab('arch')} className="hover:text-indigo-700">Architecture</button>
          </div>

          <div className="text-[11px] text-slate-400">
            One Backend • One Database • One Live Queue
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
