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

/**
 * Send welcome email after successful registration
 * @param {Object} user - User object with email and other details
 */
const sendWelcomeEmail = async (user) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .welcome-box { background-color: #fff; border: 2px solid #4F46E5; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to WyZar!</h1>
            </div>
            <div class="content">
              <p>Hello ${user.email},</p>
              <div class="welcome-box">
                <h2>Thank you for joining WyZar!</h2>
                <p>We're excited to have you as part of our community. Your account has been successfully created.</p>
              </div>
              <p>With your WyZar account, you can:</p>
              <ul>
                <li>Browse and purchase from thousands of products</li>
                <li>Track your orders in real-time</li>
                <li>Save your favorite items</li>
                <li>Get exclusive deals and offers</li>
              </ul>
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Start Shopping</a>
              </p>
              <p>If you have any questions, our support team is here to help!</p>
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
      to: user.email,
      subject: 'Welcome to WyZar - Your Account is Ready!',
      html
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send login alert email for security
 * @param {Object} user - User object
 * @param {Object} loginInfo - Login information (time, location, device)
 */
const sendLoginAlertEmail = async (user, loginInfo = {}) => {
  try {
    const loginTime = loginInfo.time || new Date().toLocaleString();
    const ipAddress = loginInfo.ip || 'Unknown';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .info-box { background-color: #fff; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; }
            .warning { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
            .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Login Detected</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We detected a new login to your WyZar account. Here are the details:</p>
              <div class="info-box">
                <p><strong>Time:</strong> ${loginTime}</p>
                <p><strong>IP Address:</strong> ${ipAddress}</p>
              </div>
              <p>If this was you, you can safely ignore this email.</p>
              <div class="warning">
                <p><strong>⚠️ Didn't login?</strong></p>
                <p>If you didn't perform this login, please secure your account immediately by changing your password and contacting our support team.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} WyZar. All rights reserved.</p>
              <p>This is a security notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendEmail({
      to: user.email,
      subject: 'WyZar - New Login to Your Account',
      html
    });
  } catch (error) {
    console.error('Error sending login alert email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send detailed order confirmation email
 * @param {Object} order - Order object with all details
 * @param {Object} user - User object
 */
const sendOrderConfirmationEmail = async (order, user) => {
  try {
    // Calculate total
    const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Generate items HTML
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name || item.product?.name || 'Product'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .order-summary { background-color: #fff; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .total { font-size: 20px; font-weight: bold; color: #4F46E5; text-align: right; padding: 15px; background-color: #f0f0f0; margin-top: 10px; }
            .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Order Confirmed!</h1>
              <p>Order #${order.orderNumber || order._id}</p>
            </div>
            <div class="content">
              <p>Hello ${user.email},</p>
              <p>Thank you for your purchase! Your order has been confirmed and is being processed.</p>

              <div class="order-summary">
                <h3>Order Summary</h3>
                <table>
                  <thead>
                    <tr style="background-color: #f9f9f9;">
                      <th style="padding: 10px; text-align: left;">Item</th>
                      <th style="padding: 10px; text-align: center;">Quantity</th>
                      <th style="padding: 10px; text-align: right;">Price</th>
                      <th style="padding: 10px; text-align: right;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
                <div class="total">
                  Total: $${total.toFixed(2)}
                </div>
              </div>

              <p><strong>Delivery Address:</strong><br>
              ${order.shippingAddress?.street || 'N/A'}<br>
              ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}</p>

              <p>We'll send you another email when your order ships. You can track your order status anytime by logging into your account.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} WyZar. All rights reserved.</p>
              <p>Questions? Contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendEmail({
      to: user.email,
      subject: `Order Confirmed - #${order.orderNumber || order._id}`,
      html
    });
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification to seller about new order
 * @param {Object} order - Order object
 * @param {Object} seller - Seller user object
 */
const sendSellerOrderNotification = async (order, seller) => {
  try {
    const sellerItems = order.items.filter(item =>
      item.seller && item.seller.toString() === seller._id.toString()
    );

    if (sellerItems.length === 0) return { success: true, message: 'No items for this seller' };

    const itemsHtml = sellerItems.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name || item.product?.name || 'Product'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .order-box { background-color: #fff; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛍️ New Order Received!</h1>
            </div>
            <div class="content">
              <p>Hello ${seller.sellerDetails?.businessName || seller.email},</p>
              <p>Great news! You have received a new order.</p>

              <div class="order-box">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> #${order.orderNumber || order._id}</p>
                <p><strong>Customer:</strong> ${order.user?.email || 'N/A'}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>

                <h4>Items Ordered:</h4>
                <table>
                  <thead>
                    <tr style="background-color: #f9f9f9;">
                      <th style="padding: 10px; text-align: left;">Product</th>
                      <th style="padding: 10px; text-align: center;">Quantity</th>
                      <th style="padding: 10px; text-align: right;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/seller/orders/${order._id}" class="button">View Order Details</a>
              </p>

              <p>Please prepare the items for shipment. The customer is waiting!</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} WyZar. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendEmail({
      to: seller.email,
      subject: `New Order #${order.orderNumber || order._id} - Action Required`,
      html
    });
  } catch (error) {
    console.error('Error sending seller order notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendOTP,
  sendPasswordResetOTP,
  sendOrderNotification,
  sendWelcomeEmail,
  sendLoginAlertEmail,
  sendOrderConfirmationEmail,
  sendSellerOrderNotification,
  transporter,
};
