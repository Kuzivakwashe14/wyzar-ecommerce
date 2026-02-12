// backend/routes/product.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const productUploadOptimized = require('../middleware/productUploadOptimized');
const { uploadProductImages } = require('../middleware/imagekitUpload');
const csvUpload = require('../middleware/csvUpload');
const papa = require('papaparse');
const prisma = require('../config/prisma');
const { getPublicUrl } = require('../config/localStorage');
const { deleteMultipleFromImageKit } = require('../config/imagekit');

// ===== Zod Validation =====
const { validateBody, validateParams } = require('../middleware/zodValidate');
const { productSchema, productUpdateSchema, objectIdParamSchema } = require('../schemas');

// ===== Rate Limiting =====
const { uploadLimiter } = require('../config/security');

// @route   POST /api/products/bulk-upload
// @desc    Bulk upload products from CSV
// @access  Private (Sellers Only)
router.post('/bulk-upload', auth, uploadLimiter, csvUpload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded. Please upload a CSV file.' });
  }

  try {
    const seller = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!seller.isSeller) {
      return res.status(401).json({ msg: 'Not authorized. Only sellers can upload products.' });
    }

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

                // Map condition values to Prisma enum
                let conditionValue = 'NEW';
                if (condition) {
                  const condMap = { 'new': 'NEW', 'used': 'USED', 'refurbished': 'REFURBISHED' };
                  conditionValue = condMap[condition.toLowerCase()] || 'NEW';
                }

                productsToSave.push({
                  name,
                  description,
                  price: parsedPrice,
                  category,
                  quantity: parsedQuantity,
                  images: productImages,
                  sellerId: req.user.id,
                  deliveryTime: deliveryTime || "Not specified",
                  countryOfOrigin: countryOfOrigin || "Not specified",
                  condition: conditionValue,
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
                  await prisma.product.createMany({ data: productsToSave, skipDuplicates: true });
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
router.post('/', auth, uploadProductImages, async (req, res) => {
  try {
    // 1. Check if files were uploaded
    if (!req.imagekitFiles || req.imagekitFiles.length === 0) {
      return res.status(400).json({ msg: 'No product images uploaded. At least one is required.' });
    }

    // 2. Validate product input using Zod
    const validation = productSchema.safeParse(req.body);
    if (!validation.success) {
      // Zod v4 uses 'issues', v3 uses 'errors'
      const zodErrors = validation.error.issues || validation.error.errors || [];
      const errors = zodErrors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        msg: errors[0]?.message || 'Validation failed',
        errors,
      });
    }

    const { name, description, price, category, quantity, deliveryTime, countryOfOrigin } = validation.data;

    // 3. Check if user is a verified seller
    const seller = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!seller.isSeller) {
      return res.status(401).json({ msg: 'Not authorized. Only sellers can create products.' });
    }

    // 4. Get ImageKit URLs from uploaded files
    const images = req.imagekitFiles.map(file => file.url);
    
    // Only set imageFileIds if they exist (ImageKit uploads have fileIds, local storage doesn't)
    const imageFileIds = req.imagekitFiles.map(file => file.fileId).filter(id => id !== null);

    // 5. Create new product instance
    const product = await prisma.product.create({
      data: {
        sellerId: req.user.id,
        name,
        description,
        price: parseFloat(price),
        category,
        quantity: parseInt(quantity),
        images,
        imageFileIds: imageFileIds.length > 0 ? imageFileIds : [], // Store ImageKit file IDs for later deletion
        deliveryTime: deliveryTime || "Not specified",
        countryOfOrigin: countryOfOrigin || "Not specified"
      }
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/products
// @desc    Get all products (for customers)
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Find all products and populate the 'seller' field
    // We only select the seller's 'businessName'
    const products = await prisma.product.findMany({
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
      orderBy: { createdAt: 'desc' } // Show newest first
    });

    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/products/:id
// @desc    Get a single product by ID (with view tracking)
// @access  Public
router.get('/:id', validateParams(objectIdParamSchema), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
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
      }
    });

    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Increment view count (don't wait for it)
    prisma.product.update({
      where: { id: req.params.id },
      data: { views: { increment: 1 } }
    }).catch(err => console.error('Error updating views:', err));

    res.json(product);
  } catch (err) {
    console.error(err.message);
    return res.status(404).json({ msg: 'Product not found' });
  }
});

// @route   GET /api/products/seller/me
// @desc    Get all products for the logged-in seller
// @access  Private (Sellers Only)
router.get('/seller/me', auth, async (req, res) => {
  try {
    const seller = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!seller.isSeller) {
      return res.status(401).json({ msg: 'Not authorized.' });
    }

    const products = await prisma.product.findMany({
      where: { sellerId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private (Sellers Only)
router.put('/:id', auth, validateParams(objectIdParamSchema), uploadProductImages, async (req, res) => {
  try {
    // Validate product update input
    const validation = productUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      // Zod v4 uses 'issues', v3 uses 'errors'
      const zodErrors = validation.error.issues || validation.error.errors || [];
      const errors = zodErrors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        msg: errors[0]?.message || 'Validation failed',
        errors,
      });
    }

    const { name, description, price, category, quantity, deliveryTime, countryOfOrigin } = req.body;

    let product = await prisma.product.findUnique({ where: { id: req.params.id } });

    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Security Check: Make sure the user owns the product
    if (product.sellerId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Build update data
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (category) updateData.category = category;
    if (quantity) updateData.quantity = parseInt(quantity);
    if (deliveryTime) updateData.deliveryTime = deliveryTime;
    if (countryOfOrigin) updateData.countryOfOrigin = countryOfOrigin;
    
    // Handle ImageKit image updates
    if (req.imagekitFiles && req.imagekitFiles.length > 0) {
      updateData.images = req.imagekitFiles.map(file => file.url);
      
      // Only set imageFileIds if they exist (ImageKit uploads have fileIds, local storage doesn't)
      const fileIds = req.imagekitFiles.map(file => file.fileId).filter(id => id !== null);
      if (fileIds.length > 0) {
        updateData.imageFileIds = fileIds;
      }
      
      // Delete old images from ImageKit (only if using ImageKit)
      if (product.imageFileIds && product.imageFileIds.length > 0) {
        await deleteMultipleFromImageKit(product.imageFileIds);
      }
    }

    product = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private (Sellers Only)
router.delete('/:id', auth, validateParams(objectIdParamSchema), async (req, res) => {
  try {
    let product = await prisma.product.findUnique({ where: { id: req.params.id } });

    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Security Check: Make sure the user owns the product
    if (product.sellerId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Delete images from ImageKit
    if (product.imageFileIds && product.imageFileIds.length > 0) {
      await deleteMultipleFromImageKit(product.imageFileIds);
    }

    // Delete the database record
    await prisma.product.delete({ where: { id: req.params.id } });

    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;