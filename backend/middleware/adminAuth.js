// In backend/middleware/adminAuth.js

const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

/**
 * Admin authentication middleware
 * Checks if the user is authenticated AND has admin role
 * Use this middleware after the regular auth middleware
 */
async function adminAuth(req, res, next) {
  try {
    // 1. Get the token from the request header
    const token = req.header('x-auth-token');

    // 2. Check if no token
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Get user from database to check role (in case it changed)
    const user = await prisma.user.findUnique({
      where: { id: decoded.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        isSuspended: true
      }
    });

    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }

    // 5. Check if user is suspended
    if (user.isSuspended) {
      return res.status(403).json({ msg: 'Account is suspended' });
    }

    // 6. Check if user has admin role
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }

    // 7. Add user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (err) {
    console.error('Admin auth error:', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
}

module.exports = adminAuth;
