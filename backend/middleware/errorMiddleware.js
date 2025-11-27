/**
 * Global Error Handling Middleware
 */

const {
  getSafeErrorMessage,
  getStatusCode,
  logError,
  normalizeError,
  AppError
} = require('../utils/errorHandler');

/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
  const error = err instanceof AppError ? err : normalizeError(err);
  logError(error, req);

  const message = getSafeErrorMessage(error, process.env.NODE_ENV);
  const statusCode = getStatusCode(error);

  const errorResponse = {
    success: false,
    msg: message,
    error: {
      type: error.name,
      statusCode
    }
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
    errorResponse.error.originalMessage = err.message;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404, true);
  next(error);
}

/**
 * Async error wrapper
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};