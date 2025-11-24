# Authentication & User Security Guide

## Overview

This guide covers implementing secure user authentication and authorization for the WyZar e-commerce platform in compliance with PCI DSS and security best practices.

## Current Authentication Flow

```
1. User Registration
   ├── Email/Phone/Password collected
   ├── Password hashed with bcrypt (10 rounds)
   ├── User record created in MongoDB
   └── JWT token issued (7-day expiry)

2. User Login
   ├── Email/Phone + Password submitted
   ├── User lookup in database
   ├── Password verification (bcrypt.compare)
   ├── JWT token issued
   └── Token sent to frontend

3. Protected Route Access
   ├── JWT token in x-auth-token header
   ├── Token verification
   ├── User info extracted from token
   └── Request allowed/denied
```

## New Security Features Implemented

### 1. Enhanced Password Security

**Location:** [utils/passwordSecurity.js](utils/passwordSecurity.js)

**Features:**
- ✅ Password strength validation
- ✅ Complexity requirements (uppercase, lowercase, numbers, special chars)
- ✅ Common password detection
- ✅ User info detection (no email/phone in password)
- ✅ Password strength scoring (0-100)

**Usage:**
```javascript
const { validatePasswordStrength } = require('../utils/passwordSecurity');

// In registration/password change routes
const validation = validatePasswordStrength(password);
if (!validation.valid) {
  return res.status(400).json({
    msg: 'Password does not meet requirements',
    errors: validation.errors
  });
}
```

### 2. Account Lockout Protection

**Location:** [utils/accountLockout.js](utils/accountLockout.js)

**Features:**
- ✅ Lock account after 5 failed attempts
- ✅ 15-minute lockout duration
- ✅ Automatic unlock after timeout
- ✅ Manual unlock (admin)
- ✅ Lockout status tracking

**Usage:**
```javascript
const { checkAccountLockout, recordFailedAttempt } = require('../utils/accountLockout');

// Add to login route BEFORE password check
router.post('/login', checkAccountLockout, async (req, res) => {
  // ... existing login logic
});
```

### 3. Audit Logging

**Location:** [middleware/auditLog.js](middleware/auditLog.js)

**Events Logged:**
- ✅ All authentication attempts (success/failure)
- ✅ Admin actions
- ✅ Account changes (create/update/delete)
- ✅ Authorization failures
- ✅ Rate limit violations
- ✅ Suspicious activity

**Usage:**
```javascript
const { logAuthSuccess, logAuthFailure } = require('../middleware/auditLog');

// In login route
if (isMatch) {
  logAuthSuccess(user.id, user.email, req);
} else {
  logAuthFailure(email, 'Invalid password', req);
}
```

## How to Integrate (Step-by-Step)

### Step 1: Update Registration Route

**File:** [routes/auth.js](routes/auth.js)

```javascript
// Add at top
const { validatePasswordMiddleware } = require('../utils/passwordSecurity');
const { logAccountChange } = require('../middleware/auditLog');

// Update registration route
router.post('/register', validatePasswordMiddleware, async (req, res) => {
  try {
    // ... existing registration logic ...

    // After user is saved
    logAccountChange('CREATE', user.id, { email, phone }, req);

    // ... rest of code ...
  } catch (err) {
    // ... error handling ...
  }
});
```

### Step 2: Update Login Route

**File:** [routes/auth.js](routes/auth.js)

```javascript
// Add at top
const { checkAccountLockout, recordFailedAttempt, clearLoginAttempts } = require('../utils/accountLockout');
const { logAuthSuccess, logAuthFailure, logAuthAttempt } = require('../middleware/auditLog');

// Update login route
router.post('/login', checkAccountLockout, logAuthAttempt, async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const identifier = email || phone;

    // ... existing user lookup code ...

    if (!user) {
      recordFailedAttempt(identifier);
      logAuthFailure(identifier, 'User not found', req);
      return res.status(400).json({ success: false, msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const lockStatus = recordFailedAttempt(identifier);
      logAuthFailure(identifier, 'Invalid password', req);

      return res.status(400).json({
        success: false,
        msg: lockStatus.locked ? lockStatus.message : 'Invalid credentials',
        attemptsLeft: lockStatus.attemptsLeft
      });
    }

    // Successful login - clear attempts
    clearLoginAttempts(identifier);
    logAuthSuccess(user.id, user.email, req);

    // ... existing JWT token code ...
  } catch (err) {
    // ... error handling ...
  }
});
```

### Step 3: Add Admin Logging

**File:** [routes/admin.js](routes/admin.js) and all admin routes

```javascript
const { logAdminAction } = require('../middleware/auditLog');

// Apply to all admin routes
router.use(logAdminAction);
```

### Step 4: Create Audit Log Viewer (Admin Only)

**File:** Create [routes/adminAudit.js](routes/adminAudit.js)

```javascript
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { getAuditLogs } = require('../middleware/auditLog');

// GET /api/admin/audit/logs
router.get('/logs', auth, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, eventType } = req.query;
    const logs = getAuditLogs(startDate, endDate, eventType);

    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: 'Error retrieving audit logs',
      error: error.message
    });
  }
});

module.exports = router;
```

Don't forget to add in [index.js](index.js):
```javascript
app.use('/api/admin/audit', require('./routes/adminAudit'));
```

## Password Requirements

**Current Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Cannot be a common password
- Cannot contain user's email/phone/name

**Recommended for Production:**
- Increase minimum to 12 characters
- Add maximum age (90 days) with forced reset
- Prevent password reuse (last 5 passwords)
- Implement password strength meter in frontend

## Account Security Features

### Two-Factor Authentication (2FA)

**Status:** ⚠️ **NOT YET IMPLEMENTED**

**Recommendation:** Implement for admin and seller accounts

**Suggested Implementation:**
```javascript
// When user enables 2FA
1. Generate TOTP secret (use `speakeasy` npm package)
2. Show QR code to user
3. User scans with authenticator app (Google Authenticator, Authy)
4. Verify with test code
5. Store secret (encrypted) in user record

// On login with 2FA enabled
1. Verify password (as normal)
2. Prompt for 2FA code
3. Verify code against stored secret
4. Issue JWT token only if both password AND code are valid
```

### Session Management

**Current:** JWT tokens stored in frontend (localStorage/sessionStorage)

**Security Considerations:**
- ✅ Tokens expire (7 days)
- ✅ Tokens can't be modified (signed with secret)
- ⚠️ No token refresh mechanism
- ⚠️ No token revocation (logout only clears client-side)

**Recommendations:**
1. **Add Refresh Tokens:**
   - Short-lived access tokens (15 min)
   - Long-lived refresh tokens (7 days)
   - Refresh endpoint to get new access token

2. **Token Blacklist:**
   - Store invalidated tokens in Redis
   - Check blacklist on protected routes
   - Allows forced logout/session termination

### Password Reset Security

**Current Flow:**
1. User requests reset
2. OTP sent to phone
3. User enters OTP + new password
4. Password updated

**Recommendations:**
- ✅ OTP expires (10 minutes) - implemented
- ✅ OTP is single-use
- ⚠️ Add email notification of password change
- ⚠️ Add rate limiting on reset requests
- ⚠️ Log all password changes in audit log

## Security Monitoring

### What to Monitor

**Authentication Events:**
- Failed login attempts by IP
- Failed login attempts by username
- Successful logins from new locations/devices
- Account lockouts
- Password resets

**Suspicious Patterns:**
- Multiple failed attempts from same IP
- Multiple accounts accessed from same IP
- Login attempts outside business hours
- Rapid succession of password reset requests
- Admin actions during unusual hours

### Alert Thresholds

**Immediate Alerts:**
- 10+ failed logins from single IP in 5 minutes
- Admin password change
- Multiple account lockouts from same IP
- SQL/NoSQL injection attempts
- XSS attack attempts

**Daily Summary:**
- Total login attempts
- Failed login rate
- Locked accounts
- Password resets
- Admin actions

## Compliance Checklist

### PCI DSS Requirements

- [x] **8.1** Unique user IDs
- [x] **8.2** Strong passwords (complexity, length)
- [ ] **8.2.3** 90-day password expiry (recommended)
- [x] **8.2.4** Lockout after 6 attempts (we use 5)
- [ ] **8.2.5** Re-authentication for sensitive operations
- [x] **8.3** MFA for admin (pending implementation)
- [x] **8.5** Access review and removal
- [x] **8.6** Lockout after 15 minutes (we use 15)

### Additional Best Practices

- [ ] Password strength meter in UI
- [ ] "Have I Been Pwned" integration
- [ ] Geo-location tracking
- [ ] Device fingerprinting
- [ ] Security questions (backup auth)
- [ ] Account activity history
- [ ] Login notification emails
- [ ] Suspicious login challenges

## Testing Security

### Manual Tests

1. **Password Strength:**
   ```bash
   # Should FAIL
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","phone":"0771234567","password":"weak"}'

   # Should SUCCEED
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","phone":"0771234567","password":"Strong@Pass123"}'
   ```

2. **Account Lockout:**
   ```bash
   # Try logging in with wrong password 6 times
   for i in {1..6}; do
     curl -X POST http://localhost:5000/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@test.com","password":"wrongpassword"}'
     echo "\nAttempt $i"
     sleep 1
   done
   ```

3. **Audit Logging:**
   ```bash
   # Check logs directory
   ls backend/logs/
   cat backend/logs/security-*.log | jq .
   ```

### Automated Tests

```javascript
// tests/auth.test.js
describe('Authentication Security', () => {
  it('should reject weak passwords', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'weak' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContain('Password must meet security requirements');
  });

  it('should lock account after 5 failed attempts', async () => {
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' });
    }

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'wrong' });

    expect(res.status).toBe(429);
    expect(res.body.locked).toBe(true);
  });
});
```

## Production Deployment

### Environment Variables

Update `.env` for production:
```env
# Increase token expiry for production?
JWT_EXPIRY=7d  # Or shorter for more security

# Enable stricter password requirements
PASSWORD_MIN_LENGTH=12
REQUIRE_PASSWORD_CHANGE_DAYS=90

# Rate limiting
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# Logging
LOG_LEVEL=info
ENABLE_AUDIT_LOGS=true
LOG_RETENTION_DAYS=90
```

### Monitoring Setup

1. **Log Aggregation:** Use ELK Stack, Splunk, or CloudWatch
2. **Alerting:** PagerDuty, OpsGenie for critical events
3. **Metrics:** Prometheus + Grafana for dashboards
4. **SIEM:** Security Information and Event Management system

## Support & Resources

- **OWASP Authentication Cheat Sheet:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **PCI DSS v4.0:** https://www.pcisecuritystandards.org/
- **NIST Password Guidelines:** https://pages.nist.gov/800-63-3/

---

**Last Updated:** $(date)
**Review Schedule:** Monthly
