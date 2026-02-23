// In backend/middleware/adminAuth.js

const { createClerkClient } = require('@clerk/clerk-sdk-node');
const prisma = require('../config/prisma');
const { resolveRoleFromClerkMetadata } = require('../utils/clerkRoleSync');
const jwt = require('jsonwebtoken');

// Initialize Clerk client
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Admin authentication middleware
 * Checks if the user is authenticated (Clerk or local JWT) AND has admin role
 */
async function adminAuth(req, res, next) {
  try {
    // 1. Get the token from the Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    let user = null;

    // 2. Try Clerk verification first
    try {
      const { sub: clerkUserId } = await clerk.verifyToken(token);

      if (clerkUserId) {
        user = await prisma.user.findUnique({
          where: { clerkId: clerkUserId },
          select: {
            id: true,
            email: true,
            role: true,
            isSuspended: true,
            clerkId: true
          }
        });

        if (!user) {
          try {
            const clerkUser = await clerk.users.getUser(clerkUserId);
            const email = clerkUser.emailAddresses[0]?.emailAddress;

            if (email) {
              const existingUser = await prisma.user.findUnique({
                where: { email },
                select: { id: true, email: true, role: true, isSuspended: true }
              });

              if (existingUser) {
                const resolvedRole = resolveRoleFromClerkMetadata(clerkUser, existingUser.role);
                const updateData = { clerkId: clerkUserId };
                if (resolvedRole) {
                  updateData.role = resolvedRole;
                  console.log(`[adminAuth] Role synced for ${email}: ${existingUser.role} -> ${resolvedRole}`);
                }
                user = await prisma.user.update({
                  where: { id: existingUser.id },
                  data: updateData,
                  select: { id: true, email: true, role: true, isSuspended: true, clerkId: true }
                });
              }
            }
          } catch (err) {
            console.error("Admin sync check failed", err);
          }
        }
      }
    } catch (clerkError) {
      // Clerk verification failed — try local JWT fallback
    }

    // 3. Fallback: Try local JWT verification
    if (!user) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded && decoded.user && decoded.user.id) {
          user = await prisma.user.findUnique({
            where: { id: decoded.user.id },
            select: {
              id: true,
              email: true,
              role: true,
              isSuspended: true,
              clerkId: true
            }
          });
        }
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({ msg: 'Token has expired' });
        }
      }
    }

    if (!user) {
      return res.status(401).json({ msg: 'User not found in database' });
    }

    // 4. Check if user is suspended
    if (user.isSuspended) {
      return res.status(403).json({ msg: 'Account is suspended' });
    }

    // 5. Check if user has admin role
    if (user.role !== 'ADMIN') {
      console.warn(`[AdminAuth] Access denied for user ${user.email}. Role: '${user.role}', IsSuspended: ${user.isSuspended}`);
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }

    // 6. Add user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      clerkId: user.clerkId
    };

    next();
  } catch (err) {
    console.error('Admin auth error:', err);
    if (err.message?.includes('expired')) {
        return res.status(401).json({ msg: 'Token has expired' });
    }
    res.status(401).json({ msg: 'Token is not valid' });
  }
}

module.exports = adminAuth;
