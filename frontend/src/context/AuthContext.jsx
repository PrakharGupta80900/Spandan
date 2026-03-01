import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const { data } = await API.get("/auth/me");
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      localStorage.removeItem('token');
      delete API.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('token');
      delete API.defaults.headers.common['Authorization'];
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [fetchUser]);

  const login = async (email, password) => {
    const { data } = await API.post("/auth/login", { email, password });
    localStorage.setItem('token', data.token);
    API.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data);
    return data;
  };

  const sendSignupOtp = async (formData) => {
    const { data } = await API.post("/auth/signup/send-otp", formData);
    return data;
  };

  const verifySignupOtp = async (formData, otp) => {
    const { data } = await API.post("/auth/signup/verify-otp", { ...formData, otp });
    localStorage.setItem('token', data.token);
    API.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data);
    return data;
  };

  const logout = async () => {
    try {
      await API.post("/auth/logout");
    } catch {
      // JWT is stateless, so server logout is optional
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      delete API.defaults.headers.common['Authorization'];
    }
  };

  const refreshUser = () => fetchUser();

  return (
    <AuthContext.Provider
      value={{ user, loading, login, sendSignupOtp, verifySignupOtp, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
