import axios from 'axios';
import { toast } from 'sonner';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token_finance_nouh');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const errorMessage = error.response?.data?.message || error.response?.data?.error;
    toast.error(errorMessage)
    if (errorMessage) {
      toast.error(errorMessage);
    } else if (error.message && error.response?.status !== 401) {
      toast.error(error.message);
    } else if (error.response?.status === 401) {
      toast.error('انتهت الجلسة، الرجاء تسجيل الدخول مجدداً');
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token_finance_nouh');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);
