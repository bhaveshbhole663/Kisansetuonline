import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Scale, 
  ShieldCheck, 
  CreditCard, 
  AlertTriangle,
  FileText,
  User,
  Wheat,
  XCircle
} from 'lucide-react';

export default function ProcurementWorkflowModal({ item, isOpen, onClose, onUpdated }) {
  const { triggerRefresh } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states for workflow actions
  const [qualityGrade, setQualityGrade] = useState('GRADE_A');
  const [moisture, setMoisture] = useState('11.5');
  const [qualityNotes, setQualityNotes] = useState('Clean grain sample, certified within FAQ specifications');
  const [netWeight, setNetWeight] = useState(item?.quantity || 40.0);
  const [remarks, setRemarks] = useState('');

  if (!isOpen || !item) return null;

  const currentStatus = item.procurement_status || 'SLOT_BOOKED';

  const handleAction = async (targetStatus, customPayload = {}) => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        booking_id: item.booking_id,
        new_status: targetStatus,
        quality_result: customPayload.quality_result || qualityGrade,
        quality_notes: customPayload.quality_notes || `${qualityNotes} (Moisture: ${moisture}%)`,
        quantity: parseFloat(netWeight) || item.quantity,
        remarks: remarks || `Advanced to ${targetStatus} by APMC gate operator`,
        ...customPayload
      };

      const res = await api.updateProcurementStatus(payload);
      if (res.success) {
        triggerRefresh(item.booking_channel, `Token ${item.token_number} moved to ${targetStatus}`);
        if (onUpdated) onUpdated();
        onClose();
      } else {
        setError(res.detail || 'Failed to update status');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.updatePaymentStatus({
        procurement_id: item.procurement_id,
        payment_status: 'PAID',
        transaction_reference: `PFMS-DEMO-${item.booking_id + 82930}`,
        amount: (item.quantity || 40) * 2300.0
      });
      if (res.success) {
        triggerRefresh('PFMS', `DBT Payment of ₹${(item.quantity || 40) * 2300} completed for token ${item.token_number}`);
        if (onUpdated) onUpdated();
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-emerald-400">
              Token: {item.token_number}
            </span>
            <h2 className="text-lg font-bold">APMC Procurement Workflow Console</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Farmer & Lot Overview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 block">Farmer:</span>
              <strong className="text-slate-900 text-sm font-semibold">{item.farmer_name}</strong>
              <span className="text-slate-500 block">{item.farmer_mobile} ({item.village})</span>
            </div>
            <div>
              <span className="text-slate-400 block">Produce & Channel:</span>
              <strong className="text-slate-900 text-sm font-semibold">{item.crop} ({item.quantity} Q)</strong>
              <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800">
                Channel: {item.booking_channel}
              </span>
            </div>
          </div>

          {/* Current Status Badge */}
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-xs text-emerald-900 font-semibold">Active Workflow Stage:</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white">
              {currentStatus.replace('_', ' ')}
            </span>
          </div>

          {/* Dynamic Workflow Actions according to current state */}
          <div className="space-y-4 pt-1">
            
            {/* 1. If SLOT_BOOKED -> [Mark Arrived] */}
            {currentStatus === 'SLOT_BOOKED' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs font-semibold text-slate-700">Step 1: Verify Gate Arrival</p>
                <p className="text-xs text-slate-500">
                  Farmer has arrived at the APMC gate. Verify vehicle number and gate pass.
                </p>
                <button
                  disabled={loading}
                  onClick={() => handleAction('ARRIVED', { remarks: 'Vehicle verified at Gate #1' })}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as ARRIVED at Gate</span>
                </button>
              </div>
            )}

            {/* 2. If ARRIVED -> [Quality Check] */}
            {currentStatus === 'ARRIVED' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs font-semibold text-slate-700">Step 2: Grain Quality Assay & Moisture Test</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Quality Grade</label>
                    <select
                      value={qualityGrade}
                      onChange={(e) => setQualityGrade(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="GRADE_A">Grade A (FAQ Standard)</option>
                      <option value="GRADE_B">Grade B (Minor Chaff)</option>
                      <option value="ACCEPTED">Direct Pass</option>
                      <option value="REJECTED">Reject Lot</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Moisture Level (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={moisture}
                      onChange={(e) => setMoisture(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={loading}
                    onClick={() => handleAction('QUALITY_CHECK')}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Approve Quality Check</span>
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => handleAction('REJECTED', { remarks: 'Rejected: Moisture level above prescribed threshold' })}
                    className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. If QUALITY_CHECK -> [Weigh Produce] */}
            {currentStatus === 'QUALITY_CHECK' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs font-semibold text-slate-700">Step 3: Electronic Weighbridge Measurement</p>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Net Weight (Quintals)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={netWeight}
                    onChange={(e) => setNetWeight(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <button
                  disabled={loading}
                  onClick={() => handleAction('WEIGHED', { quantity: parseFloat(netWeight) })}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs"
                >
                  <Scale className="w-4 h-4" />
                  <span>Record Weight & Advance to WEIGHED</span>
                </button>
              </div>
            )}

            {/* 4. If WEIGHED -> [Accept & Initiate Payment] */}
            {currentStatus === 'WEIGHED' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs font-semibold text-slate-700">Step 4: Final Produce Acceptance & Payment Trigger</p>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex justify-between">
                  <span>Net: {item.quantity} Quintals</span>
                  <span className="font-bold text-emerald-700">
                    Est. MSP Credit: ₹{(item.quantity * 2300).toLocaleString('en-IN')}
                  </span>
                </div>
                <button
                  disabled={loading}
                  onClick={() => handleAction('ACCEPTED')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ACCEPT Produce & Move to PAYMENT_PROCESSING</span>
                </button>
              </div>
            )}

            {/* 5. If ACCEPTED or PAYMENT_PROCESSING -> [Simulate DBT / PFMS Paid] */}
            {(currentStatus === 'ACCEPTED' || currentStatus === 'PAYMENT_PROCESSING') && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                <p className="text-xs font-semibold text-emerald-900">Step 5: Direct Benefit Transfer (Simulated PFMS)</p>
                <p className="text-xs text-emerald-700">
                  Trigger government direct bank credit to farmer's registered Aadhaar bank account.
                </p>
                <button
                  disabled={loading}
                  onClick={handleSimulatePayment}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>DISBURSE PAYMENT (Simulate PFMS PAID)</span>
                </button>
              </div>
            )}

            {/* 6. If PAID */}
            {currentStatus === 'PAID' && (
              <div className="p-4 bg-emerald-100 rounded-xl text-center text-xs text-emerald-900 font-bold space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p>Procurement Lifecycle Complete</p>
                <p className="text-[11px] font-normal text-emerald-700">Payment credited via simulated PFMS gateway.</p>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
