// In backend/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User'); // Import our User model
const { sendWelcomeNotification } = require('../services/notificationService');

// --- Registration Route ---
// @route   POST /api/auth/register
// @desc    Register a new user (must verify phone with OTP first)
// @access  Public
router.post('/register', async (req, res) => {
  // 1. Get email, password, and phone from the request body
  const { email, password, phone } = req.body;

  try {
    // Validate input
    if (!email || !password || !phone) {
      return res.status(400).json({ 
        success: false,
        msg: 'Email, password, and phone number are required' 
      });
    }

    // 2. Check if the email already exists
    let existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ 
        success: false,
        msg: 'Email already registered' 
      });
    }

    // 3. Check if the phone already exists
    let existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ 
        success: false,
        msg: 'Phone number already registered' 
      });
    }

    // 4. Check if phone is verified (user must verify OTP before registering)
    // Note: In a real flow, you'd check if there's a verified OTP for this phone
    // For now, we'll create the user and mark phone as unverified
    // The user will verify it in the next step

    // 5. Create a new user instance
    const user = new User({
      email,
      password,
      phone,
      isPhoneVerified: false, // Will be set to true after OTP verification
      isEmailVerified: false
    });

    // 6. Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 7. Save the user to the database
    await user.save();

    // 8. Send welcome notification (email + SMS) - Don't wait for it
    sendWelcomeNotification(user).catch(err => {
      console.error('Error sending welcome notification:', err);
      // Don't fail registration if notification fails
    });

    // 9. Create JWT token
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
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
          msg: 'User registered successfully. Please verify your phone number.',
          token,
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            isPhoneVerified: user.isPhoneVerified,
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
// @desc    Authenticate user & get token (supports email or phone)
// @access  Public
router.post('/login', async (req, res) => {
  // 1. Get credentials from request body (can be email or phone)
  const { email, phone, password } = req.body;

  try {
    // Validate that we have either email or phone
    if ((!email && !phone) || !password) {
      return res.status(400).json({ 
        success: false,
        msg: 'Please provide email/phone and password' 
      });
    }

    // 2. Find user by email or phone
    let user;
    if (email) {
      user = await User.findOne({ email });
    } else if (phone) {
      user = await User.findOne({ phone });
    }

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

    // 4. Check if phone is verified (optional - you can make this mandatory)
    if (!user.isPhoneVerified) {
      // You can either block login or just warn the user
      console.log('Warning: User logging in with unverified phone');
    }

    // 5. Create JWT token with user info
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
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
            phone: user.phone,
            isPhoneVerified: user.isPhoneVerified,
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
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;