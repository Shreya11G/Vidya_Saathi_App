// src/api/api.js
import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // send cookies with requests if needed
});

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
