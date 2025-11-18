// backend/services/emailService.js
const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
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
 * Send welcome email after registration
 */
const sendWelcomeEmail = async (email, userName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'WyZar <noreply@wyzar.co.zw>',
      to: email,
      subject: 'Welcome to WyZar! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to WyZar! 🛍️</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName || 'there'}!</h2>
              <p>Thank you for joining WyZar, Zimbabwe's premier online marketplace. We're excited to have you on board!</p>
              
              <p><strong>What's next?</strong></p>
              <ul>
                <li>✅ Verify your phone number to secure your account</li>
                <li>🔍 Explore thousands of products from local sellers</li>
                <li>💰 Enjoy secure payments with Paynow, Omari, or Cash on Delivery</li>
                <li>📦 Track your orders in real-time</li>
              </ul>

              <p>Want to become a seller? You can start selling on WyZar in just a few minutes!</p>

              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Start Shopping</a>

              <p>If you have any questions, our support team is here to help.</p>
              
              <p>Happy shopping!<br>
              The WyZar Team</p>
            </div>
            <div class="footer">
              <p>© 2024 WyZar. All rights reserved.</p>
              <p>Harare, Zimbabwe | support@wyzar.co.zw</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order confirmation email
 */
const sendOrderConfirmationEmail = async (email, orderDetails) => {
  const { orderNumber, items, totalPrice, shippingAddress, paymentMethod } = orderDetails;

  const itemsHTML = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.name}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${item.price.toFixed(2)}
      </td>
    </tr>
  `).join('');

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'WyZar <noreply@wyzar.co.zw>',
      to: email,
      subject: `Order Confirmation - #${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .order-summary { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; }
            .total-row { font-weight: bold; font-size: 18px; color: #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Order Confirmed!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Order #${orderNumber}</p>
            </div>
            <div class="content">
              <p>Thank you for your order! We're getting everything ready for you.</p>

              <div class="order-summary">
                <h3>Order Summary</h3>
                <table>
                  <thead>
                    <tr>
                      <th style="text-align: left; padding: 10px; border-bottom: 2px solid #667eea;">Image</th>
                      <th style="text-align: left; padding: 10px; border-bottom: 2px solid #667eea;">Product</th>
                      <th style="text-align: center; padding: 10px; border-bottom: 2px solid #667eea;">Qty</th>
                      <th style="text-align: right; padding: 10px; border-bottom: 2px solid #667eea;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHTML}
                    <tr class="total-row">
                      <td colspan="3" style="padding: 15px; text-align: right;">Total:</td>
                      <td style="padding: 15px; text-align: right;">$${totalPrice.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="order-summary">
                <h3>Delivery Address</h3>
                <p>
                  <strong>${shippingAddress.fullName}</strong><br>
                  ${shippingAddress.address}<br>
                  ${shippingAddress.city}<br>
                  Phone: ${shippingAddress.phone}
                </p>
              </div>

              <div class="order-summary">
                <h3>Payment Method</h3>
                <p>${paymentMethod}</p>
              </div>

              <p><strong>What happens next?</strong></p>
              <ul>
                <li>📦 Your order is being prepared</li>
                <li>📧 You'll receive updates via email and SMS</li>
                <li>🚚 Tracking information will be shared once shipped</li>
              </ul>

              <a href="${process.env.FRONTEND_URL}/my-orders" class="button">Track Your Order</a>

              <p>Questions? Contact us at support@wyzar.co.zw</p>
            </div>
            <div class="footer">
              <p>© 2024 WyZar. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order status update email
 */
const sendOrderStatusEmail = async (email, orderDetails, newStatus) => {
  const { orderNumber, trackingNumber } = orderDetails;

  let statusMessage, statusColor, statusIcon;
  
  switch(newStatus.toLowerCase()) {
    case 'paid':
      statusMessage = 'Your payment has been confirmed!';
      statusColor = '#10b981';
      statusIcon = '💰';
      break;
    case 'shipped':
      statusMessage = 'Your order is on its way!';
      statusColor = '#3b82f6';
      statusIcon = '🚚';
      break;
    case 'delivered':
      statusMessage = 'Your order has been delivered!';
      statusColor = '#8b5cf6';
      statusIcon = '🎉';
      break;
    case 'cancelled':
      statusMessage = 'Your order has been cancelled';
      statusColor = '#ef4444';
      statusIcon = '❌';
      break;
    default:
      statusMessage = `Your order status has been updated to: ${newStatus}`;
      statusColor = '#667eea';
      statusIcon = '📦';
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'WyZar <noreply@wyzar.co.zw>',
      to: email,
      subject: `Order Update - #${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-box { background: white; padding: 20px; border-left: 4px solid ${statusColor}; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; background: ${statusColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusIcon} Order Update</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Order #${orderNumber}</p>
            </div>
            <div class="content">
              <div class="status-box">
                <h2 style="margin-top: 0; color: ${statusColor};">${statusMessage}</h2>
                <p><strong>Status:</strong> ${newStatus}</p>
                ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
              </div>

              ${newStatus.toLowerCase() === 'shipped' ? `
                <p>Your package is on its way! You can track your delivery using the tracking number above.</p>
              ` : ''}

              ${newStatus.toLowerCase() === 'delivered' ? `
                <p>We hope you love your purchase! If you have any issues, please contact us within 7 days.</p>
              ` : ''}

              <a href="${process.env.FRONTEND_URL}/my-orders" class="button">View Order Details</a>

              <p>Questions? Contact us at support@wyzar.co.zw</p>
            </div>
            <div class="footer">
              <p>© 2024 WyZar. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order status email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order status email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send seller new order notification
 */
const sendSellerOrderNotification = async (email, orderDetails) => {
  const { orderNumber, items, totalPrice, shippingAddress, buyerEmail } = orderDetails;

  const itemsHTML = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'WyZar <noreply@wyzar.co.zw>',
      to: email,
      subject: `New Order Received - #${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .order-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 New Order!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Order #${orderNumber}</p>
            </div>
            <div class="content">
              <p>Great news! You've received a new order on WyZar.</p>

              <div class="order-box">
                <h3>Order Items</h3>
                <table>
                  <thead>
                    <tr>
                      <th style="text-align: left; padding: 10px; border-bottom: 2px solid #10b981;">Product</th>
                      <th style="text-align: center; padding: 10px; border-bottom: 2px solid #10b981;">Qty</th>
                      <th style="text-align: right; padding: 10px; border-bottom: 2px solid #10b981;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHTML}
                  </tbody>
                </table>
              </div>

              <div class="order-box">
                <h3>Shipping Details</h3>
                <p>
                  <strong>${shippingAddress.fullName}</strong><br>
                  ${shippingAddress.address}<br>
                  ${shippingAddress.city}<br>
                  Phone: ${shippingAddress.phone}
                </p>
              </div>

              <div class="order-box">
                <h3>What to do next:</h3>
                <ol>
                  <li>Review the order details in your seller dashboard</li>
                  <li>Prepare the items for shipment</li>
                  <li>Update the order status to "Shipped" once dispatched</li>
                  <li>Add tracking information if available</li>
                </ol>
              </div>

              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>

              <p>Questions? Contact support@wyzar.co.zw</p>
            </div>
            <div class="footer">
              <p>© 2024 WyZar. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Seller notification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending seller notification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'WyZar <noreply@wyzar.co.zw>',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
            </div>
            <div class="content">
              <p>You requested to reset your WyZar account password.</p>

              <p>Click the button below to create a new password:</p>

              <a href="${resetLink}" class="button">Reset Password</a>

              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetLink}</p>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This link expires in 1 hour</li>
                  <li>If you didn't request this, ignore this email</li>
                  <li>Your password won't change until you access the link above</li>
                </ul>
              </div>

              <p>If you're having trouble, contact us at support@wyzar.co.zw</p>
            </div>
            <div class="footer">
              <p>© 2024 WyZar. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendSellerOrderNotification,
  sendPasswordResetEmail,
};