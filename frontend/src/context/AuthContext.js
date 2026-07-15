import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext(null);
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refresh_token");
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("email");
    const storedName = localStorage.getItem("name");
    const name = storedName || (email ? email.split('@')[0] : null);
    if (token && role && userId) {
      setUser({ token, refreshToken, role, userId, email, name });
    }
    setLoading(false);
  }, []);

  const login = (token, role, userId, email, refreshToken = null, name = null) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("userId", userId);
    localStorage.setItem("email", email);
    localStorage.setItem("name", name || email.split('@')[0]);
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }
    setUser({ token, refreshToken, role, userId, email, name });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    setUser(null);
  };

  // Automatically refresh the access token when it expires
  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      logout();
      return null;
    }
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/refresh`, {
        refresh_token: refreshToken
      });
      const { token, refresh_token, role, user_id, email } = response.data;
      login(token, role, user_id, email, refresh_token);
      return token;
    } catch (error) {
      logout();
      return null;
    }
  }, []);

  // Axios interceptor — automatically refreshes token on 401 errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry && !original.url?.includes("/auth/")) {
          original._retry = true;
          const newToken = await refreshAccessToken();
          if (newToken) {
            original.headers["Authorization"] = `Bearer ${newToken}`;
            return axios(original);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [refreshAccessToken]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
