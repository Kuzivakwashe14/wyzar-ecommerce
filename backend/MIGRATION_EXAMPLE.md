# Migrating Routes to Better Auth

This guide shows how to migrate your existing routes from custom JWT authentication to Better Auth middleware.

## Before (Custom JWT Auth)

```javascript
// backend/routes/product.js (OLD)
const router = require('express').Router();
const { protect } = require('../middleware/auth'); // Old JWT middleware
const Product = require('../models/Product');

// Old: JWT authentication
router.post('/', protect, async (req, res) => {
  try {
    // req.user comes from JWT middleware
    const userId = req.user.id;

    // Check if user is a seller (manual check)
    if (!req.user.isSeller) {
      return res.status(403).json({
        success: false,
        msg: 'Only sellers can create products'
      });
    }

    const product = await Product.create({
      ...req.body,
      seller: userId,
    });

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
});

module.exports = router;
```

## After (Better Auth)

```javascript
// backend/routes/product.js (NEW)
const router = require('express').Router();
const {
  requireAuth,
  requireSeller,
  requireEmailVerified
} = require('../middleware/betterAuth'); // New Better Auth middleware
const Product = require('../models/Product');

// New: Better Auth with automatic role checking
router.post('/',
  requireAuth,           // 1. Verify authentication
  requireEmailVerified,  // 2. Ensure email is verified
  requireSeller,         // 3. Ensure user is a seller
  async (req, res) => {
    try {
      // req.user is guaranteed to exist and be a verified seller
      const userId = req.user.id;

      const product = await Product.create({
        ...req.body,
        seller: userId,
      });

      res.json({ success: true, product });
    } catch (error) {
      res.status(500).json({ success: false, msg: error.message });
    }
  }
);

module.exports = router;
```

## Key Improvements

### 1. No Manual Role Checks
**Before:**
```javascript
if (!req.user.isSeller) {
  return res.status(403).json({ msg: 'Only sellers...' });
}
```

**After:**
```javascript
// Just use middleware
requireSeller
```

### 2. Email Verification Built-in
**Before:**
```javascript
if (!req.user.emailVerified) {
  return res.status(403).json({ msg: 'Verify your email' });
}
```

**After:**
```javascript
requireEmailVerified
```

### 3. Consistent Error Messages
Better Auth provides standardized error responses across all routes.

### 4. Better Organization
Middleware clearly shows route requirements at a glance.

## More Migration Examples

### Admin Route

**Before:**
```javascript
router.get('/admin/users', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Admin only' });
  }
  // Admin logic
});
```

**After:**
```javascript
router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  // Admin logic - no manual check needed
});
```

### Optional Authentication

**Before:**
```javascript
router.get('/products', async (req, res) => {
  // Parse JWT manually if present
  const token = req.headers.authorization?.split(' ')[1];
  let user = null;

  if (token) {
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Ignore invalid token
    }
  }

  // Use user if available
  const favorites = user ? await getFavorites(user.id) : [];
});
```

**After:**
```javascript
router.get('/products', optionalAuth, async (req, res) => {
  // req.user is automatically available if authenticated
  const favorites = req.user ? await getFavorites(req.user.id) : [];
});
```

### Organization (Seller Shop) Route

**Before:**
```javascript
router.put('/shop/settings', protect, async (req, res) => {
  // Manual org membership check
  const membership = await getOrgMembership(req.user.id, req.body.shopId);

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return res.status(403).json({ msg: 'Permission denied' });
  }

  // Update logic
});
```

**After:**
```javascript
router.put('/shop/settings',
  requireAuth,
  requireOrganization,
  requireOrgRole(['owner', 'admin']),
  async (req, res) => {
    // req.organizationId and req.orgMembership are available
    // No manual checks needed
  }
);
```

### Sensitive Action (2FA Required)

**Before:**
```javascript
router.delete('/account', protect, async (req, res) => {
  // Manual 2FA check
  const twoFactorEnabled = await check2FA(req.user.id);

  if (!twoFactorEnabled) {
    return res.status(403).json({
      msg: 'Enable 2FA to perform this action'
    });
  }

  // Delete logic
});
```

**After:**
```javascript
router.delete('/account', requireAuth, require2FA, async (req, res) => {
  // User is guaranteed to have 2FA enabled
});
```

## Gradual Migration Strategy

### Phase 1: Add Better Auth Alongside Existing Auth
```javascript
// Support both auth methods during transition
const oldAuth = require('./middleware/auth');
const { requireAuth: newAuth } = require('./middleware/betterAuth');

const dualAuth = async (req, res, next) => {
  // Try new auth first
  try {
    await newAuth(req, res, () => {});
    return next();
  } catch (err) {
    // Fall back to old auth
    return oldAuth(req, res, next);
  }
};

router.get('/profile', dualAuth, handler);
```

### Phase 2: Migrate Routes One by One
```javascript
// New routes use Better Auth
router.post('/v2/products', requireAuth, requireSeller, handler);

// Old routes still use JWT
router.post('/products', protect, handler);
```

### Phase 3: Deprecate Old Auth
```javascript
// Mark old endpoints as deprecated
router.post('/products', (req, res) => {
  res.status(410).json({
    msg: 'This endpoint is deprecated. Use /v2/products'
  });
});
```

## User Object Differences

### Old JWT User Object
```javascript
req.user = {
  id: '507f1f77bcf86cd799439011',
  email: 'user@example.com',
  isSeller: true,
  // Limited fields from JWT payload
}
```

### New Better Auth User Object
```javascript
req.user = {
  id: '507f1f77bcf86cd799439011',
  email: 'user@example.com',
  name: 'John Doe',
  role: 'seller',
  isSeller: true,
  isEmailVerified: true,
  isPhoneVerified: false,
  isSuspended: false,
  phone: '+263771234567',
  image: 'https://...',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  // More complete user data
}
```

## Session Management Differences

### Old (JWT)
- Token expires after fixed time
- No server-side session tracking
- Can't revoke tokens easily

### New (Better Auth)
- Server-side session tracking
- Automatic session refresh
- Easy revocation
- Better security

## Benefits Summary

✅ **Less Boilerplate** - No manual role/permission checks
✅ **Better Security** - Built-in 2FA, email verification
✅ **Consistent Errors** - Standardized error messages
✅ **Session Management** - Server-side tracking and revocation
✅ **Organization Support** - Multi-user seller shops
✅ **Better DX** - Clear, declarative middleware

## Quick Migration Checklist

- [ ] Install Better Auth dependencies
- [ ] Set up Better Auth configuration
- [ ] Create Better Auth middleware file
- [ ] Choose migration strategy (gradual vs. all-at-once)
- [ ] Update route files one by one
- [ ] Test each migrated route
- [ ] Update frontend to use Better Auth client
- [ ] Migrate user data to Better Auth collections
- [ ] Deprecate old auth endpoints
- [ ] Remove old auth middleware

## Need Help?

- [Better Auth Middleware Guide](./MIDDLEWARE_GUIDE.md)
- [Quick Reference](./middleware/QUICK_REFERENCE.md)
- [Example Routes](./routes/examples/protectedRoutes.example.js)
- [Better Auth Docs](https://better-auth.com/docs)

---

**Next Steps:** Start with non-critical routes and gradually migrate to Better Auth.
