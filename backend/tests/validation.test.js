const {
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validateText,
  validateUrl,
  validateNumber,
  validateObjectId,
  sanitizeHtml
} = require('../utils/validation');

describe('Email Validation', () => {
  test('should validate correct email', () => {
    const result = validateEmail('test@example.com');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('test@example.com');
  });

  test('should reject invalid email format', () => {
    const result = validateEmail('invalid-email');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should sanitize email (trim and lowercase)', () => {
    const result = validateEmail('  TEST@Example.COM  ');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('test@example.com');
  });

  test('should reject missing email', () => {
    const result = validateEmail('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email is required');
  });

  test('should reject email exceeding max length', () => {
    const longEmail = 'a'.repeat(250) + '@test.com';
    const result = validateEmail(longEmail);
    expect(result.isValid).toBe(false);
  });
});

describe('Password Validation', () => {
  test('should validate strong password', () => {
    const result = validatePassword('MySecure@Pass123');
    expect(result.isValid).toBe(true);
    expect(result.strength).toBeGreaterThanOrEqual(3);
  });

  test('should reject short password', () => {
    const result = validatePassword('Short1!');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('at least'))).toBe(true);
  });

  test('should reject password without uppercase', () => {
    const result = validatePassword('mysecure@pass123');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('uppercase'))).toBe(true);
  });

  test('should reject password without lowercase', () => {
    const result = validatePassword('MYSECURE@PASS123');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('lowercase'))).toBe(true);
  });

  test('should reject password without number', () => {
    const result = validatePassword('MySecure@Password');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('number'))).toBe(true);
  });

  test('should reject password without special character', () => {
    const result = validatePassword('MySecurePass123');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('special character'))).toBe(true);
  });

  test('should reject common passwords', () => {
    const result = validatePassword('password123');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('too common'))).toBe(true);
  });
});

describe('Phone Validation', () => {
  test('should validate correct phone number', () => {
    const result = validatePhone('+263771234567');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('+263771234567');
  });

  test('should sanitize phone (remove spaces and dashes)', () => {
    const result = validatePhone('+263 77 123 4567');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('+263771234567');
  });

  test('should reject phone with letters', () => {
    const result = validatePhone('+263abc123456');
    expect(result.isValid).toBe(false);
  });

  test('should reject too short phone', () => {
    const result = validatePhone('123');
    expect(result.isValid).toBe(false);
  });
});

describe('Name Validation', () => {
  test('should validate correct name', () => {
    const result = validateName('John Doe');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('John Doe');
  });

  test('should accept hyphens and apostrophes', () => {
    const result = validateName("Mary-Jane O'Connor");
    expect(result.isValid).toBe(true);
  });

  test('should reject names with numbers', () => {
    const result = validateName('John123');
    expect(result.isValid).toBe(false);
  });

  test('should reject names with special characters', () => {
    const result = validateName('John@Doe');
    expect(result.isValid).toBe(false);
  });

  test('should trim whitespace', () => {
    const result = validateName('  John Doe  ');
    expect(result.sanitized).toBe('John Doe');
  });
});

describe('Text Validation', () => {
  test('should validate normal text', () => {
    const result = validateText('This is a normal description.');
    expect(result.isValid).toBe(true);
  });

  test('should reject text with script tags', () => {
    const result = validateText('<script>alert("XSS")</script>');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('harmful'))).toBe(true);
  });

  test('should reject text with javascript: protocol', () => {
    const result = validateText('Click here: javascript:alert(1)');
    expect(result.isValid).toBe(false);
  });

  test('should reject text exceeding max length', () => {
    const longText = 'a'.repeat(6000);
    const result = validateText(longText);
    expect(result.isValid).toBe(false);
  });

  test('should allow empty text', () => {
    const result = validateText('');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('');
  });
});

describe('URL Validation', () => {
  test('should validate correct HTTP URL', () => {
    const result = validateUrl('http://example.com');
    expect(result.isValid).toBe(true);
  });

  test('should validate correct HTTPS URL', () => {
    const result = validateUrl('https://example.com/path');
    expect(result.isValid).toBe(true);
  });

  test('should reject URL without protocol', () => {
    const result = validateUrl('example.com');
    expect(result.isValid).toBe(false);
  });

  test('should reject invalid URL format', () => {
    const result = validateUrl('not a url');
    expect(result.isValid).toBe(false);
  });

  test('should reject FTP protocol', () => {
    const result = validateUrl('ftp://example.com');
    expect(result.isValid).toBe(false);
  });
});

describe('Number Validation', () => {
  test('should validate number within range', () => {
    const result = validateNumber(50, 'Age', 0, 100);
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe(50);
  });

  test('should reject number below minimum', () => {
    const result = validateNumber(-5, 'Age', 0, 100);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('at least'))).toBe(true);
  });

  test('should reject number above maximum', () => {
    const result = validateNumber(150, 'Age', 0, 100);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('not exceed'))).toBe(true);
  });

  test('should convert string to number', () => {
    const result = validateNumber('42', 'Count', 0, 100);
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe(42);
  });

  test('should reject non-numeric values', () => {
    const result = validateNumber('abc', 'Count');
    expect(result.isValid).toBe(false);
  });
});

describe('ObjectId Validation', () => {
  test('should validate correct ObjectId', () => {
    const result = validateObjectId('507f1f77bcf86cd799439011');
    expect(result.isValid).toBe(true);
  });

  test('should reject invalid ObjectId format', () => {
    const result = validateObjectId('invalid-id');
    expect(result.isValid).toBe(false);
  });

  test('should reject short ObjectId', () => {
    const result = validateObjectId('507f1f77bcf86cd79943');
    expect(result.isValid).toBe(false);
  });

  test('should reject empty ObjectId', () => {
    const result = validateObjectId('');
    expect(result.isValid).toBe(false);
  });
});

describe('HTML Sanitization', () => {
  test('should escape HTML special characters', () => {
    const result = sanitizeHtml('<div>Test & "quotes"</div>');
    expect(result).toBe('&lt;div&gt;Test &amp; &quot;quotes&quot;&lt;&#x2F;div&gt;');
  });

  test('should handle empty string', () => {
    const result = sanitizeHtml('');
    expect(result).toBe('');
  });

  test('should handle non-string input', () => {
    const result = sanitizeHtml(null);
    expect(result).toBe('');
  });

  test('should escape script tags', () => {
    const result = sanitizeHtml('<script>alert("XSS")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
});