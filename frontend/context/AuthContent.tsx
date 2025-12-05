// In frontend/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// 1. Define the API URL and a utility for API requests
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

// Create an Axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Utility to set the global auth token for Axios
const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete api.defaults.headers.common['x-auth-token'];
  }
};

// 2. Define types for our context
interface User {
  _id: string;
  email: string;
  phone: string;
  isSeller: boolean;
  isVerified: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  role: string;
  sellerDetails?: {
    businessName: string;
  };
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string) => Promise<void>;
  axiosInstance: typeof api;
}

// 3. Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Create the AuthProvider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 8. Logout function - defined first so it can be used in interceptor
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setLoading(false);
    // Only redirect if we're not already on the login page
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }, []);

  // Setup axios interceptor for handling 401 errors
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const url = error.config?.url || '';
        
        // Handle 429 (Too Many Requests) - don't logout, just show error
        if (status === 429) {
          console.warn('Rate limited - too many requests');
          // Don't logout on rate limiting
          return Promise.reject(error);
        }
        
        // Only logout on 401 if it's not a login/register request
        if (status === 401) {
          // Don't logout for auth endpoints (login, register, etc.)
          if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
            console.warn('Session expired or invalid token');
            // Don't auto-logout, just clear the token silently
            // The user will be redirected when they try to access protected content
            localStorage.removeItem('token');
            setAuthToken(null);
            setToken(null);
            setUser(null);
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  // 5. Load user function: Gets token from localStorage and fetches user
  const loadUser = useCallback(async () => {
    const localToken = localStorage.getItem('token');
    if (localToken) {
      setAuthToken(localToken);
      setToken(localToken);
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err: any) {
        console.error("Failed to load user:", err?.response?.data?.msg || err.message);
        // Only clear token, don't force redirect
        localStorage.removeItem('token');
        setAuthToken(null);
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  // 6. useEffect to load user on app start
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // 7. Login function
  const login = async (token: string) => {
    setLoading(true);
    localStorage.setItem('token', token);
    setAuthToken(token);
    setToken(token);
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error("Failed to login/load user", err);
    }
    setLoading(false);
  };

  // 9. Register function
  const register = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { email, password });
      const { token } = res.data;

      // After successful registration, log the user in
      await login(token);
    } catch (err) {
      setLoading(false);
      throw err; // Re-throw to handle in the component
    }
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      isAuthenticated: !!token && !!user, // True if token and user exist
      loading,
      login,
      logout,
      register,
      axiosInstance: api
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 9. Create a custom hook for easy access to the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 10. Export the pre-configured 'api' instance
export { api };
