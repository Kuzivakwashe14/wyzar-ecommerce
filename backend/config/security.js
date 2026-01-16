// backend/config/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// Removed: express-mongo-sanitize (no longer needed with PostgreSQL)
const hpp = require('hpp');
const cors = require('cors');

/**
 * Configure Helmet for security headers
 * For API-only backend, we disable CSP since it's meant for serving HTML
 */
const helmetConfig = helmet({
  contentSecurityPolicy: false, // Disable for API-only backend (enable for HTML serving)
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/**
 * Configure CORS with proper restrictions
 */
const getCorsConfig = () => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173']; // Default for development

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    exposedHeaders: ['x-auth-token'],
    maxAge: 600 // Cache preflight requests for 10 minutes
  });
};

/**
 * Rate limiting for authentication routes (stricter)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: { msg: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
});

/**
 * Rate limiting for OTP requests (prevent spam)
 */
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 OTP requests per windowMs
  message: { msg: 'Too many OTP requests, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General rate limiting for all routes
 * More lenient for browsing/shopping
 */
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: process.env.NODE_ENV === 'development' ? 1000 : 200, // Higher limit in dev
  message: { msg: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for static files and product browsing in development
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') {
      // Skip rate limiting for GET requests to products in development
      if (req.method === 'GET' && req.path.includes('/products')) {
        return true;
      }
    }
    return false;
  }
});

/**
 * Rate limiting for order creation (prevent spam orders)
 */
const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 order creations per minute
  message: { msg: 'Too many orders created, please try again in a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for search queries
 */
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 searches per minute
  message: { msg: 'Too many search requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for message sending
 */
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 messages per minute
  message: { msg: 'Too many messages sent, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for review creation
 */
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 reviews per 15 minutes
  message: { msg: 'Too many reviews submitted, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for file uploads (bulk CSV, images)
 */
const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 uploads per 5 minutes
  message: { msg: 'Too many file uploads, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for seller applications (prevent abuse)
 */
const sellerAppLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 applications per hour
  message: { msg: 'Too many seller applications, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * HPP (HTTP Parameter Pollution) protection
 */
const hppConfig = hpp({
  whitelist: ['price', 'rating'] // Allow duplicate query params for these fields
});

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * Cookie security configuration
 */
const cookieConfig = {
  httpOnly: true, // Prevent JavaScript access to cookies
  secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
  sameSite: 'strict', // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

module.exports = {
  helmetConfig,
  getCorsConfig,
  authLimiter,
  otpLimiter,
  generalLimiter,
  orderLimiter,
  searchLimiter,
  messageLimiter,
  reviewLimiter,
  uploadLimiter,
  sellerAppLimiter,
  hppConfig,
  securityHeaders,
  cookieConfig
};
