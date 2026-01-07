// In backend/routes/adminProducts.js
// Admin routes for product management

const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const prisma = require('../config/prisma');

// ==========================================
// PRODUCT MANAGEMENT
// ==========================================

// @route   GET /api/admin/products
// @desc    Get all products with filters and pagination
// @access  Private (Admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      featured = '',
      condition = '',
      minPrice = '',
      maxPrice = ''
    } = req.query;

    // Build where clause
    const where = {};

    // Search by name, description, or brand
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by featured status
    if (featured !== '') {
      where.featured = featured === 'true';
    }

    // Filter by condition
    if (condition) {
      where.condition = condition.toUpperCase();
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Execute query with pagination
    const products = await prisma.product.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            isVerified: true,
            sellerDetails: {
              select: {
                businessName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    // Get total count for pagination
    const count = await prisma.product.count({ where });

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalProducts: count
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/products/:id
// @desc    Get single product details
// @access  Private (Admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            phone: true,
            isVerified: true,
            isSuspended: true,
            sellerDetails: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        msg: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/products/:id/feature
// @desc    Feature or unfeature a product
// @access  Private (Admin only)
router.put('/:id/feature', adminAuth, async (req, res) => {
  try {
    const { featured } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        msg: 'Product not found'
      });
    }

    product.featured = featured;
    await product.save();

    res.json({
      success: true,
      msg: featured ? 'Product featured successfully' : 'Product unfeatured successfully',
      product: await Product.findById(product._id).populate('seller', 'email sellerDetails.businessName')
    });
  } catch (error) {
    console.error('Error featuring product:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/products/:id
// @desc    Update product details
// @access  Private (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const updates = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        msg: 'Product not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'price', 'quantity', 'category', 'featured', 'condition', 'brand'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        product[key] = updates[key];
      }
    });

    await product.save();

    res.json({
      success: true,
      msg: 'Product updated successfully',
      product: await Product.findById(product._id).populate('seller', 'email sellerDetails.businessName')
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Delete a product
// @access  Private (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        msg: 'Product not found'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      msg: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/products/stats/categories
// @desc    Get product counts by category
// @access  Private (Admin only)
router.get('/stats/categories', adminAuth, async (req, res) => {
  try {
    const categories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
