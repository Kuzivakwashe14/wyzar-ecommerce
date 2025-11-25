// backend/config/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
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
 * MongoDB sanitization to prevent NoSQL injection
 * Removes $ and . from user input
 * Note: In Express 5, we can't sanitize req.query (read-only), so we only sanitize body and params
 */
const mongoSanitizeConfig = mongoSanitize({
  replaceWith: '_',
  allowDots: false,
  // Express 5 compatibility: only sanitize body and params, skip query
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized key: ${key} in request from ${req.ip}`);
  },
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
  mongoSanitizeConfig,
  hppConfig,
  securityHeaders,
  cookieConfig
};
