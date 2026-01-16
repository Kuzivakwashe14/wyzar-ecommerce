// backend/scripts/cleanupDatabase.js
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

// List of collections we want to KEEP
const KEEP_COLLECTIONS = [
  'users',
  'products',
  'orders',
  'conversations',
  'messages',
  'reviews', // Assuming Review.js maps to 'reviews'
  'reports'  // Assuming Report.js maps to 'reports'
];

async function cleanupFull() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Drop Unused Collections
    console.log('\n--- Dropping Unused Collections ---');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const col of collections) {
        if (!KEEP_COLLECTIONS.includes(col.name)) {
            console.log(`Dropping collection: ${col.name}`);
            try {
                await mongoose.connection.db.dropCollection(col.name);
                console.log(`✅ Dropped ${col.name}`);
            } catch (err) {
                console.error(`❌ Failed to drop ${col.name}:`, err.message);
            }
        } else {
            console.log(`Skipping (keeping): ${col.name}`);
        }
    }

    // 2. Remove Legacy Users
    console.log('\n--- Removing Legacy Kinde Users ---');
    const query = {
      clerkId: null,
      email: { $regex: /@kinde\.user$/ }
    };
    const result = await User.deleteMany(query);
    console.log(`✅ Deleted ${result.deletedCount} legacy Kinde users.`);


    // 3. Unset kindeId
    console.log('\n--- Cleaning up User Schema (removing kindeId) ---');
    const updateResult = await User.updateMany(
        { kindeId: { $ne: null } },
        { $unset: { kindeId: "" } }
    );
    console.log(`✅ Removed 'kindeId' field from ${updateResult.modifiedCount} users.`);

    // 4. Cleanup Admin User (Optional - check if admin needs clerkId)
    // For now we leave the admin alone as they might be using a different login flow or will be manually updated.

    console.log('\nDatabase cleanup complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up database:', error);
    process.exit(1);
  }
}

cleanupFull();
