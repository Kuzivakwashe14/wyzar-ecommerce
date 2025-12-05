// backend/middleware/auth.js
// Authentication middleware that supports both legacy JWT tokens and BetterAuth sessions

const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Supports both:
 * 1. Legacy x-auth-token header (JWT)
 * 2. BetterAuth session via Authorization Bearer token
 * 3. BetterAuth session cookie
 */
async function auth(req, res, next) {
  try {
    // Method 1: Check for legacy x-auth-token header
    const legacyToken = req.header('x-auth-token');
    if (legacyToken) {
      try {
        const decoded = jwt.verify(legacyToken, process.env.JWT_SECRET);
        req.user = decoded.user;
        return next();
      } catch (err) {
        // Token invalid, try other methods
      }
    }

    // Method 2: Check for Authorization Bearer token (BetterAuth session token)
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const sessionToken = authHeader.substring(7);
      
      // Validate the session by calling the BetterAuth API on the frontend
      try {
        const response = await fetch(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/get-session`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`,
          },
        });

        if (response.ok) {
          const sessionData = await response.json();
          if (sessionData && sessionData.user) {
            req.user = {
              id: sessionData.user.id,
              email: sessionData.user.email,
              role: sessionData.user.role || 'user',
            };
            return next();
          }
        }
      } catch (fetchError) {
        console.error('Error validating BetterAuth session:', fetchError);
      }
    }

    // Method 3: Check for session cookie (for direct requests with cookies)
    const sessionCookie = req.cookies?.['better-auth.session_token'];
    if (sessionCookie) {
      try {
        const response = await fetch(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/get-session`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionCookie}`,
          },
        });

        if (response.ok) {
          const sessionData = await response.json();
          if (sessionData && sessionData.user) {
            req.user = {
              id: sessionData.user.id,
              email: sessionData.user.email,
              role: sessionData.user.role || 'user',
            };
            return next();
          }
        }
      } catch (fetchError) {
        console.error('Error validating session cookie:', fetchError);
      }
    }

    // No valid authentication found
    return res.status(401).json({ msg: 'No valid authentication, authorization denied' });
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ msg: 'Authentication error' });
  }
}

module.exports = auth;
