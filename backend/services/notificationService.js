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

/**
 * Send order confirmation notification after successful order
 * @param {Object} order - Order object from database
 * @param {Object} user - User object from database
 */
const sendOrderConfirmation = async (order, user) => {
  try {
    console.log(`Order confirmation for order: ${order._id}, user: ${user.email}`);
    console.log('Email notifications temporarily disabled - will be enabled after setup');

    // TODO: Enable email once nodemailer is configured
    // const emailResult = await sendOrderEmail(user.email, order);

    return {
      success: true,
      message: 'Order confirmation sent (email notifications disabled in development)'
    };
  } catch (error) {
    console.error('Error in sendOrderConfirmation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send order status update notification
 * @param {Object} order - Order object from database
 * @param {Object} user - User object from database
 */
const sendOrderStatusUpdate = async (order, user) => {
  try {
    console.log(`Order status update for order: ${order._id}, status: ${order.status}`);
    console.log('Email notifications temporarily disabled - will be enabled after setup');

    // TODO: Enable email once nodemailer is configured
    // const emailResult = await sendStatusUpdateEmail(user.email, order);

    return {
      success: true,
      message: 'Order status update sent (email notifications disabled in development)'
    };
  } catch (error) {
    console.error('Error in sendOrderStatusUpdate:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Notify seller of new order
 * @param {Object} order - Order object from database
 * @param {Object} seller - Seller user object from database
 */
const notifySellerOfOrder = async (order, seller) => {
  try {
    console.log(`Notifying seller: ${seller.email} of new order: ${order._id}`);
    console.log('Email notifications temporarily disabled - will be enabled after setup');

    // TODO: Enable email once nodemailer is configured
    // const emailResult = await sendSellerNotificationEmail(seller.email, order);

    return {
      success: true,
      message: 'Seller notified (email notifications disabled in development)'
    };
  } catch (error) {
    console.error('Error in notifySellerOfOrder:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendWelcomeNotification,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  notifySellerOfOrder
};
