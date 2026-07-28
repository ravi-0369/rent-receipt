import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Request interceptor — attach JWT
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rrm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rrm_token');
      localStorage.removeItem('rrm_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
