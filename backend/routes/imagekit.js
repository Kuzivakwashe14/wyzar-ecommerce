// routes/imagekit.js
// ImageKit authentication and utility routes

const express = require('express');
const router = express.Router();
const { getAuthenticationParameters, validateConfig } = require('../config/imagekit');
const auth = require('../middleware/auth');

// @route   GET /api/imagekit/auth
// @desc    Get ImageKit authentication parameters for client-side uploads
// @access  Private
router.get('/auth', auth, (req, res) => {
  try {
    // Validate ImageKit configuration
    if (!validateConfig()) {
      return res.status(500).json({ 
        msg: 'ImageKit is not configured properly. Please check your environment variables.' 
      });
    }

    // Get authentication parameters
    const authParams = getAuthenticationParameters();
    
    res.json(authParams);
  } catch (error) {
    console.error('ImageKit auth error:', error);
    res.status(500).json({ msg: 'Failed to get ImageKit authentication' });
  }
});

// @route   GET /api/imagekit/config
// @desc    Get public ImageKit configuration (URL endpoint and public key)
// @access  Public
router.get('/config', (req, res) => {
  try {
    if (!validateConfig()) {
      // Return empty config if not configured (frontend will handle gracefully)
      return res.json({
        urlEndpoint: '',
        publicKey: '',
        configured: false
      });
    }

    res.json({
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      configured: true
    });
  } catch (error) {
    console.error('ImageKit config error:', error);
    res.status(500).json({ msg: 'Failed to get ImageKit configuration' });
  }
});

module.exports = router;
