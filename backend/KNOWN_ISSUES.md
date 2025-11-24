# Known Issues

## Express 5 Compatibility

### express-mongo-sanitize Incompatibility

**Issue:** `express-mongo-sanitize` v2.2.0 is incompatible with Express 5.x

**Error:**
```
TypeError: Cannot set property query of #<IncomingMessage> which has only a getter
```

**Cause:** Express 5 made several request properties (like `req.query`) read-only, but `express-mongo-sanitize` tries to modify them.

**Current Workaround:**
The middleware has been temporarily disabled in [index.js:30](index.js#L30):
```javascript
// app.use(mongoSanitizeConfig); // TODO: Temporarily disabled - incompatible with Express 5
```

**Impact:**
- NoSQL injection protection via automatic sanitization is disabled
- Your application still has basic protection through:
  - Input validation in route handlers
  - Mongoose schema validation
  - Rate limiting (prevents brute force attacks)

**Recommendations:**

1. **Manual Input Validation** (Temporary solution):
   Add validation in your route handlers:
   ```javascript
   const sanitize = (obj) => {
     if (typeof obj !== 'object' || obj === null) return obj;

     Object.keys(obj).forEach(key => {
       if (key.includes('$') || key.includes('.')) {
         delete obj[key];
       } else if (typeof obj[key] === 'object') {
         obj[key] = sanitize(obj[key]);
       }
     });

     return obj;
   };

   // In routes:
   req.body = sanitize(req.body);
   req.params = sanitize(req.params);
   ```

2. **Wait for Update** (Recommended):
   Monitor for Express 5 compatible version:
   - Check: https://github.com/fiznool/express-mongo-sanitize/issues
   - Or consider alternatives like `mongo-sanitize` npm package

3. **Downgrade to Express 4** (Not recommended):
   ```bash
   npm install express@^4.18.0
   ```
   This will restore full `express-mongo-sanitize` functionality but you'll lose Express 5 features.

**Status:** ⏳ Waiting for `express-mongo-sanitize` to release Express 5 compatible version

**Tracking:**
- Package: https://www.npmjs.com/package/express-mongo-sanitize
- GitHub: https://github.com/fiznool/express-mongo-sanitize

---

## Future Considerations

### SSL/TLS Certificates
- Development uses self-signed certificates
- Production requires proper SSL certificates (Let's Encrypt recommended)
- See [SECURITY.md](SECURITY.md) for setup instructions

### Email Service
- Email credentials need to be configured in `.env`
- Currently using Gmail SMTP (may require app-specific password)
- Consider using a dedicated email service for production (SendGrid, Mailgun, etc.)
