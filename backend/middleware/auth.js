// In backend/middleware/auth.js
// Updated to use Clerk authentication

const { createClerkClient } = require('@clerk/clerk-sdk-node');

// Initialize Clerk client
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Clerk authentication middleware
 * Verifies the JWT token from Clerk and attaches user info to req.user
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

    // 2. Verify the token with Clerk
    const { sub: clerkUserId } = await clerk.verifyToken(token);

    if (!clerkUserId) {
      return res.status(401).json({ msg: 'Token is not valid' });
    }

    // 3. Get user from database using Clerk ID
    const prisma = require('../config/prisma');

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
          // Check if user exists by email
          const existingUser = await prisma.user.findUnique({
            where: { email },
            include: { sellerDetails: true }
          });

          if (existingUser) {
            // Link existing user to Clerk ID
            user = await prisma.user.update({
              where: { id: existingUser.id },
              data: { 
                clerkId: clerkUserId,
                firstName: clerkUser.firstName || undefined,
                lastName: clerkUser.lastName || undefined,
                imageUrl: clerkUser.imageUrl || undefined,
              },
              include: { sellerDetails: true }
            });
            console.log(`Linked existing user ${email} to Clerk ID ${clerkUserId}`);
          } else {
            // Create new user
            user = await prisma.user.create({
              data: {
                clerkId: clerkUserId,
                email: email,
                firstName: clerkUser.firstName || '',
                lastName: clerkUser.lastName || '',
                imageUrl: clerkUser.imageUrl || '',
                isVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
              },
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

    // 4. Attach user info to request
    req.user = {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      isSeller: user.isSeller,
      isVerified: user.isVerified,
      role: user.role,
      sellerDetails: user.sellerDetails
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    
    if (err.message?.includes('expired')) {
      return res.status(401).json({ msg: 'Token has expired' });
    }
    
    return res.status(401).json({ msg: 'Token is not valid' });
  }
}

module.exports = auth;