// middleware/verificationUploadOptimized.js
const multer = require('multer');
const path = require('path');
const { STORAGE_CONFIG, getStoragePath, generateFilename } = require('../config/localStorage');

// Configure Storage for verification documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = getStoragePath('verification');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const filename = generateFilename(req.user?.id || 'pending', file.originalname);
    cb(null, filename);
  }
});

// File Filter for documents and images
const fileFilter = (req, file, cb) => {
  if (STORAGE_CONFIG.allowedDocTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];

  if (allowedExts.includes(ext)) {
    return cb(null, true);
  }

  cb(new Error(`Invalid file type. Allowed: PDF, JPG, PNG`), false);
};

// Initialize Multer
const verificationUpload = multer({
  storage: storage,
  limits: {
    fileSize: STORAGE_CONFIG.maxFileSize.document, // 5MB
    files: 1
  },
  fileFilter: fileFilter
}).single('verificationDocument');

// Error handling wrapper
const verificationUploadOptimized = (req, res, next) => {
  verificationUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          msg: `File too large. Maximum size is ${STORAGE_CONFIG.maxFileSize.document / (1024 * 1024)}MB`
        });
      }
      return res.status(400).json({
        success: false,
        msg: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        msg: err.message
      });
    }
    next();
  });
};

module.exports = verificationUploadOptimized;
