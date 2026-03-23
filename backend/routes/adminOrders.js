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

    // Filter by status — map to Prisma OrderStatus enum values (must be exact enum member names)
    if (status) {
      const statusMap = {
        'pending': 'PENDING',
        'confirmed': 'CONFIRMED',
        'paid': 'PAID',
        'shipped': 'SHIPPED',
        'delivered': 'DELIVERED',
        'cancelled': 'CANCELLED'
      };
      const mappedStatus = statusMap[status.toLowerCase()];
      if (mappedStatus) {
        where.status = mappedStatus;
      }
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

    // Map to Prisma OrderStatus enum (must be uppercase)
    const statusMap = {
      'Pending': 'PENDING',
      'Confirmed': 'CONFIRMED',
      'Paid': 'PAID',
      'Shipped': 'SHIPPED',
      'Delivered': 'DELIVERED',
      'Cancelled': 'CANCELLED'
    };

    const prismaStatus = statusMap[status] || status?.toUpperCase();
    const validStatuses = ['PENDING', 'CONFIRMED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

    if (!validStatuses.includes(prismaStatus)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid status'
      });
    }

    // Find the existing order first
    const existingOrder = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, email: true, phone: true } } }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        msg: 'Order not found'
      });
    }

    const oldStatus = existingOrder.status;

    // Build update data
    const updateData = { status: prismaStatus };
    if (prismaStatus === 'PAID' && !existingOrder.paidAt) {
      updateData.paidAt = new Date();
    }
    if (prismaStatus === 'SHIPPED' && !existingOrder.shippedAt) {
      updateData.shippedAt = new Date();
    }
    if (prismaStatus === 'DELIVERED' && !existingOrder.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        user: { select: { id: true, email: true, phone: true } },
        orderItems: true
      }
    });

    // Send notification to customer
    try {
      const statusMessages = {
        'PAID': 'Your payment has been confirmed.',
        'SHIPPED': 'Your order has been shipped and is on its way!',
        'DELIVERED': 'Your order has been delivered. Thank you for shopping with WyZar!',
        'CANCELLED': 'Your order has been cancelled. If you have any questions, please contact support.'
      };

      if (updatedOrder.user?.email && statusMessages[prismaStatus]) {
        await sendEmail({
          to: updatedOrder.user.email,
          subject: `Order ${status} - WyZar`,
          html: `
            <h1>Order Status Update</h1>
            <p>Hello,</p>
            <p>Your order #${updatedOrder.id} status has been updated.</p>
            <p><strong>New Status:</strong> ${status}</p>
            <p>${statusMessages[prismaStatus]}</p>
            <p>Order Total: $${updatedOrder.totalPrice}</p>
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
      msg: `Order status updated from ${oldStatus} to ${prismaStatus}`,
      order: updatedOrder
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

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, email: true, phone: true } } }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: 'Order not found'
      });
    }

    // Check if order is eligible for refund
    if (!['PAID', 'SHIPPED'].includes(order.status)) {
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

    // Update order status to CANCELLED
    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
      include: {
        user: { select: { id: true, email: true, phone: true } },
        orderItems: true
      }
    });

    // Send refund notification
    try {
      if (updatedOrder.user?.email) {
        await sendEmail({
          to: updatedOrder.user.email,
          subject: 'Refund Processed - WyZar',
          html: `
            <h1>Refund Processed</h1>
            <p>Hello,</p>
            <p>A refund has been processed for your order #${updatedOrder.id}.</p>
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
      order: updatedOrder
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
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } })
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
