// In backend/routes/adminUsers.js
// Admin routes for user management

const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const prisma = require('../config/prisma');

// ==========================================
// USER MANAGEMENT
// ==========================================

// @route   GET /api/admin/users
// @desc    Get all users with filters and pagination
// @access  Private (Admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      isSeller = '',
      isVerified = '',
      isSuspended = ''
    } = req.query;

    // Build query
    const where = { role: { not: 'ADMIN' } }; // Exclude admins from list

    // Search by email or phone
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { sellerDetails: { businessName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Filter by role
    if (role) {
      where.role = role.toUpperCase();
    }

    // Filter by seller status
    if (isSeller !== '') {
      where.isSeller = isSeller === 'true';
    }

    // Filter by verification status
    if (isVerified !== '') {
      where.isVerified = isVerified === 'true';
    }

    // Filter by suspension status
    if (isSuspended !== '') {
      where.isSuspended = isSuspended === 'true';
    }

    // Execute query with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        isSeller: true,
        isVerified: true,
        role: true,
        isSuspended: true,
        suspensionReason: true,
        createdAt: true,
        updatedAt: true,
        sellerDetails: {
          select: {
            businessName: true,
            sellerType: true,
            verificationStatus: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 1,
      skip: (page - 1) * limit
    });

    // Get total count for pagination
    const count = await prisma.user.count({ where });

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalUsers: count
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user details with stats
// @access  Private (Admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        isSeller: true,
        isVerified: true,
        role: true,
        isSuspended: true,
        suspensionReason: true,
        createdAt: true,
        updatedAt: true,
        sellerDetails: {
          include: {
            verificationDocuments: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Get user stats
    let sellerStats = null;
    if (user.isSeller) {
      const [productCount, orderCount, revenueData] = await Promise.all([
        prisma.product.count({ where: { sellerId: user.id } }),
        prisma.order.count(),
        prisma.orderItem.aggregate({
          where: {
            product: {
              sellerId: user.id
            },
            order: {
              status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }
            }
          },
          _sum: { price: true }
        })
      ]);

      sellerStats = {
        products: productCount,
        orders: orderCount,
        revenue: revenueData._sum.price || 0
      };
    }

    // Get user's orders
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        orderItems: {
          select: {
            id: true,
            name: true,
            quantity: true,
            price: true
          }
        }
      }
    });

    res.json({
      success: true,
      user,
      sellerStats,
      recentOrders: orders
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user details
// @access  Private (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { email, phone, isVerified, isSuspended, suspensionReason, role } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (user.id === req.user.id && role && role.toUpperCase() !== user.role) {
      return res.status(400).json({
        success: false,
        msg: 'You cannot change your own role'
      });
    }

    // Prepare update data
    const updateData = {};
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (typeof isVerified !== 'undefined') updateData.isVerified = isVerified;
    if (typeof isSuspended !== 'undefined') updateData.isSuspended = isSuspended;
    if (suspensionReason) updateData.suspensionReason = suspensionReason;
    if (role && ['user', 'seller', 'admin'].includes(role)) {
      updateData.role = role.toUpperCase();
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        isSeller: true,
        isVerified: true,
        role: true,
        isSuspended: true,
        suspensionReason: true,
        createdAt: true,
        updatedAt: true,
        sellerDetails: true
      }
    });

    res.json({
      success: true,
      msg: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/suspend
// @desc    Suspend or unsuspend a user
// @access  Private (Admin only)
router.put('/:id/suspend', adminAuth, async (req, res) => {
  try {
    const { suspend, reason } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Prevent admin from suspending themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        msg: 'You cannot suspend your own account'
      });
    }

    // Prevent suspending other admins
    if (user.role === 'ADMIN') {
      return res.status(400).json({
        success: false,
        msg: 'You cannot suspend other admin accounts'
      });
    }

    const updateData = {
      isSuspended: suspend
    };
    if (suspend && reason) {
      updateData.suspensionReason = reason;
    } else if (!suspend) {
      updateData.suspensionReason = '';
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        isSeller: true,
        isVerified: true,
        role: true,
        isSuspended: true,
        suspensionReason: true,
        createdAt: true,
        updatedAt: true,
        sellerDetails: true
      }
    });

    res.json({
      success: true,
      msg: suspend ? 'User suspended successfully' : 'User unsuspended successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (soft delete - suspend instead)
// @access  Private (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        msg: 'You cannot delete your own account'
      });
    }

    // Prevent deleting other admins
    if (user.role === 'ADMIN') {
      return res.status(400).json({
        success: false,
        msg: 'You cannot delete other admin accounts'
      });
    }

    // Instead of deleting, suspend the account
    await prisma.user.update({
      where: { id: req.params.id },
      data: {
        isSuspended: true,
        suspensionReason: 'Account deleted by admin'
      }
    });

    res.json({
      success: true,
      msg: 'User account suspended successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
