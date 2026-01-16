// backend/routes/review.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const prisma = require('../config/prisma');

// ===== Zod Validation =====
const { validateBody, validateParams } = require('../middleware/zodValidate');
const { reviewSchema, objectIdParamSchema, productIdParamSchema } = require('../schemas');

// ===== Rate Limiting =====
const { reviewLimiter } = require('../config/security');

// ==========================================
// PUBLIC ROUTES
// ==========================================

// @route   GET /api/reviews/product/:productId
// @desc    Get all approved reviews for a product
// @access  Public
router.get('/product/:productId', validateParams(productIdParamSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let orderBy = { createdAt: 'desc' }; // Default: newest first
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'highest') orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'lowest') orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
    if (sort === 'helpful') orderBy = [{ helpful: 'desc' }, { createdAt: 'desc' }];

    const reviews = await prisma.review.findMany({
      where: {
        productId: req.params.productId,
        isApproved: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true
          }
        }
      },
      orderBy: Array.isArray(orderBy) ? orderBy : [orderBy],
      take: parseInt(limit),
      skip: skip
    });

    const total = await prisma.review.count({
      where: {
        productId: req.params.productId,
        isApproved: true
      }
    });

    // Calculate rating distribution
    const ratingGroups = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        productId: req.params.productId,
        isApproved: true
      },
      _count: {
        rating: true
      },
      orderBy: {
        rating: 'desc'
      }
    });

    const ratingDistribution = ratingGroups.map(g => ({
      _id: g.rating,
      count: g._count.rating
    }));

    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      where: {
        productId: req.params.productId,
        isApproved: true
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    });

    res.json({
      success: true,
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReviews: total,
        limit: parseInt(limit)
      },
      ratingStats: {
        average: avgRating._avg.rating || 0,
        count: avgRating._count.rating || 0,
        distribution: ratingDistribution
      }
    });
  } catch (err) {
    console.error('Get reviews error:', err.message);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
});

// ==========================================
// AUTHENTICATED ROUTES
// ==========================================

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', auth, reviewLimiter, validateBody(reviewSchema), async (req, res) => {
  try {
    const { productId, rating, title, comment, orderId } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        msg: 'Product not found'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: productId,
        userId: req.user.id
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        msg: 'You have already reviewed this product. You can update your existing review.'
      });
    }

    // Check if user has purchased this product (for verified purchase badge)
    let verifiedPurchase = false;
    
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: true
        }
      });
      
      if (order && order.userId === req.user.id) {
        const hasProduct = order.orderItems.some(
          item => item.productId === productId
        );
        verifiedPurchase = hasProduct;
      }
    } else {
      // Check if user has any order with this product
      // We need to look through user's orders that are paid/shipped/delivered
      const userOrders = await prisma.order.findMany({
        where: {
          userId: req.user.id,
          status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }
        },
        include: {
          orderItems: true
        }
      });
      
      for (const order of userOrders) {
        const hasProduct = order.orderItems.some(
          item => item.productId === productId
        );
        if (hasProduct) {
          verifiedPurchase = true;
          break;
        }
      }
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        userId: req.user.id,
        rating: parseInt(rating),
        title: title || '',
        comment,
        orderId: orderId || null,
        verifiedPurchase
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    // Update product rating
    await updateProductRating(productId);

    res.status(201).json({
      success: true,
      msg: 'Review submitted successfully',
      review
    });
  } catch (err) {
    console.error('Create review error:', err.message);
    if (err.code === 'P2002') { // Prisma unique constraint error
      return res.status(400).json({
        success: false,
        msg: 'You have already reviewed this product'
      });
    }
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private (Review owner only)
router.put('/:id', auth, validateParams(objectIdParamSchema), async (req, res) => {
  try {
    const { rating, title, comment } = req.body;

    const review = await prisma.review.findUnique({
      where: { id: req.params.id }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        msg: 'Review not found'
      });
    }

    // Check if user owns this review
    if (review.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'Not authorized to update this review'
      });
    }

    // Build update data
    const updateData = {
      isEdited: true,
      editedAt: new Date()
    };
    
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          msg: 'Rating must be between 1 and 5'
        });
      }
      updateData.rating = parseInt(rating);
    }
    if (title !== undefined) updateData.title = title;
    if (comment !== undefined) updateData.comment = comment;

    const updatedReview = await prisma.review.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    // Update product rating if rating changed
    if (rating !== undefined) {
      await updateProductRating(review.productId);
    }

    res.json({
      success: true,
      msg: 'Review updated successfully',
      review: updatedReview
    });
  } catch (err) {
    console.error('Update review error:', err.message);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private (Review owner only)
router.delete('/:id', auth, validateParams(objectIdParamSchema), async (req, res) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id }
    });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        msg: 'Review not found'
      });
    }

    // Check if user owns this review
    if (review.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'Not authorized to delete this review'
      });
    }

    const productId = review.productId;
    
    await prisma.review.delete({
      where: { id: req.params.id }
    });

    // Update product rating
    await updateProductRating(productId);

    res.json({
      success: true,
      msg: 'Review deleted successfully'
    });
  } catch (err) {
    console.error('Delete review error:', err.message);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
});

// @route   GET /api/reviews/user/me
// @desc    Get current user's reviews
// @access  Private
router.get('/user/me', auth, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      reviews
    });
  } catch (err) {
    console.error('Get user reviews error:', err.message);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark a review as helpful
// @access  Private
router.post('/:id/helpful', auth, validateParams(objectIdParamSchema), async (req, res) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        helpful: { increment: 1 }
      }
    });

    res.json({
      success: true,
      msg: 'Review marked as helpful',
      helpful: review.helpful
    });
  } catch (err) {
    console.error('Mark helpful error:', err.message);
    if (err.code === 'P2025') {
       return res.status(404).json({
        success: false,
        msg: 'Review not found'
      });
    }
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// @route   GET /api/reviews/admin/all
// @desc    Get all reviews (for admin)
// @access  Private (Admin only)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', productId = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status === 'approved') where.isApproved = true;
    if (status === 'pending') where.isApproved = false;
    if (productId) where.productId = productId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: skip
    });

    const total = await prisma.review.count({ where });

    res.json({
      success: true,
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReviews: total,
        totalReviews: total
      }
    });
  } catch (err) {
    console.error('Get all reviews error:', err.message);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
});

// @route   PUT /api/reviews/admin/:id/approve
// @desc    Approve or reject a review
// @access  Private (Admin only)
router.put('/admin/:id/approve', adminAuth, validateParams(objectIdParamSchema), async (req, res) => {
  try {
    const { approve } = req.body;
    
    // Check if review exists first
    const existingReview = await prisma.review.findUnique({
      where: { id: req.params.id }
    });
    
    if (!existingReview) {
      return res.status(404).json({
        success: false,
        msg: 'Review not found'
      });
    }

    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { isApproved: approve === true },
      include: {
        user: { select: { id: true, email: true } },
        product: { select: { id: true, name: true } }
      }
    });

    // Update product rating if approved
    if (review.isApproved) {
      await updateProductRating(review.productId);
    }

    res.json({
      success: true,
      msg: `Review ${review.isApproved ? 'approved' : 'rejected'} successfully`,
      review
    });
  } catch (err) {
    console.error('Approve review error:', err.message);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
});

// @route   DELETE /api/reviews/admin/:id
// @desc    Delete a review (admin)
// @access  Private (Admin only)
router.delete('/admin/:id', adminAuth, validateParams(objectIdParamSchema), async (req, res) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id }
    });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        msg: 'Review not found'
      });
    }

    const productId = review.productId;
    
    await prisma.review.delete({
      where: { id: req.params.id }
    });

    // Update product rating
    await updateProductRating(productId);

    res.json({
      success: true,
      msg: 'Review deleted successfully'
    });
  } catch (err) {
    console.error('Admin delete review error:', err.message);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Function to update product rating based on reviews
async function updateProductRating(productId) {
  try {
    const stats = await prisma.review.aggregate({
      where: {
        productId: productId,
        isApproved: true
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    });

    const average = stats._avg.rating || 0;
    const count = stats._count.rating || 0;

    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingAverage: Math.round(average * 10) / 10,
        ratingCount: count
      }
    });
  } catch (err) {
    console.error('Error updating product rating:', err.message);
  }
}

module.exports = router;

