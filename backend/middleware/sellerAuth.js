// backend/middleware/sellerAuth.js
// Middleware to verify the user is both a seller AND approved (isVerified)

const prisma = require('../config/prisma');

/**
 * Seller authentication middleware
 * Must be used AFTER the auth middleware (requires req.user)
 * Checks that the user is a seller AND has been verified/approved by admin
 */
async function sellerAuth(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isSeller: true, isVerified: true, isSuspended: true }
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    if (!user.isSeller) {
      return res.status(403).json({ msg: 'Not authorized. Only sellers can access this resource.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ msg: 'Your seller account has been suspended. Please contact support.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        msg: 'Your seller application is pending approval. You cannot access seller features until an admin approves your application.',
        pendingApproval: true
      });
    }

    next();
  } catch (err) {
    console.error('sellerAuth middleware error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = sellerAuth;
