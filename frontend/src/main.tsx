import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n.tsx'
import axios from 'axios'

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const isInvalidToken = error.response?.data?.error === 'Invalid token' || error.response?.data?.message === 'Invalid token';
    if (error.response && (error.response.status === 401 || isInvalidToken)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
