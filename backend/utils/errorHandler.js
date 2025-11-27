/**
 * Centralized Error Handling Utilities
 * Provides secure error responses that don't leak sensitive information
 */

/**
 * Custom Application Error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error types for categorization
 */
const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

/**
 * Get user-friendly error message
 * Prevents leaking sensitive information
 */
function getSafeErrorMessage(error, environment = 'production') {
  // In development, return actual error
  if (environment === 'development') {
    return error.message;
  }

  // In production, return generic messages for system errors
  if (!error.isOperational) {
    return 'An unexpected error occurred. Please try again later.';
  }

  // For operational errors, return the message (it's safe)
  return error.message;
}

/**
 * Get appropriate status code for error
 */
function getStatusCode(error) {
  if (error.statusCode) {
    return error.statusCode;
  }

  // Map common errors to status codes
  if (error.name === 'ValidationError') return 400;
  if (error.name === 'CastError') return 400;
  if (error.name === 'JsonWebTokenError') return 401;
  if (error.name === 'TokenExpiredError') return 401;
  if (error.code === 11000) return 409; // MongoDB duplicate key

  return 500;
}

/**
 * Log error for monitoring
 * (In production, send to logging service like Winston, Sentry, etc.)
 */
function logError(error, req = null) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500,
    isOperational: error.isOperational || false,
    type: error.name || 'Error'
  };

  // Add request context if available
  if (req) {
    errorLog.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id || 'anonymous'
    };
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR:', errorLog);
  } else {
    // In production, send to logging service
    // Example: Sentry.captureException(error);
    // Example: winston.error(errorLog);
    console.error('ERROR:', JSON.stringify(errorLog));
  }
}

/**
 * Handle specific error types
 */
function handleValidationError(error) {
  const errors = Object.values(error.errors).map(err => err.message);
  return new AppError(`Validation Error: ${errors.join(', ')}`, 400);
}

function handleDuplicateKeyError(error) {
  const field = Object.keys(error.keyPattern)[0];
  return new AppError(`${field} already exists`, 409);
}

function handleCastError(error) {
  return new AppError(`Invalid ${error.path}: ${error.value}`, 400);
}

function handleJWTError() {
  return new AppError('Invalid authentication token', 401);
}

function handleJWTExpiredError() {
  return new AppError('Authentication token has expired', 401);
}

/**
 * Convert errors to AppError format
 */
function normalizeError(error) {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    return handleValidationError(error);
  }

  // MongoDB duplicate key error
  if (error.code === 11000) {
    return handleDuplicateKeyError(error);
  }

  // Mongoose cast error
  if (error.name === 'CastError') {
    return handleCastError(error);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return handleJWTError();
  }

  if (error.name === 'TokenExpiredError') {
    return handleJWTExpiredError();
  }

  // Default: internal server error
  return new AppError(error.message, 500, false);
}

module.exports = {
  AppError,
  ErrorTypes,
  getSafeErrorMessage,
  getStatusCode,
  logError,
  normalizeError
};