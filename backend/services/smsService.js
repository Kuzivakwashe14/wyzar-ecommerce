// backend/services/smsService.js

// Check if Africa's Talking credentials are configured
const isATConfigured = process.env.AT_API_KEY && process.env.AT_USERNAME;

let sms = null;

if (isATConfigured) {
  const AfricasTalking = require('africastalking');
  const africastalking = AfricasTalking({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME
  });
  sms = africastalking.SMS;
  console.log('✅ Africa\'s Talking SMS service enabled');
} else {
  console.log('⚠️ Africa\'s Talking SMS not configured - SMS notifications disabled');
}
/**
 * Send OTP via SMS
 * @param {string} phone - Phone number in format +263XXXXXXXXX
 * @param {string} otp - The OTP code to send
 * @returns {Promise} - Promise with SMS result
 */
const sendOTP = async (phone, otp) => {
  // Return early if SMS service not configured
  if (!sms) {
    console.log('SMS service not configured - skipping OTP SMS');
    return { success: false, error: 'SMS service not configured' };
  }
  
  try {
    // Ensure phone number is in correct format
    const formattedPhone = formatPhoneNumber(phone);
    
    const message = `Your WyZar verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;

    const options = {
      to: [formattedPhone],
      message: message,
      from: process.env.AT_SENDER_ID || 'WyZar' // Your sender ID
    };

    const result = await sms.send(options);
    console.log('SMS sent successfully:', result);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send order notification SMS
 * @param {string} phone - Phone number
 * @param {string} orderNumber - Order number
 * @param {string} status - Order status
 */
const sendOrderNotification = async (phone, orderNumber, status) => {
  // Return early if SMS service not configured
  if (!sms) {
    console.log('SMS service not configured - skipping order notification SMS');
    return { success: false, error: 'SMS service not configured' };
  }
  
  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    let message;
    switch(status) {
      case 'confirmed':
        message = `Your WyZar order #${orderNumber} has been confirmed and is being processed.`;
        break;
      case 'shipped':
        message = `Great news! Your WyZar order #${orderNumber} has been shipped and is on its way to you.`;
        break;
      case 'delivered':
        message = `Your WyZar order #${orderNumber} has been delivered. Thank you for shopping with us!`;
        break;
      default:
        message = `Your WyZar order #${orderNumber} status has been updated to: ${status}`;
    }

    const options = {
      to: [formattedPhone],
      message: message,
      from: process.env.AT_SENDER_ID || 'WyZar'
    };

    const result = await sms.send(options);
    console.log('Order notification SMS sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending order notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Format phone number to Africa's Talking format
 * @param {string} phone - Phone number (can be 0XXXXXXXXX or +263XXXXXXXXX)
 * @returns {string} - Formatted phone number (+263XXXXXXXXX)
 */
const formatPhoneNumber = (phone) => {
  // Remove all spaces and dashes
  let cleaned = phone.replace(/[\s-]/g, '');
  
  // If starts with 0, replace with +263
  if (cleaned.startsWith('0')) {
    cleaned = '+263' + cleaned.substring(1);
  }
  
  // If doesn't start with +, add +263
  if (!cleaned.startsWith('+')) {
    cleaned = '+263' + cleaned;
  }
  
  return cleaned;
};

/**
 * Send password reset OTP
 * @param {string} phone - Phone number
 * @param {string} otp - OTP code
 */
const sendPasswordResetOTP = async (phone, otp) => {
  // Return early if SMS service not configured
  if (!sms) {
    console.log('SMS service not configured - skipping password reset SMS');
    return { success: false, error: 'SMS service not configured' };
  }
  
  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    const message = `Your WyZar password reset code is: ${otp}. This code expires in 10 minutes. If you didn't request this, please ignore this message.`;

    const options = {
      to: [formattedPhone],
      message: message,
      from: process.env.AT_SENDER_ID || 'WyZar'
    };

    const result = await sms.send(options);
    console.log('Password reset SMS sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending password reset SMS:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTP,
  sendOrderNotification,
  sendPasswordResetOTP,
  formatPhoneNumber
};