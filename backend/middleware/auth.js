// In backend/middleware/auth.js
// Updated to use Clerk authentication with local JWT fallback

const { createClerkClient } = require('@clerk/clerk-sdk-node');
const { resolveRoleFromClerkMetadata } = require('../utils/clerkRoleSync');
const jwt = require('jsonwebtoken');

// Initialize Clerk client
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Authentication middleware
 * Supports both Clerk JWT tokens and local JWT tokens (from email/password login)
 * Tries Clerk verification first, falls back to local JWT verification
 */
async function auth(req, res, next) {
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

    const prisma = require('../config/prisma');

    // 2. Try Clerk verification first
    try {
      const { sub: clerkUserId } = await clerk.verifyToken(token);

      if (clerkUserId) {
        // Clerk token verified successfully
        let user = await prisma.user.findUnique({
          where: { clerkId: clerkUserId },
          include: { sellerDetails: true }
        });

        // If user doesn't exist in our DB yet, check if they exist by email (migration)
        if (!user) {
          try {
            const clerkUser = await clerk.users.getUser(clerkUserId);
            const email = clerkUser.emailAddresses[0]?.emailAddress;

            if (email) {
              const existingUser = await prisma.user.findUnique({
                where: { email },
                include: { sellerDetails: true }
              });

              if (existingUser) {
                const resolvedRole = resolveRoleFromClerkMetadata(clerkUser, existingUser.role);
                const updateData = {
                  clerkId: clerkUserId,
                  firstName: clerkUser.firstName || undefined,
                  lastName: clerkUser.lastName || undefined,
                  imageUrl: clerkUser.imageUrl || undefined,
                };
                if (resolvedRole) {
                  updateData.role = resolvedRole;
                  console.log(`[auth] Role synced for ${email}: ${existingUser.role} -> ${resolvedRole}`);
                }
                user = await prisma.user.update({
                  where: { id: existingUser.id },
                  data: updateData,
                  include: { sellerDetails: true }
                });
                console.log(`Linked existing user ${email} to Clerk ID ${clerkUserId}`);
              } else {
                const resolvedRole = resolveRoleFromClerkMetadata(clerkUser, null);
                const createData = {
                  clerkId: clerkUserId,
                  email: email,
                  firstName: clerkUser.firstName || '',
                  lastName: clerkUser.lastName || '',
                  imageUrl: clerkUser.imageUrl || '',
                  isVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
                };
                if (resolvedRole) {
                  createData.role = resolvedRole;
                  console.log(`[auth] New user ${email} created with role ${resolvedRole} from Clerk metadata`);
                }
                user = await prisma.user.create({
                  data: createData,
                  include: { sellerDetails: true }
                });
                console.log(`Created new user ${email} from Clerk`);
              }
            }
          } catch (createError) {
            console.error('Failed to auto-create/link user:', createError);
            return res.status(401).json({ msg: 'User sync failed. Please try again.' });
          }
        }

        if (user) {
          req.user = {
            id: user.id,
            clerkId: user.clerkId,
            email: user.email,
            isSeller: user.isSeller,
            isVerified: user.isVerified,
            role: user.role,
            sellerDetails: user.sellerDetails
          };
          return next();
        }
      }
    } catch (clerkError) {
      // Clerk verification failed — try local JWT fallback
    }

    // 3. Fallback: Try local JWT verification (for email/password registered users)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded && decoded.user && decoded.user.id) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.user.id },
          include: { sellerDetails: true }
        });

        if (!user) {
          return res.status(401).json({ msg: 'User not found' });
        }

        req.user = {
          id: user.id,
          clerkId: user.clerkId,
          email: user.email,
          isSeller: user.isSeller,
          isVerified: user.isVerified,
          role: user.role,
          sellerDetails: user.sellerDetails
        };
        return next();
      }
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ msg: 'Token has expired' });
      }
    }

    return res.status(401).json({ msg: 'Token is not valid' });
  } catch (err) {
    console.error('Auth middleware error:', err);
    
    if (err.message?.includes('expired')) {
      return res.status(401).json({ msg: 'Token has expired' });
    }
    
    return res.status(401).json({ msg: 'Token is not valid' });
  }
}

module.exports = auth;