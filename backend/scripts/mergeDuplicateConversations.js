// Script to merge duplicate conversations between the same users
const mongoose = require('mongoose');
require('dotenv').config();

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

async function mergeDuplicateConversations() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all conversations and group by participants
    const conversations = await Conversation.find({}).sort({ createdAt: 1 });

    // Group conversations by participant pairs
    const conversationGroups = {};

    conversations.forEach(conv => {
      // Sort participants to create a consistent key
      const key = conv.participants.map(p => p.toString()).sort().join('-');

      if (!conversationGroups[key]) {
        conversationGroups[key] = [];
      }
      conversationGroups[key].push(conv);
    });

    let mergedCount = 0;
    let totalDuplicates = 0;

    // Process each group
    for (const [key, convs] of Object.entries(conversationGroups)) {
      if (convs.length > 1) {
        console.log(`\nFound ${convs.length} duplicate conversations for participants: ${key}`);
        totalDuplicates += convs.length - 1;

        // Keep the oldest conversation (first created)
        const primaryConv = convs[0];
        const duplicates = convs.slice(1);

        console.log(`  Keeping conversation: ${primaryConv._id}`);
        console.log(`  Merging ${duplicates.length} duplicate(s)`);

        // Update all messages from duplicate conversations to point to the primary one
        for (const dupConv of duplicates) {
          const messageCount = await Message.countDocuments({ conversation: dupConv._id });
          console.log(`    Moving ${messageCount} messages from ${dupConv._id}`);

          await Message.updateMany(
            { conversation: dupConv._id },
            { $set: { conversation: primaryConv._id } }
          );

          // Update primary conversation with product if duplicate had one
          if (dupConv.product && !primaryConv.product) {
            primaryConv.product = dupConv.product;
          }

          // Update lastMessage if duplicate has a more recent one
          if (dupConv.lastMessageAt > primaryConv.lastMessageAt) {
            primaryConv.lastMessage = dupConv.lastMessage;
            primaryConv.lastMessageAt = dupConv.lastMessageAt;
          }

          // Merge unread counts
          for (const [userId, count] of dupConv.unreadCount.entries()) {
            const currentCount = primaryConv.unreadCount.get(userId) || 0;
            primaryConv.unreadCount.set(userId, currentCount + count);
          }

          // Delete the duplicate conversation
          await Conversation.deleteOne({ _id: dupConv._id });
          console.log(`    Deleted duplicate conversation: ${dupConv._id}`);
        }

        // Save the updated primary conversation
        await primaryConv.save();
        mergedCount++;
        console.log(`  ✓ Merged successfully`);
      }
    }

    console.log('\n========== Summary ==========');
    console.log(`Total conversation groups processed: ${Object.keys(conversationGroups).length}`);
    console.log(`Groups with duplicates: ${mergedCount}`);
    console.log(`Total duplicates removed: ${totalDuplicates}`);
    console.log('=============================\n');

    console.log('Cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the script
mergeDuplicateConversations();
