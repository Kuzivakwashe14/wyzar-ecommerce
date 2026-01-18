// Script to create an admin user
// Run this with: node scripts/createAdmin.js

const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import Prisma client
const prisma = require('../config/prisma');

// Admin credentials
const ADMIN_EMAIL = 'admin@wyzar.com';
const ADMIN_PASSWORD = 'Admin@123456';

async function createAdmin() {
  try {
    console.log('Connecting to PostgreSQL database...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({ 
      where: { email: ADMIN_EMAIL } 
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);

      // Update to admin if not already
      if (existingAdmin.role !== 'ADMIN') {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: {
            role: 'ADMIN',
            isEmailVerified: true
          }
        });
        console.log('User role updated to ADMIN');
      }

      console.log('================================');
      console.log('Admin Login Credentials:');
      console.log('Email:', ADMIN_EMAIL);
      console.log('Password:', ADMIN_PASSWORD);
      console.log('================================');

      await prisma.$disconnect();
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'ADMIN',
        isEmailVerified: true,
        isSeller: false,
        isVerified: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('================================');
    console.log('Admin Login Credentials:');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('Role:', adminUser.role);
    console.log('================================');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createAdmin();
