// backend/utils/security/inputValidation.js
const validator = require('validator');

/**
 * Input Validation & Sanitization Utilities
 * Protects against XSS, injection attacks, and data corruption
 */

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

/**
 * Sanitize string input - removes/escapes dangerous characters
 */
const sanitizeString = (input, options = {}) => {
  if (typeof input !== 'string') return input;
  
  const {
    trim = true,
    stripHtml = true,
    maxLength = 1000,
    allowedChars = null
  } = options;

  let sanitized = input;

  // Trim whitespace
  if (trim) sanitized = sanitized.trim();

  // Strip HTML tags (XSS protection)
  if (stripHtml) {
    sanitized = validator.escape(sanitized);
  }

  // Enforce max length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Allow only specific characters if specified
  if (allowedChars) {
    const regex = new RegExp(`[^${allowedChars}]`, 'g');
    sanitized = sanitized.replace(regex, '');
  }

  return sanitized;
};

/**
 * Sanitize object - recursively sanitize all string values
 */
const sanitizeObject = (obj, depth = 0, maxDepth = 5, excludeFields = []) => {
  if (depth > maxDepth) return obj;
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    // Sanitize the key itself (prevent prototype pollution)
    const safeKey = sanitizeString(key, { 
      stripHtml: true, 
      maxLength: 100,
      allowedChars: 'a-zA-Z0-9_-'
    });

    if (safeKey === '__proto__' || safeKey === 'constructor' || safeKey === 'prototype') {
      continue; // Skip dangerous keys
    }

    // Skip sanitization for excluded fields (like passwords)
    if (excludeFields.includes(safeKey)) {
      sanitized[safeKey] = value;
    } else if (typeof value === 'string') {
      sanitized[safeKey] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[safeKey] = sanitizeObject(value, depth + 1, maxDepth, excludeFields);
    } else {
      sanitized[safeKey] = value;
    }
  }

  return sanitized;
};

/**
 * Validate email address
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required', 'email');
  }

  const sanitized = sanitizeString(email, { trim: true, maxLength: 255 });

  if (!validator.isEmail(sanitized)) {
    throw new ValidationError('Invalid email format', 'email');
  }

  // Additional checks
  if (sanitized.length > 255) {
    throw new ValidationError('Email is too long', 'email');
  }

  return sanitized.toLowerCase();
};

/**
 * Validate phone number (Zimbabwe format)
 */
const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    throw new ValidationError('Phone number is required', 'phone');
  }

  const sanitized = sanitizeString(phone, { 
    trim: true, 
    stripHtml: false,
    allowedChars: '0-9+\\-\\s()'
  });

  // Remove all non-numeric characters for validation
  const digitsOnly = sanitized.replace(/\D/g, '');

  // Zimbabwe phone format: +263XXXXXXXXX or 0XXXXXXXXX
  const zimPhoneRegex = /^(\+263|0)[0-9]{9}$/;
  
  if (!zimPhoneRegex.test(sanitized.replace(/[\s\-()]/g, ''))) {
    throw new ValidationError(
      'Invalid phone number. Use format: 0771234567 or +263771234567', 
      'phone'
    );
  }

  return sanitized;
};

/**
 * Validate price/monetary value
 */
const validatePrice = (price) => {
  const numPrice = parseFloat(price);

  if (isNaN(numPrice)) {
    throw new ValidationError('Price must be a valid number', 'price');
  }

  if (numPrice < 0) {
    throw new ValidationError('Price cannot be negative', 'price');
  }

  if (numPrice > 1000000000) {
    throw new ValidationError('Price is unreasonably high', 'price');
  }

  // Round to 2 decimal places
  return Math.round(numPrice * 100) / 100;
};

/**
 * Validate quantity
 */
const validateQuantity = (quantity) => {
  const numQty = parseInt(quantity, 10);

  if (isNaN(numQty)) {
    throw new ValidationError('Quantity must be a valid number', 'quantity');
  }

  if (numQty < 0) {
    throw new ValidationError('Quantity cannot be negative', 'quantity');
  }

  if (numQty > 1000000) {
    throw new ValidationError('Quantity is unreasonably high', 'quantity');
  }

  return numQty;
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'id') => {
  if (!id) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  const idString = String(id);
  
  // UUID format validation (PostgreSQL/Prisma uses UUIDs)
  // Format: 8-4-4-4-12 hexadecimal characters (with hyphens)
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(idString)) {
    throw new ValidationError(`Invalid ${fieldName} format`, fieldName);
  }

  return idString;
};

/**
 * Validate and sanitize product name
 */
const validateProductName = (name) => {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Product name is required', 'name');
  }

  const sanitized = sanitizeString(name, { 
    trim: true, 
    maxLength: 200 
  });

  if (sanitized.length < 3) {
    throw new ValidationError('Product name must be at least 3 characters', 'name');
  }

  if (sanitized.length > 200) {
    throw new ValidationError('Product name is too long (max 200 characters)', 'name');
  }

  return sanitized;
};

/**
 * Validate and sanitize description
 */
const validateDescription = (description, options = {}) => {
  const { minLength = 10, maxLength = 5000 } = options;

  if (!description || typeof description !== 'string') {
    throw new ValidationError('Description is required', 'description');
  }

  const sanitized = sanitizeString(description, { 
    trim: true, 
    maxLength 
  });

  if (sanitized.length < minLength) {
    throw new ValidationError(
      `Description must be at least ${minLength} characters`, 
      'description'
    );
  }

  return sanitized;
};

/**
 * Validate category
 */
const validateCategory = (category, allowedCategories = []) => {
  if (!category || typeof category !== 'string') {
    throw new ValidationError('Category is required', 'category');
  }

  const sanitized = sanitizeString(category, { 
    trim: true, 
    maxLength: 100 
  });

  // If allowed categories specified, check against whitelist
  if (allowedCategories.length > 0) {
    if (!allowedCategories.includes(sanitized)) {
      throw new ValidationError(
        `Invalid category. Allowed: ${allowedCategories.join(', ')}`, 
        'category'
      );
    }
  }

  return sanitized;
};

/**
 * Validate shipping address
 */
const validateAddress = (address) => {
  const required = ['fullName', 'address', 'city', 'phone'];
  const errors = [];

  for (const field of required) {
    if (!address[field]) {
      errors.push(`${field} is required`);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '), 'shippingAddress');
  }

  return {
    fullName: sanitizeString(address.fullName, { maxLength: 100 }),
    address: sanitizeString(address.address, { maxLength: 500 }),
    city: sanitizeString(address.city, { maxLength: 100 }),
    phone: validatePhone(address.phone)
  };
};

/**
 * Validate URL
 */
const validateUrl = (url, fieldName = 'url') => {
  if (!url || typeof url !== 'string') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  if (!validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true })) {
    throw new ValidationError(`Invalid ${fieldName} format`, fieldName);
  }

  return url;
};

/**
 * Validate file upload
 */
const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    fieldName = 'file'
  } = options;

  if (!file) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  // Check file size
  if (file.size > maxSize) {
    throw new ValidationError(
      `${fieldName} size exceeds ${maxSize / 1024 / 1024}MB limit`,
      fieldName
    );
  }

  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    throw new ValidationError(
      `Invalid ${fieldName} type. Allowed: ${allowedTypes.join(', ')}`,
      fieldName
    );
  }

  return true;
};

/**
 * Middleware: Sanitize request body
 * Excludes password fields from HTML sanitization
 */
const sanitizeRequestBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    // Don't sanitize password fields - they need to be compared as-is
    req.body = sanitizeObject(req.body, 0, 5, ['password', 'newPassword', 'oldPassword', 'confirmPassword']);
  }
  next();
};

/**
 * Middleware: Sanitize query parameters
 */
const sanitizeQueryParams = (req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query, 0, 5, []);
  }
  next();
};

/**
 * Middleware: Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  try {
    if (req.query.page) {
      const page = parseInt(req.query.page, 10);
      if (isNaN(page) || page < 1) {
        return res.status(400).json({
          success: false,
          msg: 'Invalid page number'
        });
      }
      req.query.page = page;
    }

    if (req.query.limit) {
      const limit = parseInt(req.query.limit, 10);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          msg: 'Invalid limit (must be between 1-100)'
        });
      }
      req.query.limit = limit;
    }

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      msg: 'Validation error',
      error: error.message
    });
  }
};

module.exports = {
  ValidationError,
  sanitizeString,
  sanitizeObject,
  validateEmail,
  validatePhone,
  validatePrice,
  validateQuantity,
  validateObjectId,
  validateProductName,
  validateDescription,
  validateCategory,
  validateAddress,
  validateUrl,
  validateFileUpload,
  sanitizeRequestBody,
  sanitizeQueryParams,
  validatePagination
};