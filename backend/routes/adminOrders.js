// In backend/routes/adminOrders.js
// Admin routes for order management

const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const prisma = require('../config/prisma');
const { sendEmail } = require('../services/emailService');

// ==========================================
// ORDER MANAGEMENT
// ==========================================

// @route   GET /api/admin/orders
// @desc    Get all orders with filters and pagination
// @access  Private (Admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = '',
      search = '',
      startDate = '',
      endDate = ''
    } = req.query;

    // Build where clause
    const where = {};

    // Filter by status
    if (status) {
      where.status = status.toUpperCase();
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Execute query with pagination
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true
          }
        },
        orderItems: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    // If search is provided, filter results
    let filteredOrders = orders;
    if (search) {
      filteredOrders = orders.filter(order =>
        order.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        order.user?.phone?.includes(search) ||
        order.id.toString().includes(search)
      );
    }

    // Get total count for pagination
    const count = await prisma.order.count({ where });

    res.json({
      success: true,
      orders: filteredOrders,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalOrders: count
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/orders/:id
// @desc    Get single order details
// @access  Private (Admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private (Admin only)
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid status'
      });
    }

    const order = await Order.findById(req.params.id).populate('user', 'email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: 'Order not found'
      });
    }

    const oldStatus = order.status;
    order.status = status;

    // Update timestamps
    if (status === 'Paid' && !order.paidAt) {
      order.paidAt = new Date();
    }
    if (status === 'Shipped' && !order.shippedAt) {
      order.shippedAt = new Date();
    }
    if (status === 'Delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    await order.save();

    // Send notification to customer
    try {
      const statusMessages = {
        'Paid': 'Your payment has been confirmed.',
        'Shipped': 'Your order has been shipped and is on its way!',
        'Delivered': 'Your order has been delivered. Thank you for shopping with WyZar!',
        'Cancelled': 'Your order has been cancelled. If you have any questions, please contact support.'
      };

      if (order.user?.email && statusMessages[status]) {
        await sendEmail({
          to: order.user.email,
          subject: `Order ${status} - WyZar`,
          html: `
            <h1>Order Status Update</h1>
            <p>Hello,</p>
            <p>Your order #${order._id} status has been updated.</p>
            <p><strong>New Status:</strong> ${status}</p>
            <p>${statusMessages[status]}</p>
            <p>Order Total: $${order.totalPrice}</p>
            <p>Thank you for shopping with WyZar!</p>
            <p>Best regards,<br>WyZar Team</p>
          `
        });
      }
    } catch (notificationError) {
      console.error('Error sending order status notification:', notificationError);
      // Don't fail the status update if notification fails
    }

    res.json({
      success: true,
      msg: `Order status updated from ${oldStatus} to ${status}`,
      order: await Order.findById(order._id).populate('user', 'email phone')
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/orders/:id/refund
// @desc    Process a refund for an order
// @access  Private (Admin only)
router.put('/:id/refund', adminAuth, async (req, res) => {
  try {
    const { refundAmount, reason } = req.body;

    const order = await Order.findById(req.params.id).populate('user', 'email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: 'Order not found'
      });
    }

    // Check if order is eligible for refund
    if (!['Paid', 'Shipped'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        msg: 'Order is not eligible for refund'
      });
    }

    // Validate refund amount
    const amount = refundAmount || order.totalPrice;
    if (amount > order.totalPrice) {
      return res.status(400).json({
        success: false,
        msg: 'Refund amount cannot exceed order total'
      });
    }

    // Update order status
    order.status = 'Cancelled';
    order.refund = {
      amount: amount,
      reason: reason || 'Refund processed by admin',
      processedBy: req.user.id,
      processedAt: new Date()
    };

    await order.save();

    // Send refund notification
    try {
      if (order.user?.email) {
        await sendEmail({
          to: order.user.email,
          subject: 'Refund Processed - WyZar',
          html: `
            <h1>Refund Processed</h1>
            <p>Hello,</p>
            <p>A refund has been processed for your order #${order._id}.</p>
            <p><strong>Refund Amount:</strong> $${amount}</p>
            <p><strong>Reason:</strong> ${reason || 'Refund requested'}</p>
            <p>The amount will be credited to your original payment method within 5-10 business days.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>WyZar Team</p>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending refund email:', emailError);
    }

    res.json({
      success: true,
      msg: 'Refund processed successfully',
      order: await Order.findById(order._id).populate('user', 'email phone')
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/orders/stats/summary
// @desc    Get order statistics summary
// @access  Private (Admin only)
router.get('/stats/summary', adminAuth, async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: 'Shipped' }),
      Order.countDocuments({ status: 'Delivered' }),
      Order.countDocuments({ status: 'Cancelled' })
    ]);

    res.json({
      success: true,
      stats: {
        total: totalOrders,
        pending: pendingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders
      }
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
