// backend/utils/accountLockout.js
/**
 * Account Lockout Protection
 * PCI DSS Requirement 8.1.6: Limit repeated access attempts by locking out the user ID
 * after not more than six attempts
 */

// In-memory store for login attempts (use Redis in production)
const loginAttempts = new Map();
const lockedAccounts = new Map();

const MAX_ATTEMPTS = 5; // Lock after 5 failed attempts
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes window for attempts

/**
 * Record a failed login attempt
 * @param {string} identifier - Email or phone number
 * @returns {Object} - { locked: boolean, attemptsLeft: number, lockoutTime: number }
 */
const recordFailedAttempt = (identifier) => {
  const now = Date.now();
  const key = identifier.toLowerCase();

  // Check if already locked
  if (isAccountLocked(identifier)) {
    const lockInfo = lockedAccounts.get(key);
    return {
      locked: true,
      attemptsLeft: 0,
      lockoutTime: lockInfo.unlocksAt,
      message: `Account locked. Try again in ${Math.ceil((lockInfo.unlocksAt - now) / 60000)} minutes`
    };
  }

  // Get current attempts
  let attempts = loginAttempts.get(key) || [];

  // Remove attempts older than the window
  attempts = attempts.filter(time => time > now - ATTEMPT_WINDOW);

  // Add new attempt
  attempts.push(now);
  loginAttempts.set(key, attempts);

  // Check if should lock
  if (attempts.length >= MAX_ATTEMPTS) {
    const unlocksAt = now + LOCKOUT_DURATION;
    lockedAccounts.set(key, {
      lockedAt: now,
      unlocksAt,
      attempts: attempts.length
    });

    // Clear attempts
    loginAttempts.delete(key);

    return {
      locked: true,
      attemptsLeft: 0,
      lockoutTime: unlocksAt,
      message: `Account locked due to too many failed attempts. Try again in ${Math.ceil(LOCKOUT_DURATION / 60000)} minutes`
    };
  }

  return {
    locked: false,
    attemptsLeft: MAX_ATTEMPTS - attempts.length,
    message: `${MAX_ATTEMPTS - attempts.length} attempts remaining before lockout`
  };
};

/**
 * Check if account is locked
 * @param {string} identifier - Email or phone number
 * @returns {boolean}
 */
const isAccountLocked = (identifier) => {
  const key = identifier.toLowerCase();
  const lockInfo = lockedAccounts.get(key);

  if (!lockInfo) return false;

  const now = Date.now();

  // Check if lockout has expired
  if (now >= lockInfo.unlocksAt) {
    lockedAccounts.delete(key);
    loginAttempts.delete(key);
    return false;
  }

  return true;
};

/**
 * Get lockout information
 * @param {string} identifier - Email or phone number
 * @returns {Object|null}
 */
const getLockoutInfo = (identifier) => {
  const key = identifier.toLowerCase();
  const lockInfo = lockedAccounts.get(key);

  if (!lockInfo) return null;

  const now = Date.now();
  const remainingTime = lockInfo.unlocksAt - now;

  if (remainingTime <= 0) {
    lockedAccounts.delete(key);
    return null;
  }

  return {
    locked: true,
    remainingMinutes: Math.ceil(remainingTime / 60000),
    unlocksAt: new Date(lockInfo.unlocksAt).toISOString()
  };
};

/**
 * Clear login attempts for a user (after successful login)
 * @param {string} identifier - Email or phone number
 */
const clearLoginAttempts = (identifier) => {
  const key = identifier.toLowerCase();
  loginAttempts.delete(key);
  lockedAccounts.delete(key);
};

/**
 * Manually unlock an account (admin action)
 * @param {string} identifier - Email or phone number
 */
const unlockAccount = (identifier) => {
  const key = identifier.toLowerCase();
  lockedAccounts.delete(key);
  loginAttempts.delete(key);
  return { success: true, message: 'Account unlocked successfully' };
};

/**
 * Get all currently locked accounts (admin view)
 */
const getLockedAccounts = () => {
  const now = Date.now();
  const locked = [];

  for (const [identifier, lockInfo] of lockedAccounts.entries()) {
    if (lockInfo.unlocksAt > now) {
      locked.push({
        identifier,
        lockedAt: new Date(lockInfo.lockedAt).toISOString(),
        unlocksAt: new Date(lockInfo.unlocksAt).toISOString(),
        remainingMinutes: Math.ceil((lockInfo.unlocksAt - now) / 60000),
        attempts: lockInfo.attempts
      });
    }
  }

  return locked;
};

/**
 * Express middleware to check account lockout
 */
const checkAccountLockout = (req, res, next) => {
  const identifier = req.body.email || req.body.phone;

  if (!identifier) {
    return res.status(400).json({
      success: false,
      msg: 'Email or phone number required'
    });
  }

  const lockInfo = getLockoutInfo(identifier);

  if (lockInfo) {
    return res.status(429).json({
      success: false,
      msg: `Account temporarily locked due to too many failed login attempts. Please try again in ${lockInfo.remainingMinutes} minute(s).`,
      locked: true,
      unlocksAt: lockInfo.unlocksAt,
      remainingMinutes: lockInfo.remainingMinutes
    });
  }

  next();
};

/**
 * Cleanup expired lockouts (run periodically)
 */
const cleanupExpiredLockouts = () => {
  const now = Date.now();

  for (const [key, lockInfo] of lockedAccounts.entries()) {
    if (lockInfo.unlocksAt <= now) {
      lockedAccounts.delete(key);
    }
  }

  for (const [key, attempts] of loginAttempts.entries()) {
    const validAttempts = attempts.filter(time => time > now - ATTEMPT_WINDOW);
    if (validAttempts.length === 0) {
      loginAttempts.delete(key);
    } else {
      loginAttempts.set(key, validAttempts);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredLockouts, 5 * 60 * 1000);

module.exports = {
  recordFailedAttempt,
  isAccountLocked,
  getLockoutInfo,
  clearLoginAttempts,
  unlockAccount,
  getLockedAccounts,
  checkAccountLockout,
  MAX_ATTEMPTS,
  LOCKOUT_DURATION
};
