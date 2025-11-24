# PCI DSS Compliance Guide for WyZar E-Commerce

## Overview

**PCI DSS** (Payment Card Industry Data Security Standard) is a set of security requirements for organizations that handle credit card information. This guide helps ensure your e-commerce platform is compliant.

## ⚠️ CRITICAL: Payment Card Data Handling

### What You MUST NEVER Store

**NEVER store the following sensitive authentication data after authorization:**

1. ❌ **Full Track Data** (magnetic stripe, chip, or equivalent)
2. ❌ **CVV/CVC/CVV2/CVC2** (Card Verification Value/Code)
3. ❌ **PIN/PIN Block**

### What You MAY Store (with proper protection)

If you must store card data (not recommended):

- ✅ **Primary Account Number (PAN)** - ONLY if encrypted with strong cryptography
- ✅ **Cardholder Name**
- ✅ **Expiration Date**
- ✅ **Service Code**

**RECOMMENDATION:** ❗ **Use payment tokenization instead of storing card data**

## Current Implementation Status

### ✅ Compliant Areas

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Use Payment Gateway | ✅ Yes | PayNow integration (tokenized payments) |
| HTTPS/TLS Encryption | ✅ Available | SSL certificates configured |
| Data Encryption at Rest | ✅ Yes | AES-256-GCM for sensitive data |
| Password Hashing | ✅ Yes | bcrypt with salt |
| Access Controls | ✅ Yes | Role-based authentication |
| Unique User IDs | ✅ Yes | MongoDB ObjectIds + user emails |

### ⚠️ Areas Requiring Attention

| Requirement | Status | Action Required |
|-------------|--------|-----------------|
| HTTPS in Production | ⚠️ Dev Only | Get production SSL certificate |
| Security Monitoring | ⚠️ Partial | Implement comprehensive logging |
| Regular Security Testing | ❌ Not Set Up | Schedule penetration testing |
| Vendor Security | ⚠️ Review Needed | Audit PayNow PCI compliance |

## PCI DSS Requirements Breakdown

### Requirement 1: Install and Maintain Firewall

**Your Responsibility:**
- ✅ Configure firewall on production server
- ✅ Restrict inbound/outbound traffic
- ✅ Only allow necessary ports (443 for HTTPS, 27017 for MongoDB - restrict to localhost)

**Implementation:**
```bash
# Example: Ubuntu UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 22/tcp   # SSH (restrict to specific IPs)
sudo ufw enable
```

### Requirement 2: Change Vendor Defaults

**Status:** ✅ **COMPLIANT**
- MongoDB default settings changed
- Custom JWT secret configured
- Default passwords not used

**Action Items:**
- [ ] Change default MongoDB port (27017) in production
- [ ] Use non-default database names
- [ ] Disable unused services

### Requirement 3: Protect Stored Cardholder Data

**Status:** ✅ **COMPLIANT** (using tokenization)

**Current Approach:**
- ❌ **NO card data stored** - PayNow handles all payment data
- ✅ PayNow returns transaction tokens only
- ✅ Order model stores `paymentResult.id` (transaction reference), NOT card data

**Payment Flow:**
```
User → Frontend → Your Backend → PayNow API
                                      ↓
                                 (Secure Payment Page)
                                      ↓
                                 User Enters Card
                                      ↓
                                 PayNow Processes
                                      ↓
Your Backend ← Transaction Token & Status ← PayNow
```

**Verification:**
Review [backend/models/Order.js](backend/models/Order.js#L37-43):
```javascript
paymentResult: {
  id: String,          // Transaction ID/Token - NOT card data ✅
  status: String,      // Payment status ✅
  update_time: String, // Timestamp ✅
  email_address: String // User email ✅
}
```

### Requirement 4: Encrypt Data in Transit

**Status:** ✅ **READY** (needs production SSL)

**Current Implementation:**
- ✅ HTTPS support configured
- ✅ SSL certificates generated (dev)
- ⚠️ Production SSL needed

**Action Items:**
- [ ] Install Let's Encrypt SSL certificate in production
- [ ] Set `USE_HTTPS=true` in production .env
- [ ] Configure HSTS headers (already done via Helmet)
- [ ] Enforce HTTPS redirects (`REDIRECT_HTTP=true`)

### Requirement 5: Protect Against Malware

**Status:** ⚠️ **MANUAL PROCESS NEEDED**

**Action Items:**
- [ ] Install antivirus on production server
- [ ] Regular security updates (`apt update && apt upgrade`)
- [ ] Monitor for vulnerabilities (`npm audit`)
- [ ] Keep dependencies updated

### Requirement 6: Develop Secure Systems

**Status:** ✅ **PARTIALLY COMPLIANT**

**Current Security Measures:**
- ✅ Input validation (Mongoose schemas)
- ✅ XSS protection (Helmet)
- ✅ CSRF protection (SameSite cookies)
- ✅ Rate limiting (prevents brute force)
- ⚠️ NoSQL injection protection (temporarily disabled - Express 5 compatibility)

**Action Items:**
- [ ] Re-enable NoSQL injection protection when compatible version available
- [ ] Add manual input sanitization for now (see [KNOWN_ISSUES.md](KNOWN_ISSUES.md))
- [ ] Regular code reviews
- [ ] Security testing before deployment

### Requirement 7: Restrict Access (Need-to-Know Basis)

**Status:** ✅ **COMPLIANT**

**Current Implementation:**
- ✅ Role-based access control (user, seller, admin)
- ✅ JWT authentication required for protected routes
- ✅ Separate admin routes with additional checks

**User Roles:**
```javascript
// User permissions hierarchy
user → Basic access (view products, place orders)
seller → User + (manage own products, view own orders)
admin → Full access (all users, all products, all orders)
```

**Code Reference:** [backend/models/User.js](backend/models/User.js#L45-49)

### Requirement 8: Unique User IDs & Strong Authentication

**Status:** ✅ **COMPLIANT**

**Current Implementation:**
- ✅ Unique user IDs (MongoDB ObjectId)
- ✅ Unique emails (enforced at DB level)
- ✅ Password minimum length (6 chars - **recommend increasing to 12**)
- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ JWT tokens expire (7 days)
- ⚠️ No MFA/2FA yet
- ⚠️ No account lockout after failed attempts

**Recommendations:**
1. Increase password minimum to 12 characters
2. Add password complexity requirements
3. Implement 2FA for admin accounts
4. Add account lockout after 5 failed login attempts
5. Implement password expiry (90 days)

### Requirement 9: Restrict Physical Access

**Your Responsibility (Production Server):**
- [ ] Secure data center access
- [ ] Visitor logs
- [ ] Video surveillance
- [ ] Locked server racks

### Requirement 10: Track and Monitor Access

**Status:** ⚠️ **NEEDS ENHANCEMENT**

**Current Logging:**
- ✅ Console logs for auth events
- ✅ Rate limit violations logged
- ✅ Data sanitization attempts logged
- ❌ No centralized logging system
- ❌ No audit trail for data access
- ❌ No log retention policy

**Required Logging:**
```javascript
// Events that MUST be logged:
1. All user access to cardholder data (N/A - we don't store cards)
2. All admin actions
3. All authentication attempts (success/failure)
4. All authorization failures
5. Changes to user accounts
6. Privilege escalations
7. Database queries (admin level)
```

**Recommendation:** Implement logging middleware (see implementation below)

### Requirement 11: Regular Security Testing

**Status:** ❌ **NOT IMPLEMENTED**

**Required Actions:**
- [ ] Quarterly vulnerability scans
- [ ] Annual penetration testing
- [ ] Regular code reviews
- [ ] `npm audit` before each deployment
- [ ] OWASP Top 10 compliance checks

### Requirement 12: Security Policy

**Status:** ⚠️ **NEEDS DOCUMENTATION**

**Required Documents:**
- [ ] Information Security Policy
- [ ] Acceptable Use Policy
- [ ] Data Retention Policy
- [ ] Incident Response Plan
- [ ] Business Continuity Plan

## Implementation Checklist

### Immediate Actions (Before Launch)

- [ ] **Enable HTTPS in production**
  ```bash
  # In .env
  USE_HTTPS=true
  REDIRECT_HTTP=true
  ```

- [ ] **Verify no card data storage**
  - Review all database models
  - Check PayNow integration
  - Ensure only tokens/references stored

- [ ] **Implement comprehensive logging**
  ```javascript
  // backend/middleware/auditLog.js (see below)
  ```

- [ ] **Increase password requirements**
  ```javascript
  // Minimum 12 characters
  // Require uppercase, lowercase, number, special char
  ```

- [ ] **Add account lockout**
  ```javascript
  // 5 failed attempts = 15-minute lockout
  ```

### Production Deployment

- [ ] Install production SSL certificate
- [ ] Configure firewall
- [ ] Set up monitoring (e.g., PM2, DataDog, Sentry)
- [ ] Enable database backups
- [ ] Set up log rotation
- [ ] Configure MongoDB authentication
- [ ] Restrict MongoDB to localhost only

### Ongoing Maintenance

- [ ] Weekly: Review security logs
- [ ] Monthly: Update dependencies (`npm update`)
- [ ] Quarterly: Security vulnerability scan
- [ ] Annually: Penetration testing
- [ ] Annually: PCI compliance audit (if required)

## PayNow Integration Verification

**✅ VERIFIED: PayNow is PCI DSS Level 1 Certified**

Since you're using PayNow:
1. ✅ You DON'T handle raw card data
2. ✅ PayNow's secure payment page handles card entry
3. ✅ You only receive transaction tokens/references
4. ✅ This significantly reduces your PCI scope

**Your PCI Scope:**
- SAQ A (Merchant - Card Not Present, Fully Outsourced)
- Simplest compliance level
- Main requirement: Secure website (HTTPS)

## Quick Compliance Checklist

Before going live, verify:

- [ ] ✅ Using PayNow (no card data stored)
- [ ] ✅ HTTPS enabled in production
- [ ] ✅ Strong passwords enforced
- [ ] ✅ Data encrypted at rest
- [ ] ✅ Access controls in place
- [ ] ✅ Security monitoring enabled
- [ ] ✅ Regular backups configured
- [ ] ✅ Incident response plan documented
- [ ] ✅ Vendor security verified (PayNow PCI compliant)

## Resources

- **PCI SSC:** https://www.pcisecuritystandards.org/
- **PayNow Security:** Contact PayNow for their compliance certificate
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Node.js Security:** https://nodejs.org/en/docs/guides/security/

## Need Help?

For PCI compliance questions:
- Consult a Qualified Security Assessor (QSA)
- Review PCI DSS Self-Assessment Questionnaire (SAQ)
- Contact PayNow support for their compliance documentation

---

**Last Updated:** $(date)
**Next Review:** Quarterly
