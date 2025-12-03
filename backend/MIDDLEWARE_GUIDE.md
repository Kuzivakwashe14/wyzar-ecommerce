# Better Auth Middleware Guide

## Overview

The Better Auth middleware provides secure, easy-to-use authentication and authorization for your Express routes.

## Middleware Functions

### Authentication Middleware

#### `requireAuth`
Requires user to be authenticated. Attaches `req.user` and `req.session` to the request.

```javascript
const { requireAuth } = require('./middleware/betterAuth');

router.get('/profile', requireAuth, (req, res) => {
  // req.user is guaranteed to exist
  res.json({ user: req.user });
});
```

**Returns 401 if:**
- No session exists
- Session is invalid/expired

**Returns 403 if:**
- Account is suspended

#### `optionalAuth`
Optionally attaches user if authenticated, but doesn't block if not.

```javascript
const { optionalAuth } = require('./middleware/betterAuth');

router.get('/products', optionalAuth, (req, res) => {
  const userId = req.user?.id; // May be undefined
  // Show personalized content if logged in
});
```

**Use case:**
- Public routes that behave differently for authenticated users
- Product listings that show favorites for logged-in users

### Role-Based Middleware

#### `requireSeller`
Requires user to have seller role. Must be used AFTER `requireAuth`.

```javascript
router.post('/products', requireAuth, requireSeller, (req, res) => {
  // User is guaranteed to be a seller
});
```

**Returns 401 if:** Not authenticated
**Returns 403 if:** Not a seller (and not admin)

#### `requireAdmin`
Requires user to have admin role. Must be used AFTER `requireAuth`.

```javascript
router.get('/admin/users', requireAuth, requireAdmin, (req, res) => {
  // User is guaranteed to be an admin
});
```

**Returns 401 if:** Not authenticated
**Returns 403 if:** Not an admin

### Organization Middleware

#### `requireOrganization`
Requires user to have an active organization selected. Must be used AFTER `requireAuth`.

```javascript
router.post('/org/products', requireAuth, requireOrganization, (req, res) => {
  const orgId = req.organizationId; // Guaranteed to exist
});
```

**Returns 401 if:** Not authenticated
**Returns 400 if:** No active organization

#### `requireOrgRole(roles)`
Requires specific organization role(s). Must be used AFTER `requireAuth` and `requireOrganization`.

```javascript
// Single role
router.delete('/org', requireAuth, requireOrganization, requireOrgRole('owner'), handler);

// Multiple roles
router.put('/org/settings',
  requireAuth,
  requireOrganization,
  requireOrgRole(['owner', 'admin']),
  handler
);
```

**Roles:**
- `owner` - Organization owner (full control)
- `admin` - Organization admin (can manage products/orders)
- `member` - Organization member (read-only)

**Returns 401 if:** Not authenticated or no organization
**Returns 403 if:** User doesn't have required role

### Security Middleware

#### `requireEmailVerified`
Requires user's email to be verified. Must be used AFTER `requireAuth`.

```javascript
router.put('/profile', requireAuth, requireEmailVerified, (req, res) => {
  // Email is verified
});
```

**Returns 401 if:** Not authenticated
**Returns 403 if:** Email not verified

#### `require2FA`
Requires user to have two-factor authentication enabled. Must be used AFTER `requireAuth`.

```javascript
router.delete('/account', requireAuth, require2FA, (req, res) => {
  // User has 2FA enabled
});
```

**Returns 401 if:** Not authenticated
**Returns 403 if:** 2FA not enabled

**Use case:**
- Sensitive operations (delete account, change email)
- Admin actions
- Financial transactions

## Usage Examples

### Basic Authentication

```javascript
// Public route
router.get('/products', async (req, res) => {
  // Anyone can access
});

// Authenticated route
router.get('/orders', requireAuth, async (req, res) => {
  const userId = req.user.id;
  // Get user's orders
});
```

### Role-Based Access

```javascript
// Seller-only route
router.post('/products', requireAuth, requireSeller, async (req, res) => {
  // Only sellers can create products
});

// Admin-only route
router.get('/admin/dashboard', requireAuth, requireAdmin, async (req, res) => {
  // Only admins can access
});
```

### Organization Routes

```javascript
// Any organization member
router.get('/org/products',
  requireAuth,
  requireOrganization,
  async (req, res) => {
    const orgId = req.organizationId;
    // Get organization products
  }
);

// Owner/Admin only
router.put('/org/settings',
  requireAuth,
  requireOrganization,
  requireOrgRole(['owner', 'admin']),
  async (req, res) => {
    // Update organization settings
  }
);

// Owner only
router.delete('/org',
  requireAuth,
  requireOrganization,
  requireOrgRole('owner'),
  async (req, res) => {
    // Delete organization
  }
);
```

### Chaining Multiple Middleware

```javascript
// Require authentication + seller + email verification
router.post('/products/featured',
  requireAuth,
  requireEmailVerified,
  requireSeller,
  async (req, res) => {
    // All checks passed
  }
);

// Require authentication + admin + 2FA
router.delete('/users/:id',
  requireAuth,
  requireAdmin,
  require2FA,
  async (req, res) => {
    // Critical admin action with 2FA
  }
);
```

### Optional Authentication

```javascript
router.get('/products', optionalAuth, async (req, res) => {
  if (req.user) {
    // Show personalized products
    const favorites = await getUserFavorites(req.user.id);
    return res.json({ products, favorites });
  }

  // Show public products
  res.json({ products });
});
```

## Request Object Extensions

After authentication middleware runs, these properties are available:

### `req.user`
Current authenticated user object.

```javascript
{
  id: string,
  email: string,
  name: string,
  role: 'buyer' | 'seller' | 'admin',
  isSeller: boolean,
  isEmailVerified: boolean,
  isPhoneVerified: boolean,
  isSuspended: boolean,
  phone: string | null,
  image: string | null,
  createdAt: Date,
  updatedAt: Date
}
```

### `req.session`
Current session object.

```javascript
{
  id: string,
  userId: string,
  expiresAt: Date,
  activeOrganizationId?: string
}
```

### `req.organizationId`
Active organization ID (after `requireOrganization`).

```javascript
const orgId = req.organizationId; // string
```

### `req.orgMembership`
User's organization membership (after `requireOrgRole`).

```javascript
{
  id: string,
  organizationId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member',
  createdAt: Date
}
```

## Helper Functions

### `getCurrentUser(req)`
Get current user from request without middleware.

```javascript
const { getCurrentUser } = require('./middleware/betterAuth');

app.post('/api/webhook', async (req, res) => {
  const user = await getCurrentUser(req);

  if (user) {
    // User is authenticated
  } else {
    // No user
  }
});
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "msg": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "msg": "Seller account required"
}
```

```json
{
  "success": false,
  "msg": "Account suspended. Please contact support."
}
```

### 400 Bad Request
```json
{
  "success": false,
  "msg": "No active organization selected"
}
```

## Migration from Existing Auth

If you have existing JWT-based auth, you can migrate gradually:

```javascript
// Use both middleware during migration
const oldAuth = require('./middleware/auth'); // Existing
const { requireAuth: newAuth } = require('./middleware/betterAuth');

// Route supports both auth methods
router.get('/profile', async (req, res, next) => {
  try {
    // Try new auth first
    await newAuth(req, res, () => {});
    next();
  } catch {
    // Fall back to old auth
    oldAuth(req, res, next);
  }
}, handler);
```

## Best Practices

### 1. Order Matters
Always apply middleware in this order:
```javascript
requireAuth          // First - authenticate user
requireEmailVerified // Second - verify email
requireSeller        // Third - check role
requireOrganization  // Fourth - check org
requireOrgRole(...)  // Fifth - check org role
require2FA           // Last - verify 2FA
```

### 2. Use optionalAuth for Public Routes
```javascript
// Good - allows personalization
router.get('/products', optionalAuth, handler);

// Bad - blocks unauthenticated users
router.get('/products', requireAuth, handler);
```

### 3. Require 2FA for Sensitive Actions
```javascript
// Critical actions should require 2FA
router.delete('/account', requireAuth, require2FA, handler);
router.post('/withdraw-funds', requireAuth, require2FA, handler);
```

### 4. Check Email Verification for Important Actions
```javascript
// Require verification before allowing posts
router.post('/products', requireAuth, requireEmailVerified, requireSeller, handler);
```

### 5. Use Organization Roles Granularly
```javascript
// Only owners can delete
requireOrgRole('owner')

// Owners and admins can manage
requireOrgRole(['owner', 'admin'])

// All members can view
requireOrganization // (without role check)
```

## Testing

```bash
# Test authenticated endpoint
curl -X GET http://localhost:5000/api/profile \
  -H "Cookie: session=<session-token>"

# Test with authorization header
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer <session-token>"
```

## Files

- [middleware/betterAuth.js](middleware/betterAuth.js) - Middleware implementation
- [routes/examples/protectedRoutes.example.js](routes/examples/protectedRoutes.example.js) - Usage examples

---

For Better Auth API documentation: https://better-auth.com/docs
