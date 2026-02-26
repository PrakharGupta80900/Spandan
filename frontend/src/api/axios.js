import axios from "axios";

const API = axios.create({
  baseURL: "/api",
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
