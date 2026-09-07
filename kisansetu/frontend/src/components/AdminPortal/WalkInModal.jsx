import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { X, UserPlus, AlertTriangle, CheckCircle2, Ticket } from 'lucide-react';

export default function WalkInModal({ isOpen, onClose, centres = [], onWalkInCreated }) {
  const { triggerRefresh } = useApp();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [centreId, setCentreId] = useState(centres[0]?.id || 1);
  const [crop, setCrop] = useState('Wheat');
  const [quantity, setQuantity] = useState(40);
  const [village, setVillage] = useState('Hadapsar Rural');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !mobile) {
      setError('Farmer name and mobile number are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.registerWalkIn({
        name,
        mobile,
        centre_id: parseInt(centreId),
        crop,
        estimated_quantity: parseFloat(quantity) || 40.0,
        village,
        district: 'Pune'
      });

      if (res.success) {
        setResult(res);
        triggerRefresh('WALK_IN', `Walk-in Token ${res.token_number} generated for ${name} (${crop} - ${quantity} Q)`);
        if (onWalkInCreated) onWalkInCreated();
      } else {
        setError(res.detail || 'Failed to register walk-in');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-amber-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            <h2 className="text-lg font-bold">Register Walk-in Farmer</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Walk-In Admitted to Queue</h3>
                <p className="text-xs text-slate-500">Admitted directly to ARRIVED stage.</p>
              </div>

              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-3.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-100">Walk-in Token</span>
                <p className="text-2xl font-black tracking-widest">{result.token_number}</p>
                <p className="text-xs text-amber-100 mt-0.5">{result.farmer_name}</p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close & View in Queue
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <p className="text-xs text-slate-500">
                Generate an immediate spot token for physical gate arrivals without smartphone appointments.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Farmer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tukaram Gaikwad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit phone number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Crop</label>
                  <select
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="Wheat">Wheat</option>
                    <option value="Soybean">Soybean</option>
                    <option value="Gram (Chana)">Gram (Chana)</option>
                    <option value="Mustard">Mustard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Quintals</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Procurement Centre</label>
                <select
                  value={centreId}
                  onChange={(e) => setCentreId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {centres.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Ticket className="w-4 h-4" />
                  <span>{loading ? 'Creating...' : 'Generate Walk-in Token & Admit'}</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
