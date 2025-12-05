// BetterAuth Client Configuration
import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    twoFactorClient(),
    adminClient(),
  ],
});

// Export commonly used functions
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  // Social sign-in methods
  signIn: { social: signInWithSocial },
} = authClient;

// Helper for Google sign-in
export const signInWithGoogle = () => {
  return authClient.signIn.social({
    provider: "google",
    callbackURL: "/",
  });
};

// Helper for Facebook sign-in
export const signInWithFacebook = () => {
  return authClient.signIn.social({
    provider: "facebook",
    callbackURL: "/",
  });
};

// Two-Factor Authentication helpers
export const twoFactor = authClient.twoFactor;

// Admin helpers
export const adminHelpers = authClient.admin;
