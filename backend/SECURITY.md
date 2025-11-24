# WyZar E-Commerce Security Guide

This document outlines the security features implemented in the WyZar backend and how to use them.

## Table of Contents
- [SSL/TLS Encryption](#ssltls-encryption)
- [Data Encryption](#data-encryption)
- [Security Middleware](#security-middleware)
- [Rate Limiting](#rate-limiting)
- [Production Deployment](#production-deployment)
- [Security Best Practices](#security-best-practices)

## SSL/TLS Encryption

### Development Setup

The backend includes self-signed SSL certificates for development. To enable HTTPS:

1. **Enable HTTPS in `.env`:**
   ```env
   USE_HTTPS=true
   HTTPS_PORT=5443
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Access via HTTPS:**
   - HTTPS: `https://localhost:5443`
   - HTTP: `http://localhost:5000` (if REDIRECT_HTTP is false)

4. **Browser Warning:**
   - You'll see a security warning because the certificate is self-signed
   - Click "Advanced" → "Proceed to localhost" to continue
   - This is normal for development

### Production SSL Certificates

For production, use certificates from a trusted Certificate Authority (CA):

#### Option 1: Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

Update your code to use these certificates:
```javascript
const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
};
```

#### Option 2: Commercial SSL Certificate

1. Purchase from a CA (e.g., DigiCert, Comodo, GoDaddy)
2. Generate CSR (Certificate Signing Request)
3. Install the certificates
4. Update file paths in your server configuration

### Regenerating Development Certificates

To regenerate self-signed certificates:

```bash
cd backend/ssl
openssl req -nodes -new -x509 -keyout server.key -out server.cert -days 365 -config openssl.cnf
```

## Data Encryption

### What Gets Encrypted

The following data is automatically encrypted at rest:

**Order Model:**
- `shippingAddress.fullName` - Customer's full name
- `shippingAddress.address` - Delivery address
- `shippingAddress.phone` - Contact phone number

**Passwords:**
- User passwords are hashed using bcrypt (one-way, irreversible)

### Encryption Key

A unique encryption key is required in your `.env` file:

```env
ENCRYPTION_KEY=your_encryption_key_here
```

**Generate a new key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**IMPORTANT:**
- Never commit your encryption key to Git
- Use a different key for each environment (dev/staging/production)
- If you lose the key, encrypted data cannot be recovered
- Rotate keys periodically for enhanced security

### How Encryption Works

1. **Automatic Encryption:** Data is encrypted before saving to MongoDB
2. **Automatic Decryption:** Data is decrypted when retrieved
3. **Algorithm:** AES-256-GCM (authenticated encryption)
4. **Key Derivation:** PBKDF2 with 100,000 iterations

### Adding Encryption to New Fields

To encrypt a field in a Mongoose model:

```javascript
const encryptedFieldsPlugin = require('../utils/encryptedField');

const MySchema = new Schema({
  sensitiveField: { type: String, encrypted: true },
  normalField: { type: String }
});

MySchema.plugin(encryptedFieldsPlugin);
```

## Security Middleware

### Helmet (Security Headers)

Helmet sets various HTTP headers to protect against common attacks:

- **Content Security Policy** - Disabled for API-only backend (enable if serving HTML)
- **X-Frame-Options** - Prevents clickjacking
- **X-Content-Type-Options** - Prevents MIME sniffing
- **Strict-Transport-Security** - Forces HTTPS (when enabled)
- **X-XSS-Protection** - Enables XSS filter

**Note:** CSP is disabled for API-only backends since it's designed for HTML content. If you serve HTML from this backend, re-enable CSP in `config/security.js`.

### CORS (Cross-Origin Resource Sharing)

Configured to allow only trusted origins:

```env
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

In production, update this to your actual frontend domain.

### MongoDB Sanitization

Prevents NoSQL injection attacks by sanitizing user input:
- Removes `$` and `.` from user-provided data
- Logs sanitization attempts for monitoring

### HPP (HTTP Parameter Pollution)

Protects against parameter pollution attacks.

## Rate Limiting

### Authentication Endpoints

**Login & Registration:**
- 5 requests per 15 minutes per IP
- Helps prevent brute force attacks

```javascript
// Applied to:
POST /api/auth/login
POST /api/auth/register
```

### OTP Endpoints

**SMS/OTP Requests:**
- 3 requests per 15 minutes per IP
- Prevents OTP spam

```javascript
// Applied to:
POST /api/otp/send
```

### General API

**All other endpoints:**
- 100 requests per 15 minutes per IP

### Customizing Rate Limits

Edit [config/security.js](config/security.js):

```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Increase this for more requests
  message: 'Too many attempts, please try again later'
});
```

## Production Deployment

### Environment Variables

**Required for Production:**

```env
# Set to production
NODE_ENV=production

# Enable HTTPS
USE_HTTPS=true
REDIRECT_HTTP=true

# Strong secrets (use different values!)
JWT_SECRET=<strong-random-string>
ENCRYPTION_KEY=<strong-random-string>

# Restrict CORS to your domain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Production Checklist

- [ ] Use real SSL certificates (Let's Encrypt or commercial)
- [ ] Set `NODE_ENV=production`
- [ ] Enable `USE_HTTPS=true`
- [ ] Enable `REDIRECT_HTTP=true`
- [ ] Generate unique `JWT_SECRET`
- [ ] Generate unique `ENCRYPTION_KEY`
- [ ] Update `ALLOWED_ORIGINS` to production domains
- [ ] Never expose `.env` file
- [ ] Keep SSL private keys secure (chmod 600)
- [ ] Set up MongoDB authentication
- [ ] Enable MongoDB encryption at rest
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Regular security audits

### Reverse Proxy (Recommended)

Use Nginx as a reverse proxy for additional security:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Security Best Practices

### Password Security

- Minimum 6 characters (consider increasing to 8-12)
- Passwords are hashed with bcrypt (salt rounds: 10)
- Never log or display passwords

### JWT Tokens

- Tokens expire after 7 days
- Store tokens securely (httpOnly cookies recommended)
- Include minimal user info in token payload

### Sensitive Data

- Never log sensitive data (passwords, tokens, credit cards)
- Encrypt data at rest and in transit
- Minimize data collection

### API Security

- All inputs are validated
- SQL/NoSQL injection protection enabled
- XSS protection enabled
- CSRF tokens recommended for state-changing operations

### Monitoring

Monitor for security events:
- Failed login attempts
- Rate limit violations
- Unusual API patterns
- Data sanitization triggers

### Regular Updates

- Keep dependencies updated: `npm audit fix`
- Review security advisories
- Apply security patches promptly

## Security Contact

For security concerns or to report vulnerabilities, contact:
- Email: security@wyzar.co.zw

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
