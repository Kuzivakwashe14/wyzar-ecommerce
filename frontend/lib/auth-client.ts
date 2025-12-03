// frontend/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';
import { organizationClient, twoFactorClient, inferAdditionalFields, adminClient } from 'better-auth/client/plugins';

// Base URL for Better Auth
const baseURL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/better-auth';

export const authClient = createAuthClient({
  baseURL,

  plugins: [
    // Admin plugin for platform management
    adminClient(),
    // Infer additional user fields
    inferAdditionalFields({
      user: {
        phone: { type: 'string', required: false },
        isSeller: { type: 'boolean', required: true },
        isEmailVerified: { type: 'boolean', required: true },
        isPhoneVerified: { type: 'boolean', required: true },
        isSuspended: { type: 'boolean', required: true },
        image: { type: 'string', required: false },
        role: { type: 'string', required: true },
      },
    }),

    // Two-Factor Authentication client
    twoFactorClient({
      // Redirect to 2FA page when required
      twoFactorPage: '/auth/verify-2fa',
    }),

    // Organization client
    organizationClient(),
  ],
});

// Export convenience hooks and methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  user,
  organization,
  twoFactor,
  admin,
} = authClient;

// Social login using Better Auth's built-in signIn method
export const socialLogin = {
  google: () => {
    signIn.social({
      provider: 'google',
      callbackURL: window.location.origin + '/auth/callback',
    });
  },
};

// Type exports for TypeScript
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
export type Organization = typeof authClient.$Infer.Session.user.organization;
