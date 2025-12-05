// backend/middleware/adminAuth.js
// Admin authentication middleware that supports both legacy JWT and BetterAuth sessions

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Admin authentication middleware
 * Checks if the user is authenticated AND has admin role
 */
async function adminAuth(req, res, next) {
  try {
    // Method 1: Check for legacy x-auth-token header
    const legacyToken = req.header('x-auth-token');
    if (legacyToken) {
      try {
        const decoded = jwt.verify(legacyToken, process.env.JWT_SECRET);
        
        // Get user from database to check role
        const user = await User.findById(decoded.user.id).select('-password');
        
        if (!user) {
          return res.status(401).json({ msg: 'User not found' });
        }
        
        if (user.isSuspended) {
          return res.status(403).json({ msg: 'Account is suspended' });
        }
        
        if (user.role !== 'admin') {
          return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
        }
        
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role
        };
        return next();
      } catch (err) {
        // Token invalid, try other methods
      }
    }

    // Method 2: Check for Authorization Bearer token (BetterAuth session token)
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const sessionToken = authHeader.substring(7);
      
      try {
        const response = await fetch(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/get-session`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`,
          },
        });

        if (response.ok) {
          const sessionData = await response.json();
          if (sessionData && sessionData.user) {
            // Verify user is admin
            const user = await User.findOne({ email: sessionData.user.email }).select('-password');
            
            if (!user) {
              return res.status(401).json({ msg: 'User not found' });
            }
            
            if (user.isSuspended) {
              return res.status(403).json({ msg: 'Account is suspended' });
            }
            
            if (user.role !== 'admin') {
              return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
            }
            
            req.user = {
              id: user._id,
              email: user.email,
              role: user.role
            };
            return next();
          }
        }
      } catch (fetchError) {
        console.error('Error validating BetterAuth session:', fetchError);
      }
    }

    // Method 3: Check for session cookie
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
            // Verify user is admin
            const user = await User.findOne({ email: sessionData.user.email }).select('-password');
            
            if (!user) {
              return res.status(401).json({ msg: 'User not found' });
            }
            
            if (user.isSuspended) {
              return res.status(403).json({ msg: 'Account is suspended' });
            }
            
            if (user.role !== 'admin') {
              return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
            }
            
            req.user = {
              id: user._id,
              email: user.email,
              role: user.role
            };
            return next();
          }
        }
      } catch (fetchError) {
        console.error('Error validating session cookie:', fetchError);
      }
    }

    // No valid authentication found
    return res.status(401).json({ msg: 'No token, authorization denied' });
  } catch (err) {
    console.error('Admin auth error:', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
}

module.exports = adminAuth;
