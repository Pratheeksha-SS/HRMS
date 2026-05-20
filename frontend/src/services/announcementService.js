import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Announcement API functions
export const announcementService = {
  // Get all announcements
  getAll: () => api.get('/announcements/'),

  // Get pinned announcements
  getPinned: () => api.get('/announcements/pinned/'),

  // Get calendar announcements
  getCalendar: () => api.get('/announcements/calendar/'),

  // Get history (expired) announcements
  getHistory: () => api.get('/announcements/history/'),

  // Get single announcement
  // getOne: (id) => api.get(`/announcements/class/${id}/`),
    getOne: (id) => api.get(`/announcements/${id}/`),

  // Create announcement (with file upload)
  // create: (formData) => api.post('/announcements/create/', formData, {
  //   headers: { 'Content-Type': 'multipart/form-data' }
  // }),
  create: (formData) => api.post('/announcements/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Update announcement
  // update: (id, data) => api.put(`/announcements/update/${id}/`, data, {
  //   headers: { 'Content-Type': 'multipart/form-data' }
  // }),
  update: (id, data) => api.put(`/announcements/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Delete announcement
  // delete: (id) => api.delete(`/announcements/delete/${id}/`),
  delete: (id) => api.delete(`/announcements/${id}/`),
};

export default announcementService;