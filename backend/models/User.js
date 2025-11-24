// In backend/models/User.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  phone: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allows multiple null values
    trim: true,
    match: [/^(\+263|0)[0-9]{9}$/, 'Please provide a valid Zimbabwean phone number']
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // --- ADD THESE NEW FIELDS ---
  isSeller: {
    type: Boolean,
    default: false
  },
  isVerified: { // For admin to approve seller accounts
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'seller', 'admin'],
    default: 'user'
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: {
    type: String
  },
  sellerDetails: {
    businessName: {
      type: String,
      trim: true
    },
    sellerType: {
      type: String,
      enum: ['individual', 'business', 'international'] // From your doc [cite: 3]
    },
    verificationDocument: {
      type: String // We will store the file path here
    }
  },
  // --- END OF NEW FIELDS ---

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);