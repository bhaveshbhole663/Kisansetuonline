import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Scale, 
  ShieldCheck, 
  CreditCard, 
  XCircle,
  Truck
} from 'lucide-react';

export default function StatusTimeline({ currentStatus = 'SLOT_BOOKED', timelineHistory = [] }) {
  const { t } = useApp();

  const stages = [
    { key: 'REGISTERED', label: t('stages.REGISTERED'), icon: Circle },
    { key: 'SLOT_BOOKED', label: t('stages.SLOT_BOOKED'), icon: Clock },
    { key: 'ARRIVED', label: t('stages.ARRIVED'), icon: Truck },
    { key: 'QUALITY_CHECK', label: t('stages.QUALITY_CHECK'), icon: ShieldCheck },
    { key: 'WEIGHED', label: t('stages.WEIGHED'), icon: Scale },
    { key: 'ACCEPTED', label: t('stages.ACCEPTED'), icon: CheckCircle2 },
    { key: 'PAYMENT_PROCESSING', label: t('stages.PAYMENT_PROCESSING'), icon: Clock },
    { key: 'PAID', label: t('stages.PAID'), icon: CreditCard },
  ];

  const stageOrder = [
    'REGISTERED',
    'SLOT_BOOKED',
    'ARRIVED',
    'QUALITY_CHECK',
    'WEIGHED',
    'ACCEPTED',
    'PAYMENT_PROCESSING',
    'PAID'
  ];

  const currentIndex = stageOrder.indexOf(currentStatus);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">{t('status_timeline')}</h3>
          <p className="text-xs text-slate-500">{t('timeline_subtitle')}</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
          Live Status: {currentStatus.replace('_', ' ')}
        </span>
      </div>

      {/* Horizontal / Stepper View */}
      <div className="relative my-6 hidden md:block">
        <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-100 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-4 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, (currentIndex / (stages.length - 1)) * 100))}%` }}
        />

        <div className="relative z-10 flex justify-between">
          {stages.map((st, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            const Icon = st.icon;

            return (
              <div key={st.key} className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isCurrent 
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-110 shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[11px] mt-2 font-medium max-w-[80px] text-center ${
                  isCurrent 
                    ? 'text-emerald-700 font-bold'
                    : isCompleted 
                    ? 'text-slate-800' 
                    : 'text-slate-400'
                }`}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vertical View for Mobile */}
      <div className="md:hidden space-y-3 my-3">
        {stages.map((st, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = st.icon;

          return (
            <div key={st.key} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                isCurrent 
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-100'
                  : isCompleted
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className={`text-xs ${isCurrent ? 'font-bold text-emerald-700' : isCompleted ? 'font-medium text-slate-800' : 'text-slate-400'}`}>
                {st.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* History log entries */}
      {timelineHistory && timelineHistory.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-700 mb-2">Gate Inspection History:</p>
          <div className="space-y-2">
            {timelineHistory.map((item, i) => (
              <div key={i} className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex items-start justify-between">
                <div>
                  <span className="font-semibold text-slate-800">{item.new_status}</span>
                  <p className="text-slate-600 mt-0.5">{item.remarks}</p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                  {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
