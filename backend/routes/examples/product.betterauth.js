// backend/routes/examples/product.betterauth.js
// EXAMPLE: Product routes using Better Auth middleware
// This is a demonstration - compare with routes/product.js to see the differences

const express = require('express');
const router = express.Router();

// OLD: const auth = require('../middleware/auth');
// NEW: Use Better Auth middleware
const {
  requireAuth,
  optionalAuth,
  requireSeller,
  requireEmailVerified
} = require('../middleware/betterAuth');

const productUploadOptimized = require('../middleware/productUploadOptimized');
const csvUpload = require('../middleware/csvUpload');
const papa = require('papaparse');
const Product = require('../models/Product');
const User = require('../models/User');
const { getPublicUrl } = require('../config/localStorage');

// ===== Input Validation =====
const {
  validateProductCreation,
  validateProductUpdate,
  validateObjectIdParam
} = require('../middleware/validateInput');

// =============================================================================
// PUBLIC ROUTES (No authentication required)
// =============================================================================

/**
 * @route   GET /api/products
 * @desc    Get all products (public, with optional personalization)
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

    const query = {};

    // Build query filters
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const products = await Product.find(query)
      .populate('seller', 'name isSeller')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Product.countDocuments(query);

    // If user is authenticated (via optionalAuth), we can personalize
    let favorites = [];
    if (req.user) {
      // Get user's favorite products
      favorites = await getUserFavorites(req.user.id);
    }

    res.json({
      success: true,
      products,
      favorites,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      isAuthenticated: !!req.user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get('/:id', validateObjectIdParam, optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email phone isSeller');

    if (!product) {
      return res.status(404).json({ success: false, msg: 'Product not found' });
    }

    // Track view if user is authenticated
    if (req.user) {
      await trackProductView(req.user.id, product._id);
    }

    res.json({
      success: true,
      product,
      viewedBy: req.user?.id || null
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
});

// =============================================================================
// AUTHENTICATED SELLER ROUTES
// =============================================================================

/**
 * @route   POST /api/products/bulk-upload
 * @desc    Bulk upload products from CSV
 * @access  Private (Verified Sellers Only)
 *
 * CHANGES FROM OLD VERSION:
 * - Uses requireAuth instead of auth
 * - Uses requireEmailVerified to ensure seller is verified
 * - Uses requireSeller instead of manual isSeller check
 * - No need to fetch User model to check isSeller - middleware does it
 */
router.post('/bulk-upload',
  requireAuth,          // 1. Must be authenticated
  requireEmailVerified, // 2. Email must be verified
  requireSeller,        // 3. Must be a seller (no manual check needed!)
  csvUpload,            // 4. Process CSV upload
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded. Please upload a CSV file.' });
    }

    try {
      // OLD: const seller = await User.findById(req.user.id);
      // OLD: if (!seller.isSeller) { ... }
      // NEW: No need - requireSeller middleware already checked!

      const csvFile = req.file.buffer.toString('utf8');

      const result = await new Promise((resolve, reject) => {
        papa.parse(csvFile, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            try {
              const productsToSave = [];
              const errors = [];

              for (const [index, row] of results.data.entries()) {
                const { name, description, price, category, quantity, deliveryTime, countryOfOrigin, condition, brand, tags, images } = row;
                const rowIndex = index + 2;

                if (!name || !description || !price || !category || !quantity) {
                  errors.push({ row: rowIndex, error: 'Missing required fields' });
                  continue;
                }

                const parsedPrice = parseFloat(price);
                const parsedQuantity = parseInt(quantity, 10);

                if (isNaN(parsedPrice) || parsedPrice < 0) {
                  errors.push({ row: rowIndex, error: 'Invalid price' });
                  continue;
                }
                if (isNaN(parsedQuantity) || parsedQuantity < 0) {
                  errors.push({ row: rowIndex, error: 'Invalid quantity' });
                  continue;
                }

                let productImages = ['/placeholder.jpg'];
                if (images && images.trim() !== '') {
                  productImages = images.split(',').map(img => img.trim()).filter(img => img !== '');
                }

                productsToSave.push({
                  name,
                  description,
                  price: parsedPrice,
                  category,
                  quantity: parsedQuantity,
                  images: productImages,
                  seller: req.user.id, // req.user comes from requireAuth
                  deliveryTime: deliveryTime || "Not specified",
                  countryOfOrigin: countryOfOrigin || "Not specified",
                  condition: ['new', 'used', 'refurbished'].includes(condition) ? condition : 'new',
                  brand: brand || "Unbranded",
                  tags: tags ? tags.split(',').map(tag => tag.trim()) : []
                });
              }

              if (productsToSave.length > 0) {
                try {
                  await Product.insertMany(productsToSave, { ordered: false });
                } catch (e) {
                  return reject({
                    status: 500,
                    data: { msg: 'Error saving products to database', errors }
                  });
                }
              }

              if (errors.length > 0) {
                return reject({
                  status: 400,
                  data: {
                    msg: `Processed with errors. ${productsToSave.length} products saved.`,
                    errors,
                  }
                });
              }

              resolve({
                success: true,
                message: `${productsToSave.length} products uploaded successfully.`,
              });
            } catch (err) {
              reject({ status: 500, data: { msg: 'Error processing CSV file.' } });
            }
          },
          error: (error) => {
            console.error('CSV parsing error:', error.message);
            reject({ status: 400, data: { msg: 'Error parsing CSV file.' } });
          }
        });
      });

      res.json(result);
    } catch (error) {
      if (error.status && error.data) {
        return res.status(error.status).json(error.data);
      }
      console.error(error);
      res.status(500).json({ success: false, msg: 'Server Error' });
    }
  }
);

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (Verified Sellers Only)
 *
 * CHANGES FROM OLD VERSION:
 * - Uses requireAuth, requireEmailVerified, requireSeller
 * - No manual seller verification needed
 * - Cleaner middleware chain
 */
router.post('/',
  requireAuth,          // 1. Must be authenticated
  requireEmailVerified, // 2. Email must be verified
  requireSeller,        // 3. Must be a seller
  (req, res) => {
    // Run the productUploadOptimized middleware
    productUploadOptimized(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ msg: err.message });
      }

      // Check if files were uploaded
      if (req.files === undefined || req.files.length === 0) {
        return res.status(400).json({ msg: 'No product images uploaded. At least one is required.' });
      }

      // Validate product input
      return validateProductCreation(req, res, async () => {
        const { name, description, price, category, quantity, deliveryTime, countryOfOrigin } = req.body;

        try {
          // OLD: Check if user is a verified seller
          // const seller = await User.findById(req.user.id);
          // if (!seller.isSeller) { ... }
          // NEW: No need! Middleware already verified seller status

          // Get image paths - convert to public URLs
          const images = req.files.map(file => getPublicUrl(file.path));

          // Create new product instance
          const newProduct = new Product({
            seller: req.user.id, // req.user guaranteed by requireAuth
            name,
            description,
            price,
            category,
            quantity,
            images,
            deliveryTime: deliveryTime || "Not specified",
            countryOfOrigin: countryOfOrigin || "Not specified"
          });

          // Save to database
          const product = await newProduct.save();
          res.status(201).json({
            success: true,
            product,
            msg: 'Product created successfully'
          });

        } catch (err) {
          console.error(err.message);
          res.status(500).json({ success: false, msg: 'Server Error' });
        }
      });
    });
  }
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Private (Product Owner Only)
 */
router.put('/:id',
  requireAuth,
  requireSeller,
  validateObjectIdParam,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ success: false, msg: 'Product not found' });
      }

      // Check if user is the product owner
      if (product.seller.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          msg: 'Not authorized to update this product'
        });
      }

      // Update fields
      const { name, description, price, category, quantity, deliveryTime, countryOfOrigin } = req.body;

      if (name) product.name = name;
      if (description) product.description = description;
      if (price) product.price = price;
      if (category) product.category = category;
      if (quantity !== undefined) product.quantity = quantity;
      if (deliveryTime) product.deliveryTime = deliveryTime;
      if (countryOfOrigin) product.countryOfOrigin = countryOfOrigin;

      await product.save();

      res.json({
        success: true,
        product,
        msg: 'Product updated successfully'
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, msg: 'Server Error' });
    }
  }
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Private (Product Owner Only)
 */
router.delete('/:id',
  requireAuth,
  requireSeller,
  validateObjectIdParam,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ success: false, msg: 'Product not found' });
      }

      // Check if user is the product owner or admin
      if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          msg: 'Not authorized to delete this product'
        });
      }

      await product.deleteOne();

      res.json({
        success: true,
        msg: 'Product deleted successfully'
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, msg: 'Server Error' });
    }
  }
);

/**
 * @route   GET /api/products/seller/my-products
 * @desc    Get current seller's products
 * @access  Private (Sellers Only)
 */
router.get('/seller/my-products',
  requireAuth,
  requireSeller,
  async (req, res) => {
    try {
      const products = await Product.find({ seller: req.user.id })
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        products,
        count: products.length
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, msg: 'Server Error' });
    }
  }
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getUserFavorites(userId) {
  // Implementation to get user's favorite products
  return [];
}

async function trackProductView(userId, productId) {
  // Implementation to track product views
  return;
}

module.exports = router;

/**
 * KEY DIFFERENCES FROM OLD VERSION:
 *
 * 1. Middleware Import:
 *    OLD: const auth = require('../middleware/auth');
 *    NEW: const { requireAuth, requireSeller, requireEmailVerified } = require('../middleware/betterAuth');
 *
 * 2. Authentication:
 *    OLD: router.post('/', auth, handler)
 *    NEW: router.post('/', requireAuth, requireSeller, handler)
 *
 * 3. Seller Verification:
 *    OLD: const seller = await User.findById(req.user.id);
 *         if (!seller.isSeller) { return res.status(401)... }
 *    NEW: Just use requireSeller middleware - no manual check!
 *
 * 4. Email Verification:
 *    OLD: Manual check or no check
 *    NEW: requireEmailVerified middleware
 *
 * 5. Public Routes:
 *    OLD: No auth
 *    NEW: optionalAuth for personalization
 *
 * 6. Error Responses:
 *    - More consistent error format
 *    - Better HTTP status codes
 *    - Standardized messages
 */
