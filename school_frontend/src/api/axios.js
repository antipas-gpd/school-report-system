import axios from 'axios';

// Set REACT_APP_API_URL in Vercel (e.g. https://your-app.up.railway.app/api)
// Falls back to the local backend when running `npm start`.
export const API_URL = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    const isAuthCall = original?.url?.includes('/auth/');
    if (err.response?.status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
          localStorage.setItem('access_token', res.data.access);
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
          original.headers.Authorization = `Bearer ${res.data.access}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
