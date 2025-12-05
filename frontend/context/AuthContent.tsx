// frontend/context/AuthContent.tsx
// BetterAuth-based Authentication Context
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { authClient } from '@/lib/auth-client';

// Backend API URL for non-auth requests
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

// Create an Axios instance for backend API calls
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for sending cookies
});

// User type - matches your existing User model
interface User {
  id: string;
  _id?: string; // For backward compatibility
  email: string;
  emailVerified: boolean;
  name?: string | null;
  image?: string | null;
  phone?: string;
  isSeller?: boolean;
  isVerified?: boolean;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  isSuspended?: boolean;
  role?: string;
  twoFactorEnabled?: boolean;
  sellerDetails?: {
    businessName: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// BetterAuth session response type
interface BetterAuthSession {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
    [key: string]: unknown; // Allow additional user fields
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

interface AuthContextType {
  user: User | null;
  session: BetterAuthSession | null;
  isAuthenticated: boolean;
  loading: boolean;
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error?: string; twoFactorRequired?: boolean }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  // Social auth
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  // 2FA methods
  enable2FA: (password: string) => Promise<{ totpURI?: string; backupCodes?: string[]; error?: string }>;
  verify2FA: (code: string) => Promise<{ error?: string }>;
  verifyTwoFactorLogin: (code: string, trustDevice?: boolean) => Promise<{ error?: string }>;
  disable2FA: (password: string) => Promise<{ error?: string }>;
  // Session management
  refreshSession: () => Promise<void>;
  // Legacy compatibility
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string) => Promise<void>;
  axiosInstance: typeof api;
  // Token for backward compatibility with backend
  token: string | null;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<BetterAuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Function to load/refresh session
  const loadSession = async () => {
    try {
      const { data, error } = await authClient.getSession();
      if (data && !error) {
        // Map BetterAuth user to our User type
        const userData = data.user as unknown as Record<string, unknown>;
        const mappedUser: User = {
          id: data.user.id,
          _id: data.user.id, // Backward compatibility
          email: data.user.email,
          emailVerified: data.user.emailVerified,
          name: data.user.name,
          image: data.user.image,
          isEmailVerified: data.user.emailVerified,
          role: (userData.role as string) || 'user',
          isSeller: (userData.isSeller as boolean) || false,
          isVerified: (userData.isVerified as boolean) || false,
          isSuspended: (userData.isSuspended as boolean) || false,
          twoFactorEnabled: (userData.twoFactorEnabled as boolean) || false,
        };
        setUser(mappedUser);
        setSession(data as unknown as BetterAuthSession);
        setToken(data.session.token);
        
        // Set token in axios header for backend requests
        api.defaults.headers.common['Authorization'] = `Bearer ${data.session.token}`;
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  // Refresh session function (for use after user data changes)
  const refreshSession = async () => {
    await loadSession();
  };

  // Load session on mount
  useEffect(() => {
    const initSession = async () => {
      await loadSession();
      setLoading(false);
    };
    initSession();
  }, []);

  // Setup axios interceptor for handling auth errors
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error.response?.status;
        
        if (status === 429) {
          console.warn('Rate limited - too many requests');
          return Promise.reject(error);
        }
        
        if (status === 401) {
          // Session expired, clear state
          setUser(null);
          setSession(null);
          setToken(null);
          delete api.defaults.headers.common['Authorization'];
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  // Sign in with email/password
  const signIn = async (email: string, password: string): Promise<{ error?: string; twoFactorRequired?: boolean }> => {
    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        return { error: error.message || 'Sign in failed' };
      }

      // Check if 2FA is required
      if (data && (data as any).twoFactorRedirect) {
        return { twoFactorRequired: true };
      }

      if (data && data.user) {
        const mappedUser: User = {
          id: data.user.id,
          _id: data.user.id,
          email: data.user.email,
          emailVerified: data.user.emailVerified,
          name: data.user.name,
          image: data.user.image,
          isEmailVerified: data.user.emailVerified,
          role: (data.user as unknown as Record<string, unknown>).role as string || 'user',
        };
        setUser(mappedUser);
        setSession(data as unknown as BetterAuthSession);
        setToken(data.token || '');
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token || ''}`;
      }

      return {};
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Sign in failed' };
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string, name?: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name: name || email.split('@')[0],
      });

      if (error) {
        return { error: error.message || 'Sign up failed' };
      }

      if (data) {
        const mappedUser: User = {
          id: data.user.id,
          _id: data.user.id,
          email: data.user.email,
          emailVerified: data.user.emailVerified,
          name: data.user.name,
          image: data.user.image,
          isEmailVerified: data.user.emailVerified,
          role: 'user',
        };
        setUser(mappedUser);
        setSession(data as unknown as BetterAuthSession);
        setToken(data.token || '');
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token || ''}`;
      }

      return {};
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Sign up failed' };
    }
  };

  // Sign out
  const signOutFn = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setUser(null);
      setSession(null);
      setToken(null);
      delete api.defaults.headers.common['Authorization'];
    }
  };

  // Social sign-in with Google
  const signInWithGoogle = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

  // Social sign-in with Facebook
  const signInWithFacebook = async () => {
    await authClient.signIn.social({
      provider: "facebook",
      callbackURL: "/",
    });
  };

  // Enable 2FA
  const enable2FA = async (password: string): Promise<{ totpURI?: string; backupCodes?: string[]; error?: string }> => {
    try {
      const { data, error } = await authClient.twoFactor.enable({
        password,
      });
      if (error) {
        return { error: error.message || 'Failed to enable 2FA' };
      }
      return { 
        totpURI: (data as { totpURI?: string })?.totpURI,
        backupCodes: (data as { backupCodes?: string[] })?.backupCodes 
      };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to enable 2FA' };
    }
  };

  // Verify 2FA
  const verify2FA = async (code: string): Promise<{ error?: string }> => {
    try {
      const { error } = await authClient.twoFactor.verifyTotp({ code });
      if (error) {
        return { error: error.message || 'Invalid 2FA code' };
      }
      return {};
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to verify 2FA' };
    }
  };

  // Verify 2FA during login
  // trustDevice: When true, the device will be trusted for 30 days and won't require 2FA
  const verifyTwoFactorLogin = async (code: string, trustDevice: boolean = false): Promise<{ error?: string }> => {
    try {
      const { data, error } = await authClient.twoFactor.verifyTotp({ 
        code,
        trustDevice, // If true, sets a cookie that skips 2FA for 30 days on this device
      });
      if (error) {
        return { error: error.message || 'Invalid 2FA code' };
      }
      
      // After successful 2FA verification, refresh the session
      await loadSession();
      return {};
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to verify 2FA' };
    }
  };

  // Disable 2FA
  const disable2FA = async (password: string): Promise<{ error?: string }> => {
    try {
      const { error } = await authClient.twoFactor.disable({
        password,
      });
      if (error) {
        return { error: error.message || 'Failed to disable 2FA' };
      }
      return {};
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to disable 2FA' };
    }
  };

  // Legacy login function for backward compatibility
  const login = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (result.error) {
      throw new Error(result.error);
    }
  };

  // Legacy logout function
  const logout = () => {
    signOutFn();
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  };

  // Legacy register function
  const register = async (email: string, password: string) => {
    const result = await signUp(email, password);
    if (result.error) {
      throw new Error(result.error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAuthenticated: !!user && !!session,
      loading,
      signIn,
      signUp,
      signOut: signOutFn,
      signInWithGoogle,
      signInWithFacebook,
      enable2FA,
      verify2FA,
      verifyTwoFactorLogin,
      disable2FA,
      refreshSession,
      login,
      logout,
      register,
      axiosInstance: api,
      token,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook for accessing auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the api instance for use in components
export { api };
