// backend/scripts/cleanupKindeUsers.js
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Remove users that have kindeId but NO clerkId, AND appear to be auto-generated kinde emails
    // The analysis showed "691e263caaf9f48670dd4719@kinde.user"
    const query = {
      clerkId: null,
      email: { $regex: /@kinde\.user$/ }
    };

    const usersToDelete = await User.find(query);
    console.log(`Found ${usersToDelete.length} legacy Kinde users to delete.`);
    
    if (usersToDelete.length > 0) {
        usersToDelete.forEach(u => console.log(` - Deleting: ${u.email}`));
        const result = await User.deleteMany(query);
        console.log(`✅ Deleted ${result.deletedCount} users.`);
    } else {
        console.log('No legacy Kinde users found to delete.');
    }

    // 2. Remove 'kindeId' field from all users (unset it) to clean up schema usage
    console.log('\nUnsetting kindeId from remaining users...');
    const updateResult = await User.updateMany(
        { kindeId: { $ne: null } },
        { $unset: { kindeId: "" } }
    );
    console.log(`✅ Removed 'kindeId' field from ${updateResult.modifiedCount} users.`);

    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up:', error);
    process.exit(1);
  }
}

cleanup();
