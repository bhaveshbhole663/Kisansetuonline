const API_BASE = '/api';

export const api = {
  // Auth
  async login(phone, role = 'FARMER') {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, role }),
    });
    return res.json();
  },

  async registerFarmer(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getFarmers() {
    const res = await fetch(`${API_BASE}/auth/farmers`);
    return res.json();
  },

  // Centres & Slots
  async getCentres(targetDate) {
    const url = targetDate ? `${API_BASE}/centres?target_date=${targetDate}` : `${API_BASE}/centres`;
    const res = await fetch(url);
    return res.json();
  },

  async getCentreSlots(centreId, targetDate) {
    const url = targetDate 
      ? `${API_BASE}/centres/${centreId}/slots?target_date=${targetDate}` 
      : `${API_BASE}/centres/${centreId}/slots`;
    const res = await fetch(url);
    return res.json();
  },

  // Bookings
  async createBooking(bookingData) {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    return res.json();
  },

  async getFarmerBookings(farmerId) {
    const res = await fetch(`${API_BASE}/bookings/farmer/${farmerId}`);
    return res.json();
  },

  async getBookingByToken(token) {
    const res = await fetch(`${API_BASE}/bookings/token/${token}`);
    return res.json();
  },

  async cancelBooking(bookingId) {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
      method: 'POST',
    });
    return res.json();
  },

  // Admin Procurement Queue & Status Progression
  async getLiveQueue(centreId = null, targetDate = null) {
    let url = `${API_BASE}/admin/queue?`;
    if (centreId) url += `centre_id=${centreId}&`;
    if (targetDate) url += `target_date=${targetDate}&`;
    const res = await fetch(url);
    return res.json();
  },

  async updateProcurementStatus(updateData) {
    const res = await fetch(`${API_BASE}/admin/procurement/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    return res.json();
  },

  async updatePaymentStatus(paymentData) {
    const res = await fetch(`${API_BASE}/admin/payment/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    return res.json();
  },

  async registerWalkIn(walkInData) {
    const res = await fetch(`${API_BASE}/admin/walkins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(walkInData),
    });
    return res.json();
  },

  // Channels (SMS & IVR Webhooks)
  async sendSMS(fromPhone, message) {
    const res = await fetch(`${API_BASE}/channels/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_phone: fromPhone, message }),
    });
    return res.json();
  },

  async sendIVR(ivrPayload) {
    const res = await fetch(`${API_BASE}/channels/ivr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ivrPayload),
    });
    return res.json();
  },

  // AI Assistant
  async askAI(queryText, farmerId, language = 'hi') {
    const res = await fetch(`${API_BASE}/ai/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query_text: queryText, farmer_id: farmerId, language }),
    });
    return res.json();
  },

  // Analytics
  async getAnalyticsSummary() {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    return res.json();
  }
};
