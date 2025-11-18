// In backend/routes/product.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Auth middleware
const productUpload = require('../middleware/productUpload'); // Our new upload middleware
const Product = require('../models/Product'); // Product model
const User = require('../models/User'); // We need User model to check if seller is verified

// @route   POST /api/products
// @desc    Create a new product
// @access  Private (Sellers Only)
router.post('/', auth, (req, res) => {
  // 1. Run the productUpload middleware
  productUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ msg: err.message });
    }

    // 2. Check if files were uploaded
    if (req.files === undefined || req.files.length === 0) {
      return res.status(400).json({ msg: 'No product images uploaded. At least one is required.' });
    }

    // 3. Get form data
    const { name, description, price, category, quantity, deliveryTime, countryOfOrigin } = req.body;

    // 4. Basic validation
    if (!name || !description || !price || !category || !quantity) {
      return res.status(400).json({ msg: 'Please fill in all required fields (name, description, price, category, quantity).' });
    }

    try {
      // 5. Check if user is a verified seller (we'll add verification later)
      // For now, we just check if they are a seller 
      const seller = await User.findById(req.user.id);
      if (!seller.isSeller) {
        return res.status(401).json({ msg: 'Not authorized. Only sellers can create products.' });
      }
      
      // (Later, we'll add: if (!seller.isVerified) ... )

      // 6. Get image paths
      const images = req.files.map(file => file.path);

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
router.get('/:id', async (req, res) => {
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
router.get('/seller/me', auth, async (req, res) => {
  try {
    const seller = await User.findById(req.user.id);
    if (!seller.isSeller) {
      return res.status(401).json({ msg: 'Not authorized.' });
    }

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
router.put('/:id', auth, async (req, res) => {
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
  // Note: We are not handling image updates here for simplicity

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

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private (Sellers Only)
router.delete('/:id', auth, async (req, res) => {
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