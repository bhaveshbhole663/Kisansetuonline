// KisanSetu Unified API Client
// Supports live FastAPI backend with automatic resilient client-side fallback
// for public deployments (e.g. Vercel, Netlify) when the backend server is offline or waking up.

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// --- Local Storage Mock Engine for 100% Static Deployment Resilience ---
const STORAGE_KEY = 'kisansetu_db_store';

function getMockStore() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      console.warn('Resetting corrupt local store');
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const ddmm = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace('/', '');

  const initialStore = {
    centres: [
      { id: 1, name: "Pune Central Grain Mandi (Hadapsar)", code: "PUN", address: "Hadapsar APMC Market Yard, Pune, MH", district: "Pune", total_capacity: 100, total_booked: 92, available_capacity: 8, load_percentage: 92, is_congested: true },
      { id: 2, name: "Baramati Krishi Kendra", code: "BAR", address: "MIDC Area, Baramati, Dist. Pune, MH", district: "Pune", total_capacity: 80, total_booked: 36, available_capacity: 44, load_percentage: 45, is_congested: false },
      { id: 3, name: "Daund Market Yard", code: "DAU", address: "Station Road, Daund, Dist. Pune, MH", district: "Pune", total_capacity: 60, total_booked: 18, available_capacity: 42, load_percentage: 30, is_congested: false },
      { id: 4, name: "Nashik APMC Sub-Yard", code: "NSK", address: "Peth Road, Panchavati, Nashik, MH", district: "Nashik", total_capacity: 120, total_booked: 66, available_capacity: 54, load_percentage: 55, is_congested: false },
    ],
    queue: [
      {
        booking_id: 1,
        token_number: `PUN-${ddmm}-031`,
        farmer_id: 1,
        farmer_name: "Ramesh Jadhav",
        farmer_mobile: "9876543210",
        village: "Hadapsar",
        district: "Pune",
        identity_reference: "KID-4091-MH",
        crop: "Wheat",
        quantity: 42.0,
        booking_channel: "WEB",
        procurement_status: "WEIGHED",
        quality_result: "GRADE_A",
        start_time: "08:00",
        end_time: "09:00",
        slot_date: todayStr,
        centre_id: 1,
        centre_name: "Pune Central Grain Mandi (Hadapsar)",
        payment_status: "PROCESSING",
        payment_amount: 96600.0,
        transaction_reference: "PFMS-DEMO-82932",
        payment_date: todayStr,
        timeline: [
          { new_status: "SLOT_BOOKED", remarks: "Farmer booked slot via Web Portal", timestamp: new Date(Date.now() - 3600000 * 3).toISOString() },
          { new_status: "ARRIVED", remarks: "Arrived at Hadapsar APMC Gate #2", timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
          { new_status: "QUALITY_CHECK", remarks: "Moisture 11.2%, Cleanliness certified Grade A", timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString() },
          { new_status: "WEIGHED", remarks: "Weighbridge Net: 42.0 Quintals (MSP @ ₹2,300/Q = ₹96,600)", timestamp: new Date(Date.now() - 3600000).toISOString() },
        ]
      },
      {
        booking_id: 2,
        token_number: `PUN-${ddmm}-032`,
        farmer_id: 2,
        farmer_name: "Suresh Patil",
        farmer_mobile: "9823456789",
        village: "Baramati Rural",
        district: "Pune",
        identity_reference: "KID-5102-MH",
        crop: "Soybean",
        quantity: 35.5,
        booking_channel: "SMS",
        procurement_status: "QUALITY_CHECK",
        quality_result: "GRADE_B",
        start_time: "08:00",
        end_time: "09:00",
        slot_date: todayStr,
        centre_id: 1,
        centre_name: "Pune Central Grain Mandi (Hadapsar)",
        payment_status: "PENDING",
        payment_amount: 163300.0,
        transaction_reference: "PFMS-DEMO-82933",
        timeline: [
          { new_status: "SLOT_BOOKED", remarks: "Booked via Keypad SMS (56161)", timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
          { new_status: "ARRIVED", remarks: "Arrived at Gate #1", timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString() },
          { new_status: "QUALITY_CHECK", remarks: "Assaying oil & moisture content", timestamp: new Date(Date.now() - 3600000 * 0.8).toISOString() }
        ]
      },
      {
        booking_id: 3,
        token_number: `PUN-${ddmm}-033`,
        farmer_id: 3,
        farmer_name: "Mahesh Shinde",
        farmer_mobile: "9812345678",
        village: "Daund Gaon",
        district: "Pune",
        identity_reference: "KID-6203-MH",
        crop: "Gram (Chana)",
        quantity: 28.0,
        booking_channel: "IVR",
        procurement_status: "ARRIVED",
        quality_result: "PENDING",
        start_time: "09:00",
        end_time: "10:00",
        slot_date: todayStr,
        centre_id: 1,
        centre_name: "Pune Central Grain Mandi (Hadapsar)",
        payment_status: "PENDING",
        payment_amount: 152320.0,
        timeline: [
          { new_status: "SLOT_BOOKED", remarks: "Booked via IVR Helpline (1800-KISAN)", timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString() },
          { new_status: "ARRIVED", remarks: "Arrived at Gate Entry", timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString() }
        ]
      },
      {
        booking_id: 4,
        token_number: `PUN-${ddmm}-034`,
        farmer_id: 4,
        farmer_name: "Ganesh Deshmukh",
        farmer_mobile: "9898989898",
        village: "Manchar",
        district: "Pune",
        identity_reference: "KID-7304-MH",
        crop: "Wheat",
        quantity: 50.0,
        booking_channel: "WEB",
        procurement_status: "SLOT_BOOKED",
        quality_result: "PENDING",
        start_time: "09:00",
        end_time: "10:00",
        slot_date: todayStr,
        centre_id: 1,
        centre_name: "Pune Central Grain Mandi (Hadapsar)",
        payment_status: "PENDING",
        payment_amount: 115000.0,
        timeline: [
          { new_status: "SLOT_BOOKED", remarks: "Slot booked via Web Portal", timestamp: new Date(Date.now() - 1800000).toISOString() }
        ]
      }
    ],
    tokenSeq: 35,
    smsSession: {}
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialStore));
  return initialStore;
}

function saveMockStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// --- Unified API Service with Fallback Logic ---
export const api = {
  // Auth
  async login(phone, role = 'FARMER') {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return {
      success: true,
      token: `token-${phone}`,
      user: { id: 1, phone, role, language: 'hi' },
      farmer: { id: 1, name: `Farmer ${phone.slice(-4)}`, mobile: phone, village: 'Hadapsar', identity_reference: `KID-${phone.slice(-4)}-MH` }
    };
  },

  async registerFarmer(data) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return {
      success: true,
      message: "Farmer registered successfully",
      farmer: { id: Date.now(), ...data, identity_reference: `KID-${data.mobile.slice(-4)}-MH` }
    };
  },

  async getFarmers() {
    try {
      const res = await fetch(`${API_BASE}/auth/farmers`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const store = getMockStore();
    return { success: true, farmers: store.queue.map(q => ({ id: q.farmer_id, name: q.farmer_name, mobile: q.farmer_mobile, village: q.village, district: q.district })) };
  },

  // Centres & Slots
  async getCentres(targetDate) {
    try {
      const url = targetDate ? `${API_BASE}/centres?target_date=${targetDate}` : `${API_BASE}/centres`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const store = getMockStore();
    return { success: true, date: targetDate || new Date().toISOString().split('T')[0], centres: store.centres };
  },

  async getCentreSlots(centreId, targetDate) {
    try {
      const url = targetDate 
        ? `${API_BASE}/centres/${centreId}/slots?target_date=${targetDate}` 
        : `${API_BASE}/centres/${centreId}/slots`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const store = getMockStore();
    const centre = store.centres.find(c => c.id === parseInt(centreId)) || store.centres[0];
    const slots = [
      { id: 1, centre_id: centre.id, date: targetDate, start_time: "08:00", end_time: "09:00", capacity: 20, booked_count: 18, status: "AVAILABLE" },
      { id: 2, centre_id: centre.id, date: targetDate, start_time: "09:00", end_time: "10:00", capacity: 20, booked_count: 19, status: "AVAILABLE" },
      { id: 3, centre_id: centre.id, date: targetDate, start_time: "10:00", end_time: "11:00", capacity: 20, booked_count: 12, status: "AVAILABLE" },
      { id: 4, centre_id: centre.id, date: targetDate, start_time: "11:00", end_time: "12:00", capacity: 20, booked_count: 15, status: "AVAILABLE" },
      { id: 5, centre_id: centre.id, date: targetDate, start_time: "13:00", end_time: "14:00", capacity: 20, booked_count: 8, status: "AVAILABLE" },
      { id: 6, centre_id: centre.id, date: targetDate, start_time: "14:00", end_time: "15:00", capacity: 20, booked_count: 6, status: "AVAILABLE" },
    ];
    return {
      success: true,
      centre,
      date: targetDate,
      slots,
      recommendations: [
        { type: "OPTIMAL_SLOT", slot_id: 6, time_window: "14:00 - 15:00", message: "Optimal traffic: 14:00 - 15:00 has lowest expected waiting time." },
        ...(centre.load_percentage >= 85 ? [{ type: "ALTERNATIVE_CENTRE", centre_id: 2, centre_name: "Baramati Krishi Kendra", message: `Smart Load Balancing: ${centre.name} is at ${centre.load_percentage}% capacity. Baramati is only at 45% with near-zero waiting time.` }] : [])
      ]
    };
  },

  // Bookings
  async createBooking(bookingData) {
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const store = getMockStore();
    const ddmm = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace('/', '');
    const centre = store.centres.find(c => c.id === parseInt(bookingData.centre_id)) || store.centres[0];
    const seq = store.tokenSeq++;
    const token = `${centre.code}-${ddmm}-${String(seq).padStart(3, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newBooking = {
      booking_id: Date.now(),
      token_number: token,
      farmer_id: bookingData.farmer_id || 1,
      farmer_name: bookingData.farmer_name || 'Ramesh Jadhav',
      farmer_mobile: bookingData.farmer_mobile || '9876543210',
      village: bookingData.farmer_village || 'Hadapsar',
      district: 'Pune',
      crop: bookingData.crop || 'Wheat',
      quantity: parseFloat(bookingData.quantity) || 40.0,
      booking_channel: bookingData.booking_channel || 'WEB',
      procurement_status: 'SLOT_BOOKED',
      quality_result: 'PENDING',
      start_time: '10:00',
      end_time: '11:00',
      slot_date: todayStr,
      centre_id: centre.id,
      centre_name: centre.name,
      payment_status: 'PENDING',
      payment_amount: (parseFloat(bookingData.quantity) || 40.0) * 2300.0,
      transaction_reference: `PFMS-DEMO-${seq + 82930}`,
      timeline: [
        { new_status: "SLOT_BOOKED", remarks: `Booked via ${bookingData.booking_channel || 'WEB'}`, timestamp: new Date().toISOString() }
      ]
    };

    store.queue.unshift(newBooking);
    saveMockStore(store);

    return {
      success: true,
      message: "Booking confirmed successfully",
      booking: {
        id: newBooking.booking_id,
        token_number: token,
        booking_channel: newBooking.booking_channel,
        centre_name: centre.name,
        date: todayStr,
        start_time: '10:00',
        end_time: '11:00',
        crop: newBooking.crop,
        quantity: newBooking.quantity,
        status: 'SLOT_BOOKED'
      }
    };
  },

  async getFarmerBookings(farmerId) {
    try {
      const res = await fetch(`${API_BASE}/bookings/farmer/${farmerId}`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const store = getMockStore();
    const bookings = store.queue.filter(q => q.farmer_id === parseInt(farmerId) || q.farmer_id === 1);
    return { success: true, bookings };
  },

  async getBookingByToken(token) {
    try {
      const res = await fetch(`${API_BASE}/bookings/token/${token}`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const store = getMockStore();
    const booking = store.queue.find(q => q.token_number.toUpperCase() === token.toUpperCase()) || store.queue[0];
    return { success: true, booking };
  },

  async cancelBooking(bookingId) {
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const store = getMockStore();
    store.queue = store.queue.filter(q => q.booking_id !== parseInt(bookingId));
    saveMockStore(store);
    return { success: true, message: "Booking cancelled successfully" };
  },

  // Admin Live Queue & Procurement Progression
  async getLiveQueue(centreId = null, targetDate = null) {
    try {
      let url = `${API_BASE}/admin/queue?`;
      if (centreId) url += `centre_id=${centreId}&`;
      if (targetDate) url += `target_date=${targetDate}&`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const store = getMockStore();
    const filtered = centreId ? store.queue.filter(q => q.centre_id === parseInt(centreId)) : store.queue;
    return {
      success: true,
      queue: filtered,
      metrics: {
        total_bookings: filtered.length,
        arrived: filtered.filter(q => ['ARRIVED', 'QUALITY_CHECK', 'WEIGHED', 'ACCEPTED', 'PAYMENT_PROCESSING', 'PAID'].includes(q.procurement_status)).length,
        quality_checked: filtered.filter(q => ['QUALITY_CHECK', 'WEIGHED', 'ACCEPTED', 'PAYMENT_PROCESSING', 'PAID'].includes(q.procurement_status)).length,
        weighed: filtered.filter(q => ['WEIGHED', 'ACCEPTED', 'PAYMENT_PROCESSING', 'PAID'].includes(q.procurement_status)).length,
        completed: filtered.filter(q => ['ACCEPTED', 'PAYMENT_PROCESSING', 'PAID'].includes(q.procurement_status)).length,
        paid: filtered.filter(q => q.procurement_status === 'PAID' || q.payment_status === 'PAID').length,
        waiting: filtered.filter(q => ['SLOT_BOOKED', 'ARRIVED', 'QUALITY_CHECK', 'WEIGHED'].includes(q.procurement_status)).length,
      }
    };
  },

  async updateProcurementStatus(updateData) {
    try {
      const res = await fetch(`${API_BASE}/admin/procurement/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const store = getMockStore();
    const item = store.queue.find(q => q.booking_id === parseInt(updateData.booking_id));
    if (item) {
      item.procurement_status = updateData.new_status;
      if (updateData.quality_result) item.quality_result = updateData.quality_result;
      if (updateData.quantity) item.quantity = updateData.quantity;
      if (updateData.new_status === 'PAID') item.payment_status = 'PAID';
      else if (['ACCEPTED', 'PAYMENT_PROCESSING'].includes(updateData.new_status)) item.payment_status = 'PROCESSING';
      item.timeline.push({
        new_status: updateData.new_status,
        remarks: updateData.remarks || `Status transitioned to ${updateData.new_status}`,
        timestamp: new Date().toISOString()
      });
      saveMockStore(store);
    }
    return { success: true, message: `Status updated to ${updateData.new_status}` };
  },

  async updatePaymentStatus(paymentData) {
    try {
      const res = await fetch(`${API_BASE}/admin/payment/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const store = getMockStore();
    const item = store.queue.find(q => q.booking_id === parseInt(paymentData.procurement_id) || q.booking_id === 1);
    if (item) {
      item.payment_status = paymentData.payment_status;
      if (paymentData.payment_status === 'PAID') {
        item.procurement_status = 'PAID';
        item.transaction_reference = paymentData.transaction_reference || `PFMS-DEMO-${Date.now().toString().slice(-5)}`;
        item.payment_date = new Date().toISOString().split('T')[0];
        item.timeline.push({
          new_status: 'PAID',
          remarks: `Simulated DBT payment credited via ${item.transaction_reference}`,
          timestamp: new Date().toISOString()
        });
      }
      saveMockStore(store);
    }
    return { success: true, message: `Payment updated to ${paymentData.payment_status}`, transaction_reference: item?.transaction_reference };
  },

  async registerWalkIn(walkInData) {
    try {
      const res = await fetch(`${API_BASE}/admin/walkins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(walkInData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const store = getMockStore();
    const ddmm = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace('/', '');
    const centre = store.centres.find(c => c.id === parseInt(walkInData.centre_id)) || store.centres[0];
    const seq = store.tokenSeq++;
    const token = `${centre.code}-${ddmm}-W${String(seq).padStart(2, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const walkInItem = {
      booking_id: Date.now(),
      token_number: token,
      farmer_id: Date.now(),
      farmer_name: walkInData.name,
      farmer_mobile: walkInData.mobile,
      village: walkInData.village || 'Local Village',
      district: 'Pune',
      crop: walkInData.crop,
      quantity: parseFloat(walkInData.estimated_quantity) || 40.0,
      booking_channel: 'WALK_IN',
      procurement_status: 'ARRIVED',
      quality_result: 'PENDING',
      start_time: 'Gate Spot',
      end_time: 'Current',
      slot_date: todayStr,
      centre_id: centre.id,
      centre_name: centre.name,
      payment_status: 'PENDING',
      payment_amount: (parseFloat(walkInData.estimated_quantity) || 40.0) * 2300.0,
      transaction_reference: `PFMS-DEMO-${seq + 82930}`,
      timeline: [
        { new_status: "ARRIVED", remarks: "Spot walk-in admitted at gate", timestamp: new Date().toISOString() }
      ]
    };

    store.queue.unshift(walkInItem);
    saveMockStore(store);

    return {
      success: true,
      token_number: token,
      booking_id: walkInItem.booking_id,
      farmer_name: walkInData.name,
      status: 'ARRIVED',
      channel: 'WALK_IN'
    };
  },

  // Channels (SMS & IVR Webhooks)
  async sendSMS(fromPhone, message) {
    try {
      const res = await fetch(`${API_BASE}/channels/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_phone: fromPhone, message }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const store = getMockStore();
    const msg = message.trim().toUpperCase();
    const todayStr = new Date().toISOString().split('T')[0];
    const ddmm = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace('/', '');

    if (msg === 'HELP') {
      return { reply: "KisanSetu SMS Menu:\n- Reply 'BOOK' to reserve a slot\n- Reply 'STATUS <Token>' to track queue\n- Reply 'PAYMENT <Token>' for payment\n- Reply 'CANCEL <Token>' to cancel" };
    }
    if (msg.startsWith('STATUS')) {
      const item = store.queue[0];
      return { reply: `Token: ${item.token_number}\nStatus: ${item.procurement_status}\nCrop: ${item.crop}\nQuantity: ${item.quantity} Q\nPayment: ${item.payment_status}` };
    }
    if (msg.startsWith('PAYMENT')) {
      const item = store.queue[0];
      return { reply: `Token: ${item.token_number}\nPayment: ${item.payment_status}\nAmount: Rs ${item.payment_amount.toLocaleString('en-IN')}\nPFMS Ref: ${item.transaction_reference}` };
    }
    if (msg === 'BOOK') {
      return { reply: "KisanSetu — Select Centre:\n1. Pune Central Grain Mandi\n2. Baramati Krishi Kendra\n3. Daund Market Yard\n\nReply with 1, 2 or 3." };
    }
    if (msg === '1' || msg === '2' || msg === '3') {
      const seq = store.tokenSeq++;
      const token = `PUN-${ddmm}-${String(seq).padStart(3, '0')}`;
      const newSms = {
        booking_id: Date.now(),
        token_number: token,
        farmer_id: Date.now(),
        farmer_name: `SMS Farmer (${fromPhone.slice(-4)})`,
        farmer_mobile: fromPhone,
        village: "Keypad Village",
        district: "Pune",
        crop: "Wheat",
        quantity: 40.0,
        booking_channel: "SMS",
        procurement_status: "SLOT_BOOKED",
        quality_result: "PENDING",
        start_time: "09:00",
        end_time: "10:00",
        slot_date: todayStr,
        centre_id: 1,
        centre_name: "Pune Central Grain Mandi (Hadapsar)",
        payment_status: "PENDING",
        payment_amount: 92000.0,
        transaction_reference: `PFMS-DEMO-${seq + 82930}`,
        timeline: [{ new_status: "SLOT_BOOKED", remarks: "Booked via Keypad SMS (56161)", timestamp: new Date().toISOString() }]
      };
      store.queue.unshift(newSms);
      saveMockStore(store);
      return { reply: `Booking Confirmed!\nCentre: Pune Central Grain Mandi\nDate: ${todayStr}\nTime: 09:00-10:00\nToken: ${token}\n\nReply STATUS for live queue updates.` };
    }
    return { reply: "KisanSetu: Command not recognized. Reply 'BOOK' to book, 'STATUS' for updates, or 'HELP'." };
  },

  async sendIVR(ivrPayload) {
    try {
      const res = await fetch(`${API_BASE}/channels/ivr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ivrPayload),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const step = ivrPayload.step || 'INIT';
    const digits = ivrPayload.input_digits || '1';
    const store = getMockStore();
    const ddmm = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace('/', '');
    const todayStr = new Date().toISOString().split('T')[0];

    if (step === 'INIT') {
      return {
        next_step: "LANG_SELECTED",
        voice_prompt_hi: "किसानसेतु में आपका स्वागत है। हिंदी के लिए 1 दबाएं। अंग्रेजी के लिए 2 दबाएं। मराठी के लिए 3 दबाएं।",
        voice_prompt_en: "Welcome to KisanSetu. For Hindi press 1. For English press 2. For Marathi press 3.",
        display_text: "1: हिन्दी | 2: English | 3: मराठी"
      };
    }
    if (step === 'LANG_SELECTED') {
      return {
        language: digits === '1' ? 'hi' : digits === '2' ? 'en' : 'mr',
        next_step: "MENU_SELECTED",
        voice_prompt: "मुख्य मेनू: स्लॉट बुक करने के लिए 1 दबाएं। स्थिति के लिए 2 दबाएं। भुगतान के लिए 3 दबाएं।",
        display_text: "1: Book Slot | 2: Status | 3: Payment"
      };
    }
    if (step === 'MENU_SELECTED') {
      return {
        next_step: "CENTRE_SELECTED",
        voice_prompt: "खरीद केंद्र चुनें। पुणे मंडी के लिए 1 दबाएं, बारामती केंद्र के लिए 2 दबाएं।",
        display_text: "1: Pune Mandi | 2: Baramati"
      };
    }
    if (step === 'CENTRE_SELECTED') {
      return {
        next_step: "SLOT_SELECTED",
        voice_prompt: "स्लॉट चुनें। 8 से 9 बजे के लिए 1 दबाएं, 9 से 10 बजे के लिए 2 दबाएं।",
        display_text: "1: 08:00-09:00 | 2: 09:00-10:00"
      };
    }
    if (step === 'SLOT_SELECTED') {
      const seq = store.tokenSeq++;
      const token = `PUN-${ddmm}-${String(seq).padStart(3, '0')}`;
      const newIvr = {
        booking_id: Date.now(),
        token_number: token,
        farmer_id: Date.now(),
        farmer_name: `IVR Caller (${ivrPayload.caller_phone.slice(-4)})`,
        farmer_mobile: ivrPayload.caller_phone,
        village: "Voice Helpline Village",
        district: "Pune",
        crop: "Wheat",
        quantity: 35.0,
        booking_channel: "IVR",
        procurement_status: "SLOT_BOOKED",
        quality_result: "PENDING",
        start_time: "08:00",
        end_time: "09:00",
        slot_date: todayStr,
        centre_id: 1,
        centre_name: "Pune Central Grain Mandi (Hadapsar)",
        payment_status: "PENDING",
        payment_amount: 80500.0,
        transaction_reference: `PFMS-DEMO-${seq + 82930}`,
        timeline: [{ new_status: "SLOT_BOOKED", remarks: "Booked via Toll-Free IVR Helpline (1800-KISAN)", timestamp: new Date().toISOString() }]
      };
      store.queue.unshift(newIvr);
      saveMockStore(store);

      return {
        language: ivrPayload.language || 'hi',
        next_step: "FINISHED",
        token_number: token,
        voice_prompt: `आपकी बुकिंग सफल रही। आपका टोकन नंबर है ${token}। पुष्टि एसएमएस भेज दिया गया है। किसानसेतु में कॉल करने के लिए धन्यवाद।`,
        display_text: `Confirmed! Token: ${token} | Time: 08:00-09:00`
      };
    }
    return { language: 'hi', next_step: 'INIT', voice_prompt: 'कॉल समाप्त हुआ। धन्यवाद।', display_text: 'Call Ended' };
  },

  // AI Assistant
  async askAI(queryText, farmerId, language = 'hi') {
    try {
      const res = await fetch(`${API_BASE}/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_text: queryText, farmer_id: farmerId, language }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const store = getMockStore();
    const item = store.queue[0];
    const q = queryText.toLowerCase();

    if (q.includes('payment') || q.includes('पेमेंट') || q.includes('पैसे') || q.includes('रुपये')) {
      const responses = {
        hi: `सत्यापित जानकारी: टोकन ${item.token_number} के लिए राशि ₹${Number(item.payment_amount).toLocaleString('en-IN')} का भुगतान स्थिति: ${item.payment_status}। संदर्भ: ${item.transaction_reference}।`,
        mr: `सत्यापित माहिती: टोकन ${item.token_number} साठी रक्कम ₹${Number(item.payment_amount).toLocaleString('en-IN')} चे पेमेंट स्थिती: ${item.payment_status}. संदर्भ: ${item.transaction_reference}.`,
        en: `Verified Record: Payment for token ${item.token_number} of ₹${Number(item.payment_amount).toLocaleString('en-IN')} is ${item.payment_status}. PFMS Ref: ${item.transaction_reference}.`
      };
      return {
        intent: "PAYMENT_STATUS",
        confidence: 0.96,
        ground_truth_record: { token: item.token_number, amount: item.payment_amount, payment_status: item.payment_status },
        response: responses[language] || responses.en
      };
    }

    if (q.includes('queue') || q.includes('कतार') || q.includes('नंबर') || q.includes('रांग')) {
      const responses = {
        hi: `टोकन ${item.token_number}: वर्तमान स्थिति '${item.procurement_status}' है। मंडी कतार में आपसे आगे 2 किसान हैं।`,
        mr: `टोकन ${item.token_number}: सध्याची स्थिती '${item.procurement_status}' आहे. रांगेत तुमच्या पुढे 2 शेतकरी आहेत.`,
        en: `Token ${item.token_number}: Current stage is '${item.procurement_status}'. There are approximately 2 farmers ahead of you in the queue.`
      };
      return {
        intent: "QUEUE_POSITION",
        confidence: 0.95,
        ground_truth_record: { token: item.token_number, stage: item.procurement_status },
        response: responses[language] || responses.en
      };
    }

    const responses = {
      hi: `आपका टोकन: ${item.token_number} | केंद्र: ${item.centre_name} | फसल: ${item.crop} (${item.quantity} Q) | स्थिति: ${item.procurement_status}।`,
      mr: `तुमचे टोकन: ${item.token_number} | केंद्र: ${item.centre_name} | शेतमाल: ${item.crop} (${item.quantity} Q) | स्थिती: ${item.procurement_status}.`,
      en: `Your Token: ${item.token_number} | Centre: ${item.centre_name} | Produce: ${item.crop} (${item.quantity} Q) | Status: ${item.procurement_status}.`
    };
    return {
      intent: "BOOKING_STATUS",
      confidence: 0.94,
      ground_truth_record: { token: item.token_number },
      response: responses[language] || responses.en
    };
  },

  // Analytics
  async getAnalyticsSummary() {
    try {
      const res = await fetch(`${API_BASE}/analytics/summary`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const store = getMockStore();
    return {
      success: true,
      date: new Date().toISOString().split('T')[0],
      metrics: {
        registered_farmers: 284,
        today_booked: store.queue.length + 18,
        arrived: store.queue.filter(q => q.procurement_status !== 'SLOT_BOOKED').length + 12,
        completed: store.queue.filter(q => ['ACCEPTED', 'PAID'].includes(q.procurement_status)).length + 8,
        waiting: 4,
        paid: store.queue.filter(q => q.payment_status === 'PAID').length + 6,
        avg_wait_minutes: 24
      },
      channel_breakdown: {
        WEB: store.queue.filter(q => q.booking_channel === 'WEB').length + 10,
        SMS: store.queue.filter(q => q.booking_channel === 'SMS').length + 4,
        IVR: store.queue.filter(q => q.booking_channel === 'IVR').length + 3,
        WALK_IN: store.queue.filter(q => q.booking_channel === 'WALK_IN').length + 2
      },
      centre_loads: store.centres
    };
  }
};
