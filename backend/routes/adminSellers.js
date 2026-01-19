// In backend/routes/adminSellers.js
// Admin routes for seller management

const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { sendEmail } = require('../services/emailService');

// ==========================================
// SELLER MANAGEMENT
// ==========================================

// @route   GET /api/admin/sellers/pending
// @desc    Get all pending seller verifications
// @access  Private (Admin only)
router.get('/pending', adminAuth, async (req, res) => {
  try {
    const pendingSellers = await User.find({
      isSeller: true,
      isVerified: false,
      isSuspended: false
    })
      .select('-password')
      .sort({ createdAt: 1 }); // Oldest first (FIFO)

    res.json({
      success: true,
      count: pendingSellers.length,
      sellers: pendingSellers
    });
  } catch (error) {
    console.error('Error fetching pending sellers:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/sellers/verified
// @desc    Get all verified sellers
// @access  Private (Admin only)
router.get('/verified', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    const query = {
      isSeller: true,
      isVerified: true
    };

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'sellerDetails.businessName': { $regex: search, $options: 'i' } }
      ];
    }

    const sellers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      sellers,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalSellers: count
    });
  } catch (error) {
    console.error('Error fetching verified sellers:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/sellers/:id
// @desc    Get seller details with performance metrics
// @access  Private (Admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const seller = await User.findById(req.params.id).select('-password');

    if (!seller) {
      return res.status(404).json({
        success: false,
        msg: 'Seller not found'
      });
    }

    if (!seller.isSeller) {
      return res.status(400).json({
        success: false,
        msg: 'User is not a seller'
      });
    }

    // Get seller's products
    const products = await Product.find({ seller: seller._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get seller's orders and revenue
    const orders = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $match: {
          'productInfo.seller': seller._id
        }
      },
      {
        $group: {
          _id: '$_id',
          orderDate: { $first: '$createdAt' },
          status: { $first: '$status' },
          total: { $sum: '$orderItems.price' },
          items: { $sum: 1 }
        }
      },
      { $sort: { orderDate: -1 } },
      { $limit: 10 }
    ]);

    // Calculate total revenue
    const revenueData = await Order.aggregate([
      {
        $match: {
          status: { $in: ['Paid', 'Shipped', 'Delivered'] }
        }
      },
      { $unwind: '$orderItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $match: {
          'productInfo.seller': seller._id
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $multiply: ['$orderItems.quantity', '$orderItems.price']
            }
          },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      products: await Product.countDocuments({ seller: seller._id }),
      revenue: revenueData[0]?.totalRevenue || 0,
      orders: revenueData[0]?.totalOrders || 0,
      commission: (revenueData[0]?.totalRevenue || 0) * 0.10
    };

    // Include verification documents information
    const verificationDocuments = seller.sellerDetails?.verificationDocuments || [];
    const documentSummary = {
      totalDocuments: verificationDocuments.length,
      approvedDocuments: verificationDocuments.filter(doc => doc.status === 'approved').length,
      pendingDocuments: verificationDocuments.filter(doc => doc.status === 'pending').length,
      rejectedDocuments: verificationDocuments.filter(doc => doc.status === 'rejected').length,
      documents: verificationDocuments.map(doc => ({
        _id: doc._id,
        documentType: doc.documentType,
        documentName: doc.documentName,
        uploadedAt: doc.uploadedAt,
        status: doc.status,
        rejectionReason: doc.rejectionReason
      }))
    };

    res.json({
      success: true,
      seller,
      products,
      recentOrders: orders,
      stats,
      verificationDocuments: documentSummary
    });
  } catch (error) {
    console.error('Error fetching seller details:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/sellers/:id/verify
// @desc    Approve or reject seller verification
// @access  Private (Admin only)
router.put('/:id/verify', adminAuth, async (req, res) => {
  try {
    const { approve, reason } = req.body; // approve: true/false, reason: string for rejection

    const seller = await User.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        msg: 'Seller not found'
      });
    }

    if (!seller.isSeller) {
      return res.status(400).json({
        success: false,
        msg: 'User is not a seller'
      });
    }

    if (seller.isVerified) {
      return res.status(400).json({
        success: false,
        msg: 'Seller is already verified'
      });
    }

    if (approve) {
      // Approve seller
      seller.isVerified = true;
      await seller.save();

      // Send approval email
      try {
        await sendEmail({
          to: seller.email,
          subject: 'Seller Application Approved - WyZar',
          html: `
            <h1>Congratulations! Your seller application has been approved</h1>
            <p>Hello ${seller.sellerDetails?.businessName || 'Seller'},</p>
            <p>We're excited to let you know that your seller application has been approved!</p>
            <p>You can now start listing products on WyZar marketplace.</p>
            <p>Thank you for joining WyZar!</p>
            <p>Best regards,<br>WyZar Team</p>
          `
        });
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
        // Don't fail the approval if email fails
      }

      res.json({
        success: true,
        msg: 'Seller approved successfully',
        seller: await User.findById(seller._id).select('-password')
      });
    } else {
      // Reject seller
      seller.isSeller = false;
      seller.isVerified = false;
      await seller.save();

      // Send rejection email
      try {
        await sendEmail({
          to: seller.email,
          subject: 'Seller Application Status - WyZar',
          html: `
            <h1>Update on Your Seller Application</h1>
            <p>Hello ${seller.sellerDetails?.businessName || 'Applicant'},</p>
            <p>Thank you for your interest in becoming a seller on WyZar.</p>
            <p>Unfortunately, we are unable to approve your application at this time.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>If you have any questions or would like to reapply, please contact our support team.</p>
            <p>Best regards,<br>WyZar Team</p>
          `
        });
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
      }

      res.json({
        success: true,
        msg: 'Seller application rejected',
        reason: reason || 'Not specified'
      });
    }
  } catch (error) {
    console.error('Error verifying seller:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/sellers/:id/suspend
// @desc    Suspend or unsuspend a seller
// @access  Private (Admin only)
router.put('/:id/suspend', adminAuth, async (req, res) => {
  try {
    const { suspend, reason } = req.body;

    const seller = await User.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        msg: 'Seller not found'
      });
    }

    if (!seller.isSeller) {
      return res.status(400).json({
        success: false,
        msg: 'User is not a seller'
      });
    }

    seller.isSuspended = suspend;
    if (suspend && reason) {
      seller.suspensionReason = reason;
    } else if (!suspend) {
      seller.suspensionReason = '';
    }

    await seller.save();

    // Send notification email
    try {
      await sendEmail({
        to: seller.email,
        subject: suspend ? 'Account Suspended - WyZar' : 'Account Reactivated - WyZar',
        html: suspend
          ? `
            <h1>Account Suspended</h1>
            <p>Hello ${seller.sellerDetails?.businessName || 'Seller'},</p>
            <p>Your seller account has been suspended.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>If you believe this is a mistake, please contact our support team.</p>
            <p>Best regards,<br>WyZar Team</p>
          `
          : `
            <h1>Account Reactivated</h1>
            <p>Hello ${seller.sellerDetails?.businessName || 'Seller'},</p>
            <p>Good news! Your seller account has been reactivated.</p>
            <p>You can now continue selling on WyZar marketplace.</p>
            <p>Best regards,<br>WyZar Team</p>
          `
      });
    } catch (emailError) {
      console.error('Error sending suspension email:', emailError);
    }

    res.json({
      success: true,
      msg: suspend ? 'Seller suspended successfully' : 'Seller unsuspended successfully',
      seller: await User.findById(seller._id).select('-password')
    });
  } catch (error) {
    console.error('Error suspending seller:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// ==========================================
// VERIFICATION DOCUMENT MANAGEMENT
// ==========================================

// @route   GET /api/admin/sellers/:id/documents
// @desc    Get all verification documents for a seller
// @access  Private (Admin only)
router.get('/:id/documents', adminAuth, async (req, res) => {
  try {
    const seller = await User.findById(req.params.id).select('email sellerDetails');

    if (!seller) {
      return res.status(404).json({
        success: false,
        msg: 'Seller not found'
      });
    }

    if (!seller.isSeller) {
      return res.status(400).json({
        success: false,
        msg: 'User is not a seller'
      });
    }

    const documents = seller.sellerDetails?.verificationDocuments || [];

    res.json({
      success: true,
      sellerId: seller._id,
      sellerEmail: seller.email,
      businessName: seller.sellerDetails?.businessName,
      verificationStatus: seller.sellerDetails?.verificationStatus,
      documents,
      totalDocuments: documents.length
    });
  } catch (error) {
    console.error('Error fetching verification documents:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/sellers/:sellerId/documents/:documentId/view
// @desc    View/download a specific verification document
// @access  Private (Admin only)
router.get('/:sellerId/documents/:documentId/view', adminAuth, async (req, res) => {
  try {
    const seller = await User.findById(req.params.sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        msg: 'Seller not found'
      });
    }

    const document = seller.sellerDetails?.verificationDocuments?.id(req.params.documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        msg: 'Document not found'
      });
    }

    const path = require('path');
    const fs = require('fs');

    // Resolve to absolute path
    const filePath = path.resolve(document.documentPath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        msg: 'Document file not found on server'
      });
    }

    // Send file for viewing/downloading (no root option for absolute paths)
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            msg: 'Error retrieving document'
          });
        }
      }
    });
  } catch (error) {
    console.error('Error viewing document:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/sellers/:sellerId/documents/:documentId/status
// @desc    Approve or reject a specific verification document
// @access  Private (Admin only)
router.put('/:sellerId/documents/:documentId/status', adminAuth, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid status. Must be "approved" or "rejected"'
      });
    }

    const seller = await User.findById(req.params.sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        msg: 'Seller not found'
      });
    }

    const document = seller.sellerDetails?.verificationDocuments?.id(req.params.documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        msg: 'Document not found'
      });
    }

    // Update document status
    document.status = status;
    if (status === 'rejected' && rejectionReason) {
      document.rejectionReason = rejectionReason;
    }

    // Check if all documents are approved
    const allDocuments = seller.sellerDetails.verificationDocuments;
    const allApproved = allDocuments.every(doc => doc.status === 'approved');
    const anyRejected = allDocuments.some(doc => doc.status === 'rejected');

    // Update overall verification status
    if (allApproved && allDocuments.length > 0) {
      seller.sellerDetails.verificationStatus = 'approved';
      seller.isVerified = true;
      seller.sellerDetails.verifiedAt = new Date();
      seller.sellerDetails.verifiedBy = req.user.id;
    } else if (anyRejected) {
      seller.sellerDetails.verificationStatus = 'rejected';
      seller.isVerified = false;
    } else {
      seller.sellerDetails.verificationStatus = 'under_review';
    }

    await seller.save();

    // Send email notification if verification status changed
    if (allApproved) {
      try {
        await sendEmail({
          to: seller.email,
          subject: 'Seller Verification Approved - WyZar',
          html: `
            <h1>Congratulations! Your seller verification has been approved</h1>
            <p>Hello ${seller.sellerDetails?.businessName || 'Seller'},</p>
            <p>All your verification documents have been approved!</p>
            <p>You can now start listing products on WyZar marketplace.</p>
            <p>Thank you for joining WyZar!</p>
            <p>Best regards,<br>WyZar Team</p>
          `
        });
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
      }
    } else if (status === 'rejected') {
      try {
        await sendEmail({
          to: seller.email,
          subject: 'Document Verification Update - WyZar',
          html: `
            <h1>Verification Document Requires Attention</h1>
            <p>Hello ${seller.sellerDetails?.businessName || 'Seller'},</p>
            <p>One of your verification documents (${document.documentType}) has been rejected.</p>
            ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
            <p>Please upload a new document to continue with your verification.</p>
            <p>Best regards,<br>WyZar Team</p>
          `
        });
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
      }
    }

    res.json({
      success: true,
      msg: `Document ${status} successfully`,
      document,
      overallStatus: seller.sellerDetails.verificationStatus
    });
  } catch (error) {
    console.error('Error updating document status:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/sellers/:id/verification-notes
// @desc    Add verification notes for a seller
// @access  Private (Admin only)
router.put('/:id/verification-notes', adminAuth, async (req, res) => {
  try {
    const { notes } = req.body;

    const seller = await User.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        msg: 'Seller not found'
      });
    }

    seller.sellerDetails.verificationNotes = notes;
    await seller.save();

    res.json({
      success: true,
      msg: 'Verification notes updated successfully',
      notes: seller.sellerDetails.verificationNotes
    });
  } catch (error) {
    console.error('Error updating verification notes:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
