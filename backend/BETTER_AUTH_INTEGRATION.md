# Better Auth Express Integration Complete ✅

## Summary

Better Auth has been successfully integrated into the Express server and is ready to use.

## What Was Configured

### 1. Express Integration ([index.js](backend/index.js))

Better Auth handler mounted at `/api/better-auth` with proper middleware ordering:

```javascript
// BEFORE express.json() - Better Auth needs to parse requests itself
app.use('/api/better-auth', (req, res, next) => {
  return toNodeHandler(auth)(req, res, next);
});
```

**Critical Ordering:**
1. Security middleware (helmet, CORS, rate limiting)
2. **Better Auth handler** ← Mounted here
3. Body parsing middleware (express.json, urlencoded)
4. Application routes

### 2. Route Configuration

- **Better Auth Routes**: `/api/better-auth/*`
- **Existing Auth Routes**: `/api/auth/*` (your custom authentication - kept for migration)

This allows you to run both authentication systems side-by-side during migration.

### 3. Environment Variables

Updated [.env](backend/.env:14):
```bash
BETTER_AUTH_URL=http://localhost:5000/api/better-auth
```

## Available Endpoints

Better Auth is now accessible at: `http://localhost:5000/api/better-auth`

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/better-auth/sign-up/email` | Register new user |
| POST | `/api/better-auth/sign-in/email` | Login user |
| POST | `/api/better-auth/sign-out` | Logout user |
| GET | `/api/better-auth/session` | Get current session |
| POST | `/api/better-auth/verify-email` | Verify email address |
| POST | `/api/better-auth/reset-password` | Request password reset |

### Two-Factor Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/better-auth/two-factor/enable` | Enable 2FA for user |
| POST | `/api/better-auth/two-factor/disable` | Disable 2FA |
| POST | `/api/better-auth/two-factor/verify-otp` | Verify OTP code |
| POST | `/api/better-auth/two-factor/verify-totp` | Verify TOTP code |
| GET | `/api/better-auth/two-factor/generate-totp` | Generate TOTP QR code |

### Organization (Seller) Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/better-auth/organization/create` | Create seller organization |
| GET | `/api/better-auth/organization/list` | List user's organizations |
| PUT | `/api/better-auth/organization/update` | Update organization |
| DELETE | `/api/better-auth/organization/delete` | Delete organization |
| POST | `/api/better-auth/organization/invite-member` | Invite team member |
| POST | `/api/better-auth/organization/accept-invitation` | Accept invitation |
| GET | `/api/better-auth/organization/members` | List organization members |

## Testing

### Verify Server is Running

```bash
curl http://localhost:5000/api/better-auth/session
```

Expected response: `null` (no active session)

### Test User Registration

```bash
curl -X POST http://localhost:5000/api/better-auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

### Test User Login

```bash
curl -X POST http://localhost:5000/api/better-auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### Check MongoDB Collections

Run the test script:
```bash
node scripts/test-better-auth.js
```

This shows which collections exist and which will be auto-created.

## MongoDB Collections

Better Auth will auto-create these collections on first use:

| Collection | Created When | Purpose |
|------------|--------------|---------|
| `user` | First signup | User accounts |
| `account` | First signup | Credentials storage |
| `session` | First login | Session tracking |
| `verification` | Email verification requested | Email tokens |
| `twoFactor` | 2FA enabled | 2FA secrets |
| `organization` | Organization created | Seller shops |
| `member` | User added to org | Memberships |
| `invitation` | Invitation sent | Pending invites |

## Security Features

### 1. **CORS Protection**
Better Auth respects your existing CORS configuration:
```javascript
trustedOrigins: [process.env.FRONTEND_URL, 'http://localhost:3000']
```

### 2. **Rate Limiting**
Uses your existing `generalLimiter` middleware for all endpoints.

### 3. **Session Security**
- 7-day session expiration
- Secure cookie flags (httpOnly, sameSite)
- Automatic session refresh

### 4. **Password Security**
- Minimum 8 characters enforced
- Automatic bcrypt hashing
- Salt generation per user

## Migration Strategy

### Current Setup
You now have **two authentication systems running in parallel**:

1. **Better Auth** (`/api/better-auth/*`) - New system with 2FA
2. **Custom Auth** (`/api/auth/*`) - Existing system

### Recommended Migration Path

#### Phase 1: Testing (Current)
- Better Auth is available for new features
- Existing users use old auth system
- Test 2FA and organization features

#### Phase 2: Gradual Migration
- Create migration script to move users to Better Auth
- Update frontend to use Better Auth endpoints
- Keep old endpoints for backward compatibility

#### Phase 3: Full Migration
- All users migrated to Better Auth
- Deprecate old `/api/auth` endpoints
- Remove custom auth code

### Migration Script Template

```javascript
// scripts/migrate-users.js
const User = require('./models/User'); // Old model
const { auth } = require('./lib/auth'); // Better Auth

async function migrateUsers() {
  const oldUsers = await User.find({});

  for (const oldUser of oldUsers) {
    // Create user in Better Auth
    await auth.api.signUpEmail({
      email: oldUser.email,
      password: 'temp-password', // User will reset
      name: oldUser.name,
      // Copy custom fields
      phone: oldUser.phone,
      isSeller: oldUser.isSeller,
      role: oldUser.role
    });
  }
}
```

## Frontend Integration (Next Step)

### Install Better Auth Client

```bash
cd frontend
npm install better-auth
```

### Setup Auth Client

```typescript
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/client'

export const authClient = createAuthClient({
  baseURL: 'http://localhost:5000/api/better-auth'
})
```

### Example Usage

```typescript
// Sign up
await authClient.signUp.email({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe'
})

// Sign in
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password123'
})

// Get session
const session = await authClient.getSession()

// Enable 2FA
await authClient.twoFactor.enable()
```

## Troubleshooting

### Issue: Server won't start
**Solution**: Check that Better Auth handler is mounted BEFORE express.json()

### Issue: Endpoints return 404
**Solution**: Verify `BETTER_AUTH_URL` in .env matches the mounted path

### Issue: CORS errors from frontend
**Solution**: Ensure `FRONTEND_URL` is in trustedOrigins and CORS config

### Issue: Collections not created
**Solution**: Collections are created on first use. Make a signup request first.

## Server Logs

When starting the server, you should see:
```
📡 HTTP Server running on http://localhost:5000
🔐 Better Auth mounted at http://localhost:5000/api/better-auth/*
Successfully connected to MongoDB Compass!
```

## Documentation Links

- Better Auth Docs: https://better-auth.com/docs
- API Reference: https://better-auth.com/docs/api-reference
- Client SDK: https://better-auth.com/docs/client
- Plugins: https://better-auth.com/docs/plugins

## Testing Scripts

- **Verify Setup**: `node scripts/verify-auth-setup.js`
- **Test Integration**: `node scripts/test-better-auth.js`

---

**Status**: ✅ Better Auth Integrated | ✅ Server Running | ⏳ Awaiting Frontend Integration
