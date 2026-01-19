// Script to create an admin user
// Run this with: node scripts/createAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Admin credentials
const ADMIN_EMAIL = 'admin@wyzar.com';
const ADMIN_PASSWORD = 'Admin@123456';

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);

      // Update to admin if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        existingAdmin.isEmailVerified = true;
        await existingAdmin.save();
        console.log('User role updated to admin');
      }

      console.log('================================');
      console.log('Admin Login Credentials:');
      console.log('Email:', ADMIN_EMAIL);
      console.log('Password:', ADMIN_PASSWORD);
      console.log('================================');

      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Create admin user
    const adminUser = new User({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true,
      isSeller: false,
      isVerified: true
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('================================');
    console.log('Admin Login Credentials:');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('Role:', adminUser.role);
    console.log('================================');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
