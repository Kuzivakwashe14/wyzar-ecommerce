// In backend/routes/seller.js

const express = require('express');
const router = express.Router();
// OLD: const auth = require('../middleware/auth');
// NEW: Better Auth middleware
const {
  requireAuth,
  requireEmailVerified
} = require('../middleware/betterAuth');
const verificationUploadOptimized = require('../middleware/verificationUploadOptimized');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const { getStoragePath, getPublicUrl } = require('../config/localStorage');

// Configure multer for multiple verification documents
const verificationStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = getStoragePath('verification');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create a flexible multer upload that accepts both field names
const flexibleUpload = multer({
  storage: verificationStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB per file
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, GIF) and PDF are allowed'));
    }
  }
}).fields([
  { name: 'documents', maxCount: 10 },           // New format: multiple documents
  { name: 'verificationDocument', maxCount: 1 }  // Legacy format: single document
]);

// @route   POST /api/seller/apply
// @desc    Apply to become a seller (supports both single and multiple documents)
// @access  Private (only logged-in users)
router.post('/apply', requireAuth, requireEmailVerified, flexibleUpload, async (req, res) => {
  try {
    // Get form data from the request body
    const { businessName, sellerType, phoneNumber, address, documentTypes } = req.body;

    if (!businessName || !sellerType) {
      return res.status(400).json({ msg: 'Please fill in business name and seller type.' });
    }

    // Normalize files from both upload formats
    // When using .fields(), req.files is an object with field names as keys
    let filesArray = [];
    if (req.files) {
      if (req.files.documents) {
        // New format: multiple documents
        filesArray = req.files.documents;
      } else if (req.files.verificationDocument) {
        // Legacy format: single document
        filesArray = req.files.verificationDocument;
      }
    }

    // Check if files were uploaded
    if (!filesArray || filesArray.length === 0) {
      return res.status(400).json({ msg: 'Please upload at least one verification document.' });
    }

    // Parse document types (sent as JSON string from frontend for multiple docs)
    let docTypes = [];
    if (documentTypes) {
      try {
        docTypes = JSON.parse(documentTypes);
      } catch (e) {
        // If parsing fails, it might be a legacy upload - use default type
      }
    }

    // For legacy single file uploads, use a default document type
    if (docTypes.length === 0 && filesArray.length === 1) {
      // Determine default type based on seller type
      const defaultType = req.body.sellerType === 'individual' ? 'national_id' : 'business_registration';
      docTypes = [defaultType];
    }

    // Ensure we have a document type for each uploaded file
    if (docTypes.length !== filesArray.length) {
      return res.status(400).json({ msg: 'Please specify document type for each uploaded file.' });
    }

    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    // Prepare verification documents array
    const verificationDocuments = filesArray.map((file, index) => ({
      documentType: docTypes[index],
      documentPath: file.path,
      documentName: file.originalname,
      uploadedAt: new Date(),
      status: 'pending'
    }));

    // Parse address if provided
    let parsedAddress = null;
    if (address) {
      try {
        parsedAddress = JSON.parse(address);
      } catch (e) {
        // Address is optional, so we can ignore parse errors
      }
    }

    // Update the user with seller information
    user.isSeller = true;
    user.isVerified = false; // Admin must approve this

    if (!user.sellerDetails) {
      user.sellerDetails = {};
    }

    user.sellerDetails.businessName = businessName;
    user.sellerDetails.sellerType = sellerType;
    user.sellerDetails.phoneNumber = phoneNumber || user.sellerDetails.phoneNumber;
    user.sellerDetails.address = parsedAddress || user.sellerDetails.address;
    user.sellerDetails.verificationDocuments = verificationDocuments;
    user.sellerDetails.verificationStatus = 'under_review';

    // Keep legacy field for backwards compatibility
    if (filesArray.length > 0) {
      user.sellerDetails.verificationDocument = filesArray[0].path;
    }

    await user.save();

    // Send back the updated user data (excluding password)
    const userResponse = await User.findById(req.user.id).select('-password');
    res.json({
      msg: `Application submitted successfully with ${filesArray.length} document(s)!`,
      user: userResponse
    });

  } catch (err) {
    console.error('Error in seller application:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST /api/seller/upload-document
// @desc    Upload additional verification document for existing seller
// @access  Private (seller only)
router.post('/upload-document', requireAuth, (req, res) => {
  // Use single file upload
  verificationUploadOptimized(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ msg: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'No document uploaded.' });
    }

    const { documentType } = req.body;

    if (!documentType) {
      return res.status(400).json({ msg: 'Document type is required.' });
    }

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found.' });
      }

      if (!user.isSeller) {
        return res.status(403).json({ msg: 'Only sellers can upload verification documents.' });
      }

      if (!user.sellerDetails.verificationDocuments) {
        user.sellerDetails.verificationDocuments = [];
      }

      // Add new document
      user.sellerDetails.verificationDocuments.push({
        documentType,
        documentPath: req.file.path,
        documentName: req.file.originalname,
        uploadedAt: new Date(),
        status: 'pending'
      });

      // Update verification status if it was rejected
      if (user.sellerDetails.verificationStatus === 'rejected') {
        user.sellerDetails.verificationStatus = 'under_review';
      }

      await user.save();

      res.json({
        msg: 'Document uploaded successfully',
        document: user.sellerDetails.verificationDocuments[user.sellerDetails.verificationDocuments.length - 1]
      });

    } catch (err) {
      console.error('Error uploading document:', err.message);
      res.status(500).json({ msg: 'Server Error', error: err.message });
    }
  });
});

// @route   PUT /api/seller/profile
// @desc    Update seller profile
// @access  Private (seller only)
router.put('/profile', requireAuth, async (req, res) => {
  const { businessName, phoneNumber, address } = req.body;

  if (!businessName) {
    return res.status(400).json({ msg: 'Business name is required.' });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.isSeller) {
      return res.status(401).json({ msg: 'Not authorized.' });
    }

    // Update the sellerDetails
    user.sellerDetails.businessName = businessName;

    if (phoneNumber) {
      user.sellerDetails.phoneNumber = phoneNumber;
    }

    if (address) {
      user.sellerDetails.address = address;
    }

    await user.save();

    // Send back the updated user data (excluding password)
    const userResponse = await User.findById(req.user.id).select('-password');
    res.json({ msg: 'Profile updated successfully!', user: userResponse });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
