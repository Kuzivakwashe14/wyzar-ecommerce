// backend/middleware/auth.js
// Authentication middleware using Clerk
// Replaces previous Kinde/JWT implementation

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');

// Main authentication middleware
// We wrap the Clerk middleware to add our custom user syncing logic
const auth = async (req, res, next) => {
  // 1. Run Clerk's middleware to verify the token
  // ClerkExpressWithAuth populates req.auth
  ClerkExpressWithAuth({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY // Optional but good practice
  })(req, res, async (err) => {
    if (err) {
      console.error('[Auth] Clerk middleware error:', err);
      return res.status(401).json({ msg: 'Authentication error' });
    }

    try {
      // Check if Clerk authenticated the user
      if (!req.auth || !req.auth.userId) {
        console.log('[Auth] No Clerk session found');
        return res.status(401).json({ msg: 'No valid authentication found' });
      }

      const clerkId = req.auth.userId;
      // Get claims to access email/metadata if available in session token
      // Note: By default session token has limited claims. 
      // For full user details we might need to fetch from Clerk API or use claims if configured.
      const claims = req.auth.sessionClaims || {};

      console.log(`[Auth] Authenticated via Clerk: ${clerkId}`);

      // 2. Sync with MongoDB
      // Find user by clerkId
      let mongoUser = await User.findOne({ clerkId });

      if (!mongoUser) {
        // Fallback: Check if user exists by Kinde ID (migration) or Email
        // We'll need user's email to link by email. 
        // If email is not in claims, we might need to fetch it or rely on frontend to pass it (insecure for linking).
        // Best approach: Use Clerk Backend API to fetch user details to get email safely.
        
        try {
            const clerkClient = require('@clerk/clerk-sdk-node').clerkClient;
            const clerkUser = await clerkClient.users.getUser(clerkId);
            const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;

            if (email) {
                console.log(`[Auth] Looked up email for ${clerkId}: ${email}`);
                // Try finding by email
                mongoUser = await User.findOne({ email });

                if (mongoUser) {
                    // Link existing user
                    mongoUser.clerkId = clerkId;
                    await mongoUser.save();
                    console.log(`[Auth] Linked existing user ${mongoUser._id} to Clerk ID ${clerkId}`);
                } else {
                    // Create new user
                    mongoUser = await User.create({
                        clerkId,
                        email,
                        isEmailVerified: true, // Clerk handles this
                        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
                        role: 'user'
                    });
                    console.log(`[Auth] Created new user ${mongoUser._id} for Clerk ID ${clerkId}`);
                }
            }
        } catch (clerkApiError) {
             console.error('[Auth] Failed to fetch user details from Clerk:', clerkApiError);
             // If we can't fetch details, we can't create/link safely. return 401 or 500?
             // Proceeding without mongoUser will fail downstream.
             return res.status(500).json({ msg: 'Failed to synchronize user profile' });
        }
      }

      if (!mongoUser) {
         return res.status(401).json({ msg: 'User profile could not be synchronized' });
      }

      // 3. Attach MongoDB user to request (standardizing for controllers)
      req.user = {
        id: mongoUser._id.toString(),
        email: mongoUser.email,
        role: mongoUser.role || 'user',
        clerkId: clerkId,
        isAdmin: mongoUser.role === 'admin',
        isSeller: mongoUser.isSeller
      };
      
      // Also attach the full mongo document if needed by some controllers (req.userDoc?)
      // req.userDoc = mongoUser; 

      next();

    } catch (error) {
      console.error('[Auth] Error in custom auth logic:', error);
      res.status(500).json({ msg: 'Internal server error during authentication' });
    }
  });
};

module.exports = auth;
