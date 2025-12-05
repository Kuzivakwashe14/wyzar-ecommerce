/**
 * Environment Variable Validation
 * Ensures all required environment variables are properly configured
 */

/**
 * Required environment variables and their validation rules
 */
const ENV_SCHEMA = {
  // Server Configuration
  PORT: {
    required: false,
    type: 'number',
    default: 5000,
    description: 'Server port'
  },
  NODE_ENV: {
    required: false,
    type: 'string',
    enum: ['development', 'production', 'test'],
    default: 'development',
    description: 'Application environment'
  },

  // Database
  MONGODB_URI: {
    required: true,
    type: 'string',
    description: 'MongoDB connection string'
  },

  // Authentication
  JWT_SECRET: {
    required: true,
    type: 'string',
    minLength: 32,
    description: 'JWT signing secret (minimum 32 characters)'
  },

  // Encryption
  ENCRYPTION_KEY: {
    required: true,
    type: 'string',
    length: 64, // 32 bytes in hex = 64 characters
    description: 'Encryption key for AES-256-GCM (64 hex characters)'
  },

  // HTTPS Configuration
  USE_HTTPS: {
    required: false,
    type: 'boolean',
    default: false,
    description: 'Enable HTTPS'
  },
  HTTPS_PORT: {
    required: false,
    type: 'number',
    default: 5443,
    description: 'HTTPS port'
  },

  // CORS
  ALLOWED_ORIGINS: {
    required: true,
    type: 'string',
    description: 'Comma-separated list of allowed CORS origins'
  },

  // Email Service
  EMAIL_HOST: {
    required: false,
    type: 'string',
    description: 'SMTP email host'
  },
  EMAIL_PORT: {
    required: false,
    type: 'number',
    description: 'SMTP email port'
  },
  EMAIL_USER: {
    required: false,
    type: 'string',
    description: 'SMTP email username'
  },
  EMAIL_PASS: {
    required: false,
    type: 'string',
    description: 'SMTP email password'
  },

  // Payment Gateway
  PAYNOW_INTEGRATION_ID: {
    required: false,
    type: 'string',
    description: 'PayNow integration ID'
  },
  PAYNOW_INTEGRATION_KEY: {
    required: false,
    type: 'string',
    description: 'PayNow integration key'
  }
};

/**
 * Validation errors collection
 */
class ValidationErrors {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  addError(message) {
    this.errors.push(message);
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  hasWarnings() {
    return this.warnings.length > 0;
  }

  getReport() {
    return {
      errors: this.errors,
      warnings: this.warnings,
      isValid: !this.hasErrors()
    };
  }
}

/**
 * Validate a single environment variable
 */
function validateEnvVar(name, value, schema) {
  const errors = [];

  // Check if required but missing
  if (schema.required && !value) {
    if (schema.default !== undefined) {
      return { isValid: true, value: schema.default };
    }
    errors.push(`${name} is required but not set. ${schema.description}`);
    return { isValid: false, errors };
  }

  // If not required and not set, use default
  if (!value) {
    return { isValid: true, value: schema.default };
  }

  // Type validation
  switch (schema.type) {
    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        errors.push(`${name} must be a number`);
      }
      value = num;
      break;

    case 'boolean':
      if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
        errors.push(`${name} must be a boolean (true/false)`);
      }
      value = value.toLowerCase() === 'true' || value === '1';
      break;

    case 'string':
      // Already a string, check additional constraints
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`${name} must be at least ${schema.minLength} characters long`);
      }

      if (schema.length && value.length !== schema.length) {
        errors.push(`${name} must be exactly ${schema.length} characters long`);
      }

      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`${name} must be one of: ${schema.enum.join(', ')}`);
      }

      // Validate hex string for encryption key
      if (name === 'ENCRYPTION_KEY' && !/^[0-9a-fA-F]{64}$/.test(value)) {
        errors.push(`${name} must be a 64-character hexadecimal string`);
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    value
  };
}

/**
 * Validate all environment variables
 */
function validateEnvironment() {
  const validationErrors = new ValidationErrors();
  const validatedEnv = {};

  // Validate each variable in schema
  for (const [name, schema] of Object.entries(ENV_SCHEMA)) {
    const value = process.env[name];
    const result = validateEnvVar(name, value, schema);

    if (!result.isValid) {
      result.errors.forEach(error => validationErrors.addError(error));
    } else {
      validatedEnv[name] = result.value;
    }
  }

  // Production-specific warnings
  if (validatedEnv.NODE_ENV === 'production') {
    // Warn about insecure configurations
    if (!validatedEnv.USE_HTTPS) {
      validationErrors.addWarning('USE_HTTPS is false in production. HTTPS is strongly recommended.');
    }

    if (validatedEnv.JWT_SECRET && validatedEnv.JWT_SECRET.length < 64) {
      validationErrors.addWarning('JWT_SECRET is shorter than 64 characters. Consider using a longer secret in production.');
    }

    if (!process.env.EMAIL_HOST) {
      validationErrors.addWarning('Email configuration not set. Email functionality will not work.');
    }
  }

  return {
    ...validationErrors.getReport(),
    validatedEnv
  };
}

/**
 * Print validation report to console
 */
function printValidationReport(report) {
  console.log('\n=== Environment Variable Validation ===\n');

  if (report.errors.length > 0) {
    console.error('❌ ERRORS:');
    report.errors.forEach(error => console.error(`  - ${error}`));
    console.log('');
  }

  if (report.warnings.length > 0) {
    console.warn('⚠️  WARNINGS:');
    report.warnings.forEach(warning => console.warn(`  - ${warning}`));
    console.log('');
  }

  if (report.isValid && report.warnings.length === 0) {
    console.log('✅ All environment variables are valid!\n');
  } else if (report.isValid) {
    console.log('✅ Environment validation passed (with warnings)\n');
  } else {
    console.error('❌ Environment validation FAILED\n');
    console.error('Please fix the errors above before starting the application.\n');
  }
}

/**
 * Validate and exit if invalid (for production)
 */
function validateOrExit() {
  const report = validateEnvironment();
  printValidationReport(report);

  if (!report.isValid) {
    console.error('Exiting due to environment validation errors...\n');
    process.exit(1);
  }

  return report.validatedEnv;
}

module.exports = {
  validateEnvironment,
  validateOrExit,
  printValidationReport,
  ENV_SCHEMA
};