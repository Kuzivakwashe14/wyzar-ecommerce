// backend/routes/otp.js

const express = require('express');
const router = express.Router();
const OTP = require('../models/OTP');
const User = require('../models/User');
const { sendOTP, sendPasswordResetOTP } = require('../services/smsService');

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// --- Send OTP Route ---
// @route   POST /api/otp/send
// @desc    Send OTP to phone number via SMS
// @access  Public
router.post('/send', async (req, res) => {
  const { phone, type } = req.body;

  try {
    // Validate input
    if (!phone || !type) {
      return res.status(400).json({
        success: false,
        msg: 'Phone number and type are required'
      });
    }

    // Validate type
    if (!['registration', 'login', 'password-reset'].includes(type)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid OTP type. Must be: registration, login, or password-reset'
      });
    }

    // For registration, check if phone already exists
    if (type === 'registration') {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          msg: 'Phone number already registered'
        });
      }
    }

    // For password-reset, check if phone exists
    if (type === 'password-reset') {
      const user = await User.findOne({ phone });
      if (!user) {
        return res.status(404).json({
          success: false,
          msg: 'No account found with this phone number'
        });
      }
    }

    // Check for recent OTP requests (rate limiting - max 1 per minute)
    const recentOTP = await OTP.findOne({
      phone,
      type,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) } // Last 60 seconds
    });

    if (recentOTP) {
      return res.status(429).json({
        success: false,
        msg: 'Please wait before requesting another OTP. Try again in a minute.'
      });
    }

    // Generate OTP
    const otpCode = generateOTP();

    // Create OTP record in database
    const otpRecord = new OTP({
      phone,
      otp: otpCode,
      type,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    await otpRecord.save();

    // Send OTP via SMS
    let smsResult;
    if (type === 'password-reset') {
      smsResult = await sendPasswordResetOTP(phone, otpCode);
    } else {
      smsResult = await sendOTP(phone, otpCode);
    }

    if (!smsResult.success) {
      // SMS failed but OTP is saved in database
      // In development, you might want to log the OTP
      console.log(`OTP for ${phone}: ${otpCode} (SMS failed to send)`);

      return res.status(200).json({
        success: true,
        msg: 'OTP generated but SMS delivery failed. Please try again.',
        warning: 'SMS service unavailable',
        // In development/testing, you might want to include the OTP
        ...(process.env.NODE_ENV === 'development' && { otp: otpCode })
      });
    }

    // Success response
    res.status(200).json({
      success: true,
      msg: 'OTP sent successfully to your phone number',
      expiresIn: '10 minutes',
      // In development/testing, you might want to include the OTP
      ...(process.env.NODE_ENV === 'development' && { otp: otpCode })
    });

  } catch (err) {
    console.error('Error sending OTP:', err.message);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
});

// --- Verify OTP Route ---
// @route   POST /api/otp/verify
// @desc    Verify OTP code
// @access  Public
router.post('/verify', async (req, res) => {
  const { phone, otp, type } = req.body;

  try {
    // Validate input
    if (!phone || !otp || !type) {
      return res.status(400).json({
        success: false,
        msg: 'Phone number, OTP, and type are required'
      });
    }

    // Find the most recent OTP for this phone and type
    const otpRecord = await OTP.findOne({
      phone,
      type,
      verified: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        msg: 'No OTP found. Please request a new one.'
      });
    }

    // Check if OTP has expired
    if (otpRecord.isExpired()) {
      return res.status(400).json({
        success: false,
        msg: 'OTP has expired. Please request a new one.'
      });
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= 5) {
      return res.status(400).json({
        success: false,
        msg: 'Maximum verification attempts exceeded. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempts
      await otpRecord.incrementAttempts();

      const remainingAttempts = 5 - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        msg: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
      });
    }

    // OTP is valid - mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // If this is for registration or login, you might want to update user's phone verification status
    if (type === 'registration' || type === 'login') {
      const user = await User.findOne({ phone });
      if (user && !user.isPhoneVerified) {
        user.isPhoneVerified = true;
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      msg: 'OTP verified successfully',
      verified: true
    });

  } catch (err) {
    console.error('Error verifying OTP:', err.message);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
});

// --- Resend OTP Route ---
// @route   POST /api/otp/resend
// @desc    Resend OTP (convenience endpoint)
// @access  Public
router.post('/resend', async (req, res) => {
  // This is just a convenience wrapper around /send
  // It provides a clearer API for resending
  return router.handle(req, res);
});

module.exports = router;
