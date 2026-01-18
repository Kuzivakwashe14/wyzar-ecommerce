// backend/services/notificationService.js
const {
  sendWelcomeEmail,
  sendLoginAlertEmail,
  sendOrderConfirmationEmail,
  sendOrderNotification,
  sendSellerOrderNotification
} = require('./emailService');

/**
 * Send welcome notification after registration
 * @param {Object} user - User object from database
 */
const sendWelcomeNotification = async (user) => {
  try {
    console.log(`Sending welcome notification to: ${user.email}`);

    const emailResult = await sendWelcomeEmail(user);

    if (emailResult.success) {
      console.log(`Welcome email sent successfully to ${user.email}`);
    } else {
      console.error(`Failed to send welcome email: ${emailResult.error}`);
    }

    return emailResult;
  } catch (error) {
    console.error('Error in sendWelcomeNotification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send login alert notification
 * @param {Object} user - User object from database
 * @param {Object} loginInfo - Login details (ip, time, etc.)
 */
const sendLoginAlert = async (user, loginInfo = {}) => {
  try {
    console.log(`Sending login alert to: ${user.email}`);

    const emailResult = await sendLoginAlertEmail(user, loginInfo);

    if (emailResult.success) {
      console.log(`Login alert sent successfully to ${user.email}`);
    } else {
      console.error(`Failed to send login alert: ${emailResult.error}`);
    }

    return emailResult;
  } catch (error) {
    console.error('Error in sendLoginAlert:', error);
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
    console.log(`Sending order confirmation for order: ${order.id} to user: ${user.email}`);

    const emailResult = await sendOrderConfirmationEmail(order, user);

    if (emailResult.success) {
      console.log(`Order confirmation email sent successfully to ${user.email}`);
    } else {
      console.error(`Failed to send order confirmation: ${emailResult.error}`);
    }

    return emailResult;
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
    console.log(`Sending order status update for order: ${order.id}, status: ${order.status}`);

    const emailResult = await sendOrderNotification(user.email, order.orderNumber || order.id, order.status);

    if (emailResult.success) {
      console.log(`Order status update email sent successfully to ${user.email}`);
    } else {
      console.error(`Failed to send order status update: ${emailResult.error}`);
    }

    return emailResult;
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
    console.log(`Notifying seller: ${seller.email} of new order: ${order.id}`);

    const emailResult = await sendSellerOrderNotification(order, seller);

    if (emailResult.success) {
      console.log(`Seller notification sent successfully to ${seller.email}`);
    } else {
      console.error(`Failed to send seller notification: ${emailResult.error}`);
    }

    return emailResult;
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
  sendLoginAlert,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  notifySellerOfOrder
};
