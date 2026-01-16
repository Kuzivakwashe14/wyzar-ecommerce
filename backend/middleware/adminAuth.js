// In backend/middleware/adminAuth.js

const { createClerkClient } = require('@clerk/clerk-sdk-node');
const prisma = require('../config/prisma');

// Initialize Clerk client
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Admin authentication middleware
 * Checks if the user is authenticated via Clerk AND has admin role
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

    // 2. Verify the token with Clerk
    const { sub: clerkUserId } = await clerk.verifyToken(token);

    if (!clerkUserId) {
      return res.status(401).json({ msg: 'Token is not valid' });
    }

    // 3. Get user from database using Clerk ID
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: {
        id: true,
        email: true,
        role: true,
        isSuspended: true,
        clerkId: true
      }
    });

    // If user doesn't exist, try to find by email and link (just like auth.js)
    // This ensures that even if they log in for the first time as admin, it works if they exist
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
            // Link existing user
            user = await prisma.user.update({
              where: { id: existingUser.id },
              data: { clerkId: clerkUserId },
              select: { id: true, email: true, role: true, isSuspended: true, clerkId: true }
            });
          }
        }
      } catch (err) {
        console.error("Admin sync check failed", err);
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
