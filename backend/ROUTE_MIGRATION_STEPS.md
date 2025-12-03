# Step-by-Step Route Migration Guide

## Overview

This guide shows you how to update your existing routes from custom JWT authentication to Better Auth middleware.

## Before You Start

⚠️ **Important:** Test each route after migration to ensure it works correctly.

### Backup Your Routes

```bash
# Create a backup of your routes directory
cp -r routes routes.backup
```

## Step 1: Understand the Changes

### Old Authentication Flow
```javascript
const auth = require('../middleware/auth');

router.post('/products', auth, async (req, res) => {
  // Manual checks needed
  const user = await User.findById(req.user.id);
  if (!user.isSeller) {
    return res.status(403).json({ msg: 'Not authorized' });
  }
  // Handle request
});
```

### New Authentication Flow
```javascript
const { requireAuth, requireSeller } = require('../middleware/betterAuth');

router.post('/products', requireAuth, requireSeller, async (req, res) => {
  // No manual checks needed!
  // req.user is guaranteed to be an authenticated seller
  // Handle request
});
```

## Step 2: Update Imports

### Find All Route Files

```bash
# List all route files
find backend/routes -name "*.js" -type f
```

### Update Each File's Imports

**OLD:**
```javascript
const auth = require('../middleware/auth');
```

**NEW:**
```javascript
const {
  requireAuth,
  requireSeller,
  requireAdmin,
  requireEmailVerified,
  optionalAuth
} = require('../middleware/betterAuth');
```

## Step 3: Update Route Definitions

### Example 1: Public Routes

**Before:**
```javascript
// No auth needed
router.get('/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});
```

**After (with optional personalization):**
```javascript
// Optional auth for personalization
router.get('/products', optionalAuth, async (req, res) => {
  const products = await Product.find();

  // Personalize if user is logged in
  const favorites = req.user ? await getFavorites(req.user.id) : [];

  res.json({ products, favorites });
});
```

### Example 2: Authenticated Routes

**Before:**
```javascript
router.get('/orders', auth, async (req, res) => {
  const orders = await Order.find({ user: req.user.id });
  res.json(orders);
});
```

**After:**
```javascript
router.get('/orders', requireAuth, async (req, res) => {
  // req.user is guaranteed to exist
  const orders = await Order.find({ user: req.user.id });
  res.json(orders);
});
```

### Example 3: Seller Routes

**Before:**
```javascript
router.post('/products', auth, async (req, res) => {
  // Manual seller check
  const user = await User.findById(req.user.id);
  if (!user.isSeller) {
    return res.status(403).json({ msg: 'Only sellers can create products' });
  }

  const product = await Product.create({
    ...req.body,
    seller: req.user.id
  });
  res.json(product);
});
```

**After:**
```javascript
router.post('/products',
  requireAuth,
  requireEmailVerified,  // Ensure email is verified
  requireSeller,         // Automatic seller check!
  async (req, res) => {
    // No manual checks needed
    const product = await Product.create({
      ...req.body,
      seller: req.user.id
    });
    res.json(product);
  }
);
```

### Example 4: Admin Routes

**Before:**
```javascript
router.get('/admin/users', auth, async (req, res) => {
  // Manual admin check
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Admin access required' });
  }

  const users = await User.find();
  res.json(users);
});
```

**After:**
```javascript
router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  // req.user is guaranteed to be an admin
  const users = await User.find();
  res.json(users);
});
```

## Step 4: Remove Manual Checks

### Checklist of Manual Checks to Remove

When you add Better Auth middleware, you can remove these manual checks:

✅ **Remove `isSeller` checks** - Use `requireSeller` instead
```javascript
// REMOVE THIS:
if (!user.isSeller) {
  return res.status(403).json({ msg: 'Only sellers...' });
}
```

✅ **Remove role checks** - Use `requireAdmin` or `requireSeller` instead
```javascript
// REMOVE THIS:
if (req.user.role !== 'admin') {
  return res.status(403).json({ msg: 'Admin only' });
}
```

✅ **Remove email verification checks** - Use `requireEmailVerified` instead
```javascript
// REMOVE THIS:
if (!user.emailVerified) {
  return res.status(403).json({ msg: 'Verify your email' });
}
```

✅ **Remove suspension checks** - Handled automatically by `requireAuth`
```javascript
// REMOVE THIS:
if (user.isSuspended) {
  return res.status(403).json({ msg: 'Account suspended' });
}
```

## Step 5: Update Error Responses

Better Auth provides standardized error responses:

### Before (Inconsistent)
```javascript
res.status(401).json({ msg: 'Not authorized' });
res.status(403).json({ message: 'Forbidden' });
res.status(401).json({ error: 'No auth' });
```

### After (Consistent)
```javascript
// Middleware handles these automatically:
// 401: { success: false, msg: 'Authentication required' }
// 403: { success: false, msg: 'Seller account required' }
```

## Step 6: Test Each Route

### Testing Checklist

For each migrated route:

1. **Test without authentication**
   ```bash
   curl http://localhost:5000/api/products
   ```
   Expected: Public routes work, protected routes return 401

2. **Test with authentication**
   ```bash
   curl http://localhost:5000/api/orders \
     -H "Cookie: session=<token>"
   ```
   Expected: Authenticated routes work

3. **Test role restrictions**
   ```bash
   # Non-seller trying to create product
   curl -X POST http://localhost:5000/api/products \
     -H "Cookie: session=<buyer-token>"
   ```
   Expected: 403 Forbidden

4. **Test ownership checks**
   ```bash
   # User trying to delete someone else's product
   curl -X DELETE http://localhost:5000/api/products/123 \
     -H "Cookie: session=<token>"
   ```
   Expected: 403 Forbidden (if not owner)

## Step 7: Update Route Documentation

Update your API documentation to reflect:
- New authentication requirements
- Email verification requirements
- Role requirements

## Route-by-Route Migration Order

### Recommended Order

1. **Start with read-only routes** (GET)
   - `/api/products` (public)
   - `/api/products/:id` (public)
   - `/api/orders` (authenticated)

2. **Then authenticated routes** (POST/PUT/DELETE)
   - `/api/orders` (create order)
   - `/api/reviews` (create review)

3. **Then seller routes**
   - `/api/products` (create/update/delete)
   - `/api/seller/*` routes

4. **Finally admin routes**
   - `/api/admin/*` routes

## Common Patterns

### Pattern 1: Product CRUD

```javascript
const {
  requireAuth,
  requireSeller,
  requireEmailVerified,
  optionalAuth
} = require('../middleware/betterAuth');

// Public - anyone can view
router.get('/', optionalAuth, getProducts);
router.get('/:id', optionalAuth, getProduct);

// Seller only - create/update/delete
router.post('/',
  requireAuth,
  requireEmailVerified,
  requireSeller,
  createProduct
);

router.put('/:id',
  requireAuth,
  requireSeller,
  updateProduct
);

router.delete('/:id',
  requireAuth,
  requireSeller,
  deleteProduct
);
```

### Pattern 2: Order Management

```javascript
// User orders - authenticated only
router.get('/my-orders', requireAuth, getMyOrders);
router.post('/', requireAuth, createOrder);

// Seller views orders - seller only
router.get('/seller/orders',
  requireAuth,
  requireSeller,
  getSellerOrders
);

router.put('/seller/orders/:id',
  requireAuth,
  requireSeller,
  updateOrderStatus
);
```

### Pattern 3: Admin Routes

```javascript
const { requireAuth, requireAdmin, require2FA } = require('../middleware/betterAuth');

// View-only - admin required
router.get('/users', requireAuth, requireAdmin, getAllUsers);
router.get('/stats', requireAuth, requireAdmin, getStats);

// Dangerous actions - admin + 2FA required
router.delete('/users/:id',
  requireAuth,
  requireAdmin,
  require2FA,  // Extra security for dangerous actions
  deleteUser
);
```

## Troubleshooting

### Issue: "req.user is undefined"

**Problem:** Forgot to add `requireAuth` middleware

**Solution:**
```javascript
// Wrong:
router.get('/orders', async (req, res) => {
  const userId = req.user.id; // Error: req.user is undefined
});

// Correct:
router.get('/orders', requireAuth, async (req, res) => {
  const userId = req.user.id; // Works!
});
```

### Issue: "Cannot read property 'id' of undefined"

**Problem:** Using `optionalAuth` but not checking if user exists

**Solution:**
```javascript
// Wrong:
router.get('/products', optionalAuth, async (req, res) => {
  const favorites = await getFavorites(req.user.id); // Error if not logged in
});

// Correct:
router.get('/products', optionalAuth, async (req, res) => {
  const favorites = req.user ? await getFavorites(req.user.id) : [];
});
```

### Issue: Still getting 403 errors

**Problem:** User doesn't have required role or email not verified

**Solution:** Check middleware order and requirements:
```javascript
// Make sure middleware is in correct order:
requireAuth           // First
requireEmailVerified  // Second
requireSeller         // Third
```

## Reference Files

- [middleware/betterAuth.js](middleware/betterAuth.js) - Middleware implementation
- [MIDDLEWARE_GUIDE.md](MIDDLEWARE_GUIDE.md) - Complete middleware documentation
- [middleware/QUICK_REFERENCE.md](middleware/QUICK_REFERENCE.md) - Quick lookup
- [routes/examples/product.betterauth.js](routes/examples/product.betterauth.js) - Full example
- [MIGRATION_EXAMPLE.md](MIGRATION_EXAMPLE.md) - Before/after comparisons

## Summary Checklist

- [ ] Backed up routes directory
- [ ] Updated imports in all route files
- [ ] Replaced `auth` with appropriate Better Auth middleware
- [ ] Removed manual role/permission checks
- [ ] Updated error responses
- [ ] Tested all routes
- [ ] Updated API documentation
- [ ] Verified production deployment

## Next Steps

After migrating routes:
1. Migrate user data to Better Auth collections
2. Update frontend to use Better Auth client
3. Enable 2FA for admin accounts
4. Set up email verification for sellers
5. Test end-to-end authentication flow

---

**Need Help?** See [MIDDLEWARE_GUIDE.md](MIDDLEWARE_GUIDE.md) for detailed documentation.
