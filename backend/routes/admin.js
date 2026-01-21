// In backend/routes/admin.js
// Admin routes for managing the platform

const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const prisma = require('../config/prisma');

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
      prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
      prisma.user.count({ where: { isSeller: true, isVerified: true } }),
      prisma.user.count({ where: { isSeller: true, isVerified: false } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.order.count({ where: { createdAt: { gte: thisMonth } } })
    ]);

    // Calculate revenue using Prisma aggregations
    const allRevenue = await prisma.order.aggregate({
      where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
      _sum: { totalPrice: true }
    });

    const todayRevenue = await prisma.order.aggregate({
      where: {
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
        createdAt: { gte: today }
      },
      _sum: { totalPrice: true }
    });

    const weekRevenue = await prisma.order.aggregate({
      where: {
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
        createdAt: { gte: thisWeek }
      },
      _sum: { totalPrice: true }
    });

    const monthRevenue = await prisma.order.aggregate({
      where: {
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
        createdAt: { gte: thisMonth }
      },
      _sum: { totalPrice: true }
    });

    const revenue = {
      totalRevenue: allRevenue._sum.totalPrice || 0,
      todayRevenue: todayRevenue._sum.totalPrice || 0,
      weekRevenue: weekRevenue._sum.totalPrice || 0,
      monthRevenue: monthRevenue._sum.totalPrice || 0
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

// @route   GET /api/admin/orders
// @desc    Get all orders with pagination and filtering
// @access  Private (Admin only)
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    
    // Optional: Add search functionality (by order ID or user email)
    if (search) {
       where.OR = [
         { id: search },
         { user: { email: { contains: search } } }
       ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, phone: true, firstName: true, lastName: true } },
          orderItems: true
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ success: false, msg: 'Server error', error: error.message });
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

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }
      },
      select: {
        createdAt: true,
        totalPrice: true
      }
    });

    // Group by date manually since Prisma doesn't support dateToString
    const revenueByDay = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!revenueByDay[date]) {
        revenueByDay[date] = { revenue: 0, orders: 0 };
      }
      revenueByDay[date].revenue += order.totalPrice;
      revenueByDay[date].orders += 1;
    });

    const revenueData = Object.entries(revenueByDay)
      .map(([date, data]) => ({
        _id: date,
        revenue: data.revenue,
        orders: data.orders
      }))
      .sort((a, b) => a._id.localeCompare(b._id));

    res.json({
      success: true,
      period,
      data: revenueData.map(item => ({
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

    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate },
        role: { not: 'ADMIN' }
      },
      select: {
        createdAt: true,
        isSeller: true
      }
    });

    // Group by date manually
    const usersByDay = {};
    users.forEach(user => {
      const date = user.createdAt.toISOString().split('T')[0];
      if (!usersByDay[date]) {
        usersByDay[date] = { users: 0, sellers: 0 };
      }
      usersByDay[date].users += 1;
      if (user.isSeller) usersByDay[date].sellers += 1;
    });

    const userData = Object.entries(usersByDay)
      .map(([date, data]) => ({
        _id: date,
        users: data.users,
        sellers: data.sellers
      }))
      .sort((a, b) => a._id.localeCompare(b._id));

    res.json({
      success: true,
      period,
      data: userData
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
    const productsByCategory = await prisma.product.groupBy({
      by: ['category'],
      _count: { category: true },
      _sum: {
        price: true,
        quantity: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    });

    // Calculate totalValue for each category
    const categoryStats = productsByCategory.map(cat => ({
      _id: cat.category,
      count: cat._count.category,
      totalValue: (cat._sum.price || 0) * (cat._sum.quantity || 0)
    }));

    const topProducts = await prisma.product.findMany({
      orderBy: { views: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        price: true,
        views: true,
        category: true,
        sellerId: true,
        seller: {
          select: {
            id: true,
            email: true,
            sellerDetails: {
              select: { businessName: true }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      byCategory: categoryStats,
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
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true
            }
          },
          orderItems: {
            select: {
              id: true,
              name: true,
              quantity: true,
              price: true
            }
          }
        }
      }),

      prisma.user.findMany({
        where: { role: { not: 'ADMIN' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          email: true,
          phone: true,
          isSeller: true,
          isVerified: true,
          createdAt: true
        }
      }),

      prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          price: true,
          category: true,
          createdAt: true,
          seller: {
            select: {
              id: true,
              email: true,
              sellerDetails: {
                select: { businessName: true }
              }
            }
          }
        }
      })
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
