// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const prisma = require('../config/prisma');
const { sendWelcomeNotification, sendLoginAlert } = require('../services/notificationService');
const { authLimiter } = require('../config/security');

// ===== Input Validation & Sanitization =====
const { validateRegistration, validateLogin } = require('../middleware/validateInput');
const { sanitizeRequestBody } = require('../utils/security/inputValidation');
const { validatePasswordMiddleware } = require('../utils/passwordSecurity');

// --- Registration Route ---
// @route   POST /api/auth/register
// @desc    Register a new user (must verify email with OTP first)
// @access  Public
router.post('/register', authLimiter, sanitizeRequestBody, validateRegistration, validatePasswordMiddleware, async (req, res) => {
  // 1. Get email and password from the request body
  const { email, password } = req.body;
  console.log('Registration request received:', { email, passwordLength: password?.length });

  try {
    // Validate input
    if (!email || !password) {
      console.log('Validation failed: missing email or password');
      return res.status(400).json({
        success: false,
        msg: 'Email and password are required'
      });
    }

    // 2. Check if the email already exists
    let existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        msg: 'Email already registered'
      });
    }

    // 3. Check if email is verified (user must verify OTP before registering)
    // Note: In a real flow, you'd check if there's a verified OTP for this email
    // For now, we'll create the user and mark email as unverified
    // The user will verify it in the next step

    // 4. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create a new user instance
    // Auto-assign admin role if email contains @wyzar
    const role = email.toLowerCase().includes('@wyzar') ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isEmailVerified: false, // Will be set to true after OTP verification
        role: role
      }
    });

    // 7. Send welcome notification (email) - Don't wait for it
    sendWelcomeNotification(user).catch(err => {
      console.error('Error sending welcome notification:', err);
      // Don't fail registration if notification fails
    });

    // 8. Create JWT token
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        isSeller: user.isSeller,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }, // 7 days
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          success: true,
          msg: 'User registered successfully. Please verify your email address.',
          token,
          user: {
            id: user.id,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            isSeller: user.isSeller,
            role: user.role
          }
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
});

// --- Login Route ---
// @route   POST /api/auth/login
// @desc    Authenticate user & get token (supports email)
// @access  Public
router.post('/login', authLimiter, sanitizeRequestBody,  validateLogin,  async (req, res) => {
  // 1. Get credentials from request body
  const { email, password } = req.body;

  try {
    // Validate that we have email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide email and password'
      });
    }

    // 2. Find user by email
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        sellerDetails: {
          include: {
            verificationDocuments: true
          }
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid credentials'
      });
    }

    // 3. Compare the provided password with the hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid credentials'
      });
    }

    // 4. Check if email is verified (optional - you can make this mandatory)
    if (!user.isEmailVerified) {
      // You can either block login or just warn the user
      console.log('Warning: User logging in with unverified email');
    }

    // 4.5. Send login alert email (fire and forget - don't block login)
    sendLoginAlert(user, {
      time: new Date().toLocaleString(),
      ip: req.ip || req.connection.remoteAddress || 'Unknown'
    }).catch(err => {
      console.error('Error sending login alert:', err);
      // Don't fail login if notification fails
    });

    // 5. Create JWT token with user info
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        isSeller: user.isSeller,
        isVerified: user.isVerified,
        role: user.role
      }
    };

    // 6. Sign the token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }, // 7 days
      (err, token) => {
        if (err) throw err;
        // 7. Send the token and user info back to the client
        res.json({
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            isSeller: user.isSeller,
            isVerified: user.isVerified,
            role: user.role,
            sellerDetails: user.sellerDetails
          }
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
});

// --- Get Logged In User Route ---
// @route   GET /api/auth/me
// @desc    Get the logged-in user's data
// @access  Private (Thanks to our 'auth' middleware)

router.get('/me', auth, async (req, res) => {
  try {
    // req.user.id comes from the auth middleware
    // We find the user by ID but exclude the password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        isSeller: true,
        isVerified: true,
        role: true,
        isSuspended: true,
        suspensionReason: true,
        createdAt: true,
        sellerDetails: {
          include: {
            verificationDocuments: true
          }
        }
      }
    });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
