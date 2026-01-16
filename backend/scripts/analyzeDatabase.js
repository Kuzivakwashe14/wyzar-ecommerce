// backend/scripts/analyzeDatabase.js
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

async function analyze() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n--- User Analysis ---');
    const totalUsers = await User.countDocuments();
    const usersWithClerk = await User.countDocuments({ clerkId: { $ne: null } });
    const usersWithKinde = await User.countDocuments({ kindeId: { $ne: null } });
    const usersWithoutClerk = await User.countDocuments({ clerkId: null });
    const usersOnlyKinde = await User.countDocuments({ clerkId: null, kindeId: { $ne: null } });
    
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Users with Clerk ID: ${usersWithClerk}`);
    console.log(`Users with Kinde ID: ${usersWithKinde}`);
    console.log(`Users WITHOUT Clerk ID: ${usersWithoutClerk}`);
    console.log(`Users with ONLY Kinde ID (and no Clerk): ${usersOnlyKinde}`);

    if (usersWithoutClerk > 0) {
        console.log('Top 5 Users without Clerk ID:');
        const noClerkUsers = await User.find({ clerkId: null }).limit(5).select('email role createdAt kindeId');
        noClerkUsers.forEach(u => console.log(` - ${u.email} (Role: ${u.role}, Created: ${u.createdAt})`));
    }

    console.log('\n--- Product Analysis ---');
    const totalProducts = await Product.countDocuments();
    console.log(`Total Products: ${totalProducts}`);

    console.log('\n--- Order Analysis ---');
    const totalOrders = await Order.countDocuments();
    console.log(`Total Orders: ${totalOrders}`);

    console.log('\n--- Conversation Analysis ---');
    const totalConversations = await Conversation.countDocuments();
    console.log(`Total Conversations: ${totalConversations}`);
    
    // Check for empty conversations or invalid refs could go here

    process.exit(0);
  } catch (error) {
    console.error('Error analyzing database:', error);
    process.exit(1);
  }
}

analyze();
