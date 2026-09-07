import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import LiveQueueTable from './LiveQueueTable';
import CentreLoadBars from './CentreLoadBars';
import ProcurementWorkflowModal from './ProcurementWorkflowModal';
import WalkInModal from './WalkInModal';
import { 
  Users, 
  CalendarCheck, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Hourglass, 
  RefreshCw,
  UserPlus,
  Building2,
  CreditCard
} from 'lucide-react';

export default function AdminDashboard() {
  const { refreshKey, triggerRefresh } = useApp();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [centreLoads, setCentreLoads] = useState([]);
  const [centres, setCentres] = useState([]);
  const [selectedCentreId, setSelectedCentreId] = useState('');
  
  // Modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [refreshKey, selectedCentreId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [queueRes, analyticsRes, centresRes] = await Promise.all([
        api.getLiveQueue(selectedCentreId || null),
        api.getAnalyticsSummary(),
        api.getCentres()
      ]);

      if (queueRes.success) {
        setQueue(queueRes.queue || []);
        setMetrics(queueRes.metrics || {});
      }
      if (analyticsRes.success) {
        setCentreLoads(analyticsRes.centre_loads || []);
      }
      if (centresRes.success) {
        setCentres(centresRes.centres || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenManage = (item) => {
    setSelectedItem(item);
    setIsWorkflowModalOpen(true);
  };

  const statCards = [
    { title: 'Registered Farmers', value: metrics.registered_farmers || 284, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Today Booked', value: metrics.total_bookings || queue.length || 24, icon: CalendarCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Arrived at Gate', value: metrics.arrived || 18, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Weighed & Passed', value: metrics.weighed || 14, icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50' },
    { title: 'DBT Paid', value: metrics.paid || 10, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Waiting in Mandi', value: metrics.waiting || 4, icon: Hourglass, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Avg Wait Time', value: '24 min', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-xl font-bold text-slate-900">APMC Mandi Operations Console</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time queue orchestration across Web appointments, Keypad SMS, and Voice IVR
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Centre Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Building2 className="w-4 h-4 text-slate-500" />
            <select
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              className="text-xs bg-transparent border-none focus:outline-hidden font-semibold text-slate-800"
            >
              <option value="">All Mandi Centres</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>{c.name.split('(')[0]}</option>
              ))}
            </select>
          </div>

          {/* Add Walk-In Button */}
          <button
            onClick={() => setIsWalkInModalOpen(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Walk-In</span>
          </button>

          {/* Refresh */}
          <button
            onClick={loadDashboardData}
            title="Refresh Live Queue"
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {statCards.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={i} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 leading-tight">
                  {st.title}
                </span>
                <div className={`w-7 h-7 rounded-lg ${st.bg} ${st.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl font-black text-slate-900 mt-2">
                {st.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Centre Load Bars */}
      <CentreLoadBars centreLoads={centreLoads} />

      {/* Live Queue Table */}
      <LiveQueueTable 
        queue={queue}
        onSelectFarmer={handleOpenManage}
      />

      {/* Procurement Workflow Modal */}
      <ProcurementWorkflowModal
        item={selectedItem}
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        onUpdated={loadDashboardData}
      />

      {/* Walk-in Farmer Modal */}
      <WalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        centres={centres}
        onWalkInCreated={loadDashboardData}
      />

    </div>
  );
}
