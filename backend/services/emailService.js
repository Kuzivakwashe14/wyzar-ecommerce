// backend/services/emailService.js
const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

/**
 * Generic send email function for admin and other custom emails
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'WyZar <noreply@wyzar.co.zw>',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP via Email
 * @param {string} email - Email address
 * @param {string} otp - The OTP code to send
 * @returns {Promise} - Promise with email result
 */
const sendOTP = async (email, otp) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .otp-box { background-color: #fff; border: 2px dashed #4F46E5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; color: #4F46E5; }
            .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
            .warning { color: #dc2626; font-weight: bold; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>WyZar Verification Code</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You have requested a verification code for your WyZar account. Please use the code below to complete your verification:</p>
              <div class="otp-box">${otp}</div>
              <p><strong>This code will expire in 10 minutes.</strong></p>
              <p class="warning">⚠️ Do not share this code with anyone. WyZar will never ask for your verification code.</p>
              <p>If you didn't request this code, please ignore this email or contact our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} WyZar. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendEmail({
      to: email,
      subject: 'Your WyZar Verification Code',
      html
    });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset OTP via Email
 * @param {string} email - Email address
 * @param {string} otp - OTP code
 */
const sendPasswordResetOTP = async (email, otp) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .otp-box { background-color: #fff; border: 2px dashed #dc2626; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; color: #dc2626; }
            .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
            .warning { color: #dc2626; font-weight: bold; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You have requested to reset your WyZar account password. Please use the code below to proceed:</p>
              <div class="otp-box">${otp}</div>
              <p><strong>This code will expire in 10 minutes.</strong></p>
              <p class="warning">⚠️ If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
              <p>For security reasons, this code can only be used once and will expire shortly.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} WyZar. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendEmail({
      to: email,
      subject: 'WyZar Password Reset Code',
      html
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order notification email
 * @param {string} email - Email address
 * @param {string} orderNumber - Order number
 * @param {string} status - Order status
 */
const sendOrderNotification = async (email, orderNumber, status) => {
  try {
    let statusMessage;
    let statusColor;

    switch(status) {
      case 'confirmed':
        statusMessage = 'Your order has been confirmed and is being processed.';
        statusColor = '#4F46E5';
        break;
      case 'shipped':
        statusMessage = 'Great news! Your order has been shipped and is on its way to you.';
        statusColor = '#059669';
        break;
      case 'delivered':
        statusMessage = 'Your order has been delivered. Thank you for shopping with us!';
        statusColor = '#10b981';
        break;
      default:
        statusMessage = `Your order status has been updated to: ${status}`;
        statusColor = '#6b7280';
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${statusColor}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .order-box { background-color: #fff; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0; }
            .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Update</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <div class="order-box">
                <p><strong>Order Number:</strong> #${orderNumber}</p>
                <p><strong>Status:</strong> ${status.toUpperCase()}</p>
              </div>
              <p>${statusMessage}</p>
              <p>You can track your order status by logging into your WyZar account.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} WyZar. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendEmail({
      to: email,
      subject: `WyZar Order #${orderNumber} - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html
    });
  } catch (error) {
    console.error('Error sending order notification email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendOTP,
  sendPasswordResetOTP,
  sendOrderNotification,
  transporter,
};
