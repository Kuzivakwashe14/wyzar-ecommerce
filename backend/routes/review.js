// backend/routes/review.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const prisma = require('../config/prisma');

// ===== Input Validation =====
const { validateReviewCreation, validateObjectIdParam } = require('../middleware/validateInput');

// ==========================================
// PUBLIC ROUTES
// ==========================================

// @route   GET /api/reviews/product/:productId
// @desc    Get all approved reviews for a product
// @access  Public
router.get('/product/:productId', validateObjectIdParam('productId'), async (req, res) => {
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
            email: true
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
router.post('/', auth, validateReviewCreation, async (req, res) => {
  try {
    const { productId, rating, title, comment, orderId } = req.body;

    // Validation
    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        msg: 'Product ID, rating, and comment are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        msg: 'Rating must be between 1 and 5'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        msg: 'Product not found'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user.id
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
      const order = await Order.findById(orderId);
      if (order && order.user.toString() === req.user.id) {
        const hasProduct = order.orderItems.some(
          item => item.product.toString() === productId
        );
        verifiedPurchase = hasProduct;
      }
    } else {
      // Check if user has any order with this product
      const userOrders = await Order.find({
        user: req.user.id,
        status: { $in: ['Paid', 'Shipped', 'Delivered'] }
      });
      
      for (const order of userOrders) {
        const hasProduct = order.orderItems.some(
          item => item.product.toString() === productId
        );
        if (hasProduct) {
          verifiedPurchase = true;
          break;
        }
      }
    }

    // Create review
    const review = new Review({
      product: productId,
      user: req.user.id,
      rating: parseInt(rating),
      title: title || '',
      comment,
      order: orderId || null,
      verifiedPurchase
    });

    await review.save();

    // Update product rating
    await updateProductRating(productId);

    // Populate user info for response
    await review.populate('user', 'email');

    res.status(201).json({
      success: true,
      msg: 'Review submitted successfully',
      review
    });
  } catch (err) {
    console.error('Create review error:', err.message);
    if (err.code === 11000) {
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
router.put('/:id', auth, validateObjectIdParam('id'), async (req, res) => {
  try {
    const { rating, title, comment } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        msg: 'Review not found'
      });
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'Not authorized to update this review'
      });
    }

    // Update fields
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          msg: 'Rating must be between 1 and 5'
        });
      }
      review.rating = parseInt(rating);
    }
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    review.isEdited = true;
    review.editedAt = new Date();

    await review.save();

    // Update product rating
    await updateProductRating(review.product);

    await review.populate('user', 'email');

    res.json({
      success: true,
      msg: 'Review updated successfully',
      review
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
router.delete('/:id', auth, validateObjectIdParam('id'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        msg: 'Review not found'
      });
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'Not authorized to delete this review'
      });
    }

    const productId = review.product;
    await review.deleteOne();

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
    const reviews = await Review.find({ user: req.user.id })
      .populate('product', '_id name images price')
      .sort({ createdAt: -1 });

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
router.post('/:id/helpful', auth, validateObjectIdParam('id'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        msg: 'Review not found'
      });
    }

    // Increment helpful count
    review.helpful += 1;
    await review.save();

    res.json({
      success: true,
      msg: 'Review marked as helpful',
      helpful: review.helpful
    });
  } catch (err) {
    console.error('Mark helpful error:', err.message);
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

    const query = {};
    if (status === 'approved') query.isApproved = true;
    if (status === 'pending') query.isApproved = false;
    if (productId) query.product = productId;

    const reviews = await Review.find(query)
      .populate('product', 'name')
      .populate('user', 'email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
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
router.put('/admin/:id/approve', adminAuth, validateObjectIdParam('id'), async (req, res) => {
  try {
    const { approve } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        msg: 'Review not found'
      });
    }

    review.isApproved = approve === true;
    await review.save();

    // Update product rating if approved
    if (review.isApproved) {
      await updateProductRating(review.product);
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
router.delete('/admin/:id', adminAuth, validateObjectIdParam('id'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        msg: 'Review not found'
      });
    }

    const productId = review.product;
    await review.deleteOne();

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
    const stats = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          isApproved: true
        }
      },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        'rating.average': Math.round(stats[0].average * 10) / 10, // Round to 1 decimal
        'rating.count': stats[0].count
      });
    } else {
      // No reviews, reset to 0
      await Product.findByIdAndUpdate(productId, {
        'rating.average': 0,
        'rating.count': 0
      });
    }
  } catch (err) {
    console.error('Error updating product rating:', err.message);
  }
}

module.exports = router;

