// routes/messages.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Product = require('../models/Product');
const User = require('../models/User');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { getStoragePath, getPublicUrl } = require('../config/localStorage');
const { sendMessageNotificationEmail } = require('../services/emailService');

// @route   GET /api/messages/conversations
// @desc    Get all conversations for the logged-in user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'email sellerDetails')
      .populate('product', 'name images price')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    // Format conversations with unread count
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== req.user.id
      );

      return {
        _id: conv._id,
        otherUser: otherParticipant,
        product: conv.product,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: conv.getUnreadCount(req.user.id),
        createdAt: conv.createdAt
      };
    });

    res.json(formattedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/messages/conversation/:conversationId
// @desc    Get all messages in a conversation
// @access  Private
router.get('/conversation/:conversationId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    // Check if user is a participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Get messages
    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'email sellerDetails')
      .populate('receiver', 'email sellerDetails')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversation._id,
        receiver: req.user.id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Reset unread count for this user
    conversation.resetUnread(req.user.id);
    await conversation.save();

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/messages/send
// @desc    Send a message
// @access  Private
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, productId, message } = req.body;

    // Validation
    if (!receiverId || !message) {
      return res.status(400).json({ msg: 'Receiver and message are required' });
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({ msg: 'Cannot send message to yourself' });
    }

    // Verify product exists if provided
    let product = null;
    if (productId) {
      product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ msg: 'Product not found' });
      }
    }

    // Find or create conversation (one conversation per pair of users)
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, receiverId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user.id, receiverId],
        product: productId || null
      });
      await conversation.save();
    } else if (productId && !conversation.product) {
      // Update conversation with product if it didn't have one
      conversation.product = productId;
      await conversation.save();
    }

    // Create message
    const newMessage = new Message({
      conversation: conversation._id,
      sender: req.user.id,
      receiver: receiverId,
      message: message.trim()
    });

    await newMessage.save();

    // Update conversation
    conversation.lastMessage = newMessage._id;
    conversation.lastMessageAt = new Date();
    conversation.incrementUnread(receiverId);
    await conversation.save();

    // Populate sender info for response
    await newMessage.populate('sender', 'email sellerDetails');
    await newMessage.populate('receiver', 'email sellerDetails');

    // Emit socket event for real-time update (if socket.io is set up)
    if (req.app.get('io')) {
      req.app.get('io').to(receiverId).emit('new_message', {
        message: newMessage,
        conversationId: conversation._id
      });
    }

    // Send email notification if receiver is offline
    const connectedUsers = req.app.get('connectedUsers');
    const isReceiverOnline = connectedUsers && connectedUsers.has(receiverId);

    if (!isReceiverOnline) {
      // Get receiver user object
      const receiver = await User.findById(receiverId).select('email sellerDetails');
      const sender = await User.findById(req.user.id).select('email sellerDetails');

      if (receiver && sender) {
        // Send email notification asynchronously (don't wait for it)
        sendMessageNotificationEmail(receiver, sender, message.trim()).catch(err => {
          console.error('Failed to send message notification email:', err);
        });
      }
    }

    res.json({
      message: newMessage,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/messages/unread-count
// @desc    Get total unread message count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      totalUnread += conv.getUnreadCount(req.user.id);
    });

    res.json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/messages/mark-read/:conversationId
// @desc    Mark all messages in a conversation as read
// @access  Private
router.post('/mark-read/:conversationId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    await Message.updateMany(
      {
        conversation: conversation._id,
        receiver: req.user.id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    conversation.resetUnread(req.user.id);
    await conversation.save();

    res.json({ msg: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/messages/templates
// @desc    Get pre-set message templates for sellers
// @access  Private (Seller only)
router.get('/templates', auth, async (req, res) => {
  try {
    const templates = [
      {
        id: 1,
        title: 'Greeting',
        message: 'Hello! Thank you for your interest in our product. How can I help you today?'
      },
      {
        id: 2,
        title: 'Availability',
        message: 'Yes, this item is currently in stock and ready to ship.'
      },
      {
        id: 3,
        title: 'Shipping',
        message: 'We offer fast shipping across Zimbabwe. Delivery typically takes 2-3 business days within Harare and 3-5 days for other regions.'
      },
      {
        id: 4,
        title: 'Payment',
        message: 'We accept Paynow, EcoCash, and cash on delivery for your convenience.'
      },
      {
        id: 5,
        title: 'Discount',
        message: 'Thank you for your interest! I can offer you a special discount if you purchase multiple items.'
      },
      {
        id: 6,
        title: 'Product Details',
        message: 'Let me provide you with more details about this product. What specific information would you like to know?'
      },
      {
        id: 7,
        title: 'Returns',
        message: 'We have a 7-day return policy. If you\'re not satisfied with the product, you can return it for a full refund or exchange.'
      },
      {
        id: 8,
        title: 'Thank You',
        message: 'Thank you for your purchase! Your order will be processed shortly. Feel free to contact me if you have any questions.'
      }
    ];

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ========== BLOCK/UNBLOCK USERS ==========

// @route   POST /api/messages/block/:userId
// @desc    Block a user
// @access  Private
router.post('/block/:userId', auth, async (req, res) => {
  try {
    const userIdToBlock = req.params.userId;

    if (userIdToBlock === req.user.id) {
      return res.status(400).json({ msg: 'Cannot block yourself' });
    }

    const user = await User.findById(req.user.id);
    if (!user.blockedUsers.includes(userIdToBlock)) {
      user.blockedUsers.push(userIdToBlock);
      await user.save();
    }

    res.json({ msg: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/messages/unblock/:userId
// @desc    Unblock a user
// @access  Private
router.post('/unblock/:userId', auth, async (req, res) => {
  try {
    const userIdToUnblock = req.params.userId;

    const user = await User.findById(req.user.id);
    user.blockedUsers = user.blockedUsers.filter(
      id => id.toString() !== userIdToUnblock
    );
    await user.save();

    res.json({ msg: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/messages/blocked-users
// @desc    Get list of blocked users
// @access  Private
router.get('/blocked-users', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('blockedUsers', 'email sellerDetails');
    res.json(user.blockedUsers || []);
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/messages/is-blocked/:userId
// @desc    Check if a user is blocked
// @access  Private
router.get('/is-blocked/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const isBlocked = user.blockedUsers.includes(req.params.userId);
    res.json({ isBlocked });
  } catch (error) {
    console.error('Error checking block status:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ========== REPORT USERS ==========

// @route   POST /api/messages/report
// @desc    Report a user
// @access  Private
router.post('/report', auth, async (req, res) => {
  try {
    const { reportedUserId, reason, description, messageId, conversationId } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ msg: 'Please provide user ID and reason' });
    }

    if (reportedUserId === req.user.id) {
      return res.status(400).json({ msg: 'Cannot report yourself' });
    }

    const report = new Report({
      reporter: req.user.id,
      reportedUser: reportedUserId,
      reason,
      description,
      relatedMessage: messageId || null,
      relatedConversation: conversationId || null
    });

    await report.save();

    res.json({ msg: 'Report submitted successfully', reportId: report._id });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/messages/my-reports
// @desc    Get user's submitted reports
// @access  Private
router.get('/my-reports', auth, async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user.id })
      .populate('reportedUser', 'email sellerDetails')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ========== MESSAGE SEARCH ==========

// @route   GET /api/messages/search
// @desc    Search messages in all conversations
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { query, conversationId } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ msg: 'Search query must be at least 2 characters' });
    }

    const searchFilter = {
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ],
      message: { $regex: query, $options: 'i' }
    };

    if (conversationId) {
      searchFilter.conversation = conversationId;
    }

    const messages = await Message.find(searchFilter)
      .populate('sender', 'email sellerDetails')
      .populate('receiver', 'email sellerDetails')
      .populate('conversation')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(messages);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ========== IMAGE ATTACHMENTS ==========

// Configure multer for message image uploads
const messageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = getStoragePath('messages');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const messageImageUpload = multer({
  storage: messageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
}).array('images', 5); // Max 5 images per message

// @route   POST /api/messages/send-with-images
// @desc    Send a message with image attachments
// @access  Private
router.post('/send-with-images', auth, (req, res) => {
  messageImageUpload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ msg: 'File too large. Maximum size is 5MB per image' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ msg: 'Too many files. Maximum is 5 images' });
      }
      return res.status(400).json({ msg: err.message });
    } else if (err) {
      return res.status(400).json({ msg: err.message });
    }

    try {
      const { receiverId, productId, message } = req.body;

      if (!receiverId) {
        return res.status(400).json({ msg: 'Receiver ID is required' });
      }

      if (!message && (!req.files || req.files.length === 0)) {
        return res.status(400).json({ msg: 'Message or images are required' });
      }

      // Find or create conversation (one conversation per pair of users)
      let conversation = await Conversation.findOne({
        participants: { $all: [req.user.id, receiverId] }
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [req.user.id, receiverId],
          product: productId || null
        });
        await conversation.save();
      } else if (productId && !conversation.product) {
        // Update conversation with product if it didn't have one
        conversation.product = productId;
        await conversation.save();
      }

      // Convert uploaded files to public URLs
      const attachments = req.files ? req.files.map(file => getPublicUrl(file.path)) : [];

      // Create message
      const newMessage = new Message({
        conversation: conversation._id,
        sender: req.user.id,
        receiver: receiverId,
        message: message || '',
        attachments
      });

      await newMessage.save();

      // Update conversation
      conversation.lastMessage = newMessage._id;
      conversation.lastMessageAt = new Date();
      conversation.incrementUnread(receiverId);
      await conversation.save();

      // Populate sender info for response
      await newMessage.populate('sender', 'email sellerDetails');
      await newMessage.populate('receiver', 'email sellerDetails');

      // Emit socket event for real-time update
      if (req.app.get('io')) {
        req.app.get('io').emit('new_message', {
          message: newMessage,
          conversationId: conversation._id
        });
      }

      // Send email notification if receiver is offline
      const connectedUsers = req.app.get('connectedUsers');
      const isReceiverOnline = connectedUsers && connectedUsers.has(receiverId);

      if (!isReceiverOnline) {
        // Get receiver user object
        const receiver = await User.findById(receiverId).select('email sellerDetails');
        const sender = await User.findById(req.user.id).select('email sellerDetails');

        if (receiver && sender) {
          // Create message preview
          const messagePreview = message ||
            (attachments.length > 0 ? `Sent ${attachments.length} image${attachments.length > 1 ? 's' : ''}` : 'sent you a message');

          // Send email notification asynchronously (don't wait for it)
          sendMessageNotificationEmail(receiver, sender, messagePreview).catch(err => {
            console.error('Failed to send message notification email:', err);
          });
        }
      }

      res.json({
        message: newMessage,
        conversationId: conversation._id
      });
    } catch (error) {
      console.error('Error sending message with images:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  });
});

module.exports = router;
