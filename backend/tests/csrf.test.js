const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const {
  attachCsrfToken,
  validateCsrf,
  csrfProtection
} = require('../middleware/csrfProtection');

// Mock Express app for testing
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Mock auth middleware
  app.use((req, res, next) => {
    req.user = { id: 'test-user-123' };
    next();
  });

  return app;
}

describe('CSRF Token Generation', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  test('should generate CSRF token on GET request', async () => {
    app.get('/test', attachCsrfToken, (req, res) => {
      res.json({ csrfToken: res.locals.csrfToken });
    });

    const response = await request(app).get('/test');

    expect(response.status).toBe(200);
    expect(response.body.csrfToken).toBeDefined();
    expect(response.body.csrfToken.length).toBeGreaterThan(0);
    expect(response.headers['set-cookie']).toBeDefined();
  });

  test('should set CSRF token as cookie', async () => {
    app.get('/test', attachCsrfToken, (req, res) => {
      res.json({ success: true });
    });

    const response = await request(app).get('/test');

    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(cookie => cookie.includes('XSRF-TOKEN'))).toBe(true);
  });
});

describe('CSRF Token Validation', () => {
  let app;
  let csrfToken;

  beforeEach(async () => {
    app = createTestApp();

    // Get CSRF token first
    app.get('/get-token', attachCsrfToken, (req, res) => {
      res.json({ csrfToken: res.locals.csrfToken });
    });

    app.post('/protected', validateCsrf, (req, res) => {
      res.json({ success: true, msg: 'Protected action completed' });
    });

    const tokenResponse = await request(app).get('/get-token');
    csrfToken = tokenResponse.body.csrfToken;
  });

  test('should allow POST with valid CSRF token in header', async () => {
    const response = await request(app)
      .post('/protected')
      .set('X-CSRF-Token', csrfToken)
      .send({ data: 'test' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('should allow POST with valid CSRF token in body', async () => {
    const response = await request(app)
      .post('/protected')
      .send({ data: 'test', _csrf: csrfToken });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('should reject POST without CSRF token', async () => {
    const response = await request(app)
      .post('/protected')
      .send({ data: 'test' });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain('CSRF token missing');
  });

  test('should reject POST with invalid CSRF token', async () => {
    const response = await request(app)
      .post('/protected')
      .set('X-CSRF-Token', 'invalid-token')
      .send({ data: 'test' });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain('Invalid');
  });

  test('should allow GET requests without CSRF token', async () => {
    app.get('/get-data', validateCsrf, (req, res) => {
      res.json({ success: true });
    });

    const response = await request(app).get('/get-data');

    expect(response.status).toBe(200);
  });
});

describe('CSRF Protection (Combined)', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    app.post('/create', csrfProtection, (req, res) => {
      res.json({ success: true, msg: 'Resource created' });
    });
  });

  test('should protect POST route with CSRF', async () => {
    // First request should fail (no token)
    const failResponse = await request(app)
      .post('/create')
      .send({ data: 'test' });

    expect(failResponse.status).toBe(403);

    // Get token from first request's cookie
    const cookies = failResponse.headers['set-cookie'];
    const csrfCookie = cookies.find(c => c.includes('XSRF-TOKEN'));
    const csrfToken = csrfCookie.split('=')[1].split(';')[0];

    // Second request should succeed with token
    const successResponse = await request(app)
      .post('/create')
      .set('X-CSRF-Token', csrfToken)
      .send({ data: 'test' });

    expect(successResponse.status).toBe(200);
  });
});