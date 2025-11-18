// backend/services/notificationService.js
// Temporarily disabled email service - will enable after fixing nodemailer
// const { sendWelcomeEmail } = require('./emailService');
// const { sendOTP } = require('./smsService');

/**
 * Send welcome notification (Email + SMS) after registration
 * @param {Object} user - User object from database
 */
const sendWelcomeNotification = async (user) => {
  try {
    console.log(`Welcome notification for user: ${user.email}`);
    console.log('Email notifications temporarily disabled - will be enabled after setup');

    // TODO: Enable email once nodemailer is configured
    // const emailResult = await sendWelcomeEmail(user.email, user.email.split('@')[0]);

    // Optionally send welcome SMS (commented out to avoid SMS costs in development)
    // const smsResult = await sendOTP(user.phone, 'Welcome to WyZar!');

    return {
      success: true,
      message: 'User registered (email notifications disabled in development)'
    };
  } catch (error) {
    console.error('Error in sendWelcomeNotification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendWelcomeNotification
};
