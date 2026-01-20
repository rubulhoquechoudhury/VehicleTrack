import axios from 'axios';

// Use relative URL in production (same domain), absolute in development
const API_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
});

// Add interceptor to include auth token for every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  adminLogin: (credentials) => axios.post(`${API_URL}/auth/admin/login`, credentials),
  adminSignup: (data) => axios.post(`${API_URL}/auth/admin/signup`, data),
  driverLogin: (credentials) => axios.post(`${API_URL}/auth/driver/login`, credentials),
  trackerLogin: (credentials) => axios.post(`${API_URL}/auth/tracker/login`, credentials),
  getMe: () => apiClient.get('/auth/me'),
};

export const adminAPI = {
  getDrivers: () => apiClient.get('/admin/drivers'),
  getTrackers: () => apiClient.get('/admin/trackers'),
  addDriver: (data) => apiClient.post('/admin/drivers', data),
  addTracker: (data) => apiClient.post('/admin/trackers', data),
  deleteDriver: (id) => apiClient.delete(`/admin/drivers/${id}`),
  deleteTracker: (id) => apiClient.delete(`/admin/trackers/${id}`),
};

export const trackerAPI = {
  getBuses: () => apiClient.get('/tracker/buses'),
};
