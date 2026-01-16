"use client";

import { useEffect, useRef } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { useAuth } from "@/context/AuthContent";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

/**
 * UserSync component - syncs Clerk user with backend database
 * This runs silently in the background after sign-in
 */
export default function UserSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useClerkAuth();
  const { refreshUser } = useAuth();
  const hasSynced = useRef(false);

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !isSignedIn || !user || hasSynced.current) return;

      try {
        const token = await getToken();
        
        await axios.post(
          `${API_URL}/auth/clerk-sync`,
          {
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        hasSynced.current = true;
        console.log("User synced with backend successfully");
        
        // Refresh local user data to ensure we have the latest from backend
        await refreshUser();
      } catch (error) {
        console.error("Failed to sync user with backend:", error);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user, getToken, refreshUser]);

  // This component doesn't render anything
  return null;
}
