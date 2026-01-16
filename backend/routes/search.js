// backend/routes/search.js
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

// ===== Rate Limiting =====
const { searchLimiter } = require('../config/security');

/**
 * @route   GET /api/search
 * @desc    Search products with filters
 * @access  Public
 * @query   q (search query), category, minPrice, maxPrice, location, condition, sort, page, limit
 */
router.get('/', searchLimiter, async (req, res) => {
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
    const where = {};

    // Text search - Prisma supports search on indexed fields
    if (q && q.trim()) {
      where.OR = [
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { description: { contains: q.trim(), mode: 'insensitive' } },
        { category: { contains: q.trim(), mode: 'insensitive' } },
        { brand: { contains: q.trim(), mode: 'insensitive' } }
      ];
    }

    // Category filter
    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Location filter
    if (location) {
      where.city = { contains: location, mode: 'insensitive' };
    }

    // Condition filter
    if (condition) {
      where.condition = condition.toUpperCase();
    }

    // Brand filter
    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }

    // In stock filter
    if (inStock === 'true') {
      where.quantity = { gt: 0 };
    }

    // Featured filter
    if (featured === 'true') {
      where.featured = true;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build sort object
    let orderBy = {};
    if (sort.startsWith('-')) {
      orderBy[sort.substring(1)] = 'desc';
    } else {
      orderBy[sort] = 'asc';
    }

    // Execute query with pagination
    const products = await prisma.product.findMany({
      where,
      include: {
        seller: {
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
      },
      orderBy,
      skip,
      take: limitNum
    });

    // Get total count for pagination
    const total = await prisma.product.count({ where });

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
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
          { tags: { has: q } }
        ]
      },
      select: {
        name: true,
        category: true,
        brand: true
      },
      take: 10
    });

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
    const categoryGroups = await prisma.product.groupBy({
      by: ['category'],
      _count: { category: true }
    });
    const categories = categoryGroups.map(g => g.category).filter(c => c);

    // Get all unique brands
    const brandGroups = await prisma.product.groupBy({
      by: ['brand'],
      _count: { brand: true }
    });
    const brands = brandGroups.map(g => g.brand).filter(b => b);

    // Get all unique locations
    const cityGroups = await prisma.product.groupBy({
      by: ['city'],
      _count: { city: true }
    });
    const locations = cityGroups.map(g => g.city).filter(l => l);

    // Get price range
    const priceStats = await prisma.product.aggregate({
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true }
    });

    // Get product counts by condition
    const conditionCounts = await prisma.product.groupBy({
      by: ['condition'],
      _count: { condition: true },
      orderBy: { condition: 'desc' }
    });

    res.json({
      success: true,
      filters: {
        categories: categories.sort(),
        brands: brands.sort(),
        locations: locations.sort(),
        priceRange: {
          minPrice: priceStats._min.price || 0,
          maxPrice: priceStats._max.price || 0,
          avgPrice: priceStats._avg.price || 0
        },
        conditions: conditionCounts.map(c => ({
          value: c.condition,
          count: c._count.condition
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
    const mostViewed = await prisma.product.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        seller: {
          select: {
            sellerDetails: {
              select: { businessName: true }
            }
          }
        }
      },
      orderBy: { views: 'desc' },
      take: parseInt(limit)
    });

    // Get recently added products
    const recentlyAdded = await prisma.product.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        seller: {
          select: {
            sellerDetails: {
              select: { businessName: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    // Get featured products
    const featured = await prisma.product.findMany({
      where: { featured: true, quantity: { gt: 0 } },
      include: {
        seller: {
          select: {
            sellerDetails: {
              select: { businessName: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

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
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find related products (same category or brand, excluding current product)
    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { not: productId },
        OR: [
          { category: currentProduct.category },
          { brand: currentProduct.brand }
        ],
        quantity: { gt: 0 }
      },
      include: {
        seller: {
          select: {
            sellerDetails: {
              select: { businessName: true }
            }
          }
        }
      },
      orderBy: [
        { views: 'desc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit)
    });

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