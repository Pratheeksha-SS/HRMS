import axios from 'axios';

// Read from .env — set VITE_API_URL to your server's IP/hostname
// e.g. http://192.168.1.100:8000  or  https://api.yourcompany.com
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_BASE_URL = BASE_URL;          // used for media/image URLs
export const API_URL      = `${BASE_URL}/api`; // used for API calls

const api = axios.create({
  baseURL: API_URL,
});

const ATTENDANCE_CACHE_TTL = 2 * 60 * 1000;
const attendanceCache = new Map();

const isAttendanceRequest = (config = {}) => {
  const url = config.url || '';
  return url.includes('/attendance/');
};

const buildCacheKey = (config = {}, token = '') => {
  const rawUrl = config.url || '';
  const params = new URLSearchParams();

  if (config.params) {
    Object.entries(config.params)
      .filter(([, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, value]) => params.append(key, value));
  }

  return [
    token,
    (config.method || 'get').toLowerCase(),
    rawUrl,
    params.toString(),
  ].join('|');
};

const clearAttendanceCache = () => {
  attendanceCache.clear();
};

// Attach JWT token to every request automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const method = (config.method || 'get').toLowerCase();
    if (isAttendanceRequest(config) && method !== 'get') {
      clearAttendanceCache();
      return config;
    }

    if (isAttendanceRequest(config) && method === 'get' && !config.skipCache) {
      const cacheKey = buildCacheKey(config, token || '');
      const cached = attendanceCache.get(cacheKey);

      if (cached && Date.now() - cached.time < ATTENDANCE_CACHE_TTL) {
        config.adapter = () => Promise.resolve({
          ...cached.response,
          config,
          request: null,
          headers: cached.response.headers || {},
        });
        return config;
      }

      config.cacheKey = cacheKey;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => {
    const config = response.config || {};
    const method = (config.method || 'get').toLowerCase();
    if (isAttendanceRequest(config) && method === 'get' && config.cacheKey) {
      const storedResponse = {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
      attendanceCache.set(config.cacheKey, {
        time: Date.now(),
        response: storedResponse,
      });
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log('401 - Session expired');
      alert('Session expired. Please refresh the page or login again.');
    }
    return Promise.reject(error);
  }
);

export default api;
