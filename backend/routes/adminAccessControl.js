// In backend/routes/adminAccessControl.js
// Admin routes for managing admin access and roles

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');

// ==========================================
// ADMIN ACCESS CONTROL
// ==========================================

// @route   GET /api/admin/access-control/admins
// @desc    Get all admin users
// @access  Private (Admin only)
router.get('/admins', adminAuth, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      admins,
      count: admins.length
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/access-control/admins
// @desc    Create a new admin user
// @access  Private (Admin only)
router.post('/admins', adminAuth, async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Validation
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide email, password, and confirm password'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        msg: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        msg: 'Password must be at least 6 characters long'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        msg: 'Email already exists in the system'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const adminUser = new User({
      email,
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true,
      isSeller: false,
      isVerified: true
    });

    await adminUser.save();

    // Return without password
    const adminResponse = await User.findById(adminUser._id).select('-password');

    res.status(201).json({
      success: true,
      msg: 'Admin user created successfully',
      admin: adminResponse
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/access-control/admins/:id/role
// @desc    Change user role to/from admin
// @access  Private (Admin only)
router.put('/admins/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid role. Must be: user, seller, or admin'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        msg: 'You cannot change your own role'
      });
    }

    user.role = role;
    
    // If promoting to admin, verify email
    if (role === 'admin') {
      user.isEmailVerified = true;
      user.isVerified = true;
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      msg: `User role changed to ${role} successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error changing user role:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/access-control/admins/:id/password
// @desc    Reset admin password
// @access  Private (Admin only)
router.put('/admins/:id/password', adminAuth, async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide new password and confirmation'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        msg: 'Passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        msg: 'Password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({
      success: true,
      msg: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/access-control/admins/:id
// @desc    Remove admin privileges or delete admin
// @access  Private (Admin only)
router.delete('/admins/:id', adminAuth, async (req, res) => {
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
        msg: 'You cannot remove your own admin access'
      });
    }

    if (user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        msg: 'User is not an admin'
      });
    }

    // Change role to user instead of deleting
    user.role = 'user';
    await user.save();

    res.json({
      success: true,
      msg: 'Admin privileges removed successfully'
    });
  } catch (error) {
    console.error('Error removing admin:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/access-control/role-stats
// @desc    Get statistics about user roles
// @access  Private (Admin only)
router.get('/role-stats', adminAuth, async (req, res) => {
  try {
    const [admins, users, sellers] = await Promise.all([
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'seller' })
    ]);

    res.json({
      success: true,
      stats: {
        admins,
        users,
        sellers,
        total: admins + users + sellers
      }
    });
  } catch (error) {
    console.error('Error fetching role stats:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
