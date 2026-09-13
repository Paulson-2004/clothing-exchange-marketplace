import axios from 'axios';

// Central axios instance used by every API call in the app.
// `withCredentials: true` is required so the httpOnly JWT cookie
// (set by the backend during login) is sent with each request across domains.
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const baseURL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl.replace(/\/+$/, '')}/api`;

const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
});

export default axiosClient;
