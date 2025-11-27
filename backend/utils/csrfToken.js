/**
 * CSRF Token Generation and Validation
 * Provides protection against Cross-Site Request Forgery attacks
 */

const crypto = require('crypto');

// In-memory token store (use Redis in production)
const tokenStore = new Map();

// Token configuration
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds
const TOKEN_LENGTH = 32; // bytes

// Store interval ID so it can be cleared
let cleanupIntervalId = null;

/**
 * Generate a CSRF token for a session
 */
function generateCsrfToken(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is required to generate CSRF token');
  }

  const token = crypto.randomBytes(TOKEN_LENGTH).toString('hex');

  const tokenData = {
    sessionId,
    createdAt: Date.now(),
    expiresAt: Date.now() + TOKEN_EXPIRY
  };

  tokenStore.set(token, tokenData);
  cleanupExpiredTokens();

  return token;
}

/**
 * Validate a CSRF token
 */
function validateCsrfToken(token, sessionId) {
  if (!token || !sessionId) {
    return false;
  }

  const tokenData = tokenStore.get(token);

  if (!tokenData) {
    return false;
  }

  if (Date.now() > tokenData.expiresAt) {
    tokenStore.delete(token);
    return false;
  }

  if (tokenData.sessionId !== sessionId) {
    return false;
  }

  return true;
}

/**
 * Invalidate a CSRF token
 */
function invalidateCsrfToken(token) {
  if (token) {
    tokenStore.delete(token);
  }
}

/**
 * Invalidate all tokens for a session
 */
function invalidateSessionTokens(sessionId) {
  for (const [token, data] of tokenStore.entries()) {
    if (data.sessionId === sessionId) {
      tokenStore.delete(token);
    }
  }
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (now > data.expiresAt) {
      tokenStore.delete(token);
    }
  }
}

/**
 * Get token store size
 */
function getTokenStoreSize() {
  return tokenStore.size;
}

/**
 * Start automatic cleanup interval
 */
function startCleanupInterval() {
  if (!cleanupIntervalId) {
    cleanupIntervalId = setInterval(cleanupExpiredTokens, 10 * 60 * 1000);
    // Allow Node.js to exit even if interval is running
    if (cleanupIntervalId.unref) {
      cleanupIntervalId.unref();
    }
  }
}

/**
 * Stop automatic cleanup interval (for testing)
 */
function stopCleanupInterval() {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}

// Start cleanup interval when module loads (only in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  startCleanupInterval();
}

module.exports = {
  generateCsrfToken,
  validateCsrfToken,
  invalidateCsrfToken,
  invalidateSessionTokens,
  getTokenStoreSize,
  startCleanupInterval,
  stopCleanupInterval,
  TOKEN_EXPIRY
};