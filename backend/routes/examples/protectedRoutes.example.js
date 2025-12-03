// backend/routes/examples/protectedRoutes.example.js
// Example file showing how to use Better Auth middleware

const express = require('express');
const router = express.Router();
const {
  requireAuth,
  optionalAuth,
  requireSeller,
  requireAdmin,
  requireOrganization,
  requireOrgRole,
  requireEmailVerified,
  require2FA,
} = require('../middleware/betterAuth');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * GET /api/products
 * Public route - anyone can view products
 */
router.get('/products', optionalAuth, async (req, res) => {
  try {
    // req.user will be available if user is logged in
    const userId = req.user?.id;

    // Your product logic here
    res.json({
      success: true,
      products: [],
      isAuthenticated: !!req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
});

// ============================================
// AUTHENTICATED ROUTES
// ============================================

/**
 * GET /api/profile
 * Requires authentication only
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    // req.user is guaranteed to exist
    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        isSeller: req.user.isSeller,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
});

/**
 * PUT /api/profile
 * Requires authentication and email verification
 */
router.put('/profile', requireAuth, requireEmailVerified, async (req, res) => {
  try {
    // Update profile logic
    res.json({
      success: true,
      msg: 'Profile updated',
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
});

// ============================================
// SELLER ROUTES
// ============================================

/**
 * POST /api/products
 * Requires seller role
 */
router.post('/products', requireAuth, requireSeller, async (req, res) => {
  try {
    // Only sellers can create products
    // req.user is guaranteed to be a seller

    res.json({
      success: true,
      msg: 'Product created',
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
});

/**
 * GET /api/seller/dashboard
 * Requires seller role and email verification
 */
router.get(
  '/seller/dashboard',
  requireAuth,
  requireEmailVerified,
  requireSeller,
  async (req, res) => {
    try {
      res.json({
        success: true,
        seller: req.user,
      });
    } catch (error) {
      res.status(500).json({ success: false, msg: error.message });
    }
  }
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * GET /api/admin/users
 * Requires admin role
 */
router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Only admins can access this
    res.json({
      success: true,
      users: [],
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Requires admin role and 2FA
 */
router.delete(
  '/admin/users/:id',
  requireAuth,
  requireAdmin,
  require2FA,
  async (req, res) => {
    try {
      // Critical admin action - requires 2FA
      res.json({
        success: true,
        msg: 'User deleted',
      });
    } catch (error) {
      res.status(500).json({ success: false, msg: error.message });
    }
  }
);

// ============================================
// ORGANIZATION (SELLER SHOP) ROUTES
// ============================================

/**
 * POST /api/organization/products
 * Requires organization membership (any role)
 */
router.post(
  '/organization/products',
  requireAuth,
  requireOrganization,
  async (req, res) => {
    try {
      // req.organizationId is available
      const orgId = req.organizationId;

      res.json({
        success: true,
        msg: 'Product added to organization',
      });
    } catch (error) {
      res.status(500).json({ success: false, msg: error.message });
    }
  }
);

/**
 * PUT /api/organization/settings
 * Requires organization owner or admin role
 */
router.put(
  '/organization/settings',
  requireAuth,
  requireOrganization,
  requireOrgRole(['owner', 'admin']),
  async (req, res) => {
    try {
      // Only owners and admins can update settings
      // req.orgMembership contains user's role

      res.json({
        success: true,
        msg: 'Organization settings updated',
      });
    } catch (error) {
      res.status(500).json({ success: false, msg: error.message });
    }
  }
);

/**
 * DELETE /api/organization
 * Requires organization owner role only
 */
router.delete(
  '/organization',
  requireAuth,
  requireOrganization,
  requireOrgRole('owner'),
  async (req, res) => {
    try {
      // Only the owner can delete the organization
      res.json({
        success: true,
        msg: 'Organization deleted',
      });
    } catch (error) {
      res.status(500).json({ success: false, msg: error.message });
    }
  }
);

/**
 * POST /api/organization/members/invite
 * Requires organization owner or admin
 */
router.post(
  '/organization/members/invite',
  requireAuth,
  requireOrganization,
  requireOrgRole(['owner', 'admin']),
  async (req, res) => {
    try {
      const { email, role } = req.body;

      // Invite member logic
      res.json({
        success: true,
        msg: 'Invitation sent',
      });
    } catch (error) {
      res.status(500).json({ success: false, msg: error.message });
    }
  }
);

// ============================================
// MIDDLEWARE CHAINING EXAMPLES
// ============================================

/**
 * Example: Multiple middleware in sequence
 * POST /api/seller/sensitive-action
 */
router.post(
  '/seller/sensitive-action',
  requireAuth,           // 1. Must be authenticated
  requireEmailVerified,  // 2. Email must be verified
  requireSeller,         // 3. Must be a seller
  require2FA,            // 4. Must have 2FA enabled
  async (req, res) => {
    try {
      // All checks passed - perform sensitive action
      res.json({
        success: true,
        msg: 'Sensitive action completed',
      });
    } catch (error) {
      res.status(500).json({ success: false, msg: error.message });
    }
  }
);

module.exports = router;
