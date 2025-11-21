// backend/routes/search.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

/**
 * @route   GET /api/search
 * @desc    Search products with filters
 * @access  Public
 * @query   q (search query), category, minPrice, maxPrice, location, condition, sort, page, limit
 */
router.get('/', async (req, res) => {
  try {
    const {
      q,              // Search query
      category,       // Category filter
      minPrice,       // Minimum price
      maxPrice,       // Maximum price
      location,       // City/location filter
      condition,      // Product condition (new, used, refurbished)
      brand,          // Brand filter
      inStock,        // Only show in-stock items
      featured,       // Show featured items
      sort = '-createdAt', // Sort field (default: newest first)
      page = 1,       // Page number
      limit = 20      // Items per page
    } = req.query;

    // Build query object
    const query = {};

    // Text search
    if (q && q.trim()) {
      query.$text = { $search: q.trim() };
    }

    // Category filter
    if (category) {
      query.category = new RegExp(category, 'i'); // Case-insensitive
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Location filter
    if (location) {
      query['location.city'] = new RegExp(location, 'i');
    }

    // Condition filter
    if (condition) {
      query.condition = condition;
    }

    // Brand filter
    if (brand) {
      query.brand = new RegExp(brand, 'i');
    }

    // In stock filter
    if (inStock === 'true') {
      query.quantity = { $gt: 0 };
    }

    // Featured filter
    if (featured === 'true') {
      query.featured = true;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build sort object
    let sortObj = {};
    if (sort.startsWith('-')) {
      sortObj[sort.substring(1)] = -1; // Descending
    } else {
      sortObj[sort] = 1; // Ascending
    }

    // If text search is used, sort by text score
    if (query.$text) {
      sortObj = { score: { $meta: 'textScore' }, ...sortObj };
    }

    // Execute query with pagination
    const products = await Product.find(query)
      .select(query.$text ? { score: { $meta: 'textScore' } } : {})
      .populate('seller', 'email sellerDetails.businessName')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        searchQuery: q || null,
        category: category || null,
        priceRange: {
          min: minPrice || null,
          max: maxPrice || null
        },
        location: location || null,
        condition: condition || null,
        brand: brand || null,
        inStock: inStock === 'true',
        featured: featured === 'true'
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions/autocomplete
 * @access  Public
 * @query   q (search query)
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    // Search for matching products (limit to 10)
    const products = await Product.find({
      $or: [
        { name: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') },
        { brand: new RegExp(q, 'i') },
        { tags: new RegExp(q, 'i') }
      ]
    })
    .select('name category brand')
    .limit(10);

    // Extract unique suggestions
    const suggestions = [];
    const seen = new Set();

    products.forEach(product => {
      if (product.name && !seen.has(product.name.toLowerCase())) {
        suggestions.push({ type: 'product', text: product.name });
        seen.add(product.name.toLowerCase());
      }
      if (product.category && !seen.has(product.category.toLowerCase())) {
        suggestions.push({ type: 'category', text: product.category });
        seen.add(product.category.toLowerCase());
      }
      if (product.brand && !seen.has(product.brand.toLowerCase())) {
        suggestions.push({ type: 'brand', text: product.brand });
        seen.add(product.brand.toLowerCase());
      }
    });

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 10)
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting suggestions',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/search/filters
 * @desc    Get available filter options (categories, brands, price ranges, locations)
 * @access  Public
 */
router.get('/filters', async (req, res) => {
  try {
    // Get all unique categories
    const categories = await Product.distinct('category');

    // Get all unique brands
    const brands = await Product.distinct('brand').then(
      brands => brands.filter(b => b) // Remove null/undefined
    );

    // Get all unique locations
    const locations = await Product.distinct('location.city').then(
      locs => locs.filter(l => l) // Remove null/undefined
    );

    // Get price range
    const priceStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    // Get product counts by condition
    const conditionCounts = await Product.aggregate([
      {
        $group: {
          _id: '$condition',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      filters: {
        categories: categories.sort(),
        brands: brands.sort(),
        locations: locations.sort(),
        priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0, avgPrice: 0 },
        conditions: conditionCounts.map(c => ({
          value: c._id,
          count: c.count
        }))
      }
    });

  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting filter options',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/search/trending
 * @desc    Get trending/popular products (most viewed, recently added)
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get most viewed products
    const mostViewed = await Product.find({ quantity: { $gt: 0 } })
      .sort({ views: -1 })
      .limit(parseInt(limit))
      .populate('seller', 'sellerDetails.businessName');

    // Get recently added products
    const recentlyAdded = await Product.find({ quantity: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('seller', 'sellerDetails.businessName');

    // Get featured products
    const featured = await Product.find({ featured: true, quantity: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('seller', 'sellerDetails.businessName');

    res.json({
      success: true,
      trending: {
        mostViewed,
        recentlyAdded,
        featured
      }
    });

  } catch (error) {
    console.error('Trending products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting trending products',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/search/related/:productId
 * @desc    Get related products (same category/brand)
 * @access  Public
 */
router.get('/related/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 8 } = req.query;

    // Get the current product
    const currentProduct = await Product.findById(productId);
    
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find related products (same category or brand, excluding current product)
    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      $or: [
        { category: currentProduct.category },
        { brand: currentProduct.brand }
      ],
      quantity: { $gt: 0 }
    })
    .sort({ views: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .populate('seller', 'sellerDetails.businessName');

    res.json({
      success: true,
      related: relatedProducts
    });

  } catch (error) {
    console.error('Related products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting related products',
      error: error.message
    });
  }
});

module.exports = router;