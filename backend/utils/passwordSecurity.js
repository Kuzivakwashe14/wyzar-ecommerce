// backend/utils/passwordSecurity.js
/**
 * Password Security Utilities
 * PCI DSS Requirement 8.2.3: Passwords must meet complexity requirements
 */

/**
 * Validate password strength
 * PCI DSS Requirements:
 * - Minimum 12 characters (we use 8 as minimum, recommend 12)
 * - Must contain uppercase and lowercase letters
 * - Must contain numbers
 * - Must contain special characters
 *
 * @param {string} password - The password to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  // Minimum length check
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long (12+ recommended)');
  }

  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  }

  // Common password check (basic)
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'password1', 'admin123', 'welcome', 'letmein', 'monkey'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password');
  }

  return {
    valid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Calculate password strength score (0-100)
 */
const calculatePasswordStrength = (password) => {
  if (!password) return 0;

  let score = 0;

  // Length score (max 40 points)
  score += Math.min(password.length * 3, 40);

  // Character variety (max 60 points)
  if (/[a-z]/.test(password)) score += 10; // lowercase
  if (/[A-Z]/.test(password)) score += 15; // uppercase
  if (/[0-9]/.test(password)) score += 15; // numbers
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 20; // special chars

  // Penalty for common patterns
  if (/(.)\1{2,}/.test(password)) score -= 10; // repeated characters
  if (/^(123|abc|qwe)/i.test(password)) score -= 10; // sequential patterns

  return Math.max(0, Math.min(100, score));
};

/**
 * Get password strength label
 */
const getPasswordStrengthLabel = (score) => {
  if (score < 40) return { label: 'Weak', color: 'red' };
  if (score < 60) return { label: 'Fair', color: 'orange' };
  if (score < 80) return { label: 'Good', color: 'yellow' };
  return { label: 'Strong', color: 'green' };
};

/**
 * Generate a secure random password
 * @param {number} length - Password length (default: 16)
 * @returns {string} - Generated password
 */
const generateSecurePassword = (length = 16) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + special;
  let password = '';

  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Check if password has been compromised (basic check)
 * In production, integrate with haveibeenpwned.com API
 */
const isPasswordCompromised = async (password) => {
  // For now, just check against common passwords
  // TODO: Integrate with Have I Been Pwned API for production
  const commonPasswords = require('./commonPasswords.json').catch(() => []);
  return commonPasswords.includes(password.toLowerCase());
};

/**
 * Validate password doesn't contain user info
 */
const validatePasswordDoesntContainUserInfo = (password, userInfo) => {
  if (!password || !userInfo) return true;

  const lowerPassword = password.toLowerCase();
  const { email, phone, name } = userInfo;

  // Check if password contains email username
  if (email) {
    const emailUsername = email.split('@')[0].toLowerCase();
    if (lowerPassword.includes(emailUsername)) {
      return { valid: false, error: 'Password should not contain your email address' };
    }
  }

  // Check if password contains phone number
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (lowerPassword.includes(cleanPhone) || lowerPassword.includes(cleanPhone.slice(-4))) {
      return { valid: false, error: 'Password should not contain your phone number' };
    }
  }

  // Check if password contains name
  if (name && lowerPassword.includes(name.toLowerCase())) {
    return { valid: false, error: 'Password should not contain your name' };
  }

  return { valid: true };
};

/**
 * Express middleware to validate password strength
 */
const validatePasswordMiddleware = (req, res, next) => {
  const password = req.body.password;
  console.log('Password validation middleware:', { hasPassword: !!password, passwordLength: password?.length });

  if (!password) {
    console.log('Password validation failed: password is required');
    return res.status(400).json({
      success: false,
      msg: 'Password is required'
    });
  }

  const validation = validatePasswordStrength(password);
  console.log('Password strength validation:', { valid: validation.valid, errors: validation.errors, strength: validation.strength });

  if (!validation.valid) {
    console.log('Password validation failed:', validation.errors);
    const errorResponse = {
      success: false,
      msg: 'Password does not meet security requirements',
      errors: validation.errors,
      strength: validation.strength
    };
    console.log('Sending error response:', JSON.stringify(errorResponse));
    return res.status(400).json(errorResponse);
  }

  // Check if password contains user info
  const userInfo = {
    email: req.body.email,
    phone: req.body.phone,
    name: req.body.name
  };

  const userInfoCheck = validatePasswordDoesntContainUserInfo(password, userInfo);
  console.log('User info check:', userInfoCheck);
  
  if (!userInfoCheck.valid) {
    console.log('Password contains user info:', userInfoCheck.error);
    return res.status(400).json({
      success: false,
      msg: userInfoCheck.error
    });
  }

  console.log('Password validation passed');
  next();
};

module.exports = {
  validatePasswordStrength,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  generateSecurePassword,
  isPasswordCompromised,
  validatePasswordDoesntContainUserInfo,
  validatePasswordMiddleware
};
