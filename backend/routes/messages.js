// routes/messages.js
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
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
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: req.user.id
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                sellerDetails: {
                  select: {
                    businessName: true
                  }
                }
              }
            }
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true
          }
        },
        lastMessage: true
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    // Format conversations with unread count
    const formattedConversations = conversations.map(conv => {
      const currentUserParticipant = conv.participants.find(
        p => p.userId === req.user.id
      );
      const otherParticipant = conv.participants.find(
        p => p.userId !== req.user.id
      );

      return {
        id: conv.id,
        otherUser: otherParticipant?.user,
        product: conv.product,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: currentUserParticipant?.unreadCount || 0,
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
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.conversationId },
      include: {
        participants: true
      }
    });

    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(p => p.userId === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            sellerDetails: {
              select: { businessName: true }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            email: true,
            sellerDetails: {
              select: { businessName: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        receiverId: req.user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    // Reset unread count for this user
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: conversation.id,
        userId: req.user.id
      },
      data: {
        unreadCount: 0
      }
    });

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
      product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return res.status(404).json({ msg: 'Product not found' });
      }
    }

    // Find or create conversation (one conversation per pair of users)
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: req.user.id } } },
          { participants: { some: { userId: receiverId } } }
        ]
      },
      include: { participants: true }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          productId: productId || null,
          participants: {
            create: [
              { userId: req.user.id },
              { userId: receiverId }
            ]
          }
        },
        include: { participants: true }
      });
    } else if (productId && !conversation.productId) {
      // Update conversation with product if it didn't have one
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { productId },
        include: { participants: true }
      });
    }

    // Create message
    const newMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: req.user.id,
        receiverId,
        message: message.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            sellerDetails: { select: { businessName: true } }
          }
        },
        receiver: {
          select: {
            id: true,
            email: true,
            sellerDetails: { select: { businessName: true } }
          }
        }
      }
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageId: newMessage.id,
        lastMessageAt: new Date()
      }
    });

    // Increment unread count for receiver
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: conversation.id,
        userId: receiverId
      },
      data: {
        unreadCount: { increment: 1 }
      }
    });

    // Emit socket event for real-time update (if socket.io is set up)
    if (req.app.get('io')) {
      req.app.get('io').to(receiverId).emit('new_message', {
        message: newMessage,
        conversationId: conversation.id
      });
    }

    // Send email notification if receiver is offline
    const connectedUsers = req.app.get('connectedUsers');
    const isReceiverOnline = connectedUsers && connectedUsers.has(receiverId);

    if (!isReceiverOnline) {
      // Get receiver user object
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: {
          email: true,
          sellerDetails: { select: { businessName: true } }
        }
      });
      const sender = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          email: true,
          sellerDetails: { select: { businessName: true } }
        }
      });

      if (receiver && sender) {
        // Send email notification asynchronously (don't wait for it)
        sendMessageNotificationEmail(receiver, sender, message.trim()).catch(err => {
          console.error('Failed to send message notification email:', err);
        });
      }
    }

    res.json({
      message: newMessage,
      conversationId: conversation.id
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
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId: req.user.id },
      select: { unreadCount: true }
    });

    const totalUnread = participants.reduce((sum, p) => sum + p.unreadCount, 0);

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
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.conversationId },
      include: { participants: true }
    });

    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(p => p.userId === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        receiverId: req.user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: conversation.id,
        userId: req.user.id
      },
      data: { unreadCount: 0 }
    });

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

    // Check if already blocked
    const existing = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: req.user.id,
          blockedId: userIdToBlock
        }
      }
    });

    if (!existing) {
      await prisma.userBlock.create({
        data: {
          blockerId: req.user.id,
          blockedId: userIdToBlock
        }
      });
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

    await prisma.userBlock.deleteMany({
      where: {
        blockerId: req.user.id,
        blockedId: userIdToUnblock
      }
    });

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
    const blockedUsers = await prisma.userBlock.findMany({
      where: { blockerId: req.user.id },
      include: {
        blocked: {
          select: {
            id: true,
            email: true,
            sellerDetails: { select: { businessName: true } }
          }
        }
      }
    });
    res.json(blockedUsers.map(b => b.blocked));
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
    const block = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: req.user.id,
          blockedId: req.params.userId
        }
      }
    });
    res.json({ isBlocked: !!block });
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

    const report = await prisma.report.create({
      data: {
        reporterId: req.user.id,
        reportedUserId,
        reason: reason.toUpperCase().replace('-', '_'),
        description,
        relatedMessageId: messageId || null,
        relatedConversationId: conversationId || null
      }
    });

    res.json({ msg: 'Report submitted successfully', reportId: report.id });
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
    const reports = await prisma.report.findMany({
      where: { reporterId: req.user.id },
      include: {
        reportedUser: {
          select: {
            id: true,
            email: true,
            sellerDetails: { select: { businessName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

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
      AND: [
        {
          OR: [
            { senderId: req.user.id },
            { receiverId: req.user.id }
          ]
        },
        {
          message: { contains: query, mode: 'insensitive' }
        }
      ]
    };

    if (conversationId) {
      searchFilter.AND.push({ conversationId });
    }

    const messages = await prisma.message.findMany({
      where: searchFilter,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            sellerDetails: { select: { businessName: true } }
          }
        },
        receiver: {
          select: {
            id: true,
            email: true,
            sellerDetails: { select: { businessName: true } }
          }
        },
        conversation: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

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
      let conversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: req.user.id } } },
            { participants: { some: { userId: receiverId } } }
          ]
        },
        include: { participants: true }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            productId: productId || null,
            participants: {
              create: [
                { userId: req.user.id },
                { userId: receiverId }
              ]
            }
          },
          include: { participants: true }
        });
      } else if (productId && !conversation.productId) {
        // Update conversation with product if it didn't have one
        conversation = await prisma.conversation.update({
          where: { id: conversation.id },
          data: { productId },
          include: { participants: true }
        });
      }

      // Convert uploaded files to public URLs
      const attachments = req.files ? req.files.map(file => getPublicUrl(file.path)) : [];

      // Create message
      const newMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: req.user.id,
          receiverId,
          message: message || '',
          attachments
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              sellerDetails: { select: { businessName: true } }
            }
          },
          receiver: {
            select: {
              id: true,
              email: true,
              sellerDetails: { select: { businessName: true } }
            }
          }
        }
      });

      // Update conversation
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageId: newMessage.id,
          lastMessageAt: new Date()
        }
      });

      // Increment unread count for receiver
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId: conversation.id,
          userId: receiverId
        },
        data: {
          unreadCount: { increment: 1 }
        }
      });

      // Emit socket event for real-time update
      if (req.app.get('io')) {
        req.app.get('io').emit('new_message', {
          message: newMessage,
          conversationId: conversation.id
        });
      }

      // Send email notification if receiver is offline
      const connectedUsers = req.app.get('connectedUsers');
      const isReceiverOnline = connectedUsers && connectedUsers.has(receiverId);

      if (!isReceiverOnline) {
        // Get receiver user object
        const receiver = await prisma.user.findUnique({
          where: { id: receiverId },
          select: {
            email: true,
            sellerDetails: { select: { businessName: true } }
          }
        });
        const sender = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: {
            email: true,
            sellerDetails: { select: { businessName: true } }
          }
        });

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
        conversationId: conversation.id
      });
    } catch (error) {
      console.error('Error sending message with images:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  });
});

module.exports = router;
