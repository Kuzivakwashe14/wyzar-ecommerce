// In backend/models/User.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  // Authentication IDs
  clerkId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  kindeId: { // Kept for legacy/migration purposes
    type: String,
    unique: true,
    sparse: true, 
    index: true
  },
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
    required: false, // Not required for Kinde users
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
      type: String // Legacy single document support
    },
    verificationDocuments: [{
      documentType: {
        type: String,
        enum: ['national_id', 'passport', 'business_registration', 'tax_certificate', 'proof_of_address', 'bank_statement', 'other'],
        required: true
      },
      documentPath: {
        type: String,
        required: true
      },
      documentName: {
        type: String
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      rejectionReason: {
        type: String
      }
    }],
    phoneNumber: {
      type: String
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'incomplete'],
      default: 'pending'
    },
    verificationNotes: {
      type: String
    },
    verifiedAt: {
      type: Date
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Blocked users list
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // --- END OF NEW FIELDS ---

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);