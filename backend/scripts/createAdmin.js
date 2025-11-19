// In backend/scripts/createAdmin.js
// Script to create the first admin user

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ADMIN_EMAIL = 'admin@wyzar.co.zw';
const ADMIN_PASSWORD = 'Admin@123456'; // Change this after first login!
const ADMIN_PHONE = '+263771234567';

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      console.log('❌ Admin user already exists!');
      console.log(`   Email: ${ADMIN_EMAIL}`);

      // Update existing user to admin if they're not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin role');
      }

      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Create admin user
    const admin = new User({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      phone: ADMIN_PHONE,
      isPhoneVerified: true,
      isEmailVerified: true,
      role: 'admin',
      isSeller: false,
      isVerified: true
    });

    await admin.save();

    console.log('\n🎉 Admin user created successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`📧 Email:    ${ADMIN_EMAIL}`);
    console.log(`🔒 Password: ${ADMIN_PASSWORD}`);
    console.log(`📱 Phone:    ${ADMIN_PHONE}`);
    console.log('═══════════════════════════════════════');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
