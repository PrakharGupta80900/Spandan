import axios from "axios";

// Determine API base URL based on environment
const getBaseURL = () => {
  // In development, use the Vite proxy
  if (import.meta.env.DEV) {
    return "/api";
  }
  // In production, use the Render backend URL
  return import.meta.env.VITE_API_URL || "https://your-backend.onrender.com/api";
};

const API = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

// Response interceptor for global error handling
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export default API;
