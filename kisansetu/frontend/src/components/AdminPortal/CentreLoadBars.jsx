import React from 'react';
import { Building2, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function CentreLoadBars({ centreLoads = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Mandi Capacity & Load Distribution</h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
          Real-time Capacity Balancing
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {centreLoads.map((c) => {
          const isCongested = c.load_percentage >= 85;
          const isModerate = c.load_percentage >= 50 && c.load_percentage < 85;

          return (
            <div 
              key={c.id} 
              className={`p-4 rounded-xl border transition-all ${
                isCongested 
                  ? 'bg-amber-50/50 border-amber-200' 
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-slate-900 text-xs truncate max-w-[140px]" title={c.name}>
                  {c.name.split('(')[0]}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isCongested 
                    ? 'bg-amber-100 text-amber-800' 
                    : isModerate
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {c.load_percentage}% Load
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden my-2">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCongested ? 'bg-amber-500' : isModerate ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${c.load_percentage}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                <span>Booked: <strong>{c.booked}</strong></span>
                <span>Cap: <strong>{c.capacity}</strong></span>
              </div>

              {isCongested && (
                <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center gap-1 text-[10px] text-amber-800 font-medium">
                  <AlertTriangle className="w-3 h-3 shrink-0 text-amber-600" />
                  <span>High traffic — divert incoming SMS to neighboring centres</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
