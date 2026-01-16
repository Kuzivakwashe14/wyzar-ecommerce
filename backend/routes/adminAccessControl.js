// backend/routes/adminAccessControl.js
// Admin routes for managing admin access and roles

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const adminAuth = require('../middleware/adminAuth');
const prisma = require('../config/prisma');

// ==========================================
// ADMIN ACCESS CONTROL
// ==========================================

// @route   GET /api/admin/access-control/admins
// @desc    Get all admin users
// @access  Private (Admin only)
router.get('/admins', adminAuth, async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
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
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

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
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

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
    const adminUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
        isEmailVerified: true,
        isSeller: false,
        isVerified: true
      },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      msg: 'Admin user created successfully',
      admin: adminUser
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

    // Normalize role string to handle different cases if needed, but Prisma schema expects Enum usually.
    // Assuming schema uses 'USER', 'SELLER', 'ADMIN' or lowercase. Checked schema previously, it seems to be 'ADMIN'.
    // Mapping frontend 'admin' to backend 'ADMIN' if necessary, or assuming consistent usage.
    // Based on previous file, let's normalize to uppercase to match schema if typical,
    // or just pass through if the frontend handles it. 
    // The previous file used lowercase 'admin'. Let's check typical usage.
    // The GET route used role: 'ADMIN'. So we should convert.
    
    const validRoles = ['user', 'seller', 'admin'];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid role. Must be: user, seller, or admin'
      });
    }

    const prismaRole = role.toUpperCase(); // USER, SELLER, ADMIN

    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        msg: 'You cannot change your own role'
      });
    }

    // Update data
    const updateData = { role: prismaRole };
    
    // If promoting to admin, verify email
    if (prismaRole === 'ADMIN') {
      updateData.isEmailVerified = true;
      updateData.isVerified = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true
      }
    });

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

    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: hashedPassword }
    });

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
    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });

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
        msg: 'You cannot remove your own admin access'
      });
    }

    if (user.role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        msg: 'User is not an admin'
      });
    }

    // Change role to USER instead of deleting
    await prisma.user.update({
      where: { id: req.params.id },
      data: { role: 'USER' }
    });

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
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'SELLER' } })
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
