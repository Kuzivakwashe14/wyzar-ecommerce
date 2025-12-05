// BetterAuth Server Configuration
import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { twoFactor } from "better-auth/plugins/two-factor";
import { admin } from "better-auth/plugins/admin";
import { sendVerificationEmail, sendPasswordResetEmail, send2FAEmail } from "./email";

// MongoDB connection setup - include database name in the URI
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = "wyzar-ecommerce";

// Create MongoDB client and connect
const client = new MongoClient(mongoUri);

// Get database instance with explicit database name
const db = client.db(dbName);

export const auth = betterAuth({
  database: mongodbAdapter(db),
  
  // Application URLs
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  
  // Email & Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 6,
    maxPasswordLength: 100,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  
  // Email verification
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
  },
  
  // Social sign-on providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    },
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes cache
    },
  },
  
  // Rate limiting
  rateLimit: {
    enabled: true,
    window: 60, // 60 seconds window
    max: 100, // Max 100 requests per window
    customRules: {
      // Stricter limits for auth endpoints
      "/sign-in/*": {
        window: 60,
        max: 10,
      },
      "/sign-up/*": {
        window: 60,
        max: 5,
      },
      "/forgot-password/*": {
        window: 60,
        max: 3,
      },
    },
  },
  
  // Account settings
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
  
  // User configuration
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
      },
      isPhoneVerified: {
        type: "boolean",
        defaultValue: false,
      },
      isSeller: {
        type: "boolean",
        defaultValue: false,
      },
      isVerified: {
        type: "boolean",
        defaultValue: false,
      },
      isSuspended: {
        type: "boolean",
        defaultValue: false,
      },
      suspensionReason: {
        type: "string",
        required: false,
      },
    },
  },
  
  // Plugins
  plugins: [
    // Two-Factor Authentication
    // Trusted devices are handled via trustDevice parameter when verifying 2FA
    // When trustDevice: true is passed to verifyTotp/verifyOtp, the device is trusted for 30 days
    twoFactor({
      issuer: "WyZar",
      totpOptions: {
        period: 30,
        digits: 6,
      },
      otpOptions: {
        sendOTP: async ({ user, otp }) => {
          await send2FAEmail(user.email, otp);
        },
      },
      skipVerificationOnEnable: false,
    }),
    
    // Admin plugin for role-based access
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
  
  // Trusted origins for CORS
  trustedOrigins: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    process.env.BACKEND_URL || "http://localhost:5000",
  ],
});

// Export auth types
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
