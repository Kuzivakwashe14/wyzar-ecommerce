// backend/utils/otpUtils.js
const OTP = require('../models/OTP');
const crypto = require('crypto');

/**
 * Generate a 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
const generateOTP = () => {
  // Generate random 6-digit number
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Create and save OTP to database
 * @param {string} phone - Phone number
 * @param {string} type - OTP type (registration, login, password-reset)
 * @returns {Promise<Object>} - { otp, otpId }
 */
const createOTP = async (phone, type = 'registration') => {
  try {
    // Delete any existing unverified OTPs for this phone and type
    await OTP.deleteMany({
      phone,
      type,
      verified: false
    });

    // Generate new OTP
    const otpCode = generateOTP();

    // Create new OTP document
    const newOTP = new OTP({
      phone,
      otp: otpCode,
      type,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    await newOTP.save();

    return {
      success: true,
      otp: otpCode,
      otpId: newOTP._id
    };
  } catch (error) {
    console.error('Error creating OTP:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify OTP
 * @param {string} phone - Phone number
 * @param {string} otpCode - OTP code to verify
 * @param {string} type - OTP type
 * @returns {Promise<Object>} - { success, message }
 */
const verifyOTP = async (phone, otpCode, type = 'registration') => {
  try {
    // Find the most recent OTP for this phone and type
    const otpRecord = await OTP.findOne({
      phone,
      type,
      verified: false
    }).sort({ createdAt: -1 });

    // Check if OTP exists
    if (!otpRecord) {
      return {
        success: false,
        message: 'OTP not found or already verified. Please request a new OTP.'
      };
    }

    // Check if max attempts reached
    if (otpRecord.attempts >= 5) {
      return {
        success: false,
        message: 'Maximum verification attempts reached. Please request a new OTP.'
      };
    }

    // Check if OTP is expired
    if (otpRecord.isExpired()) {
      return {
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      };
    }

    // Increment attempts
    await otpRecord.incrementAttempts();

    // Verify OTP
    if (otpRecord.otp !== otpCode) {
      const attemptsLeft = 5 - otpRecord.attempts;
      return {
        success: false,
        message: `Invalid OTP. ${attemptsLeft} attempt(s) remaining.`
      };
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    return {
      success: true,
      message: 'OTP verified successfully'
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Error verifying OTP. Please try again.',
      error: error.message
    };
  }
};

/**
 * Check if user can request new OTP (rate limiting)
 * @param {string} phone - Phone number
 * @param {string} type - OTP type
 * @returns {Promise<Object>} - { canRequest, waitTime }
 */
const canRequestOTP = async (phone, type = 'registration') => {
  try {
    // Find the most recent OTP for this phone
    const recentOTP = await OTP.findOne({
      phone,
      type
    }).sort({ createdAt: -1 });

    if (!recentOTP) {
      return { canRequest: true, waitTime: 0 };
    }

    // Check if 1 minute has passed since last OTP
    const timeSinceLastOTP = Date.now() - recentOTP.createdAt.getTime();
    const minWaitTime = 60 * 1000; // 1 minute

    if (timeSinceLastOTP < minWaitTime) {
      const waitTime = Math.ceil((minWaitTime - timeSinceLastOTP) / 1000);
      return {
        canRequest: false,
        waitTime,
        message: `Please wait ${waitTime} seconds before requesting a new OTP.`
      };
    }

    return { canRequest: true, waitTime: 0 };
  } catch (error) {
    console.error('Error checking OTP rate limit:', error);
    return { canRequest: true, waitTime: 0 };
  }
};

/**
 * Clean up expired OTPs (can be run as a cron job)
 */
const cleanupExpiredOTPs = async () => {
  try {
    const result = await OTP.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    return 0;
  }
};

module.exports = {
  generateOTP,
  createOTP,
  verifyOTP,
  canRequestOTP,
  cleanupExpiredOTPs
};