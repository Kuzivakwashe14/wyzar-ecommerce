/**
 * Input Validation Utilities
 * Provides comprehensive validation for user inputs across the application
 */

const validator = require('validator');

/**
 * Validation configuration
 */
const CONFIG = {
  email: {
    maxLength: 254,
    allowedDomains: null, // null = all domains allowed
  },
  password: {
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  phone: {
    minLength: 10,
    maxLength: 15,
  },
  name: {
    minLength: 2,
    maxLength: 100,
  },
  text: {
    maxLength: 5000,
  },
  url: {
    protocols: ['http', 'https'],
    requireProtocol: true,
  }
};

/**
 * Email validation
 */
function validateEmail(email) {
  const errors = [];

  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  if (typeof email !== 'string') {
    errors.push('Email must be a string');
    return { isValid: false, errors };
  }

  // Sanitize
  const sanitized = email.trim().toLowerCase();

  // Length check
  if (sanitized.length > CONFIG.email.maxLength) {
    errors.push(`Email must not exceed ${CONFIG.email.maxLength} characters`);
  }

  // Format validation
  if (!validator.isEmail(sanitized)) {
    errors.push('Invalid email format');
  }

  // Domain whitelist (if configured)
  if (CONFIG.email.allowedDomains && errors.length === 0) {
    const domain = sanitized.split('@')[1];
    if (!CONFIG.email.allowedDomains.includes(domain)) {
      errors.push(`Email domain ${domain} is not allowed`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : null
  };
}

/**
 * Password strength validation
 */
function validatePassword(password) {
  const errors = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (typeof password !== 'string') {
    errors.push('Password must be a string');
    return { isValid: false, errors };
  }

  // Length checks
  if (password.length < CONFIG.password.minLength) {
    errors.push(`Password must be at least ${CONFIG.password.minLength} characters long`);
  }

  if (password.length > CONFIG.password.maxLength) {
    errors.push(`Password must not exceed ${CONFIG.password.maxLength} characters`);
  }

  // Complexity requirements
  if (CONFIG.password.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (CONFIG.password.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (CONFIG.password.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (CONFIG.password.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Common password check
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty123', 'admin123',
    'letmein', 'welcome123', 'monkey123', '1q2w3e4r', 'password1'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
}

/**
 * Calculate password strength score (0-4)
 */
function calculatePasswordStrength(password) {
  let strength = 0;
  
  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

  return Math.min(strength, 4); // Cap at 4 (excellent)
}

/**
 * Phone number validation
 */
function validatePhone(phone) {
  const errors = [];

  if (!phone) {
    errors.push('Phone number is required');
    return { isValid: false, errors };
  }

  if (typeof phone !== 'string') {
    errors.push('Phone number must be a string');
    return { isValid: false, errors };
  }

  // Sanitize: remove spaces, dashes, parentheses
  const sanitized = phone.replace(/[\s\-()]/g, '');

  // Check if it starts with + (international format)
  const hasPlus = sanitized.startsWith('+');
  const digits = sanitized.replace('+', '');

  // Must contain only digits after removing +
  if (!/^\d+$/.test(digits)) {
    errors.push('Phone number must contain only digits');
  }

  // Length validation
  if (digits.length < CONFIG.phone.minLength) {
    errors.push(`Phone number must be at least ${CONFIG.phone.minLength} digits`);
  }

  if (digits.length > CONFIG.phone.maxLength) {
    errors.push(`Phone number must not exceed ${CONFIG.phone.maxLength} digits`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : null
  };
}

/**
 * Name validation (first name, last name, etc.)
 */
function validateName(name, fieldName = 'Name') {
  const errors = [];

  if (!name) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  if (typeof name !== 'string') {
    errors.push(`${fieldName} must be a string`);
    return { isValid: false, errors };
  }

  // Sanitize
  const sanitized = name.trim();

  // Length validation
  if (sanitized.length < CONFIG.name.minLength) {
    errors.push(`${fieldName} must be at least ${CONFIG.name.minLength} characters`);
  }

  if (sanitized.length > CONFIG.name.maxLength) {
    errors.push(`${fieldName} must not exceed ${CONFIG.name.maxLength} characters`);
  }

  // Format validation: letters, spaces, hyphens, apostrophes only
  if (!/^[a-zA-Z\s\-']+$/.test(sanitized)) {
    errors.push(`${fieldName} must contain only letters, spaces, hyphens, and apostrophes`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : null
  };
}

/**
 * Generic text validation (descriptions, comments, etc.)
 */
function validateText(text, fieldName = 'Text', maxLength = CONFIG.text.maxLength) {
  const errors = [];

  if (text === null || text === undefined) {
    return { isValid: true, errors: [], sanitized: '' };
  }

  if (typeof text !== 'string') {
    errors.push(`${fieldName} must be a string`);
    return { isValid: false, errors };
  }

  // Sanitize
  const sanitized = text.trim();

  // Length validation
  if (sanitized.length > maxLength) {
    errors.push(`${fieldName} must not exceed ${maxLength} characters`);
  }

  // XSS prevention: check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      errors.push(`${fieldName} contains potentially harmful content`);
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : null
  };
}

/**
 * URL validation
 */
function validateUrl(url, fieldName = 'URL') {
  const errors = [];

  if (!url) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  if (typeof url !== 'string') {
    errors.push(`${fieldName} must be a string`);
    return { isValid: false, errors };
  }

  // Sanitize
  const sanitized = url.trim();

  // Format validation using validator library
  const options = {
    protocols: CONFIG.url.protocols,
    require_protocol: CONFIG.url.requireProtocol,
    require_valid_protocol: true,
    allow_underscores: false,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false
  };

  if (!validator.isURL(sanitized, options)) {
    errors.push(`${fieldName} is not a valid URL`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : null
  };
}

/**
 * Numeric validation
 */
function validateNumber(value, fieldName = 'Number', min = null, max = null) {
  const errors = [];

  if (value === null || value === undefined) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  const num = Number(value);

  if (isNaN(num)) {
    errors.push(`${fieldName} must be a valid number`);
    return { isValid: false, errors };
  }

  if (min !== null && num < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }

  if (max !== null && num > max) {
    errors.push(`${fieldName} must not exceed ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: num
  };
}

/**
 * Sanitize HTML to prevent XSS
 */
function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate MongoDB ObjectId
 */
function validateObjectId(id, fieldName = 'ID') {
  const errors = [];

  if (!id) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    errors.push(`${fieldName} is not a valid ID format`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validateText,
  validateUrl,
  validateNumber,
  validateObjectId,
  sanitizeHtml,
  CONFIG
};