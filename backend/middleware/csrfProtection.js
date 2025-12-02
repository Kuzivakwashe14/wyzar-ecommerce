// backend/middleware/csrfProtection.js
const csrf = require('csurf');

/**
 * CSRF Protection for E-Commerce
 * Protects against Cross-Site Request Forgery attacks
 */

// Create CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour
  }
});

/**
 * Middleware to attach CSRF token to response
 */
const attachCsrfToken = (req, res, next) => {
  // Set CSRF token in response header and cookie
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: false, // Must be accessible to JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  next();
};

/**
 * Middleware to validate CSRF token
 */
const validateCsrfToken = (req, res, next) => {
  // Get token from header or body
  const token = req.headers['x-csrf-token'] || req.body._csrf;

  if (!token) {
    return res.status(403).json({
      success: false,
      msg: 'CSRF token missing'
    });
  }

  // Token validation is handled by csurf middleware
  next();
};

/**
 * Generate CSRF token endpoint
 */
const getCsrfToken = (req, res) => {
  res.json({
    success: true,
    csrfToken: req.csrfToken()
  });
};

/**
 * Error handler for CSRF errors
 */
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);

  // Log the CSRF violation
  console.warn('CSRF token validation failed:', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    user: req.user?.id
  });

  res.status(403).json({
    success: false,
    msg: 'Invalid CSRF token. Please refresh the page and try again.'
  });
};

module.exports = {
  csrfProtection,
  attachCsrfToken,
  validateCsrfToken,
  getCsrfToken,
  csrfErrorHandler
};
