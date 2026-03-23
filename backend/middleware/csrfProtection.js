// backend/middleware/csrfProtection.js
const crypto = require('crypto');

/**
 * CSRF Protection for E-Commerce
 * Self-contained implementation using Node's crypto module.
 * No csurf dependency required.
 *
 * Token model:
 *  - Tokens are stored in a server-side Set (valid for 1 hour).
 *  - attachCsrfToken generates a token, puts it in res.locals.csrfToken and
 *    the XSRF-TOKEN cookie.
 *  - validateCsrf checks that a submitted token exists in the valid Set.
 *  - csrfProtection combines both: always issues a new XSRF-TOKEN cookie
 *    (even on rejection) and validates the token submitted with the request.
 */

// Valid token store: token string → expiry timestamp
const validTokens = new Map();

const TOKEN_TTL_MS = 3600_000; // 1 hour

/** Purge expired tokens to avoid memory growth */
function purgeExpired() {
  const now = Date.now();
  for (const [token, expiry] of validTokens) {
    if (expiry < now) validTokens.delete(token);
  }
}

/** Generate a random CSRF token and register it */
function generateToken() {
  purgeExpired();
  const token = crypto.randomBytes(32).toString('hex');
  validTokens.set(token, Date.now() + TOKEN_TTL_MS);
  return token;
}

/** Check whether a submitted token is valid (exists and not expired) */
function isValidToken(token) {
  if (!token) return false;
  const expiry = validTokens.get(token);
  if (!expiry) return false;
  if (expiry < Date.now()) {
    validTokens.delete(token);
    return false;
  }
  return true;
}

/** Write the XSRF-TOKEN cookie (JS-readable) */
function setXsrfCookie(res, token) {
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // must be readable by client JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_TTL_MS
  });
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * attachCsrfToken
 * Generates a new token, exposes it via res.locals.csrfToken and the
 * XSRF-TOKEN cookie.  Does NOT validate anything.
 */
const attachCsrfToken = (req, res, next) => {
  const token = generateToken();
  res.locals.csrfToken = token;
  setXsrfCookie(res, token);
  next();
};

/**
 * validateCsrf
 * Skips GET / HEAD / OPTIONS.  For all other methods it checks the token in:
 *   - X-CSRF-Token  header (preferred)
 *   - X-XSRF-Token  header
 *   - req.body._csrf field
 */
const validateCsrf = (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();

  const clientToken =
    req.headers['x-csrf-token'] ||
    req.headers['x-xsrf-token'] ||
    (req.body && req.body._csrf);

  if (!clientToken) {
    return res.status(403).json({ success: false, msg: 'CSRF token missing' });
  }

  if (!isValidToken(clientToken)) {
    return res.status(403).json({
      success: false,
      msg: 'Invalid CSRF token. Please refresh the page and try again.'
    });
  }

  next();
};

/**
 * csrfProtection  (combined: attach + validate)
 *
 * Always issues a fresh XSRF-TOKEN cookie so the caller can learn the new
 * token even from a 403 response.  Validates the token submitted with *this*
 * request before letting it through.
 */
const csrfProtection = (req, res, next) => {
  // Always emit a fresh token in the response cookie.
  const freshToken = generateToken();
  setXsrfCookie(res, freshToken);
  res.locals.csrfToken = freshToken;

  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();

  const clientToken =
    req.headers['x-csrf-token'] ||
    req.headers['x-xsrf-token'] ||
    (req.body && req.body._csrf);

  if (!clientToken) {
    return res.status(403).json({ success: false, msg: 'CSRF token missing' });
  }

  if (!isValidToken(clientToken)) {
    return res.status(403).json({
      success: false,
      msg: 'Invalid CSRF token. Please refresh the page and try again.'
    });
  }

  next();
};

/**
 * getCsrfToken  – endpoint helper that generates and returns a CSRF token.
 */
const getCsrfToken = (req, res) => {
  const token = generateToken();
  res.locals.csrfToken = token;
  setXsrfCookie(res, token);
  res.json({ success: true, csrfToken: token });
};

/**
 * csrfErrorHandler  – kept for backwards-compatibility with csurf error codes.
 */
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);

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

// Alias for backwards compatibility
const validateCsrfToken = validateCsrf;

module.exports = {
  csrfProtection,
  attachCsrfToken,
  validateCsrf,
  validateCsrfToken,
  getCsrfToken,
  csrfErrorHandler
};
