// In frontend/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// 1. Define the API URL and a utility for API requests
const API_URL = "http://localhost:5000/api";

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
  register: (email: string, password: string, phone: string) => Promise<void>;
}

// 3. Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Create the AuthProvider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 5. Load user function: Gets token from localStorage and fetches user
  const loadUser = async () => {
    const localToken = localStorage.getItem('token');
    if (localToken) {
      setAuthToken(localToken);
      setToken(localToken);
      try {
        const res = await api.get('/auth/me'); // Call our new /me route
        setUser(res.data);
      } catch (err) {
        console.error("Failed to load user", err);
        // If token is invalid, log out
        logout();
      }
    }
    setLoading(false);
  };

  // 6. useEffect to load user on app start
  useEffect(() => {
    loadUser();
  }, []);

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

  // 8. Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setLoading(false);
    // Optional: redirect to login
    window.location.href = '/login';
  };

  // 9. Register function
  const register = async (email: string, password: string, phone: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { email, password, phone });
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
      register
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