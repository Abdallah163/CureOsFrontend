// api.js — يُستخدم في كل المكوّنات
// تأكد أن REACT_APP_API_URL مضبوط في Hostinger على رابط Railway مثل:
// https://cureos-backend.up.railway.app

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://cureosbackend-production.up.railway.app',
  timeout: 30000,
});

// أضف التوكن تلقائياً في كل طلب
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// إعادة توجيه للـ login عند انتهاء الجلسة
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;