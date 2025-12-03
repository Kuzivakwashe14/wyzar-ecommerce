// backend/routes/product.js

const express = require('express');
const router = express.Router();
// OLD: const auth = require('../middleware/auth');
// NEW: Better Auth middleware
const {
  requireAuth,
  requireSeller,
  requireEmailVerified,
  optionalAuth
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

// @route   POST /api/products/bulk-upload
// @desc    Bulk upload products from CSV
// @access  Private (Sellers Only)
router.post('/bulk-upload',
  requireAuth,          // Must be authenticated
  requireEmailVerified, // Email must be verified
  requireSeller,        // Must be a seller (no manual check needed!)
  csvUpload,            // Process CSV upload
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded. Please upload a CSV file.' });
    }

    try {
      // No need to check seller status - middleware already did it!
      const csvFile = req.file.buffer.toString('utf8');

    // Wrap papa.parse in a promise to handle async operations properly
    try {
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
                const rowIndex = index + 2; // For user-friendly error reporting (1-based index + header)

                if (!name || !description || !price || !category || !quantity) {
                  errors.push({ row: rowIndex, error: 'Missing required fields (name, description, price, category, quantity).' });
                  continue;
                }

                const parsedPrice = parseFloat(price);
                const parsedQuantity = parseInt(quantity, 10);

                if (isNaN(parsedPrice) || parsedPrice < 0) {
                  errors.push({ row: rowIndex, error: 'Invalid price. It must be a non-negative number.' });
                  continue;
                }
                if (isNaN(parsedQuantity) || parsedQuantity < 0) {
                  errors.push({ row: rowIndex, error: 'Invalid quantity. It must be a non-negative integer.' });
                  continue;
                }

                // Parse images: split by comma if present, otherwise default
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
                  seller: req.user.id,
                  deliveryTime: deliveryTime || "Not specified",
                  countryOfOrigin: countryOfOrigin || "Not specified",
                  condition: ['new', 'used', 'refurbished'].includes(condition) ? condition : 'new',
                  brand: brand || "Unbranded",
                  tags: tags ? tags.split(',').map(tag => tag.trim()) : []
                });
              }

              if (results.errors.length > 0) {
                results.errors.forEach(err => {
                  errors.push({ row: err.row + 2, error: err.message });
                });
              }

              if (productsToSave.length > 0) {
                try {
                  await Product.insertMany(productsToSave, { ordered: false });
                } catch (e) {
                  // This error is complex to parse, so we'll just notify the user
                  return reject({ status: 500, data: { msg: 'An error occurred while saving products to the database. Please check your data for duplicates or errors.', errors } });
                }
              }

              if (errors.length > 0) {
                return reject({
                  status: 400, data: {
                    msg: `Processed with some errors. ${productsToSave.length} products were valid and have been saved.`,
                    errors,
                  }
                });
              }

              resolve({
                success: true,
                message: `${productsToSave.length} products uploaded successfully.`,
              });
            } catch (err) {
              reject({ status: 500, data: { msg: 'An error occurred while processing the CSV file.' } });
            }
          },
          error: (error) => {
            console.error('CSV parsing error:', error.message);
            reject({ status: 400, data: { msg: 'Error parsing CSV file. Please ensure it is a valid CSV.' } });
          }
        });
      });

      res.json(result);
    } catch (error) {
      if (error.status && error.data) {
        return res.status(error.status).json(error.data);
      }
      throw error;
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   POST /api/products
// @desc    Create a new product
// @access  Private (Sellers Only)
router.post('/',
  requireAuth,          // Must be authenticated
  requireEmailVerified, // Email must be verified
  requireSeller,        // Must be a seller
  (req, res) => {
    // 1. Run the productUploadOptimized middleware
    productUploadOptimized(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ msg: err.message });
      }

      // 2. Check if files were uploaded
      if (req.files === undefined || req.files.length === 0) {
        return res.status(400).json({ msg: 'No product images uploaded. At least one is required.' });
      }

      // 3. Validate product input
      return validateProductCreation(req, res, async () => {
        const { name, description, price, category, quantity, deliveryTime, countryOfOrigin } = req.body;

        try {
          // No need to check seller status - middleware already verified!

          // Get image paths - convert to public URLs for Nginx
      const images = req.files.map(file => getPublicUrl(file.path));

      // 7. Create new product instance
      const newProduct = new Product({
        seller: req.user.id,
        name,
        description,
        price,
        category,
        quantity,
        images,
        deliveryTime: deliveryTime || "Not specified",
        countryOfOrigin: countryOfOrigin || "Not specified"
      });

      // 8. Save to database
      const product = await newProduct.save();
      res.status(201).json(product); // Send back the created product

      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    });
  });
});

// @route   GET /api/products
// @desc    Get all products (for customers)
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Find all products and populate the 'seller' field
    // We only select the seller's 'businessName'
    const products = await Product.find()
      .populate('seller', ['sellerDetails.businessName'])
      .sort({ createdAt: -1 }); // Show newest first

    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/products/:id
// @desc    Get a single product by ID (with view tracking)
// @access  Public
router.get('/:id', validateObjectIdParam('id'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', ['sellerDetails.businessName', 'email']); // Get seller's info

    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Increment view count (don't wait for it)
    Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

    res.json(product);
  } catch (err) {
    console.error(err.message);
    // If the ID is not a valid MongoDB ID, it will throw an error
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/products/seller/me
// @desc    Get all products for the logged-in seller
// @access  Private (Sellers Only)
router.get('/seller/me',
  requireAuth,
  requireSeller,
  async (req, res) => {
    try {
      // No need to check seller status - middleware already verified!
      const products = await Product.find({ seller: req.user.id }).sort({ createdAt: -1 });
      res.json(products);

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private (Sellers Only)
router.put('/:id',
  requireAuth,
  requireSeller,
  validateObjectIdParam('id'),
  (req, res) => {
  productUploadOptimized(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ msg: err.message });
    }

    // Validate product update input
    return validateProductUpdate(req, res, async () => {
      const { name, description, price, category, quantity, deliveryTime, countryOfOrigin } = req.body;

      // Build product object
      const productFields = {};
      if (name) productFields.name = name;
      if (description) productFields.description = description;
      if (price) productFields.price = price;
      if (category) productFields.category = category;
      if (quantity) productFields.quantity = quantity;
      if (deliveryTime) productFields.deliveryTime = deliveryTime;
      if (countryOfOrigin) productFields.countryOfOrigin = countryOfOrigin;

      // Handle image updates - convert to public URLs for Nginx
      if (req.files && req.files.length > 0) {
        productFields.images = req.files.map(file => getPublicUrl(file.path));
      }

      try {
      let product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ msg: 'Product not found' });
      }

      // Security Check: Make sure the user owns the product
      if (product.seller.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      product = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: productFields },
        { new: true } // Return the updated document
      );

      res.json(product);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    });
  });
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private (Sellers Only)
router.delete('/:id',
  requireAuth,
  requireSeller,
  validateObjectIdParam('id'),
  async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Security Check: Make sure the user owns the product
    if (product.seller.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // TODO: We should also delete images from the 'uploads/' folder here
    // For now, we'll just delete the database record
    await Product.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;