import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Landmark, 
  FileText,
  ShieldCheck
} from 'lucide-react';

export default function PaymentTracker({ paymentData, crop = 'Wheat', quantity = 42 }) {
  const { t } = useApp();

  const status = paymentData?.payment_status || 'PENDING';
  const amount = paymentData?.amount || 96600;
  const refId = paymentData?.transaction_reference || 'PFMS-DEMO-82932';
  const paymentDate = paymentData?.payment_date || new Date().toISOString().split('T')[0];

  const isPaid = status === 'PAID';
  const isProcessing = status === 'PROCESSING';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{t('dbt_details')}</h3>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              PFMS Simulated Gateway Integration (SIH Prototype)
            </p>
          </div>
        </div>

        <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
          isPaid 
            ? 'bg-emerald-100 text-emerald-800'
            : isProcessing
            ? 'bg-amber-100 text-amber-800'
            : 'bg-slate-100 text-slate-700'
        }`}>
          {isPaid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
          <span>{status}</span>
        </span>
      </div>

      {/* Credit Summary Card */}
      <div className="p-4 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white shadow-md mb-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-300 uppercase tracking-wider">{t('payment_amount')}</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
              ₹{Number(amount).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md text-slate-200">
              MSP Assured Price
            </span>
            <p className="text-xs text-slate-300 mt-1">{crop}: {quantity} Quintals</p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap justify-between items-center text-xs text-slate-300 gap-2">
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Bank: State Bank of India (••• 4091)</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Aadhaar-Linked DBT</span>
          </div>
        </div>
      </div>

      {/* Transaction Details Table */}
      <div className="bg-slate-50 rounded-xl p-3.5 text-xs space-y-2 border border-slate-200/80">
        <div className="flex justify-between items-center">
          <span className="text-slate-500">{t('payment_ref')}:</span>
          <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
            {refId}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500">{t('paid_date')}:</span>
          <span className="font-medium text-slate-800">{isPaid ? paymentDate : 'Pending final authorization'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Government Portal Status:</span>
          <span className="text-emerald-700 font-semibold">
            {isPaid ? 'Credited to Farmer Account' : isProcessing ? 'PFMS Batch Processing Initiated' : 'Awaiting APMC Quality Clearance'}
          </span>
        </div>
      </div>
    </div>
  );
}
