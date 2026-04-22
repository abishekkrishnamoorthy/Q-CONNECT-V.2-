// d:\projects\QCONNECT(V2.0)\frontend\src\api\httpClient.js
import axios from "axios";
import { useAuthStore } from "../store/authStore";

const baseURL = import.meta.env.VITE_API_BASE_URL;

/**
 * Shared Axios HTTP client configured for Qconnect API.
 */
export const httpClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 12000
});

httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);
