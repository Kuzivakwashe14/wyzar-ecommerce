// backend/lib/auth.js
require('dotenv').config();
const { betterAuth } = require('better-auth');
const { mongodbAdapter } = require('better-auth/adapters/mongodb');
const { organization, twoFactor, admin } = require('better-auth/plugins');
const MongoClient = require('mongodb').MongoClient;
const nodemailer = require('nodemailer');

// MongoDB Client (reuse existing connection or create new one)
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/wyzar-ecommerce');

// Email transporter for 2FA (lazy initialization)
let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return transporter;
};

// Better Auth Configuration
const auth = betterAuth({
  // Database configuration
  database: mongodbAdapter(client.db('wyzar-ecommerce')),

  // Base URL
  baseURL: process.env.BETTER_AUTH_URL,

  // Secret for signing tokens
  secret: process.env.BETTER_AUTH_SECRET,

  // Email and Password authentication
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: false, // Require email verification
    sendEmailVerificationOnSignUp: true,
    async sendVerificationEmail({ user, url }) {
      const emailTransporter = getTransporter();
      await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || `"WyZar" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Verify Your WyZar Account',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to WyZar!</h2>
            <p>Please verify your email address to complete your registration:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link: <a href="${url}">${url}</a>
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              If you didn't create this account, please ignore this email.
            </p>
          </div>
        `,
      });
    },
  },

  // Social Login Providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache
    },
  },

  // User schema extensions for e-commerce
  user: {
    additionalFields: {
      // Zimbabwe-specific phone number
      phone: {
        type: 'string',
        required: false,
        defaultValue: null,
      },
      // Seller status
      isSeller: {
        type: 'boolean',
        required: true,
        defaultValue: false,
      },
      // Email verification
      isEmailVerified: {
        type: 'boolean',
        required: true,
        defaultValue: false,
      },
      // Phone verification
      isPhoneVerified: {
        type: 'boolean',
        required: true,
        defaultValue: false,
      },
      // Account suspension
      isSuspended: {
        type: 'boolean',
        required: true,
        defaultValue: false,
      },
      // Profile image
      image: {
        type: 'string',
        required: false,
        defaultValue: null,
      },
      // User role (buyer, seller, admin)
      role: {
        type: 'string',
        required: true,
        defaultValue: 'buyer',
      },
    },
  },

  // Advanced options
  advanced: {
    // Generate short IDs compatible with MongoDB ObjectId
    generateId: () => {
      const { ObjectId } = require('mongodb');
      return new ObjectId().toString();
    },
  },

  // Trusted origins for CORS
  trustedOrigins: [process.env.FRONTEND_URL, 'http://localhost:3000'],

  // Account linking - allow users to link multiple providers
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
    },
  },

  // Rate limiting for security
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 10, // 10 requests per minute
  },

  // Plugins
  plugins: [
    // Admin plugin for platform management
    admin({
      impersonationSessionDuration: 60 * 60, // 1 hour
      defaultRole: 'buyer',
    }),

    // Two-Factor Authentication
    twoFactor({
      // OTP via email
      otpOptions: {
        async sendOTP({ user, otp }) {
          const emailTransporter = getTransporter();
          await emailTransporter.sendMail({
            from: process.env.EMAIL_FROM || `"WyZar Security" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Your WyZar 2FA Code',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2>Two-Factor Authentication</h2>
                <p>Your verification code is:</p>
                <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
                  ${otp}
                </div>
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  This code expires in 10 minutes. If you didn't request this code, please ignore this email.
                </p>
              </div>
            `,
          });
        },
      },
      // App name for TOTP (appears in Google Authenticator)
      issuer: 'WyZar',
      // Require verification before enabling 2FA
      skipVerificationOnEnable: false,
    }),

    // Organization plugin for Sellers
    organization({
      // Allow users to create organizations (seller accounts)
      allowUserToCreateOrganization: true,

      // Creator becomes owner
      creatorRole: 'owner',

      // Custom roles for seller organizations
      roles: {
        // Organization owner (seller)
        owner: {
          name: 'owner',
          permissions: {
            organization: ['update', 'delete'],
            member: ['create', 'update', 'delete'],
            product: ['create', 'read', 'update', 'delete'],
            order: ['read', 'update'],
          },
        },
        // Organization admin (can manage products)
        admin: {
          name: 'admin',
          permissions: {
            organization: ['read', 'update'],
            member: ['create', 'read'],
            product: ['create', 'read', 'update', 'delete'],
            order: ['read', 'update'],
          },
        },
        // Organization member (limited access)
        member: {
          name: 'member',
          permissions: {
            product: ['read'],
            order: ['read'],
          },
        },
      },
    }),
  ],
});

module.exports = { auth };
