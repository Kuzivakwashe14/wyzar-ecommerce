# Security Quick Start Guide

## Getting Started with Security Features

### 1. Environment Setup

Your `.env` file already contains the necessary security configuration:

```env
# SSL/TLS
USE_HTTPS=false          # Set to true to enable HTTPS
HTTPS_PORT=5443          # HTTPS port

# Data Encryption
ENCRYPTION_KEY=<already-set>  # DO NOT CHANGE this in production!

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 2. Running with HTTP (Default)

```bash
cd backend
npm start
```

Server runs on: `http://localhost:5000`

### 3. Running with HTTPS

**Step 1:** Edit `.env`
```env
USE_HTTPS=true
```

**Step 2:** Start server
```bash
npm start
```

**Step 3:** Access server
- Visit: `https://localhost:5443`
- Accept the security warning (self-signed certificate)

### 4. What's Protected

#### Automatic Encryption
These fields are automatically encrypted in the database:
- Order shipping addresses (fullName, address, phone)

#### Security Features Enabled
- ✅ Helmet security headers
- ✅ CORS protection
- ✅ Rate limiting (auth: 5/15min, OTP: 3/15min, general: 100/15min)
- ✅ NoSQL injection prevention
- ✅ XSS protection
- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ Data encryption (AES-256-GCM)

### 5. Testing Security

**Test Rate Limiting:**
Try logging in 6 times with wrong password - you'll be rate limited.

**Test Encryption:**
```bash
cd backend
node -e "require('dotenv').config(); const {encrypt, decrypt} = require('./utils/encryption'); const text='secret'; const enc=encrypt(text); console.log('Encrypted:', enc); console.log('Decrypted:', decrypt(enc));"
```

**Test HTTPS:**
```bash
# Set USE_HTTPS=true in .env
npm start
# Visit https://localhost:5443
```

### 6. Common Issues

**Issue:** `ENCRYPTION_KEY not set in environment variables`
**Solution:** Make sure `.env` file exists and has `ENCRYPTION_KEY` set

**Issue:** Certificate error in browser
**Solution:** This is normal for self-signed certs. Click "Advanced" → "Proceed"

**Issue:** CORS error from frontend
**Solution:** Add your frontend URL to `ALLOWED_ORIGINS` in `.env`

### 7. Production Deployment

**Before deploying:**

1. Get a real SSL certificate (Let's Encrypt)
2. Set strong secrets in `.env`:
   ```bash
   JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ```
3. Update `.env`:
   ```env
   NODE_ENV=production
   USE_HTTPS=true
   REDIRECT_HTTP=true
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

See [SECURITY.md](SECURITY.md) for complete documentation.

### 8. Files Created

Security implementation files:
- `utils/encryption.js` - Encryption/decryption utilities
- `utils/encryptedField.js` - Mongoose plugin for auto-encryption
- `config/security.js` - Security middleware configuration
- `ssl/` - SSL certificates directory
- `SECURITY.md` - Full security documentation

### Need Help?

See the full [SECURITY.md](SECURITY.md) documentation for:
- Production SSL setup
- Encryption details
- Security best practices
- Troubleshooting
