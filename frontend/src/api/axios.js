import axios from "axios";

// Determine API base URL based on environment
const getBaseURL = () => {
  // Dev: use Vite proxy
  if (import.meta.env.DEV) return "/api";
  // Prod: prefer explicit env, otherwise rely on same-origin rewrites (Vercel)
  return import.meta.env.VITE_API_URL || "/api";
};

const API = axios.create({
  baseURL: getBaseURL(),
  withCredentials: false, // JWT is in Authorization header
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
