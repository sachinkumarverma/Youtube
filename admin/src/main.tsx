import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import App from './App'

// Apply saved theme before render to avoid flash
document.documentElement.setAttribute('data-theme', localStorage.getItem('admin_theme') || 'dark');

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const isInvalidToken = error.response?.data?.error === 'Invalid token' || error.response?.data?.message === 'Invalid token';
    if (error.response && (error.response.status === 401 || isInvalidToken)) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
