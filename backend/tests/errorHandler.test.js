const { AppError, normalizeError, getSafeErrorMessage } = require('../utils/errorHandler');
const { errorHandler, notFoundHandler, asyncHandler } = require('../middleware/errorMiddleware');
const express = require('express');
const request = require('supertest');

describe('AppError Class', () => {
  test('should create operational error with correct properties', () => {
    const error = new AppError('Test error', 400, true);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
    expect(error.timestamp).toBeDefined();
  });

  test('should default to status 500 and operational true', () => {
    const error = new AppError('Test error');

    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });
});

describe('Error Normalization', () => {
  test('should pass through AppError unchanged', () => {
    const appError = new AppError('Test error', 400);
    const normalized = normalizeError(appError);

    expect(normalized).toBe(appError);
  });

  test('should convert ValidationError', () => {
    const validationError = {
      name: 'ValidationError',
      errors: {
        email: { message: 'Email is required' },
        password: { message: 'Password is too short' }
      }
    };

    const normalized = normalizeError(validationError);

    expect(normalized).toBeInstanceOf(AppError);
    expect(normalized.statusCode).toBe(400);
    expect(normalized.message).toContain('Email is required');
  });

  test('should convert duplicate key error', () => {
    const duplicateError = {
      code: 11000,
      keyPattern: { email: 1 }
    };

    const normalized = normalizeError(duplicateError);

    expect(normalized).toBeInstanceOf(AppError);
    expect(normalized.statusCode).toBe(409);
    expect(normalized.message).toContain('email already exists');
  });

  test('should convert CastError', () => {
    const castError = {
      name: 'CastError',
      path: 'id',
      value: 'invalid-id'
    };

    const normalized = normalizeError(castError);

    expect(normalized).toBeInstanceOf(AppError);
    expect(normalized.statusCode).toBe(400);
  });

  test('should convert JWT errors', () => {
    const jwtError = {
      name: 'JsonWebTokenError',
      message: 'invalid signature'
    };

    const normalized = normalizeError(jwtError);

    expect(normalized).toBeInstanceOf(AppError);
    expect(normalized.statusCode).toBe(401);
  });
});

describe('Safe Error Messages', () => {
  test('should return actual message in development', () => {
    const error = new AppError('Detailed error info', 500, false);
    const message = getSafeErrorMessage(error, 'development');

    expect(message).toBe('Detailed error info');
  });

  test('should return generic message for non-operational errors in production', () => {
    const error = new AppError('Database connection failed', 500, false);
    const message = getSafeErrorMessage(error, 'production');

    expect(message).toBe('An unexpected error occurred. Please try again later.');
  });

  test('should return actual message for operational errors in production', () => {
    const error = new AppError('Email is required', 400, true);
    const message = getSafeErrorMessage(error, 'production');

    expect(message).toBe('Email is required');
  });
});

describe('Error Handler Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  test('should handle errors and return JSON response', async () => {
    app.get('/test', (req, res, next) => {
      next(new AppError('Test error', 400));
    });
    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe('Test error');
  });

  test('should handle 404 errors', async () => {
    app.use(notFoundHandler);
    app.use(errorHandler);

    const response = await request(app).get('/nonexistent');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain('Route not found');
  });

  test('should include stack trace in development', async () => {
    process.env.NODE_ENV = 'development';

    app.get('/test', (req, res, next) => {
      next(new AppError('Test error', 400));
    });
    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.body.error.stack).toBeDefined();
  });
});

describe('Async Handler', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  test('should catch rejected promises', async () => {
    const asyncRoute = asyncHandler(async (req, res) => {
      throw new AppError('Async error', 400);
    });

    app.get('/test', asyncRoute);
    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(400);
    expect(response.body.msg).toBe('Async error');
  });

  test('should pass through successful async operations', async () => {
    const asyncRoute = asyncHandler(async (req, res) => {
      res.json({ success: true });
    });

    app.get('/test', asyncRoute);

    const response = await request(app).get('/test');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});