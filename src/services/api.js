import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Events API
export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.patch(`/events/${id}`, data),
  like: (id, likes) => api.patch(`/events/${id}`, { likes }),
};

// Bookings API
export const bookingsAPI = {
  getByUserId: (userId, params) => 
    api.get('/bookings', { params: { userId, ...params } }),
  create: (data) => api.post('/bookings', data),
  cancel: (id) => api.patch(`/bookings/${id}`, { status: 'cancelled' }),
  update: (id, data) => api.patch(`/bookings/${id}`, data),
  getById: (id) => api.get(`/bookings/${id}`),
};

// Users API
export const usersAPI = {
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.patch(`/users/${id}`, data),
  updatePreferences: (id, preferences) =>
    api.patch(`/users/${id}`, { preferences }),
};

export default api;
