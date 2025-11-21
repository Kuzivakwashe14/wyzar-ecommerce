// In backend/middleware/productUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the destination folder
const uploadDir = 'uploads/products/';

// Ensure the upload directory exists
fs.mkdirSync(uploadDir, { recursive: true });

// Configure Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename: sellerId-timestamp-originalName
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = req.user.id + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

// File Filter (Images Only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/; // Added gif
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only images (jpeg, jpg, png, gif) are allowed!'), false);
  }
};

// Initialize Multer for multiple files
// 'productImages' is the field name from the form
// We'll allow up to 5 images
const productUpload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB per file
  fileFilter: fileFilter
}).array('productImages', 5); // 5 = max number of files

module.exports = productUpload;