// Script to sync local user changes to Clerk metadata
// Run this with: node scripts/syncClerkMetadata.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Initialize Clerk
// Note: legacy import style for v4, check specific version docs if this fails
// But usually: const clerk = require('@clerk/clerk-sdk-node');
const { users } = require('@clerk/clerk-sdk-node');

const TARGET_EMAIL = 'kuzivakwashekubiku@gmail.com';
const BUSINESS_NAME = 'Electronic Portal';

async function syncToClerk() {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY is missing in .env');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    // 1. Get user from Clerk
    console.log(`Fetching user from Clerk: ${TARGET_EMAIL}`);
    const clerkUserList = await users.getUserList({
      emailAddress: [TARGET_EMAIL],
      limit: 1,
    });

    if (!clerkUserList || clerkUserList.length === 0) {
      console.error('❌ User not found in Clerk! Has the user verified their email / signed up?');
      process.exit(1);
    }

    const clerkUser = clerkUserList[0];
    console.log(`Found Clerk User ID: ${clerkUser.id}`);

    // 2. Update Clerk Metadata
    console.log('Updating Clerk publicMetadata...');
    await users.updateUser(clerkUser.id, {
      publicMetadata: {
        isSeller: true,
        role: 'seller',
        sellerDetails: {
          businessName: BUSINESS_NAME
        }
      }
    });
    console.log('✅ Clerk metadata updated.');

    // 3. Update local MongoDB clerkId if missing
    const localUser = await User.findOne({ email: TARGET_EMAIL });
    if (localUser) {
        if (!localUser.clerkId) {
            localUser.clerkId = clerkUser.id;
            await localUser.save();
            console.log('✅ Local MongoDB clerkId updated.');
        } else if (localUser.clerkId !== clerkUser.id) {
            console.warn(`⚠️ Mismatch! Local clerkId (${localUser.clerkId}) != Remote (${clerkUser.id}). Updating local...`);
            localUser.clerkId = clerkUser.id;
            await localUser.save();
        }
    } else {
        console.warn('⚠️ Local MongoDB user not found during sync (strange, as previous step passed).');
    }

    console.log('Sync complete.');
    process.exit(0);

  } catch (error) {
    console.error('Error syncing to Clerk:', error);
    process.exit(1);
  }
}

syncToClerk();
