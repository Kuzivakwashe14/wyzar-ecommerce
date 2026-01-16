// frontend/context/AuthContent.tsx
// Compatibility layer: Maps Clerk Auth to existing app structure
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useUser, useAuth as useClerkAuth, useClerk } from "@clerk/nextjs";
import { getCsrfToken, fetchCsrfToken } from '@/lib/csrf';

// Backend API URL for non-auth requests
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

// Create an Axios instance for backend API calls
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for sending cookies
});

// Store reference to getAccessToken for use in interceptor
let getAccessTokenFn: (() => Promise<string | null>) | null = null;

// Add CSRF token and Auth token to all state-changing requests
api.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase();
  
  // Add CSRF token for state-changing requests
  if (method && ['post', 'put', 'delete', 'patch'].includes(method)) {
    try {
      const csrfToken = await getCsrfToken();
      config.headers['X-CSRF-Token'] = csrfToken;
    } catch (error) {
      console.error('Failed to get CSRF token for request:', error);
    }
  }
  
  // Always try to add fresh auth token if available
  if (getAccessTokenFn) {
    try {
      const accessToken = await getAccessTokenFn();
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.error('Failed to get access token for request:', error);
    }
  }
  
  return config;
});

// User type - matches your existing User model (Partial)
interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string | null;
  image?: string | null;
  isSeller?: boolean;
  role?: string;
  sellerDetails?: {
    businessName: string;
  };
  // Add other fields as needed, mapping responsibly
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signOut: () => void;
  refreshSession: () => Promise<void>;
  login: () => void;
  logout: () => void;
  register: () => void;
  axiosInstance: typeof api;
  token: string | null;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { getToken, signOut } = useClerkAuth();
  const clerk = useClerk();
  
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Expose getToken to interceptor
  useEffect(() => {
    getAccessTokenFn = getToken;
    return () => { getAccessTokenFn = null; };
  }, [getToken]);

  useEffect(() => {
    const syncUser = async () => {
        if (isUserLoaded) {
            if (isSignedIn && clerkUser) {
                // Map Clerk user to local User interface
                // Note: Metadata requires separate fetch or custom claims if stored in publicMetadata
                const mappedUser: User = {
                    id: clerkUser.id,
                    email: clerkUser.primaryEmailAddress?.emailAddress || "",
                    emailVerified: true, // Clerk handles this
                    name: clerkUser.fullName,
                    image: clerkUser.imageUrl,
                    // Map custom metadata if available
                    isSeller: (clerkUser.publicMetadata as any)?.isSeller || false,
                    role: (clerkUser.publicMetadata as any)?.role || 'user',
                    sellerDetails: (clerkUser.publicMetadata as any)?.sellerDetails,
                };
                setUser(mappedUser);
                
                try {
                    const t = await getToken();
                    setToken(t);
                    if (t) {
                        api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
                    }
                } catch (e) {
                    console.error("Error getting token", e);
                }
            } else {
                setUser(null);
                setToken(null);
                delete api.defaults.headers.common['Authorization'];
            }
            setLoading(false);
        }
    };
    syncUser();
  }, [isUserLoaded, isSignedIn, clerkUser, getToken]);

  const handleLogin = () => clerk.openSignIn();
  const handleRegister = () => clerk.openSignUp();
  const handleLogout = () => signOut();

  // No-op for refreshSession as Clerk handles it
  const refreshSession = async () => {};

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!isSignedIn,
      loading,
      signOut: handleLogout,
      logout: handleLogout,
      login: handleLogin,
      register: handleRegister,
      refreshSession,
      axiosInstance: api,
      token,
      getAccessToken: getToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = AuthContextProvider;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};

export { api };
