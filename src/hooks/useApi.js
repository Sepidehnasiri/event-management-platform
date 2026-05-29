const BASE_URL = 'http://localhost:3001';

export const api = {
  async getEvents(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.set('category', params.category);
    if (params.search) query.set('title_like', params.search);
    const url = `${BASE_URL}/events${query.toString() ? '?' + query : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  async getEvent(id) {
    const res = await fetch(`${BASE_URL}/events/${id}`);
    if (!res.ok) throw new Error('Event not found');
    return res.json();
  },

  async getBookings(userId = 'user1') {
    const res = await fetch(`${BASE_URL}/bookings?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
  },

  async createBooking(booking) {
    const res = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    if (!res.ok) throw new Error('Failed to create booking');
    return res.json();
  },

  async cancelBooking(id) {
    const res = await fetch(`${BASE_URL}/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    if (!res.ok) throw new Error('Failed to cancel booking');
    return res.json();
  },
};
