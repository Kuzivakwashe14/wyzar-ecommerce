// middleware/imagekitUpload.js
// Middleware for handling image uploads to ImageKit

const multer = require('multer');
const path = require('path');
const { uploadToImageKit, validateConfig } = require('../config/imagekit');
const { getPublicUrl } = require('../config/localStorage');
const fs = require('fs');

// Always use disk storage to ensure files are available regardless of configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/products/';
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = req.user.id + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

// File filter for images only
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only images (jpeg, jpg, png, gif, webp) are allowed!'), false);
  }
};

// File filter for documents (verification documents)
const documentFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only images (jpeg, jpg, png) or PDF files are allowed!'), false);
  }
};

// Storage for verification documents and payment proofs
const verificationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/verification/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = req.user.id + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

// Base multer configuration
const multerConfig = {
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
};

// Multer instances
const productImageUpload = multer({
  ...multerConfig,
  fileFilter: imageFilter
});

const verificationDocUpload = multer({
  storage: verificationStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for documents
  fileFilter: documentFilter
});

/**
 * Middleware for uploading product images to ImageKit
 * Handles multiple images (up to 5)
 * Falls back to local storage if ImageKit is not configured
 */
const uploadProductImages = (req, res, next) => {
  const upload = productImageUpload.array('productImages', 5);

  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ msg: 'File too large. Maximum size is 10MB per image.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ msg: 'Too many files. Maximum is 5 images.' });
        }
        return res.status(400).json({ msg: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ msg: err.message });
    }

    // If no files, continue to next middleware
    if (!req.files || req.files.length === 0) {
      return next();
    }

    try {
      // Check if ImageKit is configured (dynamically per request)
      if (validateConfig()) {
        // Upload to ImageKit - pass file paths (v7 SDK uses fs.createReadStream internally)
        const uploadPromises = req.files.map(async (file) => {
          try {
            // Upload file to ImageKit using disk path
            const result = await uploadToImageKit(
              file.path,
              file.originalname,
              'products',
              {
                tags: ['product', `seller-${req.user.id}`]
              }
            );
            
            // Delete local file after successful upload
            if (result.success) {
              try { fs.unlinkSync(file.path); } catch(e) {}
            }
            
            return result;
          } catch (error) {
            console.error('File upload error:', error);
            return {
              success: false,
              error: error.message
            };
          }
        });

        const uploadResults = await Promise.all(uploadPromises);

        // Check for any upload failures
        const failedUploads = uploadResults.filter(result => !result.success);
        if (failedUploads.length > 0) {
          console.error('ImageKit upload failures:', failedUploads);
          return res.status(500).json({ 
            msg: 'Some images failed to upload to ImageKit',
            errors: failedUploads.map(f => f.error)
          });
        }

        // Attach ImageKit URLs and file IDs to request
        req.imagekitFiles = uploadResults.map(result => ({
          url: result.url,
          fileId: result.fileId,
          name: result.name,
          thumbnailUrl: result.thumbnailUrl
        }));
      } else {
        // Fall back to local storage - files are already saved to disk by multer
        console.warn('⚠️  ImageKit not configured, using local storage for images');
        req.imagekitFiles = req.files.map(file => ({
          url: getPublicUrl(file.path),
          fileId: null, // No fileId for local storage
          name: file.filename,
          thumbnailUrl: null
        }));
      }

      next();
    } catch (error) {
      console.error('Image upload error:', error);
      return res.status(500).json({ msg: 'Failed to upload images' });
    }
  });
};

/**
 * Middleware for uploading single verification document to ImageKit
 */
const uploadVerificationDoc = (req, res, next) => {
  const upload = verificationDocUpload.single('verificationDocument');

  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ msg: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ msg: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ msg: err.message });
    }

    // If no file, continue to next middleware
    if (!req.file) {
      return next();
    }

    try {
      // Check if ImageKit is configured
      if (validateConfig()) {
        // Upload to ImageKit using file path
        const uploadResult = await uploadToImageKit(
          req.file.path,
          req.file.originalname,
          'verification',
          {
            tags: ['verification', `user-${req.user.id}`]
          }
        );

        if (!uploadResult.success) {
          return res.status(500).json({ msg: 'Failed to upload document to ImageKit', error: uploadResult.error });
        }

        // Delete local file after successful upload
        try { fs.unlinkSync(req.file.path); } catch(e) {}

        // Attach ImageKit file info to request
        req.imagekitFile = {
          url: uploadResult.url,
          fileId: uploadResult.fileId,
          name: uploadResult.name
        };
      } else {
        // Fall back to local storage
        console.warn('⚠️  ImageKit not configured, using local storage');
        req.imagekitFile = {
          url: getPublicUrl(req.file.path),
          fileId: null,
          name: req.file.filename
        };
      }

      next();
    } catch (error) {
      console.error('ImageKit upload error:', error);
      return res.status(500).json({ msg: 'Failed to upload document to ImageKit' });
    }
  });
};

/**
 * Middleware for uploading payment proof to ImageKit
 */
const uploadPaymentProof = (req, res, next) => {
  const upload = verificationDocUpload.single('paymentProof');

  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ msg: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ msg: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ msg: err.message });
    }

    // If no file, continue to next middleware
    if (!req.file) {
      return next();
    }

    try {
      // Check if ImageKit is configured
      if (validateConfig()) {
        // Upload to ImageKit using file path
        const uploadResult = await uploadToImageKit(
          req.file.path,
          req.file.originalname,
          'payment-proofs',
          {
            tags: ['payment-proof', `user-${req.user.id}`]
          }
        );

        if (!uploadResult.success) {
          return res.status(500).json({ msg: 'Failed to upload payment proof to ImageKit', error: uploadResult.error });
        }

        // Delete local file after successful upload
        try { fs.unlinkSync(req.file.path); } catch(e) {}

        // Attach ImageKit file info to request
        req.imagekitFile = {
          url: uploadResult.url,
          fileId: uploadResult.fileId,
          name: uploadResult.name
        };
      } else {
        // Fall back to local storage
        console.warn('⚠️  ImageKit not configured, using local storage');
        req.imagekitFile = {
          url: getPublicUrl(req.file.path),
          fileId: null,
          name: req.file.filename
        };
      }

      next();
    } catch (error) {
      console.error('ImageKit upload error:', error);
      return res.status(500).json({ msg: 'Failed to upload payment proof to ImageKit' });
    }
  });
};

module.exports = {
  uploadProductImages,
  uploadVerificationDoc,
  uploadPaymentProof
};
