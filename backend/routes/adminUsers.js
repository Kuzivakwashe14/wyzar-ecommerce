// In backend/routes/adminUsers.js
// Admin routes for user management

const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

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
    const query = { role: { $ne: 'admin' } }; // Exclude admins from list

    // Search by email or phone
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'sellerDetails.businessName': { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by seller status
    if (isSeller !== '') {
      query.isSeller = isSeller === 'true';
    }

    // Filter by verification status
    if (isVerified !== '') {
      query.isVerified = isVerified === 'true';
    }

    // Filter by suspension status
    if (isSuspended !== '') {
      query.isSuspended = isSuspended === 'true';
    }

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const count = await User.countDocuments(query);

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
    const user = await User.findById(req.params.id).select('-password');

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
        Product.countDocuments({ seller: user._id }),
        Order.countDocuments({ 'orderItems.product': { $exists: true } }),
        Order.aggregate([
          {
            $match: {
              'orderItems.product': { $exists: true },
              status: { $in: ['Paid', 'Shipped', 'Delivered'] }
            }
          },
          { $unwind: '$orderItems' },
          {
            $lookup: {
              from: 'products',
              localField: 'orderItems.product',
              foreignField: '_id',
              as: 'productInfo'
            }
          },
          { $unwind: '$productInfo' },
          {
            $match: {
              'productInfo.seller': user._id
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$orderItems.price' }
            }
          }
        ])
      ]);

      sellerStats = {
        products: productCount,
        orders: orderCount,
        revenue: revenueData[0]?.totalRevenue || 0
      };
    }

    // Get user's orders
    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderItems totalPrice status createdAt');

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

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user.id && role !== user.role) {
      return res.status(400).json({
        success: false,
        msg: 'You cannot change your own role'
      });
    }

    // Update fields
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (typeof isVerified !== 'undefined') user.isVerified = isVerified;
    if (typeof isSuspended !== 'undefined') user.isSuspended = isSuspended;
    if (suspensionReason) user.suspensionReason = suspensionReason;
    if (role && ['user', 'seller', 'admin'].includes(role)) user.role = role;

    await user.save();

    res.json({
      success: true,
      msg: 'User updated successfully',
      user: await User.findById(user._id).select('-password')
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

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Prevent admin from suspending themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        msg: 'You cannot suspend your own account'
      });
    }

    // Prevent suspending other admins
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        msg: 'You cannot suspend other admin accounts'
      });
    }

    user.isSuspended = suspend;
    if (suspend && reason) {
      user.suspensionReason = reason;
    } else if (!suspend) {
      user.suspensionReason = '';
    }

    await user.save();

    res.json({
      success: true,
      msg: suspend ? 'User suspended successfully' : 'User unsuspended successfully',
      user: await User.findById(user._id).select('-password')
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
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        msg: 'You cannot delete your own account'
      });
    }

    // Prevent deleting other admins
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        msg: 'You cannot delete other admin accounts'
      });
    }

    // Instead of deleting, suspend the account
    user.isSuspended = true;
    user.suspensionReason = 'Account deleted by admin';
    await user.save();

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
