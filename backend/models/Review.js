// In backend/models/Review.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      // Optional: link to the order if available
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [1000, 'Review cannot exceed 1000 characters']
    },
    verifiedPurchase: {
      type: Boolean,
      default: false // Set to true if user has purchased the product
    },
    helpful: {
      type: Number,
      default: 0 // Count of helpful votes
    },
    isApproved: {
      type: Boolean,
      default: true // Admin can moderate reviews
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt automatically
  }
);

// Prevent duplicate reviews from same user for same product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Index for common queries
ReviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });
ReviewSchema.index({ user: 1, createdAt: -1 });
ReviewSchema.index({ rating: 1 });

module.exports = mongoose.model('Review', ReviewSchema);

