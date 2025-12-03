// backend/middleware/betterAuth.js
const { fromNodeHeaders } = require('better-auth/node');
const { auth } = require('../lib/auth');

/**
 * Middleware to require authentication
 * Verifies user session and attaches user data to request
 */
async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        msg: 'Authentication required',
      });
    }

    // Check if account is suspended
    if (session.user.isSuspended) {
      return res.status(403).json({
        success: false,
        msg: 'Account suspended. Please contact support.',
      });
    }

    // Attach user and session to request
    req.user = session.user;
    req.session = session.session;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      msg: 'Invalid or expired session',
    });
  }
}

/**
 * Middleware to optionally attach user if authenticated
 * Does not block if no session exists
 */
async function optionalAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session && session.user) {
      req.user = session.user;
      req.session = session.session;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

/**
 * Middleware to require seller role
 * Must be used AFTER requireAuth
 */
async function requireSeller(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      msg: 'Authentication required',
    });
  }

  if (!req.user.isSeller && req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      msg: 'Seller account required. Please apply to become a seller.',
    });
  }

  next();
}

/**
 * Middleware to require admin role
 * Must be used AFTER requireAuth
 */
async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      msg: 'Authentication required',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      msg: 'Admin access required',
    });
  }

  next();
}

/**
 * Middleware to require organization membership
 * Must be used AFTER requireAuth
 */
async function requireOrganization(req, res, next) {
  try {
    if (!req.session) {
      return res.status(401).json({
        success: false,
        msg: 'Authentication required',
      });
    }

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session.session.activeOrganizationId) {
      return res.status(400).json({
        success: false,
        msg: 'No active organization selected. Please select or create an organization.',
      });
    }

    req.organizationId = session.session.activeOrganizationId;
    next();
  } catch (error) {
    console.error('Organization middleware error:', error);
    return res.status(500).json({
      success: false,
      msg: 'Failed to get organization',
    });
  }
}

/**
 * Middleware to require email verification
 * Must be used AFTER requireAuth
 */
async function requireEmailVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      msg: 'Authentication required',
    });
  }

  if (!req.user.emailVerified && !req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      msg: 'Email verification required. Please check your email.',
    });
  }

  next();
}

/**
 * Middleware to require two-factor authentication
 * Must be used AFTER requireAuth
 */
async function require2FA(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        msg: 'Authentication required',
      });
    }

    // Check if user has 2FA enabled
    const twoFactorStatus = await auth.api.twoFactor.getUserTwoFactor({
      userId: req.user.id,
    });

    if (!twoFactorStatus || !twoFactorStatus.enabled) {
      return res.status(403).json({
        success: false,
        msg: 'Two-factor authentication required. Please enable 2FA in your account settings.',
      });
    }

    next();
  } catch (error) {
    console.error('2FA middleware error:', error);
    return res.status(500).json({
      success: false,
      msg: 'Failed to verify 2FA status',
    });
  }
}

/**
 * Middleware to check specific organization role/permission
 * Must be used AFTER requireAuth and requireOrganization
 *
 * @param {string|string[]} roles - Required role(s) (owner, admin, member)
 */
function requireOrgRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return async (req, res, next) => {
    try {
      if (!req.user || !req.organizationId) {
        return res.status(401).json({
          success: false,
          msg: 'Authentication and organization required',
        });
      }

      // Get user's membership in the organization
      const membership = await auth.api.organization.getMembership({
        organizationId: req.organizationId,
        userId: req.user.id,
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          msg: 'You are not a member of this organization',
        });
      }

      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          msg: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        });
      }

      req.orgMembership = membership;
      next();
    } catch (error) {
      console.error('Organization role middleware error:', error);
      return res.status(500).json({
        success: false,
        msg: 'Failed to verify organization role',
      });
    }
  };
}

/**
 * Helper function to get current user from request
 * Can be used in route handlers
 */
async function getCurrentUser(req) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    return session?.user || null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  // Basic authentication
  requireAuth,
  optionalAuth,

  // Role-based access
  requireSeller,
  requireAdmin,

  // Organization access
  requireOrganization,
  requireOrgRole,

  // Security features
  requireEmailVerified,
  require2FA,

  // Helpers
  getCurrentUser,
};
