/**
 * CSRF Protection Middleware
 * Validates CSRF tokens on state-changing requests
 */

const {
  generateCsrfToken,
  validateCsrfToken,
  invalidateCsrfToken
} = require('../utils/csrfToken');

/**
 * Middleware to generate and attach CSRF token to response
 * Should be applied to routes that render forms or return token to client
 */
function attachCsrfToken(req, res, next) {
  try {
    // Get session ID from JWT or session
    const sessionId = req.user?.id || req.sessionID || 'anonymous';

    // Generate CSRF token
    const csrfToken = generateCsrfToken(sessionId);

    // Attach token to response (can be sent as cookie or in response body)
    res.locals.csrfToken = csrfToken;

    // Optionally set as cookie
    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false, // Must be readable by JavaScript for AJAX requests
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    next();
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error generating security token'
    });
  }
}

/**
 * Middleware to validate CSRF token on state-changing requests
 * Should be applied to POST, PUT, DELETE, PATCH routes
 */
function validateCsrf(req, res, next) {
  // Skip CSRF validation for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  try {
    // Get CSRF token from header or body
    const csrfToken = req.headers['x-csrf-token'] || 
                      req.headers['x-xsrf-token'] ||
                      req.body._csrf;

    if (!csrfToken) {
      return res.status(403).json({
        success: false,
        msg: 'CSRF token missing'
      });
    }

    // Get session ID
    const sessionId = req.user?.id || req.sessionID || 'anonymous';

    // Validate token
    const isValid = validateCsrfToken(csrfToken, sessionId);

    if (!isValid) {
      return res.status(403).json({
        success: false,
        msg: 'Invalid or expired CSRF token'
      });
    }

    // Token is valid - optionally invalidate it (one-time use)
    // invalidateCsrfToken(csrfToken); // Uncomment for one-time tokens

    next();
  } catch (error) {
    console.error('CSRF validation error:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error validating security token'
    });
  }
}

/**
 * Combined middleware: attach and validate CSRF token
 * Use this for routes that need both generation and validation
 */
function csrfProtection(req, res, next) {
  // First attach token
  attachCsrfToken(req, res, (err) => {
    if (err) return next(err);

    // Then validate on state-changing requests
    validateCsrf(req, res, next);
  });
}

module.exports = {
  attachCsrfToken,
  validateCsrf,
  csrfProtection
};