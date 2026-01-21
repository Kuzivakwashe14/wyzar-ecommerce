// In backend/routes/adminSellers.js
// Admin routes for seller management

const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const prisma = require('../config/prisma');
const { sendEmail } = require('../services/emailService');

// ==========================================
// SELLER MANAGEMENT
// ==========================================

// @route   GET /api/admin/sellers/pending
// @desc    Get all pending seller verifications
// @access  Private (Admin only)
router.get('/pending', adminAuth, async (req, res) => {
  try {
    const pendingSellers = await prisma.user.findMany({
      where: {
        isSeller: true,
        isVerified: false,
        isSuspended: false
      },
      select: {
        id: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        isSeller: true,
        isVerified: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        sellerDetails: {
          include: {
            verificationDocuments: true
          }
        }
      },
      orderBy: { createdAt: 'asc' } // Oldest first (FIFO)
    });

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

    const where = {
      isSeller: true,
      isVerified: true
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { sellerDetails: { businessName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const sellers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        isSeller: true,
        isVerified: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        sellerDetails: {
          include: {
            verificationDocuments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 1,
      skip: (page - 1) * limit
    });

    const count = await prisma.user.count({ where });

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
    const seller = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        isSeller: true,
        isVerified: true,
        role: true,
        isSuspended: true,
        suspensionReason: true,
        createdAt: true,
        updatedAt: true,
        sellerDetails: {
          include: {
            verificationDocuments: true
          }
        }
      }
    });

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
    const products = await prisma.product.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get seller revenue and orders from OrderItems
    const orderItemsStats = await prisma.orderItem.aggregate({
      where: {
        product: { sellerId: seller.id },
        order: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } }
      },
      _sum: {
        price: true
      },
      _count: {
        id: true
      }
    });

    const stats = {
      products: await prisma.product.count({ where: { sellerId: seller.id } }),
      revenue: orderItemsStats._sum.price || 0,
      orders: orderItemsStats._count.id || 0,
      commission: (orderItemsStats._sum.price || 0) * 0.10
    };

    // Get recent orders for this seller
    const recentOrders = await prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            product: { sellerId: seller.id }
          }
        }
      },
      include: {
        orderItems: {
          where: {
            product: { sellerId: seller.id }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Include verification documents information
    const verificationDocuments = seller.sellerDetails?.verificationDocuments || [];
    const documentSummary = {
      totalDocuments: verificationDocuments.length,
      approvedDocuments: verificationDocuments.filter(doc => doc.status === 'APPROVED').length,
      pendingDocuments: verificationDocuments.filter(doc => doc.status === 'PENDING').length,
      rejectedDocuments: verificationDocuments.filter(doc => doc.status === 'REJECTED').length,
      documents: verificationDocuments.map(doc => ({
        id: doc.id,
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
      recentOrders,
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

    const seller = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        sellerDetails: {
          include: {
            verificationDocuments: true
          }
        }
      }
    });

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
      const updatedSeller = await prisma.user.update({
        where: { id: seller.id },
        data: { isVerified: true },
        select: {
          id: true,
          email: true,
          phone: true,
          isPhoneVerified: true,
          isEmailVerified: true,
          isSeller: true,
          isVerified: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          sellerDetails: true
        }
      });

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
        seller: updatedSeller
      });
    } else {
      // Reject seller
      await prisma.user.update({
        where: { id: seller.id },
        data: {
          isSeller: false,
          isVerified: false
        }
      });

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
    console.log(`[AdminSellers] Suspending seller ${req.params.id}: suspend=${suspend}, reason=${reason}`);

    // Prevent admin from suspending themselves
    if (suspend && req.user.id === req.params.id) {
        return res.status(400).json({
            success: false,
            msg: 'You cannot suspend your own account.'
        });
    }

    const seller = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { sellerDetails: true }
    });

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

    const updatedSeller = await prisma.user.update({
      where: { id: seller.id },
      data: {
        isSuspended: suspend,
        suspensionReason: suspend && reason ? reason : (!suspend ? '' : undefined) // undefined means do not update if logic is clearer, but here explicitly ' ' or null
      },
      select: {
          id: true,
          email: true,
          phone: true,
          isSeller: true,
          isVerified: true,
          role: true,
          isSuspended: true,
          suspensionReason: true,
          sellerDetails: true
      }
    });

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
      seller: updatedSeller
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

// @route   DELETE /api/admin/sellers/:id
// @desc    Delete a seller (only if they have no active orders)
// @access  Private (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const seller = await prisma.user.findUnique({
      where: { id: req.params.id }
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        msg: 'Seller not found'
      });
    }

    // Check if seller has products designated in OrderItems
    // effectively checking if they have ever made a sale (or part of an order)
    const hasOrders = await prisma.orderItem.findFirst({
      where: {
        product: {
          sellerId: seller.id
        }
      }
    });

    if (hasOrders) {
      return res.status(400).json({
        success: false,
        msg: 'Cannot delete seller with existing associated orders. Please suspend the account instead to preserve order history.'
      });
    }

    // Revert logic: Delete seller data but keep user account
    // Use transaction to ensure data consistency
    await prisma.$transaction([
      // 1. Delete all products by this seller
      prisma.product.deleteMany({
        where: { sellerId: seller.id }
      }),
      // 2. Delete seller details
      prisma.sellerDetails.delete({
        where: { userId: seller.id }
      }),
      // 3. Update user to remove seller status and reset role
      prisma.user.update({
        where: { id: seller.id },
        data: {
          isSeller: false,
          isVerified: false,
          role: 'USER', // Revert to normal user
          isSuspended: false,
          suspensionReason: null
        }
      })
    ]);

    res.json({
      success: true,
      msg: 'Seller deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting seller:', error);
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
    const seller = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        sellerDetails: {
          include: {
            verificationDocuments: true
          }
        }
      }
    });

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
      sellerId: seller.id,
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
    const seller = await prisma.user.findUnique({
      where: { id: req.params.sellerId },
      include: {
        sellerDetails: {
          include: {
            verificationDocuments: true
          }
        }
      }
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        msg: 'Seller not found'
      });
    }

    const document = seller.sellerDetails?.verificationDocuments?.find(doc => doc.id === req.params.documentId);

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

    // 1. Find the document and include seller info
    const document = await prisma.verificationDocument.findUnique({
      where: { id: req.params.documentId },
      include: {
        sellerDetails: {
          include: {
            user: true,
            verificationDocuments: true
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        msg: 'Document not found'
      });
    }

    const sellerDetails = document.sellerDetails;
    const seller = sellerDetails.user;

    // 2. Update the document status
    const updatedDocument = await prisma.verificationDocument.update({
      where: { id: document.id },
      data: {
        status: status === 'approved' ? 'APPROVED' : 'REJECTED',
        rejectionReason: status === 'rejected' ? rejectionReason : null
      }
    });

    // 3. Check overall status
    // We get the UPDATED list of documents. Since we included verificationDocuments in step 1 (stale),
    // and updated one, we should re-check OR just update the array in memory.
    // Fetching fresh is safer.
    const allDocuments = await prisma.verificationDocument.findMany({
      where: { sellerDetailsId: sellerDetails.id }
    });

    const allApproved = allDocuments.every(doc => doc.status === 'APPROVED');
    const anyRejected = allDocuments.some(doc => doc.status === 'REJECTED');

    let newVerificationStatus = 'UNDER_REVIEW';
    let isVerified = false;

    if (allApproved && allDocuments.length > 0) {
      newVerificationStatus = 'APPROVED';
      isVerified = true;
    } else if (anyRejected) {
      newVerificationStatus = 'REJECTED';
    }

    // 4. Update Seller Details and User if status changed
    if (sellerDetails.verificationStatus !== newVerificationStatus || seller.isVerified !== isVerified) {
       await prisma.sellerDetails.update({
        where: { id: sellerDetails.id },
        data: {
          verificationStatus: newVerificationStatus,
          verifiedAt: newVerificationStatus === 'APPROVED' ? new Date() : null,
          verifiedById: newVerificationStatus === 'APPROVED' ? req.user.id : null,
          user: {
            update: {
              isVerified: isVerified
            }
          }
        }
      });
    }

    // 5. Send Emails
    if (newVerificationStatus === 'APPROVED' && sellerDetails.verificationStatus !== 'APPROVED') {
       // Send approval email logic
       try {
        await sendEmail({
          to: seller.email,
          subject: 'Seller Verification Approved - WyZar',
          html: `
            <h1>Congratulations! Your seller verification has been approved</h1>
            <p>Hello ${sellerDetails?.businessName || 'Seller'},</p>
            <p>All your verification documents have been approved!</p>
            <p>You can now start listing products on WyZar marketplace.</p>
            <p>Thank you for joining WyZar!</p>
            <p>Best regards,<br>WyZar Team</p>
          `
        });
      } catch (err) { console.error(err); }
    } else if (status === 'rejected') {
        // Send rejection email for specific document
         try {
        await sendEmail({
          to: seller.email,
          subject: 'Document Verification Update - WyZar',
          html: `
            <h1>Verification Document Requires Attention</h1>
            <p>Hello ${sellerDetails?.businessName || 'Seller'},</p>
            <p>One of your verification documents (${document.documentType}) has been rejected.</p>
            ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
            <p>Please upload a new document to continue with your verification.</p>
            <p>Best regards,<br>WyZar Team</p>
          `
        });
      } catch (err) { console.error(err); }
    }

    res.json({
      success: true,
      msg: `Document ${status} successfully`,
      document: updatedDocument,
      overallStatus: newVerificationStatus
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

    const seller = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { sellerDetails: true }
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        msg: 'Seller not found'
      });
    }

    await prisma.sellerDetails.update({
      where: { id: seller.sellerDetails.id },
      data: { verificationNotes: notes }
    });

    res.json({
      success: true,
      msg: 'Verification notes updated successfully',
      notes: notes
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
