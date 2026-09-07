import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Network, 
  Smartphone, 
  PhoneCall, 
  Globe, 
  Server, 
  Database, 
  Layers, 
  ArrowDown, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Bell,
  Building2,
  CreditCard,
  UserPlus
} from 'lucide-react';

export default function SystemArchitectureViewer() {
  const { systemEvents } = useApp();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Title & Core Principle Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">KisanSetu Unified System Architecture</h2>
            <p className="text-xs text-slate-500">
              Four Doorways, Single Source of Truth — Designed for Smart India Hackathon (SIH)
            </p>
          </div>
        </div>

        <div className="mt-4 p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
          <strong>The Core Architectural Principle:</strong> Regardless of whether a farmer books using a 4G smartphone (Web Portal), a 2G keypad phone (SMS state-machine), a landline/mobile voice call (IVR DTMF menu), or arrives in person (Walk-in Exception), the request hits <strong>ONE FastAPI Gateway</strong>, writes to <strong>ONE Database</strong>, and populates <strong>ONE Centralized APMC Queue</strong>.
        </div>
      </div>

      {/* Visual Interactive Architecture Diagram */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        
        {/* Layer 1: Multi-Channel Entry Points */}
        <div className="text-center mb-6">
          <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase">
            LAYER 1 — FARMER ACCESS CHANNELS
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
            
            <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl text-center hover:border-emerald-500 transition-colors">
              <Globe className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <h4 className="font-bold text-sm">Web Portal</h4>
              <p className="text-[11px] text-slate-400 mt-1">Smartphones & CSCs (React + Tailwind)</p>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl text-center hover:border-blue-500 transition-colors">
              <Smartphone className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <h4 className="font-bold text-sm">SMS Gateway</h4>
              <p className="text-[11px] text-slate-400 mt-1">Keypad 2G Phones (State Machine)</p>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl text-center hover:border-purple-500 transition-colors">
              <PhoneCall className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <h4 className="font-bold text-sm">Voice IVR</h4>
              <p className="text-[11px] text-slate-400 mt-1">Toll-Free DTMF Helpline (Audio Prompts)</p>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl text-center hover:border-amber-500 transition-colors">
              <UserPlus className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <h4 className="font-bold text-sm">Walk-in Gate</h4>
              <p className="text-[11px] text-slate-400 mt-1">Physical APMC Spot Admissions</p>
            </div>

          </div>
        </div>

        {/* Down Arrow / Gateway Connector */}
        <div className="flex justify-center my-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 animate-bounce">
            <ArrowDown className="w-4 h-4" />
          </div>
        </div>

        {/* Layer 2: Centralized API Gateway */}
        <div className="bg-slate-800/80 border border-emerald-500/40 rounded-2xl p-5 mb-6 text-center">
          <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase">
            LAYER 2 — SINGLE FASTAPI BACKEND & ORCHESTRATION ENGINE
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
              <span className="font-bold text-slate-200">Slot Engine</span>
              <p className="text-[10px] text-slate-400">Scoped Token PUN-DDMM-XXX</p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
              <span className="font-bold text-slate-200">Queue Engine</span>
              <p className="text-[10px] text-slate-400">Real-time Gate Dispatch</p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
              <span className="font-bold text-slate-200">Procurement</span>
              <p className="text-[10px] text-slate-400">8-Stage Lifecycle Tracker</p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
              <span className="font-bold text-slate-200">AI Grounding Layer</span>
              <p className="text-[10px] text-slate-400">Zero Hallucination DB Queries</p>
            </div>
          </div>
        </div>

        {/* Down Arrow / Database Connector */}
        <div className="flex justify-center my-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400">
            <ArrowDown className="w-4 h-4" />
          </div>
        </div>

        {/* Layer 3: Unified Relational Database */}
        <div className="bg-gradient-to-r from-teal-950 to-slate-900 border border-teal-500/50 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono tracking-widest text-teal-400 uppercase">
              LAYER 3 — UNIFIED POSTGRESQL / SQLITE DATABASE
            </span>
            <span className="text-[10px] bg-teal-900/80 text-teal-300 px-2 py-0.5 rounded-md font-mono">
              9 Relational Entities
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[11px] font-mono text-slate-300">
            <div className="p-2 bg-slate-900/90 rounded-lg border border-teal-800/50">users</div>
            <div className="p-2 bg-slate-900/90 rounded-lg border border-teal-800/50">farmers</div>
            <div className="p-2 bg-slate-900/90 rounded-lg border border-teal-800/50">centres</div>
            <div className="p-2 bg-slate-900/90 rounded-lg border border-teal-800/50">slots</div>
            <div className="p-2 bg-slate-900/90 rounded-lg border border-teal-800/50">bookings</div>
            <div className="p-2 bg-slate-900/90 rounded-lg border border-teal-800/50">payments</div>
          </div>
        </div>

        {/* Down Arrow / Outputs Connector */}
        <div className="flex justify-center my-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
            <ArrowDown className="w-4 h-4" />
          </div>
        </div>

        {/* Layer 4: Admin Dashboard & Outbound Alerts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-800/90 border border-amber-500/40 p-4 rounded-2xl flex items-center gap-3">
            <Building2 className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-100">APMC Admin Dashboard</h4>
              <p className="text-[11px] text-slate-400">Operator controls, weighbridge, quality assay, DBT credit</p>
            </div>
          </div>

          <div className="bg-slate-800/90 border border-blue-500/40 p-4 rounded-2xl flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-100">Notification Service</h4>
              <p className="text-[11px] text-slate-400">Automated SMS dispatch, IVR confirmation, Timeline updates</p>
            </div>
          </div>
        </div>

      </div>

      {/* Live Transaction Event Log */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Live System Event Bus (Multi-Channel Trace)</h3>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
            {systemEvents.length} Events Logged
          </span>
        </div>

        <div className="space-y-2">
          {systemEvents.map((ev) => (
            <div 
              key={ev.id}
              className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${ev.badge}`}>
                  {ev.channel}
                </span>
                <span className="text-slate-800 font-medium">{ev.message}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{ev.timestamp}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
