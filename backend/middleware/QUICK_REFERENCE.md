# Better Auth Middleware - Quick Reference

## Import
```javascript
const {
  requireAuth,
  optionalAuth,
  requireSeller,
  requireAdmin,
  requireOrganization,
  requireOrgRole,
  requireEmailVerified,
  require2FA,
  getCurrentUser,
} = require('./middleware/betterAuth');
```

## Common Patterns

### Public Route (no auth)
```javascript
router.get('/products', handler);
```

### Public Route (optional auth)
```javascript
router.get('/products', optionalAuth, handler);
```

### Authenticated User
```javascript
router.get('/profile', requireAuth, handler);
```

### Seller Only
```javascript
router.post('/products', requireAuth, requireSeller, handler);
```

### Admin Only
```javascript
router.get('/admin/users', requireAuth, requireAdmin, handler);
```

### Organization Member
```javascript
router.get('/org/products', requireAuth, requireOrganization, handler);
```

### Organization Owner/Admin
```javascript
router.put('/org/settings',
  requireAuth,
  requireOrganization,
  requireOrgRole(['owner', 'admin']),
  handler
);
```

### Verified Email Required
```javascript
router.post('/products',
  requireAuth,
  requireEmailVerified,
  requireSeller,
  handler
);
```

### 2FA Required (Sensitive Action)
```javascript
router.delete('/account', requireAuth, require2FA, handler);
```

## Request Properties

```javascript
req.user              // User object (after requireAuth)
req.session           // Session object (after requireAuth)
req.organizationId    // Org ID (after requireOrganization)
req.orgMembership     // Membership (after requireOrgRole)
```

## Middleware Order (Important!)

```javascript
requireAuth           // 1. Always first
requireEmailVerified  // 2. Email verification
requireSeller         // 3. Role checks
requireOrganization   // 4. Org membership
requireOrgRole(...)   // 5. Org role
require2FA            // 6. 2FA (last)
```

## Error Codes

| Code | Meaning |
|------|---------|
| 401 | Not authenticated |
| 403 | Authenticated but forbidden (wrong role, suspended, etc.) |
| 400 | Bad request (e.g., no org selected) |
| 500 | Server error |

## Examples

### E-commerce Use Cases

```javascript
// View products (anyone)
router.get('/products', optionalAuth, getProducts);

// Add to cart (logged in)
router.post('/cart', requireAuth, addToCart);

// Create product (verified seller)
router.post('/products',
  requireAuth,
  requireEmailVerified,
  requireSeller,
  createProduct
);

// Manage shop (org owner/admin)
router.put('/shop/settings',
  requireAuth,
  requireOrganization,
  requireOrgRole(['owner', 'admin']),
  updateShop
);

// Delete user (admin with 2FA)
router.delete('/admin/users/:id',
  requireAuth,
  requireAdmin,
  require2FA,
  deleteUser
);
```

## Tips

✅ **DO:**
- Use `optionalAuth` for public routes with personalization
- Require email verification before allowing posts
- Require 2FA for sensitive actions
- Chain middleware in the correct order

❌ **DON'T:**
- Use role middleware before `requireAuth`
- Use `requireOrgRole` before `requireOrganization`
- Forget to check `req.user` exists when using `optionalAuth`
- Skip email verification for seller registration

---

Full documentation: [MIDDLEWARE_GUIDE.md](../MIDDLEWARE_GUIDE.md)
