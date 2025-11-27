// backend/middleware/validateInput.js
const {
  ValidationError,
  validateEmail,
  validatePhone,
  validatePrice,
  validateQuantity,
  validateProductName,
  validateDescription,
  validateCategory,
  validateAddress
} = require('../utils/security/inputValidation');

/**
 * Validate user registration input
 */
const validateRegistration = (req, res, next) => {
  try {
    const { email, password, phone } = req.body;

    // Validate email
    if (email) {
      req.body.email = validateEmail(email);
    }

    // Validate phone (if provided)
    if (phone) {
      req.body.phone = validatePhone(phone);
    }

    // Password validation happens in passwordSecurity middleware
    
    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        msg: error.message,
        field: error.field
      });
    }
    next(error);
  }
};

/**
 * Validate login input
 */
const validateLogin = (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        msg: 'Password is required'
      });
    }

    // Validate email or phone
    if (email) {
      req.body.email = validateEmail(email);
    } else if (phone) {
      req.body.phone = validatePhone(phone);
    } else {
      return res.status(400).json({
        success: false,
        msg: 'Email or phone number is required'
      });
    }

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        msg: error.message,
        field: error.field
      });
    }
    next(error);
  }
};

/**
 * Validate product creation input
 */
const validateProductCreation = (req, res, next) => {
  try {
    const { name, description, price, category, quantity } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category || !quantity) {
      return res.status(400).json({
        success: false,
        msg: 'Missing required fields: name, description, price, category, quantity'
      });
    }

    // Validate and sanitize each field
    req.body.name = validateProductName(name);
    req.body.description = validateDescription(description);
    req.body.price = validatePrice(price);
    req.body.quantity = validateQuantity(quantity);
    req.body.category = validateCategory(category);

    // Optional fields
    if (req.body.brand) {
      req.body.brand = sanitizeString(req.body.brand, { maxLength: 100 });
    }
    if (req.body.deliveryTime) {
      req.body.deliveryTime = sanitizeString(req.body.deliveryTime, { maxLength: 100 });
    }
    if (req.body.countryOfOrigin) {
      req.body.countryOfOrigin = sanitizeString(req.body.countryOfOrigin, { maxLength: 100 });
    }

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        msg: error.message,
        field: error.field
      });
    }
    next(error);
  }
};

/**
 * Validate order creation input
 */
const validateOrderCreation = (req, res, next) => {
  try {
    const { shippingAddress, cartItems } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        msg: 'Shipping address is required'
      });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        msg: 'Cart items are required'
      });
    }

    // Validate shipping address
    req.body.shippingAddress = validateAddress(shippingAddress);

    // Validate cart items
    req.body.cartItems = cartItems.map(item => {
      if (!item._id || !item.cartQuantity) {
        throw new ValidationError('Invalid cart item format', 'cartItems');
      }
      return {
        _id: validateObjectId(item._id, 'product'),
        cartQuantity: validateQuantity(item.cartQuantity)
      };
    });

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        msg: error.message,
        field: error.field
      });
    }
    next(error);
  }
};

/**
 * Validate review creation input
 */
const validateReviewCreation = (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        msg: 'Missing required fields: productId, rating, comment'
      });
    }

    // Validate product ID
    req.body.productId = validateObjectId(productId, 'productId');

    // Validate rating
    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        msg: 'Rating must be between 1 and 5',
        field: 'rating'
      });
    }
    req.body.rating = numRating;

    // Validate comment
    req.body.comment = validateDescription(comment, { minLength: 10, maxLength: 1000 });

    // Optional title
    if (req.body.title) {
      req.body.title = sanitizeString(req.body.title, { maxLength: 100 });
    }

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        msg: error.message,
        field: error.field
      });
    }
    next(error);
  }
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateProductCreation,
  validateOrderCreation,
  validateReviewCreation
};