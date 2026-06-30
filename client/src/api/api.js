// src/api/api.js
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Shared instance for explicit imports
const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Keep legacy `import axios from 'axios'` calls working across the app
axios.defaults.baseURL = baseURL;
axios.defaults.withCredentials = true;

// Request interceptor (optional, e.g., for adding auth headers)
api.interceptors.request.use(
  (config) => {
    // You can add token or other headers here if required
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (optional, e.g., for global error handling)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle global errors here if needed
    return Promise.reject(error);
  }
);

export default api;
