# Before & After: Route Migration Examples

Visual side-by-side comparisons showing how routes change when migrating to Better Auth.

## Example 1: Simple Product Listing

### ❌ Before (Old Auth)
```javascript
const auth = require('../middleware/auth');

router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});
```

### ✅ After (Better Auth)
```javascript
const { optionalAuth } = require('../middleware/betterAuth');

router.get('/products', optionalAuth, async (req, res) => {
  try {
    const products = await Product.find();

    // Bonus: Show favorites for logged-in users
    const favorites = req.user ? await getFavorites(req.user.id) : [];

    res.json({
      success: true,
      products,
      favorites
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});
```

**Benefits:**
- ✅ Optional personalization for logged-in users
- ✅ No breaking changes for anonymous users

---

## Example 2: Create Product (Seller Only)

### ❌ Before (Old Auth)
```javascript
const auth = require('../middleware/auth');
const User = require('../models/User');

router.post('/products', auth, async (req, res) => {
  try {
    // Manual seller verification
    const user = await User.findById(req.user.id);

    if (!user.isSeller) {
      return res.status(401).json({
        msg: 'Not authorized. Only sellers can create products.'
      });
    }

    // Manual email verification check
    if (!user.emailVerified) {
      return res.status(403).json({
        msg: 'Please verify your email before creating products.'
      });
    }

    const product = await Product.create({
      ...req.body,
      seller: req.user.id
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});
```

### ✅ After (Better Auth)
```javascript
const {
  requireAuth,
  requireEmailVerified,
  requireSeller
} = require('../middleware/betterAuth');

router.post('/products',
  requireAuth,           // Verify authentication
  requireEmailVerified,  // Check email verification
  requireSeller,         // Verify seller status
  async (req, res) => {
    try {
      // All checks already done by middleware!
      const product = await Product.create({
        ...req.body,
        seller: req.user.id
      });

      res.json({
        success: true,
        product
      });
    } catch (err) {
      res.status(500).json({ success: false, msg: 'Server error' });
    }
  }
);
```

**Benefits:**
- ✅ No database query to fetch user
- ✅ No manual `isSeller` check
- ✅ No manual email verification check
- ✅ Cleaner, more readable code
- ✅ Consistent error messages

**Code Reduction:**
- **Before:** ~25 lines
- **After:** ~15 lines
- **Saved:** 40% less code!

---

## Example 3: Admin User Management

### ❌ Before (Old Auth)
```javascript
const auth = require('../middleware/auth');
const User = require('../models/User');

router.delete('/admin/users/:id', auth, async (req, res) => {
  try {
    // Manual admin check
    const admin = await User.findById(req.user.id);

    if (admin.role !== 'admin') {
      return res.status(403).json({
        msg: 'Admin access required'
      });
    }

    // Manual 2FA check
    if (!admin.twoFactorEnabled) {
      return res.status(403).json({
        msg: 'Enable 2FA to perform this action'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ msg: 'User deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});
```

### ✅ After (Better Auth)
```javascript
const {
  requireAuth,
  requireAdmin,
  require2FA
} = require('../middleware/betterAuth');

router.delete('/admin/users/:id',
  requireAuth,   // Verify authentication
  requireAdmin,  // Verify admin role
  require2FA,    // Verify 2FA enabled
  async (req, res) => {
    try {
      // All security checks done!
      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          msg: 'User not found'
        });
      }

      res.json({
        success: true,
        msg: 'User deleted successfully'
      });
    } catch (err) {
      res.status(500).json({ success: false, msg: 'Server error' });
    }
  }
);
```

**Benefits:**
- ✅ No database query for admin user
- ✅ Automatic admin verification
- ✅ Automatic 2FA verification
- ✅ Extra security with zero code

**Code Reduction:**
- **Before:** ~30 lines
- **After:** ~18 lines
- **Saved:** 40% less code!

---

## Example 4: Update Own Order

### ❌ Before (Old Auth)
```javascript
const auth = require('../middleware/auth');

router.put('/orders/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Manual ownership check
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        msg: 'Not authorized to update this order'
      });
    }

    // Update order
    order.shippingAddress = req.body.shippingAddress || order.shippingAddress;
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});
```

### ✅ After (Better Auth)
```javascript
const { requireAuth } = require('../middleware/betterAuth');

router.put('/orders/:id', requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: 'Order not found'
      });
    }

    // Ownership check (still needed - this is business logic)
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'Not authorized to update this order'
      });
    }

    // Update order
    order.shippingAddress = req.body.shippingAddress || order.shippingAddress;
    await order.save();

    res.json({
      success: true,
      order
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});
```

**Benefits:**
- ✅ Cleaner authentication
- ✅ Ownership checks remain (business logic)
- ✅ Consistent response format

**Note:** Ownership verification is business logic, not authentication, so it stays in the route handler.

---

## Example 5: Organization Product Management

### ❌ Before (Old Auth)
```javascript
const auth = require('../middleware/auth');

router.post('/org/products', auth, async (req, res) => {
  try {
    // Manual organization check
    const membership = await OrgMembership.findOne({
      user: req.user.id,
      organization: req.body.organizationId
    });

    if (!membership) {
      return res.status(403).json({
        msg: 'Not a member of this organization'
      });
    }

    // Manual role check
    if (!['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({
        msg: 'Insufficient permissions'
      });
    }

    const product = await Product.create({
      ...req.body,
      organization: req.body.organizationId
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});
```

### ✅ After (Better Auth)
```javascript
const {
  requireAuth,
  requireOrganization,
  requireOrgRole
} = require('../middleware/betterAuth');

router.post('/org/products',
  requireAuth,                          // Verify authentication
  requireOrganization,                  // Verify org membership
  requireOrgRole(['owner', 'admin']),  // Verify role
  async (req, res) => {
    try {
      // All checks done! req.organizationId is available
      const product = await Product.create({
        ...req.body,
        organization: req.organizationId
      });

      res.json({
        success: true,
        product
      });
    } catch (err) {
      res.status(500).json({ success: false, msg: 'Server error' });
    }
  }
);
```

**Benefits:**
- ✅ No database query for membership
- ✅ Automatic role verification
- ✅ Organization ID automatically available
- ✅ Much cleaner code

**Code Reduction:**
- **Before:** ~28 lines
- **After:** ~16 lines
- **Saved:** 43% less code!

---

## Example 6: Dual Route (Supports Both Auth Methods)

Useful during gradual migration.

```javascript
const oldAuth = require('../middleware/auth');
const { requireAuth: newAuth } = require('../middleware/betterAuth');

// Dual auth middleware - supports both JWT and Better Auth
const dualAuth = async (req, res, next) => {
  try {
    // Try Better Auth first
    await newAuth(req, res, () => {});
    return next();
  } catch (err) {
    // Fall back to old JWT auth
    return oldAuth(req, res, next);
  }
};

router.get('/products', dualAuth, async (req, res) => {
  // Works with both authentication methods!
  const products = await Product.find({ seller: req.user.id });
  res.json(products);
});
```

**Use Case:**
- During gradual migration
- Supporting mobile app (old auth) and web (new auth) simultaneously
- A/B testing

---

## Summary: Code Reduction Across Examples

| Route Type | Before | After | Reduction |
|------------|--------|-------|-----------|
| Product List | 12 lines | 15 lines | -25% (added features) |
| Create Product | 25 lines | 15 lines | **40%** |
| Admin Delete | 30 lines | 18 lines | **40%** |
| Update Order | 20 lines | 22 lines | -10% (better format) |
| Org Products | 28 lines | 16 lines | **43%** |

**Average Reduction:** ~30% less code

## Key Improvements Summary

### Security
- ✅ Consistent authentication checks
- ✅ Built-in 2FA support
- ✅ Automatic suspension checks
- ✅ Email verification enforcement

### Code Quality
- ✅ 30-40% less code
- ✅ No manual role checks
- ✅ No extra database queries
- ✅ Cleaner, more readable

### Developer Experience
- ✅ Declarative middleware
- ✅ Self-documenting routes
- ✅ Consistent error messages
- ✅ Easier to test

### Maintainability
- ✅ Centralized auth logic
- ✅ Easier to add features
- ✅ Less duplication
- ✅ Better separation of concerns

---

## Next Steps

1. Review these examples
2. Choose one route file to migrate first
3. Test thoroughly
4. Gradually migrate remaining routes
5. Remove old auth middleware when done

See [ROUTE_MIGRATION_STEPS.md](ROUTE_MIGRATION_STEPS.md) for detailed migration guide.
