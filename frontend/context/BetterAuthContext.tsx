// frontend/context/BetterAuthContext.tsx
"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession } from '@/lib/auth-client';
import type { Session, User } from '@/lib/auth-client';

// Define the context type
interface BetterAuthContextType {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isPending: boolean;
  error: Error | null;
}

// Create the context
const BetterAuthContext = createContext<BetterAuthContextType | undefined>(undefined);

// Provider component
export const BetterAuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending, error } = useSession();

  const value: BetterAuthContextType = {
    session: session || null,
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isPending,
    error: error || null,
  };

  return (
    <BetterAuthContext.Provider value={value}>
      {children}
    </BetterAuthContext.Provider>
  );
};

// Custom hook to use the Better Auth context
export const useBetterAuth = () => {
  const context = useContext(BetterAuthContext);
  if (context === undefined) {
    throw new Error('useBetterAuth must be used within a BetterAuthProvider');
  }
  return context;
};
