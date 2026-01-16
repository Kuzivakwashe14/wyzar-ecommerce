// Script to assign Electronic Portal business to a specific email
// Run this with: node scripts/assignElectronicPortal.js

const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const TARGET_EMAIL = 'kuzivakwashekubiku@gmail.com';
const BUSINESS_NAME = 'Electronic Portal';

async function assignBusiness() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: TARGET_EMAIL });

    if (!user) {
      console.log(`❌ User with email ${TARGET_EMAIL} not found.`);
      console.log('Please sign up with this email first, or check the email address.');
      process.exit(1);
    }

    console.log(`Found user: ${user.email}`);
    console.log(`Current Role: ${user.role}`);
    console.log(`Current Business: ${user.sellerDetails?.businessName || 'None'}`);

    // Update user fields
    user.isSeller = true;
    user.role = 'seller'; // Or keep admin if they are admin, but let's set to seller to be safe, or check
    if (user.role === 'admin') {
        console.log('User is admin. Keeping admin role, but enabling seller status.');
    } else {
        user.role = 'seller';
    }
    
    // Initialize sellerDetails if it doesn't exist
    if (!user.sellerDetails) {
      user.sellerDetails = {};
    }

    user.sellerDetails.businessName = BUSINESS_NAME;
    user.sellerDetails.sellerType = 'business'; // Default to business
    user.sellerDetails.verificationStatus = 'approved'; // Auto-approve
    user.sellerDetails.verifiedAt = new Date();
    user.isVerified = true;

    await user.save();

    console.log('✅ User updated successfully!');
    console.log('================================');
    console.log('Email:', user.email);
    console.log('Business Name:', user.sellerDetails.businessName);
    console.log('Role:', user.role);
    console.log('Verification Status:', user.sellerDetails.verificationStatus);
    console.log('================================');

    process.exit(0);
  } catch (error) {
    console.error('Error updating user:', error);
    process.exit(1);
  }
}

assignBusiness();
