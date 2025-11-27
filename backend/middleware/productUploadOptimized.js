// middleware/productUploadOptimized.js
// Optimized local storage with proper organization

const multer = require('multer');
const path = require('path');
const { STORAGE_CONFIG, getStoragePath, generateFilename } = require('../config/localStorage');

// Configure Storage with better organization
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = getStoragePath('products');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId-timestamp-random.ext
    const filename = generateFilename(req.user.id, file.originalname);
    cb(null, filename);
  }
});

// Enhanced File Filter
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (STORAGE_CONFIG.allowedImageTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  // Check file extension as backup
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  if (allowedExts.includes(ext)) {
    return cb(null, true);
  }

  cb(new Error(`Invalid file type. Allowed types: ${allowedExts.join(', ')}`), false);
};

// Initialize Multer with optimized settings
const productUploadOptimized = multer({
  storage: storage,
  limits: {
    fileSize: STORAGE_CONFIG.maxFileSize.image, // 10MB
    files: 10 // Maximum 10 images per upload
  },
  fileFilter: fileFilter
}).array('productImages', 10);

// Enhanced error handling wrapper
const productUploadWithErrorHandling = (req, res, next) => {
  productUploadOptimized(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          msg: `File too large. Maximum size is ${STORAGE_CONFIG.maxFileSize.image / (1024 * 1024)}MB`
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          msg: 'Too many files. Maximum 10 images allowed'
        });
      }
      return res.status(400).json({
        success: false,
        msg: err.message
      });
    } else if (err) {
      // Other errors
      return res.status(400).json({
        success: false,
        msg: err.message
      });
    }

    // No error, proceed
    next();
  });
};

module.exports = productUploadWithErrorHandling;
