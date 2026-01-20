// frontend/context/AuthContent.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/nextjs';
import axios from 'axios';

// 1. Define the API URL and create Axios instance
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

// 2. Define types for our context
interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  isSeller: boolean;
  isVerified: boolean;
  role: string;
  sellerDetails?: {
    businessName: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => void;
  login: () => void;
  refreshUser: () => Promise<void>;
  axiosInstance: typeof api;
}

// 3. Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Create the AuthProvider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken, signOut } = useClerkAuth();
  const { openSignIn } = useClerk();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Setup axios interceptor to add Clerk token to requests
  useEffect(() => {
    const interceptor = api.interceptors.request.use(
      async (config) => {
        if (isSignedIn) {
          try {
            const token = await getToken();
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          } catch (error) {
            console.error('Failed to get auth token:', error);
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [isSignedIn, getToken]);

  // Load user data from backend
  const loadUser = useCallback(async () => {
    if (!clerkLoaded) return;
    
    if (!isSignedIn || !clerkUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (error: any) {
      // If 401, it might mean user doesn't exist yet (syncing) or token invalid
      if (error.response?.status !== 401) {
        console.error('Failed to load user:', error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [clerkLoaded, isSignedIn, clerkUser, getToken]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  // Load user when Clerk state changes
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Logout function
  const logout = useCallback(() => {
    signOut();
    setUser(null);
  }, [signOut]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user && !!isSignedIn,
      loading: !clerkLoaded || loading,
      logout,
      login: () => openSignIn(),
      refreshUser,
      axiosInstance: api
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// 5. Create a custom hook for easy access to the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 6. Export the pre-configured 'api' instance
export { api };
