import axios from 'axios';
import { BACKEND_HTTP } from "./backend_urls";

const API = axios.create({
  baseURL: BACKEND_HTTP,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${BACKEND_HTTP}/accounts/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;

          localStorage.setItem('accessToken', access);

          originalRequest.headers.Authorization = `Bearer ${access}`;

          return API(originalRequest);
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default API;
