// In backend/routes/admin.js
// Admin routes for managing the platform

const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// ==========================================
// DASHBOARD STATS
// ==========================================

// @route   GET /api/admin/stats/overview
// @desc    Get dashboard overview statistics
// @access  Private (Admin only)
router.get('/stats/overview', adminAuth, async (req, res) => {
  try {
    // Get current date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    // Count statistics
    const [
      totalUsers,
      totalSellers,
      pendingSellers,
      totalProducts,
      totalOrders,
      todayOrders,
      thisWeekOrders,
      thisMonthOrders
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ isSeller: true, isVerified: true }),
      User.countDocuments({ isSeller: true, isVerified: false }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: thisWeek } }),
      Order.countDocuments({ createdAt: { $gte: thisMonth } })
    ]);

    // Calculate revenue
    const revenueData = await Order.aggregate([
      { $match: { status: { $in: ['Paid', 'Shipped', 'Delivered'] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          todayRevenue: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', today] }, '$totalPrice', 0]
            }
          },
          weekRevenue: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', thisWeek] }, '$totalPrice', 0]
            }
          },
          monthRevenue: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', thisMonth] }, '$totalPrice', 0]
            }
          }
        }
      }
    ]);

    const revenue = revenueData[0] || {
      totalRevenue: 0,
      todayRevenue: 0,
      weekRevenue: 0,
      monthRevenue: 0
    };

    // Commission calculation (10%)
    const COMMISSION_RATE = 0.10;
    const commission = {
      total: revenue.totalRevenue * COMMISSION_RATE,
      today: revenue.todayRevenue * COMMISSION_RATE,
      week: revenue.weekRevenue * COMMISSION_RATE,
      month: revenue.monthRevenue * COMMISSION_RATE
    };

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          sellers: totalSellers,
          pendingSellers: pendingSellers
        },
        products: {
          total: totalProducts
        },
        orders: {
          total: totalOrders,
          today: todayOrders,
          thisWeek: thisWeekOrders,
          thisMonth: thisMonthOrders
        },
        revenue: {
          total: revenue.totalRevenue,
          today: revenue.todayRevenue,
          thisWeek: revenue.weekRevenue,
          thisMonth: revenue.monthRevenue
        },
        commission: commission
      }
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/stats/revenue
// @desc    Get revenue analytics by date range
// @access  Private (Admin only)
router.get('/stats/revenue', adminAuth, async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    let daysBack = 30;
    if (period === '7days') daysBack = 7;
    if (period === '90days') daysBack = 90;
    if (period === '365days') daysBack = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    const revenueByDay = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['Paid', 'Shipped', 'Delivered'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      period,
      data: revenueByDay.map(item => ({
        date: item._id,
        revenue: item.revenue,
        orders: item.orders,
        commission: item.revenue * 0.10
      }))
    });
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/stats/users
// @desc    Get user growth analytics
// @access  Private (Admin only)
router.get('/stats/users', adminAuth, async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    let daysBack = 30;
    if (period === '7days') daysBack = 7;
    if (period === '90days') daysBack = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const usersByDay = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          role: { $ne: 'admin' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          users: { $sum: 1 },
          sellers: {
            $sum: { $cond: ['$isSeller', 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      period,
      data: usersByDay
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/stats/products
// @desc    Get product analytics by category
// @access  Private (Admin only)
router.get('/stats/products', adminAuth, async (req, res) => {
  try {
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const topProducts = await Product.find()
      .sort({ views: -1 })
      .limit(10)
      .select('name price views category seller')
      .populate('seller', 'email sellerDetails.businessName');

    res.json({
      success: true,
      byCategory: productsByCategory,
      topProducts
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/stats/recent-activity
// @desc    Get recent platform activity
// @access  Private (Admin only)
router.get('/stats/recent-activity', adminAuth, async (req, res) => {
  try {
    const [recentOrders, recentUsers, recentProducts] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'email phone')
        .select('orderItems totalPrice status createdAt'),

      User.find({ role: { $ne: 'admin' } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('email phone isSeller isVerified createdAt'),

      Product.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('seller', 'email sellerDetails.businessName')
        .select('name price category createdAt')
    ]);

    res.json({
      success: true,
      recentOrders,
      recentUsers,
      recentProducts
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
