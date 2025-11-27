// In backend/routes/seller.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // To protect the route
const verificationUploadOptimized = require('../middleware/verificationUploadOptimized'); // Optimized upload handler
const User = require('../models/User');

// @route   POST /api/seller/apply
// @desc    Apply to become a seller
// @access  Private (only logged-in users)
router.post('/apply', auth, (req, res) => {
  // 1. Run the verificationUploadOptimized middleware
  // It will handle the file first. If there's an error, it will be caught.
  verificationUploadOptimized(req, res, async (err) => {
    if (err) {
      // Handle upload errors (e.g., file type, size)
      return res.status(400).json({ msg: err.message });
    }

    // 2. Check if a file was uploaded
    if (req.file === undefined) {
      return res.status(400).json({ msg: 'No verification document uploaded.' });
    }

    // 3. Get form data from the request body
    const { businessName, sellerType } = req.body;

    if (!businessName || !sellerType) {
      return res.status(400).json({ msg: 'Please fill in all fields.' });
    }

    try {
      // 4. Find the user by their ID (from the 'auth' middleware)
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found.' });
      }

      // 5. Update the user with seller information
      user.isSeller = true;
      user.isVerified = false; // Admin must approve this
      user.sellerDetails = {
        businessName: businessName,
        sellerType: sellerType,
        verificationDocument: req.file.path // Save the file path
      };

      await user.save();

      // 6. Send back the updated user data (excluding password)
      const userResponse = await User.findById(req.user.id).select('-password');
      res.json({ msg: 'Application submitted successfully!', user: userResponse });

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
});

router.put('/profile', auth, async (req, res) => {
  const { businessName } = req.body;

  if (!businessName) {
    return res.status(400).json({ msg: 'Business name is required.' });
  }

  try {
    // Find the user
    const user = await User.findById(req.user.id);

    if (!user || !user.isSeller) {
      return res.status(401).json({ msg: 'Not authorized.' });
    }

    // Update the sellerDetails
    user.sellerDetails.businessName = businessName;

    // We can add more fields to update here later

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