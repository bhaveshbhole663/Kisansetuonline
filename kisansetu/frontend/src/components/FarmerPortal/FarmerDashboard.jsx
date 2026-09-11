import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import BookSlotModal from './BookSlotModal';
import StatusTimeline from './StatusTimeline';
import PaymentTracker from './PaymentTracker';
import FarmerAIAssistant from './FarmerAIAssistant';
import { 
  CalendarPlus, 
  MapPin, 
  Clock, 
  Wheat, 
  Ticket, 
  ArrowUpRight, 
  RefreshCw,
  Bell,
  CheckCircle2,
  AlertCircle,
  LogOut
} from 'lucide-react';

export default function FarmerDashboard() {
  const { currentFarmer, t, refreshKey, triggerRefresh, logoutFarmer } = useApp();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    loadFarmerBookings();
  }, [currentFarmer, refreshKey]);

  const loadFarmerBookings = async () => {
    try {
      setLoading(true);
      const res = await api.getFarmerBookings(currentFarmer?.id || 1);
      if (res.success && res.bookings) {
        setBookings(res.bookings);
        const latest = res.bookings[0];
        setActiveBooking(latest);

        if (latest) {
          // Fetch full details with timeline
          const tokenRes = await api.getBookingByToken(latest.token_number);
          if (tokenRes.success) {
            setBookingDetails(tokenRes.booking);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Farmer Greeting Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-200 text-xs font-semibold tracking-wider uppercase">
                {currentFarmer?.village}, {currentFarmer?.district}
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                {currentFarmer?.identity_reference || 'KID-4091-MH'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('welcome')}, {currentFarmer?.name || 'Ramesh'}
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
              Transparent slot booking and queue management for Agricultural Produce Market Committees (APMC).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBookModalOpen(true)}
              className="px-5 py-3 bg-white hover:bg-emerald-50 text-emerald-800 font-bold rounded-2xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
            >
              <CalendarPlus className="w-5 h-5 text-emerald-600" />
              <span>{t('book_slot')}</span>
            </button>
            <button
              onClick={loadFarmerBookings}
              title="Refresh"
              className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={logoutFarmer}
              title={t('switch_account')}
              className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl flex items-center gap-1.5 text-xs transition-all cursor-pointer border border-white/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('switch_account')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Upcoming Booking Card & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Upcoming Booking Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">{t('upcoming_booking')}</h3>
              {activeBooking && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Channel: {activeBooking.booking_channel}
                </span>
              )}
            </div>

            {activeBooking ? (
              <div className="space-y-4">
                {/* Token Badge */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-4 shadow-sm text-center">
                  <span className="text-[11px] font-semibold tracking-wider text-emerald-100 uppercase">
                    {t('token')}
                  </span>
                  <p className="text-2xl sm:text-3xl font-black tracking-widest my-1">
                    {activeBooking.token_number}
                  </p>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-medium">
                    Status: {activeBooking.procurement_status?.replace('_', ' ') || 'BOOKED'}
                  </span>
                </div>

                {/* Appointment Specs */}
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block">{t('centre')}</span>
                      <strong className="text-slate-800 text-sm font-semibold">{activeBooking.centre_name}</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block">{t('date')} & {t('time')}</span>
                      <strong className="text-slate-800 text-sm font-semibold">
                        {activeBooking.slot_date} ({activeBooking.start_time} - {activeBooking.end_time})
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Wheat className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block">{t('crop')}</span>
                      <strong className="text-slate-800 text-sm font-semibold">
                        {activeBooking.crop} ({activeBooking.quantity} Quintals)
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{t('early_arrival_note')} Bring Gate Token copy or SMS on mobile.</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {t('no_upcoming_booking')}
                </p>
                <button
                  onClick={() => setIsBookModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  {t('book_slot')}
                </button>
              </div>
            )}
          </div>

          {/* Multilingual AI Farmer Query Assistant */}
          <FarmerAIAssistant />
        </div>

        {/* Right Column: 8-Stage Status Tracker & Payment Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          <StatusTimeline 
            currentStatus={activeBooking?.procurement_status || 'SLOT_BOOKED'}
            timelineHistory={bookingDetails?.timeline || []}
          />

          {/* Payment Tracker */}
          <PaymentTracker 
            paymentData={{
              payment_status: activeBooking?.payment_status || 'PROCESSING',
              amount: activeBooking?.payment_amount || 96600,
              transaction_reference: activeBooking?.transaction_reference || 'PFMS-DEMO-82932',
              payment_date: activeBooking?.payment_date
            }}
            crop={activeBooking?.crop || 'Wheat'}
            quantity={activeBooking?.quantity || 42}
          />
        </div>

      </div>

      {/* Book Slot Modal */}
      <BookSlotModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onBookingComplete={() => {
          loadFarmerBookings();
        }}
      />

    </div>
  );
}
