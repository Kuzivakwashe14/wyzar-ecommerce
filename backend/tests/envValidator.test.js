const { validateEnvironment, ENV_SCHEMA } = require('../utils/envValidator');

describe('Environment Variable Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('should pass with all required variables', () => {
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.ENCRYPTION_KEY = '0'.repeat(64);
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000';

    const result = validateEnvironment();

    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('should fail when required variables are missing', () => {
    process.env = {}; // Clear all variables

    const result = validateEnvironment();

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('MONGODB_URI'))).toBe(true);
  });

  test('should use default values for optional variables', () => {
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.ENCRYPTION_KEY = '0'.repeat(64);
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
    // Don't set PORT - should use default

    const result = validateEnvironment();

    expect(result.isValid).toBe(true);
    expect(result.validatedEnv.PORT).toBe(5000); // default value
  });

  test('should validate JWT_SECRET length', () => {
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'short'; // Too short
    process.env.ENCRYPTION_KEY = '0'.repeat(64);
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000';

    const result = validateEnvironment();

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('JWT_SECRET'))).toBe(true);
  });

  test('should validate ENCRYPTION_KEY format', () => {
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.ENCRYPTION_KEY = 'not-hex-format';
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000';

    const result = validateEnvironment();

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('ENCRYPTION_KEY'))).toBe(true);
  });

  test('should warn about production issues', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.ENCRYPTION_KEY = '0'.repeat(64);
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
    process.env.USE_HTTPS = 'false'; // Not recommended for production

    const result = validateEnvironment();

    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(w => w.includes('HTTPS'))).toBe(true);
  });

  test('should validate number types', () => {
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.ENCRYPTION_KEY = '0'.repeat(64);
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
    process.env.PORT = 'not-a-number';

    const result = validateEnvironment();

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('PORT'))).toBe(true);
  });

  test('should validate boolean types', () => {
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.ENCRYPTION_KEY = '0'.repeat(64);
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
    process.env.USE_HTTPS = 'invalid-boolean';

    const result = validateEnvironment();

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('USE_HTTPS'))).toBe(true);
  });

  test('should validate enum values', () => {
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.ENCRYPTION_KEY = '0'.repeat(64);
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
    process.env.NODE_ENV = 'invalid-env';

    const result = validateEnvironment();

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('NODE_ENV'))).toBe(true);
  });
});