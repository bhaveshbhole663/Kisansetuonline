import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Wheat, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';

export default function BookSlotModal({ isOpen, onClose, onBookingComplete }) {
  const { currentFarmer, t, triggerRefresh } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [crop, setCrop] = useState('Wheat');
  const [quantity, setQuantity] = useState(40);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotsData, setSlotsData] = useState({ slots: [], recommendations: [] });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadCentres();
      setStep(1);
      setError(null);
      setConfirmedBooking(null);
    }
  }, [isOpen, selectedDate]);

  const loadCentres = async () => {
    try {
      setLoading(true);
      const res = await api.getCentres(selectedDate);
      if (res.success) {
        setCentres(res.centres);
        if (!selectedCentre && res.centres.length > 0) {
          setSelectedCentre(res.centres[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (centreId) => {
    try {
      setLoading(true);
      const res = await api.getCentreSlots(centreId, selectedDate);
      if (res.success) {
        setSlotsData({
          slots: res.slots || [],
          recommendations: res.recommendations || []
        });
        if (res.slots && res.slots.length > 0) {
          const avail = res.slots.find(s => s.booked_count < s.capacity);
          setSelectedSlot(avail || res.slots[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && selectedCentre) {
      setStep(2);
    } else if (step === 2) {
      loadSlots(selectedCentre.id);
      setStep(3);
    }
  };

  const handleConfirm = async () => {
    if (!selectedCentre || !selectedSlot) return;
    try {
      setLoading(true);
      setError(null);
      const payload = {
        farmer_id: currentFarmer?.id || 1,
        farmer_mobile: currentFarmer?.mobile || '9876543210',
        farmer_name: currentFarmer?.name || 'Ramesh Jadhav',
        centre_id: selectedCentre.id,
        slot_id: selectedSlot.id,
        crop: crop,
        quantity: parseFloat(quantity) || 40.0,
        booking_channel: 'WEB'
      };
      const res = await api.createBooking(payload);
      if (res.success) {
        setConfirmedBooking(res.booking);
        triggerRefresh('WEB', `Token ${res.booking.token_number} booked by ${currentFarmer?.name} (${crop} - ${quantity} Q)`);
        if (onBookingComplete) onBookingComplete(res.booking);
        setStep(4); // Confirmation step
      } else {
        setError(res.detail || 'Booking failed');
      }
    } catch (err) {
      setError(err.message || 'Error creating booking');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">
              {step < 4 ? `Step ${step} of 3` : 'Booking Complete'}
            </span>
            <h2 className="text-xl font-bold">{t('book_slot')}</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Select Centre */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                {t('select_centre')}
              </label>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {centres.map((c) => {
                  const isSelected = selectedCentre?.id === c.id;
                  const isCongested = c.load_percentage >= 85;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCentre(c)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                            {c.name}
                          </p>
                          <p className="text-xs text-slate-500 ml-5">{c.address}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isCongested 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {c.load_percentage}% Load
                        </span>
                      </div>

                      {/* Capacity load bar */}
                      <div className="mt-2.5 ml-5">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              isCongested ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${c.load_percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                          <span>Capacity: {c.total_capacity} farmers/day</span>
                          <span>{c.available_capacity} slots open</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  disabled={!selectedCentre}
                  onClick={handleNextStep}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs"
                >
                  <span>Next: Crop & Date</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Crop, Quantity, Date */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Crop */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('select_crop')}
                  </label>
                  <select
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Wheat">Wheat (गेहूं / गहू) - MSP ₹2,300/Q</option>
                    <option value="Soybean">Soybean (सोयाबीन) - MSP ₹4,892/Q</option>
                    <option value="Gram (Chana)">Gram (चना / हरभरा) - MSP ₹5,440/Q</option>
                    <option value="Mustard">Mustard (सरसों / मोहरी) - MSP ₹5,650/Q</option>
                    <option value="Paddy">Paddy (धान / भात) - MSP ₹2,320/Q</option>
                    <option value="Cotton">Cotton (कपास / कापूस) - MSP ₹7,121/Q</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('quantity')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Date selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('select_date')}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <Wheat className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Selected: <strong>{crop}</strong> ({quantity} Quintals) at <strong>{selectedCentre?.name}</strong></span>
              </div>

              <div className="pt-3 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center gap-1.5 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2 text-sm shadow-xs"
                >
                  <span>Next: Choose Time Slot</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Slot Selection with Smart Allocation */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Smart Recommendation Banner if available */}
              {slotsData.recommendations && slotsData.recommendations.length > 0 && (
                <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs mb-1">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{t('smart_recommendation')}</span>
                  </div>
                  {slotsData.recommendations.map((rec, i) => (
                    <p key={i} className="text-xs text-emerald-700">
                      {rec.message}
                    </p>
                  ))}
                </div>
              )}

              <label className="block text-sm font-semibold text-slate-700">
                {t('available_slots')} ({selectedDate})
              </label>

              <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {slotsData.slots.map((s) => {
                  const isFull = s.booked_count >= s.capacity;
                  const isSelected = selectedSlot?.id === s.id;
                  const isOptimal = slotsData.recommendations.some(r => r.slot_id === s.id);

                  return (
                    <div
                      key={s.id}
                      onClick={() => !isFull && setSelectedSlot(s)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isFull 
                          ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed' 
                          : isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-xs cursor-pointer'
                          : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 text-sm font-bold text-slate-900">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{s.start_time} - {s.end_time}</span>
                      </div>
                      <div className="text-[11px] mt-1">
                        {isFull ? (
                          <span className="text-red-600 font-medium">Full</span>
                        ) : (
                          <span className="text-slate-500">
                            {s.capacity - s.booked_count} slots open
                          </span>
                        )}
                      </div>
                      {isOptimal && !isFull && (
                        <span className="mt-1 inline-block text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-semibold">
                          Recommended
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-slate-500 italic">
                {t('early_arrival_note')}
              </p>

              <div className="pt-3 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center gap-1.5 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  disabled={!selectedSlot || loading}
                  onClick={handleConfirm}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 text-sm shadow-md shadow-emerald-600/20"
                >
                  {loading ? 'Confirming...' : t('confirm_booking')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success & Token Generated */}
          {step === 4 && confirmedBooking && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Booking Confirmed!</h3>
                <p className="text-xs text-slate-500">
                  SMS notification sent to {currentFarmer?.mobile}
                </p>
              </div>

              {/* Prominent Token Card */}
              <div className="bg-gradient-to-tr from-emerald-500 to-teal-600 text-white p-4 rounded-2xl shadow-lg max-w-sm mx-auto">
                <p className="text-xs font-medium uppercase tracking-wider text-emerald-100">
                  {t('token')}
                </p>
                <p className="text-3xl font-extrabold tracking-widest my-1">
                  {confirmedBooking.token_number}
                </p>
                <p className="text-xs text-emerald-100">
                  Channel: {confirmedBooking.booking_channel}
                </p>
              </div>

              {/* Booking Specs */}
              <div className="bg-slate-50 rounded-xl p-3.5 text-left text-xs space-y-1.5 border border-slate-200 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('centre')}:</span>
                  <span className="font-semibold text-slate-800">{confirmedBooking.centre_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('date')}:</span>
                  <span className="font-semibold text-slate-800">{confirmedBooking.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('time')}:</span>
                  <span className="font-semibold text-slate-800">{confirmedBooking.start_time} - {confirmedBooking.end_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('crop')}:</span>
                  <span className="font-semibold text-slate-800">{confirmedBooking.crop} ({confirmedBooking.quantity} Q)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full max-w-sm px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm shadow-xs"
                >
                  Go to Farmer Dashboard
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
